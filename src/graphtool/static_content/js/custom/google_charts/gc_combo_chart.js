
graphtool.GC_COMBO_CHART = function(){
  graphtool.GC_COMMON.call(this)
  
  //-------------------------------------------------------------------
  // Combo Chart Variables 
  //-------------------------------------------------------------------
  
  this.groups                    = null;
  this.data_gc                   = null;
  this.selected_groups           = new Set();
  this.selected_groups_trends    = new Set();
  google.load("visualization", "1", {packages:["corechart"], callback: this.load_google_callback.bind(this)});
};

graphtool.GC_COMBO_CHART.prototype = graphtool.GC_COMMON.prototype
graphtool.GC_COMBO_CHART.prototype.constructor = graphtool.GC_COMBO_CHART

//-------------------------------------------------------------------
// Data Transformation functions 
//-------------------------------------------------------------------

graphtool.GC_COMBO_CHART.prototype.to_gc_table_format = function(){
  var i,j,added = 0;
  var cols = [];
  for(i=0;i<this.groups.getNumberOfRows();i++){
    if(this.selected_groups.size == 0 || this.selected_groups.has(i)){
      var view_i = new google.visualization.DataView(this.gc_init_table);
      view_i.setRows(view_i.getFilteredRows([{column: 0, value: this.groups.getValue(i, 0)},{column: 1},{column: 2}]));
      if(added==0){
        this.data_gc = view_i;
      }
      else if(added==1){
        this.data_gc = google.visualization.data.join(this.data_gc, view_i, 'full', [[1,1]],[2],[2])
      }
      else{
        this.data_gc = google.visualization.data.join(this.data_gc, view_i, 'full', [[0,1]],cols,[2])
      }
      added++;
      cols.push(added)
    }
  }
  if(added == 1){
    this.data_gc = google.visualization.data.join(this.data_gc, this.data_gc, 'full', [[1,1]],[2],[])
  }
  this.data_gc.setColumnLabel(0, "time")
  current=1
  this.chart_properties.trendlines = {}
  for(i=0;i<this.groups.getNumberOfRows();i++){
    if(this.selected_groups.size == 0 || this.selected_groups.has(i)){
      this.data_gc.setColumnLabel(current, this.groups.getValue(i, 0))
      if(this.selected_groups_trends.has(i))
        this.chart_properties.trendlines[current-1] = {visibleInLegend: true}
      current++;
    }
  }
  this.data_gc.sort([{column: 0}])
}


//-------------------------------------------------------------------
// UI functions 
//-------------------------------------------------------------------

graphtool.GC_COMBO_CHART.prototype.include_groups_selection_options = function(){
  var html_code = 
  '<div>'+
  '  <b>Selected Groups</b>'+
  '  <select data-placeholder="Choose a group" id="group_select_list" multiple>';
  for(var i = 0 ; i < this.groups.getNumberOfRows(); i++)
    html_code += '<option value="'+i+'">'+this.groups.getValue(i,0)+'</option>';
  html_code +=
  '  </select>'+
  '  <button id="clear-group-select">Clear Selection</button>'+
  '  <button id="rerender-by-group-select">Draw Plot</button>'+
  '</div>';
  this.include_options_tab("groups_selection","Group Selection",html_code);
  $("#group_select_list" ).chosen(); 
  $("#clear-group-select")
    .button()
    .click(function( event ) {
      $("#group_select_list").val('');
      $("#group_select_list").trigger("chosen:updated");
    }.bind(this));
  $("#rerender-by-group-select")
    .button()
    .click(function( event ) {
      var g_select = $("#group_select_list" ).val()
      this.selected_groups.clear();
      for(i in g_select)
        this.selected_groups.add(parseInt(g_select[i]));
      this.drawChart();
    }.bind(this));
}

graphtool.GC_COMBO_CHART.prototype.include_trendlines_options = function(){
  var html_code = 
  '<div>'+
  '  <b>Selected Trendlines</b>'+
  '  <select data-placeholder="Choose a group" id="trend_select_list" multiple>';
  for(var i = 0 ; i < this.groups.getNumberOfRows(); i++)
    html_code += '<option value="'+i+'">'+this.groups.getValue(i,0)+'</option>';
  html_code +=
  '  </select>'+
  '  <button id="clear-trend-select">Clear Selection</button>'+
  '  <button id="rerender-by-trend-select">Draw Plot</button>'+
  '</div>';
  this.include_options_tab("trends_selection","Trendlines",html_code);
  $("#trend_select_list" ).chosen(); 
  $("#clear-trend-select")
    .button()
    .click(function( event ) {
      $("#trend_select_list").val('');
      $("#trend_select_list").trigger("chosen:updated");
    }.bind(this));
  $("#rerender-by-trend-select")
    .button()
    .click(function( event ) {
      var g_select = $("#trend_select_list" ).val()
      this.selected_groups_trends.clear();
      for(i in g_select){
        this.selected_groups.add(parseInt(g_select[i]));
        this.selected_groups_trends.add(parseInt(g_select[i]));
      }
      var arr = []
      for(select_i in this.selected_groups)
        arr.push(select_i)
      $("#group_select_list" ).val(arr);
      $("#group_select_list").trigger("chosen:updated");
      this.drawChart();
    }.bind(this));
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
  var html_code = "<div><button class='gc_stack_off'>Unstack</button><button class='gc_stack_on'>Stack</button></div>"
  this.include_options_tab("bars_stack","Stack",html_code);
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
  this.include_groups_selection_options();
  this.include_trendlines_options();
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

graphtool.GC_COMBO_CHART.prototype.data_initial_setup = function() {
  this.pivot_results_to_gc_table(['string','datetime','number']);
  this.groups = google.visualization.data.group(this.gc_init_table,
    [0],
    [{'column': 2, 'aggregation': google.visualization.data.sum, 'type': 'number'}]);
  this.groups.sort([{column: 1,desc: true}])
}
  
graphtool.GC_COMBO_CHART.prototype.drawChart = function() {
  this.to_gc_table_format();
  this.chart.draw(this.data_gc, this.chart_properties);
}

graphtool.GC_COMBO_CHART.prototype.load_google_callback = function() {
  this.data_initial_setup()
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
