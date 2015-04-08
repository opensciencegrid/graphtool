//-------------------------------------------------------------------
// TreeMap Variables 
//-------------------------------------------------------------------

var levels             = [];
var results_titles     = [];
var num_levels         = 0;
var data_gc_format     = null;

//-------------------------------------------------------------------
// Data Transformation functions 
//-------------------------------------------------------------------

  function sum_and_avg(results_1,results_2,weighted_avg){
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

  function table_group_to_json_tree(data_var,levels_order){
    var data_tree = {}
    var weighted_avg = (typeof chart_properties.useWeightedAverageForAggregation === undefined)? false:chart_properties.useWeightedAverageForAggregation;
    for(var i = 1 ; i < data_var.length ; i++){
      var pivots          = data_var[i][0];
      var results         = data_var[i][1];
      var previous_level  = data_tree;
      // Specific level organization
      if(levels_order){
        for(var k = 0 ; k < levels_order.length ; k++){
          var j = levels_order[k];
          if(k == levels_order.length-1)
            if(!previous_level[pivots[j]])
              previous_level[pivots[j]] = results;
            else{
              previous_level[pivots[j]] = sum_and_avg(previous_level[pivots[j]],results,weighted_avg);
            }
          else{
            if(!previous_level[pivots[j]])
              previous_level[pivots[j]] = {};
            previous_level = previous_level[pivots[j]]
          }
        }
      }
      // Default level organization
      else{
        for(var j = 0 ; j < pivots.length ; j++){
          if(j == pivots.length-1)
            if(!previous_level[pivots[j]])
              previous_level[pivots[j]] = results;
            else{
              previous_level[pivots[j]] = sum_and_avg(previous_level[pivots[j]],results,weighted_avg);
            }
          else{
            if(!previous_level[pivots[j]])
              previous_level[pivots[j]] = {};
            previous_level = previous_level[pivots[j]]
          }
        }
      }
    }
    return data_tree;
  }
  
  function get_levels_and_results_names(data_var){
    var i = null;// single declaration for i index auxiliary variable
    for(i = 1 ; i < data_var.length ; i++)
      if(data_var[i][0].length > num_levels)
        num_levels = data_var[i][0].length;
    levels = data_var[0][0].slice(0);
    for(i = 0 ; i < num_levels ; i++){
      if(i >= levels.length)
        levels.push((i+1)+"-Unkown Level Title");
      else
        levels[i] = (i+1)+"-"+levels[i] ;
    }
    results_titles = data_var[0][1];
    if(results_titles.length == 1){
      results_titles.push("Color");
    }
    else if(results_titles.length <= 0){
      results_titles.push("Size");
      results_titles.push("Color");
    }
  }
  
  function json_tree_to_table(tree,parent,table,pivot_titles,level){
    for(var key in tree){
      var childs = tree[key]
      var var_title = (pivot_titles.length > level) ? "<b>"+pivot_titles[level]+":</b>":"";
      var id = parent+"<br/>"+var_title+key
      var node = {v:id, f:key}
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
        json_tree_to_table(childs,id,table,pivot_titles,level+1);
      }
    }
  }
  
  function table_group_to_table_tree(data_var,levels_order){
    var data_tree = table_group_to_json_tree(data_var,levels_order);
    
    var root;
    if(typeof title === 'undefined' || !title)
      root = ' ';
    else
      root = title;
    var root_id = '<b>'+root+'</b>';
    var table = [['Node',            'Parent',      results_titles[0],               results_titles[1]],
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
    json_tree_to_table(data_tree,root_id,table,pivot_titles,0)
    return table
  }

  function tree_initial_setup(){
    get_levels_and_results_names(data);
    data_gc_format = table_group_to_table_tree(data,null);
  }
  
//-------------------------------------------------------------------
// UI functions 
//-------------------------------------------------------------------
  
  function include_level_order_options(){
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
    for(var i = 0 ; i < levels.length ; i++)
      html_code += '<div id="'+i+'-level" class="ui-state-default"><span class="ui-icon ui-icon-arrowthick-2-n-s"></span>'+levels[i]+'</div>';
    html_code +=
      '  </div>'+
      '</div></td>'+
      '<td><span class="ui-icon ui-icon-arrowthick-2-e-w"></td>'+
      '<td style="vertical-align: top;"><div>'+
      '  <b>Inactive Levels</b>'+
      '  <div id="sortable_inactive" class="active-inactive-connected-sortable"></div>'+
      '</div></td>'+
      '</tr></table>'+      
      '<button id="rerender-by-order">Draw Plot</button>'
    include_options_tab("tree_level_order","Levels Order",html_code);
    
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
        data_gc_format = table_group_to_table_tree(data,index_order);
        data_gc = google.visualization.arrayToDataTable(data_gc_format);
        chart.draw(data_gc, chart_properties);
      });
  }

  function load_tree_options(){
    load_default_options_tabs();
    include_level_order_options();
  }
  
//-------------------------------------------------------------------
// Charts functions 
//-------------------------------------------------------------------
  
  function defaultToolTip(row, size, value) {
    return '<div style="background:#fff; padding:5px; border-style:solid">' +
           '  '+data_gc.getValue(row, 0)+'<br/>'+
           '  <b>'+data_gc.getColumnLabel(2)+':</b>'+size+'<br/>'+
           '  <b>'+data_gc.getColumnLabel(3)+':</b>'+value+'<br/>'+
           '</div>';
  }

  function drawChart() {
    data_gc = google.visualization.arrayToDataTable(data_gc_format);
    chart = new google.visualization.TreeMap(chart_div.get(0));
    if(typeof chart_properties === 'undefined'){
      chart_properties = {
          minColor:        '#d00',
          midColor:        '#dd0',
          maxColor:        '#0d0',
          headerHeight:    30,
          fontColor:       'black',
          showScale:       true,
          generateTooltip: defaultToolTip
        }
    }
    google.visualization.events.addListener(chart, 'ready', function(){
      setup_options_menu(load_tree_options);
    });
    chart.draw(data_gc, chart_properties);
  }

  js_chart_setup();
  tree_initial_setup();
  google.load("visualization", "1", {packages:["treemap"], callback: drawChart });

