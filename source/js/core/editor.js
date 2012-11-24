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
    var editor = this, timer = 0, preview = settings.preview;

    activeEditors[numberOfEditors] = editor;
    editor.id = numberOfEditors;
    // console.log("init editor " + numberOfEditors);
    numberOfEditors ++;

    this.dataType = settings.markup
    this.settings = settings;

    function addKeyListeners(object, isTextarea){
      object.keydown(function(e){
        if(isTextarea || editor.is('wysiwyg')){
          return editor.currentMode.pressed(editor, e.keyCode);
        }
      }).keyup(function(e){
        if(isTextarea || editor.is('wysiwyg')){
          return editor.currentMode.released(editor, e.keyCode);
        }
      }).mouseup(function(){
        if(isTextarea || editor.is('wysiwyg')){
          editor.focus();
          return editor.currentMode.clicked(editor);
        }
      });
    }

    // mouseup will catch all three mouse buttons. Since all keys move
    // the cursor a check is necessary
    this.textArea = textArea.bind("mouseup keyup", function() {
      editor.checkState();
      clearTimeout(timer);
      timer = setTimeout(function(){
        editor.currentMode.updatePreview(editor);
      },1000);
    });
    addKeyListeners(textArea,true);

    if(preview){
      preview.addClass('preview');
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
    this.load()
  } // Editor

  ME.Editor.prototype = {
    load: function () {
      this.currentMode = this.getDataMode()
      if(this.settings.previewOnly){
        this.changeMode('wysiwyg');
      } else {
        var editor = this
        editor.currentMode.activate(editor, function(){
          editor.currentMode.afterActivation(editor);
        });
      }
    },
    /**
     * Change the current mode to the given id
     * 
     * @param {String} modeId The id of the mode (e.g. textile)
     */
    changeMode: function(modeId, silent) {
      var editor = this,
      nextMode = ME.getMode(modeId),
      oldMode = editor.currentMode;

      // TODO warn about mode change here
      this.warnIfNecessary(oldMode,nextMode, function(){
        editor.beginModeChange();
        console.log('+++++ changeMode start ' + modeId);
        
        editor.synchronize(function(){
          editor.oldMode = oldMode;
          editor.currentMode = nextMode;
          nextMode.activate(editor, function(){
            console.log('+++++ changeMode finished ' + modeId);
            nextMode.afterActivation(editor);
            editor.checkState();

            delete editor.oldMode;
            editor.finalizeModeChange(silent);
          });
        });
      }, silent);
    },
    /**
     * Change the current underlying data format
     * 
     * @param {String} modeId The id of the mode (e.g. textile)
     */
    changeDataMode: function(modeId, silent){
      var isInWysiwyg = this.is('wysiwyg'),
      dataMode = ME.getMode(modeId);
      if(!modeId || modeId === this.currentMode.id) {
        return false;
      }

      if(isInWysiwyg && dataMode.toText){
        this.dataType = modeId;
        this.checkState();
        this.syncEditors(silent);
      } else {
        this.changeMode(modeId);
      }
    },
    warnIfNecessary: function(oldMode, nextMode, callback, silent){
      var editor = this;
      if(silent || (nextMode.toText && oldMode.toHTML)){
        callback();
      } else {
        // TODO use i18n shortcut here
        if(nextMode.toText){
          text = 'noticeMissingToHTML';
        } else {
          text = 'noticeMissingToText';
        }
        dialogProxy = ME.getDialog('notice')(['Ok', 'Cancel'], _(text));
        dialogProxy.dialog('open', {
          submit: function(){
            if(callback){
              callback();
            }
          },
          cancel: function(){
            editor.toolbar.div.find('.changeDataMode')
              .val(oldMode.id);
          }
        });
      }
    },
    /**
     * Lock the Editor, idempotent
     */
    beginModeChange: function(){
      this.overlay.show();
    },
    syncEditors: function(silent) {
      var i, editorID, otherEditor, editorIDs,
      externalSelect = this.settings.select,
      newModeID = this.currentMode.id;

      if(externalSelect && !silent){
        editorIDs = externalSelect.data('editorIDs') || [];

        for(i = editorIDs.length; --i >= 0;){
          editorID = editorIDs[i];
          if(editorID === this.id){
            continue;
          }

          otherEditor = activeEditors[editorID];

          if(newModeID !== otherEditor.currentMode.id){
            otherEditor.changeMode(newModeID, true);
          } else { // wysiwyg datamode change
            otherEditor.changeDataMode(this.dataType, true);
          }
        }
      }
    },
    /**
     *
     */
    finalizeModeChange: function(silent){
      this.overlay.hide();
      this.syncEditors(silent);
    },
    /**
     * @returns {Mode} The current datamode
     */
    getDataMode: function() {
      return ME.getMode(this.dataType);
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
        // TODO this is to avoid double requests. This will not
        // synchronize on form submission
        // this.currentMode.updateTextArea(this, callback);
      } else {
        this.currentMode.updatePreview(this, callback);
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
      return this.currentMode.id === modeId;
    },
    /**
     * Check the state of the current selection (bold/italic etc.) and
     * change the toolbar.
     */
    checkState: function () {
      this.toolbar.setActive(this.currentMode.getStates(this));
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
