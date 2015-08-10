
graphtool.GC_PIE_CHART = function(){
  graphtool.GC_COMMON.call(this)
  //-------------------------------------------------------------------
  // Combo Chart Variables 
  //-------------------------------------------------------------------
  
  this.data_gc            = null;
  google.load("visualization", "1", {packages:["corechart"], callback: this.load_google_callback.bind(this)});
};

graphtool.GC_PIE_CHART.prototype = graphtool.GC_COMMON.prototype
graphtool.GC_PIE_CHART.prototype.constructor = graphtool.GC_PIE_CHART

//-------------------------------------------------------------------
// Data Transformation functions 
//-------------------------------------------------------------------

graphtool.GC_PIE_CHART.prototype.to_gc_table_format = function(){
  this.pivot_results_to_gc_table();
  this.gc_init_table.sort({column:1})
  this.data_gc = this.gc_init_table;
}


//-------------------------------------------------------------------
// UI functions 
//-------------------------------------------------------------------

graphtool.GC_PIE_CHART.prototype.load_pie_options = function(){
  this.load_default_options_tabs();
}

//-------------------------------------------------------------------
// Charts functions 
//-------------------------------------------------------------------

graphtool.GC_PIE_CHART.prototype.drawChart = function() {
  this.to_gc_table_format();
  this.chart.draw(this.data_gc, this.chart_properties);
}

graphtool.GC_PIE_CHART.prototype.load_google_callback = function() {
  // create plot afterwards
  this.chart = new google.visualization.PieChart(this.chart_div.get(0));
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