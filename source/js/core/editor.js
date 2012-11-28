!function ($, _){
  // keep the editors for things like checking which needs saving,
  // which has focus etc.
  var focusedEditor,
  activeEditors = [],
  numberOfEditors = 0;

  function addKeyListeners(editor, object, isTextarea){
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
  
  /**
   * Create a new Editor
   * 
   * An editor has a current mode and a textarea mode. Both are the same if you 
   * edit the textarea directly (e.g. textile). In the wysiwyg mode you edit the
   * html directly.
   *
   * @constructor
   * 
   * @param {Object} settings Editor specific settings
   */
  ME.Editor = function Editor(settings) {
    var preview,
    editor = this,
    target = settings.source || settings.textarea

    activeEditors[numberOfEditors] = editor;
    editor.id = numberOfEditors;
    // console.log("init editor " + numberOfEditors);
    numberOfEditors ++;

    this.dataType = settings.markup
    this.settings = settings;

    this.container = $("<div class=\"markupEditor\">")
    this.toolbar = new ME.Toolbar(this);
    this.overlay = $('<div class=\"overlay\"><div class=\"background\"></div><div class=\"spinner\"></div></div>');
    
    target.replaceWith(this.container)
    console.log(target, this.container);
    this.container.append(this.toolbar.div,
                          this.$textarea(),
                          this.$preview(),
                          this.overlay)
    
    this.setupTextarea()
    this.setupPreview()

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
          this.textarea.val(text);
          
          if(callback)
            callback()
        }
      } else if(this.settings.src){
        $.get(this.settings.src, {}, function(text, status, response){
          this.textarea.val(text);
          if(callback)
            callback()
        });
      } else {
        if(callback)
          callback()
      }
    },
    $textarea: function () {
      if(!this.textarea){
        this.textarea = this.settings.textarea || $("<textarea>")
        this._$textarea = this.textarea.wrap("<div class=\"textarea\"/>").parent()
      }
      return this._$textarea
    },
    $preview: function () {
      if(!this.preview){
        var source = this.settings.source
        if(source){
          this.preview = source.clone().addClass('preview').css("min-height", source.height());
          source.hide()
        } else {
          this.preview = $("<div class=\"preview\">");
        }
      }
      return this.preview
    },
    setupTextarea: function  () {
      var timer,
      textarea = this.textarea,
      editor = this
      // mouseup will catch all three mouse buttons. Since all keys move
      // the cursor a check is necessary
      textarea.bind("mouseup keyup", function() {
        editor.checkState();
        clearTimeout(timer);
        timer = setTimeout(function(){
          editor.updatePreview();
        },1000);
      });
      addKeyListeners(editor, textarea, true);
    },
    setupPreview: function () {
      var preview = this.preview,
      editor = this

      preview.bind("mouseup keyup", function() {
        if(editor.is("wysiwyg")) {
          editor.checkState();
        }
      });
      addKeyListeners(editor, preview);
    },
    /**
     * @param {String} text The text inside the textarea to save one
     *    dom call
     */
    initSelectionProperties: function(text){
      var textarea = this.textarea,
      selectionEnd;
      
      this.scrollPosition = textarea.scrollTop;
      this.selectionStart = textarea[0].selectionStart;
      selectionEnd = textarea[0].selectionEnd;
      
      // Shrink selection if cursor is before a line since the
      // replacement will not contain a trailing new line
      if(selectionEnd != this.selectionStart && text[selectionEnd-1] === "\n"){
        selectionEnd -= 1;
      }
      this.selectionEnd = selectionEnd;
    },
    setSelectionRange: function(selectionStart, selectionEnd){
      this.textarea[0].setSelectionRange(selectionStart, selectionEnd);
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
        this.updateTextarea(callback);
      } else {
        this.updatePreview(callback);
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
      var replacement = this.settings.source ? this.preview : this.textarea;
      this.synchronize();
      
      this.container.replaceWith(replacement);
      replacement.removeClass('preview').unbind()
        .attr('contentEditable',false).show()
        .markupEditor('prepare', this.settings);
    }
  }; // end Editor prototype
}(jQuery, ME.t10n);
