
import sys, time
from threading import Thread, RLock

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
        self.task_exception = None
        self.task_timeout = timeout
        self.task_timeout_func = timeout_func
        self.task_timeout_func_args = timeout_func_args
        self.task_timeout_lock = RLock()

    def is_in_overtime(self):
        return self.task_timeout > 0 and time.time()-self.task_start_time > self.task_timeout

    def check_for_timeout(self):
        with self.task_timeout_lock:
            if not self.task_done:
              try:
                  if self.is_in_overtime() and self.task_timeout_func is not None:
                      self.task_timeout_func(*self.task_timeout_func_args)
                      self.pooler.register_task_termination( self )
                      self.task_done = True
              except:
                  print "Unexpected error in timeout call:\n%s", sys.exc_info()[0]

    def run( self ):
        self.task_start_time = time.time()
        try:
            self.task_return = self.task_function(*self.task_args)
        except Exception, e:
            self.task_exception = e
        with self.task_timeout_lock:
            if not self.task_done:
                self.pooler.register_task_termination( self )
                self.task_done = True

    def join(self):
        while not self.task_done:
            try:
                time.sleep( 0.1 )
            except:
                print "Unexpected error in join Task:\n%s", sys.exc_info()[0]

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

    def run(self):
        while not self.stop:
            try:
                for active_thread_i in self.pooler.active_threads:
                    if active_thread_i.is_in_overtime():
                        active_thread_i.check_for_timeout()
                time.sleep(0.1)
            except:
                print "Unexpected error in timeout thread checker:\n%s", sys.exc_info()[0]

"""
  Utility class representing a Thread Pool to run tasks simultaneously
"""
class ThreadPool( object ):

    def __init__( self, size = 8):
        self.pool_size = size
        self.thread_pool_lock = RLock()
        self.active_threads = []
        self.tasks_queue = []
        self.timeout_checker = ThreadPoolTimeoutChecker(self)
        self.timeout_checker.start()

    def push_task( self, task_function, task_args, timeout=-1, timeout_func=None,timeout_func_args=[]):
        pool_task = ThreadPoolTask( self, task_function, task_args, timeout, timeout_func, timeout_func_args)
        with self.thread_pool_lock:
            if len( self.active_threads ) < self.pool_size:
                self.active_threads.append( pool_task )
                pool_task.start()
            else:
                self.tasks_queue.append( pool_task )
        return pool_task

    def register_task_termination( self, thread_pool_task ):
        with self.thread_pool_lock:
            self.active_threads.remove( thread_pool_task )
            if len( self.active_threads ) < self.pool_size:
                if len( self.tasks_queue ) != 0:
                    pool_task = self.tasks_queue.pop(0)
                    self.active_threads.append( pool_task )
                    pool_task.start()

    def sync_active_thread_count( self ):
        with self.thread_pool_lock:
            count = len( self.active_threads )
        return count

    def join_all_requests( self ):
        while self.sync_active_thread_count( ) != 0:
            try:
                time.sleep( 0.1 )
            except:
                self.log_error("Unexpected error in join all Task:", sys.exc_info()[0])

    def stop_and_delete(self):
        self.join_all_requests()
        self.timeout_checker.stop = True
        del self.timeout_checker
        del self.thread_pool_lock
        del self.active_threads
        del self.tasks_queue
        del self

class PoolerTestObject(object):

    def __init__(self):
        self.stop = False

    def run_until_stop(self):
        init_time = time.time()
        while not self.stop:
            try:
                time.sleep(0.2)
            except:
                pass
        run_time = time.time()-init_time
        print "Run Time = %s"%run_time

    def stop_this(self):
        self.stop = True

pooler = ThreadPool()
for num in range(100):
    obj = PoolerTestObject()
    pooler.push_task(obj.run_until_stop, (), 5, obj.stop_this, ())
pooler.stop_and_delete()