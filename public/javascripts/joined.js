ME = function ($) {

  var globalSettings = {}, availableModes = {}, toolbarItems = {};

  function Mode(customFunctions){
    $.extend(this, customFunctions);
  }
  Mode.prototype = {
    load: function(editor) {
      this.editor = editor;
      this.htmlDiv = editor.htmlDiv;
      this.textArea = editor.textArea;

      console.log("loaded Mode " + this.name);
    },
    getStates: $.noop,
    activate: function() {
      if(this.htmlDiv.is(":empty")) {
        this.updatePreview();
      } else {
        this.updateTextArea();
      }
      this.afterActivation();
    },
    updatePreview: function() {
      console.log("updating preview in Mode " + this.name);
      this.htmlDiv.html(this.toHTML());
    },
    updateTextArea: function() {
      console.log("updating TA in Mode " + this.name);
      this.textArea.val(this.toText());
    },
    afterActivation: function() {
      this.textArea.show();
      this.htmlDiv.attr("contentEditable",false);
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

  function ToolbarButton(name){
    this.name = name;
  }
  ToolbarButton.prototype = {
    getButton: function() {
      return '<a href="#" class=\"'+ this.name +'" ><span>'+ this.name +'</span></a>';
    }
  };

  function ToolbarSelect(name, options){
    this.name = name;
    this.options = options || [];
  }
  ToolbarSelect.prototype = {
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
    
    toolbarDiv.mouseup(function(e) { // buttons
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
    }).change(function(e) { // select lists
      var target = e.target;
      that.runAction(target.className, target);
      return false;
    });

    editor.container.prepend(toolbarDiv);
  } // end initToolbar

  Toolbar.prototype = {
    getDivSelection: function() {
      this.htmlDiv.focus();

      // gecko & webkit
      theSelection = window.getSelection();
      theRange = theSelection.getRangeAt(0);
      return theRange.toString();
    },
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
    replaceTextAreaSelection: function(string) {
      var textArea = this.textArea,
      position = this.selectionStart;
      // gecko & webkit
      textArea.val(textArea.val().slice(0, this.selectionStart) + string + textArea.val().slice(this.selectionEnd, textArea.val().length));

      // move caret gecko
      textArea[0].setSelectionRange(position, position + string.length);
      textArea.focus();
    },
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
    extendLeftSelection: function(regexp){
      var match, substring = this.textArea.val().slice(0,this.selectionStart);
      regexp = new RegExp(regexp.source + "$");
      match = regexp.exec(substring);
      
      if(match){
        this.selectionStart -= match[0].length;
        return match[0];
      }
    },
    replaceDivSelection: function(string) {
    },
    getSelection: function(extendSelectionToWordBoundaries) {
      if(this.editor.is("wysiwyg")) {
        return this.getDivSelection(extendSelectionToWordBoundaries);
      }else {
        return this.getTextAreaSelection(extendSelectionToWordBoundaries);
      }
    },
    replaceSelection: function(string) {
      if (this.editor.is("wysiwyg")) {
        this.replaceDivSelection(string);
      } else {
        this.replaceTextAreaSelection(string);
      }
    },
    runAction: function(action,target) {
      toolbarItems[action][this.editor.currentMode.id].clicked(this,target);
      // Update Preview in case something has changed
      if(action != "changeMode" && !this.editor.is("wysiwyg")) {
        this.editor.currentMode.updatePreview();
      }
    },
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
ME.addMode("textile", function() {
  var text, selectionStart, startOfParagraphs, endOfParagraphs, oldExtendedSelectionLength, currentNodes = {},
  $ = jQuery;

  function eachParagraph(toolbar, functor) {
    var mode = toolbar.editor.currentMode, paragraphs = mode.getParagraphs(), paragraphsLength = paragraphs.length;

    for(i = 0; i < paragraphsLength; i++) {
      paragraphs[i] = functor(paragraphs[i]);
    }
    mode.setParagraphs(paragraphs);
  }

  function align(toolbar, orientation) {
    eachParagraph(toolbar, function(paragraph) {
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

  function scanForMatch(toolbar,r){
    match = r.exec(text);
    if(r.lastIndex === 0){
      return;   // TODO escalate this return to break the caller too
    }
    while(r.lastIndex < selectionStart){
      match = r.exec(text);
    }

    // needed for the replaceSelection call
    toolbar.selectionStart = r.lastIndex - match[0].length;
    toolbar.selectionEnd = r.lastIndex;
    return match;
  }

  regexpes = {
    "*": /^(\w+\. )?\s*\*(.*)\*/
  };
  return {
    name: "Textile Mode",
    buttons: {
      "default": {
        clicked: function(toolbar, target) {
          // TODO find left and right boundaries that are valid
          var lines = toolbar.getSelection(true).split("\n"),
          linesLength = lines.length,
          i, regexp, currentLine;
          for(i = 0; i < linesLength; i++) {
            currentLine = lines[i];

            // Skip blank lines
            if( !/^\s*$/.test(currentLine)) {
              if(/ on$/.test(target.className)){
                
                // first handle the left part
                match = currentLine.match(/^(\w+\. )?\s*\*/);
                if(match){
                  currentLine = (match[1] || "") + currentLine.slice(match[0].length);
                } else {
                  // place delimiter left and extend selection
                  currentLine = "*" + toolbar.extendLeftSelection(/[ .]+/) + currentLine;
                }

                // Then handle the right
                match = currentLine.match(/\*([\.]*)$/);
                if(match){
                  currentLine = currentLine.slice(0, - match[0].length) + (match[1] || ""); 
                } else {
                  currentLine += toolbar.extendRightSelection(/ +/) + "*";
                }
                
              } else {
                // TODO remove conflicting markup
                // lines[i] = lines[i].replace(/_([a-z](\w*[a-z])?)_/gi,"$1");
                // Apply markup within a block, e.g. "*h1. ...*" is
                // never produced
                currentLine = $.trim(currentLine.replace(/^(\w+\. )?\s*(.*)/,"$1" + this.delimiter + "$2")) + this.delimiter;
              }
              lines[i] = currentLine;
            }
          }
          toolbar.replaceSelection(lines.join("\n"));
        }
      },
      bold: {
        delimiter: "*"
      },
      italic: {
        delimiter: "_"
      },
      alignLeft: {
        clicked: function(toolbar) {
          align(toolbar, "left");
        }
      },
      alignRight: {
        clicked: function(toolbar) {
          align(toolbar, "right");
        }
      },
      alignCenter: {
        clicked: function(toolbar) {
          align(toolbar, "center");
        }
      },
      link: {
        clicked: function(toolbar, target) {
          var dialog, callback, titleString, href, r, match;
          
          callback = {
            submit: function(title,uri){
              toolbar.replaceSelection("\"" + title + "\":" + uri);
            },
            remove: function(){
              toolbar.replaceSelection(match[1]);
            },
            close: function(){
              toolbar.editor.currentMode.updatePreview();
              toolbar.editor.checkState();
            }
          };

          if(/ on$/.test(target.className)){
            dialog = ME.dialog.link(['Update','Remove','Cancel']);
            href = currentNodes.a.attributes.href;

            match = scanForMatch(toolbar,new RegExp('\"([^\"]*)\":'+href,'g'));

            titleString = match[1];
            dialog.val('input.uri', href);
          }
          else {
            dialog = ME.dialog.link(['Ok','Cancel']);
            titleString = toolbar.getSelection();
          }
          
          if(!/^\s*$/.test(titleString)){
            dialog.val('.title', titleString);
          }
          
          dialog.dialog('open', callback);
        }
      },
      insertImage: {
        clicked: function(toolbar, target) {
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

              toolbar.replaceSelection(replacement);
            },
            remove: function(){
              toolbar.replaceSelection("");
            },
            close: function(){
              toolbar.editor.currentMode.updatePreview();
              toolbar.editor.checkState();
            }
          };
          
          if(/ on$/.test(target.className)){
            dialog = ME.dialog.insertImage(['Update','Remove','Cancel']);
            src = currentNodes.img.attributes.src;

            scanForMatch(toolbar, new RegExp('!' + src + "(\\([^\\)]*\\))?!(:[^ \n]*)?",'g'));
            
            if(currentNodes.a){
              href = currentNodes.a.attributes.href;
            }
            dialog.val('input.uri', href);
            dialog.val('input.imageUri', src);
            dialog.val('input.title', currentNodes.img.attributes.title);
          }
          else {
            dialog = ME.dialog.insertImage(['Ok','Cancel']);
            toolbar.getSelection();
          }

          dialog.dialog('open', callback);
        }
      }
    },
    selects: {
      formatBlock: {
        clicked: function(toolbar, target) {
          eachParagraph(toolbar, function(paragraph) {
            if(/^\w+(\([\w ]+\))?\./.test(paragraph)) {
              return paragraph.replace(/^\w+(\([\w ]+\))?\.\s+/, target.value + "$1. ");
            } else {
              return target.value + ". " + paragraph;
            }
          });
        }
      }
    },
    updatePreview: function() {
      var html = textileCompiler.compile(this.textArea.val());
      this.htmlDiv.html(html);
    },
    toText: function(html) {
      if(!html){
        html = this.htmlDiv.html();
      }

      html = html.replace(/\s*<(h[1-4])>((.|[\r\n])*?)<\/\1>\s*/gi, "\n\n$1. $2\n\n");
      html = html.replace(/\s*<(p)>((.|[\r\n])*?)<\/\1>\s*/gi, "\n\n$2\n\n");
      html = html.replace(/\s*<(p|h[1-4]).*class=\"([^\"]+)\">((.|[\r\n])*?)<\/\1>\s*/gi, "\n\n$1($2). $3\n\n");
      html = html.replace(/<br ?\/?>\s*/gi, "\n");
      html = html.replace(/<(?:b|strong)>((.|[\r\n])*?)<\/(?:b|strong)>/gi, '*$1*');
      html = html.replace(/<(?:i|em)>((.|[\r\n])*?)<\/(?:i|em)>/gi, '_$1_');
      html = html.replace(/<(?:strike|del)>((.|[\r\n])*?)<\/(?:strike|del)>/gi, '-$1-');
      html = html.replace(/<(?:u|ins)>((.|[\r\n])*?)<\/(?:u|ins)>/gi, '+$1+');
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
      html = html.replace(/^[\r\n]+|[\r\n]+$/g, '');

      return html;
    },
    getStates: function() {
      var paragraphs = this.getExtendedSelection(),
      startTrace = selectionStart - startOfParagraphs,
      endTrace = selectionEnd - startOfParagraphs;
      trace = textileCompiler.trace(paragraphs, startTrace, endTrace);

      return this.buildStateObject(trace, currentNodes = {});
    },
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
    getParagraphs: function() {
      return this.getExtendedSelection().split(/\n\n+/);
    },
    setParagraphs: function(paragraphs) {
      paragraphs = paragraphs.join("\n\n");

      if(endOfParagraphs === -1) {
        this.textArea.val(text.slice(0,startOfParagraphs) + paragraphs);
      } else {
        this.textArea.val(text.slice(0,startOfParagraphs) + paragraphs + text.slice(endOfParagraphs));
      }
      
      this.moveCaret(paragraphs.length - oldExtendedSelectionLength);
    },
    moveCaret: function(offset) {
      console.log("Moving caret: " + offset);

      if(Math.abs(selectionStart - startOfParagraphs) > Math.abs(offset)) {
        selectionStart += offset;
      } else {
        selectionStart = startOfParagraphs;
      }
      
      this.textArea.focus();
      this.textArea[0].setSelectionRange(selectionStart, selectionStart);
    }
  };
});
textileCompiler = (function (){
  var builder = (function (){
    var stack, tracingStack, stackPosition, traceJustStarted, traceJustEnded, popping, pointer, sP, eP, tracing, lastTrace, unsuccessfulPush = false;
    definableAttributes = {
      img: ['title','src'],
      a: ['href']
    };

    function iterateOverAttributes(tag, callBack){
      var attributes = ['class'],i;
      if(definableAttributes[tag]){
        attributes = attributes.concat(definableAttributes[tag]);
      }
      for(i = attributes.length;i--;){
        callBack(attributes[i]);
      }
    }
    
    function moveStackUp(targetNode){
      var equalTag = true, key, equalAttributes = true, blockTag = (stackPosition == -1), stackNode, i, l;
      if(blockTag){
        stackNode = tracingStack[0];
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

    function traceNode(node){
      return {tag: node.tag,
              attributes: node.attributes};
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
      var length = stack.length, i;
      // console.log("################################## startTrace");
      tracing = true;
      traceJustStarted = true;
      for(i=1;i<length;i++){
        tracingStack[i-1] = traceNode(stack[i]);
      }
      // console.log(tracingStack.length);
      stackPosition = tracingStack.length -1;
    }
    
    function endTrace(){
      // console.log("#################################### endTrace");
      // console.log(tracingStack.length);
      lastTrace = false;
      tracing = false;
    }

    return {
      init: function(){
        stack = [{content:""}];
      },
      initTrace: function(startPosition, endPosition){
        tracingStack = [];
        tracing = undefined;
        pointer = 0;
        sP = startPosition;
        eP = endPosition;
      },
      finalizeTrace: function(){
        if(tracing){
          endTrace();
        }
      },
      advancePointer: function(advanceAmount){
        pointer += advanceAmount;
        // console.log("pointer",pointer,"endPointer", eP);
        if(tracing === undefined && pointer > sP){
          startTrace();
        }
        if(lastTrace){
          endTrace();
        } else if(tracing && pointer > eP){
          lastTrace = true;
        }
      },
      pushTag: function(tag, attributes){
        var node = {tag: tag,
                    attributes: attributes || {},
                    content: ""};
        // console.log("open tag", node);
        stack.push(node);
        if(tracing){
          if(traceJustStarted){
            // console.log("inserting node ", node);
            tracingStack[stackPosition+1] = traceNode(node);
            stackPosition += 1;
          }
          else if(tracingStack[stackPosition+1]){
            if(moveStackUp(node)){
              stackPosition += 1;
            } else {
              unsuccessfulPush = true;
            }
          }
          // console.log("stackPosition " + stackPosition);
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

        // console.log("closing", removedNode);
        if(tracing){
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
      isOpen: function(tag){
        // console.log("check is Open", tag, stack.length);
        return typeof getStackPositionOf(tag) === 'number';
      },
      getTrace: function(){
        return tracingStack;
      },
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
        builder.advancePointer(whitespaceLength);
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
      } else {
        builder.pushTag("p");
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
    if(advance(/^ *\* /)){
      if(!builder.isOpen("ul")){ // this won't work for nested uls,
        // solve with lookahead
        builder.pushTag("ul");
      }
      builder.pushTag("li");
    } else if(advance(/^ *# /)){
      if(!builder.isOpen("ol")){ // this won't work for nested uls
        builder.pushTag("ol");
      }
      builder.pushTag("li");
    } else {
      while(builder.isOpen("ul") || builder.isOpen("ol")){
        builder.closeTag();
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
      else if(match = advance(/^( *)!([^!\(]+)(\(([^\)]*)\))?!(:([^ ]+))?/)) {
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
  
  return {
    compile: function(textToCompile){
      builder.init();
      text = textToCompile;
      parseParagraphs();
      return builder.toHtml();
    },
    trace: function(textToCompile, startTrace, endTrace){
      builder.initTrace(startTrace, endTrace);
      this.compile(textToCompile);
      builder.finalizeTrace();
      // console.log(builder.toHtml());
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

  function selectNodes(nodes){
    var firstNode = nodes[0], lastNode;
    if(nodes.length > 1){
      lastNode = nodes[nodes.length-1];
      range.setStart(firstNode,0);
      range.setEnd(lastNode,lastNode.childNodes.length);
    } else {
      range.selectNodeContents(firstNode);
    }

    selection.removeAllRanges();
    selection.addRange(range);
  }

  return {
    name: "Preview Mode",
    buttons: {
      "default": {
        clicked: function(toolbar, target) {
          var range = selection.getRangeAt(0), newNode;

          if(/ on$/.test(target.className)){
            document.execCommand(this.name, false, null);
          } else {
            // TODO try to shrink the selection in firefox instead of this
            // Firefox needs this speciality. Pure execCommand wont
            // work: The selection is too large and the bold button
            // isnt on
            newNode = document.createElement(this.tag);
            range.surroundContents(newNode);
            // This is neccessary for chrome. Otherwise the range is gone
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
      },
      bold: {
        tag: 'b'
      },
      italic: {
        tag: 'i'
      },
      alignLeft: {
        clicked: function(toolbar){
          align('left');
        }
      },
      alignRight: {
        clicked: function(toolbar){
          align('right');
        }
      },
      alignCenter: {
        clicked: function(toolbar){
          align('center');
        }
      },
      link: {
        clicked: function(toolbar,target) {
          var dialog, linkNode, titleString,
          range = selection.getRangeAt(0),
          callback = {
            remove: function(){
              var text = linkNode.text();
              // on Chrome childNodes does not contain textnodes
              linkNode.replaceWith(text);
            },
            close: function(){
              toolbar.htmlDiv.focus();
              toolbar.editor.checkState();
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
            dialog = ME.dialog.link(['Ok','Cancel']);
            
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
        clicked: function(toolbar,target) {
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
              toolbar.htmlDiv.focus();
              toolbar.editor.checkState();
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
            dialog = ME.dialog.insertImage(['Ok','Cancel']);
          }

          dialog.dialog('open', callback);
        }
      }
    },
    selects: {
      formatBlock: {
        clicked: function(toolbar, target) {
          var paragraph, newParagraphs = [];
          // TODO select multiple paragraphs
          getParagraphs().replaceWith(function(){
            paragraph = $('<' + target.value + '></' + target.value + '>')
              .addClass(this.className).append(this.childNodes);
            newParagraphs.push(paragraph[0]);
            return paragraph;
          });
          selectNodes(newParagraphs);
        }
      }
    },
    afterActivation: function() {
      this.textArea.hide();
      this.htmlDiv.attr("contentEditable",true);
      /* Force Mozilla to generate tags instead of inline styles*/
      if (jQuery.browser.mozilla) {
        document.execCommand("styleWithCSS",null, false);
      }
    },
    getStates: function() {
      if(!$(document.activeElement).is(".preview")){
        return;
      }
      var nodes, container = startNode(),
      content = selection.getRangeAt(0).cloneContents().firstChild;

      if(content && content.nodeName != "#text" && container[0].nodeName != "#text"){
        container = container.find(content.nodeName.toLowerCase());
      }

      nodes = container.parentsUntil(".preview").add(container);
      
      return this.buildStateObject(nodes, currentNodes = {});
    },
    toText: function() {
      return this.editor.getDataMode().toText();
    },
    toHTML: function() {
      return this.textArea.val();
    }
  };
});
