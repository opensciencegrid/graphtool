if(typeof graphtool === "undefined" || graphtool === null)
  var graphtool = {};
//-------------------------------------------------------------------
// Collections missing in ecmascript5
//-------------------------------------------------------------------
  
graphtool.is_in_array = function(array,obj){
  for(var i in array){
    if(array[i] == obj)
      return true;
  }
  return false;
};

graphtool.first_indexof_in_array = function(array,obj){
  for(var i in array){
    if(array[i] == obj)
      return parseInt(i);
  }
  return -1;
};

graphtool.hashcode = function(string){
  var hash = 0;
  if (string.length === 0) return hash;
  for (i = 0; i < string.length; i++) {
      var char_i = string.charCodeAt(i);
      hash = ((hash<<5)-hash)+char_i;
      hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
};

//-------------------------------------------------------------------
// Simple SET collection
//-------------------------------------------------------------------

graphtool.JS_SET = function(){
  this.hash_table = {};
  this.size       = 0;
};

graphtool.JS_SET.prototype.add = function(obj){
  var hash = graphtool.hashcode(String(obj));
  if(!(hash in this.hash_table)){
    this.hash_table[hash] = [];
  }
  if(!graphtool.is_in_array(this.hash_table[hash],obj))
    this.hash_table[hash].push(obj);
  this.size++;
};

graphtool.JS_SET.prototype.has = function(obj){
  var hash = graphtool.hashcode(String(obj));
  if(typeof this.hash_table[hash] !== "undefined" && this.hash_table[hash] !== null){
    return graphtool.is_in_array(this.hash_table[hash],obj);
  }
  return false;
};

graphtool.JS_SET.prototype.clear = function(obj){
  this.hash_table = {};
  this.size       = 0;
};

//-------------------------------------------------------------------
// Simple MAP collection
//-------------------------------------------------------------------

graphtool.JS_MAP = function(){
  this.hash_table_key = {};
  this.hash_table_val = {};
  this.size           = 0;
};

graphtool.JS_MAP.prototype.set = function(key,obj){
  var hash = graphtool.hashcode(String(key));
  if(!(hash in this.hash_table_key)){
    this.hash_table_key[hash] = [];
    this.hash_table_val[hash] = [];
  }
  if(graphtool.is_in_array(this.hash_table_key[hash],key)){
    var index = graphtool.first_indexof_in_array(this.hash_table_key[hash],key)
    this.hash_table_val[hash][index] = obj;
  }
  else{
    this.hash_table_key[hash].push(key);
    this.hash_table_val[hash].push(obj);
    this.size++;
  }
};

graphtool.JS_MAP.prototype.get = function(key){
  var hash = graphtool.hashcode(String(key));
  if(typeof this.hash_table_key[hash] !== "undefined" && this.hash_table_key[hash] !== null){
    var index = graphtool.first_indexof_in_array(this.hash_table_key[hash],key);
    if(index >= 0)
      return this.hash_table_val[hash][index];
  }
  return null;
};

graphtool.JS_MAP.prototype.has = function(key){
  var hash = graphtool.hashcode(String(key));
  if(typeof this.hash_table_key[hash] !== "undefined" && this.hash_table_key[hash] !== null){
    return graphtool.is_in_array(this.hash_table_key[hash],key);
  }
  return false;
};

graphtool.JS_MAP.prototype.clear = function(){
  this.hash_table_key = {};
  this.hash_table_val = {};
  this.size           = 0;
};
