$(document).ready(function(){

  var form = $("form#textile"), textArea = form.find("textarea"), cache = {};

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

  function set(string){
    textArea.val(string);
    textArea[0].setSelectionRange(string.length, string.length);
    // reset Toolbar
    click('textarea');
  }

  function select(string){
    var position = textArea.val().indexOf(string);
    textArea[0].setSelectionRange(position, position + string.length);
    // set toolbar items active
    click('textarea');
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

  function match(regexp){
    var val = textArea.val();
    ok(regexp.test(val), val + " should match " + regexp.source);
  }

  function notMatch(regexp){
    var val = textArea.val();
    ok(!regexp.test(val), val + " should not match " + regexp.source);
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

  module("textile");
  
  test("Bold toggle", function(){
    set("This");
    select("This");
    click(".bold");
    match(/\*This\*/);
    on('bold');
    click(".bold");
    notOn("bold");
    match(/^This$/);
  });

  test("Bold off edgecases", function(){
    set("*bold*");
    select("bold");
    click(".bold");
    notMatch(/\*/);
    
    set("This is a *bold* word.");
    select("bold");
    click(".bold");
    notMatch(/\*/);
    
    set("These are *some bold words* here.");
    select("some bold words");
    click(".bold");
    notMatch(/\*/);
    
    // Same Test with full stop after markup
    set("These are *some bold words*.\ntricky");
    select("some bold words");
    click(".bold");
    notMatch(/\*/);
    
    // Fuzzy selection
    set("These are *some bold words*.\ntricky");
    select("ome bold wor");
    click(".bold");
    notMatch(/\*/);

    // Left partial selection
    set("These are *some bold words*.");
    select("some");
    click(".bold");
    match(/some \*bold/);

    // Left partial selection with paragraph
    set("h1. *Some bold words* these are.");
    select("h1. *Some");
    click(".bold");
    match(/h1\. Some \*bold/);
    
    // Right partial selection
    set("These are *some bold words*.");
    select("words");
    click(".bold");
    match(/bold\* words./);

    // multiple Lines
    set("h1. *important*\n*news headline*\n\n*still important*\n*till* here.");
    select("h1. *important*\n*news headline*\n\n*still important*\n*till*");
    click(".bold");
    notMatch(/\*/);

    // with spaces on
    set("h1.    soon to be important headline    ");
    select("h1.    soon to be important headline    ");
    click(".bold");
    match(/h1. \*.*\*/);
  });

  test("Bold select", function(){
    set("*This*");
    select("This");
    on('bold');
  });

  test("Reset test should work", function(){
    set("This is not bold");
    notOn('bold');
  });

  test("Link select and remove", function(){
    set("\"This\":uri");
    select("This");
    on('link');
    dialog('link').find("button:eq(1)").click();
    notMatch(/uri/);
    notOn('link');
  });

  test("Link select and update", function(){
    set("\"This\":uri");
    select("This");
    on('link');
    dialog('link', function(d){
      d.set('uri','src');
      d.click(2);
    });
    match(/src/);
    on('link');
  });
  
  test("Link create", function(){
    set("This");
    select("This");
    notOn('link');
    dialog('link', function(d){
      d.set('uri','src');
      d.click(1);
    });
    match(/This\":src/);
    on('link');
  });

  test("Image create", function(){
    set("This is an image: ");
    dialog('insertImage', function(d){
      d.set('imageUri', 'src');
      d.click(1);
    });
    match(/!src!$/);
    on('insertImage');
  });

  test("Image create with Title", function(){
    set("This is an image: ");
    dialog('insertImage', function(d){
      d.set('imageUri', 'src');
      d.set('title', 'Title');
      d.click(1);
    });
    match(/!src\(Title\)!$/);
    on('insertImage');
  });

  test("Image create with Title and uri", function(){
    set("This is an image: ");
    dialog('insertImage', function(d){
      d.set('imageUri', 'src');
      d.set('title', 'Title');
      d.set('uri', 'uri');
      d.click(1);
    });
    match(/!src\(Title\)!:uri$/);
    on('insertImage');
  });

  test("Image update", function(){
    set("!src(Title)!");
    select("src");
    on('insertImage');
    dialog('insertImage', function(d){
      d.set('uri', 'uri');
      d.click(2);
    });
    match(/!src\(Title\)!:uri$/);
    on('insertImage');
    dialog('insertImage', function(d){
      d.set('title', '');
      d.click(2);
    });
    match(/!src!:uri/);
    dialog('insertImage', function(d){
      d.set('uri', '');
      d.click(2);
    });
    match(/!src!/);
  });

  test("Image remove", function(){
    set("!src(Title)!");
    select("src");
    on('insertImage');
    dialog('insertImage', function(d){
      d.click(1);
    });
    match(/^$/);
    notOn('insertImage');
  });

  test("Paragraph multiple", function(){
    set("This\n\nThat");
    select("This\n\nThat");
    change(".formatBlock", "h1");
    match(/h1. This/);
    match(/h1. That/);
  });

});
