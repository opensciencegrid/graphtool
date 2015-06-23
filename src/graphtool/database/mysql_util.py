
import re, time
import logging
import MySQLdb
import traceback
import sys
from graphtool.database import NoConnectionWithDBException, QueryTimeoutException
from threading import Lock, RLock
from graphtool.database.thread_pooler import ThreadPool
from _mysql import result

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

"""
  Remove a parentheses block to the left of the right parentheses specified
  including inner parentheses blocks
"""
def replace_parentheses_block_to_the_left(text,right_bracket_pos,replacement=""):
  if text[right_bracket_pos] != ")":
    return text
  index = right_bracket_pos
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
  return left_hand+text[right_bracket_pos+1:]

"""
  Rename the query parameters to numbers
"""
def rename_params(query,params):
  for pos, param_i in enumerate(params):
    query = re.sub(re.escape(':'+param_i),":-"+str(pos)+"-",query)
  return query

"""
  Rename the query parameters back from the numbers to the names
"""
def reverse_rename_params(query,params):
  for pos, param_i in enumerate(params):
    query = re.sub(re.escape(":-"+str(pos)+"-"),':'+param_i,query)
  return query

"""
  Reduce the regexp usage 
  1st case:
    Replace :any_var regexp '.*' by true
  2nd case:
    Replace :any_var regexp 'word1'
    wirth :any_var in ('word1')
    or
    Replace :any_var regexp 'word1|word2|word3'
    wirth :any_var in ('word1','word2','word3')
"""
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
  log.debug("Reduce regexp query: %s"%query)
  return query

"""
  Transforms the SQL-metadata vars to msyql_param_tuple
"""
def sql_vars_to_mysql_param_tuple (sql_string, sql_vars ):
  my_sql_statement = sql_string
  sql_vars = dict( sql_vars )
  placement_dict = {}
  for var_name in sql_vars.keys():
    var_string = ':' + var_name
    reg_obj = re.compile(var_string+r"[\s()!=&|]")
    placement = reg_obj.search(my_sql_statement)
    if placement is None:
      placement = -1
    else:
      placement = placement.start()
    var_string_len = len(var_string)
    while placement >= 0:
      placement_dict[placement] = var_name
      spaceadd = " "*(var_string_len-2)
      my_sql_statement = my_sql_statement[:placement] + '%s'+spaceadd + my_sql_statement[placement+var_string_len:]
      placement = reg_obj.search(my_sql_statement)
      if placement is None:
        placement = -1
      else:
        placement = placement.start()
  places = placement_dict.keys(); places.sort()
  my_sql_param_tuple = ()
  for place in places:
    my_sql_param_tuple += (sql_vars[placement_dict[place]],)
  return my_sql_statement, my_sql_param_tuple

"""
  Logs the connection information
"""
def log_connection_info(connection,message):
  thread_id = "UNKNOWN"
  try:
    thread_id = connection.thread_id()
  except:
    pass
  log.debug("Connection (Thread id:%s) : %s"%(thread_id,message))

"""
  Closes a MySQL connection
"""
def close_connection(connection):
  if connection is not None:
    try:
      log_connection_info(connection, "Attempting to close connection.")
      connection.close()
      log_connection_info(connection, "Connection closed correctly.")
    except:
      log_connection_info(connection, "Error while closing open connection while checking ping:\n%s" % (traceback.format_exc()))

"""
  Tests if  a MySQL connection is alive
"""
def test_connection(connection):
  if connection is None:
    return False
  timer = -time.time()
  try:      
    log_connection_info(connection, "Attempting to test if connection is alive.")
    connection.ping()
    timer += time.time()
    log_connection_info(connection, "Connection took %.2f seconds to pass." % (timer))
    return True
  except:
    timer += time.time()
    log_connection_info(connection, "Connection took %.2f seconds to fail." % (timer))
    log_connection_info(connection, "Connection not active:\n%s" % (traceback.format_exc()))
    close_connection(connection)
    log_connection_info(connection, "Deleting connection object from memory")
    del connection
    return False

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
    self.is_timeout_ex = False
    self.is_timeout_ex_lock = RLock()
    self.curs = None

  """
    Executes the Query on the DB
  """
  def execute(self):
    try:
      t_ini = time.time()
      self.connection = self.pooler.get_connection()
      if self.connection is None:
        raise NoConnectionWithDBException("QUERY ID:%s: Error, there is no connection with the database."%(self.object_id,))
      log_connection_info(self.connection, "Attempting to execute query.")
      my_sql_statement, my_sql_param_tuple = sql_vars_to_mysql_param_tuple(self.sql_statement, self.sql_vars)
      self.curs = self.connection.cursor()
      self.curs.arraysize = 500
      self.curs.execute( my_sql_statement, my_sql_param_tuple )
      self.results = self.curs.fetchall()
      self.curs.close()
      timeout_ex = None
      #This segment is required because killing sleeping queries will kept the cursor open without an exception
      self.is_timeout_ex_lock.acquire()
      if self.is_timeout_ex:
        timeout_ex = QueryTimeoutException("Query execution timed out after %s seconds."%(time.time()-t_ini))
      self.is_timeout_ex_lock.release()
      if timeout_ex is not None:
        raise timeout_ex
      log_connection_info(self.connection, "Query execution completed successfully after %s seconds."%(time.time()-t_ini))
      self.pooler.register_unused_connection(self.connection)
    except:
      if self.curs is not None:
        try:
          self.curs.close()
          del self.curs
        except:
          log.debug("QUERY ID:%s: Error while closing cursor after query exception:\n%s" % (self.object_id,traceback.format_exc()))
      close_connection(self.connection)
      log.error("QUERY ID:%s: Error while executing statement:\nsql:\n%s\nerror:\n%s" % (self.object_id,self.sql_statement,traceback.format_exc()))
      self.exception_info = sys.exc_info()
      # This sections is rquiered when OperationalError: (1317, 'Query execution was interrupted') is raised by self.curs.execute()
      timeout_ex = None
      self.is_timeout_ex_lock.acquire()
      if self.is_timeout_ex:
        timeout_ex = QueryTimeoutException("Query execution timed out after %s seconds."%(time.time()-t_ini))
      self.is_timeout_ex_lock.release()
      if timeout_ex is not None:
        try:
          raise timeout_ex
        except:
          self.exception_info = sys.exc_info()

  """
    timeout function for the query execution
    will kill the MySQL connection
  """
  def timeout(self):
    if self.connection is not None and not self.is_timeout_ex:
      self.is_timeout_ex_lock.acquire()
      try:
        thread_id = self.connection.thread_id()
        self.pooler.kill_connection(thread_id)
        self.is_timeout_ex = True
        log.warning("QUERY ID:%s: Connection Killed by timeout:\n%s" % (self.object_id,self.sql_statement))
      except:
        log.error("QUERY ID:%s: Error while killing remote connection with id %s:\n%s" % (self.object_id,thread_id,traceback.format_exc()))
      self.is_timeout_ex_lock.release()

"""
  Thread Pooler for MySQL tasks
"""
class MySQLThreadPooler(ThreadPool):
  
  def __init__(self,host,port,database,user,passwd,size=16):
    self.host = host
    self.port = port
    self.database = database
    self.user = user
    self.passwd = passwd
    self.used_connections_lock = Lock()
    self.used_connections = []
    self.kill_connection_lock = RLock()
    self.connection_killer = None
    self.last_used_connections_wipe_time = time.time()
    ThreadPool.__init__(self, size)
    log.debug("MySQL Pooler created with size: %s"%size)

  """
    Obtains a MySQL connection
  """
  def get_connection(self):
    self.last_used_connections_wipe_time = time.time()
    connection = None
    self.used_connections_lock.acquire()
    while len(self.used_connections) > 0 and connection is None:
      log.debug("Checking used connections to reuse. Used connection queue size:%s"%(len(self.used_connections)))
      posible_conn = self.used_connections.pop(0)
      if test_connection(posible_conn):
        connection = posible_conn
        log.debug("Found an active connection.")
    self.used_connections_lock.release()
    if connection is None:
      log.debug("No used connections found for reuse, attempting new connection.")
      try:
        connection = MySQLdb.connect( host=self.host, user=self.user, passwd=self.passwd, db=self.database, port=self.port )
        curs = connection.cursor() 
        curs.execute( "set time_zone='+00:00'" )
        curs.close()
        log_connection_info(connection, "Connection created.")
      except:
        close_connection(connection)
        log.error("Error while connecting to the database :\n%s" % (traceback.format_exc()))
        connection = None
    return connection

  """
    Kills the MySQL connection with the specified thread id
  """
  def kill_connection(self,thread_id):
    self.kill_connection_lock.acquire()
    try:
      if self.connection_killer is None:
        self.connection_killer = self.get_connection()
      elif not test_connection(self.connection_killer):
        self.connection_killer = self.get_connection()
      if self.connection_killer is not None:
        self.connection_killer.kill(thread_id)
    except:
      log.error("Unexpected error trying to kill connection %s:\n%s"%(thread_id,traceback.format_exc()))
    self.kill_connection_lock.release()

  """
    Register a connection that is been freed to be reused
  """
  def register_unused_connection(self,connection):
    if connection is not None:
      
      if test_connection(connection):
        log_connection_info(connection, "Storing used connection for reuse")
        self.used_connections_lock.acquire()
        self.used_connections.append(connection)
        self.used_connections_lock.release()
        log.debug("Used connections queue size: %s"%len(self.used_connections))

  """
    Function that is called when the timeout daemon check the thread 
  """
  def timeout_call(self):
    if time.time()-self.last_used_connections_wipe_time > 60:
      self.used_connections_lock.acquire()
      if len(self.used_connections) > 0:
        log.debug("Attempting to wipe %s used connections that are not being used."%len(self.used_connections))
        while len(self.used_connections) > 0:
          connection = self.used_connections.pop(0)
          close_connection(connection)
      self.used_connections_lock.release()
      self.last_used_connections_wipe_time = time.time()

  def execute_statement_sync(self, sql_statement, sql_vars={}, timeout=600):
    qex_info = QueryExecutionInfo(self, sql_statement, sql_vars)
    task = self.push_task(qex_info.execute, (), timeout, qex_info.timeout, ())
    task.join()
    results = qex_info.results
    exc_info = qex_info.exception_info
    del qex_info
    del task
    if exc_info is not None:
      raise exc_info[0], exc_info[1], exc_info[2]
    return results

# TESTING CODE
if __name__ == "__main__":
  logging.basicConfig(level=logging.DEBUG)
  log = logging.getLogger('')
  pooler = MySQLThreadPooler(host="gr-osg-mysql-reports.opensciencegrid.org", port=3306, database="gratia", user="reader", passwd="reader", size=1)
  sim_pool = ThreadPool(20)
  
  def func_test():
    for num in range(10):
      log.info("Pushing task %s"%num)
      try:
        val = pooler.execute_statement_sync("select sleep(10)", timeout=1)
        log.info( "Results: ----> %s" % val )
      except:
        log.error(traceback.format_exc())
  for num in range(20):
    sim_pool.push_task(func_test, ())
    print num

  sim_pool.join_all_requests()
  sim_pool.stop_and_delete()
  pooler.join_all_requests()
  pooler.stop_and_delete()
