ME = function ($) {

  var globalSettings = {}, availableModes = {}, toolbarItems = {};
  
  /**
   * Create a new Mode
   * @constructor
   * @param {Object} customFunctions these functions will be added to the Mode object
   */
  function Mode(customFunctions){
    $.extend(this, customFunctions);
  }
  Mode.prototype = {
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
     * This is a placeholder. Each mode should define its version
     * @returns {Object} an object that describes the states
     * @see Toolbar#setActive
     * @api
     */
    getStates: $.noop,
    /**
     * Activate this mode for the editor
     */
    activate: function() {
      if(this.htmlDiv.is(":empty")) {
        this.updatePreview();
      } else {
        this.updateTextArea();
      }
      this.afterActivation();
    },
    /**
     * Update the preview html div with the html representation of the mode
     */
    updatePreview: function() {
      console.log("updating preview in Mode " + this.name);
      this.htmlDiv.html(this.toHTML());
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
      this.textArea.show();
      this.htmlDiv.attr("contentEditable",false);
    },
    /**
     * Iterates over the given nodes and builds the state object which defines 
     * the active buttons
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
        case "li":
          break;
        case "ol":
          states.insertOrderedList = true;
          states.insertUnorderedList = false;
          break;
        case "b":
          states.bold = true;
          break;
        case "ul":
          states.insertOrderedList = false;
          states.insertUnorderedList = true;
          break;
        default:
          states.formatBlock = getTag(node);
          break;
        }
      }
      return states;
    }
  };

  /**
   * Create a button for the toolbar
   * @constructor
   * 
   * @param {String} name The class name of the button
   * @param {Function} [clicked] The default action if the button is clicked
   */
  function ToolbarButton(name){
    this.name = name;
  }
  ToolbarButton.prototype = {
    /**
     * @returns {String} A html string of the button
     */
    getButton: function() {
      return '<a href="#" class=\"'+ this.name +'" ><span>'+ this.name +'</span></a>';
    }
  };

  /**
   * Create a select for the toolbar
   * @constructor
   * 
   * @param {String} name The class name of the button
   * @param {Array} [options] The options of the select
   * @param {Function} [clicked] The default action if the button is clicked
   */
  function ToolbarSelect(name, options){
    this.name = name;
    this.options = options || [];
  }
  ToolbarSelect.prototype = {
    /**
     * @returns {String} A html string of the button
     */
    getButton: function() {
      var select = $("<select class=\"" + this.name +  "\"></select>"),
      optionsLength = this.options.length,
      i;

      select.className = this.name;

      for (i = 0; i < optionsLength; i += 1){
        $("<option/>").val(this.options[i][0]).text(this.options[i][1]).appendTo(select);
      }
      return select;
    }
  };  // end ToolbarSelect
  
  /**
   * Create a toolbar for an editor. Every editor has its own toolbar, since the
   * items of the toolbar can be defined on a per editor basis (save callback)
   *
   * @constructor
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
    
    for(item in toolbarItems) {
      if(toolbarItems.hasOwnProperty(item)) {
        toolbarDiv.append(toolbarItems[item].getButton());
      }
    }
    
    toolbarDiv.mouseup(function(e) { // Trigger on button click
      var target = e.target;

      if(!(/(select|option)/i).test(target.nodeName)) {
        // When the span is clicked change the Target to the
        // containing div
        if(/span/i.test(target.nodeName)) {
          target = target.parentNode;
        }
        var action = target.className;

        action = action.split(" ")[0];
        that.runAction(action, target);
        editor.checkState(); // TODO this does not work with dialogs
      }
      return false;
    }).change(function(e) { // trigger on select change
      var target = e.target;
      that.runAction(target.className, target);
      return false;
    });

    editor.container.prepend(toolbarDiv);
  } // end initToolbar

  Toolbar.prototype = {
    /**
     * TODO abstract this or kick it
     */
    getDivSelection: function() {
      this.htmlDiv.focus();

      // gecko & webkit
      theSelection = window.getSelection();
      theRange = theSelection.getRangeAt(0);
      return theRange.toString();
    },
    /**
     * @param {Boolean} [extendSelectionToWordBoundaries] If the selection should be extended
     * @returns {String} The currently selected string
     */
    getTextAreaSelection: function(extendSelectionToWordBoundaries) {
      var textArea = this.textArea, text = textArea.val(), spacePos, subString;
      textArea.focus();

      // gecko & webkit
      this.scrollPosition = textArea.scrollTop;
      this.selectionStart = textArea[0].selectionStart;
      this.selectionEnd = textArea[0].selectionEnd;
      
      if(extendSelectionToWordBoundaries) {
        // find left word boundary
        spacePos = Math.max(text.lastIndexOf(" ", this.selectionStart), text.lastIndexOf("\n", this.selectionStart));
        if(spacePos !== -1) {
          this.selectionStart = spacePos + 1;
        } else {
          this.selectionStart = 0;
        }
        
        // find right word boundary, first limit the text to the
        // next paragraph
        spacePos = text.indexOf("\n", this.selectionEnd);
        if(spacePos === -1) {
          subString = text.slice(this.selectionStart);
        } else {
          subString = text.slice(this.selectionStart, spacePos);
        }

        // Then find the next space
        spacePos = 0;
        do{
          spacePos = subString.indexOf(" ", spacePos + 1);
        } while(spacePos !== -1 && this.selectionEnd > this.selectionStart + spacePos);

        // when it doesn't exist, extend the selection to the
        // paragraph end
        if(spacePos === -1) {
          spacePos = subString.length;
        }
        this.selectionEnd = this.selectionStart + spacePos;
      }
      this.selection = text.slice(this.selectionStart, this.selectionEnd);
      return this.selection;
    },
    /**
     * Replace the current selection with the given string
     * @param {String} string The replacement string
     */
    replaceTextAreaSelection: function(string) {
      var textArea = this.textArea,
      position = this.selectionStart;
      // gecko & webkit
      textArea.val(textArea.val().slice(0, this.selectionStart) + string + textArea.val().slice(this.selectionEnd, textArea.val().length));

      // move caret gecko
      textArea[0].setSelectionRange(position, position + string.length);
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
    },
    /**
     * TODO write this
     */
    replaceDivSelection: function(string) {
    },
    /**
     * A switch which selects the fitting selection to return.
     * 
     * TODO move selection functions to the mode and remove this
     */
    getSelection: function(extendSelectionToWordBoundaries) {
      if(this.editor.is("wysiwyg")) {
        return this.getDivSelection(extendSelectionToWordBoundaries);
      }else {
        return this.getTextAreaSelection(extendSelectionToWordBoundaries);
      }
    },
    /**
     * @see replaceDivSelection
     */
    replaceSelection: function(string) {
      if (this.editor.is("wysiwyg")) {
        this.replaceDivSelection(string);
      } else {
        this.replaceTextAreaSelection(string);
      }
    },
    /**
     * Execute the given action of the current mode
     * 
     * @param {String} action The action to execute
     * @param {DomElement} target The target of the click
     */
    runAction: function(action,target) {
      toolbarItems[action][this.editor.currentMode.id].clicked(this,target);
      // Update Preview in case something has changed
      if(action != "changeMode" && !this.editor.is("wysiwyg")) {
        this.editor.currentMode.updatePreview();
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
          if(actions[action] === true) { // buttons
            this.className = action + " on";
          } else if (actions[action]) { // selects
            this.value = actions[action];
          } else { // deactivate
            this.className = action;
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
   * @constructor
   * 
   * @param {jQuery} textArea The textarea
   * @param {Object} settings Editor specific settings
   */
  function Editor(textArea, settings) {
    var container, that = this;

    this.loadedModes = {};
    this.setDataType(textArea.attr("class"));

    if(!this.dataType) { return ;}

    this.textArea = textArea.bind("mouseup keyup", function() {
      // TODO check for specific mouse keys
      that.checkState();
    });
    
    this.htmlDiv = $("<div class=\"preview\"></div>").bind("mouseup keyup", function() {
      // TODO check for specific mouse keys
      if(that.is("wysiwyg")) {
        that.checkState();
      }
    });
    
    this.container = textArea.wrap("<div class=\"markupEditor\"></div>")
      .parent().append(that.htmlDiv);
    this.toolbar = new Toolbar(that);
  } // Editor

  Editor.prototype = {
    /**
     * Change the current mode to the given id
     * 
     * @param {String} modeId The id of the mode (e.g. textile)
     */
    changeMode: function(modeId) {
      var nextMode;
      if(!modeId || modeId === this.currentMode.id) {
        return false;
      }
      nextMode = this.getMode(modeId);
      this.commit();
      nextMode.activate();
      this.currentMode = nextMode;
    },
    /**
     * @returns {Mode} The current datamode
     */
    getDataMode: function() {
      return this.getMode(this.dataType);
    },
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

  function initEditor(textArea,instanceSettings){
    var editor,settings = {};
    $.extend(settings,globalSettings,instanceSettings);
    editor = new Editor(textArea, settings);

    editor.currentMode = editor.getDataMode();

    if(textArea.hasClass("wysiwyg")) {
      editor.currentMode = editor.getMode("wysiwyg");
    }
    editor.currentMode.activate();
    editor.toolbar.setActive({changeMode: editor.currentMode.id});
  }

  $.fn.initMarkupEditor = function(settings) {
    this.each(function(index,textArea) {
      textArea = $(textArea);
      if(textArea.is("textarea")) {
        initEditor(textArea, settings);
      }
    });
    return this;
  };

  toolbarItems.changeMode = new ToolbarSelect("changeMode");

  toolbarItems.formatBlock = new ToolbarSelect("formatBlock",[
    ["p", "Paragraph"],
    ["h1", "Heading 1"],
    ["h2", "Heading 2"],
    ["h3", "Heading 3"]
  ]);

  function processToolbarElements(constructor, elements, modeId){
    if(elements) {
      for( element in elements) {
        if(elements.hasOwnProperty(element) && element !== "default") {
          if(!toolbarItems[element]) {
            toolbarItems[element] = new constructor(element);
          }
          toolbarItems[element][modeId] = $.extend({name: element}, elements["default"], elements[element]);
        }
      }
    }
  }
  
  return {
    addMode: function(modeId, spec) {
      var mode = spec(), buttons = mode.buttons, selects = mode.selects;
      mode.id = modeId;
      processToolbarElements(ToolbarButton, buttons, modeId);
      processToolbarElements(ToolbarSelect, selects, modeId);
      
      toolbarItems.changeMode.options.push([modeId, mode.name]);
      // TODO this method definition should be elsewhere
      toolbarItems.changeMode[modeId] = {clicked: function(toolbar, target) {
        toolbar.editor.changeMode(target.value);
      }};
      
      availableModes[modeId] = function(editor) {
        var modeInstance = new Mode(mode);
        
        modeInstance.load(editor);
        
        return modeInstance;
      };
      return mode;
    }
  };
}(jQuery);

ME.dialog = (function($){
  var callback, _insertImage;

  function initDialog(dialogNode, availableButtons){
    fields = dialogNode.find(':input');

    dialogNode.dialog({
      autoOpen: false,
      width: 600,
      close: function() {
        if(callback.close){
          callback.close();
        }
        fields.not(':button, :submit, :reset')
          .val('')
          .removeAttr('checked')
          .removeAttr('selected');
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

  function createDialogFunction(name, fields){
    return function(buttonNames){
      var internal,l, $d = $('#'+name+'-dialog');
      fields = fields($d);
      l = fields.length;
      submit = function() {
        var args = [],i;
        for(i=0;i<l;i++){
          args[i] = fields[i].val();
        }
        callback.submit.apply(this,args);
        $d.dialog("close");
      };
      
      internal = initDialog($d, {
        Ok: submit,
        Update: submit,
        Remove: function(){
          callback.remove();
          $d.dialog("close"); 
        },
        Cancel: function() { 
	  $d.dialog("close"); 
        }
      });
      
      this[name] = function(buttonNames){
        internal.selectButtons(buttonNames);
        return internal;
      };
      return this[name](buttonNames);

    };
  }
  
  return {
    link: createDialogFunction('link', function($d){
      return [
        $d.find('input.title'),
        $uri = $d.find('input.uri'),
        $d.find('select.uri').change(function(){
          $uri.val($(this).val());
        })
      ];
    }),
    insertImage: createDialogFunction('insertImage', function($d){
      return [
        $d.find('input.imageUri'),
        $d.find('input.title'),
        $d.find('input.uri')
      ];
    })
  };
})(jQuery);

$(document).ready(function(){
  $("textarea.markup").initMarkupEditor({});
});
