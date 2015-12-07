
graphtool.GC_QUALITY_MAP = function(){
  graphtool.GC_COMMON.call(this)
  //-------------------------------------------------------------------
  // Quality Map Variables 
  //-------------------------------------------------------------------
  
  this.data_gc      = null;
  this.min_rgb      = graphtool.GC_COMMON.hexToRgb("#a50026");
  this.mid_rgb      = graphtool.GC_COMMON.hexToRgb("#fefebe");
  this.max_rgb      = graphtool.GC_COMMON.hexToRgb("#056b3b");
  this.color_list   = [];
};

graphtool.GC_QUALITY_MAP.prototype = graphtool.GC_COMMON.prototype
graphtool.GC_QUALITY_MAP.prototype.constructor = graphtool.GC_QUALITY_MAP

graphtool.GC_QUALITY_MAP.prototype.get_chart_name =  function(){
  return "GC_QUALITY_MAP"
}

//-------------------------------------------------------------------
// Data Transformation functions 
//-------------------------------------------------------------------

graphtool.GC_QUALITY_MAP.prototype.calc_draw_table = function() {
  
}

graphtool.GC_QUALITY_MAP.prototype.get_legend_labels_and_values = function(){
  return [[],[]];
}

graphtool.GC_QUALITY_MAP.prototype.set_colors = function(){
  this.chart_properties.colors   = this.color_list;
}

//-------------------------------------------------------------------
// UI functions 
//-------------------------------------------------------------------


//-------------------------------------------------------------------
// Charts functions 
//-------------------------------------------------------------------

graphtool.GC_QUALITY_MAP.prototype.get_required_google_pkgs = function() {
  return ["timeline"];
}

graphtool.GC_QUALITY_MAP.prototype.get_object_type = function() {
  return 'Timeline';
}

graphtool.GC_QUALITY_MAP.prototype.load_chart_options = function() {
  this.load_default_options_tabs();
}

graphtool.GC_QUALITY_MAP.prototype.data_initial_setup = function() {
  // To calculate the start-end date segements is better to keep the original timestamp
  this.pivot_results_to_gc_table(['string','number','number','number']);
  this.gc_init_table.sort([{column: 0},{column: 1}]);
  this.data_gc = new google.visualization.DataTable();
  this.data_gc.addColumn({ type: 'string', id: 'Row label' });
  this.data_gc.addColumn({ type: 'string', id: 'Bar label' });
  this.data_gc.addColumn({ type: 'string', role: 'tooltip', p: {html: true} });
  this.data_gc.addColumn({ type: 'date',   id: 'Start' });
  this.data_gc.addColumn({ type: 'date',   id: 'End' });

  this.color_list = []
  this.vals_set   = new Set()
  
  for(var i = 0 ; i < this.gc_init_table.getNumberOfRows() ; i++){
    var group        = this.gc_init_table.getValue(i,0);
    var start        = graphtool.GC_COMMON.from_unix_utc_ts(this.gc_init_table.getValue(i,1));
    var end          = graphtool.GC_COMMON.from_unix_utc_ts((this.gc_init_table.getValue(i,1)+this.span-1));
    var success      = this.gc_init_table.getValue(i,2);
    var fail         = this.gc_init_table.getValue(i,3);
    var percentage   = graphtool.GC_COMMON.format_percentage((success+0.0)/(success+fail+0.0));
    var tooltip_html =  "<b>Success percentage:</b> "+percentage+"%<br>"+
                        "<b>Success:</b> "+success+"<br>"+
                        "<b>Fail:</b> "+fail+"<br>"+
                        "<b>From:</b> "+this.date_time_formatter.formatValue(start)+"<br>"+
                        "<b>To:</b> "+this.date_time_formatter.formatValue(end)+"";
    if(!this.vals_set.has(percentage)){
      var color      = graphtool.GC_COMMON.get_color_for_value(this.min_rgb,this.mid_rgb,this.max_rgb, 0.0,50.0,100.0,percentage);
      this.color_list.push(color);
      this.vals_set.add(percentage)
    }
    
    this.data_gc.addRow([group,percentage,tooltip_html,start, end]);
  }
  this.chart_properties.colors = this.color_list;
  this.chart_properties.timeline = {
    showBarLabels   : false,
    colorByRowLabel : false 
  }
  this.chart_properties.avoidOverlappingGridLines = false;
  this.chart_properties.tooltip = {
    isHtml : true
  }
  $('#title_div').html("<h3>"+this.title+"</h3>");
}

//-------------------------------------------------------------------
// Draw on load
//-------------------------------------------------------------------

quality_map = new graphtool.GC_QUALITY_MAP();
quality_map.load_google_api_and_draw();