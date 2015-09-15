
graphtool.GC_PIE_CHART = function(){
  graphtool.GC_COMMON.call(this)
  //-------------------------------------------------------------------
  // Combo Chart Variables 
  //-------------------------------------------------------------------
  
  this.data_gc            = null;
  google.load("visualization", "1", {packages:["corechart","table"], callback: this.load_google_callback.bind(this)});
};

graphtool.GC_PIE_CHART.prototype = graphtool.GC_COMMON.prototype
graphtool.GC_PIE_CHART.prototype.constructor = graphtool.GC_PIE_CHART

//-------------------------------------------------------------------
// Data Transformation functions 
//-------------------------------------------------------------------

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

//-------------------------------------------------------------------
// UI functions 
//-------------------------------------------------------------------

graphtool.GC_PIE_CHART.prototype.load_pie_options = function(){
  this.load_default_options_tabs();
  this.include_others_options();
  this.include_table_options();
  this.include_color_n_border_options();
}

//-------------------------------------------------------------------
// Charts functions 
//-------------------------------------------------------------------

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

graphtool.GC_PIE_CHART.prototype.load_google_callback = function() {
  this.pivot_results_to_gc_table(['string','number']);
  // create plot afterwards
  this.chart = new google.visualization.PieChart(this.chart_div.get(0));
  this.table = new google.visualization.Table(document.getElementById('table_div'));
  
  if(typeof this.chart_properties == "undefined"){
    this.chart_properties = {
      title:this.title
    }
  }
  
  google.visualization.events.addListener(this.chart, 'ready', this.setup_options_menu.bind(this,this.load_pie_options.bind(this)));
  this.drawChart()
}

//-------------------------------------------------------------------
// Draw on load
//-------------------------------------------------------------------

combo = new graphtool.GC_PIE_CHART();