!function ($){
  /**
   * @name jQuery.markupEditor
   * @namespace jQuery hooks for markup editor
   */

  var globalSettings = {},
  methods = /** scope jQuery.markupEditor.prototype */{
    /**
     * Create the markup editor
     *
     * @param {Object} settings The specific settings for the editor
     * @see ME#settings
     */
    init: function(settings) {
      return this.each(function(index,element) {
        var $element = $(element), editor;
        if($element.is("textarea")) {
          initEditorFromTextarea($element, settings);
        } else {
          initEditorFromHTML($element, settings);
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

  /**
   * Initialize the editor from a given HTML element
   *
   * @memberOf jQuery.markupEditor
   * @inner
   * @param {jQuery} container The element which will be editable
   * @param {Option} settings Settings for this editor
   */
  function initEditorFromHTML(container, settings){
    var editor,src,
    textarea = $("<textarea>");

    container.css("min-height", container.height());
    container.before(textarea); // needs to be attached to DOM in firefox

    settings = settings || {};
    $.extend(settings, container.data())
    settings.preview = container;
    editor = initEditorFromTextarea(textarea, settings);

    src = container.attr('src');
    if(src){
      $.get(src, {
      }, function(text, status, response){
        textarea.val(text);
        editor.checkState();
        editor.currentMode.updatePreview(editor);
      });
    } else {
      editor.currentMode.updateTextArea(editor);
      editor.changeMode("wysiwyg");
    }
  }
  
  /**
   * Initialize the editor from a given textarea
   *
   * @memberOf jQuery.markupEditor
   * @inner
   * @param {jQuery} textarea The textarea which will be enhanced
   * @param {Option} instanceSettings Settings for this editor
   */
  function initEditorFromTextarea(textarea,instanceSettings){
    var editor,settings = {};

    $.extend(settings,globalSettings,instanceSettings, textarea.data());
    return new ME.Editor(textarea, settings);
  }

}(jQuery);

