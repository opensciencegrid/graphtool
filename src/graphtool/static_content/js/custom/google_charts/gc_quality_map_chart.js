
graphtool.GC_QUALITY_MAP = function(){
  graphtool.GC_COMMON.call(this)
  //-------------------------------------------------------------------
  // Combo Chart Variables 
  //-------------------------------------------------------------------
  
  this.data_gc            = null;
};

graphtool.GC_QUALITY_MAP.prototype = graphtool.GC_COMMON.prototype
graphtool.GC_QUALITY_MAP.prototype.constructor = graphtool.GC_QUALITY_MAP

graphtool.GC_QUALITY_MAP.prototype.get_chart_name =  function(){
  return "GC_QUALITY_MAP"
}

//-------------------------------------------------------------------
// Data Transformation functions 
//-------------------------------------------------------------------

graphtool.GC_QUALITY_MAP.prototype.format_qm = function(){
  //first column is the label
  for(var j = 1 ; j < this.data_gc.getNumberOfColumns() ; j++){  
    this.no_decimal_formatter.format(this.data_gc,j)
  }
}

graphtool.GC_QUALITY_MAP.prototype.calc_draw_table = function(){
  this.format_qm();
  this.set_qm_properties();
}

graphtool.GC_QUALITY_MAP.prototype.get_legend_labels_and_values = function(){
  return [[],[]];
}

graphtool.GC_QUALITY_MAP.prototype.set_qm_properties = function() {
  
}

//-------------------------------------------------------------------
// UI functions 
//-------------------------------------------------------------------


//-------------------------------------------------------------------
// Charts functions 
//-------------------------------------------------------------------

graphtool.GC_QUALITY_MAP.prototype.get_required_google_pkgs = function() {
  return ["corechart"];
}

graphtool.GC_QUALITY_MAP.prototype.get_object_type = function() {
  return 'Table';
}

graphtool.GC_QUALITY_MAP.prototype.load_chart_options = function() {
  this.load_default_options_tabs();
}

graphtool.GC_QUALITY_MAP.prototype.data_initial_setup = function() {
  this.pivot_results_to_gc_table(['string','datetime','number','number']);
  this.data_gc = this.gc_init_table.clone();  
  this.data_gc.addColumn('number','Quality')
  for(var i = 0 ; i < this.data_gc.getNumberOfRows() ; i++){
    var success = this.data_gc.getValue(i,2);
    var fail    = this.data_gc.getValue(i,3);
    this.data_gc.setValue(i,4,(success+0.0)/(success+fail+0.0)*100.0);
  }
//  var formatter_a = new google.visualization.BarFormat({});
//  formatter_a.format(this.data_gc, 2);
//  formatter_a.format(this.data_gc, 3);
  
  var formatter = new google.visualization.ColorFormat();
  formatter.addGradientRange(-0.1, 50, 'black', 'red', 'yellow');
  formatter.addGradientRange(50, 100.1, 'black', 'yellow', 'green');  
  formatter.format(this.data_gc,4);  
  
  this.chart_properties.allowHtml = true;
}

//-------------------------------------------------------------------
// Draw on load
//-------------------------------------------------------------------

quality_map = new graphtool.GC_QUALITY_MAP();
quality_map.load_google_api_and_draw();