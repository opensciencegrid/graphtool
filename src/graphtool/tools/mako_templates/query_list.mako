<%include file="header.mako"/>
  <aside>
    <h3>Navigation</h3>
    % for idx,query in enumerate(tmpl_data.queries):
      <a href="#section_${idx}">${query.name}</a>
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