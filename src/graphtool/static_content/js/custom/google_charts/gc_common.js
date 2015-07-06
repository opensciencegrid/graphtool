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
  this.min_dimensions_px           = 100;
  this.max_dimensions_px           = 3000;
  
  // ui-elements
  this.chart_div                   = $("#chart_div");
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

graphtool.GC_COMMON.prototype.drawChart = function(ops) {
  alert("Not implemented yet!")
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
  this.chart_div_options.find("ul").append('<li><a href="#'+id+'">'+title+'</a></li>')
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
    '<button id="export_as_png_button">Export as PNG</button>';
  this.include_options_tab("chart_export","Export",html_code);
  $("#export_as_png_button")
      .button()
      .click(function( event ) {
          this.open_image_as_png();
      }.bind(this));
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
