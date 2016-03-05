<%include file="header.mako"/>
  <script type="text/javascript">
    var data = ${tmpl_data.json_results_table};
    var metadata = ${tmpl_data.json_metadata};
    var json_queries_desc = ${tmpl_data.json_queries_desc};
    var params_defaults = ${tmpl_data.params_defaults};
  </script>
  <aside>
    % if tmpl_data.gc_script is not None:
      <a href="#gooole_chart">Google Chart</a><br/>
    % endif
    % if tmpl_data.matplotlib_image_url is not None:
      <a href="#matplotlib_chart" id="matplotlib_chart_link">Matplotlib Chart</a><br/>
    % endif
    <a href="#query_parameters" id="query_parameters_link">SQL Query Parameters</a><br/>
    
    <a href="#sql_code">SQL Query Code</a><br/>
    <a href="#results_table">SQL Query Results</a><br/>
    % if tmpl_data.csv_url is not None:
    <a href="${tmpl_data.csv_url}" target="_blank">SQL Query Results (CSV)</a><br/>
    % endif
    <hr/>
    <a href="./">Other Views</a><br/>
  </aside>
  <main_view>
      
    <!-- Main Plot -->
    <%include file="google_charts.mako"/>
    
    <!-- SQL PANEL -->
    <article id="sql_code">
      <h3>SQL Query Code</h1>
      <div class="code_wrapper">
        <code>${tmpl_data.sql_string | h}
        </code>
      </div>
      <hr/>
    </article>
    <br/>

    <!-- RESULTS TABLE PANEL -->
    <article id="results_table">
      <h3>SQL Query Results</h1>
      <div id="results_table_accordion_panel">
      </div>
      <hr/>
    </article>
    <br/>
    <script type="text/javascript">
      var panel = $("#results_table_accordion_panel");
      var html_table_results = "<table>";
      for(var i in data){
        html_table_results += "<tr>";
        var row = data[i];
        for(var j in row){
          cell = row[j];
          html_table_results += "<td>"+cell+"</td>";
        }
        html_table_results += "</tr>";
      }
      html_table_results += "</table>";
      panel.html(html_table_results);
    </script>

    <!-- MATPLOTLIB DIALOG -->
    % if tmpl_data.matplotlib_image_url is not None:
      <div id="matplotlib_chart" title="Matplotlib Image">
        <img class="center" src="${tmpl_data.matplotlib_image_url}"/>
      </div>
      <script type="text/javascript">
        $("#matplotlib_chart").dialog({autoOpen:false,width:"auto"});
        $("#matplotlib_chart_link").click(function(){
          $("#matplotlib_chart").dialog("open");
        });
      </script>
    % endif

    <!-- SQL QUERY PARAMETERS DIALOG -->
    <div id="query_parameters" title="SQL Query Parameters">
      <form id="query_parameters_form" method="get" action="?">
        <fieldset>
          <div style="width:100%; display:table;">
          <% cur_count = 0 %>
          % for param,val in tmpl_data.params.iteritems():
            % if cur_count%2 == 0:
              <div style="display:table-row;">
            % endif
                <div style="width:45%; display:table-cell;">
                  <label for="${param}"><b>${param}</b></label>
                  <input type="text" id="${param}" name="${param}" value="${val}" class="text ui-widget-content ui-corner-all"/>
                </div>
            % if cur_count%2 == 1 or cur_count == len(tmpl_data.params)-1:
              </div>
            % endif
          <% cur_count += 1 %>
          % endfor
          </div>
        </fieldset>
        <button id="query_parameters_submit" type="submit">Query again</button>
      </form>
    </div>
    <script type="text/javascript">
      $("#query_parameters_submit").button();
      $("#query_parameters").dialog({autoOpen:false,width: "auto"});
      $('#query_parameters_form').submit(function() {
          for(var param_name in params_defaults){
            var input = $("#"+param_name);
            if(input.val() == params_defaults[param_name]){
              input.prop('disabled', true);
            }
          }
          return true;
        });
      $("#query_parameters_link").click(function(){
        $("#query_parameters").dialog("open");
      });
    </script>
  </main_view>
<%include file="footer.mako"/>