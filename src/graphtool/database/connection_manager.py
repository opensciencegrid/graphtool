
import os
import re
import time
import logging
import datetime
import threading
import cStringIO
import traceback
import mysql_util

from graphtool.database import MissingDBInfoException
from graphtool.tools.common import to_timestamp
from graphtool.tools.cache import Cache
from graphtool.base.xml_config import XmlConfig
from sys import exc_info

log = logging.getLogger("GraphTool.Connection_Manager")

SQL_QUERY_TIMEOUT_PARAM = "sql_query_timeout"

try:  
    import cx_Oracle
    cx_Oracle.OPT_Threading = 1
    oracle_present = True
    oracle_lock = threading.Lock()
except:
    oracle_present = False
        
try:    
    import MySQLdb
    mysql_present = True
except Exception, e:
    mysql_present = False

try:
    from pysqlite2 import dbapi2 as sqlite
    sqlite_present = True
except Exception, e:
    sqlite_present = False
    try:
        import sqlite3 as sqlite
        sqlite_present = True
    except:
        try:
            import sqlite
            sqlite_present = True
        except:
            pass
  
try:
    # By default, try PyGreSql
    import pgdb as postgres
    postgres.DateTime = datetime.datetime
    postgres.Date = datetime.date
    postgres.TimeDelta = datetime.timedelta
    postgres_present = True
except:
    # Then switch to psycopg
    try:
        import psycopg as postgres
        postgres_present = True
    except:
        try:
            import psycopg2 as postgres
            postgres_present = True
        except:
            postgres_present = False

db_classes = { \
                 'Oracle':'OracleDatabase',
                 'MySQL' :'MySqlDatabase',
                 'sqlite' :'SqliteDatabase',
                 'Postgres' : 'PostgresDatabase'
             }

class ConnectionManager( XmlConfig ):

  def __init__( self, *args, **kw ):
    self.db_info = {}
    self.db_objs = {}
    super( ConnectionManager, self ).__init__( *args, **kw )

  def parse_dom( self ):
    super( ConnectionManager, self ).parse_dom()
    if 'default' not in self.__dict__.keys():
      self.default = None
    for connection in self.dom.getElementsByTagName('connection'):
      self.parse_connection( connection )

  def parse_connection( self, conn_dom ):
    info = {}
    name = conn_dom.getAttribute('name')
    self.parse_attributes( info, conn_dom )
    if 'Interface' not in info.keys():
      raise ValueError( "Interface not specified in Connection Manager XML." )
    self.db_info[ name ] = info
    self.db_objs[ name ] = None

  def get_connection( self, name ):
    if name == None:
      try:
        name = self.default
      except:
        if self.default == None or len(self.default) == 0: raise Exception( "No default connection specified." )
        else: raise Exception( "Could not find connection named %s." % self.default )
    if name not in self.db_objs.keys():
      raise MissingDBInfoException( "Unknown connection name %s" % name )
    if self.db_objs[ name ] == None:
      return self.make_connection( name )
    return self.db_objs[ name ]

  def list_connection_names(self):
      return self.db_objs.keys()

  def make_connection( self, name ):
    info = self.db_info[ name ]
    try:
      dbclass = self.globals[ db_classes[ info['Interface'] ] ]
    except:
      try:
        dbclass = globals()[ db_classes[ info['Interface'] ] ]
      except:
        raise Exception( "Could not find DBConnection class!" )
    my_conn = dbclass( info )
    self.db_objs[ name ] = my_conn
    return my_conn

class DBConnection( Cache ):

  def __init__( self, info ):
    super( DBConnection, self ).__init__( info )
    self.info = info
    self.module = None

  def get_connection( self ):
    raise ValueError( "get_connection not implemented!" )

  def get_cursor( self ):
    raise ValueError( "get_cursor not implemented!" )

  def test_connection( self ):
    raise ValueError( "test_connection not implemented!" )

  def release_connection( self, conn ):
    pass

  def release_cursor( self, conn ):
    pass

  def execute_statement( self, statement, vars={} ):
    hash_str = self.make_hash_str( statement, **vars )
    query_lock = self.check_and_add_progress( hash_str )
    if query_lock:
      query_lock.acquire()
      results = self.check_cache( hash_str )
      query_lock.release()
      return results
    else:
      results =  self.check_cache( hash_str )
      if results:
        self.remove_progress( hash_str )
        return results
      try:
        results = self._execute_statement( statement, vars )
      except Exception, e:
        self.remove_progress( hash_str )
        st = cStringIO.StringIO()
        traceback.print_exc( file=st )
        raise e
      self.add_cache( hash_str, results )
      self.remove_progress( hash_str )
      return results

class OracleDatabase( DBConnection ):

  def __init__( self, *args, **kw ):
    super( OracleDatabase, self ).__init__( *args, **kw )
    if oracle_present:
      self.module = cx_Oracle
    else:
      raise Exception( "Oracle python module did not load correctly." )
    self.lock = threading.Lock()
    self._conn = None

  def test_connection( self ):
    if self._conn == None: return False
    try:
      test = 'select * from dual'
      curs = self._conn.cursor()
      curs.prepare( test )
      curs.execute( test )
      curs.fetchone()
      assert curs.rowcount > 0
      curs.close()
    except:
      return False
    return True

  def make_connection( self ):
    info = self.info
    conn_str = info['AuthDBUsername'] + '/' + info['AuthDBPassword'] + '@' + info['Database']
    self._conn = self.module.connect( conn_str, threaded=True )
    if ('AuthRole' in info.keys()) and ('AuthRolePassword' in info.keys()):
      curs = self._conn.cursor()
      curs.execute( 'set role ' + info['AuthRole'] + ' identified by ' + info['AuthRolePassword'] )
      curs.close()
    return self._conn

  def get_connection( self ):
      oracle_lock.acquire()
      try:
          if self._conn == None:
              return self.make_connection()
          elif self.test_connection():
              return self._conn
          else:
              return self.make_connection()
      finally:
          oracle_lock.release()
      
  def get_cursor( self ):
    self.lock.acquire()
    conn = self.get_connection()
    return conn.cursor()

  def release_connection( self, conn ):
    conn.close()
  
  def release_cursor( self, curs ):
      curs.close()
      self.lock.release()
      del curs

  def _execute_statement( self, statement, vars={} ):
    curs = self.get_cursor()
    #oracle_lock.acquire()
    try:
        st = -time.time()
        #print "About to execute", time.time()
        curs.arraysize = 1000
        curs.prepare( statement )
        #print "Finished prepare", time.time()
        curs.execute( statement, vars )
        #print "Executing", time.time()
        rows = curs.fetchall()
        #print "Fetched", time.time()
    finally:
        #oracle_lock.release()
        self.release_cursor( curs )
    #print "Finished statement execute"
    #print "Total time:", st + time.time()
    return rows

class MySqlDatabase( DBConnection ):

  pool_size = 20

  def __init__( self, *args, **kw ):
    super( MySqlDatabase, self ).__init__( *args, **kw )
    globals()['log'] = logging.getLogger("GraphTool.Connection_Manager")
    log.info("Initializing the MySQL DB handler.")
    if mysql_present:
      self.module = MySQLdb
    else:
      raise Exception( "MySQL python module did not load correctly." )
    host = 'localhost'
    if self.info.has_key('Host'):
      host = self.info['Host']
    port = 3306
    if self.info.has_key('Port'):
      port = int(self.info['Port'])
    database = None
    if self.info.has_key('Database'):
      database = self.info['Database']
    user = None
    if self.info.has_key('AuthDBUsername'):
      user = self.info['AuthDBUsername']
    passwd = None
    if self.info.has_key('AuthDBPassword'):
      passwd = self.info['AuthDBPassword']
    self.pooler = mysql_util.MySQLThreadPooler(host, 
                                               port, 
                                               database, 
                                               user, 
                                               passwd, 
                                               size=MySqlDatabase.pool_size)

  def _execute_statement( self, sql_string, sql_vars):
    timeout = None
    if sql_vars.has_key(SQL_QUERY_TIMEOUT_PARAM):
      timeout = int(sql_vars[SQL_QUERY_TIMEOUT_PARAM])
    results = []
    try:
      if timeout is None:
        results = self.pooler.execute_statement_sync(sql_string, sql_vars)
      else:
        results = self.pooler.execute_statement_sync(sql_string, sql_vars, timeout)
    except Exception, e:
      log.error("Error in MySQL statement execution:\n%s"%(traceback.format_exc()))
      raise e
    return results

class PostgresDatabase( DBConnection ):

  def __init__( self, *args, **kw ):
    super( PostgresDatabase, self ).__init__( *args, **kw )
    if postgres_present:
      self.module = postgres
    else:
      raise Exception( "Postgres python module did not load correctly." )
    self.cursors = {}

  def make_connection( self ):
    kw = {}
    info = self.info
    assignments = {'host':'Host', 'user':'AuthDBUsername',
                   'password':'AuthDBPassword', 'database':'Database',
                   'port':'Port' }
    for key in assignments.keys():
      if assignments[key] in info.keys():
        kw[key] = info[ assignments[key] ]
        if key == 'port':
          kw[key] = int(kw[key])
    conn = self.module.connect( **kw )
    curs = conn.cursor() 
    #curs.execute( "set time zone -6" )
    curs.close() 
    return conn

  def get_connection( self ):
      conn = self.make_connection()
      return conn

  def get_cursor( self ):
    conn = self.get_connection()
    curs = conn.cursor()
    self.cursors[ curs ] = conn
    return curs

  def release_cursor( self, curs ):
    curs.close()
    self.release_connection( self.cursors[ curs ] )
    
  def release_connection( self, conn ):
      conn.close()
      
  def _execute_statement( self, sql_string, sql_vars ):
    my_string = str( sql_string )
    sql_vars = dict( sql_vars )
    placement_dict = {}
    for var_name in sql_vars.keys():
      var_string = ':' + var_name
      placement = my_string.find( var_string )
      var_string_len = len(var_string)
      while placement >= 0:
        placement_dict[placement] = var_name
        my_string = my_string[:placement] + '%s' + my_string[placement+var_string_len:]
        placement = my_string.find( var_string )
    places = placement_dict.keys(); places.sort()
    my_tuple = ()
    for place in places:
      my_tuple += (sql_vars[placement_dict[place]],)
    curs = self.get_cursor()
    try:
      curs.arraysize = 500
      curs.execute( my_string, my_tuple )
      results = curs.fetchall()
    finally:
      self.release_cursor( curs )
    return results


class SqliteDatabase( DBConnection ):

  def __init__( self, *args, **kw ):
    super( SqliteDatabase, self ).__init__( *args, **kw )
    if sqlite_present:
      self.module = sqlite
    else:
      raise Exception( "sqlite python module did not load correctly." )
    self._conn = None

  def make_connection( self ):
    info = self.info
    conn_str = os.path.expandvars(info['DatabaseFile'])
    self._conn = self.module.connect( conn_str )
    def regexp(expr, item):
        return re.search(expr, item) is not None
    self._conn.create_function("regexp", 2, regexp)
    return self._conn

  def test_connection( self ):
    if self._conn == None: return False 
    try:
      test = 'select 1+1'
      curs = self._conn.cursor()
      curs.execute( test )
      curs.fetchall()
      assert curs.rowcount > 0
      curs.close()
    except:
      return False
    return True

  def get_connection( self ):
    if self._conn == None:
      return self.make_connection()
    elif self.test_connection():
      return self._conn
    else:
      return self.make_connection()
      
  def get_cursor( self ):
    conn = self.get_connection()
    return conn.cursor()

  def release_connection( self, conn ): conn.close()
  
  def release_cursor( self, curs ): curs.close()

  def _execute_statement( self, statement, vars={} ):
    curs = self.get_cursor()
    curs.arraysize = 500
    try:
      curs.execute( statement, vars )
      rows = curs.fetchall()
    except Exception, e:
      self.release_cursor( curs )
      raise e
    self.release_cursor( curs )
    return rows
