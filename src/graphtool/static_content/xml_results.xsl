<?xml version="1.0" encoding="UTF-8"?>

<xsl:stylesheet version="1.0"
xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:include href="xml_results_templates/google_charts.xsl"/>
	
<xsl:output method="html"/>

<xsl:template match="/">
  <xsl:apply-templates />
</xsl:template>

<xsl:template name="to_js_list">
  <xsl:param name="arg1"/>
  <xsl:choose>
    <xsl:when test="contains($arg1,',')">
      '<xsl:value-of select="substring-before($arg1,',')"/>',
      <xsl:call-template name="to_js_list">
        <xsl:with-param name="arg1">
          <xsl:value-of select="substring-after($arg1,',')"/>
        </xsl:with-param>
      </xsl:call-template>
    </xsl:when>
    <xsl:otherwise>
      '<xsl:value-of select="$arg1"/>'
    </xsl:otherwise>
  </xsl:choose>
</xsl:template>

<xsl:template name="split-text">
  <xsl:param name="arg1"/>
  <xsl:choose>
    <xsl:when test="contains($arg1,'&#10;')">
      <xsl:value-of select="substring-before($arg1,'&#10;')"/><br/>
      <xsl:call-template name="split-text">
        <xsl:with-param name="arg1">
          <xsl:value-of select="substring-after($arg1,'&#10;')"/>
        </xsl:with-param>
      </xsl:call-template>
    </xsl:when>
    <xsl:otherwise>
      <xsl:value-of select="$arg1"/>
    </xsl:otherwise>
  </xsl:choose>
</xsl:template>

<xsl:template name="query">

      <xsl:param name="static_base_url" />
      
      <xsl:call-template name="navtree">
          <xsl:with-param name="base_url" select="attr[@name='base_url']" />
      </xsl:call-template>
      
      <xsl:choose>
        <xsl:when test="graph and ( not(graph_kind) or graph_kind = 'matplotlib')">
          <xsl:if test="data/@coords">
            <xsl:variable name="pivot_name" select="data/@pivot" />
            <xsl:variable name="group_name" select="data/@group" />
            <p> <img usemap="#map" src="{url}"/> </p>
            <xsl:variable name="kind" select="data/@kind"/> 
            <xsl:variable name="my_columns" select="columns" />
            <map name="map">
              <xsl:for-each select="data/*">
                <xsl:variable name="my_pivot">
                <xsl:choose>
                  <xsl:when test="$pivot_name='Link_false'"> <xsl:value-of select="@from" /> to <xsl:value-of select="@to" /> </xsl:when>
                  <xsl:otherwise>
                    <xsl:value-of select="@name" />
                  </xsl:otherwise>
                </xsl:choose>
                </xsl:variable>
                <xsl:choose>
                  <xsl:when test="$kind='pivot-group'">
                    <xsl:for-each select="group">
                      <xsl:if test="coords">
                        <xsl:variable name="my_data" select="d"/>
                        <xsl:variable name="mouseover_data">
                          return escape('&lt;b&gt;<xsl:value-of select="$pivot_name"/>:&lt;/b&gt; <xsl:value-of select="$my_pivot"/> &lt;br/&gt; &lt;b&gt; <xsl:value-of select="$group_name"/>: &lt;/b&gt; <xsl:value-of select="@value" /> &lt;br/&gt; <xsl:for-each select="$my_columns/*"> <xsl:variable name="index" select="@index" /> &lt;b&gt; <xsl:value-of select="." />:&lt;/b&gt; <xsl:value-of select="$my_data[position()=$index]" /><xsl:if test="string-length(@unit) > 0">&#160;<xsl:value-of select="@unit" /> </xsl:if> &lt;br/&gt; </xsl:for-each>');
                        </xsl:variable>
                        <!--<p> <xsl:value-of select="$mouseover_data" /> </p>-->
                        <area href="#" shape="poly" onClick="return false;">
                          <xsl:attribute name="coords"> <xsl:value-of select="coords"/> </xsl:attribute>
                          <xsl:attribute name="onMouseOver"> <xsl:value-of select="$mouseover_data" /> </xsl:attribute>
                        </area>
                      </xsl:if>
                    </xsl:for-each>
                  </xsl:when>
                  <xsl:when test="($kind='pivot') and (coords)">
                    <xsl:variable name="my_data" select="d" />
                    <xsl:variable name="mouseover_data">
                      return escape('&lt;b&gt;<xsl:value-of select="$pivot_name"/>:&lt;/b&gt; <xsl:value-of select="$my_pivot"/> &lt;br/&gt; <xsl:for-each select="$my_columns/*"> <xsl:variable name="index" select="@index" /> &lt;b&gt; <xsl:value-of select="." />:&lt;/b&gt; <xsl:value-of select="$my_data[position()=$index]" /><xsl:if test="string-length(@unit) > 0">&#160;<xsl:value-of select="@unit" /> </xsl:if> &lt;br/&gt; </xsl:for-each>');
                    </xsl:variable>
                    <area href="#" shape="poly" onClick="return false;">
                          <xsl:attribute name="coords"> <xsl:value-of select="coords"/> </xsl:attribute>
                          <xsl:attribute name="onMouseOver"> <xsl:value-of select="$mouseover_data" /> </xsl:attribute>
                    </area>
                  </xsl:when>
                </xsl:choose>
              </xsl:for-each>
            </map>
          </xsl:if>
          <xsl:if test="not(data/@coords)">
            <p> <img src="{url}"/> </p>
          </xsl:if> 
        </xsl:when>
        <xsl:when test="graph and graph_kind and graph_kind = 'google_charts'">
          <xsl:call-template name="google_chart">
            <xsl:with-param name="static_base_url" select="$static_base_url" />
          </xsl:call-template>
        </xsl:when>
        <xsl:otherwise>
          <h1> <xsl:value-of select="title"/> </h1>
        </xsl:otherwise>
      </xsl:choose>

      <xsl:variable name="html_url" select="concat(substring-before(attr[@name='base_url'], 'xml'), 'html', '/', @name, '?', substring-after(url, '?'))"/>
      <br/>
      <a href="{$html_url}">View Google Charts site</a>
      
      <h3> Variables </h3>
      <form method="get" action="{@name}">
        <table border="1">
          <thead>
            <tr>
              <th> Name </th>
              <th> Value </th>
            </tr>
          </thead>
          <xsl:for-each select="sqlvars/var">
            <xsl:if test="@name!='sql_dynamic_modif_func_mod_name' and @name!='sql_dynamic_modif_func'">
              <tr>
                <td> <xsl:value-of select="@name" /> </td>
                <td> <input type="text" id="{@name}" name="{@name}" value="{.}" /> </td>
              </tr>
            </xsl:if>
          </xsl:for-each>
        </table>
        <input type="submit" value="Query again"/>
        <script type="text/javascript">
          <xsl:attribute name="src"><xsl:value-of select="$static_base_url"/>/js/custom/xml_results_query_filters.js</xsl:attribute>
        </script>
      </form>

      <xsl:variable name="csv_url" select="concat(translate(attr[@name='base_url'], 'xml', 'csv'), '/', @name, '?', substring-after(url, '?'))"/>
      <a href="{$csv_url}">Download results in CSV format</a>

      <div id="metadata_button" class="test" style="visibility:visible;">
        <a href="#" onClick="toggleBox('metadata',1); toggleBox('metadata_button',0); return false;">Show metadata</a>
      </div>
      <div id="metadata" class="test" style="visibility:hidden;display:none">
        <xsl:if test="graph">
          <p>Graph Type: <xsl:value-of select="graph"/></p>
        </xsl:if>
        <p>
          <h3>SQL Used:</h3>
          <xsl:call-template name="split-text">
            <xsl:with-param name="arg1">
              <xsl:value-of select="sql"/>
            </xsl:with-param>
          </xsl:call-template>
        </p>
        <a href="#" onClick="toggleBox('metadata',0); toggleBox('metadata_button',1); return false;">Hide metadata</a>
      </div>

 
      <div id="results_button" class="test">
        <xsl:attribute name="style">
          <xsl:choose>
            <xsl:when test="graph"> visibility:visible; </xsl:when>
            <xsl:otherwise> visibility:hidden; </xsl:otherwise>
          </xsl:choose>
        </xsl:attribute>
        <a href="#" onClick="toggleBox('results',1); toggleBox('results_button',0); return false;">Show table of results</a>
      </div>

      <div id="results" class="test">

        <xsl:attribute name="style">
          <xsl:choose>
            <xsl:when test="graph"> visibility:hidden; display:none </xsl:when>
            <xsl:otherwise> visibility:visible; </xsl:otherwise>
          </xsl:choose>
        </xsl:attribute>

      <h3> Table of Results </h3>
      <table border="1">
        <thead>
          <tr>
            <th> <xsl:value-of select="data/@pivot" /> </th>
            <xsl:if test="data/@kind='pivot-group'">
              <th> <xsl:value-of select="data/@group" /> </th>
            </xsl:if>
            <xsl:for-each select="columns/column">
              <th>
                <xsl:value-of select="." />
                <xsl:if test="string-length(@unit) &gt; 0"> (<xsl:value-of select="@unit" />) </xsl:if>
              </th>
            </xsl:for-each>
          </tr>
        </thead>
        <xsl:variable name="pivot_name" select="data/@pivot" />
        <xsl:variable name="group_name" select="data/@group" />
        <tbody>
          <xsl:if test="data/@kind='pivot-group'">
            <xsl:for-each select="data/*"> 
              <xsl:variable name="my_pivot">
                <xsl:choose>
                  <xsl:when test="$pivot_name='Link_false'">
                      <xsl:value-of select="@from" />
                      to
                      <xsl:value-of select="@to" />
                  </xsl:when>
                  <xsl:otherwise>
                    <xsl:value-of select="@name" />
                  </xsl:otherwise>
                </xsl:choose>
              </xsl:variable>
              <xsl:for-each select="group" >
                <tr>
                  <td> <xsl:value-of select="$my_pivot" /> </td>
                  <td> <xsl:value-of select="@value" /> </td>
                  <xsl:for-each select="d">
                    <td> 
                      <xsl:call-template name="split-text">
                        <xsl:with-param name="arg1">
                          <xsl:value-of select="."/>
                        </xsl:with-param>
                      </xsl:call-template>
                    </td>
                  </xsl:for-each>
                </tr>
              </xsl:for-each>
            </xsl:for-each>
          </xsl:if>
          <xsl:if test="data/@kind='pivot'">
            <xsl:for-each select="data/*">
              <xsl:variable name="my_pivot">
                <xsl:choose>
                  <xsl:when test="$pivot_name='Link_false'">
                      <xsl:value-of select="@from" />
                      to
                      <xsl:value-of select="@to" />
                  </xsl:when>
                  <xsl:otherwise>
                    <xsl:value-of select="@name" />
                  </xsl:otherwise>
                </xsl:choose>
              </xsl:variable>
                <tr>
                  <td> <xsl:value-of select="$my_pivot" /> </td>
                  <xsl:for-each select="d">
                    <td>
                      <xsl:call-template name="split-text">
                        <xsl:with-param name="arg1">
                          <xsl:value-of select="."/>
                        </xsl:with-param>
                      </xsl:call-template>
                  </td>
                  </xsl:for-each>
                </tr>
            </xsl:for-each>
          </xsl:if>
        </tbody>
      </table>

      <a href="#" onClick="toggleBox('results',0); toggleBox('results_button',1); return false;">Hide table of results</a>

      </div>
</xsl:template>

<xsl:template name="pagelist">
    <div class="accordion">
      <h3> <xsl:value-of select="@name" /> </h3>
      <div>
        <xsl:for-each select="page">
          <xsl:choose>
            <xsl:when test="@title">
              <a href="{.}"><xsl:value-of select="@title" /></a><br/>
            </xsl:when>
            <xsl:otherwise>
              <a href="{.}"><xsl:value-of select="." /></a><br/>
            </xsl:otherwise>
          </xsl:choose>
        </xsl:for-each>
      </div>
    </div>
</xsl:template>

<xsl:template name="navtree">
  <xsl:param name="base_url" />
  <xsl:for-each select="document($base_url)/graphtool/pagelist">

    <!--<div class="menu" onClick="toggleBoxSwitch('navmenu',2);" onMouseOver="toggleBoxSwitch('navmenu',1);" onMouseOut="toggleBoxSwitch('navmenu',0)"> -->
    <div class="menu">
      <xsl:attribute name="onClick">toggleBoxSwitch('navmenu<xsl:value-of select="@id"/>',2);</xsl:attribute>
      <!--<xsl:attribute name="onMouseOver">toggleBoxSwitch('navmenu<xsl:value-of select="@id"/>',1);</xsl:attribute>
      <xsl:attribute name="onMouseOut">toggleBoxSwitch('navmenu<xsl:value-of select="@id"/>',0)</xsl:attribute>-->
      <xsl:attribute name="style"> left:<xsl:value-of select="(200*@id)-200" />px; </xsl:attribute>
      <a href="#" onClick="return false;"> <xsl:value-of select="@name"/> </a>
    </div>

    <!--<div class="menuopt" id="navmenu" onMouseOut="toggleBoxSwitch('navmenu',0)" onMouseOver="toggleBoxSwitch('navmenu',1)">-->
    <div class="menuopt">
      <xsl:attribute name="id">navmenu<xsl:value-of select="@id"/></xsl:attribute>
      <!--<xsl:attribute name="onMouseOut">toggleBoxSwitch('navmenu<xsl:value-of select="@id"/>',0)</xsl:attribute>
      <xsl:attribute name="onMouseOut">toggleBoxSwitch('navmenu<xsl:value-of select="@id"/>',1)</xsl:attribute>-->
      <xsl:attribute name="style">left:<xsl:value-of select="(200*@id)-200" />px;</xsl:attribute>
      <ul>
        <xsl:for-each select="page">
          <xsl:choose>
            <xsl:when test="@title">
              <li> <a href="{.}"><xsl:value-of select="@title" /></a> </li>
            </xsl:when>
            <xsl:otherwise>
              <li> <a href="{.}"><xsl:value-of select="." /></a> </li>
            </xsl:otherwise>
          </xsl:choose>
        </xsl:for-each>
      </ul>
    </div>

  </xsl:for-each>

</xsl:template>


<xsl:template match="/graphtool">

<!-- XML Variables -->
<xsl:variable name="static_base_url" select="attr[@name='static_base_url']" />

<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    
    <!-- Title -->
    <title><xsl:value-of select="html_title"/></title>
    
    <!-- Stylesheets loading -->
    <link rel="stylesheet" type="text/css">
      <xsl:attribute name="href"> <xsl:value-of select="$static_base_url"/>/style.css</xsl:attribute>
    </link>
    <link rel="stylesheet" type="text/css">
      <xsl:attribute name="href"> <xsl:value-of select="$static_base_url"/>/js/jquery/jquery-ui.min.css</xsl:attribute>
    </link>
    <link rel="stylesheet" type="text/css">
      <xsl:attribute name="href"> <xsl:value-of select="$static_base_url"/>/js/jquery/jquery.datetimepicker.css</xsl:attribute>
    </link>
    <link rel="stylesheet" type="text/css">
      <xsl:attribute name="href"> <xsl:value-of select="$static_base_url"/>/js/jquery/ext/choosen/chosen.min.css</xsl:attribute>
    </link>
    <link rel="stylesheet" type="text/css">
      <xsl:attribute name="href"> <xsl:value-of select="$static_base_url"/>/js/jquery/ext/spectrum/spectrum.css</xsl:attribute>
    </link>
    
    <!-- Javascript files loading -->
    <script type="text/javascript">
      <xsl:attribute name="src"><xsl:value-of select="$static_base_url"/>/js/jquery/jquery-1.11.2.min.js</xsl:attribute>
    </script>
    <script type="text/javascript">
      <xsl:attribute name="src"><xsl:value-of select="$static_base_url"/>/js/jquery/jquery-ui.min.js</xsl:attribute>
    </script>
    <script type="text/javascript">
      <xsl:attribute name="src"><xsl:value-of select="$static_base_url"/>/js/jquery/jquery.datetimepicker.js</xsl:attribute>
    </script>
    <script type="text/javascript">
      <xsl:attribute name="src"><xsl:value-of select="$static_base_url"/>/js/numeral/numeral.min.js</xsl:attribute>
    </script>
    <script type="text/javascript">
      <xsl:attribute name="src"><xsl:value-of select="$static_base_url"/>/js/jquery/ext/choosen/chosen.jquery.min.js</xsl:attribute>
    </script>
    <script type="text/javascript">
      <xsl:attribute name="src"><xsl:value-of select="$static_base_url"/>/js/jquery/ext/spectrum/spectrum.js</xsl:attribute>
    </script>
  
    <!-- Custom Javascript  -->
    <script type="text/javascript">
      function toggleBox( divId, state ) {
        var obj = document.getElementById( divId ).style;
        obj.visibility = state ? "visible" : "hidden";
        obj.display = state ? "block" : "none";
      }

      function toggleBoxSwitch( divId, state ) {
        var obj = document.getElementById( divId ).style;
        if (state == 2) {
          if (obj.visibility == "visible")
            obj.visibility = "hidden";
          else
            obj.visibility = "visible";
        } else
          obj.visibility = state ? "visible" : "hidden";
      }

      function testAlert( arg ) { alert( arg ); }
    </script>
  </head>
  <body>
    <script type="text/javascript">
      <xsl:attribute name="src"> <xsl:value-of select="$static_base_url"/>/wz_tooltip.js</xsl:attribute>
    </script>
  
    <xsl:choose>
      <xsl:when test="query">
        <xsl:for-each select="query">
          <xsl:call-template name="query">
            <xsl:with-param name="static_base_url" select="$static_base_url" />
          </xsl:call-template>
        </xsl:for-each>
      </xsl:when>
      <xsl:when test="pagelist">
        <xsl:for-each select="pagelist">
          <xsl:call-template name="pagelist">
          </xsl:call-template>
        </xsl:for-each>
        <script>
          $( ".accordion" ).accordion({
            collapsible: true,
            active: false,
            heightStyle: "content"
          });
        </script>
      </xsl:when>
      <xsl:otherwise>
        UNKNOWN
      </xsl:otherwise>
    </xsl:choose>
  </body>
</html>
</xsl:template>

</xsl:stylesheet>
