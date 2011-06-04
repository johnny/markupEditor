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
