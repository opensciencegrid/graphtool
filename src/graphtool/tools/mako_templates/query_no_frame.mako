<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    
    <!-- Title -->
    <title>${tmpl_data.html_title}</title>
    
    <!-- Stylesheets loading -->
    <link rel="stylesheet" type="text/css" href="${tmpl_data.static_base_url}/html_style.css"/>
    <link rel="stylesheet" type="text/css" href="${tmpl_data.static_base_url}/js/custom/google_charts/style.css"/>
    <link rel="stylesheet" type="text/css" href="${tmpl_data.static_base_url}/js/jquery/jquery-ui.min.css"/>
    <link rel="stylesheet" type="text/css" href="${tmpl_data.static_base_url}/js/jquery/jquery.datetimepicker.css"/>
    <link rel="stylesheet" type="text/css" href="${tmpl_data.static_base_url}/js/jquery/ext/choosen/chosen.min.css"/>
    <link rel="stylesheet" type="text/css" href="${tmpl_data.static_base_url}/js/jquery/ext/choosen/chosen.min.css"/>
    <link rel="stylesheet" type="text/css" href="${tmpl_data.static_base_url}/js/jquery/ext/spectrum/spectrum.css"/>
    
    <!-- Javascript files loading -->
    <script type="text/javascript" src="${tmpl_data.static_base_url}/js/jquery/jquery-1.11.2.min.js">
    </script>
    <script type="text/javascript" src="${tmpl_data.static_base_url}/js/jquery/jquery-ui.min.js">
    </script>
    <script type="text/javascript" src="${tmpl_data.static_base_url}/js/jquery/jquery.datetimepicker.js">
    </script>
    <script type="text/javascript" src="${tmpl_data.static_base_url}/js/numeral/numeral.min.js">
    </script>
    <script type="text/javascript" src="${tmpl_data.static_base_url}/js/jquery/ext/choosen/chosen.jquery.min.js">
    </script>
    <script type="text/javascript" src="${tmpl_data.static_base_url}/js/jquery/ext/spectrum/spectrum.js">
    </script>
    <script type="text/javascript" src="${tmpl_data.static_base_url}/js/custom/graphtool_common.js">
    </script>
  </head>
  <body>
    <script type="text/javascript">
      var data = ${tmpl_data.json_results_table};
      var metadata = ${tmpl_data.json_metadata};
      var json_queries_desc = ${tmpl_data.json_queries_desc};
      var params_defaults = ${tmpl_data.params_defaults};
    </script>
    
    % if tmpl_data.gc_script is not None:
      <!-- Main Plot -->
      <%include file="google_charts.mako"/>
      
      <script type="text/javascript">
        $("#gc_options_accordion_wrapper").hide();
        $("#gc_table_div").hide();
        $("hr").hide();
        $("body").width($("#gc_full_chart_div").width());
        $("body").height($("#gc_full_chart_div").height());
      </script>
      
      <!-- MATPLOTLIB DIALOG -->
    % elif tmpl_data.matplotlib_image_url is not None:
        <article id="matplotlib_chart">
          <h3>Matplotlib Chart</h3>
          <img class="center" src="${tmpl_data.matplotlib_image_url}"/>
          <hr/>
        </article>
        <br/>
        
    % else:
      <!-- RESULTS TABLE PANEL -->
      <article id="results_table">
        <h3>SQL Query Results</h3>
        <div id="results_table_accordion_panel">
        </div>
        <hr/>
      </article>
      <br/>
      <script type="text/javascript">
        var panel = $("#results_table_accordion_panel");
        var html_table_results = "<table class='results'>";
        for(var i in data){
          row = parseInt(i);
          html_table_results += "<tr class='results'>";
          var row = data[i];
          for(var j in row){
            cell = row[j];
            html_table_results += (i==0?"<th":"<td")+" class='results'>"+cell+"</"+(i==0?"th>":"td>");
          }
          html_table_results += "</tr>";
        }
        html_table_results += "</table>";
        panel.html(html_table_results);
      </script>
    
    % endif
  </body>
</html>