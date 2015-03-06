
import sys, time
import logging
import traceback
from threading import Thread, RLock, Lock


log = logging.getLogger("GraphTool.Connection_Manager")

"""
  Represents a thread pool task to be run on a Thread pool
"""
class ThreadPoolTask( Thread ):

    def __init__( self, pooler, task_function, task_args, timeout=-1, timeout_func=None,timeout_func_args=[]):
        Thread.__init__( self )
        self.task_function = task_function
        self.task_args = task_args
        self.pooler = pooler
        self.task_done = False
        self.task_start_time = None
        self.task_return = None
        self.task_exception_info = None
        self.task_timeout = timeout
        self.task_timeout_func = timeout_func
        self.task_timeout_func_args = timeout_func_args
        self.task_timeout_lock = RLock()
        self.daemon = True

    """
      Returns true if the thread already started and
      has been running for more time than the timeout.
      Returns false if the timeout or start time has
      not been registered.
    """
    def is_in_overtime(self):
        if self.task_timeout is not None and self.task_start_time is not None:
            return self.task_timeout > 0 and time.time()-self.task_start_time > self.task_timeout
        return False

    """
      If the thread is in overtime, and there is timeout
      function assigned in self.task_timeout_func 
    """
    def check_for_timeout(self):
        self.task_timeout_lock.acquire()
        if not self.task_done:
            try:
                if self.is_in_overtime() and self.task_timeout_func is not None:
                    self.task_timeout_func(*self.task_timeout_func_args)
                    self.pooler.register_task_termination( self )
                    self.task_done = True
            except:
                log.error("Unexpected error in timeout check for task:\n%s" % (traceback.format_exc()))
        self.task_timeout_lock.release()

    def run( self ):
        self.task_start_time = time.time()
        try:
            self.task_return = self.task_function(*self.task_args)
        except:
            self.task_exception_info = sys.exc_info()
        self.task_timeout_lock.acquire()
        if not self.task_done:
            self.pooler.register_task_termination( self )
            self.task_done = True
        self.task_timeout_lock.release()

    def join(self):
        while self.task_start_time is None:
            try:
                time.sleep(0.3)
            except:
                log.error("Error while joining thread:\n%s"%traceback.format_exc())
        super(ThreadPoolTask,self).join()

"""
  Utility class representing a Timeout Thread that checks the threads that are running for timeouts
"""
class ThreadPoolTimeoutChecker(Thread):

    def __init__(self,pooler):
        Thread.__init__( self )
        if pooler is None:
            raise Exception("The timeout thread needs a reference to the thread pool.")
        self.pooler = pooler
        self.stop = False
        self.daemon = True

    def run(self):
        while not self.stop:
            try:
                for active_thread_i in self.pooler.active_threads:
                    if active_thread_i.is_in_overtime():
                        active_thread_i.check_for_timeout()
                self.pooler.timeout_call()
                time.sleep(1)
            except:
                log.error("Unexpected error in timeout thread checker call:\n%s" % (traceback.format_exc()))

"""
  Utility class representing a Thread Pool to run tasks simultaneously
"""
class ThreadPool( object ):

    def __init__( self, size = 8):
        self.pool_size = size
        self.thread_pool_lock = Lock()
        self.active_threads = []
        self.tasks_queue = []
        self.timeout_checker = ThreadPoolTimeoutChecker(self)
        self.timeout_checker.start()

    def push_task( self, task_function, task_args, timeout=-1, timeout_func=None,timeout_func_args=[]):
        pool_task = ThreadPoolTask( self, task_function, task_args, timeout, timeout_func, timeout_func_args)
        self.thread_pool_lock.acquire()
        if len( self.active_threads ) < self.pool_size:
            self.active_threads.append( pool_task )
            pool_task.start()
        else:
            self.tasks_queue.append( pool_task )
        self.thread_pool_lock.release()
        return pool_task

    def register_task_termination( self, thread_pool_task ):
        self.thread_pool_lock.acquire()
        self.active_threads.remove( thread_pool_task )
        if len( self.active_threads ) < self.pool_size:
            if len( self.tasks_queue ) != 0:
                pool_task = self.tasks_queue.pop(0)
                self.active_threads.append( pool_task )
                pool_task.start()
        self.thread_pool_lock.release()

    def sync_active_thread_count( self ):
        self.thread_pool_lock.acquire()
        count = len( self.active_threads ) + len( self.tasks_queue )
        self.thread_pool_lock.release()
        return count

    def join_all_requests( self ):
        while self.sync_active_thread_count( ) != 0:
            try:
                time.sleep(0.5)
            except:
                log.error("Unexpected error while joining tasks:\n%s" % (traceback.format_exc()))

    def timeout_call(self):
        pass

    def stop_and_delete(self):
        self.join_all_requests()
        self.timeout_checker.stop = True
        del self.timeout_checker
        del self.thread_pool_lock
        del self.active_threads
        del self.tasks_queue
        del self

# TESTING CODE
if __name__ == "__main__":
  logging.basicConfig(level=logging.DEBUG)
  log = logging.getLogger('')
  
  class PoolerTestObject(object):
  
      def __init__(self):
          self.stop = False
  
      def run_until_stop(self):
          init_time = time.time()
          while not self.stop:
              try:
                  time.sleep(0.2)
              except:
                  log.error("Unexpected error in timeout call:\n%s" % (traceback.format_exc()))
                  pass
          run_time = time.time()-init_time
          log.info("Run Time = %s"%run_time)
  
      def stop_this(self):
          self.stop = True
  
  pooler = ThreadPool()
  for num in range(100):
      obj = PoolerTestObject()
      pooler.push_task(obj.run_until_stop, (), 5, obj.stop_this, ())
  pooler.stop_and_delete()

