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
    var stack, tracingStack, stackPosition, traceJustStarted, traceJustEnded, popping, pointer, sP, eP, tracing, lastTrace, unsuccessfulPush = false;
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

    /**
     * Create a new TraceNode form a given node
     * @constructor
     * 
     * @param {object} node 
     */
    function traceNode(node){
      return {tag: node.tag,
              attributes: node.attributes};
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
      initTrace: function(startPosition, endPosition){
        tracingStack = [];
        tracing = undefined;
        pointer = 0;
        sP = startPosition;
        eP = endPosition;
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
       */
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
        if(tracing){
          if(traceJustStarted){
            // console.log("inserting node ", node);
            tracingStack[stackPosition+1] = traceNode(node);
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
  
  textileCompiler = {
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
