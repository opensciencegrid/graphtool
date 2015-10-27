
graphtool.GC_PIE_CHART = function(){
  graphtool.GC_COMMON.call(this)
  //-------------------------------------------------------------------
  // Combo Chart Variables 
  //-------------------------------------------------------------------
  
  this.data_gc            = null;
};

graphtool.GC_PIE_CHART.prototype = graphtool.GC_COMMON.prototype
graphtool.GC_PIE_CHART.prototype.constructor = graphtool.GC_PIE_CHART

graphtool.GC_PIE_CHART.prototype.get_chart_name =  function(){
  return "GC_PIE_CHART"
}

//-------------------------------------------------------------------
// Data Transformation functions 
//-------------------------------------------------------------------

graphtool.GC_PIE_CHART.prototype.format_pie = function(){
  //first column is the label
  for(var j = 1 ; j < this.data_gc.getNumberOfColumns() ; j++){  
    this.no_decimal_formatter.format(this.data_gc,j)
  }
}

graphtool.GC_PIE_CHART.prototype.calc_draw_table = function(){
  this.gc_init_table.sort({column:1,desc: true})
  this.data_gc = this.gc_init_table.clone();
  var grouped_count = 1
  while(this.data_gc.getNumberOfRows()>this.group_after){
    grouped_count++;
    this.data_gc.setCell(this.group_after-1,0,"OTHERS ("+grouped_count+")") 
    this.data_gc.setCell(this.group_after-1,1,this.data_gc.getValue(this.group_after-1,1)+this.data_gc.getValue(this.group_after,1))
    this.data_gc.removeRow(this.group_after)
  }
  this.format_pie();
  this.set_pie_properties();
}

graphtool.GC_PIE_CHART.prototype.get_legend_labels_and_values = function(){
  var labels = [];
  var values = [];
  for(var i = 0 ; i < this.data_gc.getNumberOfRows() ; i++){
    labels.push(this.data_gc.getValue(i,0));
    values.push(this.data_gc.getValue(i,1));
  }
  for(i in values){
    values[i] = this.no_decimal_formatter.formatValue(values[i])
  }
  return [labels,values];
}

graphtool.GC_PIE_CHART.prototype.set_pie_properties = function() {
  if(this.draw_border){
    this.chart_properties.pieSliceBorderColor = 'black';
  }
  else{
    this.chart_properties.pieSliceBorderColor = null;
  }
  if(this.custom_palette){
    this.chart_properties.pieSliceTextStyle = {color: 'black'}
  }
  else{    
    this.chart_properties.pieSliceTextStyle = null;
  }
  this.chart_properties.title = this.title;
  this.chart_properties.pieSliceText     = 'value'
  this.chart_properties.tooltip          = {}
  this.chart_properties.tooltip.trigger  = 'selection'
  this.chart_properties.slices           = []
  var ini = 0.1
  var min = 0.05
  var delta = 0.07
  for(var i = 0 ; i < this.data_gc.getNumberOfRows() ; i++){
    var temp_obj = {}
    temp_obj.offset = ini;
    this.chart_properties.slices.push(temp_obj);
    if(ini-delta>min){
      ini   -= delta;
      delta -= delta/4;
    }
  }
}

//-------------------------------------------------------------------
// UI functions 
//-------------------------------------------------------------------


//-------------------------------------------------------------------
// Charts functions 
//-------------------------------------------------------------------

graphtool.GC_PIE_CHART.prototype.get_required_google_pkgs = function() {
  return ["corechart"];
}

graphtool.GC_PIE_CHART.prototype.get_object_type = function() {
  return 'PieChart';
}

graphtool.GC_PIE_CHART.prototype.load_chart_options = function() {
  this.load_default_options_tabs();
  this.include_others_options();
  this.include_table_options();
  this.include_color_n_border_options();
}

graphtool.GC_PIE_CHART.prototype.data_initial_setup = function() {
  this.pivot_results_to_gc_table(['string','number']);
}

//-------------------------------------------------------------------
// Draw on load
//-------------------------------------------------------------------

combo = new graphtool.GC_PIE_CHART();
combo.load_google_api_and_draw();