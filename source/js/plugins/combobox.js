(function($, ME){
  $.fn.required = function(isRequired){
    return this.each(function(){
      if(isRequired){
        $(this).addClass("required");
      } else {
        $(this).removeClass("required");
      }
    });
  };
  $.fn.combobox = function (options) {
    return this.typeahead({
      source: ME.options[options.key] 
    })
  }
})(jQuery, ME);
