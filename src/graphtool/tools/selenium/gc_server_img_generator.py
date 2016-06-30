'''
Created on Jun 17, 2016

@author: jmorales
'''

from selenium import webdriver
from selenium.webdriver.common.by import By
import tempfile
import os.path as path
import cherrypy
import traceback

from graphtool.database.query_handler import QueryHandler

    
class SeleniumHtmlPNGGenerator(QueryHandler):
  
  def __init__( self, *args, **kw ):
    super( SeleniumHtmlPNGGenerator, self ).__init__( *args, **kw )
    for query in self.objs:
        query.metadata['html_png_generator'] = self
    for query in self.known_commands.values():
        query.metadata['html_png_generator'] = self
        
  def get_arg_list(self,metadata):
    arglist = ""
    kw = metadata.get('given_kw',{})
    kw["no_html_frame"] = "y"
    for key, item in kw.items():
      arglist += str(key) + '=' + str(item) + '&'
    return arglist
  
  def get_html_url(self,metadata):
    base_url = None
    html_gen   = metadata.get('html_generator',None)
    if html_gen is None:
      return None
    if html_gen and 'base_url' in html_gen.metadata:
        base_url = html_gen.metadata['base_url']
    return base_url + '/' + metadata.get('name','') + '?'+self.get_arg_list(metadata)
  
  def get_google_chart_as_png (self,url):
    file_tmp    = None
    browser     = None
    try:
      file_tmp = tempfile.NamedTemporaryFile(mode="r+", suffix=".png",prefix="graphtool_gc_")
      abs_path = path.abspath(file_tmp.name)
      browser = webdriver.Firefox()
      browser.get(url)
      try:
        elem    = browser.find_element(By.ID, "gc_full_chart_div")
        browser.set_window_size(elem.size["width"], elem.size["height"])
      except:
        pass
      browser.save_screenshot(abs_path)
      browser.quit()
      return file_tmp
    except Exception as inst :
      if file_tmp is not None:
        try:
          file_tmp.close()
        except:
          pass
      if browser is not None:
        try:
          browser.quit()
        except:
          pass
      raise inst
    return None
        
  def handle_results(self, results, metadata, **kw):
    file_tmp = None
    try:
      url_suffix = self.get_html_url(metadata)
      port = cherrypy.config.get("server.socket_port",80)
      full_url = "http://localhost:%s%s"%(port,url_suffix)
      print "---------------------------\n%s\n-------------------"%full_url
      file_tmp = self.get_google_chart_as_png(full_url)
      return cherrypy.lib.static.serve_file(file_tmp.name)
    finally:
      if file_tmp is not None:
        try:
          file_tmp.close()
        except:
          pass
      

  def handle_list( self, *args, **kw ):
    return "Invalid PNG path"
