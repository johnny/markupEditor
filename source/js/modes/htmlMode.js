ME.addMode("html",function() {
  return {
    name: "Html Mode",
    buttons: {
      "default": {
        clicked: function(toolbar) {
          var replacement = "<"+this.delimiter+">" + toolbar.getSelection() + "</" + this.delimiter + ">";
          toolbar.replaceSelection(replacement);
        }
      },
      bold: {
        delimiter: "b"
      },
      italic: {
        delimiter: "i"
      },
      alignLeft: {
        clicked: function(toolbar) {
          toolbar.getSelection();
        }
      },
      alignRight: {
        clicked: function(toolbar) {
          
        }
      }
    },
    selects: {
      formatBlock: {
        clicked: function(toolbar, target) {
          // It won't work if the caret rests on top of the tags
          var textarea = toolbar.textarea;
          var caretPosition = textarea[0].selectionStart;
          if(caretPosition === 0) {
            return false;
          }
          var content = textarea.val();
          var before = content.slice(0, caretPosition);
          var after = content.slice(caretPosition);
          var replacementEndTag = "</" + target.value + ">";
          var i,t, tagIndex, startTag, endTag;

          var availableTags = ["<p>", "<h1>", "<h2>", "<h3>"];
          
          for(i = 0, tagIndex = -1; i < 4; i++) {
            t = before.lastIndexOf(availableTags[i]);
            if(t > tagIndex) {
              tagIndex = t;
              startTag = availableTags[i];
            }
          }
          before = before.slice(0,tagIndex) + "<" + target.value + ">" + before.slice(tagIndex + startTag.length);
          endTag = startTag.replace(/(\w+)/, "/$1");

          t = before.lastIndexOf(endTag);
          if(t > tagIndex) {
            tagIndex = t;
            before = before.slice(0,tagIndex) + replacementEndTag + before.slice(tagIndex + endTag.length);
          } else {
            tagIndex = after.indexOf(endTag);
            after = after.slice(0, tagIndex) + replacementEndTag + after.slice(tagIndex + endTag.length);
          }
          
          textarea.val(before + after);
        }
      }
    },
    toHTML: function() {
      return this.textarea.val();
    },
    toText: function() {
      return this.preview.html();
    }
  };
});

