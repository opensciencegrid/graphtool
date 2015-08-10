
graphtool.GC_COMBO_CHART = function(){
  graphtool.GC_COMMON.call(this)
  
  //-------------------------------------------------------------------
  // Combo Chart Variables 
  //-------------------------------------------------------------------
  
  this.groups             = null;
  this.groups_views       = null;
  this.data_gc            = null;
  this.selected_groups    = new Set();
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
  var i,j,added = 0;
  var cols = [];
  for(i=0;i<this.groups.getNumberOfRows();i++){
    if(this.selected_groups.size == 0 || this.selected_groups.has(i)){
      var view_i = new google.visualization.DataView(this.gc_init_table);
      view_i.setRows(view_i.getFilteredRows([{column: 0, value: this.groups.getValue(i, 0)},{column: 1},{column: 2}]));
      this.groups_views.push(view_i)
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
  this.data_gc.setColumnLabel(0, "time")
  current=1
  for(i=0;i<this.groups.getNumberOfRows();i++){
    if(this.selected_groups.size == 0 || this.selected_groups.has(i))
      this.data_gc.setColumnLabel(current++, this.groups.getValue(i, 0))
  }
  this.data_gc.sort([{column: 0}])
}


//-------------------------------------------------------------------
// UI functions 
//-------------------------------------------------------------------

graphtool.GC_COMBO_CHART.prototype.include_groups_selection_options = function(){
  var html_code = 
  '<style>'+
  '  .active-inactive-connected-sortable {'+
  '    width:    300px;'+      
  '    border: 1px dashed #000;'+
  '    padding: 5px;'+
  '  }'+
  '  .active-inactive-connected-sortable div {'+
  '    margin: 0 3px 3px 3px;'+
  '    padding: 0.4em;'+
  '    padding-left: 1.5em;'+
  '    font-size: 1.4em;'+
  '    height: 18px; }'+
  '  .active-inactive-connected-sortable div span { position: absolute; margin-left: -1.3em; }'+
  '</style>'+
  '<table><tr>'+
  '<td style="vertical-align: top;"><div>'+
  '  <b>Show</b>'+
  '  <div id="sortable_active" class="active-inactive-connected-sortable">'+
  '  </div>'+
  '</div></td>'+
  '<td><span class="ui-icon ui-icon-arrowthick-2-e-w"></td>'+
  '<td style="vertical-align: top;"><div>'+
  '  <b>Hide</b>'+
  '  <div id="sortable_inactive" class="active-inactive-connected-sortable">';
  for(var i = 0 ; i < this.groups.getNumberOfRows(); i++)
    html_code += '<div id="'+i+'-order" class="ui-state-default"><span class="ui-icon ui-icon-arrowthick-2-n-s"></span>'+this.groups.getValue(i,0)+'</div>';
  html_code +='</div>'+
    '</div></td>'+
    '</tr></table>'+      
    '<button id="rerender-by-order">Draw Plot</button>';
  this.include_options_tab("groups_selection","Selection",html_code);
  
  $( "#sortable_active, #sortable_inactive" ).sortable({
    connectWith: ".active-inactive-connected-sortable"
  }).disableSelection();
  // fix the max height as the height of the active levels
  var max_h = $("#sortable_inactive").height();
  $("#sortable_active").height(max_h);
  $("#sortable_inactive").height(max_h);
  $("#rerender-by-order")
    .button()
    .click(function( event ) {
      var order_str = $("#sortable_active").sortable("toArray");
      if(order_str.length <= 0){
        alert("No levels selected!")
        return;
      }
      console.log(order_str)
      this.selected_groups.clear();
      for(var i = 0 ; i < order_str.length ; i++)
        this.selected_groups.add(parseInt(order_str[i].split('-')[0])-1);
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
  this.include_groups_selection_options()
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
