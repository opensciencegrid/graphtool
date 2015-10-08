var graphtool = {};

graphtool.GC_COMMON = function(){
  //-------------------------------------------------------------------
  // Common Variables
  //-------------------------------------------------------------------
  
  // data and google charts variables
  this.data                        = {};
  this.title                       = "";
  this.json_query_metadata         = {};
  this.data_gc                     = null;
  this.chart                       = null;
  this.table                       = null;
  this.draw_table                  = false;
  
  // specific chart configuration that will be stored as a cookie
  this.serializable_properties     = ['chart_properties',
                                      'chart_formatters',
                                      'group_after',
                                      'draw_border',
                                      'custom_palette',
                                      'reverse_colors_to_fit'];
  this.chart_properties            = {};
  this.chart_formatters            = {};
  this.group_after                 = 20;
  this.draw_border                 = false;
  this.custom_palette              = false;
  this.reverse_colors_to_fit       = null;
  // Object to save the default configuration
  this.default_config              = null;
  
  this.legend_column_min_width     = 150;
  this.min_dimensions_px           = this.legend_column_min_width;
  this.max_dimensions_px           = 3000;
  this.min_others                  = 1;
  this.max_others                  = 100;
  
  this.colors_palette_custom       = [ "#e66266", "#fff8a9", "#7bea81", "#8d4dff", "#ffbc71", "#a57e81",
                                       "#baceac", "#00ccff", "#ccffff", "#ff99cc", "#cc99ff", "#ffcc99",
                                       "#3366ff", "#33cccc" ];
  this.colors_palette_gc           = [ "#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6",
                                       "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99",
                                       "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262",
                                       "#5574a6", "#3b3eac", "#b77322", "#16d620", "#b91383", "#f4359e",
                                       "#9c5935", "#a9c413", "#2a778d", "#668d1c", "#bea413", "#0c5922",
                                       "#743411"];  
  // formatters - Can only be created after google api is loaded
  this.no_decimal_formatter        = null;//new google.visualization.NumberFormat({ fractionDigits: 0 }); 
  this.two_decimal_formatter       = null;//new google.visualization.NumberFormat({ fractionDigits: 2 });
  this.date_formatter              = null;//new google.visualization.DateFormat({ pattern: "yy/MM/dd" });
  this.date_time_formatter         = null;//new google.visualization.DateFormat({ pattern: "yy/MM/dd HH:mm" });
  
  // ui-elements
  this.full_chart_div              = $("#full_chart_div");
  this.title_div                   = $("#title_div");
  this.chart_div                   = $("#chart_div");
  this.legend_div                  = $("#legend_div");
  this.legend_table                = $("#legend_table");
  this.footer_div                  = $("#footer_div");
  this.chart_div_options           = null;// $("#chart_div_options"); Starts as null and gets assigned later
  this.chart_div_options_accordion      = null;// $("#chart_div_options_accordion"); Starts as null and gets assigned later
  this.chart_div_options_loaded    = false;
  
  if(typeof js_chart_setup !== "undefined" && js_chart_setup instanceof Function)
    js_chart_setup(this);
  
  if(typeof load_server_data !== "undefined" && load_server_data instanceof Function)
    load_server_data(this);
}

//-------------------------------------------------------------------
// Common charts static functions 
//-------------------------------------------------------------------

graphtool.GC_COMMON.from_unix_utc_ts = function(ts){
  var temp_date = new Date();
  temp_date.setTime(ts*1000+temp_date.getTimezoneOffset()*60*1000);
  return temp_date;
}
        
// cumulative function must bind the column before usage
graphtool.GC_COMMON.cumulative_function = function(dataTable, rowNum){
  var cumulated = 0;
  for(var i = 0; i <= rowNum; i++)
    cumulated += dataTable.getValue(i,this.column);
  return cumulated;
}

graphtool.GC_COMMON.save_cookie = function (name,value) {
  var d = new Date();
  d.setTime(d.getTime() + (365*24*60*60*1000));
  var expires = "expires="+d.toUTCString();
  document.cookie = name + "=" + JSON.stringify(value) + "; " + expires;
}

graphtool.GC_COMMON.read_cookie = function (name) {
  var result = document.cookie.match(new RegExp(name + '=([^;]+)'));
  result && (result = JSON.parse(result[1]));
  return result;
}

graphtool.GC_COMMON.delete_cookie =  function (name) {
   document.cookie = name+'=; expires=Thu, 01-Jan-1970 00:00:01 GMT';
}

//-------------------------------------------------------------------
// Common charts non static functions 
//-------------------------------------------------------------------

graphtool.GC_COMMON.prototype.get_json_query_metadata_prop =  function(prop){
  if(typeof this.json_query_metadata !== 'undefined' && this.json_query_metadata != null && typeof this.json_query_metadata[prop] !== 'undefined'){
    return this.json_query_metadata[prop];
  }
  else
    return null;
}

graphtool.GC_COMMON.prototype.get_given_kw_prop =  function(prop){
  var given_kw = this.get_json_query_metadata_prop('given_kw');
  if( typeof given_kw[prop] !== 'undefined'){
    return given_kw[prop];
  }
  else
    return null;
}

// abstract chart name, must be implemented in child objects
graphtool.GC_COMMON.prototype.get_chart_name =  function(){
  return "abstract_chart_type"
}

// Cookie handling functions
graphtool.GC_COMMON.prototype.get_cookie_name = function () {
  // priorizes the matplotlib name if exists
  if(typeof this.json_query_metadata !== 'undefined' && typeof this.json_query_metadata.graph_type !== 'undefined' )
    return this.json_query_metadata.graph_type;
  return this.get_chart_name();
}

graphtool.GC_COMMON.prototype.get_data_2_save =  function(){
  var data_to_serialize = {}
  for(i in this.serializable_properties){
    if(typeof this[this.serializable_properties[i]] !== 'undefined'){
      data_to_serialize[this.serializable_properties[i]] = this[this.serializable_properties[i]];
    }
  }
  return data_to_serialize;
}

graphtool.GC_COMMON.prototype.load_config =  function(data_to_load){
  if(typeof data_to_load == 'object' && data_to_load != null){
    for(i in this.serializable_properties){
      if(typeof data_to_load[this.serializable_properties[i]] !== 'undefined'){
        this[this.serializable_properties[i]] = data_to_load[this.serializable_properties[i]];
      }
    }
  }
}

// only sets the default config the first time before loading any previously existent cookie
graphtool.GC_COMMON.prototype.set_default_config =  function(){
  if(this.default_config == null)
    this.default_config = this.get_data_2_save()
}

graphtool.GC_COMMON.prototype.gc_save_cookie =  function(){
  graphtool.GC_COMMON.save_cookie(this.get_cookie_name(),this.get_data_2_save())
  alert("Chart configuration saved!");
}

graphtool.GC_COMMON.prototype.gc_read_cookie =  function(){
  this.set_default_config();
  this.load_config(graphtool.GC_COMMON.read_cookie(this.get_cookie_name()));
}

graphtool.GC_COMMON.prototype.gc_reset_cookie =  function(){
  graphtool.GC_COMMON.delete_cookie(this.get_cookie_name())
  this.load_config(this.default_config);
  this.setup_options_menu(true);
  this.drawChart();
  alert("Chart configuration deleted!");  
}

//-------------------------------------------------------------------
// Common Drawing and Google Charts functions 
//-------------------------------------------------------------------

// Requires Override
graphtool.GC_COMMON.prototype.get_required_google_pkgs = function() {
  alert("Not google charts packages defined!");
  return [];
}

// Requires Override
graphtool.GC_COMMON.prototype.get_object_type = function() {
  alert("Not google charts object type defined!");
  return '';
}

// Requires Override
graphtool.GC_COMMON.prototype.load_chart_options = function() {
  alert("Not chart options defined!");
  return;
}

// Requires Override
graphtool.GC_COMMON.prototype.data_initial_setup = function() {
  alert("Not data initial setup defined!");  
  return;
}

graphtool.GC_COMMON.prototype.load_google_api_and_draw = function() {
  google.load("visualization", "1", {packages:["table"].concat(this.get_required_google_pkgs()), callback: this.load_google_callback.bind(this)});
}

graphtool.GC_COMMON.prototype.load_google_callback = function() {
  this.no_decimal_formatter        = new google.visualization.NumberFormat({ fractionDigits: 0 });
  this.two_decimal_formatter       = new google.visualization.NumberFormat({ fractionDigits: 2 });
  this.date_formatter              = new google.visualization.DateFormat({ pattern: "yyyy/MM/dd" });
  this.date_time_formatter         = new google.visualization.DateFormat({ pattern: "yy/MM/dd HH:mm" });
  this.data_initial_setup();
  this.chart = new (google.visualization[this.get_object_type()].bind(google.visualization,this.chart_div.get(0)));
  this.table = new google.visualization.Table(document.getElementById('table_div'));
  if(typeof this.chart_properties === "undefined"){
    this.chart_properties = {}
  }
  google.visualization.events.addListener(this.chart, 'ready', this.setup_options_menu.bind(this));
  this.gc_read_cookie();
  this.drawChart();
}

// This method should be defined in each one of the subclasses
graphtool.GC_COMMON.prototype.get_legend_labels_and_values = function(){
  //[['label1','label2','label3'],['value1','value2','value3']]
  return [[],[]]
}

graphtool.GC_COMMON.prototype.generate_html_legend = function(){
  var labels_and_values = this.get_legend_labels_and_values();
  var labels_list       = labels_and_values[0];
  var values_list       = labels_and_values.lenght <= 1? null : labels_and_values[1];
  var columns           = Math.floor(this.chart_div.width()/this.legend_column_min_width);
  var col_width         = this.chart_div.width()/columns;
  var values_defined    = values_list != null;
  var colors            = this.chart_properties.colors.slice(0);
  if(this.reverse_colors_to_fit && this.reverse_colors_to_fit >= 0){
    labels_list.reverse();
    colors.reverse();
    if(values_defined)
      values_list.reverse();
  }  
  this.legend_table.empty();
  var html = "";
  for(var i = 0 ; i < labels_list.length ; i++){
    var label = labels_list[i];
    var value = (values_defined && i < values_list.length)? values_list[i]:null;
    var color = colors[i%colors.length]
    if((i)%columns == 0)    
      html += "<tr>";
    html += "<td style='width:"+col_width+"px'>"+
               "<div class='gc_conv_wraper'>"+
                  "<div class='gc_conv_color_box' style='background-color:"+color+";'/>"+
                  "<div class='gc_conv_value_box'>"+label+(value? " ("+value+")":"")+"</div>"+
               "</div>"+
            "</td>";
    if((i+1)%columns == 0)
      html += "</tr>"
    
  }
  this.legend_table.append(html);
}

graphtool.GC_COMMON.prototype.set_colors = function(){
  // This is required to be able to draw bars descending keeping the same color order
  this.chart_properties.colors = this.custom_palette? this.colors_palette_custom:this.colors_palette_gc;
  if(this.reverse_colors_to_fit && this.reverse_colors_to_fit >= 0){
    var temp_list = this.chart_properties.colors;
    this.chart_properties.colors = [];
    for(var i = 0;i < this.reverse_colors_to_fit; i++){
      this.chart_properties.colors.splice(0,0,temp_list[i%temp_list.length])
    }
  }
}

// This method should be defined in each one of the subclasses
graphtool.GC_COMMON.prototype.calc_draw_table = function(){
  alert("Error, calc_draw_table function is not defined!");
}

// Must be implemented in the child classes
graphtool.GC_COMMON.prototype.get_non_saveable_chart_props = function() {
  return {}
}

graphtool.GC_COMMON.prototype.drawChart = function() {
  this.calc_draw_table();
  this.set_colors();
  this.generate_html_legend()
  var computed_props = {};
  for(prop in this.chart_properties)
    computed_props[prop] = this.chart_properties[prop];
  // Overrides the saveable properties with the chart specific ones
  var additional_props = this.get_non_saveable_chart_props();
  for(prop in additional_props)
    computed_props[prop] = additional_props[prop];  
  this.chart.draw(this.data_gc, computed_props);
  this.drawTable();
}

graphtool.GC_COMMON.prototype.drawTable = function() {
  if(this.draw_table && this.table){
    this.table.draw(this.data_gc, {});
  }
  else if(!this.draw_table && this.table){
    this.table.clearChart();
  }
}

graphtool.GC_COMMON.prototype.set_chart_size = function(width,height){
  if(width >= min_dimensions_px && width <= this.max_dimensions_px)
    this.chart_div.width(width);
  if(height >= 100 && height <= this.max_dimensions_px)
    this.chart_div.height(height);
  var selection = this.chart.getSelection();
  this.drawChart();
  this.chart.setSelection(selection);
}

graphtool.GC_COMMON.prototype.open_image_as_png = function(){
  $("#temp_div_export").remove()
  $('body').append('<div id="temp_div_export" style="display:none;"/>');//Hidden div for drawing
  var temp_div          = $("#temp_div_export");
  temp_div.append('<canvas id="temp_canvas_background"/>');
  var temp_canv         = $("#temp_canvas_background").get(0);
  temp_canv.width       = this.full_chart_div.width();
  temp_canv.height      = this.full_chart_div.height();
  // Creates the initial canvas
  html2canvas(this.full_chart_div.get(0), {
    onrendered: function(canvas) {
        var ctx = canvas.getContext('2d');
        // Create and image loader to draw svg/xml
        temp_div.append('<img id="temp_img_export_gc"/>');
        var loader            = $("#temp_img_export_gc").get(0);
        loader.width  = this.chart_div.width();
        loader.height = this.chart_div.height();
        // function called when the img element loads the svg/xml
        loader.onload = function(){
          // Clears the background of the google chart and draws it
          ctx.fillStyle="#FFFFFF";
          ctx.fillRect(0,0,loader.width,loader.height);
          ctx.drawImage( loader, (this.full_chart_div.width()-loader.width)/2, this.title_div.height(), loader.width, loader.height );
          // sets a background color for the image
          var ctx_background = temp_canv.getContext('2d');
          ctx_background.fillStyle="#FFFFFF";
          ctx_background.fillRect(0,0,canvas.width,canvas.width);
          ctx_background.drawImage(canvas, 0,0);
          temp_canv.toBlob(function(blob){
            saveAs(blob, "gratia-web-report.png");
          },"image/png");
        }.bind(this);
        var svg_node = this.chart_div.find("svg");// Inline SVG element from google charts
        var svgAsXML = (new XMLSerializer).serializeToString( svg_node.get(0) );
        loader.src = 'data:image/svg+xml,' + encodeURIComponent( svgAsXML );        
    }.bind(this)
  });
}

//-------------------------------------------------------------------
// Common Data Transform Functions
//-------------------------------------------------------------------

graphtool.GC_COMMON.prototype.pivot_results_to_gc_table = function(column_types){
  this.gc_init_table = new google.visualization.DataTable();
  var date_columns = []
  var num_columns  = []
  var i,j;
  var temp_date;
  for(var i = 0 ; i < this.data.length ; i++){
    var pivot_n_results = this.data[i][0].concat(this.data[i][1]);
    if(i == 0){
      for(j=0;j<pivot_n_results.length;j++){
        var type = 'number'
        var name = 'column-'+j
        if(column_types.length > j)
          type = column_types[j]
        if(pivot_n_results.length > j)
          name = String(pivot_n_results[j])
        
        if(type == 'datetime'){
          date_columns.push(j)
        }
        else if(type == 'number'){
          num_columns.push(j)
        }
        this.gc_init_table.addColumn(type,name);
      }
    }
    else{
      for(j in date_columns){
        pivot_n_results[date_columns[j]] = graphtool.GC_COMMON.from_unix_utc_ts(pivot_n_results[date_columns[j]]);
      }
      this.gc_init_table.addRow(pivot_n_results);
    }
  }
  for(j in num_columns){  
    this.no_decimal_formatter.format(this.gc_init_table,num_columns[j])
  }
}

//-------------------------------------------------------------------
// Common UI functions 
//-------------------------------------------------------------------
  
graphtool.GC_COMMON.prototype.setup_options_menu = function(force_reload){
  if(typeof force_reload !== 'undefined' && force_reload==true){
    $("#options_accordion_wrapper").empty();
    this.chart_div_options_loaded = false;
  }
  if(!this.chart_div_options_loaded){
    $("#options_accordion_wrapper").html(  '<div id="chart_div_options_accordion">'+
                                            '<h3>Chart &amp; Export Options:</h3>'+
                                            '<div id="chart_div_options_accordion_inner_panel" style="overflow:visible">'+
                                              '<button id="save_chart_config">Save Current Chart Configuration</button>'+
                                              '<button id="reset_chart_config">Reset Chart Configuration</button>'+
                                              '<div id="chart_div_options">'+
                                                '<ul>'+
                                                '</ul>'+
                                              '</div>'+
                                            '</div>'+
                                          '</div>');
    $("#save_chart_config").button().click(this.gc_save_cookie.bind(this));
    $("#reset_chart_config").button().click(this.gc_reset_cookie.bind(this));
    this.chart_div_options_accordion =$("#chart_div_options_accordion");    
    this.chart_div_options      = $("#chart_div_options");
    this.load_chart_options();
    this.chart_div_options.tabs();
    this.chart_div_options_accordion.accordion({
      collapsible: true,
      active: false,
      heightStyle: "content"
    });
    this.chart_div_options_loaded = true;
  }
}

graphtool.GC_COMMON.prototype.include_options_tab = function(id,title,html_code){
  this.chart_div_options.find("ul").first().append('<li><a href="#'+id+'">'+title+'</a></li>')
  this.chart_div_options.append('<div id="'+id+'">'+html_code+'</div>')
}

graphtool.GC_COMMON.prototype.include_size_options = function(){
  var html_code =
    '<div>'+
    '<b>Width('+this.min_dimensions_px+'px,'+this.max_dimensions_px+'px):</b><span id="width-label">'+this.chart_div.width()+'</span><div id="chart-width" style="width:300px"></div><br/>'+
    '<b>Height('+this.min_dimensions_px+'px,'+this.max_dimensions_px+'px):</b><span id="height-label">'+this.chart_div.height()+'</span><div id="chart-height" style="width:300px"></div><br/>'+
    '</div>';
  this.include_options_tab("chart_dimensions","Chart Size",html_code)
  $("#chart-width").slider({ 
      min:     this.min_dimensions_px,
      max:     this.max_dimensions_px,
      value:   this.chart_div.width(),
      change:  function( event, ui ){this.set_chart_size(ui.value,-1);}.bind(this),
      slide:   function( event, ui ){$("#width-label").text( ui.value );}.bind(this)
  });
  $("#chart-height").slider({ 
      min:     this.min_dimensions_px,
      max:     this.max_dimensions_px,
      value:   this.chart_div.height(),
      change:  function( event, ui ){this.set_chart_size(-1,ui.value);}.bind(this),
      slide:   function( event, ui ){$("#height-label").text( ui.value );}.bind(this)
  });
}

graphtool.GC_COMMON.prototype.include_export_options = function (){
  var html_code = 
    '<div><button id="export_as_png_button">Export as PNG</button></div>';
  this.include_options_tab("chart_export","Export",html_code);
  $("#export_as_png_button")
      .button()
      .click(function( event ) {
          this.open_image_as_png();
      }.bind(this));
}

graphtool.GC_COMMON.prototype.include_table_options = function (){
  this.include_options_tab("table_ops","Data Table","");
  this.include_alternating_buttons("table_ops","data_table","Hide Data Table","Show Data Table",
    function(){
      this.draw_table = !this.draw_table;
      this.drawChart();
    }.bind(this),
    function(){
      return (this.draw_table);
    }.bind(this));
}

graphtool.GC_COMMON.prototype.include_color_n_border_options = function (){
  this.include_options_tab("color_n_border_ops","Colors & Border","");
  this.include_alternating_buttons("color_n_border_ops","color_palette","Google Charts Colors","Gratia Web Colors",
    function(){
      this.custom_palette = !this.custom_palette;
      this.drawChart();
    }.bind(this),
    function(){
      return (this.custom_palette);
    }.bind(this));
  this.include_alternating_buttons("color_n_border_ops","borders","Remove Borders","Draw Borders",
    function(){
      this.draw_border = !this.draw_border;
      this.drawChart();
    }.bind(this),
    function(){
      return (this.draw_border);
    }.bind(this));  
}

graphtool.GC_COMMON.prototype.include_others_options = function(){
  var html_code =
    '<div>'+
    '<b>Group OTHERS after:</b><span id="g_others_label">'+this.group_after+'</span><div id="g_others_slider" style="width:300px"></div><br/>'+
    '</div>';
  this.include_options_tab("others_after_size","Others Group",html_code)
  $("#g_others_slider").slider({ 
      min:     this.min_others,
      max:     this.max_others,
      value:   this.group_after,
      change:  function( event, ui ){this.group_after=ui.value;this.drawChart();}.bind(this),
      slide:   function( event, ui ){$("#g_others_label").text( ui.value );}.bind(this)
  });
}

/**
 * Params:
 * ops_id              - Id of the div where the buttons will be included
 * label_off           - Label on the button when off
 * label_on            - Label on the button when on
 * func_alternate_val  - function that alternates the value (must be correctly binded)
 * func_is_on          - function that tells if the value is on or off, should return a boolean value (must be correctly binded)
 */
graphtool.GC_COMMON.prototype.include_alternating_buttons = function(tab_id,ops_id,label_off,label_on,func_alternate_val,func_is_on){
  var class_off = ops_id+"_off";
  var class_on  = ops_id+"_on";
  var html_code = "<button class='"+class_off+"'>"+label_off+"</button><button class='"+class_on+"'>"+label_on+"</button>"
  $("#"+tab_id).append(html_code);
  var hide_show_func = function(){
    if(this.func_is_on.call()){
      $("."+class_on).hide()
      $("."+class_off).show()
    }
    else{
      $("."+class_on).show()
      $("."+class_off).hide()
    }
  }
  hide_show_func = hide_show_func.bind({func_is_on:func_is_on})
  $("."+class_on+", ."+class_off)
      .button()
      .click(function(){
        func_alternate_val.call();
        hide_show_func.call();
      });
  hide_show_func.call();
}

graphtool.GC_COMMON.prototype.load_default_options_tabs = function(){
  this.include_size_options();
  this.include_export_options();
}

//-------------------------------------------------------------------
// Common Formatting functions 
//-------------------------------------------------------------------

graphtool.GC_COMMON.echo_func = function(val){return val;};

graphtool.GC_COMMON.format_percentage = function(val){
  return numeral((val*100)).format('0.00');
}

graphtool.GC_COMMON.format_number_2dec = function(val){
  return numeral(val).format('0,0.00');
}

graphtool.GC_COMMON.format_common_name = function(val){
  var parts = val.split('/CN=');
  var result = '';
  for(var i in parts)
    if(parts[i])
      result += parts[i].trim() + " / ";
  return result.substring(0, result.lastIndexOf(" / "));
}

//-------------------------------------------------------------------
//Helper functions 
//-------------------------------------------------------------------

graphtool.GC_COMMON.sum_with_default_nulls = function(val1,val2,default_null_vall){
  if(!val1)
    val1 = default_null_vall;
  if(!val2)
    val2 = default_null_vall;
  return val1 + val2;
}