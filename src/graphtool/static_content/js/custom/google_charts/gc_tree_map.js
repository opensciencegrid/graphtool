

graphtool.GC_TREE_MAP = function(){
  graphtool.GC_COMMON.call(this)
  
  //-------------------------------------------------------------------
  // TreeMap Variables 
  //-------------------------------------------------------------------
  
  this.levels             = [];
  this.results_titles     = [];
  this.num_levels         = 0;
  this.data_in_gc_format  = null;
  this.formatters         = null;
  google.load("visualization", "1", {packages:["treemap"], callback: this.load_google_callback.bind(this)});
};

graphtool.GC_TREE_MAP.prototype = graphtool.GC_COMMON.prototype
graphtool.GC_TREE_MAP.prototype.constructor = graphtool.GC_TREE_MAP

//-------------------------------------------------------------------
// Data Transformation functions 
//-------------------------------------------------------------------

graphtool.GC_TREE_MAP.prototype.load_formatters_json = function(){
  if(typeof this.chart_formatters == "undefined"){
    var level_formatters = [];
    for(i = 0 ; i < this.num_levels ; i++)
      level_formatters.push(null);
    this.chart_formatters = {
        level_formatters :  level_formatters,
        size_formatter   :  null,
        value_formatter  :  null
      }
  }
  this.formatters = {};
  var level_formatters_funcs = [];
  if(this.chart_formatters.level_formatters){
    if(this.chart_formatters.level_formatters instanceof Array)
      level_formatters_funcs = this.chart_formatters.level_formatters;
    else
      for(var i = 0 ; i < this.num_levels ; i++)
        level_formatters_funcs.push(this.chart_formatters.level_formatters);
  }
  // Fills empty levels with echo_func functions
  while(level_formatters_funcs.length < this.num_levels)
    level_formatters_funcs.push(graphtool.GC_COMMON.echo_func);
  for(var i = 0 ; i < level_formatters_funcs.length ; i++){
    if(!(level_formatters_funcs[i] instanceof Function))
      level_formatters_funcs[i] = graphtool.GC_COMMON.echo_func;
  }    
  this.formatters.level_formatters = level_formatters_funcs;
  // Size Formatter
  if(this.chart_formatters.size_formatter && this.chart_formatters.size_formatter instanceof Function)
    this.formatters.size_formatter = this.chart_formatters.size_formatter;
  else
    this.formatters.size_formatter = graphtool.GC_COMMON.echo_func;
  // Value Formatter
  if(this.chart_formatters.value_formatter && this.chart_formatters.value_formatter instanceof Function)
    this.formatters.value_formatter = this.chart_formatters.value_formatter;
  else
    this.formatters.value_formatter = graphtool.GC_COMMON.echo_func;
}

graphtool.GC_TREE_MAP.prototype.get_levels_formatters = function(levels_order){
  if(levels_order){
    var tmp_formatters = [];
    for(var k = 0 ; k < levels_order.length ; k++)
      if(levels_order[k] < this.formatters.level_formatters.length)
        tmp_formatters.push(this.formatters.level_formatters[levels_order[k]]);
      else
        tmp_formatters.push(graphtool.GC_COMMON.echo_func)
    return tmp_formatters;
  }
  return this.formatters.level_formatters;
}

graphtool.GC_TREE_MAP.prototype.sum_and_avg = function(results_1,results_2,weighted_avg){
  if(results_1.length >= 2 && results_2.length >= 2){
    var new_results = [(results_1[0]+results_2[0]),0];
    if(weighted_avg)
      new_results[1] = (results_1[0]*results_1[1]+results_2[0]*results_2[1])/new_results[0];
    else
      new_results[1] = (results_1[1]+results_2[1])/2;
    return new_results
  }
  else if(results_1.length == 1 && results_2.length == 1)
    return [(results_1[0]+results_2[0]),1]
  else
    return [1,1]
}

graphtool.GC_TREE_MAP.prototype.table_group_to_json_tree = function(data_var,levels_order){
  var data_tree = {}
  var level_formatter_funcs = this.get_levels_formatters(levels_order);
  var weighted_avg = (typeof this.chart_properties.useWeightedAverageForAggregation == "undefined")? false:this.chart_properties.useWeightedAverageForAggregation;
  for(var i = 1 ; i < data_var.length ; i++){
    var pivots          = data_var[i][0];
    var results         = data_var[i][1];
    var previous_level  = data_tree;
    // Specific level organization
    if(levels_order){
      for(var k = 0 ; k < levels_order.length ; k++){
        var j = levels_order[k];
        var node_name = level_formatter_funcs[k](pivots[j])
        if(k == levels_order.length-1)
          if(!previous_level[node_name])
            previous_level[node_name] = results;
          else{
            previous_level[node_name] = this.sum_and_avg(previous_level[node_name],results,weighted_avg);
          }
        else{
          if(!previous_level[node_name])
            previous_level[node_name] = {};
          previous_level = previous_level[node_name]
        }
      }
    }
    // Default level organization
    else{
      for(var j = 0 ; j < pivots.length ; j++){
        var node_name = level_formatter_funcs[j](pivots[j]);
        if(j == pivots.length-1)
          if(!previous_level[node_name])
            previous_level[node_name] = results;
          else{
            previous_level[node_name] = this.sum_and_avg(previous_level[node_name],results,weighted_avg);
          }
        else{
          if(!previous_level[node_name])
            previous_level[node_name] = {};
          previous_level = previous_level[node_name]
        }
      }
    }
  }
  return data_tree;
}

graphtool.GC_TREE_MAP.prototype.get_levels_and_results_names = function(data_var){
  var i = null;// single declaration for i index auxiliary variable
  for(i = 1 ; i < data_var.length ; i++)
    if(data_var[i][0].length > this.num_levels)
      this.num_levels = data_var[i][0].length;
  this.levels = data_var[0][0].slice(0);
  for(i = 0 ; i < this.num_levels ; i++){
    if(i >= this.levels.length)
      this.levels.push((i+1)+"-Unkown Level Title");
    else
      this.levels[i] = (i+1)+"-"+this.levels[i] ;
  }
  this.results_titles = data_var[0][1];
  if(this.results_titles.length == 1){
    this.results_titles.push("Color");
  }
  else if(this.results_titles.length <= 0){
    this.results_titles.push("Size");
    this.results_titles.push("Color");
  }
}

graphtool.GC_TREE_MAP.prototype.json_tree_to_table = function(tree,parent,table,pivot_titles,level){
  for(var key in tree){
    var childs = tree[key]
    var var_title = (pivot_titles.length > level) ? "<b>"+pivot_titles[level]+":</b>":"";
    var id = parent+"<br/>"+var_title+(key? key:'UNKNOWN')
    var node = {v:id, f:key? key:'UNKNOWN'}
    if(childs instanceof Array){
      if(childs.length >= 2)
        table.push([node, parent, childs[0], childs[1]]);
      else if(childs.length == 1)
        table.push([node, parent, childs[0], 1]);
      else 
        table.push([node, parent, 1, 1]);
    }
    else{
      table.push([node, parent, 0, 0])
      this.json_tree_to_table(childs,id,table,pivot_titles,level+1);
    }
  }
}

graphtool.GC_TREE_MAP.prototype.table_group_to_table_tree = function (data_var,levels_order){
  var data_tree = this.table_group_to_json_tree(data_var,levels_order);
  
  var root;
  if(typeof this.title == "undefined" || !this.title)
    root = ' ';
  else
    root = this.title;
  var root_id = '<b>'+root+'</b>';
  var table = [['Node',            'Parent',      this.results_titles[0],               this.results_titles[1]],
               [{v:root_id, f:root},    null,                 0,                               0]]

  var pivot_titles = data_var[0][0];
  if(!(pivot_titles instanceof Array))
    pivot_titles = [pivot_titles]
  if(levels_order){
    var tmp_titles = []
    for(var k = 0 ; k < levels_order.length ; k++){
      var index = levels_order[k];
      if(index < pivot_titles.length)
        tmp_titles.push(pivot_titles[index]);
      else
        tmp_titles.push(' ');
    }
    pivot_titles = tmp_titles;
  }
  this.json_tree_to_table(data_tree,root_id,table,pivot_titles,0)
  return table
}

//-------------------------------------------------------------------
// UI functions 
//-------------------------------------------------------------------

graphtool.GC_TREE_MAP.prototype.include_level_order_options = function(){
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
    '  <b>Active Levels</b>'+
    '  <div id="sortable_active" class="active-inactive-connected-sortable">';
  for(var i = 0 ; i < this.levels.length ; i++)
    html_code += '<div id="'+i+'-level" class="ui-state-default"><span class="ui-icon ui-icon-arrowthick-2-n-s"></span>'+this.levels[i]+'</div>';
  html_code +=
    '  </div>'+
    '</div></td>'+
    '<td><span class="ui-icon ui-icon-arrowthick-2-e-w"></td>'+
    '<td style="vertical-align: top;"><div>'+
    '  <b>Inactive Levels</b>'+
    '  <div id="sortable_inactive" class="active-inactive-connected-sortable"></div>'+
    '</div></td>'+
    '</tr></table>'+      
    '<button id="rerender-by-order">Draw Plot</button>';
  this.include_options_tab("tree_level_order","Levels Order",html_code);
  
  $( "#sortable_active, #sortable_inactive" ).sortable({
    connectWith: ".active-inactive-connected-sortable"
  }).disableSelection();
  // fix the max height as the height of the active levels
  max_h = $("#sortable_active").height();
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
      var index_order = [];
      for(var i = 0 ; i < order_str.length ; i++)
        index_order.push(parseInt(order_str[i].split('-')[0]));
      this.data_in_gc_format = this.table_group_to_table_tree(this.data,index_order);
      this.data_gc = google.visualization.arrayToDataTable(this.data_in_gc_format);
      this.chart.draw(this.data_gc, this.chart_properties);
    }.bind(this));
}

graphtool.GC_TREE_MAP.prototype.load_tree_options = function(){
  this.load_default_options_tabs();
  this.include_level_order_options();
}

//-------------------------------------------------------------------
// Charts functions 
//-------------------------------------------------------------------

graphtool.GC_TREE_MAP.prototype.defaultToolTip = function(row, size, value) {
  return '<div style="background:#fff; padding:5px; border-style:solid">' +
         '  '+this.data_gc.getValue(row, 0)+'<br/>'+
         '  <b>'+this.data_gc.getColumnLabel(2)+':</b> '+this.formatters.size_formatter(size)+'<br/>'+
         '  <b>'+this.data_gc.getColumnLabel(3)+':</b> '+this.formatters.value_formatter(value)+'<br/>'+
         '</div>';
}

graphtool.GC_TREE_MAP.prototype.drawChart = function() {
  this.data_in_gc_format = this.table_group_to_table_tree(this.data);
  this.data_gc = google.visualization.arrayToDataTable(this.data_in_gc_format);
  this.chart.draw(this.data_gc, this.chart_properties);
}

graphtool.GC_TREE_MAP.prototype.load_google_callback = function() {
  // first get number of levels and then load the json formatters description
  this.get_levels_and_results_names(this.data);
  this.load_formatters_json();
  // create plot afterwards
  this.chart = new google.visualization.TreeMap(this.chart_div.get(0));
  if(typeof this.chart_properties == "undefined"){
    this.chart_properties = {
        minColor:        '#d00',
        midColor:        '#dd0',
        maxColor:        '#0d0',
        headerHeight:    30,
        fontColor:       'black',
        showScale:       true,
        generateTooltip: this.defaultToolTip.bind(this)
      }
  }
  
  google.visualization.events.addListener(this.chart, 'ready', this.setup_options_menu.bind(this,this.load_tree_options.bind(this)));
  this.drawChart()
}

//-------------------------------------------------------------------
// Draw on load
//-------------------------------------------------------------------

tree = new graphtool.GC_TREE_MAP();
