//-------------------------------------------------------------------
// TreeMap Variables 
//-------------------------------------------------------------------

levels = null;

//-------------------------------------------------------------------
// Data Transformation functions 
//-------------------------------------------------------------------

  function table_group_to_table_tree(data_var){
    var data_tree = {}
    for(var i = 1 ; i < data.length ; i++){
      var pivots = data[i][0]
      var results = data[i][1]
      var previous_level = data_tree
      for(var j = 0 ; j < pivots.length ; j++){
        if(j == pivots.length-1)
          previous_level[pivots[j]] = results;
        else{
          if(!previous_level[pivots[j]])
            previous_level[pivots[j]] = {};
          previous_level = previous_level[pivots[j]]
        }
      }
    }
    
    var results_titles = data[0][1];
    if(results_titles.length == 1){
      results_titles.push(results_titles[0]);
    }
    else if(results_titles.length <= 0){
      results_titles.push("Size");
      results_titles.push("Color");
    }
    var root;
    if(typeof title === 'undefined' || !title)
      root = ' ';
    else
      root = title;
    root_id = '<b>'+root+'</b>';
    var table = [['Node',            'Parent',      results_titles[0],               results_titles[1]],
                 [{v:root_id, f:root},    null,                 0,                               0]]

    var pivot_titles = data[0][0];
    if(!(pivot_titles instanceof Array))
      pivot_titles = [pivot_titles]
    data_tree_to_table(data_tree,root_id,table,pivot_titles,0)
    return table
  }
  
  function data_tree_to_table(tree,parent,table,pivot_titles,level){
    for(var key in tree){
      var childs = tree[key]
      var var_title = (pivot_titles.length > level) ? "<b>"+pivot_titles[level]+":</b>":"";
      var id = parent+"<br/>"+var_title+key
      var node = {v:id, f:key}
      if(childs instanceof Array){
        if(childs.length >= 2)
         table.push([node, parent, childs[0], childs[1]]);
        else if(childs.length == 1)
         table.push([node, parent, childs[0], childs[0]]);
        else 
         table.push([node, parent, 1, 1]);
      }
      else{
        table.push([node, parent, 0, 0])
        data_tree_to_table(childs,id,table,pivot_titles,level+1);
      }
    }
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
    data_gc = google.visualization.arrayToDataTable(data);
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
      setup_options_menu(load_default_options_tabs);
    });    
    chart.draw(data_gc, chart_properties);
  }

  js_chart_setup();
  google.load("visualization", "1", {packages:["treemap"], callback: drawChart });

