<%include file="header.mako"/>
  <script type="text/javascript">
    var data = ${tmpl_data.json_results_table};
    var metadata = ${tmpl_data.json_metadata};
    var json_queries_desc = ${tmpl_data.json_queries_desc};
    var params_defaults = ${tmpl_data.params_defaults};
  </script>
  <aside>
    <h3>Navigation</h3>
    % if tmpl_data.gc_script is not None:
      <a href="#gooole_chart">Google Chart</a>
    % endif
    % if tmpl_data.matplotlib_image_url is not None:
      <a href="#matplotlib_chart" id="matplotlib_chart_link">Matplotlib Chart</a>
    % endif
    <a href="#query_parameters" id="query_parameters_link">SQL Query Parameters</a>
    
    <a href="#sql_code">SQL Query Code</a>
    <a href="#results_table">SQL Query Results</a>
    % if tmpl_data.csv_url is not None:
    <a href="${tmpl_data.csv_url}" target="_blank">SQL Query Results (CSV)</a>
    % endif
    <hr/>
    <a href="./">Other Views</a>
  </aside>
  <main_view>
      
    <!-- Main Plot -->
    <%include file="google_charts.mako"/>
    
    <!-- MATPLOTLIB DIALOG -->
    % if tmpl_data.matplotlib_image_url is not None:
      <article id="matplotlib_chart">
        <h3>Matplotlib Chart</h3>
        <img class="center" src="${tmpl_data.matplotlib_image_url}"/>
        <hr/>
      </article>
      <br/>
    % endif

    <!-- SQL QUERY PARAMETERS -->
    <article id="query_parameters">
      <h3>SQL Query Parameters</h3>
      <form id="query_parameters_form" method="get" action="?">
        <fieldset>
          <div style="width:100%; display:table;">
          <% cur_count = 0 %>
          % for param,val in tmpl_data.params:
            % if param!='sql_dynamic_modif_func_mod_name' and param!='sql_dynamic_modif_func':
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
            % endif
          % endfor
          </div>
        </fieldset>
        <button id="query_parameters_submit" type="submit">Query again</button>
      </form>        
      <hr/>
    </article>
    <br/>
    <script type="text/javascript">
      $("#query_parameters_submit").button();
      $('#query_parameters_form').submit(function() {
          // TODO: Check proper removal of defaults
          /*for(var param_name in params_defaults){
            var input = $("#"+param_name);
            if(input.val() == params_defaults[param_name]){
              input.prop('disabled', true);
            }
          }*/
          return true;
        });
    </script>
    <script type="text/javascript" src="${tmpl_data.static_base_url}/js/custom/xml_results_query_filters.js">
    </script>
    
    <!-- SQL PANEL -->
    <article id="sql_code">
      <h3>SQL Query Code</h3>
      <div class="code_wrapper">
        <code>${tmpl_data.sql_string | h}
        </code>
      </div>
      <hr/>
    </article>
    <br/>

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
    <div style="height:100%;"></div>
  </main_view>
  <script type="text/javascript">
    var scroll_listener = function(e_scroll) {
        var min_top = Number.MAX_VALUE;
        var min_article = null;
        var articles = $("main_view article");
        for(var i=0;i<articles.length;i++){
          var article = $(articles.get(i));
          var pos_top = article.position().top;
          if(pos_top >= 0 && pos_top < min_top){
            min_top = pos_top;
            min_article = article;
          }
        }
        if(min_article != null){
          $("aside a").each(function(i,e_link){
            var link = $(e_link);
            link.css("background-color",'')
            if(link.attr("href") == "#"+min_article.attr("id"))
              link.css("background-color",'#F6A828');
          });
        }
      }
    scroll_listener();
    $("main_view").scroll(scroll_listener);
  </script>
<%include file="footer.mako"/>