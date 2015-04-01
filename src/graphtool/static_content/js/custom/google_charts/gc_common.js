  
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
    var table = [['Location', 'Parent', 'Market trade volume (size)', 'Market increase/decrease (color)'],
                 [' ',    null,                 0,                               0]]

    data_tree_to_table(data_tree,' ',table)
    return table
  }
  
  function data_tree_to_table(tree,parent,table){
    for(var key in tree){
      var childs = tree[key]
      var id = parent+"/"+key
      if(childs instanceof Array){
        if(childs.length >= 2)
         table.push([id, parent, childs[0], childs[1]]);
        else if(childs.length == 1)
         table.push([id, parent, childs[0], childs[0]]);
        else 
         table.push([id, parent, 1, 1]);
      }
      else{
        table.push([id, parent, 0, 0])
        data_tree_to_table(childs,id,table);
      }
    }
  }