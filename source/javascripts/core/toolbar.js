!function ($, _){
  var toolbarItems = {},
  toolbarHTML = "",
  globalItems = [],
  availableItems = ['bold','italic','alignLeft','alignCenter','alignRight','unorderedList','orderedList','link','insertImage','save','wysiwyg','close','changeDataMode','formatBlock'];
  /**
   * Create a button for the toolbar
   *
   * @constructor
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
  ME.ToolbarButton = function (name, clicked, isAvailable){
    this.name = name;
    this.isAvailable = isAvailable;
    if(clicked){
      this.clicked = clicked;
      globalItems.push(name);
    }
  };
  
  ME.ToolbarButton.prototype = {
    /**
     * @returns {String} A html string of the button
     */
    getButton: function() {
      return '<a href="#" class=\"'+ this.name +'\" title="' + _(this.name) + '"><span>'+ this.name +'</span></a>';
    }
  };

  /**
   * Create a select for the toolbar
   *
   * @constructor
   * @augments ME.ToolbarButton
   *
   * @property {Array} options The options of the select dropdown
   *
   * @param {String} name The class name of the button
   * @param {Array} [options] The options of the select dropdown
   * @param {Function} [clicked] The default action if the button is clicked
   */
  ME.ToolbarSelect = function (name, options, clicked, isAvailable){
    ME.ToolbarButton.apply(this, [name, clicked, isAvailable]);
    this.options = options || [];
  };
  
  ME.ToolbarSelect.prototype = {
    /**
     * @returns {String} A html string of the button
     */
    getButton: function() {
      var select = "<select class=\"" + this.name +  '\" title="' + _(this.name) + '">',
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
  
  function changeIfNecessary(select, newVal){
    if(select.val() !== newVal){
      select.val(newVal).change();
    }
  }

  function useExternalChangeDataModeSelect(select, toolbarDiv, editorID) {
    var toolbarSelect = toolbarDiv.find('.changeDataMode');
    toolbarSelect.html(select.find('option').clone())
      .change(function(){
        changeIfNecessary(select, $(this).val());
      });

    var editorIDs = select.data('editorIDs') || [];
    if(!editorIDs[0]){
      select.hide().change(function(){
        changeIfNecessary(toolbarSelect, $(this).val());
      });
    }
    editorIDs.push(editorID);
    select.data('editorIDs', editorIDs);
  }

  /**
   * Create a toolbar for an editor. Every editor has its own toolbar, since the
   * items of the toolbar can be defined on a per editor basis (save
   * callback)
   * TODO decouple toolbar and editor
   *
   * @constructor
   */
  ME.Toolbar = function Toolbar(editor) {

    // init Toolbar Items
    var button, buttonTags = '',
    toolbarDiv = $("<div class=\"toolbar\"></div>"),
    that = this,
    select = editor.settings.select;

    this.div = toolbarDiv;

    toolbarDiv.html(getToolbarHTML());

    if(select && select[0]){
      useExternalChangeDataModeSelect(select, toolbarDiv, editor.id);
    }

    toolbarDiv.mouseup(function(e) { // Trigger on button click
      target = e.target;

      if((/(a|span)/i).test(target.nodeName)) {
        // When the span is clicked change the Target to the
        // containing div
        if(/span/i.test(target.nodeName)) {
          target = target.parentNode;
        }
        if(target.disabled){
          // TODO handle focus somewhere
          if(editor.is('wysiwyg')){
            editor.preview.focus();
          } else {
            editor.textArea.focus();
          }
          return false;
        }
        var action = target.className;

        action = action.split(" ")[0];
        
        that.runAction(editor, action, target);
      }
    }).change(function(e) { // trigger on select change
      var target = e.target;
      that.runAction(editor, target.className, target);
      return false;
    }).click(function(e){return false; }); //
  }; // ME.Toolbar

  ME.Toolbar.getSupportedItems = function(modeId, modeName, items){
    var constructor,
    supportedItems = globalItems.slice(); // global items (like
    // save) are supported
    
    if(items) {
      for( item in items) {
        if(items.hasOwnProperty(item) && item !== "default") {
          supportedItems.push(item);
          if(!toolbarItems[item]) {
            constructor = items[item].options ? ME.ToolbarSelect : ME.ToolbarButton;
            toolbarItems[item] = new constructor(item);
          }
          toolbarItems[item][modeId] = $.extend({name: item}, items["default"], items[item]);
        }
      }
    }

    if(modeId !== 'wysiwyg'){
      toolbarItems.changeDataMode.options.push([modeId, modeName]);
    }

    return supportedItems;
  };

  ME.Toolbar.prototype = {
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
      var asynchronous,
      item = toolbarItems[action],
      mode = editor.currentMode;

      if(editor.is('wysiwyg')){
        editor.preview.focus();
      }

      // execute buttons clicked action
      asynchronous = (item[mode.id] || item).clicked(editor, target);
      
      if(!asynchronous){
        editor.checkState();
        // Update Preview in case something has changed
        if( !editor.is("wysiwyg")) {
          mode.updatePreview(editor);
        }
      }
    },
    /**
     * Activate the buttons/selects of the given actions on the toolbar
     * 
     * @param {Object} actions The actions which should be active
     */
    setActive: function( actions ) {
      console.log('setActive', actions);
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
  }; // ME.toolbar.prototype

  toolbarItems.changeDataMode = new ME.ToolbarSelect("changeDataMode", [], function(editor, target) {
    editor.changeDataMode(target.value);
    return true;
  }, function(editor){
    return editor.toolbar.div.find('.changeDataMode option').length > 1;
  });

  toolbarItems.formatBlock = new ME.ToolbarSelect("formatBlock",[
    ["p", _("p")],
    ["h1", _("h1")],
    ["h2", _("h2")],
    ["h3", _("h3")]
  ]);

  toolbarItems.save = new ME.ToolbarButton("save", function(editor){
    editor.synchronize();
    editor.settings.save(editor);
    return true;
  }, function(editor){
    return editor.settings.save;
  });

  toolbarItems.wysiwyg = new ME.ToolbarButton("wysiwyg", function(editor){
    if(editor.is('wysiwyg')){
      editor.changeMode(editor.dataType);
    } else {
      editor.changeMode('wysiwyg');
    }
    return true;
  }, function(editor){
    var mode = editor.currentMode;
    return mode.toHTML && mode.toText;
  });

  toolbarItems.close = new ME.ToolbarButton('close', function(editor){
    editor.close();
  }, function(editor) {
    var settings = editor.settings;
    return settings.preview || settings.closable;
  });

}(jQuery, ME.t10n);

