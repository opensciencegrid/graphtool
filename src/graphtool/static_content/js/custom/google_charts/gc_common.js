var graphtool = {};

graphtool.GC_COMMON = function(){
  //-------------------------------------------------------------------
  // Common Variables
  //-------------------------------------------------------------------
  
  // data and google charts variables
  this.title                       = "";
  this.data                        = {};
  this.chart_properties            = {};
  
  this.chart_formatters            = {};
  this.data_gc                     = null;
  this.chart                       = null;
  this.table                       = null;
  this.conv_column_min_width       = 233;
  this.min_dimensions_px           = 100;
  this.max_dimensions_px           = 3000;
  this.group_after                 = 20;
  this.min_others                  = 1;
  this.max_others                  = 100;
  this.draw_border                 = false;
  this.draw_table                  = false;
  this.custom_palette              = false;
  this.reverse_colors_to_fit       = null
  this.colors_palette_custom       = [ "#e66266", "#fff8a9", "#7bea81", "#8d4dff", "#ffbc71", "#a57e81",
                                       "#baceac", "#00ccff", "#ccffff", "#ff99cc", "#cc99ff", "#ffcc99",
                                       "#3366ff", "#33cccc" ];
  this.colors_palette_gc           = [ "#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6",
                                       "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99",
                                       "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262",
                                       "#5574a6", "#3b3eac", "#b77322", "#16d620", "#b91383", "#f4359e",
                                       "#9c5935", "#a9c413", "#2a778d", "#668d1c", "#bea413", "#0c5922",
                                       "#743411"];  
  
  // ui-elements
  this.chart_div                   = $("#chart_div");
  this.legend_table                = $("#legend_table");  
  this.chart_div_options           = $("#chart_div_options");
  this.chart_div_options_wrap      = $("#chart_div_options_wrap");
  this.chart_div_options_loaded    = false;
  
  if(typeof js_chart_setup != "undefined" && js_chart_setup instanceof Function)
    js_chart_setup(this);
  
  if(typeof load_server_data != "undefined" && load_server_data instanceof Function)
    load_server_data(this);
}

//-------------------------------------------------------------------
// Common charts functions 
//-------------------------------------------------------------------

// cumulative function must bind the column before usage
graphtool.GC_COMMON.cumulative_function = function(dataTable, rowNum){
  var cumulated = 0;
  for(var i = 0; i <= rowNum; i++)
    cumulated += dataTable.getValue(i,this.column);
  return cumulated;
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
  var columns           = Math.floor(this.chart_div.width()/this.conv_column_min_width);
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
  for(var j ; j < columns ; j++)
    html += "<col width='"+col_width+"px'/>"
  for(var i in labels_list){
    var label = labels_list[i];
    var value = (values_defined && i < values_list.length)? values_list[i]:null;
    var color = colors[i%colors.length]
    if(i==0)
      html += "<tr>";
    html += "<td style='width:"+col_width+"px'>"+
               "<div class='gc_conv_wraper'>"+
                  "<div class='gc_conv_color_box' style='background-color:"+color+";'/>"+
                  "<div class='gc_conv_value_box'>"+label+(value? "<br/>("+value+")":"")+"</div>"+
               "</div>"+
            "</td>";
    if((i+1)%columns == 0)
      html += "</tr>"
    
  }
  this.legend_table.append(html);
}

graphtool.GC_COMMON.prototype.set_colors = function(){
  this.chart_properties.colors = this.custom_palette? this.colors_palette_custom:this.colors_palette_gc;
  if(this.reverse_colors_to_fit && this.reverse_colors_to_fit >= 0){
    var temp_list = this.chart_properties.colors;
    this.chart_properties.colors = [];
    for(var i = 0;i < this.reverse_colors_to_fit; i++){
      this.chart_properties.colors.splice(0,0,temp_list[i%temp_list.length])
    }
  }
  this.generate_html_legend()
}

// This method should be defined in each one of the subclasses
graphtool.GC_COMMON.prototype.calc_draw_table = function(){
  alert("Error, calc_draw_table function is not defined!");
}

graphtool.GC_COMMON.prototype.drawChart = function() {
  this.calc_draw_table();
  this.set_colors();
  this.chart.draw(this.data_gc, this.chart_properties);
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
  if(width >= 100)
    this.chart_div.width(width);
  if(height >= 100)
    this.chart_div.height(height);
  var selection = this.chart.getSelection();
  this.chart.draw(this.data_gc, this.chart_properties);
  this.chart.setSelection(selection);
}

graphtool.GC_COMMON.prototype.open_image_as_png = function(){
  var svg_node          = this.chart_div.find("svg");// Inline SVG element
  $('body').remove("#temp_div_export")
  $('body').append('<div id="temp_div_export" style="display:none"/>');//Hidden div for drawing
  var temp_div          = $("#temp_div_export");
  temp_div.append('<canvas id="temp_canvas_export"/>');
  temp_div.append('<img id="temp_img_export"/>');
  var can               = $("#temp_canvas_export").get(0);
  var ctx               = can.getContext('2d');
  var loader            = $("#temp_img_export").get(0);
  loader.width  = can.width  = this.chart_div.width();
  loader.height = can.height = this.chart_div.height();
  loader.onload = function(){
    ctx.drawImage( loader, 0, 0, loader.width, loader.height );
    window.open(can.toDataURL("image/png"),'_blank');
  };
  var svgAsXML = (new XMLSerializer).serializeToString( svg_node.get(0) );
  loader.src = 'data:image/svg+xml,' + encodeURIComponent( svgAsXML );
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
        temp_date = new Date();
        temp_date.setTime(pivot_n_results[date_columns[j]]*1000);
        pivot_n_results[date_columns[j]] = temp_date;
      }
      this.gc_init_table.addRow(pivot_n_results);
    }
  }
  this.no_decimal_formatter        = new google.visualization.NumberFormat({ fractionDigits: 0 });
  for(j in num_columns){  
    this.no_decimal_formatter.format(this.gc_init_table,num_columns[j])
  }
}

//-------------------------------------------------------------------
// Common UI functions 
//-------------------------------------------------------------------
  
graphtool.GC_COMMON.prototype.setup_options_menu = function(load_tabs_func){
  this.chart_div_options_wrap.show({
    duration: 0,
    queue: true,
    complete: function(){
      if(!this.chart_div_options_loaded){
        load_tabs_func();
        this.chart_div_options.tabs();
        this.chart_div_options_wrap.accordion({
          collapsible: true,
          active: false,
          heightStyle: "content"
        });
        this.chart_div_options_loaded = true;
      }
    }.bind(this)
  });
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