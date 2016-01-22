'''
Created on Jan 5, 2016
@author: jmorales
'''
import os
from graphtool.database.queries import SqlQueries, SqlQuery
print os.path.dirname(os.path.realpath(__file__))
import json
import numbers, datetime
from matplotlib_2_google_charts import mpl_2_gc
from graphtool.database.query_handler import CustomDecimalDateObjectJSONEncoder
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
  
  def get_table_val(self,val):
    if isinstance(val, numbers.Number) or isinstance(val, datetime.datetime):
      return val
    else:
      return str(val)
  
  def cumulate_table(self,current_level,cumulated_row=[],first_level=True):
    cum_row_copy = cumulated_row[:]
    if isinstance(current_level,dict):
      cum_table = []
      for key_i,val_i in current_level.iteritems():
        recurse_result = self.cumulate_table(val_i, cumulated_row=(cum_row_copy[:]+[key_i]), first_level=False)
        if isinstance(val_i,dict):
          cum_table += recurse_result
        else:
          cum_table.append(recurse_result)
      return cum_table
          
    elif isinstance(current_level,list) or isinstance(current_level,tuple):
      if first_level:
        cum_table = []
        for val_i in current_level:
          cum_table.append(self.cumulate_table(val_i, cumulated_row=[], first_level=False))
        return cum_table
      else:
        for val_i in current_level:
          cum_row_copy.append(self.get_table_val(val_i))
        return cum_row_copy
    else:
      cum_row_copy.append(self.get_table_val(current_level))
      return cum_row_copy
  
  def get_queries_description(self,base_url):
    queries = []
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
        page_desc.url = base_url + page
        query_desc.pages.append(page_desc)
      queries.append(query_desc)
    return queries
  
  def get_arg_list(self,metadata):
    arglist = ""
    kw = metadata.get('given_kw',{})
    sql_vars = metadata.get('sql_vars',{})
    for key, item in kw.items():
      if sql_vars[key] != item:
        arglist += str(key) + '=' + str(item) + '&'
    return arglist
  
  def get_matplotlib_url(self,metadata):
    base_url = None
    graphs   = metadata.get('grapher',None)
    if graphs is None:
      return None
    if graphs and 'base_url' in graphs.metadata:
        base_url = graphs.metadata['base_url']
    return base_url + '/' + metadata.get('name','') + '?'+self.get_arg_list(metadata)

  def get_csv_url(self,metadata):
    base_url = None
    graphs   = metadata.get('csv_generator',None)
    if graphs is None:
      return None
    if graphs and 'base_url' in graphs.metadata:
        base_url = graphs.metadata['base_url']
    return base_url + '/' + metadata.get('name','') + '?'+self.get_arg_list(metadata)
  
  def set_gc_params(self,template_data,metadata):
    graph_type = metadata.get('graph_type',False)
    graph_kind = metadata.get('graph_kind',False)
    js_chart_setup = metadata.get('js_chart_setup',False)
    
    metadata['translate_mp_2_gc'] = False
    if not graph_kind and mpl_2_gc.has_key(graph_type):
      maped_gc = mpl_2_gc[graph_type]
      graph_type = maped_gc['gc_type']
      js_chart_setup = maped_gc['gc_js_setup']
      graph_kind = 'google_charts'
    
    if graph_kind == 'google_charts':
      template_data.gc_script = graph_type
      template_data.js_chart_setup = js_chart_setup
  
  def handle_results(self, results, metadata, **kw):
    template_data                       = self.get_common_template_data()
    results_table                       = self.cumulate_table(results)
    template_data.params                = metadata.get('given_kw',{})
    template_data.params_defaults       = json.dumps(metadata.get('sql_vars',{}),separators=(',',':'),cls=CustomDecimalDateObjectJSONEncoder)
    template_data.html_title            = expand_string( metadata.get('title',''), metadata.get('sql_vars','') )
    template_data.json_queries_desc     = json.dumps(self.get_queries_description(template_data.base_url),separators=(',',':'),cls=CustomDecimalDateObjectJSONEncoder)
    template_data.json_results_table    = json.dumps(results_table,separators=(',',':'),cls=CustomDecimalDateObjectJSONEncoder)
    template_data.json_metadata         = json.dumps(metadata,separators=(',',':'),indent=2,cls=CustomDecimalDateObjectJSONEncoder)
    template_data.matplotlib_image_url  = self.get_matplotlib_url(metadata)
    template_data.csv_url               = self.get_csv_url(metadata)
    template_data.sql_string            = str(metadata.get('sql',''))
    self.set_gc_params(template_data, metadata)
    tmpl                                = lookup.get_template("query.mako")
    return tmpl.render(tmpl_data=template_data)

  def handle_list( self, *args, **kw ):
    template_data = self.get_common_template_data()
    template_data.queries = self.get_queries_description(template_data.base_url)
    tmpl = lookup.get_template("query_list.mako")
    return tmpl.render(tmpl_data=template_data)
  
