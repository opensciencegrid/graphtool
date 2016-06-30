      <!-- Google Charts Panel -->
      % if tmpl_data.gc_script is not None:
        <article id="gooole_chart">
          <div id="gc_full_chart_div" class="white_bg" style="display: inline-block;">
            <div id="gc_title_div" class="white_bg">
            </div>
            <div id="gc_chart_div" class="white_bg" style="width: 700px; height: 300px;">
              <h1>${tmpl_data.html_title| h} loading . . .</h1>
            </div>
            <div id="gc_legend_div" class="white_bg">
              <table id="gc_legend_table" class="white_bg" border="0">
              </table>
              <div id="gc_legend_footer_div" class="white_bg">
              </div>
            </div>
          </div>
          <div id="gc_options_accordion_wrapper">
          </div>
          <div id="gc_table_div">
          </div>
          <hr/>
        </article>
        <br/>
        
        <!-- ADDITIONAL JS -->
        <script type="text/javascript" src="${tmpl_data.static_base_url}/js/other/html2canvas.js">
        </script>
        <script type="text/javascript" src="${tmpl_data.static_base_url}/js/other/Blob.js">
        </script>
        <script type="text/javascript" src="${tmpl_data.static_base_url}/js/other/canvas-toBlob.js">
        </script>
        <script type="text/javascript" src="${tmpl_data.static_base_url}/js/other/FileSaver.min.js">
        </script>
        <script type="text/javascript" src="${tmpl_data.static_base_url}/js/other/papaparse.min.js">
        </script>
        <script type="text/javascript" src="${tmpl_data.static_base_url}/js/other/moment.min.js">
        </script>
        
        <!-- JAVASCRIPT -->
        <script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>
        <script type="text/javascript" src="https://www.google.com/jsapi">
        </script>
        <script type="text/javascript"  src="${tmpl_data.static_base_url}/js/custom/google_charts/gc_common.js">
        </script>
        <script type="text/javascript">
          var load_server_data = function(gc_obj){
            gc_obj.title = '${tmpl_data.html_title| h}';
            gc_obj.json_query_metadata = metadata;
            gc_obj.data = data;
          };
        </script>

        % if tmpl_data.js_chart_setup is not None:
          <script type="text/javascript">
            var js_chart_setup = function(gc_obj){
              ${tmpl_data.js_chart_setup}
            };
          </script>
        % endif
        <script type="text/javascript" src="${tmpl_data.static_base_url}/js/custom/google_charts/${tmpl_data.gc_script}.js">
        </script>
      % endif