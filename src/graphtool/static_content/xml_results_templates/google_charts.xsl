<?xml version="1.0" encoding="UTF-8"?>

<xsl:stylesheet version="1.0"
xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:template name="google_chart">

  <xsl:param name="static_base_url" />
  <!-- HTML BASIC DEFINITION -->
  <div id="top_spacer" style="width: 100%; height: 40px;">
  </div>
  <div id="chart_div" style="width: 700px; height: 500px;">
    <h1>"<xsl:value-of select="title"/>" loading . . .</h1>
  </div>
  <div id="table_div">
  </div>
  <div id="chart_div_options_wrap" style="display: none;">
    <h3>Chart &amp; Export Options:</h3>
    <div id="chart_div_options_wrap_inner_panel" style="overflow:visible">
      <div id="chart_div_options">
        <ul>
        </ul>
      </div>
    </div>
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
      gc_obj.data = 
            [
              [
                 <xsl:value-of select="data/@pivot" />,
               <xsl:if test="data/@kind='pivot-group'">
                 <xsl:value-of select="data/@group" />,
               </xsl:if>
               [
               <xsl:for-each select="columns/column">
                 '<xsl:value-of select="." /><xsl:if test="string-length(@unit) &gt; 0"> (<xsl:value-of select="@unit" />) </xsl:if>'<xsl:if test="position() != last()">,</xsl:if>
               </xsl:for-each>
               ]
              ],
              <xsl:variable name="pivot_name" select="data/@pivot" />
              <xsl:variable name="group_name" select="data/@group" />
              <xsl:if test="data/@kind='pivot-group'">
                <xsl:for-each select="data/*"> 
                  <xsl:variable name="my_pivot" select="@name"/>
                  <xsl:for-each select="group" >
              [
                    <xsl:value-of select="$my_pivot" />,
                    <xsl:value-of select="@value" />,
                  [
                    <xsl:for-each select="d">
                      <xsl:call-template name="split-text">
                        <xsl:with-param name="arg1">
                          <xsl:value-of select="."/>
                        </xsl:with-param>
                      </xsl:call-template><xsl:if test="position() != last()">,</xsl:if>
                    </xsl:for-each>
                  ]
              ]     <xsl:if test="position() != last()">,</xsl:if>
                  </xsl:for-each>
                </xsl:for-each>
              </xsl:if>
              <xsl:if test="data/@kind='pivot'">
                <xsl:for-each select="data/*">
                  <xsl:variable name="my_pivot" select="@name"/>
              [
                  <xsl:value-of select="$my_pivot" />,
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