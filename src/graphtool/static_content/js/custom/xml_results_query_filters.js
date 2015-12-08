  function setDateTimePicker(inp_id){
    var inp_tag = $('#'+inp_id);
    var prev_val = inp_tag.val();
    inp_tag.datetimepicker({
      format:'Y-m-d H:i:s',
      mask:'9999-19-39 29:59:59'
    });
  }
  function setSpanPicker(inp_id){
    var inp_tag = $('#'+inp_id);
    var autocomplete_vals = [
                              {
                                label:"3600 (1 Hour)",
                                value:3600
                              },
                              {
                                label:"86400 (1 Day)",
                                value:86400
                              },
                              {
                                label:"604800 (1 Week)",
                                value:604800
                              },
                              {
                                label:"2592000 (1 Month, 30 days)",
                                value:2592000
                              }
                             ];
    inp_tag.autocomplete({
      minLength: 0,
      source: autocomplete_vals
    });
    inp_tag.focus(function(){
        inp_tag.autocomplete( "search", "" );
    });
    inp_tag.click(function(){
        inp_tag.autocomplete( "search", "" );
    });
    inp_tag.keyup(function(){
        inp_tag.val(inp_tag.val().replace(/[^0-9]/g,''))
    });
  }
  function setYesNoPicker(inp_id){
    var inp_tag = $('#'+inp_id);
    var autocomplete_vals = [
                              {
                                label:"YES",
                                value: 'YES'
                              },
                              {
                                label:"NO",
                                value:'NO'
                              }
                             ];
    inp_tag.autocomplete({
      minLength: 0,
      source: autocomplete_vals
    });
    inp_tag.focus(function(){
        inp_tag.autocomplete( "search", "" );
    });
    inp_tag.click(function(){
        inp_tag.autocomplete( "search", "" );
    });
  }
  function setOpportunisticFilterPicker(inp_id){
    var inp_tag = $('#'+inp_id);
    var autocomplete_vals = [
                              {
                                label:"Include All",
                                value: 'BOTH'
                              },
                              {
                                label:"Only Opportunistic",
                                value:'OPPORTUNISTIC'
                              },
                              {
                                label:"Only Owned",
                                value:'OWNED'
                              }
                             ];
    inp_tag.autocomplete({
      minLength: 0,
      source: autocomplete_vals
    });
    inp_tag.focus(function(){
        inp_tag.autocomplete( "search", "" );
    });
    inp_tag.click(function(){
        inp_tag.autocomplete( "search", "" );
    });
  }
  function setHEPSpotOnDemandFilter(inp_id){
    var inp_tag = $('#'+inp_id);
    var autocomplete_vals = [
                              {
                                label:"Include All",
                                value: 'both'
                              },
                              {
                                label:"Only Spot Price",
                                value:'spot'
                              },
                              {
                                label:"Only On Demand",
                                value:'on-demand'
                              }
                             ];
    inp_tag.autocomplete({
      minLength: 0,
      source: autocomplete_vals
    });
    inp_tag.focus(function(){
        inp_tag.autocomplete( "search", "" );
    });
    inp_tag.click(function(){
        inp_tag.autocomplete( "search", "" );
    });
  }
  setDateTimePicker('starttime');
  setDateTimePicker('endtime');
  setSpanPicker('span');
  setYesNoPicker('exclude-empty-nulls-unkowns');
  setYesNoPicker('exclude-stopped');
  setOpportunisticFilterPicker('opportunistic-filter');
  setHEPSpotOnDemandFilter('charge-type');
