(function($) {
  // TODO cache fields
  var opts, errorMsgType, initialized,
  methods = {
    check: function(options) {
      var $this = this, valid = true;
      //Hide any errors that are already showing
      $this.find(opts.errorElement + '.' + opts.errorClass).remove();
      $this.find(':input.' + opts.inputErrorClass).removeClass(opts.inputErrorClass);

      //Get all the required inputs
      $this.find(':input.required').each(function() {
        var $input = $(this),
        fieldValue = $.trim($input.val()),
        labelText = $input.siblings('label').text().replace(opts.removeLabelChar, ''),
        errorMsg = '';
        
        //Check if it's empty or an invalid email
        if(fieldValue === '') {
	  errorMsg = hasLabelPlaceholder ? errorMsg = opts.errorText.replace('{label}',labelText) : errorMsg = opts.errorText;
	  valid = false;
        } else if($input.hasClass('email')) {
	  if(!(/^([_a-z0-9-]+)(\.[_a-z0-9-]+)*@([a-z0-9-]+)(\.[a-z0-9-]+)*(\.[a-z]{2,4})$/.test(fieldValue))) {
	    errorMsg = hasLabelPlaceholder ? errorMsg = opts.emailErrorText.replace('{label}',labelText) : errorMsg = opts.emailErrorText;
	    valid = false;
	  }
        }
        
        //If there is an error, display it
        if(errorMsg !== '') {
          $input.parent().addClass(opts.errorClass);
	  //$input.addClass(opts.inputErrorClass).after('<'+opts.errorElement+' class="'+opts.errorClass+'">' + errorMsg + '</'+opts.errorElement+'>');
        }
      });

      return valid;
    },
    reset: function(){
      return this.find(':input.required').each(function(){
        $(this).parent().removeClass(opts.errorClass);
      });
    }
  };

  /**
   * Validates forms
   *
   * @memberOf jQuery.prototype
   *
   * @param {String} [method="init"] The method to call
   */
  $.fn.isValid = function(method) {
    if (!methods[method]) {
      method = 'check';
    }
    return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
  };
  
  $.fn.isValid.init = function(options){
    opts = $.extend({}, $.fn.isValid.defaults, options);
    hasLabelPlaceholder = opts.errorText.indexOf("{label}") > -1;
  };

  // default options
  $.fn.isValid.defaults = {
    errorClass: 'error',
    errorText: '{label} is a required field.',
    emailErrorText: 'Please enter a valid {label}',
    errorElement: 'strong',
    removeLabelChar: '*'
  };
})(jQuery);
(function ($) {
  var globalSettings = {}, availableModes = {}, toolbarItems = {}, toolbarHTML = "",
  availableItems = ['bold','italic','alignLeft','alignCenter','alignRight','unorderedList','orderedList','link','insertImage','save','wysiwyg','close','changeDataMode','formatBlock'],
  globalItems = [],
  emptyFunction = $.noop,
  // keep the editors for things like checking which needs saving,
  // which has focus etc.
  activeEditors = [],
  numberOfEditors = 0,
  focusedEditor;

  /**
   * Create a new Mode
   * @constructor
   * @name Mode
   * @param {Object} customFunctions these functions will be added to the Mode object
   */
  function Mode(customFunctions){
    $.extend(this, customFunctions);
    // allow direct access of prototype methods from the mode instances
    this.prototype = Mode.prototype;
  }
  
  Mode.prototype = /** @scope Mode.prototype */ {
    /**
     * The default pressed function to handle key combos (shift + x)
     */
    pressed: function(keyCode){
      if(keyCode === 16){
        ME.holdShift = true;
      }
      if(ME.util.isNeutralKey(keyCode)){
        ME.holdNeutralKey = true;
      }
    },
    /**
     * Handle special keys (shift press) to deal with key combos
     */
    released: function(keyCode){
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
    clicked: emptyFunction,
    /**
     * Activate this mode for the editor
     */
    activate: function(editor) {
      if(editor.htmlDiv.is(":empty")) {
        this.updatePreview(editor);
      } else {
        this.updateTextArea(editor);
      }
      editor.toolbar.loadModeToolbar(editor);
      this.afterActivation(editor);
    },
    /**
     * Update the preview html div with the html representation of the
     *mode
     * CONSIDER move to editor
     */
    updatePreview: function(editor) {
      console.log("updating preview in Mode " + this.name);
      editor.htmlDiv.html(this.toHTML(editor) || "<p>&nbsp;</p>");
    },
    /**
     * Update the textarea with the text representation of the mode
     */
    updateTextArea: function(editor) {
      console.log("updating TA in Mode " + this.name);
      editor.textArea.val(this.toText(editor));
    },
    /**
     * Run after activation. Default behaviour for text modes. wysiwyg mode has 
     * its own version
     */
    afterActivation: function(editor) {
      editor.textArea
        .parent().show()
        .find(":first-child").focus()[0]
        .setSelectionRange(0,0);
      editor.htmlDiv.attr("contentEditable",false);
    },
    /**
     * Get a state object which sets defines the states of the buttons
     * and the selects.
     * @returns {Object} an object that describes the states
     */
    getStates: function(editor){
      var states = this.getSelectionStates(editor);
      if(this.id === 'wysiwyg'){
        states.wysiwyg = true;
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
     * @param {String} [boundary] The right and left boundary the
     * selection should be extended to
     * @returns {String} The currently selected string
     */
    getSelection: function(editor, boundary) {
      var textArea = editor.textArea, text = textArea.val(), boundaryPosition, subString;
      textArea.focus();

      // gecko & webkit
      editor.initSelectionProperties();

      // TODO does this introduce some edgecases? Eating newlines
      // move this to initSelectionProperties?
      if(text[editor.selectionEnd-1] === "\n"){
        editor.selectionEnd -= 1;
      }

      if(boundary) {
        // find left boundary
        boundaryPosition = Math.max(text.lastIndexOf(boundary, editor.selectionStart), text.lastIndexOf("\n", editor.selectionStart));
        if(boundaryPosition !== -1) {
          editor.boundaryStart = boundaryPosition + 1;
        } else {
          editor.boundaryStart = 0;
        }
        
        // find right boundary, first limit the text to the
        // next new line
        boundaryPosition = text.indexOf("\n", editor.selectionEnd); 
        if(boundaryPosition === -1) {
          subString = text.slice(editor.boundaryStart);
        } else {
          subString = text.slice(editor.boundaryStart, boundaryPosition);
        }

        // Then find the next boundary
        boundaryPosition = 0;
        do{
          boundaryPosition = subString.indexOf(boundary, boundaryPosition + 1);
        } while(boundaryPosition !== -1 && editor.selectionEnd > editor.boundaryStart + boundaryPosition);

        // when it doesn't exist, extend the selection to the
        // paragraph end
        if(boundaryPosition === -1) {
          boundaryPosition = subString.length;
        }
        editor.boundaryEnd = editor.boundaryStart + boundaryPosition;
      }
      editor.boundaryDistance = boundaryPosition;
      return text.slice(editor.boundaryStart, editor.boundaryEnd);
    },
    extendSelection: function(editor, boundary){
      var selection = this.getSelection(editor, boundary);
      editor.setSelectionRange(editor.boundaryStart, editor.boundaryEnd);
      return selection;
    },
    /**
     * Replace the current selection with the given string
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
    }};
  
  

  /**
   * Create a button for the toolbar
   *
   * @constructor
   * @name ToolbarButton
   *
   * @property {String} name The class name of the button
   * @property {Function} clicked The action if the button is clicked upon
   * @property {Function} isAvailable Returns true if the the function
   * is available in the current editer
   *
   * @param {String} name The class name of the button
   * @param {Function} [clicked] The action if the button is clicked
   * @param {Function} [isAvailable] Returns true if the the function
   * is available in the current editer
   */
  function ToolbarButton(name, clicked, isAvailable){
    this.name = name;
    this.isAvailable = isAvailable;
    if(clicked){
      this.clicked = clicked;
      globalItems.push(name);
    }
  }
  ToolbarButton.prototype = /** @scope ToolbarButton.prototype */{
    /**
     * @returns {String} A html string of the button
     */
    getButton: function() {
      return '<a href="#" class=\"'+ this.name +'" ><span>'+ this.name +'</span></a>';
    }
  };

  /**
   * Create a select for the toolbar
   *
   * @constructor
   * @name ToolbarSelect
   * @augments ToolbarButton
   *
   * @property {Array} options The options of the select dropdown
   *
   * @param {String} name The class name of the button
   * @param {Array} [options] The options of the select dropdown
   * @param {Function} [clicked] The default action if the button is clicked
   */
  function ToolbarSelect(name, options, clicked){
    ToolbarButton.apply(this, [name, clicked]);
    this.options = options || [];
  }
  ToolbarSelect.prototype = /** @scope ToolbarSelect.prototype */{
    /**
     * @returns {String} A html string of the button
     */
    getButton: function() {
      var select = "<select class=\"" + this.name +  "\">",
      optionsLength = this.options.length,
      i;

      select.className = this.name;

      for (i = 0; i < optionsLength; i += 1){
        select += "<option value=\"" + this.options[i][0] + "\">" + this.options[i][1] + "</option>";
      }
      return select + "</select>";
    }
  };  // end ToolbarSelect

  /**
   * Create the HTML representation of the editors toolbar
   *
   * @returns {String} The toolbar
   */
  function getToolbarHTML(){
    var i,l, item;

    if(!toolbarHTML){
      for(i=0,l=availableItems.length; i < l ; i++){
        item = toolbarItems[availableItems[i]];
        if(item){
          toolbarHTML += item.getButton();
        }
      }
    }

    return toolbarHTML;
  }
  
  /**
   * Create a toolbar for an editor. Every editor has its own toolbar, since the
   * items of the toolbar can be defined on a per editor basis (save callback)
   *
   * @constructor
   * @name Toolbar
   */
  function Toolbar(editor) {

    // init Toolbar Items
    var button, buttonTags = '',
    toolbarDiv = $("<div class=\"toolbar\"></div>"),
    that = this;

    this.div = toolbarDiv;

    toolbarDiv.html(getToolbarHTML());

    toolbarDiv.mouseup(function(e) { // Trigger on button click
      var target = e.target;

      if((/(a|span)/i).test(target.nodeName)) {
        // When the span is clicked change the Target to the
        // containing div
        if(/span/i.test(target.nodeName)) {
          target = target.parentNode;
        }
        if(target.disabled){
          // TODO handle focus somewhere
          if(editor.is('wysiwyg')){
            editor.htmlDiv.focus();
          } else {
            editor.textArea.focus();
          }
          return false;
        }
        var action = target.className;

        action = action.split(" ")[0];
        that.runAction(editor, action, target);
        // TODO this does not work with dialogs
        // in dialogs this gets set manually, but perhaps there is a
        // more general way?
        editor.checkState();
      }
    }).change(function(e) { // trigger on select change
      var target = e.target;
      that.runAction(editor, target.className, target);
      return false;
    }).click(function(e){return false; }); //
  } // end initToolbar

  Toolbar.prototype = /** @scope Toolbar.prototype */{
    /**
     * Load the toolbar for the current mode. If a toolbar item is not
     * supported, it will be hidden.
     */
    loadModeToolbar: function(editor){
      var supportedItems = editor.currentMode.supportedItems,
      oldVisibleItems = this.visibleItems,
      newVisibleItems = [];
      
      // Optimize: better scheme. Calculate the differences between
      // the modes once and use them here
      this.div.children().each(function(){
        var item = this.className.split(' ')[0], isAvailable = toolbarItems[item].isAvailable;
        if(supportedItems.indexOf(item) != -1 && (!isAvailable || isAvailable(editor))){
          if(!oldVisibleItems || oldVisibleItems.indexOf(item) == -1){
            $(this).show();
          }
          newVisibleItems.push(item);
        } else {
          if(!oldVisibleItems || oldVisibleItems.indexOf(item) != -1){
            $(this).hide();
          }
        }
      });
      this.visibleItems = newVisibleItems;
    },
    /**
     * Execute the given action of the current mode
     * 
     * @param {String} action The action to execute
     * @param {HTMLElement} target The target of the click
     */
    runAction: function(editor,action,target) {
      var item = toolbarItems[action],
      mode = editor.currentMode;

      // execute buttons clicked action
      (item[mode.id] || item).clicked(editor, target);
      
      // Update Preview in case something has changed
      if(action != "changeMode" && !editor.is("wysiwyg")) {
        mode.updatePreview(editor);
      }
    },
    /**
     * Activate the buttons/selects of the given actions on the toolbar
     * 
     * @param {Object} actions The actions which should be active
     */
    setActive: function( actions ) {
      // activate each action in actions
      if(actions) {
        this.div.children().each(function(i) {
          var action = this.className.split(" ")[0];
          if (actions[action] == 'disable') { // deactivate
            this.disabled = true;
            this.className = action + " disabled";
          } else {
            this.disabled = false;
            this.className = action;
            if(actions[action] === true) { // buttons
              this.className = action + " on";
            } else if(actions[action]){ // selects
              this.value = actions[action];
            }
          }
        });
      }
    }
  }; // end Toolbar prototype
  
  /**
   * Create a new Editor
   * 
   * An editor has a current mode and a textarea mode. Both are the same if you 
   * edit the textarea directly (e.g. textile). In the wysiwyg mode you edit the
   * html directly.
   *
   * @constructor
   * @name Editor
   * 
   * @param {jQuery} textArea The textarea
   * @param {Object} settings Editor specific settings
   */
  function Editor(textArea, settings) {
    var editor = this, timer = 0, htmlDiv = settings.htmlDiv;

    this.setDataType(textArea.attr("class"));
    this.settings = settings;

    if(!this.dataType) { return ;}

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

    if(htmlDiv){
      htmlDiv.addClass('preview');
    } else {
      htmlDiv = $("<div class=\"preview\"></div>");
    }
    this.htmlDiv = htmlDiv.bind("mouseup keyup", function() {
        if(editor.is("wysiwyg")) {
          editor.checkState();
        }
      });
    addKeyListeners(this.htmlDiv);
    
    this.toolbar = new Toolbar(this);
    this.container = textArea.wrap("<div class=\"markupEditor\"></div>")
      .parent().append(editor.htmlDiv).
      prepend(this.toolbar.div);
    textArea.wrap("<div class=\"textarea\">");

    activeEditors[numberOfEditors] = editor;
    editor.id = numberOfEditors;
    // console.log("init editor " + numberOfEditors);
    numberOfEditors ++;
  } // Editor

  Editor.prototype = /** @scope Editor.prototype */{
    /**
     * Change the current mode to the given id
     * 
     * @param {String} modeId The id of the mode (e.g. textile)
     */
    changeMode: function(modeId) {
      var nextMode;
      nextMode = ME.getMode(modeId);
      this.synchronize();
      this.currentMode = nextMode;
      nextMode.activate(this);
    },
    /**
     * Change the current underlying data format
     * 
     * @param {String} modeId The id of the mode (e.g. textile)
     */
    changeDataMode: function(modeId){
      var isInWysiwyg = this.is('wysiwyg');
      if(!modeId || modeId === this.currentMode.id) {
        return false;
      }
      this.changeMode(modeId);
      if(isInWysiwyg){
        this.changeMode('wysywyg');
      }
    },
    /**
     * @returns {Mode} The current datamode
     */
    getDataMode: function() {
      return ME.getMode(this.dataType);
    },
    /**
     * Extract the datatype from the given class string 
     *
     * @param {String} classString The class string of the editor element
     */
    setDataType: function(classString) {
      var i, cssClass,
      cssClasses = classString.split(/\s+/);

      for(i = 0; i < cssClasses.length; i += 1) {
        cssClass = cssClasses[i];

        if(cssClass !== "wysiwyg" && availableModes[cssClass]) {
          this.dataType = cssClass;
        }
      }
    },
    initSelectionProperties: function(){
      var textArea = this.textArea;
      
      this.scrollPosition = textArea.scrollTop;
      this.selectionStart = textArea[0].selectionStart;
      this.selectionEnd = textArea[0].selectionEnd;
    },
    setSelectionRange: function(selectionStart, selectionEnd){
      this.textArea[0].setSelectionRange(selectionStart, selectionEnd);
      this.selectionStart = selectionStart;
      this.selectionEnd = selectionEnd;
    },
    /**
     * Synchronize the changes between preview div and the text area
     */
    synchronize: function() {
      if(this.is("wysiwyg")) {
        ME.getMode(this.dataType).updateTextArea(this);
      } else {
        this.currentMode.updatePreview(this);
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
      var replacement = this.settings.htmlDiv || this.textArea;
      this.synchronize();
      
      this.container.replaceWith(replacement);
      replacement.removeClass('preview').unbind()
        .attr('contentEditable',false).show()
        .markupEditor('prepare', this.settings);
    }
  }; // end Editor prototype

  /**
   * @namespace Holds all public methods
   */
  ME = {
    /**
     * Add a mode
     *
     * @param {String} modeId The id of the mode as referenced
     * internally
     * @param {Object} modeDefinition Defines methods and toolbaritems
     * of the new Mode 
     */
    addMode: function(modeId, modeDefinition) {
      var items = modeDefinition.items, constructor, supportedItems = globalItems.slice();
      modeDefinition.id = modeId;
      
      if(items) {
        for( item in items) {
          if(items.hasOwnProperty(item) && item !== "default") {
            supportedItems.push(item);
            if(!toolbarItems[item]) {
              constructor = items[item].options ? ToolbarSelect : ToolbarButton;
              toolbarItems[item] = new constructor(item);
            }
            toolbarItems[item][modeId] = $.extend({name: item}, items["default"], items[item]);
          }
        }
      }

      if(modeId !== 'wysiwyg'){
        toolbarItems.changeDataMode.options.push([modeId, modeDefinition.name]);
      }

      modeDefinition.supportedItems = supportedItems;
      
      return availableModes[modeId] = new Mode(modeDefinition);
    },
    /**
     * Get the specified mode. Loads it if necessary
     *
     * @param {String} modeId The id of the mode (e.g. textile)
     *
     * @returns {Mode} The initialized mode
     */
    getMode: function(modeId) {
      var mode = availableModes[modeId];
      if (mode) {
        return mode;
      }
      else {
        console.log("Mode " + modeId + " is not defined");
      }
    },
    /**
     * The global options of markup editor
     *
     * @class
     * @property {Function} save The save callback. Takes the editor
     * as parameter
     * @property {Boolean} closable If true, the close button is
     * visible
     * @property {jQuery} htmlDiv The htmlDiv the editor has been
     * loaded from
     */
    options: {},
    /**
     * Set the options
     *
     * @see ME#options for settable options
     *
     * @param {Object} options The options object
     */
    setOptions: function(options){
      this.options = options;
    }
  };

  toolbarItems.changeDataMode = new ToolbarSelect("changeDataMode", [], function(editor, mode, target) {
    editor.changeDataMode(target.value);
  });

  toolbarItems.formatBlock = new ToolbarSelect("formatBlock",[
    ["p", "Paragraph"],
    ["h1", "Heading 1"],
    ["h2", "Heading 2"],
    ["h3", "Heading 3"]
  ]);

  toolbarItems.save = new ToolbarButton("save", function(editor){
    editor.synchronize();
    editor.settings.save(editor);
  }, function(editor){
    return editor.settings.save;
  });

  toolbarItems.wysiwyg = new ToolbarButton("wysiwyg", function(editor, mode){
    if(editor.is('wysiwyg')){
      editor.changeMode(editor.dataType);
    } else {
      editor.changeMode('wysiwyg');
    }
  });

  toolbarItems.close = new ToolbarButton('close', function(editor){
    editor.close();
  }, function(editor) {
    var settings = editor.settings;
    return settings.htmlDiv || settings.closable;
  });

  /**
   * @name jQuery
   * @namespace The popular DOM utility
   */

  var methods = {
    /**
     * Create the markup editor
     *
     * @param {Object} settings The specific settings for the editor
     * @see ME#settings
     */
    init: function(settings) {
      ME.settings = settings;
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
   * @memberOf jQuery.prototype
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
   * @memberOf ME
   * @inner
   * @param {jQuery} container The element which will be editable
   * @param {Option} settings Settings for this editor
   */
  function initEditorFromHTML(container, settings){
    container.css("min-height", container.height());
    var editor,
    textarea = $("<textarea class=\"" + container[0].className + "\">");
    container.before(textarea); // needs to be attached to DOM in firefox

    settings = settings || {};
    settings.htmlDiv = container;
    editor = initEditorFromTextarea(textarea, settings);
    editor.currentMode.updateTextArea(editor);
    editor.changeMode("wysiwyg");
    editor.checkState();
  }
  
  /**
   * Initialize the editor from a given textarea
   *
   * @memberOf ME
   * @inner
   * @param {jQuery} textarea The textarea which will be enhanced
   * @param {Option} instanceSettings Settings for this editor
   */
  function initEditorFromTextarea(textarea,instanceSettings){
    var editor,settings = {};
    $.extend(settings,globalSettings,instanceSettings);
    editor = new Editor(textarea, settings);

    editor.currentMode = editor.getDataMode();

    if(textarea.hasClass("wysiwyg")) {
      // TODO better flow here
      editor.currentMode.activate(editor);
      editor.currentMode = ME.getMode("wysiwyg");
    }
    editor.currentMode.activate(editor);
    editor.checkState();
    return editor;
  }
  
}(jQuery));
(function(ME){
  // Do not include Enter, Backspace, Delete
  neutralKeys = "9.16.17.18.20.27.33.34.35.36.37.38.39.40.45.91.93.93";
  
  ME.util = {
    isNeutralKey: function (keyCode){
      return neutralKeys.indexOf(""+keyCode) != -1;
    },
    isRemovalKey: function (keyCode){
      return keyCode == 46 || keyCode == 8;
    }
  };
})(ME);
(function($, ME){
  var isNeutralKey = ME.util.isNeutralKey,
  isRemovalKey = ME.util.isRemovalKey;

  $.fn.enhanceTextfield = function(options){
    options = options || {};

    return this.each(function(){
      var $t = $(this), $btn, keyPressed,
      defaultColor = $t.css("color");

      function displayPrompt(){
        $t.css("color","grey").data('hasPrompt', true).val(options.prompt);
      }

      function clearField(){
        $t.css("color", defaultColor).data('hasPrompt', false).val('');
      }

      function checkState(){
        if($t.val() && $t.val() !== options.prompt){
          $t.css("color", defaultColor);
          $btn.show();
        } else {
          displayPrompt();
          $btn.hide();
          keyPressed = false;
        }
      }

      if($t.is("input")){
        $btn = $("<span>x</span>").click(function(){
          clearField();
          $t.focus();
          $btn.hide();
          keyPressed = false;
        });
        $p = $t.wrap("<span class=\"clearButton\">")
          .focus(function(){
            if(!keyPressed && $t.val() === options.prompt){
              clearField();
            }
            $t.parent().addClass('focus');
          })
          .focusout(function(){
            if(!keyPressed && !$t.val()){
              displayPrompt();
            }
            $t.parent().removeClass('focus');
          })
          .keydown(function(e){
            if(!isNeutralKey(e.which) &&
               // User may try to delete the prompt. Help him with that
               (!keyPressed || isRemovalKey(e.which)) &&
               $t.val() === options.prompt){
              clearField();
            }
          })
          .keyup(function(e){
            if(!keyPressed && (
              !isNeutralKey(e.which) &&
                // Prevent reapearing of the prompt after it has just
                // been deleted
                !isRemovalKey(e.which)
            )){
              keyPressed = true;
              checkState();
            }
          })
          .bind("blur change",function(){
            checkState();
          })
          .submit(function(){
            if($t.val() === options.prompt){
              clearField();
            }
          })
          .parent().append($btn);
        if($t.hasClass("ui-corner-left")){
          $p.addClass("ui-corner-left");
        } else {
          $p.addClass("ui-corner-all");
        }
      }
    });
  };
})(jQuery, ME);
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
  $.widget( "ui.combobox", {
    _create: function() {
      var input = this.element,
      key = this.options.key,
      escapeRegex = $.ui.autocomplete.escapeRegex;
      input.autocomplete({
	delay: 0,
	minLength: 0,
	source: function( request, response ) {
	  var matcher = new RegExp( escapeRegex(request.term), "i" ),
          options = ME.options[key] || [],
          l = options.length,
          filtered = [],
          text, i;
          
          if( !request.term ){
            filtered = options;
          } else {
            for(i = 0;i<l;i++){
              text = options[i];
              if ( matcher.test(text) ) {
                filtered.push( {
		  label: text.replace(
		    new RegExp(
		      "(?![^&;]+;)(?!<[^<>]*)(" +
			escapeRegex(request.term) +
			")(?![^<>]*>)(?![^&;]+;)", "gi"
		    ), "<strong>$1</strong>" ),
		  value: text
		});
              }
            }
          }
	  response( filtered );
	},
        focus: function(event, ui){
          input.val(ui.item.value).change();
        }
      })
	.addClass( "ui-corner-left" );

      input.data( "autocomplete" )._renderItem = function( ul, item ) {
	return $( "<li></li>" )
	  .data( "item.autocomplete", item )
	  .append( "<a>" + item.label + "</a>" )
	  .appendTo( ul );
      };

      this.button = $( "<button type='button'>&nbsp;</button>" )
	.attr( "tabIndex", -1 )
	.attr( "title", "Show All Items" )
	.insertAfter( input )
	.button({
	  icons: {
	    primary: "ui-icon-triangle-1-s"
	  },
	  text: false
	})
	.removeClass( "ui-corner-all" )
	.addClass( "ui-corner-right ui-button-icon" )
	.click(function() {
	  // close if already visible
	  if ( input.autocomplete( "widget" ).is( ":visible" ) ) {
	    input.autocomplete( "close" );
	  } else {
	    // pass empty string as value to search for, displaying
            // all results
            if(input.data("hasPrompt")){
              input.val("");
            }
	    input.autocomplete( "search", "" );
	    input.focus();
          }
	});
    },

    destroy: function() {
      this.button.remove();
      $.Widget.prototype.destroy.call( this );
    }
  });
})(jQuery, ME);
(function($){
  var callback;
  $.fn.isValid.init();
  function initDialog(dialogNode, fields, availableButtons){
    var fieldsLength = fields.length, $form = dialogNode.find(":first-child");
    dialogNode.dialog({
      autoOpen: false,
      width: 600,
      close: function() {
        if(callback.close){
          callback.close();
        }
        for(i = 0; i < fieldsLength; i++){
          fields[i].val('')
            .removeAttr('checked')
            .removeAttr('selected');
        }
      },
      open: function(){
        for(i = 0; i < fieldsLength; i++){
          fields[i].change();
        }
        fields[0][0].setSelectionRange(0,0);
        $form.isValid('reset');
      }
    });

    return {
      dialog: function(task, cb){
        if(cb){
          callback = cb;
        }
        dialogNode.dialog(task);
      },
      find: function(query){ return dialogNode.find(query); },
      selectButtons: function(buttonNames){
        var buttons={},i=buttonNames.length;
        while(i--){
          buttons[buttonNames[i]] = availableButtons[buttonNames[i]];
        }
        dialogNode.dialog('option','buttons',buttons);
      },
      val: function(query,value){
        this.find(query).val(value);
      }
    };
  }

  var t10n = {
    linkTitle: 'Link',
    insertImageTitle: 'Image',
    uri: 'Link',
    uriPrompt: 'Enter or select link',
    title: 'Title',
    titlePrompt: 'Enter title',
    imageUri: 'Image Source'
  };

  function createDialog(name, fields){
    var $dialogNode, proxy, i, fieldName, jQueryFunctions, method, args,
    fieldsLength = fields.length,
    $fields = [];

    $dialogNode = $('<div id=\"'+ name + '-dialog\" title=\"' + 
                    t10n[name + "Title"] + '\"><form>');
    var $form = $dialogNode.find(":first-child");
    
    for(i=0; i < fieldsLength; i++){
      fieldName = fields[i][0];
      jQueryFunctions = fields[i][1];
      
      $form.append(
        '<label for=\"' + fieldName + '\">'+ t10n[fieldName] + '</label>'
      );
      $fields[i] = $('<input type=\"text\" class=\"' + fieldName + '\" name=\"' + fieldName + "\">")
        .appendTo($form);
      
      if(jQueryFunctions){
        for(method in jQueryFunctions){
          if(jQueryFunctions.hasOwnProperty(method)){
            args = jQueryFunctions[method];
            $fields[i][method](args);
          }
        }
      }
      $fields[i].enhanceTextfield({prompt: t10n[fieldName+"Prompt"]});
    }
    
    submit = function() {
      var args = [],i;
      for(i=0; i < fieldsLength; i++){
        args[i] = $fields[i].submit().val();
      }
      if($form.isValid()){
        callback.submit.apply(this,args);
        $dialogNode.dialog("close");
      }
    };

    proxy = initDialog($dialogNode, $fields, {
      Create: submit,
      Update: submit,
      Remove: function(){
        callback.remove();
        $dialogNode.dialog("close");
      },
      Cancel: function() {
	$dialogNode.dialog("close");
      }
    });
    
    return function(buttonNames){
      proxy.selectButtons(buttonNames);
      return proxy;
    };
  }
  
  ME.dialog = {
    link: createDialog('link',[
      ['title', {
        required: true
      }],
      ['uri', {
        combobox: {key: 'uri'},
        required: true
      }]
    ]),
    insertImage: createDialog('insertImage', [
      ['imageUri', {
        combobox: {key: 'imageUri'},
        required: true
      }],
      ['title'],
      ['uri', {
        combobox: {key: 'uri'}
      }]
    ])
  };
})(jQuery);
(function() {
  var $ = jQuery, textileMode;

  /**
   * Iterate over each paragraph and call the functor on it and set the paragraphs
   * CONSIDER rename or move setParagraphs out of it
   *
   * @param {Editor} editor The editor to work on
   * @param {Function} functor The functor will be applied on each paragraph
   */
  function eachParagraph(editor, functor) {
    var paragraphs = textileMode.getParagraphs(editor), paragraphsLength = paragraphs.length;

    for(i = 0; i < paragraphsLength; i++) {
      paragraphs[i] = functor(paragraphs[i]);
    }
    textileMode.setParagraphs(editor, paragraphs);
  }

  /**
   * Apply the functor to each given line
   *
   * @param {String[]} lines The line array
   * @param {Function} functor The function which will be applied to
   * each line
   */
  function eachLine(lines, functor){
    var linesLength = lines.length,
    i, line, lineStart, match;
    for(i = 0; i < linesLength; i++) {
      line = lines[i];

      // Skip blank lines
      if( !/^\s*$/.test(line)) {
        match = line.match(/^((?:\w+\. )?(?: *[\*#] )?)\s*(.*)/);
        lineStart = match[1];
        line = match[2];

        functor(i, lineStart, line);
      }
    }
  }

  /**
   * Apply the functor to each line of the current selection.
   *
   * @param {Editor} editor The editor to work on
   * @param {String} boundary The boundary to which the Selection will
   * be extended e.g. '\n', ' '
   * @param {Function} functor The function to apply to each line
   */
  function replaceEachLine(editor, boundary, functor){
    var lines = textileMode.extendSelection(editor, boundary).split("\n");

    eachLine(lines, function(i, lineStart, line){
      lines[i] = functor(lineStart, line);
    });
    
    textileMode.replaceSelection(editor, lines.join("\n"));
  }

  /**
   * Get the first line of the selection, without the special textile
   * tokens which might be at the start of the line.
   *
   * @param {Editor} editor The editor to work on
   *
   * @returns {String} The first line of the selection
   */
  function firstLine(editor, boundary){
    // lines has only one element
    var lines = textileMode.extendSelection(editor, boundary).split("\n").slice(0,1),
    lineLength = lines[0].length;
    editor.selectionEnd = editor.selectionStart + lineLength;
    // Ignore special textile tokens at the beginnig of the line
    eachLine(lines, function(i, lineStart, line){
      editor.setSelectionRange( editor.selectionStart + lineStart.length, editor.selectionEnd);
      lines[i] = line;
    });
    return lines[0];
  }

  /**
   * Execute align command
   * 
   * @param {Editor} editor The editor to work on
   * @param {String} orientation The orientation of the alignment
   */
  function align(editor, orientation) {
    eachParagraph(editor, function(paragraph) {
      var classes, classesLength, newClasses = [];
      if(/^\w+\([^)]+\)\./.test(paragraph)) {
        classes = jQuery.trim(paragraph.slice(paragraph.indexOf("(") + 1, paragraph.indexOf(")"))).split(/\s+/);
        classesLength = classes.length;
        for(i=0 ; i < classesLength ; i++ ){
          if(classes[i] != 'right' && classes[i] != 'left' && classes[i] != 'center'){
            newClasses.push(classes[i]);
          }
        }
        newClasses.push(orientation);
        return paragraph.replace(/^(\w+)[^.]+.\s+/, "$1(" + newClasses.join(" ") + "). ");
      } else if(/^\w+\./.test(paragraph)) {
        return paragraph.replace(/^(\w+)\.\s*/, "$1(" + orientation + "). ");
      } else {
        return "p(" + orientation + "). " + paragraph;
      }
    });
  }

  /**
   * Scan the textarea for the first match and set selection to it.
   * This is useful e.g. for finding a link markup with a given source
   * 
   * @param {Editor} editor The editor to work on
   * @param {RegExp} r The regexp to search for
   */
  function scanForMatch(editor, r){
    var text = editor.textArea.val(),
    match = r.exec(text);
    if(r.lastIndex === 0){
      return;   // TODO escalate this return to break the caller too
    }
    while(r.lastIndex < editor.selectionStart){
      match = r.exec(text);
    }

    // needed for the replaceSelection call
    editor.setSelectionRange(r.lastIndex - match[0].length, r.lastIndex);

    return match;
  }

  /**
   * Toggle lists on and of
   *
   * @param {Editor} editor The editor to work on
   * @param {HTMLElement} target The clicked button
   * @param {String} bullet The bullet string e.g. '*'
   */
  function toggleList(editor, target, bullet){
    replaceEachLine(editor, "\n", function(lineStart, line){
      if(!/ on$/.test(target.className)){
        line = bullet + " " + line;
      }
      return line;
    });
  }

  /**
   * The available types of lists in Textile
   */
  var listTypes = {
    ul: '*',
    ol: '#'
  };

  /**
   * Handles enter inside lists, so that list are continued
   * 
   * @param {Editor} editor The editor to work on
   *
   * @returns {Boolean} Returns false to prevent the default browser behaviour
   */
  function pressedEnter(editor){
    var list = editor.currentNodes.list, replacement;

    if(list && /(u|o)l/i.test(list.tag)){ // only headings
      textileMode.getSelection(editor);
      if(ME.holdShift){
        replacement = " <br> ";
      } else {
        replacement = "\n" + listTypes[list.tag] + " ";
      }
      textileMode.replaceSelection(editor, replacement, false);
      return false;
    }
  }
  /**
   * @name textileMode
   * @namespace holds the methods from the textile mode
   * @augments Mode
   */
  textileMode = ME.addMode('textile', /** @scope textileMode.prototype */{
    /**
     * The long name of the mode
     * @property
     */
    name: "Textile Mode",
    /**
     * Holds the supported toolbaritems
     * @property
     */
    items: {
      "default": {
        /**
         * The default action for the buttons. With textile this works
         * for the same delimiters right and left
         *
         * @param {Editor} editor The editor to work on
         */
        clicked: function(editor, target) {
          // TODO find left and right boundaries that are valid
          var match, that = this;
          replaceEachLine(editor, " ", function(lineStart, line){
            if(/ on$/.test(target.className)){
              
              // first handle the left part
              match = line.match(that.leftRegExp);
              if(match){
                line = (match[1] || "") + line.slice(match[0].length);
              } else {
                // place delimiter left and extend selection
                line = that.delimiter + textileMode.extendLeftSelection(editor, /[ .]+/) + line;
              }

              // Then handle the right
              match = line.match(that.rightRegExp);
              if(match){
                line = line.slice(0, - match[0].length) + (match[1] || ""); 
              } else {
                line += textileMode.extendRightSelection(editor, / +/) + that.delimiter;
              }
              
            } else {
              // Apply markup within a block so that "*h1. ...*" for
              // example is never produced
              line = $.trim(that.delimiter + line) + that.delimiter;
            }
            return lineStart + line;
          });
        }
      },
      bold: {
        delimiter: "*",
        leftRegExp: /^(\w+\. )?\s*\*/,
        rightRegExp: /\*([\.]*)$/
      },
      italic: {
        delimiter: "_",
        leftRegExp: /^(\w+\. )?\s*_/,
        rightRegExp: /_([\.]*)$/
      },
      alignLeft: {
        clicked: function(editor) {
          align(editor, "left");
        }
      },
      alignRight: {
        clicked: function(editor) {
          align(editor, "right");
        }
      },
      alignCenter: {
        clicked: function(editor) {
          align(editor, "center");
        }
      },
      unorderedList: {
        clicked: function(editor, target) {
          toggleList(editor, target, "*");
        }
      },
      orderedList: {
        clicked: function(editor, target) {
          toggleList(editor, target, "#");
        }
      },
      link: {
        clicked: function(editor, target) {
          var dialog, callback, titleString, href, r, match;
          
          callback = {
            submit: function(title,uri){
              textileMode.replaceSelection(editor, "\"" + title + "\":" + uri);
            },
            remove: function(){
              textileMode.replaceSelection(editor, match[1]);
            },
            close: function(){
              textileMode.updatePreview(editor);
              editor.checkState();
            }
          };

          if(/ on$/.test(target.className)){
            dialog = ME.dialog.link(['Update','Remove','Cancel']);
            href = editor.currentNodes.a.attributes.href;

            match = scanForMatch(editor, new RegExp('\"([^\"]*)\":'+href,'g'));
            titleString = match[1];
            dialog.val('input.uri', href);
          }
          else {
            dialog = ME.dialog.link(['Create','Cancel']);
            titleString = firstLine(editor, " ");
          }
          
          if(!/^\s*$/.test(titleString)){
            dialog.val('.title', titleString);
          }
          
          dialog.dialog('open', callback);
        }
      },
      insertImage: {
        clicked: function(editor, target) {
          var dialog, callback, href, src, r;

          callback = {
            submit: function(imageUri,title,uri){
              var replacement = imageUri;
              if(title && !/^\s*$/.test(title)){
                replacement = replacement + "(" + title + ")";
              }
              replacement = "!" + replacement + "!";
              if(uri && !/^\s*$/.test(uri)){
                replacement = replacement + ":" + uri;
              }

              textileMode.replaceSelection(editor, replacement);
            },
            remove: function(){
              textileMode.replaceSelection(editor, "");
            },
            close: function(){
              textileMode.updatePreview(editor);
              editor.checkState();
            }
          };
          
          if(/ on$/.test(target.className)){
            dialog = ME.dialog.insertImage(['Update','Remove','Cancel']);
            src = editor.currentNodes.img.attributes.src;

            scanForMatch(editor, new RegExp('!' + src + "(\\([^\\)]*\\))?!(:[^ \n]*)?",'g'));
            
            if(editor.currentNodes.a){
              href = editor.currentNodes.a.attributes.href;
            }
            dialog.val('input.uri', href);
            dialog.val('input.imageUri', src);
            dialog.val('input.title', editor.currentNodes.img.attributes.title);
          }
          else {
            dialog = ME.dialog.insertImage(['Create','Cancel']);
            firstLine(editor, " ");
          }

          dialog.dialog('open', callback);
        }
      },
      formatBlock: {
        clicked: function(editor, target) {
          eachParagraph(editor, function(paragraph) {
            if(/^\w+(\([\w ]+\))?\./.test(paragraph)) {
              return paragraph.replace(/^\w+(\([\w ]+\))?\.\s+/, target.value + "$1. ");
            } else if(/^[\*#] /.test(paragraph)){ // ignore lists
              return paragraph;
            } else {
              return target.value + ". " + paragraph;
            }
          });
        }
      }
    },
    /**
     * Compile textile and update the preview div
     *
     * @param {Editor} editor The editor to work on
     */
    updatePreview: function(editor) {
      var html = textileCompiler.compile(editor.textArea.val());
      editor.htmlDiv.html(html);
    },
    /**
     * Convert preview div to textile
     * 
     * @param {Editor} editor The editor to work on
     *
     * @returns {String} A textile string
     */
    toText: function(editor, html) {
      if(!html){
        html = editor.htmlDiv.html();
      }

      /**
       * Fetch the regexps for the given tags and call the given
       * callback
       *
       * TODO get rid of the tags parameter?
       */
      function eachRegexp(tags, callback){
        var i, item,
        items = {
          b: [/<(?:b|strong)>((.|[\r\n])*?)<\/(?:b|strong)>/gi,'*'],
          i: [ /<(?:i|em)>((.|[\r\n])*?)<\/(?:i|em)>/gi, '_'],
          del: [ /<(?:strike|del)>((.|[\r\n])*?)<\/(?:strike|del)>/gi, '-'],
          u: [ /<(?:u|ins)>((.|[\r\n])*?)<\/(?:u|ins)>/gi, '+']
        };
        for(i = tags.length; i; i--){
          item = items[tags[i-1]];
          callback(item[0], item[1]);
        }
      }

      html = html.replace(/\s*<(ul|ol)>((.|[\r\n])*?)<\/\1>\s*/gi, function(match, tag, items){
        var bullet = tag == 'ul' ? '*' : '#';
        
        eachRegexp(['b','i', 'u', 'del'], function(regexp, delimiter){
          items = items.replace(regexp, delimiter + '$1' + delimiter);
        });

        return items.replace(/\s*<li>((.|[\r\n])*?)<\/li>\s*/gi, bullet + " $1\n") + "\n";
      });
      
      html = html.replace(/ *<(p|h[1-4])([^>]*)>((.|[\r\n])*?)<\/\1>\s*/gi, function(match, tag, attributes, content){
        var front = "", cssClass = attributes.match(/class=\"([^"]*)/);
        if(cssClass){
          front = tag + "(" + cssClass[1] + "). ";
        } else if(tag != "p"){
          front = tag + ". ";
        }

        eachRegexp(['b','i', 'u', 'del'], function(regexp, d){
          content = content.replace(regexp, function(match, text){
            return d + text.replace(/<br ?\/?>\s*/gi, d + "\n" + d) + d;
          });
        });
        
        return front + content.replace(/<br ?\/?>\s*/gi, "\n") + "\n\n";
      });
      
      html = html.replace(/<img[^>]*>/gi, function(match){
        var img = $(match),
        replacement = img.attr('src'),
        title = img.attr('title');

        if(title && !/^\s*$/.test(title)){
          replacement = replacement + "(" + title + ")";
        }
        return "!" + replacement + "!";
      });
      html = html.replace(/<a href="([^\"]*)">((.|[\r\n])*?)<\/a>/gi, function(match, uri, content){
        if(/^\s*![^!]+!\s*$/.test(content)){
          return $.trim(content) + ":" + uri;
        } else {
          return "\"" + content + "\":" + uri;
        }
      });
      html = html.replace(/\s*<code[^>]*>((.|[\r\n])*?)<\/code>\s*/gi, ' @$1@ ');
      html = html.replace(/(\r\n|\n){3,}/g, "\n\n");
      html = html.replace(/&nbsp;/g, ' ');
      html = html.replace(/^[\r\n]+|[\r\n]+$/g, '');

      return html;
    },
    /**
     * Get the states for the current selection
     * 
     * @param {Editor} editor The editor to work on
     *
     * @return {Object} An object representing the states
     */
    getSelectionStates: function(editor) {
      var paragraphs = this.getSelection(editor, "\n\n"),
      startTrace = editor.selectionStart - editor.boundaryStart,
      endTrace = editor.selectionEnd - editor.boundaryStart,
      trace = textileCompiler.trace(paragraphs, startTrace, endTrace);
      
      return this.buildStateObject(trace, editor.currentNodes = {});
    },
    /**
     * @param {Editor} editor The editor to work on
     *
     * @returns {String[]} An array of paragraphs
     */
    getParagraphs: function(editor) {
      return this.getSelection(editor, "\n\n").split(/\n\n+/);
    },
    /**
     * Set the paragraphs and move the caret
     * 
     * @param {Editor} editor The editor to work on
     * @param {String[]} paragraphs An array of paragraphs
     */
    setParagraphs: function(editor, paragraphs) {
      var text = editor.textArea.val();
      paragraphs = paragraphs.join("\n\n");

      if(editor.rightBoundary === -1) {
        editor.textArea.val(text.slice(0,editor.leftBoundary) + paragraphs);
      } else {
        editor.textArea.val(text.slice(0,editor.leftBoundary) + paragraphs + text.slice(editor.rightBoundary));
      }
      
      this.moveCaret(editor, paragraphs.length - editor.boundaryDistance);
    },
    /**
     * Move the caret by the given distance. Positive values move the caret to 
     * the right, negative to the left.
     * 
     * @param {Editor} editor The editor to work on
     * @param {Integer} distance The distance to move the caret
     */
    moveCaret: function(editor, distance) {
      // console.log("Moving caret: " + distance);
      var selectionStart = editor.selectionStart,
      startOfParagraphs = editor.startOfParagraphs;

      if(Math.abs(selectionStart - startOfParagraphs) > Math.abs(distance)) {
        selectionStart += distance;
      } else {
        selectionStart = startOfParagraphs;
      }
      
      editor.textArea.focus();
      editor.setSelectionRange(selectionStart, selectionStart);
    },
    /**
     * Handle special keyevents or standard keys that need fixing
     *
     * @param {Editor} editor The editor to work on
     * @param {Integer} keyCode
     */
    pressed: function(editor, keyCode){
      // console.log("pressed", keyCode);
      switch(keyCode){
      case 13: // enter
        return pressedEnter(editor, this);
      default: // handle keyCombos
        this.prototype.pressed.apply(this, [keyCode]);
      }
    }
  });
})();
(function (){
  /**
   * @name Builder
   * 
   * The builder compiles the textile. It can also trace the common nodes between
   * a start and an end point.
   * 
   * Therefore it has two stacks: one for building and one for tracing
   */
  
  /**
   * Builds the html tree and traces the common nodes inside a
   * selection
   *
   * @name Builder
   * @namespace
   */
  var builder = (function (){
    var stack, tracingStack, stackPosition, traceJustStarted, traceJustEnded, popping, pointer, sP, eP, tracing, lastTrace, unsuccessfulPush = false, stringLength,
    ignoredTags = ['li'],
    definableAttributes = {
      img: ['title','src'],
      a: ['href']
    };

    /**
     * Iterate over the attributes of the given tag and call the callback.
     * Used for comparison of the attributes of two nodes
     * 
     * @param {String} tag
     * @param {Function} callback
     */
    function iterateOverAttributes(tag, callback){
      var attributes = ['class'],i;
      if(definableAttributes[tag]){
        attributes = attributes.concat(definableAttributes[tag]);
      }
      for(i = attributes.length;i--;){
        callback(attributes[i]);
      }
    }
    
    /**
     * Test if the tracing stack can be moved down again with the given node.
     * 
     * @param {TraceNode} targetNode The node to test
     * 
     * @returns {Boolean}
     */
    function canMoveStackDown(targetNode){
      var equalTag = true, key, equalAttributes = true, blockTag = (stackPosition == -1), stackNode, i, l;
      if(blockTag){
        // List nodes should be weaker than a paragraph node
        if(/(o|u)l/.test(tracingStack[0].tag)){
          if(/(o|u)l/.test(targetNode.tag) && targetNode.tag != tracingStack[0].tag){
            targetNode = {tag: 'p'};
          }
          stackNode = tracingStack[0] = targetNode;
        } else {
          stackNode = tracingStack[0];
        }
      } else {
        for(i = stackPosition + 1, l = tracingStack.length; i < l; i++ ){
          if(tracingStack[i].tag === targetNode.tag){
            stackNode = tracingStack[i];
            tracingStack[i] = tracingStack[stackPosition + 1];
            tracingStack[stackPosition + 1] = stackNode;
            break;
          }
        }
      }

      if(stackNode){
        // console.log("checking attributes");
        if(stackNode.attributes){
          iterateOverAttributes(stackNode.tag,function(key){
            // console.log("checking",key);
            if(stackNode.attributes[key] !== targetNode.attributes[key]){
              // console.log("difference in ", key, stackNode.attributes[key], targetNode.attributes[key]);
              equalAttributes = false;
              delete stackNode.attributes[key];
            }
          });
        }
        
      }
      // console.log("!@!@!@", stackNode, targetNode, equalAttributes);
      return stackNode && (blockTag || equalAttributes);
    }

    /**
     * Create a new TraceNode form a given node
     * @constructor
     * 
     * @param {object} node 
     */
    function TraceNode(node){
      this.tag = node.tag;
      this.attributes = node.attributes;
    }

    /**
     * Create a open-tag for the given node
     * 
     * @param {object} node
     * 
     * @return {String}
     */
    function htmlOpenTag(node){
      var attributeString = "";
      for(attr in node.attributes){
        if(node.attributes.hasOwnProperty(attr)){
          attributeString += " " + attr + "=\"" + node.attributes[attr] + "\"";
        }
      }
      return "<" + node.tag + attributeString + ">";
    }

    /**
     * Warning! this supposes, that there is only one instance of any tag in
     * the stack
     * 
     * @param {String} tag
     * 
     * @returns {Integer} The stack position of the given tag
     */
    function getStackPositionOf(tag){
      var i;
      for(i = stack.length;i--; ){
        if(stack[i].tag === tag){
          return i;
        }
      }
    }

    /**
     * Start the tracing
     */
    function startTrace(){
      var length = stack.length, i, numberOfIgnoredTags = 0;
      // console.log("################################## startTrace");
      tracing = true;
      traceJustStarted = true;
      for(i=1;i<length;i++){
        if(ignoredTags.indexOf(stack[i].tag) == -1){
          tracingStack[i-1 - numberOfIgnoredTags] = new TraceNode(stack[i]);
        } else {
          numberOfIgnoredTags += 1;
        }
      }
      // console.log(tracingStack.length);
      stackPosition = tracingStack.length -1;
    }
    
    /**
     * End the tracing
     */
    function endTrace(){
      // console.log("#################################### endTrace");
      // console.log(tracingStack.length);
      lastTrace = false;
      tracing = false;
    }

    /**
     * @lends Builder
     */
    return {
      /**
       * Initialize Builder for normal operation
       */
      init: function(){
        stack = [{content:""}];
      },
      /**
       * Initialize Builder for tracing operation
       */
      initTrace: function(startPosition, endPosition, lengthOfString){
        tracingStack = [];
        tracing = undefined;
        pointer = 0;
        sP = startPosition;
        eP = endPosition;
        stringLength = lengthOfString;
      },
      /**
       * Definitly ends the trace
       */
      finalizeTrace: function(){
        if(tracing){
          endTrace();
        }
      },
      /**
       * Advance the pointer by the given amount.
       * Handles starting and ending of the trace
       * 
       * @param {Integer} advanceAmount
       * @param {Boolean} forceEndTrace wether to forcably end the trace
       */
      advancePointer: function(advanceAmount, forceEndTrace){
        pointer += advanceAmount;
        // console.log("pointer",pointer,"startPointer", sP, "endPointer", eP);
        if(tracing === undefined && (pointer > sP || pointer == stringLength)){
          startTrace();
        }
        if(tracing && pointer > eP){
          if(lastTrace || forceEndTrace){
            endTrace();
          } else {
            // console.log("set last trace");
            lastTrace = true;
          }
        }
      },
      /**
       * Push a tag to the build stack
       * 
       * @param {String} tag
       * @param {Object} attributes
       */
      pushTag: function(tag, attributes){
        var node = {tag: tag,
                    attributes: attributes || {},
                    content: ""};
        // console.log("open tag", node);
        stack.push(node);
        if(tracing && ignoredTags.indexOf(tag) == -1){
          if(traceJustStarted){
            // console.log("inserting node ", node);
            tracingStack[stackPosition+1] = new TraceNode(node);
            stackPosition += 1;
          }
          else if(tracingStack[stackPosition+1]){
            if(canMoveStackDown(node)){
              stackPosition += 1;
            } else {
              unsuccessfulPush = true;
            }
          }
          // console.log("stackPosition " + stackPosition);
        }
      },
      /**
       * Close a tag. If a tag is given find it and close it. Otherwise the top
       * tag is closed
       * 
       * @param {String} [tag]
       */
      closeTag: function(tag){
        var removedNode, i;
        if(tag){
          i = getStackPositionOf(tag);
          removedNode = stack.splice(i,1)[0];
        } else {
          removedNode = stack.pop();
        }

        // console.log("closing", removedNode);
        if(tracing && ignoredTags.indexOf(tag) == -1){
          traceJustStarted = false;
          if(unsuccessfulPush){
            // console.log("slicing because of difference "+stackPosition);
            tracingStack = tracingStack.slice(0,stackPosition+1);
            unsuccessfulPush = false;
          }
          // console.log(tracingStack, stackPosition, removedNode);
          if(tracingStack[stackPosition].tag === removedNode.tag){
            // console.log("moving down");
            stackPosition -= 1;
            // console.log("stackPosition " + stackPosition);
          }
          popping = true;
        }

        // The part of the content, which belongs exclusively to the
        // current tag must be commited
        this.pushString(htmlOpenTag(removedNode) + removedNode.content, stack[i-1]);
        // The tag needs to be closed at the top, where the current string insertion occurs
        this.pushString("</"+removedNode.tag+">"); 
        popping = false;
      },
      /**
       * Closes all textile markup that ends at a line break.
       * For example "*" or "_"
       */
      popLineEnd: function(){
        var surpressLineBreak = false, partialMarkup = {b: "*", i: "_"}, node;
        // If the need arises to search deeper think of the correct
        // order in which to append the content
        while("a,i,b,li".indexOf(stack[stack.length - 1].tag) != -1){
          if("li" === stack[stack.length-1].tag){
            this.closeTag();
            surpressLineBreak = true;
          } else {
            node = stack.pop();
            this.pushString(partialMarkup[node.tag]+node.content);
          }
        }
        return surpressLineBreak;
      },
      /**
       * Closes all open tags
       */
      popParagraphEnd: function(){
        while(stack.length > 1){
          this.closeTag();
        }
      },
      /**
       * Add a string to the given node or the top node.
       * 
       * @param {String} string
       * @param {Object} [node] defaults to the top node in the stack
       */
      pushString: function(string, node){
        if(!node){
          node = stack[stack.length - 1];
        }
        node.content += string;
        // console.log("pushing", string, "to", node);
        if(!/^([ ]+|<br\/>)?$/.test(string)){ // Ignore whitespace
          // during tracing
          if(traceJustStarted){
            traceJustStarted = false;
          }
          if(tracing && !popping && tracingStack[stackPosition+1]){
            // console.log("cutting because of String " + stackPosition);
            // console.log(tracingStack.length);
            tracingStack = tracingStack.slice(0,stackPosition + 1);
            // console.log(tracingStack.length);
          }
        }
      },
      /**
       * Check if the given tag is open
       * 
       * @param {String} tag
       * 
       * @returns {Boolean}
       */
      isOpen: function(tag){
        // console.log("check is Open", tag, stack.length);
        return typeof getStackPositionOf(tag) === 'number';
      },
      blockTagIsOpen: function(){
        return !!stack[1];
      },
      closeBlockTag: function(){
        while(stack[1]){
          this.closeTag();
        }
      },
      /**
       * @returns {Object} The trace stack
       */
      getTrace: function(){
        return tracingStack;
      },
      /**
       * @returns {String} The compiled html
       */
      toHtml: function(){
        // console.log(stack);
        return stack[0].content;
      }
    };
  })();

  var text;
  
  function advance(regexp){
    var match = regexp.exec(text),whitespaceLength, matchLength;
    if(match){
      whitespaceLength = /^\s*/.exec(match[0])[0].length;
      matchLength = match[0].length;
      if(whitespaceLength){
        builder.advancePointer(whitespaceLength, true);
      }
      if(matchLength - whitespaceLength){
        builder.advancePointer(matchLength - whitespaceLength);
      }
      // console.log("@@@@ matched: ", match, regexp);
      text = text.slice(matchLength);
      return match || true;
    }
  }
  function next(regexp){
    return regexp.test(text);
  }
  
  function parseParagraphs(){
    var match;
    while(!/^\s*$/.test(text)){
      match = advance(/^\s*(h\d|p|bq)(\(([^#\)]*)(#[^\)]+)?\))?\. /);
      if(match){
        var attributes = {};
        if(match[3]){
          attributes["class"] = match[3];
        }
        if(match[4]){
          attributes.id = match[4];
        }

        builder.pushTag(match[1], attributes);
      }
      parseLines();
      builder.popParagraphEnd();
    }
  }
  
  function parseLines(){
    while(!advance(/^\n/) && !next(/^\s*$/)){ // check for a double linebreak
      parseLineStart();
    }
  }
  
  function parseLineStart(){
    var match;
    if(advance(/^ *\* /)){
      if(!builder.isOpen("ul")){ // this won't work for nested uls,
        // solve with lookahead
        builder.closeBlockTag();
        builder.pushTag("ul");
      }
      builder.pushTag("li");
    } else if(advance(/^ *# /)){
      if(!builder.isOpen("ol")){ // this won't work for nested uls
        builder.closeBlockTag();
        builder.pushTag("ol");
      }
      builder.pushTag("li");
    } else {
      while(builder.isOpen("ul") || builder.isOpen("ol")){
        builder.closeTag();
      }
      if(!builder.blockTagIsOpen()){
        builder.pushTag("p");
      }
    }
    // Eat Whitespace at the beginning of the Line after the tag
    // TODO remove this and eat the whitespace at the beginning of
    // each regexp
    match = advance(/^ */);
    builder.pushString(match[0]);
    parseLine();
  }
  function parseLine(){
    var match, isInListOrTable;
    while(true){
      // Italic start
      if(match = advance(/^_(?=[^ \n]+)/)){
        if(builder.isOpen("i")){
          builder.pushString("_");
        } else {
          builder.pushTag("i");
        }
      }
      // bold start
      else if(match = advance(/^\*(?=[^ \n]+)/)){
        if(builder.isOpen("b")){
          builder.pushString("*");
        } else {
          builder.pushTag("b");
        }
      }
      // italic end
      else if(match = advance(/^([^ \n]+)_( +|(?=\n|$))/)){
        if(builder.isOpen("i")){
          builder.pushString(match[1]);
          builder.closeTag("i");
          builder.pushString(match[2]);
        } else {
          builder.pushString(match[1] + "_" + match[2]);
        }
      }
      // bold end
      else if(match = advance(/^([^ \n]+)\*( +|(?=\n|$))/)){
        if(builder.isOpen("b")){
          builder.pushString(match[1]);
          builder.closeTag("b");
          builder.pushString(match[2]);
        } else {
          builder.pushString(match[1] + "*" + match[2]);
        }
      }
      // link
      else if(match = advance(/^( *)"([^"]*)":([^ \n]+)/)) {
        builder.pushString(match[1]);
        builder.pushTag("a", {href: match[3]});
        builder.pushString(match[2]);
        builder.closeTag();
      }
      // Image
      else if(match = advance(/^( *)!([^!\(]+)(\(([^\)]*)\))?!(:([^ \n]+))?/)) {
        builder.pushString(match[1]);
        if(match[6]){
          builder.pushTag("a", {href: match[6]});
        }
        var attributes = {src: match[2]};
        if(match[4]){
          attributes.title = match[4];
        }
        builder.pushTag("img", attributes);
        builder.closeTag();
        if(match[6]){
          builder.closeTag();
        }
      }
      // word or blanks
      else if(match = advance(/^([^ \n]+)/)){
        builder.pushString(match[1]);
      }
      // blanks
      else if(match = advance(/^( +)/)){
        builder.pushString(match[1]);
      }
      // end of line
      else {
        advance(/^\n/);
        // If in List for example, surpress line break
        isInListOrTable = builder.popLineEnd();
        if(!isInListOrTable && !next(/^\s*(\n|$|[\*#] )/)){
          builder.pushString("<br/>");
        }
        return;
      }
    }
  }

  /**
   * The Compiler for textile
   *
   * @name textileCompiler
   * @namespace
   */
  textileCompiler = {
    /**
     * Compile the given text to html
     *
     * @param {String} textToCompile A textile string
     *
     * @returns {String} The html
     */
    compile: function(textToCompile){
      builder.init();
      text = textToCompile;
      parseParagraphs();
      return builder.toHtml();
    },
    /**
     * Trace the common nodes between the given boundaries
     *
     * @param {String} textToCompile A textile string
     * @param {Integer} startTrace Index of textToCompile where to
     * start the trace
     * @param {Integer} endTrace Index of textToCompile where to
     * end the trace
     *
     * @returns {Object} A stack of the common nodes
     */
    trace: function(textToCompile, startTrace, endTrace){
      builder.initTrace(startTrace, endTrace, textToCompile.length);
      this.compile(textToCompile);
      builder.finalizeTrace();
      return builder.getTrace();
    }
  };
})();
(function() {
  var wysiwygMode,
  $ = jQuery,
  selection = getSelection(), range = document.createRange();

  function startNode(){
    return jQuery(selection.getRangeAt(0).startContainer);
  }
  
  function endNode(){
    return jQuery(selection.getRangeAt(0).endContainer);
  }
  
  function lastParentBeforePreview(node){
    if(node.parent().is(".preview")){
      return node;
    } else {
      return node.parentsUntil(".preview").last();
    }
  }
  
  function getParagraphs() {
    var anchor, focus, paragraphs, matchIndex = -1;

    anchor = lastParentBeforePreview(startNode());
    focus = lastParentBeforePreview(endNode())[0];
    
    if(anchor[0] !== focus){
      paragraphs = anchor.nextAll().filter(function(i){
        if(this == focus){
          matchIndex = i;
        }
        if(matchIndex === -1 || matchIndex === i){
          return true;
        }
      }).add(anchor);
    } else {
      paragraphs = anchor;
    }

    return paragraphs;
  }
  
  function align(direction) {
    getParagraphs().removeClass("left")
      .removeClass("right").removeClass("center")
      .addClass(direction);
  }

  function selectNodes(nodes,collapse){
    var firstNode = nodes[0], lastNode;
    if(nodes.length > 1){
      lastNode = nodes[nodes.length-1];
      range.setStart(firstNode,0);
      range.setEnd(lastNode,lastNode.childNodes.length);
    } else {
      range.selectNodeContents(firstNode);
    }

    if(collapse !== undefined){
      range.collapse(collapse);
    }
    selection.removeAllRanges();
    selection.addRange(range);
  }

  /**
   * @param {Editor} editor The editor to work on
   */
  function handleList(editor, target, listType){
    var contents, lines, $p, $list;
    
    if(/ on$/.test(target.className)){
      disableList(editor);
    } else {
      contents = wysiwygMode.getSelection(editor, 'br');
      
      $list = $("<" + listType + ">");
      createList($list, contents.firstChild);

      joinAdjacentList(editor.leftBorder, $list);
      joinAdjacentList(editor.rightBorder, $list);

      wysiwygMode.replaceSelection(editor, $list);
    }
  }

  /**
   * @param {Editor} editor The editor to work on
   */
  function disableList(editor){
    // get list items and detach them from the dom
    contents = wysiwygMode.getSelection(editor, 'li');

    lines = [];
    // insert their contents into a paragraph tag and seperate
    // them by and <br>
    addListItems(lines, contents.firstChild);
    $p = $("<p>").html(lines.join("<br>"));

    wysiwygMode.replaceSelection(editor, $p);
  }

  /**
   * Create a new Border with the following properties
   *
   * @property {String} nextProperty The property wich holds the next
   * sibling
   * @property {jQuery} ancestors
   * @property {HTMLElement} block
   * @property {HTMLElement} safeBlock
   * @property {HTMLElement} borderNode
   * Is null when border node is not found. That means the node has no
   * more siblings
   * @property {HTMLElement} node
   * Equals borderNode if it exists, otherwise its the last sibling
   *
   * @param {HTMLElement} node
   * @param {String} borderType The nodeName of the border node
   * @param {String} nextProperty The property wich holds the next sibling
   * @constructor
   */
  function Border(node, borderType, nextProperty){
    this.nextProperty = nextProperty;
    this.ancestors = node.parentsUntil(".preview");
    this.block = this.ancestors[this.ancestors.length - 1] || node[0];
    this.borderNode = this.ancestors[this.ancestors.length -2] || node[0];
    while(this.borderNode){
      this.node = this.borderNode;
      if(!borderType || this.borderNode.nodeName.toLowerCase() === borderType){
        break;
      }
      this.borderNode = this.borderNode[nextProperty];
    }
    this.safeBlock = this.borderNode ? this.block : this.block[nextProperty];
  }

  /**
   * Create list items from node and it siblings and join them to the
   * given list
   *
   * @param {HTMLElement} list
   * @param {HTMLElement} node
   */
  function createList(list, node){
    var li = document.createElement("li"), next;
    
    function pushItem(){
      if(!/^\s*$/.test(li.textContent)){
        list.append(li);
      }
      li = document.createElement('li');
    }

    while(node !== null){
      next = node.nextSibling;
      if(/br/i.test(node.nodeName)){
        pushItem();
      } else if(/(p|h\d)/i.test(node.nodeName)) {
        pushItem();
        createList(list, node.firstChild);
      } else if(/(o|u)l/i.test(node.nodeName)) {
        pushItem();
        $(node).children().appendTo(list);
      } else if(/li/i.test(node.nodeName)) {
        pushItem();
        list.append(node);
      } else {
        li.appendChild(node);
      }
      node = next;
    }
    pushItem();
  }

  /**
   * Add the items of an adjcent list node defined by border to the
   * list.
   *
   * @param {Border} border
   * @param {HTMLElement} list
   */
  function joinAdjacentList(border, list){
    var children;
    if(border.safeBlock && /ul/i.test(border.safeBlock.nodeName)){
      next = border.safeBlock[border.nextProperty];

      children = $(border.safeBlock).remove().children();
      if(border.nextProperty === 'previousSibling'){
        children.prependTo(list);
      } else {
        children.appendTo(list);
      }
      border.safeBlock = next;
    }
  }

  /**
   * Add the items of an (un)ordered list to the given lines array
   *
   * @param {String[]} lines
   * @param {HTMLElement} node The list node
   */
  function addListItems(lines,node){
    while(node){
      if(/(o|u)l/i.test(node.nodeName)) {
        addListItems(lines, node.firstChild);
      } else if(/li/i.test(node.nodeName)) {
        lines.push(node.innerHTML);
      }
      node = node.nextSibling;
    }
  }


  /**
   * Check the position of the caret and adjust the container the
   * caret is in when necessary
   *
   * @param {Integer} adjustment Adjust the current offset (needed for
   * arrow keys
   */
  function checkCaret(adjustment){
    var range = selection.getRangeAt(0),node, text;
    function checkSibling(property, collapse){
      while(!node[property]){
        node = node.parentNode;
      }
      node = node[property];
      if(node && !/br|h\d|p/i.test(node.nodeName)){
        selectNodes([node], collapse);
        return false;
      }
    }
    if(range.collapsed){
      node = range.startContainer;
      if(node.nodeType == 3){ // Its a textnode
        text = node.nodeValue;
        if(range.startOffset + adjustment === 0 && /^ /.test(text)){
          return checkSibling('previousSibling', false);
        } else if(range.startOffset + adjustment === node.length && / $/.test(text)){
          return checkSibling('nextSibling', true);
        }
      }
    }
  }

  /**
   * @browserbug Firefox and Chrome
   */
  function pressedEnter(htmlDiv){
    if(checkIfDeletedAll(htmlDiv,13) === false){
      return false;
    }
    var lastSibling = true, node, range, endContainer,
    block = editor.currentNodes.block;

    if(/h[1-5]/i.test(block.nodeName)){ // only headings
      range = selection.getRangeAt(0);
      node = endContainer = range.endContainer;

      // only the last sibling
      while(node.parentNode !== htmlDiv[0]){
        if(node.nextSibling){
          lastSibling = false;
          break;
        }
        node = node.parentNode;
      }
      
      if(lastSibling
         && range.endOffset === endContainer.textContent.length // at
         // the end
        ){
        node = $("<p>").insertAfter(block);
        selectNodes(node);
        return false;
      }
    }
  }

  /**
   * Handle the backspace key within lists and fixes a bug in Chrome.
   *
   * @browserbug Chrome
   * Chrome tries to keep the styles whilst backspacing from say a
   * paragraph to a heading. The content of the paragraph looks like a
   * paragraph, but is a heading
   *
   * @param {Editor} editor The editor to work on
   */
  function pressedBackspace(editor, htmlDiv){
    if(checkIfDeletedAll(htmlDiv,8) === false){
      return false;
    }
    var children, atBeginningOfLI,
    inFirstSibling = true,
    block = editor.currentNodes.block,
    list = editor.currentNodes.list,
    prev = (list || block).previousSibling,
    range = selection.getRangeAt(0),
    node = range.startContainer;

    if(!range.collapsed || !prev || range.startOffset !== 0){
      return true;
    }

    // only the first sibling
    while(node.parentNode !== htmlDiv[0]){
      if(node.previousSibling){
        inFirstSibling = false;
        if(/li/i.test(node.nodeName)){
          atBeginningOfLI = true;
        } else {
          return true;
        }
        break;
      }
      node = node.parentNode;
    }

    if(inFirstSibling){
      if(list){
        node = node.firstChild;
      }
      node = $(node);
      children = node.contents();

      $(prev).append(children);
      node.remove();
      selectNodes([children[0]], true);
    } else if(list && atBeginningOfLI){
      disableList(editor);
    }
    
    return false;
  }

  /**
   * @browserbug Chrome
   * bring Chrome to a normal behaviour
   *
   * @param {Editor} editor The editor to work on
   */
  function pressedDelete(editor, htmlDiv){
    if(checkIfDeletedAll(htmlDiv,46) === false){
      return false;
    }
    if(!$.browser.webkit){
      return true;
    }
    var children,
    block = editor.currentNodes.block,
    list = editor.currentNodes.list,
    next = (list || block).nextSibling,
    range = selection.getRangeAt(0),
    node = range.startContainer;

    if(!range.collapsed || !next || range.startOffset !== node.length){
      return true;
    }

    // only the first sibling
    while(node.parentNode !== htmlDiv[0]){
      if(node.nextSibling){
        return true;
      }
      node = node.parentNode;
    }

    if(list){
      // append to last list item
      node = node.lastChild;
    }
    if(/(u|o)l/i.test(next.nodeName)){
      // swallow only the first list item
      next = next.firstChild;
    }
    next = $(next);
    children = next.contents();

    $(node).append(children);
    next.remove();

    return false;
  }

  /**
   * @browserbug Firefox
   */
  function checkIfDeletedAll(htmlDiv, keyCode, holdNeutralKey){
    var range = selection.getRangeAt(0);
    if(!$.browser.mozilla || holdNeutralKey || range.collapsed || ME.util.isNeutralKey(keyCode)){
      return true;
    }
    var node, content;
    content = range.extractContents();
    // The second check is necessary, because extractContents might
    // leave some empty tags when you manually select the whole div
    // (the selection is always inside the block tags)
    if(htmlDiv.is(":empty") || /^ *$/.test(htmlDiv.text())){
      node = document.createElement(content.childNodes[0].nodeName);
      htmlDiv.html(node);
      selectNodes([node]);
      if(!/^8|13|46$/.test("" + keyCode)){
        // Pass non special keystrokes upwards
        return true;
      } else {
        return false;
      }
    }
  }

  /** 
   * @name wysiwygMode
   * @namespace
   * @augments Mode
   */
  wysiwygMode = ME.addMode('wysiwyg', /** @scope wysiwygMode.prototype */{
    /**
     * The long name of the mode
     * @property
     */
    name: "Preview Mode",
    /**
     * Holds the supported toolbaritems
     * @property
     */
    items: {
      "default": {
        clicked: function(editor, target) {
          document.execCommand(this.name, false, null);
        }
      },
      bold: {
        tag: 'b'
      },
      italic: {
        tag: 'i'
      },
      alignLeft: {
        clicked: function(){
          align('left');
        }
      },
      alignRight: {
        clicked: function(){
          align('right');
        }
      },
      alignCenter: {
        clicked: function(){
          align('center');
        }
      },
      unorderedList: {
        clicked: function(editor, target){
          handleList(editor, target, 'ul');
        }
      },
      orderedList: {
        clicked: function(editor, target){
          handleList(editor, target, 'ol');
        }
      },
      link: {
        clicked: function(editor, target) {
          var dialog, linkNode, titleString,
          range = selection.getRangeAt(0),
          callback = {
            remove: function(){
              var text = linkNode.text();
              // on Chrome childNodes does not contain textnodes
              linkNode.replaceWith(text);
            },
            close: function(){
              editor.htmlDiv.focus();
              editor.checkState();
            }
          };
          
          if(/ on$/.test(target.className)){
            linkNode = $(editor.currentNodes.a);
            dialog = ME.dialog.link(['Update','Remove','Cancel']);
            
            callback.submit = function(title,uri){
              linkNode.attr('href',uri).text(title);
              
              // Firefox start
              range.selectNodeContents(linkNode[0]);
              selection.removeAllRanges();
              selection.addRange(range);
              // Firefox end
            };
            titleString = linkNode.text();
            dialog.val('input.uri', linkNode.attr('href'));
          }
          else {
            dialog = ME.dialog.link(['Create','Cancel']);
            
            callback.submit = function(title,uri){
              var newNode = $("<a href=\"" + uri + "\">" + title + "</a>")[0];
              range.deleteContents();
              range.insertNode(newNode);
              
              range.selectNodeContents(newNode);
              selection.removeAllRanges();
              selection.addRange(range);
            };

            titleString = range.toString();
          }

          if(!/^\s*$/.test(titleString)){
            dialog.val('.title', titleString);
          }
          
          dialog.dialog('open', callback);
        }
      },
      insertImage: {
        clicked: function(editor, target) {
          var dialog, callback, linkNode,
          selection = window.getSelection(),
          range = selection.getRangeAt(0);

          callback = {
            submit: function(imageUri,title,uri){
              var imageNode = $("<img src=\"" + imageUri + "\"/>"), parentNode = imageNode;
              if(!/^\s*$/.test(title)){
                imageNode.attr({alt: title, title: title});
              }

              if(!/^\s*$/.test(uri)){
                parentNode = $("<a href=\"" + uri + "\"/>").append(imageNode);
              }
              
              range.deleteContents();
              range.insertNode(parentNode[0]);
              
              range.selectNode(imageNode[0]);
              selection.removeAllRanges();
              selection.addRange(range);
            },
            remove: function(){
              imageNode.remove();
            },
            close: function(){
              editor.htmlDiv.focus();
              editor.checkState();
            }
          };

          if(/ on$/.test(target.className)){
            dialog = ME.dialog.insertImage(['Update','Remove','Cancel']);
            if(editor.currentNodes.a){
              linkNode = $(editor.currentNodes.a);
              dialog.val('input.uri', linkNode.attr('href'));
              range.selectNode(editor.currentNodes.a);
            }
            imageNode = $(editor.currentNodes.img);

            dialog.val('input.imageUri', imageNode.attr('src'));
            dialog.val('input.title', imageNode.attr('title'));
          }
          else {
            dialog = ME.dialog.insertImage(['Create','Cancel']);
          }

          dialog.dialog('open', callback);
        }
      },
      formatBlock: {
        clicked: function(editor, target) {
          var paragraph, newParagraphs = [], tag;

          getParagraphs().replaceWith(function(){

            if(/(u|o)l/i.test(this.nodeName)){ // ignore lists
              // TODO update jquery and try returning the list. File
              // bug when it won't work
              tag = this.nodeName;
            } else {
              tag = target.value;
            }
            paragraph = $('<' + tag + '>')
              .addClass(this.className).append(this.childNodes);
            newParagraphs.push(paragraph[0]);
            return paragraph;
          });
          selectNodes(newParagraphs);
        }
      }
    },
    /**
     * Detach the selected Nodes from the dom and return them
     *
     * @param {Editor} editor The editor to work on
     * @param {String} nodeType The type of node to which the border of
     * the selection will be extended
     *
     * @returns {HTMLFragment} The selected nodes
     */
    getSelection: function(editor, nodeType){
      var range = selection.getRangeAt(0);

      editor.collapsed = range.collapsed;

      editor.leftBorder = new Border(startNode(), nodeType, 'previousSibling');
      editor.rightBorder = new Border(endNode(), nodeType, 'nextSibling');
      
      range.setStartBefore(editor.leftBorder.node);
      range.setEndAfter(editor.rightBorder.node);

      // split node if there are other nodes after the selection
      if(editor.rightBorder.borderNode){
        $(editor.rightBorder.borderNode).nextAll()
          .appendTo('<' + editor.rightBorder.block.nodeName + '>').parent()
          .insertAfter(editor.rightBorder.block);
      }

      return range.extractContents();
    },
    /**
     * Insert the given nodes into the DOM tree at the place where
     * getSelection extracted the nodes
     *
     * @param {Editor} editor The editor to work on
     * @param {HTMLFragment} nodes The nodes which will be inserted
     */
    replaceSelection: function(editor, nodes){
      if(editor.leftBorder.safeBlock){
        nodes.insertAfter(editor.leftBorder.safeBlock);
      } else {
        editor.htmlDiv.prepend(nodes);
      }
      
      if(editor.collapsed){
        selectNodes(nodes, true);
      } else {
        selectNodes(nodes);
      }
      
      // remove empty block tags
      // OPTIMIZE
      if(/^\s*$/.test(editor.leftBorder.block.textContent)){
        $(editor.leftBorder.block).remove();
      }
      if(/^\s*$/.test(editor.rightBorder.block.textContent)){
        $(editor.rightBorder.block).remove();
      }
    },
    /**
     * Executed after the mode has been activated.
     * Hides the textarea and set contenteditable
     *
     * @param {Editor} editor The editor to work on
     */
    afterActivation: function(editor) {
      editor.textArea.parent().hide();
      editor.htmlDiv.attr("contentEditable",true);

      // Force Mozilla to generate tags instead of inline styles
      if ($.browser.mozilla) {
        document.execCommand("styleWithCSS",null, false);
      }
    },
    /**
     * Get the State of the current selection (e.g. if a link is
     * selected) 
     *
     * @param {Editor} editor The editor to work on
     *
     * @returns {Object} An object representing the states
     */
    getSelectionStates: function(editor) {
      if(!$(document.activeElement).is(".preview")){
        return {};
      }

      function getParents(node, content){
        // TODO document me! why is this here?
        if(content){
          var contentNodeName = content.nodeName,
          nodeNodeName = node[0].nodeName;
          if(contentNodeName != "#text" && nodeNodeName != "#text" && nodeNodeName != contentNodeName){
            node = node.find(content.nodeName.toLowerCase());
          }
        }

        return node.parentsUntil(".preview").add(node);
      }
      
      var nodes = [], startNodes, endNodes,
      content = selection.getRangeAt(0).cloneContents().firstChild;

      startNodes = getParents(startNode(), content);
      endNodes = getParents(endNode(), content);

      if(/(u|o)l/i.test(startNodes[0].nodeName) && startNodes[0].nodeName !== endNodes[0].nodeName){
        nodes = startNodes.toArray();
        nodes[0] = $('<p>')[0];
      } else {
        nodes = startNodes;
      }
      return this.buildStateObject(nodes, editor.currentNodes = {});
    },
    /**
     * Executed if the htmlDiv of the Editor is clicked.
     * Checks where the Caret has been placed by the browser
     */
    clicked: function(){
      checkCaret(0);
    },
    /**
     * Handle special keyevents or standard keys that need fixing
     *
     * @param {Editor} editor The editor to work on
     * @param {Integer} keyCode
     *
     * @returns {Boolean} If false is returned, the default action is
     * prevented
     */
    pressed: function(editor, keyCode){
      this.prototype.pressed.apply(this, [editor, keyCode]);
      switch(keyCode){
      case 13: // enter
        return pressedEnter(editor.htmlDiv);
      case 8: // Backspace
        return pressedBackspace(editor, editor.htmlDiv);
      case 46: // Delete
        return pressedDelete(editor, editor.htmlDiv);
      case 37: // left arrow
        return checkCaret(-1);
      case 39: // right arrow
        return checkCaret(1);
      default:
        return checkIfDeletedAll(editor.htmlDiv, keyCode, this.holdNeutralKey);
      }
    },
    /**
     * @param {Editor} editor The editor to work on
     *
     * @returns {String} The text representation of the preview
     * mode. Depends on the current data mode.
     */
    toText: function(editor) {
      return editor.getDataMode().toText(editor);
    },
    /**
     * @param {Editor} editor The editor to work on
     *
     * @returns {String} The html behind the preview
     */
    toHTML: function(editor) {
      return editor.htmlDiv.html();
    }
  });
})();
