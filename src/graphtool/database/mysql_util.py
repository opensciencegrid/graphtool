
import re, time
import logging
import MySQLdb
import traceback
import sys
from threading import Lock, RLock
from graphtool.database.thread_pooler import ThreadPool

log = logging.getLogger("GraphTool.Connection_Manager")

"""
  MySQL logic separators for parentheses block removal
"""
mysql_logic_ops = [" AND "," &&",")AND ",")&&",   # Logical AND
                   " OR "," ||",")OR ",")||",     # Logical OR
                   " NOT "," !",")NOT ",")!",     # Logical NOT
                   " XOR ",")XOR ",                 # Logical Exclusive OR
                   " WHERE ",")WHERE "]             # SQL where Clause

"""
  MySQL logic separators regex escaped
"""
mysql_logic_ops_escaped = [re.escape(op.lower())+"|" for op in mysql_logic_ops]

"""
  MySQL logic separators regex pattern
"""
mysql_ops_and_parenthesis_pattern = "("
for esc_i in mysql_logic_ops_escaped:
  mysql_ops_and_parenthesis_pattern += esc_i
mysql_ops_and_parenthesis_pattern+=re.escape("(")+")"


"""
  Remove characters to the left until it finds a MySQL logic separator
"""
def remove_to_the_left_until_mysql_operator(text):
  text_test = text.lower()
  re_match = re.findall(mysql_ops_and_parenthesis_pattern, text_test.strip())
  if re_match is None or len(re_match) == 0:
    return text_test
  last_found = re_match[-1]
  rem_index = text_test.rindex(last_found)
  return text[:rem_index+len(last_found)]


def replace_parentheses_block_to_the_left(text,left_bracket_pos,replacement=""):
  if text[left_bracket_pos] != ")":
    return text
  index = left_bracket_pos
  open_brackets = 1
  while open_brackets > 0 and index >=0:
    index -= 1
    if text[index] == ")":
      open_brackets += 1
    elif text[index] == "(":
      open_brackets -= 1
  if index < 0:
    return text
  left_hand = text[:index]
  left_hand = remove_to_the_left_until_mysql_operator(left_hand)+replacement
  return left_hand+text[left_bracket_pos+1:]

def rename_params(query,params):
  for pos, param_i in enumerate(params):
    query = re.sub(re.escape(':'+param_i),":-"+str(pos)+"-",query)
  return query

def reverse_rename_params(query,params):
  for pos, param_i in enumerate(params):
    query = re.sub(re.escape(":-"+str(pos)+"-"),':'+param_i,query)
  return query

def reduce_regexp_usage(query,variables):
  query = re.sub('\\s+',' ',query)
  query = rename_params(query,variables.keys())
  
  for index,var_i in enumerate(variables.keys()):
    if variables[var_i] == ".*":
      parentheses_pattern_esc = re.escape(") regexp :-"+str(index)+"-")
      result = re.search(parentheses_pattern_esc, query)
      while result is not None:
        query = re.sub(parentheses_pattern_esc,")",query,1)
        query = replace_parentheses_block_to_the_left(query, result.start(), " true ")
        result = re.search(parentheses_pattern_esc, query)
      query = re.sub("[^\\s\\(]+"+re.escape(" regexp :-"+str(index)+"-"),'true',query)
    elif isinstance(variables[var_i], basestring):
      var_parts = variables[var_i].split('|')
      match = True
      for part_i in var_parts:
        if re.match("^\w+$", part_i) is None:
          match = False
          break
      if match:
        in_clause = " in ("
        for part_i in var_parts:
          in_clause += "'"+part_i+"',"
        in_clause = in_clause[:len(in_clause)-1]+")"
        query = re.sub(re.escape(" regexp :-"+str(index)+"-"), in_clause, query)
  query = reverse_rename_params(query, variables.keys())
  return query

def sql_vars_to_mysql_param_tuple (sql_string, sql_vars ):
  my_sql_statement = reduce_regexp_usage(str(sql_string), sql_vars)
  sql_vars = dict( sql_vars )
  placement_dict = {}
  for var_name in sql_vars.keys():
    var_string = ':' + var_name
    placement = my_sql_statement.find( var_string )
    var_string_len = len(var_string)
    while placement >= 0:
      placement_dict[placement] = var_name
      spaceadd = " "*(var_string_len-2)
      my_sql_statement = my_sql_statement[:placement] + '%s'+spaceadd + my_sql_statement[placement+var_string_len:]
      placement = my_sql_statement.find( var_string )
  places = placement_dict.keys(); places.sort()
  my_sql_param_tuple = ()
  for place in places:
    my_sql_param_tuple += (sql_vars[placement_dict[place]],)
  return my_sql_statement, my_sql_param_tuple

"""
  Class containing the MySQL Query Execution Information
"""
class QueryExecutionInfo(object):
  
  def __init__(self, pooler, sql_statement, sql_vars):
    self.pooler = pooler
    self.connection = None
    self.sql_statement = sql_statement
    self.sql_vars = sql_vars
    self.results = None
    self.exception_info = None
    self.object_id = id(self)

  def execute(self):
    self.runtime = -time.time()
    try:
      self.connection = self.pooler.get_connection()
      if self.connection is None:
        raise Exception("QUERY ID:%s: Error, there is no connection with the database."%(self.object_id,))
      my_sql_statement, my_sql_param_tuple = sql_vars_to_mysql_param_tuple(self.sql_statement, self.sql_vars)
      curs = self.connection.cursor()
      curs.arraysize = 500
      curs.execute( my_sql_statement, my_sql_param_tuple )
      self.results = curs.fetchall()
      curs.close()
      self.pooler.register_unused_connection(self.connection)
    except:
      if curs is not None:
        try:
          curs.close()
          del curs
        except:
          log.debug("QUERY ID:%s: Error while closing cursor after query exception:\n%s" % (self.object_id,traceback.format_exc()))
      if self.connection is not None:
        try:
          self.connection.close()
          del self.connection
        except:
          log.debug("QUERY ID:%s: Error while closing open connection after query exception:\n%s" % (self.object_id,traceback.format_exc()))
      log.error("QUERY ID:%s: Error while executing statement:\nsql:\n%s\nerror:\n%s" % (self.object_id,self.sql_statement,traceback.format_exc()))
      self.exception_info = sys.exc_info()
    self.runtime += time.time()
    log.debug("QUERY ID:%s: Query Run Time = %s"%(self.object_id,self.runtime))

  def timeout(self):
    if self.connection is not None:
      try:
        thread_id = self.connection.thread_id()
        self.pooler.kill_connection(thread_id)
        log.warning("QUERY ID:%s: Connection Killed by timeout:\n%s" % (self.object_id,self.sql_statement))
      except:
        log.error("QUERY ID:%s: Error while killing remote connection with id %s:\n%s" % (self.object_id,thread_id,traceback.format_exc()))

"""
  Thread Pooler for MySQL tasks
"""
class MySQLThreadPooler(ThreadPool):
  
  def __init__(self,host,port,database,user,passwd,size=16):
    ThreadPool.__init__(self, size)
    self.host = host
    self.port = port
    self.database = database
    self.user = user
    self.passwd = passwd
    self.used_connections_lock = Lock()
    self.used_connections = []
    self.kill_connection_lock = RLock()
    self.connection_killer = None

  def test_connection(self,connection):
    timer = -time.time()
    try:
      connection.ping()
    except:
      log.debug("Connection not active:\n%s" % (traceback.format_exc()))
      try:
          connection.close()
          del connection
      except:
        log.debug("Error while closing open connection while checking ping:\n%s" % (traceback.format_exc()))
      timer += time.time()
      log.debug("Connection took %.2f seconds to fail." % (timer))
      return False
    timer += time.time()
    log.debug("Connection took %.2f seconds to pass." % (timer))
    return True

  def get_connection(self):
    connection = None
    self.used_connections_lock.acquire()
    while len(self.used_connections) > 0 and connection is None:
      posible_conn = self.used_connections.pop()
      if self.test_connection(posible_conn):
        connection = posible_conn
    if connection is None:
      try:
        connection = MySQLdb.connect( host=self.host, user=self.user, passwd=self.passwd, db=self.database, port=self.port )
        curs = connection.cursor() 
        curs.execute( "set time_zone='+00:00'" )
        curs.close()
      except:
        log.error("Error while connecting to the database :\n%s" % (traceback.format_exc()))
        connection = None
    self.used_connections_lock.release()
    return connection

  def kill_connection(self,thread_id):
    self.kill_connection_lock.acquire()
    if self.connection_killer is None:
      self.connection_killer = self.get_connection()
    elif not self.test_connection(self.connection_killer):
      self.connection_killer = self.get_connection()
    if self.connection_killer is not None:
      self.connection_killer.kill(thread_id)
    self.kill_connection_lock.release()

  def register_unused_connection(self,connection):
    if connection is not None:
      self.used_connections_lock.acquire()
      self.used_connections.append(connection)
      self.used_connections_lock.release()

  def execute_statement_sync(self, sql_statement, sql_vars={}, timeout=600):
    qex_info = QueryExecutionInfo(self, sql_statement, sql_vars)
    task = self.push_task(qex_info.execute, (), timeout, qex_info.timeout, ())
    task.join()
    results = qex_info.results
    exc_info = qex_info.exception_info
    del qex_info
    if exc_info is not None:
      raise exc_info[0], exc_info[1], exc_info[2]
    return results

# TESTING CODE
if __name__ == "__main__":
  logging.basicConfig(level=logging.DEBUG)
  log = logging.getLogger('')
  pooler = MySQLThreadPooler(host="gr-osg-mysql-reports.opensciencegrid.org", port=3306, database="gratia", user="reader", passwd="reader", size=10)
  for num in range(4):
    try:
      val = pooler.execute_statement_sync("select sleep(1)(")
      log.info( "Results: ----> %s" % val )
    except:
      log.error(traceback.format_exc())
    raise Exception("Exc")
    print num

  pooler.join_all_requests()
  pooler.stop_and_delete()
