(function ($) {
  var availableModes = {};

  
  ME = {
    
    addMode: function(modeId, modeDefinition, isGenerated) {
      modeDefinition.id = modeId;
      
      modeDefinition.supportedItems = ME.Toolbar.getSupportedItems(
        modeId,
        modeDefinition.name,
        modeDefinition.items );

      return availableModes[modeId] = new ME.Mode(modeDefinition);
    },
    hasMode: function(modeId){
      return !!availableModes[modeId];
    },
    
    getMode: function(modeId) {
      var mode = availableModes[modeId];
      if (mode) {
        return mode;
      }
      else {
        return this.addMode(modeId, {
          name: modeId
        }, true)
      }
    },
    
    options: {},
    
    setOptions: function(options){
      this.options = options;
    }
  };
}(jQuery));
!function(){
  var currentDefinition = {};
  
  ME.t10n = function(id){
    return currentDefinition[id];
  };

  ME.t10n.load = function(definition){
    currentDefinition = definition;
  };
}();

ME.t10n.load({
  noticeTitle: 'Notice',
  noticeMissingToHTML: 'The old mode could not convert to HTML. You will have to convert the markup manually.',
  noticeMissingToText: 'This mode can not convert HTML to your markup. You will have to convert the markup manually',
  noticeMissingDatamode: 'Datamode not found. Please specify a valid datamode',
  linkTitle: 'Link',
  insertImageTitle: 'Image',
  uri: 'Link',
  uriPrompt: 'Enter or select link',
  title: 'Title',
  titlePrompt: 'Enter title',
  imageUri: 'Image Source',
  p: "Paragraph",
  h1: "Heading 1",
  h2: "Heading 2",
  h3: "Heading 3",
  bold: 'Bold',
  italic: 'Italic',
  alignLeft: 'align left',
  alignCenter: 'align center',
  alignRight: 'align right',
  unorderedList: 'unordered list',
  orderedList: 'ordered list',
  link: 'link',
  insertImage: 'image',
  save: 'save',
  wysiwyg: 'edit preview directly',
  close: 'close',
  changeDataMode: 'change the markup format',
  formatBlock: 'change paragraph format',
  errorText: '{label} is a required field.',
  emailErrorText: 'Please enter a valid {label}'
});


(function($, _) {
  var opts, errorMsgType, initialized;

  
  function Validator($form){
    this.$form = $form;
    this.inputs = $form.find(':input.required');
  }

  Validator.prototype = {
    check: function() {
      var valid = true;

      this.reset(true);
      
      this.inputs.each(function() {
        var $input = $(this),
        fieldValue = $.trim($input.val()),
        labelText = $input.parent().prev().text(),
        errorMsg;
        if(fieldValue === '') {
          errorMsg = _('errorText') || opts.errorText;
	  valid = false;
        } else if($input.hasClass('email')) {
	  if(!(/^([_a-z0-9-]+)(\.[_a-z0-9-]+)*@([a-z0-9-]+)(\.[a-z0-9-]+)*(\.[a-z]{2,4})$/.test(fieldValue))) {
	    errorMsg = _('emailErrorText') || opts.emailErrorText;
	    valid = false;
	  }
        }
        if(errorMsg) {
          errorMsg = errorMsg.replace('{label}',labelText);
          $input.parent()
            .addClass(opts.errorClass)
            .error('show', errorMsg);
        }
      });

      return valid;
    },
    reset: function(fadeOut){
      return this.inputs.each(function(){
        $(this).parent()
          .removeClass(opts.errorClass)
          .error('hide', fadeOut);
      });
    }
  };

  function get($element, constructor, dataField){
    var data = $element.data(dataField);
    if (!data) {
      data = new constructor($element);
      $element.data(dataField, data);
    }
    return data;
  }
  
  $.fn.isValid = function(method, options) {
    var valid = true;

    this.each(function(){
      var validator = get( $(this), Validator, 'isValid');
      
      if (!validator[method]) {
        method = 'check';
      }
      
      valid = validator[method](options) ? valid : false;
    });
    
    return valid;
  };
  
  $.fn.isValid.init = function(options){
    opts = $.extend({}, $.fn.isValid.defaults, options);
  };
  $.fn.isValid.defaults = {
    errorClass: 'error',
    errorText: '{label} is a required field.',
    emailErrorText: 'Please enter a valid {label}'
  };

  
  function Error($element) {
    this.$element = $element;
    this.$tip = $('<div class="error-tip"></div>')
      .html('<div class="arrow"></div><div class="inner"></div>')
      .prependTo(document.body);
  }
  
  Error.prototype = {
    opacity: 0.8,
    show: function(message) {
      var $tip = this.$tip;
      this.hidden = false;
      
      $tip.find('.inner').text(message);
      $tip.css({top: 0, left: 0, visibility: 'hidden', display: 'block'});
      
      var pos = $.extend({}, this.$element.offset(), {
        width: this.$element[0].offsetWidth,
        height: this.$element[0].offsetHeight
      });
      
      var actualHeight = $tip[0].offsetHeight;
      
      $tip.css({
        top: pos.top + pos.height / 2 - actualHeight / 2,
        left: pos.left + pos.width
      });

      $tip.stop().css({opacity: 0, display: 'block', visibility: 'visible'})
        .animate({opacity: this.opacity});
    },
    
    hide: function(fadeOut) {
      var that = this;
      if(this.hidden){
        return;
      }
      if (fadeOut) {
        this.$tip.stop().fadeOut(function() { that.hidden = true; });
      } else {
        this.$tip.hide();
        this.hidden = true;
      }
    }
  };

  function getError($ele) {
    var error = $ele.data('error');
    if (!error) {
      error = new Error($ele);
      $ele.data('error', error);
    }
    return error;
  }

  $.fn.error = function(method, options) {
    return this.each(function(){
      get( $(this), Error, 'error' )[method](options);
    });
  };
})(jQuery, ME.t10n);
(function(ME){
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
               (!keyPressed || isRemovalKey(e.which)) &&
               $t.val() === options.prompt){
              clearField();
            }
          })
          .keyup(function(e){
            if(!keyPressed && (
              !isNeutralKey(e.which) &&
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
        $p.addClass("ui-corner-all");
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
	.addClass( "ui-corner-right short" );

      input.data( "autocomplete" )._renderItem = function( ul, item ) {
	return $( "<li></li>" )
	  .data( "item.autocomplete", item )
	  .append( "<a>" + item.label + "</a>" )
	  .appendTo( ul );
      };

      this.button = $( "<button type='button'>&nbsp;</button>" )
	.attr( "tabIndex", -1 )
	.attr( "title", "Show All Items" )
	.button({
	  icons: {
	    primary: "ui-icon-triangle-1-s"
	  },
	  text: false
	})
	.addClass( "ui-corner-right ui-button-icon" )
	.click(function() {
	  if ( input.autocomplete( "widget" ).is( ":visible" ) ) {
	    input.autocomplete( "close" );
	  } else {
            if(input.data("hasPrompt")){
              input.val("");
            }
	    input.autocomplete( "search", "" );
	    input.focus();
          }
	})
	.appendTo( input.parent() );
    },

    destroy: function() {
      this.button.remove();
      $.Widget.prototype.destroy.call( this );
    }
  });
})(jQuery, ME);
(function($, _){
  var callback;

  $.fn.isValid.init();
  
  function Proxy($dialogNode, availableButtons, $textNode){
    this.dialogNode = $dialogNode;
    this.availableButtons = availableButtons;
    this.textNode = $textNode;
  }
  
  Proxy.prototype = {
    dialog: function(task, cb){
      if(cb){
        callback = cb;
      }
      this.dialogNode.dialog(task);
    },
    find: function(query){
      return this.dialogNode.find(query);
    },
    selectButtons: function(buttonNames){
      var buttons={},i=buttonNames.length;
      while(i--){
        buttons[buttonNames[i]] = this.availableButtons[buttonNames[i]];
      }
      this.dialogNode.dialog('option','buttons',buttons);
    },
    setText: function(text){
      if(this.textNode){
        this.textNode.html(text);
      }
    },
    val: function(query,value){
      this.find(query).val(value);
    }
  };

  function initDialog($dialogNode){
    var $textNode = $dialogNode.append('<p>');
    
    $dialogNode.dialog({
      autoOpen: false,
      width: 600,
      modal: true,
      close: function() {
        if(callback && callback.close){
          callback.close();
        }
      }
    });

    return new Proxy($dialogNode, {
      Ok: function(){
        if(callback && callback.submit){
          callback.submit();
        }
        $dialogNode.dialog("close");
      },
      Cancel: function(){
        if(callback && callback.cancel){
          callback.cancel();
        }
        $dialogNode.dialog("close");
      }
    }, $textNode);
  }

  function initFormDialog($dialogNode, fieldDefinitions){
    var fieldsLength = fieldDefinitions.length,
    $form = $dialogNode.append('<form>'),
    fields = initFields($form, fieldDefinitions);
    
    submit = function() {
      var args = [],i;
      for(i=0; i < fieldsLength; i++){
        args[i] = fields[i].submit().val();
      }
      if($form.isValid()){
        callback.submit.apply(this,args);
        $dialogNode.dialog("close");
      }
    };

    $dialogNode.dialog({
      autoOpen: false,
      width: 600,
      modal: true,
      close: function() {
        $form.isValid('reset');
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
      }
    });

    return new Proxy($dialogNode, {
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
  }

  function initFields($form, fieldDefinitions){
    var jQueryFunctions, fieldName, method, args, i,
    fields = [],
    fieldsLength = fieldDefinitions.length;
    
    for(i=0; i < fieldsLength; i++){
      fieldName = fieldDefinitions[i][0];
      jQueryFunctions = fieldDefinitions[i][1];
      
      $form.append(
        '<label for=\"' + fieldName + '\">'+ _(fieldName) + '</label>'
      );
      fields[i] = $('<input type=\"text\" class=\"' + fieldName + '\" name=\"' + fieldName + "\">")
        .appendTo($form);
      
      fields[i].enhanceTextfield({prompt: _(fieldName+"Prompt")});
      
      if(jQueryFunctions){
        for(method in jQueryFunctions){
          if(jQueryFunctions.hasOwnProperty(method)){
            args = jQueryFunctions[method];
            fields[i][method](args);
          }
        }
      }
    }
    return fields;
  }

  function createDialog(name, fieldDefinitions){
    var $dialogNode, proxy;

    $dialogNode = $('<div id=\"'+ name + '-dialog\" title=\"' + 
                    _(name + "Title") + '\">');

    if(fieldDefinitions){
      proxy = initFormDialog($dialogNode, fieldDefinitions);
    } else {
      proxy = initDialog($dialogNode);
    }

    return function(buttonNames, text){
      proxy.selectButtons(buttonNames);
      proxy.setText(text);
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
    ]),
    notice: createDialog('notice')
  };
})(jQuery, ME.t10n);
!function ($){
  

  var globalSettings = {},
  methods = {
    
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
    },
    prepare: function(settings) {
      return this.one('click', function(){
        $(this).markupEditor(settings);
      });
    }
  };
  
  
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

  function isValidDatatype(cssClass, changeDatamodeSelect){
    if(!ME.Editor.extractDataType(cssClass, changeDatamodeSelect)){
      ME.dialog.notice(['Ok'], ME.t10n('noticeMissingDatamode'))
        .dialog('open');
    } else {
      return true;
    }
  }
  
  
  function initEditorFromHTML(container, settings){
    if(!isValidDatatype(container[0].className)){
      return;
    }
    var editor,src,
    textarea = $("<textarea class=\"" + container[0].className + "\">");

    container.css("min-height", container.height());
    container.before(textarea); // needs to be attached to DOM in firefox

    settings = settings || {};
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
  
  
  function initEditorFromTextarea(textarea,instanceSettings){
    if(!isValidDatatype(textarea[0].className)){
      return;
    }
    var editor,settings = {};
    $.extend(settings,globalSettings,instanceSettings);
    editor = new ME.Editor(textarea, settings);

    editor.currentMode = editor.getDataMode();

    if(textarea.hasClass("wysiwyg")) {
      editor.changeMode('wysiwyg');
    } else {
      editor.currentMode.activate(editor, function(){
        editor.currentMode.afterActivation(editor);
      });
    }

    return editor;
  }

}(jQuery);

!function ($) {
  
  ME.Mode = function Mode(customFunctions){
    $.extend(this, customFunctions);
    this.prototype = Mode.prototype;
  };
  
  ME.Mode.prototype = {
    
    pressed: function(editor, keyCode){
      if(keyCode === 16){
        ME.holdShift = true;
      }
      if(ME.util.isNeutralKey(keyCode)){
        ME.holdNeutralKey = true;
      }
    },
    
    released: function(editor, keyCode){
      if(keyCode === 16){
        ME.holdShift = false;
      }
      if(ME.util.isNeutralKey(keyCode)){
        ME.holdNeutralKey = false;
      }
    },
    
    clicked: $.noop,
    
    activate: function(editor, callback) {
      if(editor.preview.is(":empty")) {
        this.updatePreview(editor, callback);
      } else {
        this.updateTextArea(editor, callback);
      }
      editor.toolbar.loadModeToolbar(editor);
    },
    
    updatePreview: function(editor, callback) {
      var html;
      if(this.toHTML){

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
    
    updateTextArea: function(editor, callback) {
      var text, dialogProxy;
      if(this.toText && (!editor.oldMode || editor.oldMode.toHTML)){

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
    
    getSelectionStates: function(editor){
      return {};
    },
    
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
    
    atBeginningOfLine: function(editor){
      var text = editor.textArea.val();
      return text[editor.selectionStart-1] === "\n";
    },
    
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
        searchLimit = selectionStart - outerLimit.length;
        boundaryPosition = Math.max(text.lastIndexOf(boundary, searchLimit), text.lastIndexOf(outerLimit, searchLimit));
        if(boundaryPosition !== -1) {
          boundaryStart = boundaryPosition + outerLimitLength;
        } else {
          boundaryStart = 0;
        }
        boundaryPosition = text.indexOf(outerLimit, selectionEnd); 
        if(boundaryPosition === -1) {
          subString = text.slice(boundaryStart);
        } else {
          subString = text.slice(boundaryStart, boundaryPosition);
        }
        boundaryPosition = 0;
        do{
          boundaryPosition = subString.indexOf(boundary, boundaryPosition + outerLimitLength);
        } while(boundaryPosition !== -1 && selectionEnd > boundaryStart + boundaryPosition);
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
    
    extendSelection: function(editor, boundary){
      var selection = this.getSelection(editor, boundary);
      editor.setSelectionRange(editor.boundaryStart, editor.boundaryEnd);
      return selection;
    },
    
    replaceSelection: function(editor, string, collapseToStart) {
      var textArea = editor.textArea,
      newSelectionStart = editor.selectionStart,
      newSelectionEnd = editor.selectionStart + string.length;
      textArea.val(textArea.val().slice(0, editor.selectionStart) + string + textArea.val().slice(editor.selectionEnd, textArea.val().length));
      if(collapseToStart === true){
        newSelectionEnd = newSelectionStart;
      } else if(collapseToStart === false){
        newSelectionStart = newSelectionEnd;
      }

      editor.setSelectionRange(newSelectionStart, newSelectionEnd);
      textArea.focus();
    },
    
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

!function ($, _){
  var toolbarItems = {},
  toolbarHTML = "",
  globalItems = [],
  availableItems = ['bold','italic','alignLeft','alignCenter','alignRight','unorderedList','orderedList','link','insertImage','save','wysiwyg','close','changeDataMode','formatBlock'];
  
  ME.ToolbarButton = function (name, clicked, isAvailable){
    this.name = name;
    this.isAvailable = isAvailable;
    if(clicked){
      this.clicked = clicked;
      globalItems.push(name);
    }
  };
  
  ME.ToolbarButton.prototype = {
    
    getButton: function() {
      return '<a href="#" class=\"'+ this.name +'\" title="' + _(this.name) + '"><span>'+ this.name +'</span></a>';
    }
  };

  
  ME.ToolbarSelect = function (name, options, clicked, isAvailable){
    ME.ToolbarButton.apply(this, [name, clicked, isAvailable]);
    this.options = options || [];
  };
  
  ME.ToolbarSelect.prototype = {
    
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

  
  ME.Toolbar = function Toolbar(editor) {
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
        if(/span/i.test(target.nodeName)) {
          target = target.parentNode;
        }
        if(target.disabled){
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
    
    loadModeToolbar: function(editor){
      var supportedItems = editor.currentMode.supportedItems,
      oldVisibleItems = this.visibleItems,
      newVisibleItems = [];
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
    
    runAction: function(editor,action,target) {
      var asynchronous,
      item = toolbarItems[action],
      mode = editor.currentMode;

      if(editor.is('wysiwyg')){
        editor.preview.focus();
      }
      asynchronous = (item[mode.id] || item).clicked(editor, target);
      
      if(!asynchronous){
        editor.checkState();
        if( !editor.is("wysiwyg")) {
          mode.updatePreview(editor);
        }
      }
    },
    
    setActive: function( actions ) {
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

!function ($, _){
  var focusedEditor,
  activeEditors = [],
  numberOfEditors = 0;

  
  ME.Editor = function Editor(textArea, settings) {
    var editor = this, timer = 0, preview = settings.preview;

    activeEditors[numberOfEditors] = editor;
    editor.id = numberOfEditors;
    numberOfEditors ++;

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
  } // Editor

  
  ME.Editor.extractDataType = function(classString, select){
    var i, cssClass,
    cssClasses = classString.split(/\s+/);

    for(i = 0; i < cssClasses.length; i += 1) {
      cssClass = cssClasses[i];

      if(cssClass !== "wysiwyg" && ME.hasMode(cssClass)) {
        return cssClass;
      }
    }
  };

  ME.Editor.prototype = {
    
    changeMode: function(modeId, silent) {
      var editor = this,
      nextMode = ME.getMode(modeId),
      oldMode = editor.currentMode;
      this.warnIfNecessary(oldMode,nextMode, function(){
        editor.beginModeChange();
        
        editor.synchronize(function(){
          editor.oldMode = oldMode;
          editor.currentMode = nextMode;
          nextMode.activate(editor, function(){
            nextMode.afterActivation(editor);
            editor.checkState();

            delete editor.oldMode;
            editor.finalizeModeChange(silent);
          });
        });
      }, silent);
    },
    
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
        if(nextMode.toText){
          text = 'noticeMissingToHTML';
        } else {
          text = 'noticeMissingToText';
        }
        dialogProxy = ME.dialog.notice(['Ok', 'Cancel'], _(text));
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
    
    finalizeModeChange: function(silent){
      this.overlay.hide();
      this.syncEditors(silent);
    },
    
    getDataMode: function() {
      return ME.getMode(this.dataType);
    },
    
    setDataType: function(classString) {
      this.dataType = ME.Editor.extractDataType(classString);
    },
    
    initSelectionProperties: function(text){
      var textArea = this.textArea,
      selectionEnd;
      
      this.scrollPosition = textArea.scrollTop;
      this.selectionStart = textArea[0].selectionStart;
      selectionEnd = textArea[0].selectionEnd;
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
    
    synchronize: function(callback) {
      if(this.is("wysiwyg")) {
        this.currentMode.updateTextArea(this, callback);
      } else {
        this.currentMode.updatePreview(this, callback);
      }
    },
    
    is: function(modeId) {
      return this.currentMode.id === modeId;
    },
    
    checkState: function () {
      this.toolbar.setActive(this.currentMode.getStates(this));
    },
    
    focus: function() {
      if(focusedEditor){
        activeEditors[focusedEditor].blur();
      }
      focusedEditor = this.id;
    },
    
    blur: function(){
      
    },
    
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
!function() {
  var $ = jQuery, textileMode;

  
  function eachParagraph(editor, functor) {
    var i,
    paragraphs = textileMode.getParagraphs(editor),
    paragraphsLength = paragraphs.length;

    for(i = 0; i < paragraphsLength; i++) {
      paragraphs[i] = functor(paragraphs[i]);
    }

    textileMode.setParagraphs(editor, paragraphs);
  }

  
  function eachLine(lines, functor){
    var linesLength = lines.length,
    i, line, lineStart, match;
    for(i = 0; i < linesLength; i++) {
      line = lines[i];
      if( !/^\s*$/.test(line)) {
        match = line.match(/^((?:\w+\. )?(?: *[\*#] )?)\s*(.*)/);
        lineStart = match[1];
        line = match[2];

        functor(i, lineStart, line);
      }
    }
  }

  
  function replaceEachLine(editor, boundary, functor){
    var lines = textileMode.extendSelection(editor, boundary).split("\n");

    eachLine(lines, function(i, lineStart, line){
      lines[i] = functor(lineStart, line);
    });
    
    textileMode.replaceSelection(editor, lines.join("\n"));
  }

  
  function firstLine(editor, boundary){
    var lines = textileMode.extendSelection(editor, boundary).split("\n").slice(0,1),
    lineLength = lines[0].length;
    editor.selectionEnd = editor.selectionStart + lineLength;
    eachLine(lines, function(i, lineStart, line){
      editor.setSelectionRange( editor.selectionStart + lineStart.length, editor.selectionEnd);
      lines[i] = line;
    });
    return lines[0];
  }

  
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

  
  function scanForMatch(editor, r){
    var text = editor.textArea.val(),
    match = r.exec(text);
    if(r.lastIndex === 0){
      return;   // TODO escalate this return to break the caller too
    }
    while(r.lastIndex < editor.selectionStart){
      match = r.exec(text);
    }
    editor.setSelectionRange(r.lastIndex - match[0].length, r.lastIndex);

    return match;
  }

  
  function toggleList(editor, target, bullet){
    replaceEachLine(editor, "\n", function(lineStart, line){
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

  
  function pressedEnter(editor){
    var list = editor.currentNodes.list, replacement;

    if(list && /(u|o)l/i.test(list.tag) && // only lists
       !textileMode.atBeginningOfLine(editor)){
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
  
  textileMode = ME.addMode('textile', {
    
    name: "Textile Mode",
    
    items: {
      "default": {
        
        clicked: function(editor, target) {
          var match, that = this;
          replaceEachLine(editor, " ", function(lineStart, line){
            if(/ on$/.test(target.className)){
              match = line.match(that.leftRegExp);
              if(match){
                line = (match[1] || "") + line.slice(match[0].length);
              } else {
                line = that.delimiter + textileMode.extendLeftSelection(editor, /[ .]+/) + line;
              }
              match = line.match(that.rightRegExp);
              if(match){
                line = line.slice(0, - match[0].length) + (match[1] || ""); 
              } else {
                line += textileMode.extendRightSelection(editor, / +/) + that.delimiter;
              }
              
            } else {
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
    
    toHTML: function(editor, callback) {
      return textileCompiler.compile(editor.textArea.val());
    },
    
    toText: function(editor, callback) {
      var html = editor.preview.html();

      
      function eachRegexp(tags, callback){
        var i, item,
        items = {
          b: [/(\s*)<(?:b|strong)>((?:.|[\r\n])*?)<\/(?:b|strong)>(\s*)/gi,'*'],
          i: [ /(\s*)<(?:i|em)>((?:.|[\r\n])*?)<\/(?:i|em)>(\s*)/gi, '_'],
          del: [ /(\s*)<(?:strike|del)>((?:.|[\r\n])*?)<\/(?:strike|del)>(\s*)/gi, '-'],
          u: [ /(\s*)<(?:u|ins)>((?:.|[\r\n])*?)<\/(?:u|ins)>(\s*)/gi, '+']
        };
        for(i = tags.length; i; i--){
          item = items[tags[i-1]];
          callback(item[0], item[1]);
        }
      }

      html = html.replace(/\s*<(ul|ol)>((.|[\r\n])*?)<\/\1>\s*/gi, function(match, tag, items){
        var bullet = tag == 'ul' ? '*' : '#';
        
        eachRegexp(['b','i', 'u', 'del'], function(regexp, delimiter){
          items = items.replace(regexp, function(match, startSpace, text, endSpace){
            startSpace = startSpace ? ' ' : '';
            endSpace = endSpace ? ' ' : '';
            return startSpace + delimiter + text + delimiter + endSpace;
          });
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
          content = content.replace(regexp, function(match, startSpace, text, endSpace){
            startSpace = startSpace ? ' ' : '';
            endSpace = endSpace ? ' ' : '';
            return startSpace + d + text.replace(/<br ?\/?>\s*/gi, d + "\n" + d) + d + endSpace;
          });
        });
        
        return front + content.replace(/<br ?\/?>\s*/gi, "\n") + "\n\n";
      });
      
      html = html.replace(/\s*<img[^>]*>\s*/gi, function(match){
        var img = $(match),
        replacement = img.attr('src'),
        title = img.attr('title');

        if(title && !/^\s*$/.test(title)){
          replacement = replacement + "(" + title + ")";
        }
        return "!" + replacement + "!";
      });
      html = html.replace(/(\s*)<a href="([^\"]*)">((?:.|[\r\n])*?)<\/a>(\s*)/gi, function(match, startSpace, uri, content, endSpace){
        var out = startSpace ? ' ' : '';

        if(/^\s*![^!]+!\s*$/.test(content)){
          out += $.trim(content) + ":";
        } else {
          out += "\"" + content + "\":";
        }
        out += uri;
        if(endSpace){
          out += ' ';
        }
        return out;
      });
      html = html.replace(/\s*<code[^>]*>((.|[\r\n])*?)<\/code>\s*/gi, ' @$1@ ');
      html = html.replace(/(\r\n|\n){3,}/g, "\n\n");
      html = html.replace(/&nbsp;/g, ' ');
      html = html.replace(/^[\r\n]+|[\r\n]+$/g, '');

      return html;
    },
    
    getSelectionStates: function(editor) {
      var paragraphs = this.getSelection(editor, "\n\n"),
      startTrace = editor.selectionStart - editor.boundaryStart,
      endTrace = editor.selectionEnd - editor.boundaryStart,
      trace = textileCompiler.trace(paragraphs, startTrace, endTrace);
      
      return this.buildStateObject(trace, editor.currentNodes = {});
    },
    
    getParagraphs: function(editor) {
      return this.getSelection(editor, "\n\n").split(/\n\n+/);
    },
    
    setParagraphs: function(editor, paragraphs) {
      var text = editor.textArea.val();
      paragraphs = paragraphs.join("\n\n");

      if(editor.boundaryStart === -1) {
        editor.textArea.val(text.slice(0,editor.boundaryStart) + paragraphs);
      } else {
        editor.textArea.val(text.slice(0,editor.boundaryStart) + paragraphs + text.slice(editor.boundaryEnd));
      }
      
      this.moveCaret(editor, paragraphs.length - editor.boundaryDistance);
    },
    
    moveCaret: function(editor, distance) {
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
    
    pressed: function(editor, keyCode){
      switch(keyCode){
      case 13: // enter
        return pressedEnter(editor, this);
      default: // handle keyCombos
        this.prototype.pressed.apply(this, [editor, keyCode]);
      }
    }
  });
}();
!function (){
  
  
  
  var builder = (function (){
    var stack, tracingStack, stackPosition, traceJustStarted, traceJustEnded, popping, pointer, sP, eP, tracing, lastTrace, unsuccessfulPush = false, stringLength,
    ignoredTags = ['li'],
    definableAttributes = {
      img: ['title','src'],
      a: ['href']
    },
    delimiters = {
      i: "_",
      b: "*"
    };

    
    function iterateOverAttributes(tag, callback){
      var attributes = ['class'],i;
      if(definableAttributes[tag]){
        attributes = attributes.concat(definableAttributes[tag]);
      }
      for(i = attributes.length;i--;){
        callback(attributes[i]);
      }
    }
    
    
    function canMoveStackDown(targetNode){
      var equalTag = true, key, equalAttributes = true, blockTag = (stackPosition == -1), stackNode, i, l;
      if(blockTag){
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
        if(stackNode.attributes){
          iterateOverAttributes(stackNode.tag,function(key){
            if(stackNode.attributes[key] !== targetNode.attributes[key]){
              equalAttributes = false;
              delete stackNode.attributes[key];
            }
          });
        }
        
      }
      return stackNode && (blockTag || equalAttributes);
    }

    
    function TraceNode(node){
      this.tag = node.tag;
      this.attributes = node.attributes;
    }

    
    function htmlOpenTag(node){
      var attributeString = "";
      for(attr in node.attributes){
        if(node.attributes.hasOwnProperty(attr)){
          attributeString += " " + attr + "=\"" + node.attributes[attr] + "\"";
        }
      }
      return "<" + node.tag + attributeString + ">";
    }

    
    function getStackPositionOf(tag){
      var i;
      for(i = stack.length;i--; ){
        if(stack[i].tag === tag){
          return i;
        }
      }
    }

    
    function startTrace(){
      var length = stack.length, i, numberOfIgnoredTags = 0;
      tracing = true;
      traceJustStarted = true;
      for(i=1;i<length;i++){
        if(ignoredTags.indexOf(stack[i].tag) == -1){
          tracingStack[i-1 - numberOfIgnoredTags] = new TraceNode(stack[i]);
        } else {
          numberOfIgnoredTags += 1;
        }
      }
      stackPosition = tracingStack.length -1;
    }
    
    
    function endTrace(){
      lastTrace = false;
      tracing = false;
    }

    
    return {
      
      init: function(){
        stack = [{content:""}];
      },
      
      initTrace: function(startPosition, endPosition, lengthOfString){
        tracingStack = [];
        tracing = undefined;
        pointer = 0;
        sP = startPosition;
        eP = endPosition;
        stringLength = lengthOfString;
      },
      
      finalizeTrace: function(){
        if(tracing){
          endTrace();
        }
        if(!tracingStack[0]){
          tracingStack[0] = {tag: 'p'};
        }
      },
      
      advancePointer: function(advanceAmount, forceEndTrace){
        pointer += advanceAmount;
        if(tracing === undefined && (pointer > sP || pointer == stringLength)){
          startTrace();
        }
        if(tracing && pointer > eP){
          if(lastTrace || forceEndTrace){
            endTrace();
          } else {
            lastTrace = true;
          }
        }
      },
      
      pushTag: function(tag, attributes){
        var node = {tag: tag,
                    attributes: attributes || {},
                    content: ""};
        stack.push(node);
        if(tracing && ignoredTags.indexOf(tag) == -1){
          if(traceJustStarted){
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
        }
      },
      
      pushTagUnlessOpen: function(tag){
        if(this.isOpen(tag)){
          this.pushString(delimiters[tag]);
        } else {
          this.pushTag(tag);
        }
      },
      
      closeTag: function(tag){
        var removedNode, i;
        if(tag){
          i = getStackPositionOf(tag);
          removedNode = stack.splice(i,1)[0];
        } else {
          removedNode = stack.pop();
        }
        if(tracing && ignoredTags.indexOf(tag) == -1){
          traceJustStarted = false;
          if(unsuccessfulPush){
            tracingStack = tracingStack.slice(0,stackPosition+1);
            unsuccessfulPush = false;
          }
          if(tracingStack[stackPosition].tag === removedNode.tag){
            stackPosition -= 1;
          }
          popping = true;
        }
        this.pushString(htmlOpenTag(removedNode) + removedNode.content, stack[i-1]);
        this.pushString("</"+removedNode.tag+">"); 
        popping = false;
      },
      
      closeTagIfOpen: function (tag, before, after) {
        before = before || "";
        after = after || "";
        if(this.isOpen(tag)){
          this.pushString(before);
          this.closeTag(tag);
          this.pushString(after);
        } else {
          this.pushString(before + delimiters[tag] + after);
        }
      },
      
      popLineEnd: function(){
        var surpressLineBreak = false, partialMarkup = {b: "*", i: "_"}, node;
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
      
      popParagraphEnd: function(){
        while(stack.length > 1){
          this.closeTag();
        }
      },
      
      pushString: function(string, node){
        if(!node){
          node = stack[stack.length - 1];
        }
        node.content += string;
        if(!/^([ ]+|<br\/>)?$/.test(string)){ // Ignore whitespace
          if(traceJustStarted){
            traceJustStarted = false;
          }
          if(tracing && !popping && tracingStack[stackPosition+1]){
            tracingStack = tracingStack.slice(0,stackPosition + 1);
          }
        }
      },
      
      isOpen: function(tag){
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
      
      getTrace: function(){
        return tracingStack;
      },
      
      toHtml: function(){
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
    match = advance(/^ */);
    builder.pushString(match[0]);
    parseLine();
  }

  function parseLine(){
    var match, surpressLineBreak;
    while(true){
      if(match = advance(/^_(?=[^ \n]+)/)){
        builder.pushTagUnlessOpen("i");
      }
      else if(match = advance(/^\*(?=[^ \n]+)/)){
        builder.pushTagUnlessOpen("b");
      }
      else if(match = advance(/^([^ \n"\*]+)_([\*]*)( +|(?=\n|$))/)){
        builder.closeTagIfOpen("i", match[1]);
        if(match[2]){
          builder.closeTagIfOpen('b');
        }
        builder.pushString(match[3]);
      }
      else if(match = advance(/^([^ \n"_]+)\*([_]*)( +|(?=\n|$))/)){
        builder.closeTagIfOpen("b", match[1]);
        if(match[2]){
          builder.closeTagIfOpen('i');
        }
        builder.pushString(match[3]);
      }
      else if(match = advance(/^( *)"([^"]*)":([^ \n]+)/)) {
        builder.pushString(match[1]);
        builder.pushTag("a", {href: match[3]});
        builder.pushString(match[2]);
        builder.closeTag();
      }
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
      else if(match = advance(/^([^ \n]+)/)){
        builder.pushString(match[1]);
      }
      else if(match = advance(/^( +)/)){
        builder.pushString(match[1]);
      }
      else {
        advance(/^\n/);
        surpressLineBreak = builder.popLineEnd();
        
        if(surpressLineBreak){
          if((builder.isOpen('ul') && !next(/^ *\*+/)) ||
             (builder.isOpen('ol') && !next(/^ *#+/))){
            builder.closeTag();
          }
        } else if(next(/^ *(\||[\*#] )/)){
          builder.closeTag();
        } else if(!next(/^ *(\n|$|[\*#] )/)){
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
}();
!function() {
  var wysiwygMode,
  $ = jQuery,
  selection = getSelection(), range = document.createRange();

  function startNode(){
    return jQuery(selection.getRangeAt(0).startContainer);
  }
  
  function endNode(){
    return jQuery(selection.getRangeAt(0).endContainer);
  }

  function replaceEachParagraph(editor, functor){
    var paragraph, children, i, l,
    newParagraphs = $(),
    contents = wysiwygMode.getSelection(editor);

    if(!/h\d|p|(o|u)l/i.test(contents.childNodes[0].nodeName)){
      contents = contents.firstChild;
    }
    children = contents.childNodes;
    l = children.length;

    for(i = 0; i < l ; i++){
      newParagraphs = newParagraphs.add(functor(children[i]));
    }
    wysiwygMode.replaceSelection(editor, newParagraphs);
  }

  function align(editor, direction) {
    replaceEachParagraph(editor, function(paragraph){
      return $(paragraph).removeClass("left")
        .removeClass("right").removeClass("center")
        .addClass(direction);
    });
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

  
  function disableList(editor){
    contents = wysiwygMode.getSelection(editor, 'li');

    lines = [];
    addListItems(lines, contents.firstChild);
    $p = $("<p>").html(lines.join("<br>"));

    wysiwygMode.replaceSelection(editor, $p);
  }

  
  function Border(node, borderType, nextProperty){
    this.nextProperty = nextProperty;

    if(node.is('.preview')){ // select all (even selection of all
      if(nextProperty === 'nextSibling'){
        node = $(node[0].lastChild);
      } else {
        node = $(node[0].firstChild);
      }
    }
    
    this.ancestors = node.parentsUntil(".preview");
    this.block = this.ancestors[this.ancestors.length - 1] || node[0];
    
    var depth = borderType ? 2 : 1;
    this.borderNode = this.ancestors[this.ancestors.length -depth] || node[0];
    
    while(this.borderNode){
      this.node = this.borderNode;
      if(this.borderNode.nodeName.toLowerCase() === borderType){
        break;
      } else if (/preview/.test(this.node.parentNode.className)){
        this.borderNode = null;
        break;
      }
      this.borderNode = this.borderNode[nextProperty];
    }
    
    this.safeBlock = this.borderNode ? this.block : this.block[nextProperty];
  }

  
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

  
  function joinAdjacentList(border, list){
    var children;
    if(border.safeBlock && border.safeBlock.nodeName === list[0].nodeName){
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


  
  function checkCaret(adjustment){
    var node, text,
    range = selection.getRangeAt(0),
    rangeIsCollapsed = range.collapsed;

    function checkSibling(property, collapse){
      while(!node[property]){
        node = node.parentNode;
      }
      node = node[property];
      if(node && !/br|h\d|p/i.test(node.nodeName)){
        if(rangeIsCollapsed){
          selectNodes([node], collapse);
        } else { // Fix a Firefox bug: double click on a bold word
          if(collapse){
            range.setStartBefore(node.firstChild);
          }
          selection.removeAllRanges();
          selection.addRange(range);
        }
        return false;
      }
    }

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

  
  function pressedEnter(editor, preview){
    if(checkIfDeletedAll(preview,13) === false){
      return false;
    }
    var node, range, endContainer, insertNewParagraph, listItem,
    lastSibling = true,
    block = editor.currentNodes.block,
    list = editor.currentNodes.list,
    isHeading = /h[1-5]/i.test((list || block).nodeName);

    if(!(isHeading || list)){
      return;
    }
    
    range = selection.getRangeAt(0);
    node = endContainer = range.endContainer;
    while(node.parentNode !== preview[0]){
      if(/li/i.test(node.nodeName)){
        listItem = node;
      }
      if(node.nextSibling){
        lastSibling = false;
        break;
      }
      node = node.parentNode;
    }

    if(!lastSibling){
      if(listItem && !$(listItem).text()){
        disableList(editor);
        return false;
      }
    } else if(isHeading && /* only headings */
       range.endOffset === endContainer.textContent.length){
        insertNewParagraph = true;
      }
    else if (list && !$(listItem).text()){
      $(listItem).remove();
      insertNewParagraph = true;
    }
    if(insertNewParagraph){
      node = $("<p>").insertAfter(list || block);
      selectNodes(node);
      return false;
    }
    var atEndOfList = false;
    if(list && atEndOfList){ // prevent addition of br in current node
      listItem = $(listItem) || $(node).parent('li');
      selectNodes(listItem.after('<li>').next(), true);
      return false;
    }
  }

  
  function clearNodeEnd(node){
    var child = node.lastChild;

    while(child && (/br/i.test(child.nodeName) ||
                    (child.nodeType === 3 && /^ *$/.test(child.textContent)))){
      node.removeChild(child);
      child = node.lastChild;
    }
  }

  
  function pressedBackspace(editor, preview){
    if(checkIfDeletedAll(preview,8) === false){
      return false;
    }
    var children, parent, listItem, atBeginningOfLI, atBeginningOfLineInLI, prevIsList, nextIsList,
    inFirstSibling = true,
    block = editor.currentNodes.block,
    list = editor.currentNodes.list,
    prev = (list || block).previousSibling,
    next = (list || block).nextSibling,
    range = selection.getRangeAt(0),
    node = range.startContainer;

    if(!range.collapsed || !prev || range.startOffset !== 0){
      return true;
    }
    while(node.parentNode !== preview[0]){
      if(node.previousSibling){
        inFirstSibling = false;
        if(/li/i.test(node.nodeName)){
          atBeginningOfLI = true;
        } else if(list && /br/i.test(node.previousSibling.nodeName)){
          atBeginningOfLineInLI = true;
        } else{
          return true;
        }
        break;
      }
      node = node.parentNode;
    }

    prevIsList = /(u|o)l/i.test(prev.nodeName);
    nextIsList = /(u|o)l/i.test(next.nodeName);

    if(inFirstSibling){
      if(list){
        node = node.firstChild;
      }
      if(prevIsList){
        prev = prev.lastChild;
      }
      node = $(node);
      children = node.contents();

      $(prev).append(children);
      node.remove();
      selectNodes([children[0]], true);
      if(prevIsList && nextIsList){
        $(prev).parent().append($(next).detach().contents());
      }
    } else if(atBeginningOfLineInLI){ // disable List
      node.parentNode.removeChild(node.previousSibling);
      
      node = $(node);
      children = node.nextAll();
      parent = node.parent('li');
      
      listItem = $('<li>').append(node, children);
      parent.after(listItem);
      selectNodes(listItem, true);
      
      disableList(editor);
    } else if(atBeginningOfLI){ // append contents to the previous
      listItem = node.previousSibling;
      children = $(node).detach().contents();
      clearNodeEnd(listItem);

      if(!children[0] || /br/i.test(children[0].nodeName)){
        children[0] = document.createTextNode('\xa0') ;
      }
      $(listItem).append('<br>', children);

      if(children[0]){
        selectNodes(children, true);
      } else {
        selectNodes([listItem], false);
      }
    }

    return false;
  }

  
  function pressedDelete(editor, preview){
    if(checkIfDeletedAll(preview,46) === false){
      return false;
    }
    if(!$.browser.webkit){
      return true;
    }
    var children, nextIsList,
    block = editor.currentNodes.block,
    list = editor.currentNodes.list,
    next = (list || block).nextSibling,
    range = selection.getRangeAt(0),
    node = range.startContainer;

    if(!range.collapsed || !next || range.startOffset !== node.length){
      return true;
    }
    while(node.parentNode !== preview[0]){
      if(node.nextSibling){
        return true;
      }
      node = node.parentNode;
    }

    nextIsList = /(u|o)l/i.test(next.nodeName);

    if(!(nextIsList && list)){
      if(list){
        node = node.lastChild;
      }
      if(nextIsList){
        next = next.firstChild;
      }
    }
    
    next = $(next);
    children = next.contents();

    $(node).append(children);
    next.remove();

    return false;
  }

  
  function checkIfDeletedAll(preview, keyCode, holdNeutralKey){
    var range = selection.getRangeAt(0);
    if(!$.browser.mozilla || holdNeutralKey || range.collapsed || ME.util.isNeutralKey(keyCode)){
      return true;
    }
    var node, content;
    content = range.extractContents();
    if(preview.is(":empty") || /^ *$/.test(preview.text())){
      node = document.createElement(content.childNodes[0].nodeName);
      preview.html(node);
      selectNodes([node]);
      if(!/^8|13|46$/.test("" + keyCode)){
        return true;
      } else {
        return false;
      }
    }
  }

  function extendRangeToSpaces(){
    var text, changedRange,
    range = selection.getRangeAt(0),
    startNode = range.startContainer,
    startOffset = range.startOffset,
    endNode = range.endContainer,
    endOffset = range.endOffset;

    if(startNode.nodeType == 3){ // Its a textnode
      changedRange = true;
      text = startNode.nodeValue;
      range.setStart(startNode, text.lastIndexOf(' ', startOffset) + 1);
    }

    if(endNode.nodeType == 3){ // Its a textnode
      changedRange = true;
      text = endNode.nodeValue;
      
      endOffset = text.indexOf(' ', endOffset -1); // -1, otherwise it
      if(endOffset === -1){
        endOffset = text.length;
      }
      range.setEnd(endNode, endOffset);
    }

    if(changedRange){
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  
  wysiwygMode = ME.addMode('wysiwyg', {
    
    name: "Preview Mode",
    
    items: {
      "default": {
        clicked: function(editor, target) {
          extendRangeToSpaces();
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
        clicked: function(editor){
          align(editor, 'left');
        }
      },
      alignRight: {
        clicked: function(editor){
          align(editor, 'right');
        }
      },
      alignCenter: {
        clicked: function(editor){
          align(editor, 'center');
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
          extendRangeToSpaces();
          var dialog, linkNode, titleString,
          range = selection.getRangeAt(0),
          callback = {
            remove: function(){
              var text = linkNode.text();
              linkNode.replaceWith(text);
            },
            close: function(){
              editor.preview.focus();
              editor.checkState();
            }
          };
          
          if(/ on$/.test(target.className)){
            linkNode = $(editor.currentNodes.a);
            dialog = ME.dialog.link(['Update','Remove','Cancel']);
            
            callback.submit = function(title,uri){
              linkNode.attr('href',uri).text(title);
              range.selectNodeContents(linkNode[0]);
              selection.removeAllRanges();
              selection.addRange(range);
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
              editor.preview.focus();
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
          replaceEachParagraph(editor, function(paragraph){
            if(!/(u|o)l/i.test(paragraph.nodeName)){ // ignore lists
              paragraph = $('<' + target.value + '>')
                .addClass(paragraph.className).append(paragraph.childNodes);
            }
            return paragraph;
          });

        }
      }
    },
    
    getSelection: function(editor, nodeType){
      var range = selection.getRangeAt(0),
      start = startNode(),
      end = endNode();

      editor.collapsed = range.collapsed;
      if(start.is('.preview')){
        start = $(start[0].firstChild);
      }
      if(end.is('.preview')){
        if(editor.collapsed){
          end = start;
        } else {
          end = $(end[0].lastChild);
        }
      }
      
      editor.leftBorder = new Border(start, nodeType, 'previousSibling');
      editor.rightBorder = new Border(end, nodeType, 'nextSibling');

      range.setStartBefore(editor.leftBorder.node);
      range.setEndAfter(editor.rightBorder.node);
      if(editor.rightBorder.borderNode){
        $(editor.rightBorder.borderNode).nextAll()
          .appendTo('<' + editor.rightBorder.block.nodeName + '>').parent()
          .insertAfter(editor.rightBorder.block);
      }

     return range.extractContents();
    },
    
    replaceSelection: function(editor, nodes){
      if(editor.leftBorder.safeBlock){
        nodes.insertAfter(editor.leftBorder.safeBlock);
      } else {
        editor.preview.prepend(nodes);
      }
      
      if(editor.collapsed){
        selectNodes(nodes, true);
      } else {
        selectNodes(nodes);
      }
      if(/^\s*$/.test(editor.leftBorder.block.textContent)){
        $(editor.leftBorder.block).remove();
      }
      if(/^\s*$/.test(editor.rightBorder.block.textContent)){
        $(editor.rightBorder.block).remove();
      }
    },
    
    afterActivation: function(editor) {
      editor.textArea.parent().hide();
      editor.preview.attr("contentEditable",true);
      if ($.browser.mozilla) {
        document.execCommand("styleWithCSS",null, false);
      }
    },
    
    getSelectionStates: function(editor) {
      if(!$(document.activeElement).is(".preview")){
        return {};
      }

      checkCaret(0);

      function getParents(node, content){
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
      contents = selection.getRangeAt(0).cloneContents();

      startNodes = getParents(startNode(), contents.firstChild);
      endNodes = getParents(endNode(), contents.lastChild);

      if(/(u|o)l/i.test(startNodes[0].nodeName) && startNodes[0].nodeName !== endNodes[0].nodeName){
        nodes = startNodes.toArray();
        nodes[0] = $('<p>')[0];
      } else {
        nodes = startNodes;
      }
      return this.buildStateObject(nodes, editor.currentNodes = {});
    },
    
    clicked: function(){
      checkCaret(0);
    },
    
    pressed: function(editor, keyCode){
      this.prototype.pressed.apply(this, [editor, keyCode]);
      switch(keyCode){
      case 13: // enter
        return pressedEnter(editor, editor.preview);
      case 8: // Backspace
        return pressedBackspace(editor, editor.preview);
      case 46: // Delete
        return pressedDelete(editor, editor.preview);
      case 37: // left arrow
        return checkCaret(-1);
      case 39: // right arrow
        return checkCaret(1);
      default:
        return checkIfDeletedAll(editor.preview, keyCode, ME.holdNeutralKey);
      }
    },
    
    toText: function(editor, callback) {
      return editor.getDataMode().toText(editor, callback);
    },
    
    toHTML: function(editor) {
      return editor.preview.html();
    }
  });
}();
ME.addMode('haml', function(){
  var $ = jQuery;
  return {
    name: "Haml Mode",
    toHTML: function(editor, callback) {
      $.get('/api/markup/to_html', {
        type: 'haml',
        content: editor.textArea.val()
      }, function(html, status, response){
        editor.preview.html(html);
        if(callback){
          callback();
        }
      });
    },
    toText: function(editor, callback) {
      $.get('/api/markup/from_html', {
        type: 'haml',
        content: editor.preview.html()
      }, function(haml, status, response){
        editor.textArea.val(haml);
        if(callback){
          callback();
        }
      });
    }
  };
}());
