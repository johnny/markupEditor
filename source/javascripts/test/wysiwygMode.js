$(document).ready(function(){

  var form = $("form#wysiwyg"),
  textArea = form.find("textarea"),
  preview = form.find(".preview"),
  selection = window.getSelection(),
  range = document.createRange();

  range.selectNodeContents(preview.focus()[0]);
  selection.addRange(range);


  var w = new WysiwygHelper({
    form: form,
    textArea: textArea,
    preview: preview,
    selection: selection,
    range: range
  });

  module("wysiwyg");

  test('toolbar should act on the editor it belongs to', function(){
    var otherEditor = $("div.markupClick.textile").parent(),
    w2 = new WysiwygHelper({
      form: otherEditor,
      textArea: otherEditor.find('textarea'),
      preview: otherEditor.find('.preview'),
      selection: selection,
      range: range
    });
    w.set('text')
      .select('p');
    w2.click('.bold');
    w.notMatch('b');
    w.set('text')
      .select('p');
    w2.change(".formatBlock", "h1");
    w.notMatch('h1');
  });

  test("default paragraph", function(){
    w.match("p");
  });

  test("Image remove", function(){
    w.set("!remove(Title)!")
      .select("img")
      .on('insertImage')
      .dialog('insertImage', function(d){
        d.click("Remove");
      })
      .notMatch("img")
      .off('insertImage');
  });

  test("Image update", function(){
    w.set("!src(Title)!")
      .select("img")
      .on('insertImage')
      .dialog('insertImage', function(d){
        d.set('uri', 'uri');
        d.click("Update");
      })
      .match("a[href=uri]")
      .on('insertImage')
      .dialog('insertImage', function(d){
        d.set('title', '');
        d.click("Update");
      })
      .notMatch("img[title=Title]")
      .dialog('insertImage', function(d){
        d.set('uri', '');
        d.click("Update");
      })
      .notMatch("a");
  });

  test("Image create", function(){
    w.set("This is an image: ")
      .dialog('insertImage', function(d){
        d.set('imageUri', 'src');
        d.click("Create");
      })
      .match('img')
      .on("insertImage");
  });

  test("Image create with Title", function(){
    w.set("This is an image: ")
      .dialog('insertImage', function(d){
        d.set('imageUri', 'src');
        d.set('title', 'Title');
        d.click("Create");
      })
      .match("img[title=Title]")
      .on("insertImage");
  });

  test("Image create with Title and uri", function(){
    w.set("This is an image: ")
      .dialog('insertImage', function(d){
        d.set('imageUri', 'src');
        d.set('title', 'Title');
        d.set('uri', 'uri');
        d.click("Create");
      })
      .match("a[href=uri] img[title=Title]")
      .on("insertImage");
  });

  test("Bold toggle", function(){
    w.set("This")
      .select("p")
      .click(".bold")
      .match("b")
      .on('bold')
      .select("b")
      .click(".bold")
      .off('bold')
      .notMatch("b");
  });

  test("Bold select", function(){
    w.set("*This*")
      .select("b")
      .on('bold');
  });

  test("Italic toggle", function(){
    w.set("This")
      .select("p")
      .click(".italic")
      .match("i")
      .on('italic')
      .select("i")
      .click(".italic")
      .off('italic');
  });

  test("Italic select", function(){
    w.set("_This_")
      .select("i")
      .on('italic');
  });

  test("Bold italic mixed", function(){
    w.set("This")
      .select("p")
      .click(".italic")
      .match("i")
      .on('italic')
      .select("i")
      .click(".bold")
      .on('italic')
      .on('bold')
      .click(".italic")
      .off("italic")
      .on("bold");
  });

  test("Reset test should work", function(){
    w.set("This is not bold")
      .off('bold');
  });

  test("Link select and remove", function(){
    w.set("\"This\":uri")
      .select("a")
      .on('link')
      .dialog('link', function(d){
        d.click("Remove");
      })
      .notMatch("a")
      .off('link');
  });

  test("Link select and update", function(){
    w.set("\"This\":uri")
      .select("a")
      .on('link')
      .dialog('link', function(d){
        d.set('uri','src');
        d.click("Update");
      })
      .match("a[href=src]")
      .on('link');
  });
  
  test("Link create", function(){
    w.set("This")
      .select("p")
      .off('link')
      .dialog('link', function(d){
        d.set('uri','src');
        d.click("Create");
      })
      .match("a")
      .on('link');
  });

  test("Paragraph multiple", function(){
    w.set("This\n\nThat")
      .select("p")
      .change(".formatBlock", "h1")
      .notMatch("p");
  });

  function testListType(listType, spec){
    var bullet = spec.bullet, tag = spec.tag;

    test("List " + listType + " enable across paragraphs", function(){
      w.set("test\ntest2\n\nh1. test3\n\n* item1\n* item2")
        .selectAll()
        .off(listType)
        .click("."+ listType)
        .match(tag,1)
        .match("li",5)
        .notMatch("h1")
        .notMatch('p')
        .on(listType);
    });

    test("List " + listType + " join adjacent lists", function(){
      w.set(bullet + " firstList\n\ntest\n\n" + bullet + " secondList")
        .select("p")
        .off(listType)
        .click("."+listType)
        .match(tag,1)
        .match(tag + " :first-child:contains(firstList)")
        .match("li",3)
        .notMatch('p')
        .on(listType);
    });

    test("List " + listType + " toggle", function(){
      w.set(bullet + " list")
        .select(tag)
        .on(listType)
        .disabled("formatBlock")
        .click("."+ listType)
        .notMatch(tag)
        .off(listType)
        .enabled("formatBlock");
    });

    test("List " + listType + " on with new lines", function(){
      w.set("item1\nitem2")
        .selectAll()
        .off(listType)
        .click("."+listType)
        .notMatch("p")
        .on(listType)
        .click("."+ listType)
        .off(listType)
        .notMatch(tag);
    });

    test("List " + listType + " partial on", function(){
      w.set("item1\n" + bullet + " item2")
        .selectAll()
        .off(listType)
        .click("."+listType)
        .notMatch("p")
        .on(listType)
        .click("."+ listType)
        .off(listType)
        .notMatch(tag);

      // other way
      w.set(bullet + " item1\nitem2")
        .selectAll()
        .off(listType)
        .click("."+listType)
        .notMatch("p")
        .on(listType)
        .click("."+ listType)
        .off(listType)
        .notMatch(tag);
    });

    test("List " + listType + " partial off", function(){
      w.set(bullet + " item1\n" + bullet + " item2\n" + bullet + " item3")
        .select("li:eq(1)")
        .on(listType)
        .click("."+ listType)
        .notMatch("li:contains(item2)")
        .match('p', function(node){
          return !/^\s*$/.test(node.next().text());
        })
        .off(listType);
    });

    test("List " + listType + " off should join lists", function(){
      w.set(bullet + " item1\n\n" + bullet + " item2")
        .selectAll()
        .on(listType)
        .click("."+ listType)
        .match("p",1)
        .notMatch(tag)
        .off(listType);
    });
  }
  
  var listTypes = {
    unorderedList: {
      bullet: "*",
      tag: "ul"
    },
    orderedList: {
      bullet: "#",
      tag: 'ol'
    }
  }, listType, bullet;
  
  for(listType in listTypes){
    if(listTypes.hasOwnProperty(listType)){
      testListType(listType, listTypes[listType]);
    }
  }


  // I have mixed feelings about this test
  // test("List mixed", function(){
  //   w.set("* item1\n# item2")
  //     .selectAll()
  //     .off("orderedList")
  //     .off("unorderedList")
  //     .click(".orderedList")
  //     .match("ol")
  //     .notMatch("ul")
  //     .select("ol :first-child")
  //     .on("orderedList")
  //     .click(".unorderedList")
  //     .match("ul",1)
  //     .match("ol",1)
  //     .selectAll()
  //     .off("unorderedList")
  //     .click(".unorderedList")
  //     .match("ul",2);
  // });

  test("List -> align", function(){
    w.set("* item1\n* item2")
      .select("ul")
      .disabled("alignCenter")
      .disabled("alignRight")
      .disabled("alignLeft")
      .click(".alignCenter")
      .match("ul",2);
  });

  test("List -> italic", function(){
    w.set("* item1\n# item2")
      .select("ul :first-child")
      .click(".italic")
      .match("ul i:first-child")
      .click(".italic")
      .notMatch("i")
      .selectAll()
      .click(".italic")
      .click(".italic")
      .notMatch("b");
  });

  test("List -> link", function(){
    w.set("* item1\n# item2")
      .select("ul :first-child")
      .dialog("link", function(d){
        d.set('uri','src');
        d.click("Create");
      })
      .match("ul li a")
      .dialog("link", function(d){
        d.click("Remove");
      })
      .notMatch("a");
  });

  test("List -> image", function(){
    w.set("* item1\n# item2")
      .select("ul :first-child")
      .dialog("insertImage", function(d){
        d.set('imageUri','src');
        d.click("Create");
      })
      .match("ul li img")
      .dialog("insertImage", function(d){
        d.click("Remove");
      })
      .notMatch("img");
  });

  test("List -> paragraph", function(){
    w.set("paragraph\n\n* item1\n\nparagraph")
      .selectAll()
      .change(".formatBlock", "h1")
      .match("h1")
      .notMatch("p")
      .match("ul")
      .notMatch("ul h1, h1 ul");
  });
});
