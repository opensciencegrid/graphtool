
import threading, sys, cStringIO, traceback, re
from graphtool.base import GraphToolInfo
from graphtool.base.xml_config import XmlConfig
import logging

class NoConnectionWithDBException(Exception):
  plot_desc_text = "Could not connect with the Database."

class QueryTimeoutException(Exception):
  plot_desc_text = "The query execution timed out."

class MissingDBInfoException(Exception):
  plot_desc_text = "The Database connection information is not defined in the XML."

log = logging.getLogger("GraphTool.Connection_Manager")

try:
  import cx_Oracle
  cx_Oracle.OPT_Threading = 1
  oracle_present = True
except:
  oracle_present = False

try:
  import mysql.connector
  mysql_present = True
  from mysql.connector import errorcode
except Exception, e:
  mysql_present = False

class DatabaseInfo( GraphToolInfo ):

  def __init__( self, *args, **kw ):
    super( DatabaseInfo, self ).__init__( *args, **kw )
    self.consume_keyword( 'conn' )
    self.consume_keyword( 'db' ) 
    self.getDbParams()
    self.conn = None
    
  def __getattr__( self, attr ):
    if attr == 'conn' and self.conn == None:
      my_conn = self.getConnection()
      self.conn = my_conn
      return my_conn
    elif attr == 'conn':
      return self.conn
    if attr == 'orcl':
      self.conn = self.restoreConnection( self.__getattr__( 'conn' ) )
      return self.conn
    else:
      return super( DatabaseInfo, self ).__getattr__( attr )

  def testConnection( self, conn ):
    try:
      if self.info['Interface'] == 'Oracle':
        test = 'select * from dual'
        curs = conn.cursor()
        curs.prepare( test )
        curs.execute( test )
        curs.fetchone()
        assert curs.rowcount > 0
        curs.close()
      elif self.info['Interface'] == 'MySQL':
        mysql_lock.acquire()
        test = 'select 1+1'
        curs = conn.cursor()
        curs.execute( test )
        curs.fetchall()
        assert curs.rowcount > 0
        curs.close()
        mysql_lock.release()
    except Exception, e:
      return False
    return True

  def restoreConnection( self, conn ):
    if not self.testConnection( conn ):
      self.killConnection( conn )
      conn = self.getConnection()
    return conn

  def killConnection( self, conn ):
    try:
      conn.rollback()
      conn.close()
    except:
      pass

  def getDbParams( self, *args ):
    if len(args) == 0:
      filename, section = self.db.split(':')
    elif len(args) == 1:
      filename, section = args[0].split(':')
    elif len(args) == 2:
      filename, section = args
    else:
      log.critical("Wrong number of arguments to getDbParams (contact developers!)")
      sys.exit(-1)
    try:
      file = open( filename, 'r' )
    except:
      log.critical( "Unable to open specified DBParam file %s" % filename)
      log.critical( "Check the path and the permissions.")
      sys.exit(-1)
    rlines = file.readlines()
    info = {}
    start_section = False
    for line in rlines:
      if len(line.lstrip()) == 0 or line.lstrip()[0] == '#':
        continue
      tmp = line.split(); tmp[1] = tmp[1].strip()
      if tmp[0] == "Section" and tmp[1] == section:
        start_section = True
      if tmp[0] == "Section" and tmp[1] != section and start_section:
        break
      if start_section:
        info[tmp[0]] = tmp[1]
    if start_section == False:
      log.critical( "Could not find section named: %s" % section )
      log.critical( "Check capitalization, contents of file.  Failing!" )
      sys.exit(-1)
    self.info = info
    return info

  def getConnection( self, *args ):
    if len(args) == 0:
      info = self.info
    else:
      info = args[0]
      self.info = info
    log.debug( "getConnection: info: %s" % info )

    if info['Interface'] == 'Oracle':
      if oracle_present == False:
        #condition: info['Interface'] == 'Oracle' and oracle_present == False:
        raise Exception( "Could not import Oracle DB module.  Abort!" )
      else:
        cnstring = info['AuthDBUsername'] + '/' + info['AuthDBPassword'] + \
            '@' + info['Database']
        log.info( "getConnection: cnstring: %s " % cnstring )
        try:
          conn = cx_Oracle.connect(cnstring)
          curs = conn.cursor()
          curs.execute('set role ' + info['AuthRole'] + ' identified by ' +
                       info['AuthRolePassword'])
          curs.close()
        except:
          raise Exception( "FAILURE: cx_Oracle.connect(%s)" % cnstring )
        else:
          log.info( "SUCCESS: cx_Oracle.connect(%s)" % cnstring)

    else:   #else info['Interface'] == 'MySQL':
      if mysql_present == False:
        #condition: info['Interface'] == 'MySQL' and mysql_present == False:
        raise Exception( "Could not import mysql.connector DB module.  Abort!" )
      else:
        kw = {}
        assignments = {'host':'Host', 'user':'AuthDBUsername',
                       'passwd':'AuthDBPassword', 'db':'Database',
                       'port':'Port' }
        for key in assignments.keys():
          if assignments[key] in info.keys():
            kw[key] = info[ assignments[key] ]
            if key == 'port':
              kw[key] = int(kw[key])
        log.info( "getConnection: kw[key]: %s" % kw)
        try:
          conn = mysql.connector.connect( **kw)
        # expanded error checking - requested GratiaWeb-48
        except mysql.connector.Error, e:
          log.error( "Error code: %s"% e.errono)
          log.error(  "SQLSTATE value: %s"% e.sqlstate)
          log.error(  "Error message: %s"% e.msg)
          log.error(  "Error: %s"% e)
          s = str(e)
          log.error(  "Error: %s"% s)
        else:
          log.info( "SUCCESS: mysql.connector.connect(%s)" % assignments)
    return conn

class DatabaseInfoV2( XmlConfig ):

  def __init__( self, *args, **kw ):
    self.conn_manager = None
    super( DatabaseInfoV2, self ).__init__( *args, **kw )

  def parse_dom( self, *args, **kw ):
    super( DatabaseInfoV2, self ).parse_dom( *args, **kw )
    if 'connection_manager' in self.__dict__.keys():
      conn_man_name = self.connection_manager
    else:
      raise ValueError( "Connection Manager name not passed." )
    classes = self.find_classes( must_be_executable=False )
    if conn_man_name not in classes.keys():
      raise Exception( "Cannot find connection manager named %s" % conn_man_name )
    self.conn_manager = classes[ conn_man_name ]

  def execute_sql( self, sql_string, sql_var, conn=None, **kw ):
    # get the connection by name
    conn = self.conn_manager.get_connection( conn )
    # Mysql reduce regexp call for mysql
    import mysql_util
    import connection_manager
    if isinstance(conn, connection_manager.MySqlDatabase):
        sql_string = mysql_util.reduce_regexp_usage(str(sql_string), sql_var)
    # Dynamic SQL modifier function call
    sql_dynamic_modif_func_mod_name = None
    if kw.has_key('sql_dynamic_modif_func_mod_name'):
      sql_dynamic_modif_func_mod_name = kw['sql_dynamic_modif_func_mod_name']
      exec_string = 'import %s'%sql_dynamic_modif_func_mod_name
      exec exec_string
    sql_dynamic_modif_func = None
    if kw.has_key('sql_dynamic_modif_func'):
      mod_func = None
      sql_dynamic_modif_func = kw['sql_dynamic_modif_func']
      exec_string = "mod_func = "
      if sql_dynamic_modif_func_mod_name is not None:
        exec_string += sql_dynamic_modif_func_mod_name+"."
      exec_string += "%s"%sql_dynamic_modif_func
      exec exec_string
      sql_string = mod_func(sql_string,conn,**kw)
    # Executer the SQL call
    try:
      results = conn.execute_statement( sql_string, sql_var )
    except NoConnectionWithDBException, e:
      raise e
    except MissingDBInfoException, e:
      raise e
    except QueryTimeoutException, e:
      raise e
    except Exception, e:
      if len(e.args) == 1:
        msg = str(e.args[0])
        m = re.search('Unknown database \'(.*)\'', msg)
        if m:
          db = m.groups(0)
          raise Exception("Unknown database: %s" % db)
      out = cStringIO.StringIO()
      print >> out, "\nUnable to successfully query database, exception follows:\n"
      print >> out, e, "\n"
      print >> out, "Used sql:\n%s" % sql_string
      print >> out, "Used vars:", sql_var, "\n"
      traceback.print_exc( file=out )
      raise Exception( out.getvalue() )

    return results
