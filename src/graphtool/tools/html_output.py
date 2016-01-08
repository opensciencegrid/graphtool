'''
Created on Jan 5, 2016
@author: jmorales
'''
import os
print os.path.dirname(os.path.realpath(__file__))
from mako.template import Template
from mako.lookup import TemplateLookup
lookup = TemplateLookup(directories=[os.path.dirname(os.path.realpath(__file__))+'/mako_templates'])



from graphtool.database.query_handler import QueryHandler
from graphtool.tools.common import expand_string, to_timestamp, \
    convert_to_datetime

class HtmlGenerator(QueryHandler):
  
  def get_common_template_data(self):
    common_data = lambda: None
    base_url = ''
    if 'base_url' in self.metadata:
      base_url = self.metadata['base_url']
      if base_url[-1] != '/':
        base_url += '/'
    try:
        static_location = '/static/content'
        static_object = self.globals['static']
        static_location = static_object.metadata.get('base_url','/static')
        static_location += '/content'
    except:
        pass
    common_data.html_title      = "DB Queries"
    common_data.base_url        = base_url
    common_data.static_base_url = static_location
    return common_data
    
  
  def handle_results(self, results, metadata, **kw):
    tmpl = lookup.get_template("index.mako")
    return tmpl.render(salutation="Hello", target="World")

  def handle_list( self, *args, **kw ):
    template_data = self.get_common_template_data()
    template_data.queries = []
    for query_obj in self.objs:
      query_desc = lambda: None
      if 'display_name' in query_obj.__dict__:
        query_desc.name = query_obj.display_name
      else:
        query_desc.name = "Query"
      query_desc.pages = []
      for page in query_obj.commands.keys():
        page_desc = lambda: None
        my_page = self.known_commands[page]
        if 'title' in my_page.__dict__.keys():
          page_desc.title = my_page.title
        else:
          page_desc.title = page
        page_desc.url = template_data.base_url + page
        query_desc.pages.append(page_desc)
      template_data.queries.append(query_desc)
    tmpl = lookup.get_template("query_list.mako")
    return tmpl.render(tmpl_data=template_data)
  

