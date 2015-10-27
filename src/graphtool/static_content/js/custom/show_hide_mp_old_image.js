
function setup_show_hide_button(id_show,id_hide,url_img){
  var html_img = '<img id="mp_img" src="'+url_img+'"/>';
  id_show = "#"+id_show;
  id_hide = "#"+id_hide;
  $(id_show)
    .button()
    .click(function(){
      var mp_img = $("#mp_img");
      if(mp_img.length > 0)
        mp_img.show();
      else
        $(id_show).after(html_img);
      $(id_show).hide();
      $(id_hide).show();
    });
  $(id_hide)
    .button()
    .click(function(){
      var mp_img = $("#mp_img");
      if(mp_img.length > 0)
        mp_img.hide();
      $(id_show).show();
      $(id_hide).hide();
    });
  
  $(id_hide).hide();
}