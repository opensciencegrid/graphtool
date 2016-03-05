<%include file="header.mako"/>
  <aside>
  % for idx,query in enumerate(tmpl_data.queries):
    <a href="#section_${idx}">${query.name}</a><br/>
  % endfor
  </aside>
  <main_view>
    % for idx,query in enumerate(tmpl_data.queries):
      <article id="section_${idx}">
        <h1> ${query.name} </h1>
        <p>
          % for page in query.pages:
            <a href="${page.url}">${page.title}</a><br/>
          % endfor
        </p>
        <hr/>
      </article>
      <br/>
    % endfor
  </main_view>
<%include file="footer.mako"/>