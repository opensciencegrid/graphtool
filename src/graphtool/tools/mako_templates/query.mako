<%include file="header.mako"/>
  <script type="text/javascript">
    var data = ${tmpl_data.json_results_table};
    var metadata = ${tmpl_data.json_metadata};
    var json_queries_desc = ${tmpl_data.json_queries_desc};
    var params_defaults = ${tmpl_data.params_defaults};
  </script>
  <div id="content_div_full" class="ui-widget">
    <div class="ui-widget-header ui-corner-top">
      <h1>${tmpl_data.html_title}</h1>
    </div>
    <div id="wrapper" class="center">
      
      <%include file="google_charts.mako"/>
      
      <!-- SQL PANEL -->
      <div id="sql_code" class="accordion">
        <h3> SQL Query Code </h3>
        <div id="sql_code_accordion_panel">
          <div class="code_wrapper">
            <code>${tmpl_data.sql_string | h}
            </code>
          </div>
        </div>
      </div>

      <!-- RESULTS TABLE PANEL -->
      <div id="results_table" class="accordion">
        <h3> SQL Query Results </h3>
        <div id="results_table_accordion_panel">
        </div>
      </div>
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
        <div id="matplotlib_plot" title="Matplotlib Image">
          <img class="center" src="${tmpl_data.matplotlib_image_url}"/>
        </div>
        <script type="text/javascript">
          $("#matplotlib_plot").dialog({autoOpen:false,width:"auto"});
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
      </script>
    % if tmpl_data.csv_url is not None:
    <a href="${tmpl_data.csv_url}" target="_blank">CSV</a>
    % endif
    </div>
  </div>
  <script type="text/javascript">
    $( ".accordion" ).accordion({
      collapsible: true,
      active: false,
      heightStyle: "content"
    });
  </script>
<%include file="footer.mako"/>