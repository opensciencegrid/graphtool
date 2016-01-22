      <!-- Google Charts Panel -->
      % if tmpl_data.gc_script is not None:
        <div id="gc_panel_div">
          <div id="full_chart_div">
            <div id="gc_title_div">
            </div>
            <div id="gc_chart_div" style="width: 700px; height: 500px;">
              <h1>${tmpl_data.html_title| h} loading . . .</h1>
            </div>
            <div id="gc_legend_div">
              <table id="gc_legend_table" border="0">
              </table>
              <div id="gc_legend_footer_div">
              </div>
            </div>
          </div>
          <div id="gc_table_div">
          </div>
          <div id="gc_options_accordion_wrapper">
          </div>
        </div>
        
        <!-- ADDITIONAL JS -->
        <script type="text/javascript" src="${tmpl_data.static_base_url}/js/other/html2canvas.js">
        </script>
        <script type="text/javascript" src="${tmpl_data.static_base_url}/js/other/Blob.js">
        </script>
        <script type="text/javascript" src="${tmpl_data.static_base_url}/js/other/canvas-toBlob.js">
        </script>
        <script type="text/javascript" src="${tmpl_data.static_base_url}/js/other/FileSaver.min.js">
        </script>
        
        <!-- JAVASCRIPT -->
        <script type="text/javascript" src="https://www.google.com/jsapi">
        </script>
        <script type="text/javascript"  src="${tmpl_data.static_base_url}/js/custom/google_charts/gc_common.js">
        </script>
        <script type="text/javascript">
          var load_server_data = function(gc_obj){
            gc_obj.title = '${tmpl_data.html_title| h}';
            gc_obj.json_query_metadata = metadata;
            gc_obj.data = data;
            console.log(gc_obj.data)
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