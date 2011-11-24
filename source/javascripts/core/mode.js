!function ($) {
  /**
   * Create a new Mode
   * @constructor
   * @param {Object} customFunctions these functions will be added to the Mode object
   */
  ME.Mode = function Mode(customFunctions){
    $.extend(this, customFunctions);
    // allow direct access of prototype methods from the mode instances
    this.prototype = Mode.prototype;
  };
  
  ME.Mode.prototype = {
    /**
     * The default pressed function to handle key combos (shift + x)
     *
     * @param {Editor} editor The editor to work on
     */
    pressed: function(editor, keyCode){
      if(keyCode === 16){
        ME.holdShift = true;
      }
      if(ME.util.isNeutralKey(keyCode)){
        ME.holdNeutralKey = true;
      }
    },
    /**
     * Handle special keys (shift press) to deal with key combos
     *
     * @param {Editor} editor The editor to work on
     */
    released: function(editor, keyCode){
      if(keyCode === 16){
        ME.holdShift = false;
      }
      if(ME.util.isNeutralKey(keyCode)){
        ME.holdNeutralKey = false;
      }
    },
    /**
     * Handle clicks on the textarea or html div
     *
     * @function
     */
    clicked: $.noop,
    /**
     * Activate this mode for the editor
     *
     * @param {Editor} editor The editor to work on
     */
    activate: function(editor, callback) {
      if(editor.preview.is(":empty")) {
        this.updatePreview(editor, callback);
      } else {
        this.updateTextArea(editor, callback);
      }
      editor.toolbar.loadModeToolbar(editor);
    },
    /**
     * Update the preview html div with the html representation of the
     *mode
     * CONSIDER move to editor
     *
     * @param {Editor} editor The editor to work on
     */
    updatePreview: function(editor, callback) {
      var html;
      if(this.toHTML){
        console.log("updating preview in Mode " + this.id);

        html = this.toHTML(editor, callback);
        if(html !== undefined){
          editor.preview.html(html || "<p>&nbsp;</p>");
          
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
    updateTextArea: function(editor, callback) {
      var text, dialogProxy;
      if(this.toText && (!editor.oldMode || editor.oldMode.toHTML)){
        console.log("updating TA in Mode " + this.id);

        text = this.toText(editor, callback);
        if(text !== undefined){
          editor.textArea.val(text);
          
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
     * Run after activation. Default behaviour for text modes. wysiwyg mode has 
     * its own version
     *
     * @param {Editor} editor The editor to work on
     */
    afterActivation: function(editor) {
      var preview = editor.preview;
      editor.textArea
        .parent().show()
        .find(":first-child").focus()[0]
        .setSelectionRange(0,0);
      editor.dataType = this.id;
      preview.attr("contentEditable",false);
      if(this.toHTML){
        preview.show();
      } else {
        preview.hide();
      }
    },
    /**
     * Get a state object which sets defines the states of the buttons
     * and the selects.
     *
     * @param {Editor} editor The editor to work on
     * @returns {Object} an object that describes the states
     */
    getStates: function(editor){
      var states = this.getSelectionStates(editor);
      if(this.id === 'wysiwyg'){
        states.wysiwyg = true;
        states.changeDataMode = editor.dataType;
      } else {
        states.changeDataMode = this.id;
      }
      return states;
    },
    /**
     * Get the state of the current selection. This is a placeholder.
     * Each mode should define its version
     *
     * @see Toolbar#getStates
     * @api
     *
     * @param {Editor} editor The editor to work on
     * 
     * @returns {Object} an object that describes the states
     */
    getSelectionStates: function(editor){
      return {};
    },
    /**
     * A helper function that builds a state object from the given
     * nodes, that defines the active buttons
     * 
     * CONSIDER make currentNodes a property
     * @param {Array} nodes The active nodes (e.g. a,li). The highest node is on the right
     * @param {Object} currentNodes A reference that will be filled with important nodes (e.g. a) to be used by the mode
     * 
     * @returns {Object} The state object
     */
    buildStateObject: function(nodes, currentNodes){
      function getTag(node){
        return node.tag ? node.tag : node.nodeName.toLowerCase();
      }
      var node, i = nodes.length, states = {};
      while(i--){
        node = nodes[i];
        switch (getTag(node)){
        case "a":
          currentNodes.a = node;
          states.link = true;
          break;
        case "img":
          currentNodes.img = node;
          states.insertImage = true;
          break;
        case "i":
          states.italic = true;
          break;
        case "b":
          states.bold = true;
          break;
        case "ol":
          states.orderedList = true;
          states.unorderedList = false;
          states.formatBlock = 'disable';
          states.alignLeft = 'disable';
          states.alignRight = 'disable';
          states.alignCenter = 'disable';
          currentNodes.list = node;
          break;
        case "ul":
          states.orderedList = false;
          states.unorderedList = true;
          states.formatBlock = 'disable';
          states.alignLeft = 'disable';
          states.alignRight = 'disable';
          states.alignCenter = 'disable';
          currentNodes.list = node;
          break;
        case "li":
          break;
        default:
          states.formatBlock = getTag(node);
          currentNodes.block = node;
          break;
        }
      }
      return states;
    },
    /**
     * @param {Editor} editor The editor to work on
     *
     * @returns {Boolean} True if the cursor is at the beginning of
     * the line
     */
    atBeginningOfLine: function(editor){
      var text = editor.textArea.val();
      return text[editor.selectionStart-1] === "\n";
    },
    /**
     * Get the selection. If a boundary is given, returned string is
     * extended to this boundary. The selection itself is not extended.
     *
     * @param {Editor} editor The editor to work on
     * @param {String} [boundary] The right and left boundary the
     * selection should be extended to
     *
     * @returns {String} The currently selected string
     */
    getSelection: function(editor, boundary) {
      var boundaryPosition, subString, outerLimit, outerLimitLength, searchLimit, boundaryStart, boundaryEnd, selectionEnd, selectionStart,
      textArea = editor.textArea,
      text = textArea.val();
      textArea.focus();

      editor.initSelectionProperties(text);
      selectionEnd = editor.selectionEnd;
      selectionStart = editor.selectionStart;

      if(boundary) {
        if(boundary.indexOf('\n') === -1){
          outerLimit = "\n";
        } else {
          outerLimit = "\n\n";
        }
        outerLimitLength = outerLimit.length;

        // find left boundary
        searchLimit = selectionStart - outerLimit.length;
        boundaryPosition = Math.max(text.lastIndexOf(boundary, searchLimit), text.lastIndexOf(outerLimit, searchLimit));
        if(boundaryPosition !== -1) {
          boundaryStart = boundaryPosition + outerLimitLength;
        } else {
          boundaryStart = 0;
        }
        
        // find right boundary, first limit the text to the
        // next new line
        boundaryPosition = text.indexOf(outerLimit, selectionEnd); 
        if(boundaryPosition === -1) {
          subString = text.slice(boundaryStart);
        } else {
          subString = text.slice(boundaryStart, boundaryPosition);
        }

        // Then find the next boundary
        boundaryPosition = 0;
        do{
          boundaryPosition = subString.indexOf(boundary, boundaryPosition + outerLimitLength);
        } while(boundaryPosition !== -1 && selectionEnd > boundaryStart + boundaryPosition);

        // when it doesn't exist, extend the selection to the
        // paragraph end
        if(boundaryPosition === -1) {
          boundaryPosition = subString.length;
        }
        boundaryEnd = boundaryStart + boundaryPosition;
      }
      
      editor.boundaryStart = boundary ? boundaryStart : selectionStart;
      editor.boundaryEnd = boundary ? boundaryEnd : selectionEnd;
      editor.boundaryDistance = boundary ? boundaryPosition : (selectionStart - selectionEnd);

      return text.slice(editor.boundaryStart, editor.boundaryEnd);
    },
    /**
     * Extend the selection to the given boundary and return it.
     *
     * @param {Editor} editor The editor to work on
     * @param {String} [boundary] The right and left boundary the
     * selection should be extended to
     *
     * @returns {String} The currently selected string
     */
    extendSelection: function(editor, boundary){
      var selection = this.getSelection(editor, boundary);
      editor.setSelectionRange(editor.boundaryStart, editor.boundaryEnd);
      return selection;
    },
    /**
     * Replace the current selection with the given string
     *
     * @param {Editor} editor The editor to work on
     * @param {String} string The replacement string
     * @param {Boolean} collapseToStart If the selection should collapse
     */
    replaceSelection: function(editor, string, collapseToStart) {
      var textArea = editor.textArea,
      newSelectionStart = editor.selectionStart,
      newSelectionEnd = editor.selectionStart + string.length;

      // gecko & webkit
      textArea.val(textArea.val().slice(0, editor.selectionStart) + string + textArea.val().slice(editor.selectionEnd, textArea.val().length));

      // move caret gecko
      if(collapseToStart === true){
        newSelectionEnd = newSelectionStart;
      } else if(collapseToStart === false){
        newSelectionStart = newSelectionEnd;
      }

      editor.setSelectionRange(newSelectionStart, newSelectionEnd);
      textArea.focus();
    },
    /**
     * Extend the right selection with a regexp. Everything matched will be added
     * to the selection. Useful for special cases like toggling parts of a bolded
     * String in textile
     *
     * @param {Editor} editor The editor to work on
     * @param {RegExp} regexp The regexp
     * 
     * @example
     * extendRightSelection(/ +/)
     */
    extendRightSelection: function(editor, regexp){
      var match;
      regexp = new RegExp(regexp.source,'g');
      regexp.lastIndex = editor.selectionEnd;
      match = regexp.exec(editor.textArea.val());

      if(match && regexp.lastIndex == editor.selectionEnd + match[0].length){
        editor.selectionEnd += match[0].length;
        return match[0];
      }
    },
    /**
     * Extend the left selection with a regexp. Everything matched will be added
     * to the selection. Useful for special cases like toggling parts of a bolded
     * String in textile
     *
     * @param {Editor} editor The editor to work on
     * @param {RegExp} regexp The regexp.
     * 
     * @example
     * extendLeftSelection(/[ .]+/)
     */
    extendLeftSelection: function(editor, regexp){
      var match, substring = editor.textArea.val().slice(0,editor.selectionStart);
      regexp = new RegExp(regexp.source + "$");
      match = regexp.exec(substring);
      
      if(match){
        editor.selectionStart -= match[0].length;
        return match[0];
      }
    }}; // ME.Mode.prototype
}(jQuery);

