<?xml version="1.0" encoding="UTF-8"?>

<xsl:stylesheet version="1.0"
xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:template name="google_chart">

  <xsl:param name="static_base_url" />
  <!-- ADDITIONAL JS -->
  <script type="text/javascript">
    <xsl:attribute name="src"><xsl:value-of select="$static_base_url"/>/js/other/html2canvas.js</xsl:attribute>
  </script>
  <script type="text/javascript">
    <xsl:attribute name="src"><xsl:value-of select="$static_base_url"/>/js/other/Blob.js</xsl:attribute>
  </script>
  <script type="text/javascript">
    <xsl:attribute name="src"><xsl:value-of select="$static_base_url"/>/js/other/canvas-toBlob.js</xsl:attribute>
  </script>
  <script type="text/javascript">
    <xsl:attribute name="src"><xsl:value-of select="$static_base_url"/>/js/other/FileSaver.min.js</xsl:attribute>
  </script>
  <!-- HTML BASIC DEFINITION -->
  <div id="top_spacer" style="width: 100%; height: 40px;">
  </div>
  <table border="0">
    <tr>
      <td>
        <div id="full_chart_div">
          <div id="title_div">
          </div>
          <div id="chart_div" style="width: 700px; height: 500px;">
            <h1>"<xsl:value-of select="title"/>" loading . . .</h1>
          </div>
          <div id="legend_div">
            <table id="legend_table" border="0">
            </table>
            <div id="footer_div">
            </div>
          </div>
        </div>
        <div id="table_div">
        </div>
      </td>
      <td>
        <xsl:if test="translate_mp_2_gc = 'TRUE'">
          <button id="show_mp_img">Show Matplotlib Image</button>
          <button id="hide_mp_img">Hide Matplotlib Image</button>
          <script type="text/javascript" >
            <xsl:attribute name="src"><xsl:value-of select="$static_base_url"/>/js/custom/show_hide_mp_old_image.js</xsl:attribute>
          </script>
          <script type="text/javascript" >
            setup_show_hide_button('show_mp_img','hide_mp_img','<xsl:value-of select="url"/>');
          </script>
        </xsl:if>
      </td>
    </tr>
  </table>
  <div id="gc_options_accordion_wrapper">
    
  </div>
  
  <!-- JAVASCRIPT -->
  <script type="text/javascript" src="https://www.google.com/jsapi"></script>
  <script type="text/javascript" >
    <xsl:attribute name="src"><xsl:value-of select="$static_base_url"/>/js/custom/google_charts/gc_common.js</xsl:attribute>
  </script>
  <xsl:call-template name="data_to_json_matrix">
  </xsl:call-template>
  <xsl:if test="js_chart_setup">
    <script type="text/javascript">
      var js_chart_setup = function(gc_obj){
        <xsl:value-of select="js_chart_setup" />
      }
    </script>
  </xsl:if>
  <script type="text/javascript">
    <xsl:attribute name="src"><xsl:value-of select="$static_base_url"/>/js/custom/google_charts/<xsl:value-of select="graph"/>.js</xsl:attribute>
  </script>
</xsl:template>

<xsl:template name="data_to_json_matrix">
  <script type="text/javascript" >
    var load_server_data = function(gc_obj){
      gc_obj.title = '<xsl:value-of select="title" />';
      gc_obj.json_query_metadata = <xsl:value-of select="json_query_metadata" />
      gc_obj.data = 
            [
              [
               [
               
              <xsl:if test="data/@kind='pivot'">
                  <xsl:call-template name="to_js_list">
                    <xsl:with-param name="arg1">
                      <xsl:value-of select="data/@pivot" />
                    </xsl:with-param>
                  </xsl:call-template>
               </xsl:if>
               <xsl:if test="data/@kind='pivot-group'">
                 '<xsl:value-of select="data/@pivot" />'
                 ,'<xsl:value-of select="data/@group" />'
               </xsl:if>
               ],
               [
               <xsl:for-each select="columns/column">
                 '<xsl:value-of select="." /><xsl:if test="string-length(@unit) &gt; 0"> (<xsl:value-of select="@unit" />) </xsl:if>'<xsl:if test="position() != last()">,</xsl:if>
               </xsl:for-each>
               ]
              ],
              <xsl:if test="data/@kind='pivot-group'">
                <xsl:for-each select="data/*"> 
                  <xsl:variable name="my_pivot" select="@name"/>
                  <xsl:variable name="pivot_pos" select="position()"/>
                  <xsl:variable name="pivot_last" select="last()"/>
                  <xsl:for-each select="group" >
              [
                  [  
                    <xsl:value-of select="$my_pivot" />,
                    <xsl:value-of select="@value" />
                  ],
                  [
                    <xsl:for-each select="d">
                      <xsl:call-template name="split-text">
                        <xsl:with-param name="arg1">
                          <xsl:value-of select="."/>
                        </xsl:with-param>
                      </xsl:call-template><xsl:if test="position() != last()">,</xsl:if>
                    </xsl:for-each>
                  ]
              ]     <xsl:if test="not(position() = last() and $pivot_pos = $pivot_last)">,</xsl:if>
                  </xsl:for-each>
                </xsl:for-each>
              </xsl:if>
              <xsl:if test="data/@kind='pivot'">
                <xsl:for-each select="data/*">
                  <xsl:variable name="my_pivot" select="@name"/>
              [
                  [
                    <xsl:value-of select="$my_pivot" />
                  ],
                  [
                  <xsl:for-each select="d">
                    <xsl:call-template name="split-text">
                      <xsl:with-param name="arg1">
                        <xsl:value-of select="."/>
                      </xsl:with-param>
                    </xsl:call-template><xsl:if test="position() != last()">,</xsl:if>
                  </xsl:for-each>
                  ]
              ]   <xsl:if test="position() != last()">,</xsl:if>
                </xsl:for-each>
              </xsl:if>
             ];
    }
  </script>
</xsl:template>

</xsl:stylesheet>
