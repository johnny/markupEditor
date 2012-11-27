!function ($, _){
  // keep the editors for things like checking which needs saving,
  // which has focus etc.
  var focusedEditor,
  activeEditors = [],
  numberOfEditors = 0;

  /**
   * Create a new Editor
   * 
   * An editor has a current mode and a textarea mode. Both are the same if you 
   * edit the textarea directly (e.g. textile). In the wysiwyg mode you edit the
   * html directly.
   *
   * @constructor
   * 
   * @param {jQuery} textArea The textarea
   * @param {Object} settings Editor specific settings
   */
  ME.Editor = function Editor(textArea, settings) {
    var preview,
    editor = this,
    timer = 0,
    source = settings.source;

    activeEditors[numberOfEditors] = editor;
    editor.id = numberOfEditors;
    // console.log("init editor " + numberOfEditors);
    numberOfEditors ++;

    this.dataType = settings.markup
    this.settings = settings;

    function addKeyListeners(object, isTextarea){
      object.keydown(function(e){
        if(isTextarea || editor.is('wysiwyg')){
          return editor.currentMode().pressed(editor, e.keyCode);
        }
      }).keyup(function(e){
        if(isTextarea || editor.is('wysiwyg')){
          return editor.currentMode().released(editor, e.keyCode);
        }
      }).mouseup(function(){
        if(isTextarea || editor.is('wysiwyg')){
          editor.focus();
          return editor.currentMode().clicked(editor);
        }
      });
    }

    // mouseup will catch all three mouse buttons. Since all keys move
    // the cursor a check is necessary
    this.textArea = textArea.bind("mouseup keyup", function() {
      editor.checkState();
      clearTimeout(timer);
      timer = setTimeout(function(){
        editor.updatePreview();
      },1000);
    });
    addKeyListeners(textArea,true);

    if(source){
      preview = source.clone().addClass('preview');
      source.hide()
    } else {
      preview = $("<div class=\"preview\">");
    }
    this.preview = preview.bind("mouseup keyup", function() {
      if(editor.is("wysiwyg")) {
        editor.checkState();
      }
    });
    addKeyListeners(this.preview);

    this.overlay = $('<div class=\"overlay\"><div class=\"background\"></div><div class=\"spinner\"></div></div>');
    
    this.toolbar = new ME.Toolbar(this);
    this.container = textArea.wrap("<div class=\"markupEditor\">")
      .parent()
      .append(editor.preview)
      .append(this.overlay)
      .prepend(this.toolbar.div);
    textArea.wrap("<div class=\"textarea\">");

    ME.Hub.loadEditor(this)
  } // Editor

  ME.Editor.prototype = {
    currentMode: function () {
      if(!this._currentMode)
        this._currentMode = ME.getMode( this.wysiwyg ? 'wysiwyg' : this.dataType)
      return this._currentMode
    },
    /**
     * @returns {Mode} The current datamode
     */
    currentDataMode: function() {
      return ME.getMode(this.dataType);
    },
    togglePreview: function () {
      ME.Hub.togglePreview(this)
    },
    setNewMode: function (callback, modeId) {
      if(modeId == 'wysiwyg')
        this.wysiwyg = !this.wysiwyg
      else
        this.dataType = modeId
      console.log('+++++ setting new modeId ', modeId);
      this._currentMode = undefined
      callback()
    },
    changeDataMode: function (modeId) {
      ME.Hub.changeDataMode(this, modeId)
    },
    activateMode: function  (callback) {
      this.toolbar.loadModeToolbar(this);
      this.currentMode().activate(this)
      this.checkState();
      this.overlay.hide();
      callback()
    },
    /**
     * Lock the Editor, idempotent
     */
    showOverlay: function(callback){
      this.overlay.show();
      callback()
    },
    /**
     * Update the preview html div with the html representation of the
     * mode.
     * This should only be run in a non-preview mode.
     *
     * @param {Editor} editor The editor to work on
     */
    updatePreview: function(callback) {
      var mode = this.currentDataMode();
      if(mode.toHTML && !this.wysiwyg){
        console.log("updating preview in Mode " + mode.id);

        var html = mode.toHTML(this, callback);
        if(html !== undefined){ // its a synchronous mode
          this.preview.html(html || "<p>&nbsp;</p>");
          
          if(callback){
            callback();
          }
        }
      } else if(callback){
        callback();
      }
    },
    /**
     * Update the textarea with the text representation of the mode
     *
     * @param {Editor} editor The editor to work on
     */
    updateTextarea: function(callback) {
      var mode = this.currentMode();
      if(mode.toText){
        console.log("updating TA in Mode " + mode.id);

        var text = mode.toText(this, callback);
        if(text !== undefined){ // handle synchronous conversion
          this.textArea.val(text);
          
          if(callback){
            callback();
          }
        }
      } else {
        if(callback){
          callback();
        }
      }
    },
    /**
     * @param {String} text The text inside the textarea to save one
     *    dom call
     */
    initSelectionProperties: function(text){
      var textArea = this.textArea,
      selectionEnd;
      
      this.scrollPosition = textArea.scrollTop;
      this.selectionStart = textArea[0].selectionStart;
      selectionEnd = textArea[0].selectionEnd;
      
      // Shrink selection if cursor is before a line since the
      // replacement will not contain a trailing new line
      if(selectionEnd != this.selectionStart && text[selectionEnd-1] === "\n"){
        selectionEnd -= 1;
      }
      this.selectionEnd = selectionEnd;
    },
    setSelectionRange: function(selectionStart, selectionEnd){
      this.textArea[0].setSelectionRange(selectionStart, selectionEnd);
      this.selectionStart = selectionStart;
      this.selectionEnd = selectionEnd;
    },
    /**
     * Synchronize the changes between preview div and the text area
     */
    synchronize: function(callback) {
      if(this.is("wysiwyg")) {
        if(callback){
          callback();
        }
        this.currentMode().updateTextarea(this, callback);
      } else {
        this.currentMode().updatePreview(this, callback);
      }
    },
    /**
     * Check which mode is loaded.
     *
     * @param {String} modeId The short name of the mode e.g. wysiwyg
     * 
     * @returns {Boolean} Returns true if the current mode has the
     *given modeId
     */
    is: function(modeId) {
      return this.currentMode().id === modeId;
    },
    /**
     * Check the state of the current selection (bold/italic etc.) and
     * change the toolbar.
     */
    checkState: function () {
      this.toolbar.setActive(this.currentMode().getStates(this));
    },
    /**
     * Focus the editor, which will show the toolbar etc.
     */
    focus: function() {
      if(focusedEditor){
        activeEditors[focusedEditor].blur();
      }
      focusedEditor = this.id;
      // console.log("new focus: " + this.id);
    },
    /**
     * Blur (unfocus) the Editor, hide the toolbar etc.
     */
    blur: function(){
      
    },
    /**
     * Close the editor and restore the original div/textarea
     */
    close: function() {
      var replacement = this.settings.preview || this.textArea;
      this.synchronize();
      
      this.container.replaceWith(replacement);
      replacement.removeClass('preview').unbind()
        .attr('contentEditable',false).show()
        .markupEditor('prepare', this.settings);
    }
  }; // end Editor prototype
}(jQuery, ME.t10n);
