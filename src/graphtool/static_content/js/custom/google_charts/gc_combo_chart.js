
graphtool.GC_COMBO_CHART = function(){
  graphtool.GC_COMMON.call(this)
  
  //-------------------------------------------------------------------
  // Combo Chart Variables 
  //-------------------------------------------------------------------
  
  this.groups                    = null;
  this.data_gc                   = null;
  this.cumulative                = false;
  this.left2right                = false;
  this.selected_groups           = new Set();
  this.selected_groups_trends    = new Set();
  google.load("visualization", "1", {packages:["corechart","table"], callback: this.load_google_callback.bind(this)});
  
};

graphtool.GC_COMBO_CHART.prototype = graphtool.GC_COMMON.prototype
graphtool.GC_COMBO_CHART.prototype.constructor = graphtool.GC_COMBO_CHART

//-------------------------------------------------------------------
// Data Transformation functions 
//-------------------------------------------------------------------

graphtool.GC_COMBO_CHART.prototype.cumulate = function(){
  if(this.cumulative){
    var view = new google.visualization.DataView(this.data_gc);
    // includes the x-axis without modifications
    var conf = [0];
    // The first column is the x-axis data
    for(var i = 1 ; i < this.data_gc.getNumberOfColumns() ; i++){
      conf.push({
        calc:graphtool.GC_COMMON.cumulative_function.bind({column:i}), 
        type:'number',
        label:this.data_gc.getColumnLabel(i)
      })
    }
    view.setColumns(conf)
    
    this.data_gc = view.toDataTable();
    
    // TODO: Check which version is more efficient
//    for(var i = 1 ; i < this.data_gc.getNumberOfRows() ; i++){
//      // The first column is the x-axis data
//      for(var j = 1 ; j < this.data_gc.getNumberOfColumns() ; j++){
//        this.data_gc.setCell(i, j, graphtool.GC_COMMON.sum_with_default_nulls(this.data_gc.getValue(i,j),this.data_gc.getValue(i-1,j),0))
//      }
//    }
  }
}

graphtool.GC_COMBO_CHART.prototype.right_2_left = function(){
  if(!this.left2right){
    var view = new google.visualization.DataView(this.data_gc);
    // includes the x-axis without modifications
    var conf = [0];
    // The first column is the x-axis data
    for(var i = this.data_gc.getNumberOfColumns()-1 ; i > 0  ; i--){
      conf.push(i)
    }
    view.setColumns(conf)
    
    this.data_gc = view.toDataTable();
  }
}


graphtool.GC_COMBO_CHART.prototype.include_borders = function(){
  if(this.draw_border){
    var num_data_cols = this.data_gc.getNumberOfColumns();
    this.data_gc.addColumn({type:'string', role:'style'});
    for(var k = 0 ; k < this.data_gc.getNumberOfRows() ; k++){
      this.data_gc.setCell(k, num_data_cols,'bar {' +
                                            'stroke-color: #000000}')
    }
  
    var view = new google.visualization.DataView(this.data_gc);
    // includes the x-axis without modifications
    var conf = [0];
    // The first column is the x-axis data
    for(var i = 1 ; i < num_data_cols ; i++){
      conf.push(i)
      conf.push(num_data_cols)
    }
    view.setColumns(conf)
    
    this.data_gc = view.toDataTable();
  }
}


graphtool.GC_COMBO_CHART.prototype.calc_draw_table = function(){
  
  if((typeof this.group_after != "number") || this.group_after < 1){
    this.group_after = Number.MAX_VALUE;
  }

  // Extract the data of the selected groups and groups after
  var i,added = 0;
  var cols = [];
  var total_grouped = 1;
  for(i=0;i<this.groups.getNumberOfRows();i++){
    if(this.selected_groups.size == 0 || this.selected_groups.has(i)){
      var view_i = new google.visualization.DataView(this.gc_init_table);
      view_i.setRows(view_i.getFilteredRows([{column: 0, value: this.groups.getValue(i, 0)},{column: 1},{column: 2}]));
      view_i.hideColumns([0]);
      if(added==0){
        this.data_gc = view_i.toDataTable();
      }
      else{
        this.data_gc = google.visualization.data.join(this.data_gc, view_i, 'full', [[0,0]],cols,[1]);
        if(added >= this.group_after){
          this.data_gc.addColumn('number')
          for(var k = 0; k < this.data_gc.getNumberOfRows() ; k++){
            this.data_gc.setCell(k, added+2, graphtool.GC_COMMON.sum_with_default_nulls(this.data_gc.getValue(k,added),this.data_gc.getValue(k,added+1),0))
          }
          this.data_gc.removeColumns(added,2);
          total_grouped++;
        }
      }
      if(added < this.group_after){
        added++;
        cols.push(added)
      }
    }
  }
  // Sets the column labels according to the selected groups and include the trendlines
  this.data_gc.setColumnLabel(0, "time")
  var current=1
  this.chart_properties.trendlines = {}
  for(i=0;i<this.groups.getNumberOfRows();i++){
    if(this.selected_groups.size == 0 || this.selected_groups.has(i)){
      if(current >= this.group_after){
        this.data_gc.setColumnLabel(current, "OTHERS ("+total_grouped+")")
        break;
      }
      this.data_gc.setColumnLabel(current, this.groups.getValue(i, 0))
      if(this.selected_groups_trends.has(i))
        this.chart_properties.trendlines[current-1] = {visibleInLegend: true}
      current++;
    }
  }
  // Applies additional Transformations
  this.data_gc.sort([{column: 0}])
  this.cumulate();
  this.right_2_left();
  this.include_borders();
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

graphtool.GC_COMBO_CHART.prototype.include_stack_options = function(){
  this.include_alternating_buttons("combo_options_on_off","stack","Unstack","Stack",
    function(){
      this.chart_properties.isStacked = !this.chart_properties.isStacked;
      this.drawChart();
    }.bind(this),
    function(){
      return (this.chart_properties.isStacked);
    }.bind(this));  
}

graphtool.GC_COMBO_CHART.prototype.include_cumulate_options = function(){
  this.include_alternating_buttons("combo_options_on_off","cumulate","Draw non Cumulative","Draw Cumulative",
    function(){
      this.cumulative = !this.cumulative;
      this.drawChart();
    }.bind(this),
    function(){
      return (this.cumulative);
    }.bind(this));
}

graphtool.GC_COMBO_CHART.prototype.include_orientation_options = function(){
  this.include_alternating_buttons("combo_options_on_off","orientation","Draw Vertical","Draw Horizontal",
    function(){
      if(typeof this.chart_properties.orientation === "undefined" || this.chart_properties.orientation == 'horizontal')
        this.chart_properties.orientation = 'vertical';
      else
        this.chart_properties.orientation = 'horizontal';
      this.drawChart();
    }.bind(this),
    function(){
      return (typeof this.chart_properties.orientation === "undefined" || this.chart_properties.orientation == 'horizontal');
    }.bind(this));
}

graphtool.GC_COMBO_CHART.prototype.include_orientation_options = function(){
  this.include_alternating_buttons("combo_options_on_off","orientation","Draw Vertical","Draw Horizontal",
    function(){
      if(typeof this.chart_properties.orientation === "undefined" || this.chart_properties.orientation == 'horizontal')
        this.chart_properties.orientation = 'vertical';
      else
        this.chart_properties.orientation = 'horizontal';
      this.drawChart();
    }.bind(this),
    function(){
      return (typeof this.chart_properties.orientation === "undefined" || this.chart_properties.orientation == 'horizontal');
    }.bind(this));
}

graphtool.GC_COMBO_CHART.prototype.include_left_2_right_options = function(){
  this.include_alternating_buttons("combo_options_on_off","l2r_order","Draw Ascendig","Draw Descending",
    function(){
      this.left2right = !this.left2right;
      this.drawChart();
    }.bind(this),
    function(){
      return (this.left2right);
    }.bind(this));
}


graphtool.GC_COMBO_CHART.prototype.load_combo_options = function(){
  this.load_default_options_tabs();
  this.include_groups_selection_options();
  this.include_trendlines_options();
  this.include_options_tab("combo_options_on_off","On/Off Options","");  
  this.include_stack_options();
  this.include_cumulate_options();
  this.include_orientation_options();
  this.include_left_2_right_options();
  // Common extra options
  this.include_others_options();  
  this.include_table_options();
  this.include_color_n_border_options();
}

//-------------------------------------------------------------------
// Charts functions 
//-------------------------------------------------------------------

graphtool.GC_COMBO_CHART.prototype.data_initial_setup = function() {
  this.pivot_results_to_gc_table(['string','datetime','number']);
  this.groups = google.visualization.data.group(this.gc_init_table,
    [0],
    [{'column': 2, 'aggregation': google.visualization.data.sum, 'type': 'number'}]);
  this.groups.sort([{column: 1,desc: true}])
}

graphtool.GC_COMBO_CHART.prototype.load_google_callback = function() {
  this.data_initial_setup()
  this.chart = new google.visualization.ComboChart(this.chart_div.get(0));
  this.table = new google.visualization.Table(document.getElementById('table_div'));
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
