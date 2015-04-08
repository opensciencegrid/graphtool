//-------------------------------------------------------------------
// Common Variables
//-------------------------------------------------------------------

// data and google charts variables
var data                        = null;
var chart_properties            = null;
var data_gc                     = null;
var chart                       = null;
var min_dimensions_px           = 100;
var max_dimensions_px           = 3000;

// ui-elements
var chart_div                   = $("#chart_div");
var chart_div_options           = $("#chart_div_options");
var chart_div_options_wrap      = $("#chart_div_options_wrap");
var chart_div_options_loaded    = false;

//-------------------------------------------------------------------
// Common charts functions 
//-------------------------------------------------------------------

  function set_chart_size(width,height){
    if(width >= 100)
      chart_div.width(width);
    if(height >= 100)
    	chart_div.height(height);
    var selection = chart.getSelection();
    chart.draw(data_gc, chart_properties);
    chart.setSelection(selection);
  }
  
  function open_image_as_png(){
    var svg_node          = chart_div.find("svg");// Inline SVG element
    $('body').remove("#temp_div_export")
    $('body').append('<div id="temp_div_export" style="display:none"/>');//Hidden div for drawing
    var temp_div          = $("#temp_div_export");
    temp_div.append('<canvas id="temp_canvas_export"/>');
    temp_div.append('<img id="temp_img_export"/>');
    var can               = $("#temp_canvas_export").get(0);
    var ctx               = can.getContext('2d');
    var loader            = $("#temp_img_export").get(0);
    loader.width  = can.width  = chart_div.width();
    loader.height = can.height = chart_div.height();
    loader.onload = function(){
      ctx.drawImage( loader, 0, 0, loader.width, loader.height );
      window.open(can.toDataURL("image/png"),'_blank');
    };
    var svgAsXML = (new XMLSerializer).serializeToString( svg_node.get(0) );
    loader.src = 'data:image/svg+xml,' + encodeURIComponent( svgAsXML );
    
  }  

//-------------------------------------------------------------------
// Common UI functions 
//-------------------------------------------------------------------
  
  function setup_options_menu(load_tabs_func){
    chart_div_options_wrap.show({
      duration: 0,
      queue: true,
      complete: function(){
        if(!chart_div_options_loaded){
          load_tabs_func();
          chart_div_options.tabs();
          chart_div_options_wrap.accordion({
            collapsible: true,
            active: false,
            heightStyle: "content"
          });
          chart_div_options_loaded = true;
        }
      }
    });
  }
  
  function include_options_tab(id,title,html_code){
    chart_div_options.find("ul").append('<li><a href="#'+id+'">'+title+'</a></li>')
    chart_div_options.append('<div id="'+id+'">'+html_code+'</div>')
  }  
  
  function include_size_options(){
    var html_code =
      '<div>'+
      '<b>Width('+min_dimensions_px+'px,'+max_dimensions_px+'px):</b><span id="width-label">'+chart_div.width()+'</span><div id="chart-width" style="width:300px"></div><br/>'+
      '<b>Height('+min_dimensions_px+'px,'+max_dimensions_px+'px):</b><span id="height-label">'+chart_div.height()+'</span><div id="chart-height" style="width:300px"></div><br/>'+
      '</div>';
    include_options_tab("chart_dimensions","Chart Size",html_code)
    $("#chart-width").slider({ 
        min:     min_dimensions_px,
        max:     max_dimensions_px,
        value:   chart_div.width(),
        change:  function( event, ui ){set_chart_size(ui.value,-1);},
        slide:   function( event, ui ){$("#width-label").text( ui.value );}
    });
    $("#chart-height").slider({ 
        min:     min_dimensions_px,
        max:     max_dimensions_px,
        value:   chart_div.height(),
        change:  function( event, ui ){set_chart_size(-1,ui.value);},
        slide:   function( event, ui ){$("#height-label").text( ui.value );}
    });
  }
  
  function include_export_options(){
    var html_code = 
      '<button id="export_as_png_button">Export as PNG</button>';
    include_options_tab("chart_export","Export",html_code);
    $("#export_as_png_button")
        .button()
        .click(function( event ) {
            open_image_as_png();
        });
  }  
  
  function load_default_options_tabs(){
    include_size_options();
    include_export_options();
  }
  