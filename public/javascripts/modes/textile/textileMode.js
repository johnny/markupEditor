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
  function eachParagraph(toolbar, functor) {
    var mode = toolbar.editor.currentMode, paragraphs = mode.getParagraphs(), paragraphsLength = paragraphs.length;

    for(i = 0; i < paragraphsLength; i++) {
      paragraphs[i] = functor(paragraphs[i]);
    }
    mode.setParagraphs(paragraphs);
  }

  /**
   * Execute align command
   * 
   * @param {Mode} mode The current mode
   * @param {String} orientation The orientation of the alignment
   */
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

  /**
   * Scan the textarea for the first match and set selection to it.
   * This is useful e.g. for finding a link markup with a given source
   * 
   * @param {Mode} mode The current mode
   * @param {RegExp} r The regexp to search for
   */
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
    "*": [/^(\w+\. )?\s*\*/, /\*([\.]*)$/],
    "_": [/^(\w+\. )?\s*_/, /_([\.]*)$/]
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
                match = currentLine.match(regexpes[this.delimiter][0]);
                if(match){
                  currentLine = (match[1] || "") + currentLine.slice(match[0].length);
                } else {
                  // place delimiter left and extend selection
                  currentLine = this.delimiter + toolbar.extendLeftSelection(/[ .]+/) + currentLine;
                }

                // Then handle the right
                match = currentLine.match(regexpes[this.delimiter][1]);
                if(match){
                  currentLine = currentLine.slice(0, - match[0].length) + (match[1] || ""); 
                } else {
                  currentLine += toolbar.extendRightSelection(/ +/) + this.delimiter;
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
    /**
     * Get the states for the current selection
     * 
     * @return {Object} An object representing the states
     */
    getStates: function() {
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
    }
  };
});
