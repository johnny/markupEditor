$(document).ready(function(){

  var form = $("form#wysiwyg"),
  textArea = form.find("textarea"),
  preview = form.find(".preview"),
  cache = {},
  selection = window.getSelection(),
  range = document.createRange();
  range.selectNodeContents(preview[0]);
  selection.addRange(range);
  preview.focus();

  function DialogHelper(d){
    this.dialog = d;
  }
  
  DialogHelper.prototype = {
    click: function(id){
      this.dialog.find("button:eq("+id+")").click();
    },
    set: function(field, value){
      this.dialog.find('input.'+field).val(value);
    }
  };

  function set(textile){
    var $html = $(textileCompiler.compile(textile));
    preview.html($html);
    range.selectNodeContents(preview[0]);
    range.collapse(false);

    selection.removeAllRanges();
    selection.addRange(range);
    
    // reset Toolbar
    click('.preview');
  }

  function select(identifier){
    node = preview.find(identifier);

    if(node.is("img")){
      range.selectNode(node[0]);
    } else {
      if(node.length > 1){
        range.setStart(node[0],0);
        range.setEnd(node.last()[0],node.last()[0].childNodes.length);
      } else {
        range.selectNodeContents(node[0]);
      }
    }
    selection.removeAllRanges();
    selection.addRange(range);

    // set toolbar items active
    click('.preview');
  }

  function find(identifier){
    return cache[identifier] || (cache[identifier] = form.find(identifier));
  }

  function click(identifier){
    var item = find(identifier);
    if(item.is("select")){
      item.change();
    } else {
      item.mouseup();
    }
  }

  function change(identifier,value){
    var $select = find(identifier);
    $select.val(value);
    click(identifier);
  }

  function match(identifier){
    ok(preview.find(identifier)[0], identifier + " should match " + preview.html());
  }

  function notMatch(identifier){
    ok(!preview.find(identifier)[0], identifier + " should not match " + preview.html());
  }

  function on(identifier){
    ok(find("."+identifier).is('.on'), identifier + " should be active");
  }

  function notOn(identifier){
    ok(!find("."+identifier).is('.on'), identifier + " should not be active");
  }

  function dialog(name, callback){
    click('.'+name); // put this here, so the dialog has been initialized
    var identifier = '#'+name+'-dialog',
    d = cache[identifier] || (cache[identifier] = $(identifier).parent());

    if(callback){
      callback(new DialogHelper(d));
    } else {
      return d;
    }
  }

  module("wysiwyg");
  
  test("Image remove", function(){
    set("!remove(Title)!");
    select("img");
    on('insertImage');
    dialog('insertImage', function(d){
      d.click(1);
    });
    notMatch("img");
    notOn('insertImage');
  });

  test("Image update", function(){
    set("!src(Title)!");
    select("img");
    on('insertImage');
    dialog('insertImage', function(d){
      d.set('uri', 'uri');
      d.click(2);
    });
    match("a[href=uri]");
    on('insertImage');
    dialog('insertImage', function(d){
      d.set('title', '');
      d.click(2);
    });
    notMatch("img[title=Title]");
    dialog('insertImage', function(d){
      d.set('uri', '');
      d.click(2);
    });
    notMatch("a");
  });

  test("Image create", function(){
    set("This is an image: ");
    dialog('insertImage', function(d){
      d.set('imageUri', 'src');
      d.click(1);
    });
    match('img');
    on("insertImage");
  });

  test("Image create with Title", function(){
    set("This is an image: ");
    dialog('insertImage', function(d){
      d.set('imageUri', 'src');
      d.set('title', 'Title');
      d.click(1);
    });
    match("img[title=Title]");
    on("insertImage");
  });

  test("Image create with Title and uri", function(){
    set("This is an image: ");
    dialog('insertImage', function(d){
      d.set('imageUri', 'src');
      d.set('title', 'Title');
      d.set('uri', 'uri');
      d.click(1);
    });
    match("a[href=uri] img[title=Title]");
    on("insertImage");
  });

  test("Bold toggle", function(){
    set("This");
    select("p");
    click(".bold");
    match("b");
    on('bold');
    select("b");
    click(".bold");
    notOn('bold');
    notMatch("b");
  });

  test("Bold select", function(){
    set("*This*");
    select("b");
    on('bold');
  });

  test("Italic toggle", function(){
    set("This");
    select("p");
    click(".italic");
    match("i");
    on('italic');
    select("i");
    click(".italic");
    notOn('italic');
  });

  test("Italic select", function(){
    set("_This_");
    select("i");
    on('italic');
  });

  test("Bold italic mixed", function(){
    set("This");
    select("p");
    click(".italic");
    match("i");
    on('italic');
    select("i");
    click(".bold");
    on('italic');
    on('bold');
    click(".italic");
    notOn("italic");
    on("bold");
  });

  test("Reset test should work", function(){
    set("This is not bold");
    notOn('bold');
  });

  test("Link select and remove", function(){
    set("\"This\":uri");
    select("a");
    on('link');
    dialog('link').find("button:eq(1)").click();
    notMatch("a");
    notOn('link');
  });

  test("Link select and update", function(){
    set("\"This\":uri");
    select("a");
    on('link');
    dialog('link', function(d){
      d.set('uri','src');
      d.click(2);
    });
    match("a[href=src]");
    on('link');
  });
  
  test("Link create", function(){
    set("This");
    select("p");
    notOn('link');
    dialog('link', function(d){
      d.set('uri','src');
      d.click(1);
    });
    match("a");
    on('link');
  });

  test("Paragraph multiple", function(){
    set("This\n\nThat");
    select("p");
    change(".formatBlock", "h1");
    notMatch("p");
  });

  function checkConversion(value){
    set(value);
    change(".changeMode", "textile");
    equal(textArea.val(),value);
    change(".changeMode", "wysiwyg");
  }
  
  test("Conversion", function(){
    checkConversion("This\n\nThat");
    checkConversion("h1. This\n\nh2. That");
    checkConversion("p(left). This");
    checkConversion("h2(right). This");
    checkConversion("*bold*");
    checkConversion(" *bold* ");
    checkConversion("_italic_");
    checkConversion(" _italic_ ");
    checkConversion("\"This\":uri");
    checkConversion(" \"This\":uri ");
    checkConversion("!src!");
    checkConversion("!src!:uri");
    checkConversion("!src(Title)!");
    checkConversion("!src(Title)!:uri");
  });

});
