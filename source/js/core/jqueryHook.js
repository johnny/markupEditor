!function ($){
  /**
   * @name jQuery.markupEditor
   * @namespace jQuery hooks for markup editor
   */

  var globalSettings = {
    editorClass: 'markupEditor',
    normalizeUrl: function (url) {
      return url
    },
    denormalizeUrl: function (url) {
      return url
    }
  },
  methods = /** scope jQuery.markupEditor.prototype */{
    /**
     * Create the markup editor
     *
     * @param {Object} settings The specific settings for the editor
     * @see ME#settings
     */
    init: function(parameters) {
      return this.each(function(index,element) {
        var $element = $(element),
        data = $element.data()
        
        if(!$element.closest('.' + globalSettings.editorClass)[0]){
          if($element.is("textarea")) {
            data.textarea = $element
          } else {
            data.source = $element
          }
          new ME.Editor($.extend({}, globalSettings, parameters, data));
        }
      });
    },
    close: function(){
      // find ta and get number of editor
      // execute editor.close
    },
    prepare: function(settings) {
      return this.one('click', function(){
        $(this).markupEditor(settings);
      });
    }
  };
  
  /**
   * Markupeditor method.
   *
   * @memberOf jQuery.markupEditor.prototype
   *
   * @param {String} [method="init"] The method to call
   */
  $.fn.markupEditor= function(method) {
    var args = Array.prototype.slice.call(arguments, 1);
    if(typeof method === 'object'){
      args.push(method);
    }
    if (!methods[method]) {
      method = 'init';
    }
    return methods[method].apply(this, args);
  };
}(jQuery);

