!function ($, _, undefined){
  // keep the editors for things like checking which needs saving,
  // which has focus etc.
  var focusedEditor,
  activeEditors = [],
  numberOfEditors = 0;

  function processActions(editor, actions, modeId) {
    var i = 0,
    callbackIterator = function  () {
      console.log('calling', actions[i]);
      if(actions[i]){
        editor[actions[i++]](callbackIterator, modeId)
      }
    }

    actions.push('activateMode')
    callbackIterator()
  }
  
  ME.Hub = {
    loadEditor: function  (editor) {
      var actions = []
      editor.wysiwyg = !!editor.settings.source

      if(editor.wysiwyg && !editor.currentDataMode().toText ||
         !editor.wysiwyg && editor.settings.previewOnly){
        return ME.Hub.togglePreview(editor)
      }
      
      if(!editor.wysiwyg){
        actions.push('updatePreview')
      }
      processActions(editor, actions)
    },
    togglePreview: function (editor) {
      var actions = [
        editor.wysiwyg ? 'updateTextarea' : 'updatePreview',
        'setNewMode'
      ]
      processActions(editor, actions, 'wysiwyg')
    },
    /**
     * Change the current underlying data format
     * 
     * @param {String} modeId The id of the mode (e.g. textile)
     */
    changeDataMode: function  (editor, modeId) {
      if(!modeId || modeId === editor.currentMode().id) {
        return false;
      }
      
      var actions = ['showOverlay']
      if(editor.wysiwyg){
        actions.push('setNewMode')
      } else {
        actions.push('updatePreview', 'setNewMode', 'updateTextarea')
      }
      processActions(editor, actions, modeId)
    }
  }
  var methods = {
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
    syncEditors: function(silent) {
      var i, editorID, otherEditor, editorIDs,
      externalSelect = this.settings.select,
      newModeID = this.currentMode().id;

      if(externalSelect && !silent){
        editorIDs = externalSelect.data('editorIDs') || [];

        for(i = editorIDs.length; --i >= 0;){
          editorID = editorIDs[i];
          if(editorID === this.id){
            continue;
          }

          otherEditor = activeEditors[editorID];

          if(newModeID !== otherEditor.currentMode().id){
            otherEditor.changeMode(newModeID, true);
          } else { // wysiwyg datamode change
            otherEditor.changeDataMode(this.dataType, true);
          }
        }
      }
    }
  }; // end Editor prototype
}(jQuery, ME.t10n);
