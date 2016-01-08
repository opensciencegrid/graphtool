<%include file="header.mako"/>
  <h1>${tmpl_data.html_title}</h1>
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

  <script>
    $( ".accordion" ).accordion({
      collapsible: true,
      active: false,
      heightStyle: "content"
    });
  </script>
  
<%include file="footer.mako"/>