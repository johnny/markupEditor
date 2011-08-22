var DialogHelper = (function(){
  var cache = {};
  return function DialogHelper(dialog, name){
    if(cache[name]){
      return cache[name];
    }
    this.dialog = dialog;
    this.cachedButtons = {};
  };
})();

DialogHelper.prototype = {
  click: function(title){
    var button = this.cachedButtons[title], id;
    if(!button){
      button = this.dialog.find("button:contains("+title+")");
      this.cachedButtons[title] = button;
    }
    button.click();
  },
  set: function(field, value){
    this.dialog.find('input.'+field).val(value);
  }
};

var SharedHelper = {
  find: function find(identifier){
    return this.cache[identifier] || (this.cache[identifier] = this.form.find(identifier));
  },
  click: function click(identifier){
    var item = this.find(identifier);
    if(item.is("select")){
      item.change();
    } else {
      item.mouseup();
    }
    return this;
  },
  change: function change(identifier,value){
    var $select = this.find(identifier);
    $select.val(value);
    return this.click(identifier);
  },
  on: function on(identifier){
    ok(this.find("."+identifier).is('.on'), identifier + " should be active");
    return this;
  },
  off: function off(identifier){
    ok(!this.find("."+identifier).is('.on'), identifier + " should not be active");
    return this;
  },
  disabled: function disabled(identifier){
    var element = this.find("."+identifier);
    ok(element.is(':disabled') || element.is('.disabled'), identifier + " should be disabled");
    return this;
  },
  enabled: function disabled(identifier){
    ok(this.find("."+identifier).is(':enabled'), identifier + " should be enabled");
    return this;
  },
  dialog: function dialog(name, callback){
    // put this here, so the dialog has been initialized
    this.click('.'+name);
    
    var identifier = '#'+name+'-dialog',
    d = this.cache[identifier] || (this.cache[identifier] = $(identifier).parent());
    
    callback(new DialogHelper(d, name));
    return this;
  }
};

function TextileHelper(object){
  jQuery.extend(this,object);
  this.cache = {};
}

TextileHelper.prototype = (function (){
  var methods = {
    set: function set(string){
      this.textArea.val(string);
      this.textArea[0].setSelectionRange(string.length, string.length);
      // reset Toolbar
      return this.click('textarea');
    },
    selectAll: function(){
      this.textArea[0].setSelectionRange(0, this.textArea.val().length);
      return this.click('textarea');
    },
    select: function select(string){
      var position = this.textArea.val().indexOf(string);
      this.textArea[0].setSelectionRange(position, position + string.length);
      // set toolbar items active
      return this.click('textarea');
    },
    _match: function _match(object, intendedResult, string){
      var val = this.textArea.val(), result;
      if(typeof object == "string"){
        result = val.indexOf(object) != -1;
      } else {
        result = object.test(val);
        object = object.source;
      }
      ok(result === intendedResult, val + string + object);
    },
    match: function match(object){
      this._match(object, true, " should match ");
      return this;
    },
    notMatch: function notMatch(object){
      this._match(object, false, " should not match ");
      return this;
    }
  };
  return jQuery.extend(methods,SharedHelper);
})();

function WysiwygHelper(object){
  jQuery.extend(this,object);
  this.cache = {};
}

WysiwygHelper.prototype = (function(){
  var methods = {
    set: function set(textile){
      var $html = $(textileCompiler.compile(textile));
      this.preview.html($html);
      this.range.selectNodeContents(this.preview[0]);
      this.range.collapse(false);

      this.selection.removeAllRanges();
      this.selection.addRange(this.range);
      
      // reset Toolbar
      return this.click('.preview');
    },
    selectAll: function(){
      return this.select(this.preview.children());
    },
    select: function select(identifier){
      var node;
      if(typeof identifier === "string"){
        node = this.preview.find(identifier);
      } else {
        node = identifier;
      }

      if(node.is("img")){
        this.range.selectNode(node[0]);
      } else {
        if(node.length > 1){
          this.range.setStart(node[0],0);
          this.range.setEndAfter(node.last()[0]);
        } else {
          this.range.selectNodeContents(node[0]);
        }
      }
      this.selection.removeAllRanges();
      this.selection.addRange(this.range);
      // set toolbar items active
      return this.click('.preview');
    },
    match: function match(identifier, lengthOrFunction){
      var nodes = this.preview.find(identifier);
      ok(nodes[0], identifier + " should match " + this.preview.html());
      if(typeof lengthOrFunction === "integer"){
        ok(nodes.length == length, identifier + " should match " + length + " nodes");
      } else if(typeof lengthOrFunction === "function"){
        ok(lengthOrFunction(nodes), identifier + " should match the given function");
      }

      return this;
    },
    notMatch: function notMatch(identifier){
      ok(!this.preview.find(identifier)[0], identifier + " should not match " + this.preview.html());
      return this;
    }
  };
  return jQuery.extend(methods, SharedHelper);
})();
