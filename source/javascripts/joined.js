(function($) {
  // TODO cache fields
  var opts, errorMsgType, initialized, methods;

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
  availableItems = ['bold','italic','alignLeft','alignCenter','alignRight','unorderedList','orderedList','link','insertImage','save','wysiwyg','changeDataMode','formatBlock'],
  globalItems = [],
  emptyFunction = $.noop;

  /**
   * Create a new Mode
   * @constructor
   * @name Mode
   * @param {Object} customFunctions these functions will be added to the Mode object
   */
  function Mode(customFunctions){
    $.extend(this, customFunctions);
    this.prototype = Mode.prototype;
  }
  
  Mode.prototype = /** @scope Mode.prototype */ {
    /**
     * This loads the mode for the current Editor
     * TODO this is ugly. why should every editor have every mode?
     * @param {Editor} editor
     */
    load: function(editor) {
      this.editor = editor;
      this.htmlDiv = editor.htmlDiv;
      this.textArea = editor.textArea;

      console.log("loaded Mode " + this.name);
    },
    /**
     * The default pressed function to handle key combos (shift + x)
     */
    pressed: function(keyCode){
      if(keyCode === 16){
        this.holdShift = true;
      }
      if(ME.util.isNeutralKey(keyCode)){
        this.holdNeutralKey = true;
      }
    },
    /**
     * Handle special keys (shift press) to deal with key combos
     */
    released: function(keyCode){
      if(keyCode === 16){
        this.holdShift = false;
      }
      if(ME.util.isNeutralKey(keyCode)){
        this.holdNeutralKey = false;
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
    activate: function() {
      if(this.htmlDiv.is(":empty")) {
        this.updatePreview();
      } else {
        this.updateTextArea();
      }
      this.editor.toolbar.loadModeToolbar();
      this.afterActivation();
    },
    /**
     * Update the preview html div with the html representation of the mode
     */
    updatePreview: function() {
      console.log("updating preview in Mode " + this.name);
      this.htmlDiv.html(this.toHTML() || "<p>&nbsp;</p>");
    },
    /**
     * Update the textarea with the text representation of the mode
     */
    updateTextArea: function() {
      console.log("updating TA in Mode " + this.name);
      this.textArea.val(this.toText());
    },
    /**
     * Run after activation. Default behaviour for text modes. wysiwyg mode has 
     * its own version
     */
    afterActivation: function() {
      this.textArea
        .parent().show()
        .find(":first-child").focus()[0]
        .setSelectionRange(0,0);
      this.htmlDiv.attr("contentEditable",false);
    },
    /**
     * Get a state object which sets defines the states of the buttons
     * and the selects.
     * @returns {Object} an object that describes the states
     */
    getStates: function(){
      var states = this.getSelectionStates();
      if(this.id === 'wysiwyg'){
        states.wysiwyg = true;
      } else {
        states.changeDataMode = this.id;
      }
      return states;
    },
    /**
     * This is a placeholder. Each mode should define its version
     * @returns {Object} an object that describes the states
     * @see Toolbar#getStates
     * @api
     */
    getSelectionStates: function(){
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
    getSelection: function(boundary) {
      var textArea = this.textArea, text = textArea.val(), boundaryPosition, subString;
      textArea.focus();

      // gecko & webkit
      this.scrollPosition = textArea.scrollTop;
      this.selectionStart = textArea[0].selectionStart;
      this.selectionEnd = textArea[0].selectionEnd;

      if(text[this.selectionEnd-1] === "\n"){
        this.selectionEnd -= 1;
      }

      if(boundary) {
        // find left boundary
        boundaryPosition = Math.max(text.lastIndexOf(boundary, this.selectionStart), text.lastIndexOf("\n", this.selectionStart));
        if(boundaryPosition !== -1) {
          this.selectionStart = boundaryPosition + 1;
        } else {
          this.selectionStart = 0;
        }
        
        // find right boundary, first limit the text to the
        // next new line
        boundaryPosition = text.indexOf("\n", this.selectionEnd); 
        if(boundaryPosition === -1) {
          subString = text.slice(this.selectionStart);
        } else {
          subString = text.slice(this.selectionStart, boundaryPosition);
        }

        // Then find the next boundary
        boundaryPosition = 0;
        do{
          boundaryPosition = subString.indexOf(boundary, boundaryPosition + 1);
        } while(boundaryPosition !== -1 && this.selectionEnd > this.selectionStart + boundaryPosition);

        // when it doesn't exist, extend the selection to the
        // paragraph end
        if(boundaryPosition === -1) {
          boundaryPosition = subString.length;
        }
        this.selectionEnd = this.selectionStart + boundaryPosition;
      }
      this.selection = text.slice(this.selectionStart, this.selectionEnd);
      return this.selection;
    },
    /**
     * Replace the current selection with the given string
     * @param {String} string The replacement string
     * @param {Boolean} collapseToStart If the selection should collapse
     */
    replaceSelection: function(string, collapseToStart) {
      var textArea = this.textArea,
      newSelectionStart = this.selectionStart,
      newSelectionEnd = this.selectionStart + string.length;

      // gecko & webkit
      textArea.val(textArea.val().slice(0, this.selectionStart) + string + textArea.val().slice(this.selectionEnd, textArea.val().length));

      // move caret gecko
      if(collapseToStart === true){
        newSelectionEnd = newSelectionStart;
      } else if(collapseToStart === false){
        newSelectionStart = newSelectionEnd;
      }

      textArea[0].setSelectionRange(newSelectionStart, newSelectionEnd);
      textArea.focus();
    },
    /**
     * Extend the right selection with a regexp. Everything matched will be added
     * to the selection. Useful for special cases like toggling parts of a bolded
     * String in textile
     * 
     * @param {Regexp} regexp The regexp
     * 
     * @example
     * extendRightSelection(/ +/)
     */
    extendRightSelection: function(regexp){
      var match;
      regexp = new RegExp(regexp.source,'g');
      regexp.lastIndex = this.selectionEnd;
      match = regexp.exec(this.textArea.val());

      if(match && regexp.lastIndex == this.selectionEnd + match[0].length){
        this.selectionEnd += match[0].length;
        return match[0];
      }
    },
    /**
     * Extend the left selection with a regexp. Everything matched will be added
     * to the selection. Useful for special cases like toggling parts of a bolded
     * String in textile
     * 
     * @param {Regexp} regexp The regexp.
     * 
     * @example
     * extendLeftSelection(/[ .]+/)
     */
    extendLeftSelection: function(regexp){
      var match, substring = this.textArea.val().slice(0,this.selectionStart);
      regexp = new RegExp(regexp.source + "$");
      match = regexp.exec(substring);
      
      if(match){
        this.selectionStart -= match[0].length;
        return match[0];
      }
    }};
  
  

  /**
   * Create a button for the toolbar
   *
   * @constructor
   * @name ToolbarButton
   *
   * @param {String} name The class name of the button
   * @param {Function} [clicked] The default action if the button is clicked
   */
  function ToolbarButton(name, clicked){
    this.name = name;
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
    
    this.textArea = editor.textArea;
    this.htmlDiv = editor.htmlDiv;
    this.editor = editor;
    this.div = toolbarDiv;

    toolbarDiv.html(getToolbarHTML());
    
    toolbarDiv.mouseup(function(e) { // Trigger on button click
      var target = e.target;

      if(!(/(select|option)/i).test(target.nodeName)) {
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
        that.runAction(action, target);
        // TODO this does not work with dialogs
        // in dialogs this gets set manually, but perhaps there is a
        // more general way?
        editor.checkState();
      }
    }).change(function(e) { // trigger on select change
      var target = e.target;
      that.runAction(target.className, target);
      return false;
    }).click(function(e){return false; }); //

    editor.container.prepend(toolbarDiv);
  } // end initToolbar

  Toolbar.prototype = /** @scope Toolbar.prototype */{
    /**
     * Load the toolbar for the current mode. If a toolbar item is not
     * supported, it will be hidden.
     */
    loadModeToolbar: function(){
      var supportedItems = this.editor.currentMode.supportedItems,
      hasSave = this.editor.settings.save,
      oldVisibleItems = this.visibleItems,
      newVisibleItems = [];
      
      // Optimize: better scheme. Calculate the differences between
      // the modes once and use them here
      this.div.children().each(function(){
        var item = this.className;
        if(supportedItems.indexOf(item) != -1 && (item !== "save" || hasSave)){
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
    runAction: function(action,target) {
      var item = toolbarItems[action],
      editor = this.editor,
      mode = editor.currentMode;
      (item[mode.id] || item).clicked(editor, mode, target);
      // Update Preview in case something has changed
      if(action != "changeMode" && !editor.is("wysiwyg")) {
        mode.updatePreview();
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
    var container, editor = this, timer = 0;

    this.loadedModes = {};
    this.setDataType(textArea.attr("class"));
    this.settings = settings;

    if(!this.dataType) { return ;}

    function addKeyListeners(object, isTextarea){
      object.keydown(function(e){
        if(isTextarea || editor.is('wysiwyg')){
          return editor.currentMode.pressed(e.keyCode);
        }
      }).keyup(function(e){
        if(isTextarea || editor.is('wysiwyg')){
          return editor.currentMode.released(e.keyCode);
        }
      }).mouseup(function(){
        if(isTextarea || editor.is('wysiwyg')){
          return editor.currentMode.clicked();
        }
      });
    }
    
    this.textArea = textArea.bind("mouseup keyup", function() {
      // TODO check for specific mouse keys
      editor.checkState();
      clearTimeout(timer);
      timer = setTimeout(function(){
        editor.currentMode.updatePreview();
      },1000);
    });
    addKeyListeners(textArea,true);
    
    this.htmlDiv = $("<div class=\"preview\"></div>")
      .bind("mouseup keyup", function() {
        // TODO check for specific mouse keys
        if(editor.is("wysiwyg")) {
          editor.checkState();
        }
      });
    addKeyListeners(this.htmlDiv);
    
    this.container = textArea.wrap("<div class=\"markupEditor\"></div>")
      .parent().append(editor.htmlDiv);
    textArea.wrap("<div class=\"textarea\">");
    this.toolbar = new Toolbar(this);
  } // Editor

  Editor.prototype = /** @scope Editor.prototype */{
    /**
     * Change the current mode to the given id
     * 
     * @param {String} modeId The id of the mode (e.g. textile)
     */
    changeMode: function(modeId) {
      var nextMode;
      nextMode = this.getMode(modeId);
      this.commit();
      this.currentMode = nextMode;
      nextMode.activate();
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
      return this.getMode(this.dataType);
    },
    /**
     * Get the specified mode. Loads it if necessary
     *
     * @param {String} modeId The id of the mode (e.g. textile)
     *
     * @returns {Mode} The initialized mode
     */
    getMode: function(modeId) {
      if(this.loadedModes[modeId]) {
        return this.loadedModes[modeId];
      }
      else if (availableModes[modeId]) {
        this.loadedModes[modeId] = availableModes[modeId](this);
        return this.loadedModes[modeId];
      }
      else {
        console.log("Mode " + modeId + " is not defined");
      }
    },
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
    commit: function() {
      if(this.is("wysiwyg")) {
        this.getMode(this.dataType).updateTextArea();
      } else {
        this.currentMode.updatePreview();
      }
    },
    is: function(modeId) {
      return this.currentMode.id === modeId;
    },
    checkState: function () {
      // check if the current Selection is inside a bold/italic etc.
      this.toolbar.setActive(this.currentMode.getStates());
    }
  }; // end Editor prototype

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
    textarea = $("<textarea class=\"" + container[0].className + "\">")
      .prependTo(container); // needs to be attached to DOM in firefox
    
    editor = initEditorFromTextarea(textarea, settings);
    editor.htmlDiv.append(editor.container.nextAll());
    editor.currentMode.updateTextArea();
    editor.changeMode("wysiwyg");
    editor.checkState();
    
    container.append(editor.container);
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
      editor.currentMode.activate();
      editor.currentMode = editor.getMode("wysiwyg");
    }
    editor.currentMode.activate();
    editor.checkState();
    return editor;
  }

  /**
   * @namespace Holds all public methods
   */
  ME = {
    /**
     * Add a mode
     *
     * TODO change spec to object
     * @param {String} modeId The id of the mode as referenced
     * internally
     * @param {Function} spec The definiton of the mode
     */
    addMode: function(modeId, spec) {
      var mode = spec(), items = mode.items, constructor, supportedItems = globalItems.slice();
      mode.id = modeId;
      
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
        toolbarItems.changeDataMode.options.push([modeId, mode.name]);
      }

      mode.supportedItems = supportedItems;
      
      availableModes[modeId] = function(editor) {
        var modeInstance = new Mode(mode);
        
        modeInstance.load(editor);
        
        return modeInstance;
      };
      return mode;
    },
    /**
     * The global options of markup editor
     *
     * @class
     * @property {Function} save The save callback. Takes the editor
     * as parameter
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

  /**
   * @name jQuery
   * @namespace The popular DOM utility
   */

  /**
   * Create the markup editor
   *
   * @memberOf jQuery.prototype
   *
   * @param {Object} settings The specific settings for the editor
   * @see ME#settings
   */
  $.fn.initMarkupEditor = function(settings) {
    ME.settings = settings;
    this.each(function(index,element) {
      var $element = $(element);
      if($element.is("textarea")) {
        initEditorFromTextarea($element, settings);
      } else {
        initEditorFromHTML($element, settings);
      }
    });
    return this;
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
    editor.commit();
    editor.settings.save(editor);
  });

  toolbarItems.wysiwyg = new ToolbarButton("wysiwyg", function(editor, mode){
    if(editor.is('wysiwyg')){
      editor.changeMode(editor.dataType);
    } else {
      editor.changeMode('wysiwyg');
    }
  });

  return ME;
})(jQuery);
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
ME.addMode("textile", function() {
  var text, selectionStart, startOfParagraphs, endOfParagraphs, oldExtendedSelectionLength, currentNodes = {},
  $ = jQuery;

  /**
   * Iterate over each paragraph and call the functor on it and set the paragraphs
   * CONSIDER rename or move setParagraphs out of it
   * 
   * @param {Mode} mode The current mode
   * @param {Function} functor The functor will be applied on each paragraph
   */
  function eachParagraph(mode, functor) {
    var paragraphs = mode.getParagraphs(), paragraphsLength = paragraphs.length;

    for(i = 0; i < paragraphsLength; i++) {
      paragraphs[i] = functor(paragraphs[i]);
    }
    mode.setParagraphs(paragraphs);
  }

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

  function replaceEachLine(mode, boundary, functor){
    var lines = mode.getSelection(boundary).split("\n");

    eachLine(lines, function(i, lineStart, line){
      lines[i] = functor(lineStart, line);
    });
    
    mode.replaceSelection(lines.join("\n"));
  }

  function firstLine(mode){
    var lines = mode.getSelection("\n").split("\n").slice(0,1),
    lineLength = lines[0].length;
    mode.selectionEnd = mode.selectionStart + lineLength;
    eachLine(lines, function(i, lineStart, line){
      mode.selectionStart += lineStart.length;
      lines[i] = line;
    });
    return lines[0];
  }

  /**
   * Execute align command
   * 
   * @param {Mode} mode The current mode
   * @param {String} orientation The orientation of the alignment
   */
  function align(mode, orientation) {
    eachParagraph(mode, function(paragraph) {
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
   * @param {Mode} mode The current mode
   * @param {RegExp} r The regexp to search for
   */
  function scanForMatch(mode,r){
    var match = r.exec(text);
    if(r.lastIndex === 0){
      return;   // TODO escalate this return to break the caller too
    }
    while(r.lastIndex < selectionStart){
      match = r.exec(text);
    }

    // needed for the replaceSelection call
    mode.selectionStart = r.lastIndex - match[0].length;
    mode.selectionEnd = r.lastIndex;
    return match;
  }

  function toggleList(mode, target, bullet){
    replaceEachLine(mode, "\n", function(lineStart, line){
      if(!/ on$/.test(target.className)){
        line = bullet + " " + line;
      }
      return line;
    });
  }

  var listTypes = {
    ul: '*',
    ol: '#'
  };

  /**
   * @returns {Boolean} return false to prevent browser
   * CONSIDER move to object or remove mode parameter
   */
  function pressedEnter(mode){
    var list = currentNodes.list, replacement;

    if(list && /(u|o)l/i.test(list.tag)){ // only headings
      mode.getSelection();
      if(mode.holdShift){
        replacement = " <br> ";
      } else {
        replacement = "\n" + listTypes[list.tag] + " ";
      }
      mode.replaceSelection(replacement, false);
      return false;
    }
  }

  regexpes = {
    "*": [/^(\w+\. )?\s*\*/, /\*([\.]*)$/],
    "_": [/^(\w+\. )?\s*_/, /_([\.]*)$/]
  };
  return {
    name: "Textile Mode",
    items: {
      "default": {
        clicked: function(editor, mode, target) {
          // TODO find left and right boundaries that are valid
          var match, that = this;
          replaceEachLine(mode, " ", function(lineStart, line){
            if(/ on$/.test(target.className)){
              
              // first handle the left part
              match = line.match(regexpes[that.delimiter][0]);
              if(match){
                line = (match[1] || "") + line.slice(match[0].length);
              } else {
                // place delimiter left and extend selection
                line = that.delimiter + mode.extendLeftSelection(/[ .]+/) + line;
              }

              // Then handle the right
              match = line.match(regexpes[that.delimiter][1]);
              if(match){
                line = line.slice(0, - match[0].length) + (match[1] || ""); 
              } else {
                line += mode.extendRightSelection(/ +/) + that.delimiter;
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
        delimiter: "*"
      },
      italic: {
        delimiter: "_"
      },
      alignLeft: {
        clicked: function(editor, mode) {
          align(mode, "left");
        }
      },
      alignRight: {
        clicked: function(editor, mode) {
          align(mode, "right");
        }
      },
      alignCenter: {
        clicked: function(editor, mode) {
          align(mode, "center");
        }
      },
      unorderedList: {
        clicked: function(editor, mode, target) {
          toggleList(mode, target, "*");
        }
      },
      orderedList: {
        clicked: function(editor, mode, target) {
          toggleList(mode, target, "#");
        }
      },
      link: {
        clicked: function(editor, mode, target) {
          var dialog, callback, titleString, href, r, match;
          
          callback = {
            submit: function(title,uri){
              mode.replaceSelection("\"" + title + "\":" + uri);
            },
            remove: function(){
              mode.replaceSelection(match[1]);
            },
            close: function(){
              mode.updatePreview();
              editor.checkState();
            }
          };

          if(/ on$/.test(target.className)){
            dialog = ME.dialog.link(['Update','Remove','Cancel']);
            href = currentNodes.a.attributes.href;

            match = scanForMatch(mode,new RegExp('\"([^\"]*)\":'+href,'g'));

            titleString = match[1];
            dialog.val('input.uri', href);
          }
          else {
            dialog = ME.dialog.link(['Create','Cancel']);
            titleString = firstLine(mode);
          }
          
          if(!/^\s*$/.test(titleString)){
            dialog.val('.title', titleString);
          }
          
          dialog.dialog('open', callback);
        }
      },
      insertImage: {
        clicked: function(editor, mode, target) {
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

              mode.replaceSelection(replacement);
            },
            remove: function(){
              mode.replaceSelection("");
            },
            close: function(){
              mode.updatePreview();
              editor.checkState();
            }
          };
          
          if(/ on$/.test(target.className)){
            dialog = ME.dialog.insertImage(['Update','Remove','Cancel']);
            src = currentNodes.img.attributes.src;

            scanForMatch(mode, new RegExp('!' + src + "(\\([^\\)]*\\))?!(:[^ \n]*)?",'g'));
            
            if(currentNodes.a){
              href = currentNodes.a.attributes.href;
            }
            dialog.val('input.uri', href);
            dialog.val('input.imageUri', src);
            dialog.val('input.title', currentNodes.img.attributes.title);
          }
          else {
            dialog = ME.dialog.insertImage(['Create','Cancel']);
            firstLine(mode);
          }

          dialog.dialog('open', callback);
        }
      },
      formatBlock: {
        clicked: function(editor, mode, target) {
          eachParagraph(mode, function(paragraph) {
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
     */
    updatePreview: function() {
      var html = textileCompiler.compile(this.textArea.val());
      this.htmlDiv.html(html);
    },
    /**
     * Convert preview div to textile
     * 
     * @returns {String} A textile string
     */
    toText: function(html) {
      if(!html){
        html = this.htmlDiv.html();
      }

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
     * @return {Object} An object representing the states
     */
    getSelectionStates: function() {
      var paragraphs = this.getExtendedSelection(),
      startTrace = selectionStart - startOfParagraphs,
      endTrace = selectionEnd - startOfParagraphs;
      trace = textileCompiler.trace(paragraphs, startTrace, endTrace);

      return this.buildStateObject(trace, currentNodes = {});
    },
    /**
     * Get the paragraphs containing the current selection
     * 
     * CONSIDER remove this? is it only needed for getParagraphs?
     * 
     * @returns {String} The paragraphs
     */
    getExtendedSelection: function(){
      var paragraphIndex, searchIndex = 0, extendedSelection;
      selectionStart = this.textArea[0].selectionStart;
      selectionEnd = this.textArea[0].selectionEnd;
      text = this.textArea.val();
      startOfParagraphs = 0; endOfParagraphs = -1;

      while((paragraphIndex = text.indexOf("\n\n",searchIndex) + 2 ) !== 1) {
        if(selectionStart > paragraphIndex) {
          startOfParagraphs = paragraphIndex;
        } else if (selectionEnd < paragraphIndex) {
          endOfParagraphs = paragraphIndex - 2;
          break;
        }
        searchIndex = paragraphIndex;
      }
      
      if(endOfParagraphs === -1) {
        extendedSelection = text.slice(startOfParagraphs);
      } else {
        extendedSelection = text.slice(startOfParagraphs, endOfParagraphs);
      }
      oldExtendedSelectionLength = extendedSelection.length;

      return extendedSelection;
    },
    /**
     * @returns {String[]} An array of paragraphs
     */
    getParagraphs: function() {
      return this.getExtendedSelection().split(/\n\n+/);
    },
    /**
     * Set the paragraphs and move the caret
     * 
     * @param {String[]} paragraphs An array of paragraphs
     */
    setParagraphs: function(paragraphs) {
      paragraphs = paragraphs.join("\n\n");

      if(endOfParagraphs === -1) {
        this.textArea.val(text.slice(0,startOfParagraphs) + paragraphs);
      } else {
        this.textArea.val(text.slice(0,startOfParagraphs) + paragraphs + text.slice(endOfParagraphs));
      }
      
      this.moveCaret(paragraphs.length - oldExtendedSelectionLength);
    },
    /**
     * Move the caret by the given distance. Positive values move the caret to 
     * the right, negative to the left.
     * 
     * @param {Integer} distance The distance to move the caret
     */
    moveCaret: function(distance) {
      // console.log("Moving caret: " + distance);

      if(Math.abs(selectionStart - startOfParagraphs) > Math.abs(distance)) {
        selectionStart += distance;
      } else {
        selectionStart = startOfParagraphs;
      }
      
      this.textArea.focus();
      this.textArea[0].setSelectionRange(selectionStart, selectionStart);
    },
    pressed: function(keyCode){
      // console.log("pressed", keyCode);
      switch(keyCode){
      case 13: // enter
        return pressedEnter(this);
      default: // handle keyCombos
        this.prototype.pressed.apply(this, [keyCode]);
      }
    }
  };
});
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
   * @type Builder
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
  
  textileCompiler = {
    compile: function(textToCompile){
      builder.init();
      text = textToCompile;
      parseParagraphs();
      return builder.toHtml();
    },
    trace: function(textToCompile, startTrace, endTrace){
      builder.initTrace(startTrace, endTrace, textToCompile.length);
      this.compile(textToCompile);
      builder.finalizeTrace();
      return builder.getTrace();
    }
  };
})();
ME.addMode("wysiwyg",function() {
  var currentNodes = {}, $ = jQuery, selection = getSelection(), range = document.createRange();

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

  function handleList(editor, mode, target, listType){
    var contents, lines, $p, $list;
    
    if(/ on$/.test(target.className)){
      disableList(editor, mode);
    } else {
      contents = mode.getSelection('br');
      
      $list = $("<" + listType + ">");
      createList($list, contents.firstChild);

      joinAdjacentList(mode.leftBorder, $list);
      joinAdjacentList(mode.rightBorder, $list);

      mode.replaceSelection(editor, $list);
    }
  }

  function disableList(editor, mode){
    // get list items and detach them from the dom
    contents = mode.getSelection('li');

    lines = [];
    // insert their contents into a paragraph tag and seperate
    // them by and <br>
    addListItems(lines, contents.firstChild);
    $p = $("<p>").html(lines.join("<br>"));

    mode.replaceSelection(editor, $p);
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
    block = currentNodes.block;

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
   */
  function pressedBackspace(mode, htmlDiv, editor){
    if(checkIfDeletedAll(htmlDiv,8) === false){
      return false;
    }
    var children, atBeginningOfLI,
    inFirstSibling = true,
    block = currentNodes.block,
    list = currentNodes.list,
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
      disableList(editor,mode);
    }
    
    return false;
  }

  /**
   * @browserbug Chrome
   * bring Chrome to a normal behaviour
   */
  function pressedDelete(mode, htmlDiv, editor){
    if(checkIfDeletedAll(htmlDiv,46) === false){
      return false;
    }
    if(!$.browser.webkit){
      return true;
    }
    var children,
    block = currentNodes.block,
    list = currentNodes.list,
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

  return {
    name: "Preview Mode",
    items: {
      "default": {
        clicked: function(editor, mode, target) {
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
        clicked: function(editor, mode, target){
          handleList(editor, mode, target, 'ul');
        }
      },
      orderedList: {
        clicked: function(editor, mode, target){
          handleList(editor, mode, target, 'ol');
        }
      },
      link: {
        clicked: function(editor, mode, target) {
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
            linkNode = $(currentNodes.a);
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
        clicked: function(editor, mode, target) {
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
            if(currentNodes.a){
              linkNode = $(currentNodes.a);
              dialog.val('input.uri', linkNode.attr('href'));
              range.selectNode(currentNodes.a);
            }
            imageNode = $(currentNodes.img);

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
        clicked: function(editor, mode, target) {
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
    getSelection: function(nodeType){
      var range = selection.getRangeAt(0);

      this.collapsed = range.collapsed;

      this.leftBorder = new Border(startNode(), nodeType, 'previousSibling');
      this.rightBorder = new Border(endNode(), nodeType, 'nextSibling');
      
      range.setStartBefore(this.leftBorder.node);
      range.setEndAfter(this.rightBorder.node);

      // split node if there are other nodes after the selection
      if(this.rightBorder.borderNode){
        $(this.rightBorder.borderNode).nextAll()
          .appendTo('<' + this.rightBorder.block.nodeName + '>').parent()
          .insertAfter(this.rightBorder.block);
      }

      return range.extractContents();
    },
    replaceSelection: function(editor, nodes){
      if(this.leftBorder.safeBlock){
        nodes.insertAfter(this.leftBorder.safeBlock);
      } else {
        editor.htmlDiv.prepend(nodes);
      }
      
      if(this.collapsed){
        selectNodes(nodes, true);
      } else {
        selectNodes(nodes);
      }
      
      // remove empty block tags
      // OPTIMIZE
      if(/^\s*$/.test(this.leftBorder.block.textContent)){
        $(this.leftBorder.block).remove();
      }
      if(/^\s*$/.test(this.rightBorder.block.textContent)){
        $(this.rightBorder.block).remove();
      }
    },
    afterActivation: function() {
      this.textArea.parent().hide();
      this.htmlDiv.attr("contentEditable",true);

      // Force Mozilla to generate tags instead of inline styles
      if ($.browser.mozilla) {
        document.execCommand("styleWithCSS",null, false);
      }
    },
    getSelectionStates: function() {
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
      return this.buildStateObject(nodes, currentNodes = {});
    },
    clicked: function(){
      checkCaret(0);
    },
    pressed: function(keyCode){
      this.prototype.pressed.apply(this, [keyCode]);
      switch(keyCode){
      case 13: // enter
        return pressedEnter(this.htmlDiv);
      case 8: // Backspace
        return pressedBackspace(this, this.htmlDiv, this.editor);
      case 46: // Delete
        return pressedDelete(this, this.htmlDiv, this.editor);
      case 37: // left arrow
        return checkCaret(-1);
      case 39: // right arrow
        return checkCaret(1);
      default:
        return checkIfDeletedAll(this.htmlDiv, keyCode, this.holdNeutralKey);
      }
    },
    toText: function() {
      return this.editor.getDataMode().toText();
    },
    toHTML: function() {
      return this.htmlDiv.html();
    }
  };
});
