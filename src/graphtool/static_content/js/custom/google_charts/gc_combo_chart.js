if(typeof graphtool === "undefined" || graphtool === null)
  var graphtool = {};

graphtool.GC_COMBO_CHART = function(){
  graphtool.GC_COMMON.call(this)
  
  //-------------------------------------------------------------------
  // Combo Chart Variables 
  //-------------------------------------------------------------------
  
  this.serializable_properties.push("cumulative")
  this.serializable_properties.push("left2right")
  this.cumulative                = false;
  this.left2right                = false;
  
  this.groups                    = null;
  this.groups_views              = [];
  this.data_gc                   = null;
  this.selected_groups           = new graphtool.JS_SET();
  this.excluded_groups           = new graphtool.JS_SET();
  this.selected_groups_trends    = new graphtool.JS_SET();
  this.column_label = this.get_json_query_metadata_prop('column_names')
  this.column_units = this.get_json_query_metadata_prop('column_units')
  this.v_axis_label = (this.column_label!=null? this.column_label:'')+(this.column_units? (" ["+this.column_units+"]"):'')
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
  additional_props.title = (this.cumulative? "Cumulative ":"")+ this.title;
  additional_props.vAxis = {title:this.v_axis_label}
  additional_props.hAxis = {
                              gridlines: {
                                count: -1,
                                units: {
                                  days: {format: ['yyyy/MM/dd']}
                                }
                              }
                            }
  if(this.starttime && this.endtime && this.span){
    var min = new Date(), max = new Date();
    min.setTime(this.starttime.getTime()-this.span*1000/2);
    max.setTime(this.endtime.getTime()+this.span*1000/2);
    additional_props.hAxis.viewWindow= {
                                          min: min,
                                          max: max
                                        }
  }
  if(typeof this.chart_properties.orientation !== "undefined" && this.chart_properties.orientation == 'vertical'){
    var temp_axis_conf = additional_props.vAxis;
    additional_props.vAxis = additional_props.hAxis;
    additional_props.hAxis = temp_axis_conf;
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
    
    // TODO: Can be achieved with the google charts api, but is not very efficient
//    var view = new google.visualization.DataView(this.data_gc);
//    // includes the x-axis without modifications
//    var conf = [0];
//    // The first column is the x-axis data
//    for(var i = 1 ; i < this.data_gc.getNumberOfColumns() ; i++){
//      conf.push({
//        calc:graphtool.GC_COMMON.cumulative_function.bind({column:i}), 
//        type:'number',
//        label:this.data_gc.getColumnLabel(i)
//      })
//    }
//    view.setColumns(conf)
//    
//    this.data_gc = view.toDataTable();

    // more efficient way to calculate the cumulative values
    for(var i = 1 ; i < this.data_gc.getNumberOfRows() ; i++){
      // The first column is the x-axis data
      for(var j = 1 ; j < this.data_gc.getNumberOfColumns() ; j++){
        this.data_gc.setCell(i, j, graphtool.GC_COMMON.sum_with_default_nulls(this.data_gc.getValue(i,j),this.data_gc.getValue(i-1,j),0))
      }
    }
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
  var others_group = {};
  var obj_others_group = {};
  for(i=0;i<this.groups.getNumberOfRows();i++){
    if(!this.excluded_groups.has(i) && (((this.selected_groups.has(-1) && this.selected_groups.size ==1)? this.selected_groups.size != 0:this.selected_groups.size == 0) || this.selected_groups.has(i))){
      var view_i = this.groups_views[i];
      if(added==0){
        this.data_gc = view_i.toDataTable();
      }
      else{
        if(added >= this.group_after){
          var key = null;
          for(var k = 0 ; k < view_i.getNumberOfRows() ; k++){
            key = view_i.getValue(k,0)
            if(!(key in others_group)){
              others_group[key] = 0;
              obj_others_group[key] = view_i.getValue(k,0);
            }
            others_group[key] += view_i.getValue(k,1)
          }
//          this.data_gc.addColumn('number')
          total_grouped++;
        }
        else{
          this.data_gc = google.visualization.data.join(this.data_gc, view_i, 'full', [[0,0]],cols,[1]);
        }
      }
      if(added < this.group_after){
        added++;
        cols.push(added)
      }
    }
  }
  if(added == 0){
    this.chart_div.hide();
    this.legend_div.hide();
    this.title_div.html("<h3>No groups to display.</h3>");
    $('html,body').animate({scrollTop: this.title_div.offset().top},'slow');
  }
  else{
    this.title_div.html("");
    this.chart_div.show();
    this.legend_div.show();
    // Joins the grouped data of "OTHERS"
    if( Object.keys(others_group).length > 0){
      var data_others = new google.visualization.DataTable();
      data_others.addColumn('datetime');
      data_others.addColumn('number');
      for(key in others_group){
        data_others.addRow([obj_others_group[key],others_group[key]]);
      }
      this.data_gc = google.visualization.data.join(this.data_gc, data_others, 'full', [[0,0]],cols,[1]);
      for(k = 0; k < this.data_gc.getNumberOfRows() ; k++){
        this.data_gc.setCell(k, added, graphtool.GC_COMMON.sum_with_default_nulls(this.data_gc.getValue(k,added),this.data_gc.getValue(k,added+1),0))
      }
      this.data_gc.removeColumns(added+1,1);
    }
    
    // Sets the column labels according to the selected groups and include the trendlines
    this.data_gc.setColumnLabel(0, "time")
    var current=1
    this.chart_properties.trendlines = {}
    for(i=0;i<this.groups.getNumberOfRows();i++){
      if(!this.excluded_groups.has(i) && (((this.selected_groups.has(-1) && this.selected_groups.size ==1)? this.selected_groups.size != 0:this.selected_groups.size == 0) || this.selected_groups.has(i))){
        if(current >= this.group_after){
          this.data_gc.setColumnLabel(current, "OTHERS ("+total_grouped+")")
          if(this.selected_groups_trends.has(-1)&&!this.excluded_groups.has(-1))
            this.chart_properties.trendlines[this.left2right? (current-1):(added-current)] = {visibleInLegend: true}
          break;
        }
        this.data_gc.setColumnLabel(current, this.groups.getValue(i, 0))
        if(this.selected_groups_trends.has(i))
          this.chart_properties.trendlines[this.left2right? (current-1):(added-current)] = {visibleInLegend: true}
        current++;
      }
    }
    // The OTHERS group is calculated based on the selection/exclusion and the group after parameter
    // Therefore after it is computed the logic to include/exclude it will take effect
    try{
      if(this.data_gc.getNumberOfColumns()>=this.group_after){
        if(this.excluded_groups.has(-1)){
          this.data_gc.removeColumn(this.group_after);
        }
        if(this.selected_groups.has(-1)){
          for(i=this.group_after-1; i > 0 ; i--)
            this.data_gc.removeColumn(i);
        }
        
      }
    }  
    catch(err) {
      console.log(err.stack)
    }
    if(this.data_gc.getNumberOfColumns() <= 1){
      this.chart_div.hide();
      this.legend_div.hide();
      this.title_div.html("<h3>No groups to display.</h3>");
      $('html,body').animate({scrollTop: this.title_div.offset().top},'slow');
    }
    else{
      // Applies additional Transformations
      this.data_gc.sort([{column: 0}])
      this.cumulate();
      this.right_2_left();
      this.include_borders();
      this.format_combo();
    }
  }
}

graphtool.GC_COMBO_CHART.prototype.get_legend_labels_and_values = function(){
  var labels = [];
  var values = [];
  var max=0,min=Number.MAX_VALUE,avg=0,current=0;
  // The first column is the x-axis data
  for(var j = 1 ; j < this.data_gc.getNumberOfColumns() ; j++){
    labels.push(this.data_gc.getColumnLabel(j));
    values.push(0);
    if(this.cumulative){
      values[j-1] = this.data_gc.getValue(this.data_gc.getNumberOfRows()-1,j)
    }
    else{
      for(var i = 0 ; i < this.data_gc.getNumberOfRows() ; i++){
        values[j-1] += this.data_gc.getValue(i,j) == null? 0:this.data_gc.getValue(i,j)
      }
    }
  }
  // Group data by date
  var previous_acum = 0
  for(var i = 0 ; i < this.data_gc.getNumberOfRows() ; i++){
    current = 0;
    for(var j = 1 ; j < this.data_gc.getNumberOfColumns() ; j++){
      current += this.data_gc.getValue(i,j) == null? 0:this.data_gc.getValue(i,j)
    }
    if(this.cumulative)
      current -= previous_acum;
    if(max<current)
      max = current;
    if(min>current)
      min = current;
    avg+= current;
    previous_acum += current;
  }
  avg/=this.data_gc.getNumberOfRows();
  max = this.two_decimal_formatter.formatValue(max);
  min = this.two_decimal_formatter.formatValue(min);
  avg = this.two_decimal_formatter.formatValue(avg);
  current = this.two_decimal_formatter.formatValue(current);
  var footer_html = "<center><b>Maximum:</b> "+max+", <b>Minimum:</b> "+min+", <b>Average:</b> "+avg+", <b>Current:</b> "+current+"</center>";
  this.footer_div.html("");
  this.footer_div.append(footer_html);
  
  for(i in values){
    values[i] = this.no_decimal_formatter.formatValue(values[i])
  }
  return [labels,values];
}

//-------------------------------------------------------------------
// UI functions 
//-------------------------------------------------------------------

graphtool.GC_COMBO_CHART.prototype.get_html_group_selection_items = function(){
  var html_code = '';
  for(var i = 0 ; i < this.groups.getNumberOfRows(); i++)
    html_code += '<option value="'+i+'">'+this.groups.getValue(i,0)+'</option>';
  html_code += '<option value="'+(-1)+'">OTHERS</option>';
  return html_code;
}

graphtool.GC_COMBO_CHART.prototype.draw_select_exclude_and_trendlines = function(){
  var g_select   = $("#group_select_list" ).val();
  var g_exclude  = $("#group_exclude_list" ).val();
  var g_trend    = $("#trend_select_list" ).val();
  this.selected_groups.clear();
  this.excluded_groups.clear();
  this.selected_groups_trends.clear();
  for(i in g_select)
    this.selected_groups.add(parseInt(g_select[i]));
  for(i in g_exclude)
    this.excluded_groups.add(parseInt(g_exclude[i]));
  for(i in g_trend)
    this.selected_groups_trends.add(parseInt(g_trend[i]));
  this.drawChart();
}

graphtool.GC_COMBO_CHART.prototype.include_groups_selection_options = function(){
  var html_code = 
  '<div><table>'+
  '  <tr>'+
  '    <td>'+
  '      <b>Select Groups:</b>'+
  '    </td>'+
  '    <td>'+
  '      <select data-placeholder="Choose a group" style="width:350px;" id="group_select_list" multiple>';
  html_code += this.get_html_group_selection_items();
  html_code +=
  '      </select>'+
  '    </td>'+
  '    <td>'+
  '      <button id="clear-group-select">Clear Selection</button>'+
  '    </td>'+
  '  </tr>'+
  '  <tr>'+
  '    <td>'+
  '      <b>Exclude Groups:</b>'+
  '    </td>'+
  '    <td>'+
  '      <select data-placeholder="Choose a group" style="width:350px;" id="group_exclude_list" multiple>';
  html_code += this.get_html_group_selection_items();
  html_code +=
  '      </select>'+
  '    </td>'+
  '    <td>'+
  '      <button id="clear-group-exclude">Clear Selection</button><br/>'+
  '    </td>'+
  '  </tr>'+
  '  <tr>'+
  '    <td>'+
  '      <b>Select Trendlines:</b>'+
  '    </td>'+
  '    <td>'+
  '      <select data-placeholder="Choose a group" style="width:350px;" id="trend_select_list" multiple>';
  html_code += this.get_html_group_selection_items();
  html_code +=
  '      </select>'+
  '    </td>'+
  '    <td>'+
  '      <button id="clear-trend-select">Clear Selection</button>'+
  '    </td>'+
  '  </tr>'+
  '</table></div>';
  this.include_options_tab("groups_selection","Group Selection",html_code);
  $("#group_select_list,#group_exclude_list,#trend_select_list").chosen().change(this.draw_select_exclude_and_trendlines.bind(this));
  $("#clear-group-select")
    .button()
    .click(function( event ) {
      $("#group_select_list").val('');
      $("#group_select_list").trigger("chosen:updated");
      this.draw_select_exclude_and_trendlines();
    }.bind(this));
  $("#clear-group-exclude")
    .button()
    .click(function( event ) {
      $("#group_exclude_list").val('');
      $("#group_exclude_list").trigger("chosen:updated");
      this.draw_select_exclude_and_trendlines();
    }.bind(this));
  $("#clear-trend-select")
    .button()
    .click(function( event ) {
      $("#trend_select_list").val('');
      $("#trend_select_list").trigger("chosen:updated");
      this.draw_select_exclude_and_trendlines();
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
  
  var groups_dict  = {}
  var group_name_i = null;
  var group_i_data = null
  var date_i       = null;
  var str_date_i   = null;
  var date_i_data  = null;
  for(var i=0;i<this.gc_init_table.getNumberOfRows();i++){
    group_name_i = this.gc_init_table.getValue(i,0)
    if(!(group_name_i in groups_dict)){
      groups_dict[group_name_i] = {}
    }
    group_i_data = groups_dict[group_name_i];
    date_i = this.gc_init_table.getValue(i,1);
    str_date_i = String(date_i);
    if(!(str_date_i in group_i_data)){
      group_i_data[str_date_i] = {date:date_i,sum:0}
    }
    date_i_data = group_i_data[str_date_i];
    date_i_data.sum += this.gc_init_table.getValue(i,2);
  }
  for(i=0;i<this.groups.getNumberOfRows();i++){
    group_i_data = groups_dict[this.groups.getValue(i,0)];
    var data_table_group_i = new google.visualization.DataTable();
    data_table_group_i.addColumn('datetime');
    data_table_group_i.addColumn('number');
    for(key in group_i_data){
      data_table_group_i.addRow([group_i_data[key].date,group_i_data[key].sum]);
    }
//    var view_i = ;
//    view_i.setRows(view_i.getFilteredRows([{column: 0, value: this.groups.getValue(i, 0)},{column: 1},{column: 2}]));
//    view_i.hideColumns([0]);
    this.groups_views.push(new google.visualization.DataView(data_table_group_i))
  }
}

//-------------------------------------------------------------------
// Draw on load
//-------------------------------------------------------------------

combo = new graphtool.GC_COMBO_CHART();
combo.load_google_api_and_draw()
