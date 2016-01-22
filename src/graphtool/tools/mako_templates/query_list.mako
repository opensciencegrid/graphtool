<%include file="header.mako"/>
  <div id="content_div" class="ui-widget">
    <div class="ui-widget-header ui-corner-top">
      <h1>${tmpl_data.html_title}<h1>
    </div>
    % for query in tmpl_data.queries:
      <div class="accordion">
        <h3> ${query.name} </h3>
        <div>
          % for page in query.pages:
            <a href="${page.url}">${page.title}</a><br/>
          % endfor
        </div>
      </div>
    % endfor
  
    <script type="text/javascript">
      $( ".accordion" ).accordion({
        collapsible: true,
        active: false,
        heightStyle: "content"
      });
    </script>
  </div>
<%include file="footer.mako"/>