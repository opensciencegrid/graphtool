
graphtool.GC_COMBO_CHART = function(){
  graphtool.GC_COMMON.call(this)
  
  //-------------------------------------------------------------------
  // Combo Chart Variables 
  //-------------------------------------------------------------------
  
  this.groups             = null;
  this.groups_views       = null;
  this.data_gc            = null;
  this.selected_groups    = [];
  google.load("visualization", "1", {packages:["corechart"], callback: this.load_google_callback.bind(this)});
};

graphtool.GC_COMBO_CHART.prototype = graphtool.GC_COMMON.prototype
graphtool.GC_COMBO_CHART.prototype.constructor = graphtool.GC_COMBO_CHART

//-------------------------------------------------------------------
// Data Transformation functions 
//-------------------------------------------------------------------

graphtool.GC_COMBO_CHART.prototype.to_gc_table_format = function(){
  this.pivot_results_to_gc_table();
  this.groups = google.visualization.data.group(this.gc_init_table,
    [0],
    [{'column': 2, 'aggregation': google.visualization.data.sum, 'type': 'number'}]);
  this.groups.sort([{column: 1}])
  this.groups_views = []
  var i,j;
  for(i=0;i<this.groups.getNumberOfRows();i++){
    var view_i = new google.visualization.DataView(this.gc_init_table);
    view_i.setRows(view_i.getFilteredRows([{column: 0, value: this.groups.getValue(i, 0)},{column: 1},{column: 2}]));
    this.groups_views.push(view_i)
    if(i==0)
      this.data_gc = view_i
    else if(i==1){
      this.data_gc = google.visualization.data.join(this.data_gc, view_i, 'full', [[1,1]],[2],[2])
    }
    else{
      var cols = []
      for(j=0;j<i;j++)
        cols.push((j+1))
      this.data_gc = google.visualization.data.join(this.data_gc, view_i, 'full', [[0,1]],cols,[2])
    }
  }
  this.data_gc.setColumnLabel(0, "time")
  for(i=0;i<this.groups.getNumberOfRows();i++){
    this.data_gc.setColumnLabel(i+1, this.groups.getValue(i, 0))
  }
  this.data_gc.sort([{column: 0}])
  var csv = google.visualization.dataTableToCsv(this.data_gc);
  console.log(csv);
}


//-------------------------------------------------------------------
// UI functions 
//-------------------------------------------------------------------

graphtool.GC_COMBO_CHART.prototype.include_groups_order_options = function(){
  
}

graphtool.GC_COMBO_CHART.prototype.change_stack_property = function(){
  this.chart_properties.isStacked = !this.chart_properties.isStacked;
  this.drawChart();
  if(this.chart_properties.isStacked){
    $(".gc_stack_on").hide()
    $(".gc_stack_off").show()
  }
  else{
    $(".gc_stack_on").show()
    $(".gc_stack_off").hide()
  }
}

graphtool.GC_COMBO_CHART.prototype.include_stack_options = function(){
  var html_code = "<button class='gc_stack_off'>Unstack</button><button class='gc_stack_on'>Stack</button>"
  this.include_options_tab("tree_level_order","Stack",html_code);
  $(".gc_stack_on, .gc_stack_off").click()
      .button()
      .click(this.change_stack_property.bind(this));
  if(this.chart_properties.isStacked){
    $(".gc_stack_on").hide()
    $(".gc_stack_off").show()
  }
  else{
    $(".gc_stack_on").show()
    $(".gc_stack_off").hide()
  }  
}

graphtool.GC_COMBO_CHART.prototype.load_combo_options = function(){
  this.load_default_options_tabs();
  this.include_stack_options();
}

//-------------------------------------------------------------------
// Charts functions 
//-------------------------------------------------------------------

graphtool.GC_COMBO_CHART.prototype.defaultToolTip = function(row, size, value) {
  return '<div style="background:#fff; padding:5px; border-style:solid">' +
         '  '+this.data_gc.getValue(row, 0)+'<br/>'+
         '  <b>'+this.data_gc.getColumnLabel(2)+':</b> '+this.formatters.size_formatter(size)+'<br/>'+
         '  <b>'+this.data_gc.getColumnLabel(3)+':</b> '+this.formatters.value_formatter(value)+'<br/>'+
         '</div>';
}

graphtool.GC_COMBO_CHART.prototype.drawChart = function() {
  this.to_gc_table_format();
  this.chart.draw(this.data_gc, this.chart_properties);
}

graphtool.GC_COMBO_CHART.prototype.load_google_callback = function() {
  // create plot afterwards
  this.chart = new google.visualization.ComboChart(this.chart_div.get(0));
  if(typeof this.chart_properties == "undefined"){
    this.chart_properties = {
      seriesType: 'bars',
      isStacked: true
    }
  }
  
  google.visualization.events.addListener(this.chart, 'ready', this.setup_options_menu.bind(this,this.load_combo_options.bind(this)));
  this.drawChart()
}

//-------------------------------------------------------------------
// Draw on load
//-------------------------------------------------------------------

combo = new graphtool.GC_COMBO_CHART();
