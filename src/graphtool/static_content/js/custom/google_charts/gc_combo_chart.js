
graphtool.GC_COMBO_CHART = function(){
  graphtool.GC_COMMON.call(this)
  
  //-------------------------------------------------------------------
  // Combo Chart Variables 
  //-------------------------------------------------------------------
  
  this.serializable_properties.push("cumulative")
  this.serializable_properties.push("left2right")
  
  this.groups                    = null;
  this.data_gc                   = null;
  this.cumulative                = false;
  this.left2right                = false;
  this.selected_groups           = new Set();
  this.selected_groups_trends    = new Set();
  this.starttime                 = this.get_given_kw_prop('starttime');
  this.endtime                   = this.get_given_kw_prop('endtime');
  if(this.starttime != null)
    this.starttime                 = graphtool.GC_COMMON.from_unix_utc_ts(this.starttime);
  if(this.endtime != null)
    this.endtime                   = graphtool.GC_COMMON.from_unix_utc_ts(this.endtime);
  this.span                      = this.get_given_kw_prop('span');
  this.column_label = this.get_json_query_metadata_prop('column_names')
  this.column_units = this.get_json_query_metadata_prop('column_units')
  this.v_axis_label = (this.column_label!=null? this.column_label:'')+(this.column_units!=null? (" ["+this.column_units+"]"):'')
};

graphtool.GC_COMBO_CHART.prototype = graphtool.GC_COMMON.prototype;
graphtool.GC_COMBO_CHART.prototype.constructor = graphtool.GC_COMBO_CHART;

graphtool.GC_COMBO_CHART.prototype.get_chart_name =  function(){
  return "GC_COMBO_CHART";
}

//-------------------------------------------------------------------
// Data Transformation functions 
//-------------------------------------------------------------------

graphtool.GC_COMBO_CHART.prototype.get_non_saveable_chart_props = function() {
  var additional_props = {};
  additional_props.title = this.title;
  additional_props.vAxis = {title:this.v_axis_label}
  additional_props.hAxis = {
                              gridlines: {
                                count: -1,
                                units: {
                                  days: {format: ['yyyy/MM/dd']}
                                }
                              }
                            }
  if(this.starttime && this.endtime){
    additional_props.hAxis.viewWindow= {
                                          min: this.starttime,
                                          max: this.endtime
                                        }
  }
  return additional_props;
}

graphtool.GC_COMBO_CHART.prototype.format_combo = function(){
  //first column is the date
  for(var j = 0 ; j < this.data_gc.getNumberOfColumns() ; j++){
    if(this.data_gc.getColumnType(j) == 'number')
      this.two_decimal_formatter.format(this.data_gc,j);
    else if(this.data_gc.getColumnType(j) == 'datetime'){
      if(this.span != null && this.span < 24*3600/2){
        this.date_time_formatter.format(this.data_gc,j);
      }
      else{
        this.date_formatter.format(this.data_gc,j);
      }
    }
  }
}

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
    this.reverse_colors_to_fit = this.data_gc.getNumberOfColumns()-1
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
  else{
    this.reverse_colors_to_fit = null;
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
  this.format_combo();
}

graphtool.GC_COMBO_CHART.prototype.get_legend_labels_and_values = function(){
  var labels = [];
  var values = [];
  // The first column is the x-axis data
  for(var j = 1 ; j < this.data_gc.getNumberOfColumns() ; j++){
    labels.push(this.data_gc.getColumnLabel(j));
    values.push(0);
    for(var i = 0 ; i < this.data_gc.getNumberOfRows() ; i++){
      values[j-1] += this.data_gc.getValue(i,j) == null? 0:this.data_gc.getValue(i,j)
    }
  }
  for(i in values){
    values[i] = this.no_decimal_formatter.formatValue(values[i])
  }
  return [labels,values];
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
}

//-------------------------------------------------------------------
// Charts functions 
//-------------------------------------------------------------------

graphtool.GC_COMBO_CHART.prototype.get_required_google_pkgs = function() {
  return ["corechart"]
}

graphtool.GC_COMBO_CHART.prototype.get_object_type = function() {
  return 'ComboChart'
}

graphtool.GC_COMBO_CHART.prototype.load_chart_options = function() {
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

graphtool.GC_COMBO_CHART.prototype.data_initial_setup = function() {
  this.pivot_results_to_gc_table(['string','datetime','number']);
  this.groups = google.visualization.data.group(this.gc_init_table,
    [0],
    [{'column': 2, 'aggregation': google.visualization.data.sum, 'type': 'number'}]);
  this.groups.sort([{column: 1,desc: true}])
}

//-------------------------------------------------------------------
// Draw on load
//-------------------------------------------------------------------

combo = new graphtool.GC_COMBO_CHART();
combo.load_google_api_and_draw()
