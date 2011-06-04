$(document).ready(function(){
  function textileTest(name, tests, testNumber){
    test(name, function() {
      var i = 0,l = tests.length;
      if(testNumber !== undefined){
        i = testNumber*2;
        l = i+2;
      }
      for(; i < l ; i += 2 ){
        equal(textileCompiler.compile(tests[i]), tests[i+1]);
      }
    });
  }
  
  module("textileCompiler");

  textileTest("Header",
              ["h1. Text", "<h1>Text</h1>",
               "h4. Text", "<h4>Text</h4>",
               "h1. Text\n  \n", "<h1>Text</h1>",
               "h1. Text\nwith linebreak\n", "<h1>Text<br/>with linebreak</h1>",
               "h1. Text\nwith linebreak \nand another one", "<h1>Text<br/>with linebreak <br/>and another one</h1>"
              ]);

  textileTest("Paragraph",
              ["Text", "<p>Text</p>",
               "p. Text", "<p>Text</p>",
               "p(right). Text", "<p class=\"right\">Text</p>"
              ]);

  textileTest("multiple Paragraphs",
              ["h1. Title\n\nText", "<h1>Title</h1><p>Text</p>",
               "h1. Title\n\np. Text", "<h1>Title</h1><p>Text</p>",
               "h1. Title\n\np. Text\n\np. Text 2", "<h1>Title</h1><p>Text</p><p>Text 2</p>"
              ]);

  textileTest("malformed Paragraph definitions",
              ["h1. Title\np. Text", "<h1>Title<br/>p. Text</h1>",
               "h1. p. Text", "<h1>p. Text</h1>",
               "h1.Title", "<p>h1.Title</p>",
               "h1(class).Title", "<p>h1(class).Title</p>"
              ]);

  textileTest("Bold",
              ["*bold*", "<p><b>bold</b></p>",
               "*bold*edgecase*", "<p><b>bold*edgecase</b></p>",
               " *bold with spaces*", "<p> <b>bold with spaces</b></p>",
               "*bold *with a twist*", "<p><b>bold *with a twist</b></p>"
              ]);
  
  textileTest("Italic",
              ["_italic_", "<p><i>italic</i></p>",
               "_italic_edgecase_", "<p><i>italic_edgecase</i></p>",
               " _italic with spaces_", "<p> <i>italic with spaces</i></p>",
               "_italic _with a twist_", "<p><i>italic _with a twist</i></p>",
               "_*italicBold*_", "<p><i><b>italicBold</b><i></p>",
               "_interleaved *bold_ and italic*", "<p><i>interleaved <b>bold</i> and italic</b></p>"
              ]);

  textileTest("Unordered List",
              ["* List", "<p><ul><li>List</li></ul></p>",
               "  * List", "<p><ul><li>List</li></ul></p>",
               "* List\n* ListItem2\n\n", "<p><ul><li>List</li><li>ListItem2</li></ul></p>",
               "* List 1\nText between\n* List 2", "<p><ul><li>List 1</li></ul>Text between<ul><li>List 2</li></ul></p>",
               "*No List", "<p>*No List</p>"
              ]);

  textileTest("Ordered List",
              ["# List", "<p><ol><li>List</li></ol></p>",
               "  # List", "<p><ol><li>List</li></ol></p>",
               "# List\n# ListItem2\n\n", "<p><ol><li>List</li><li>ListItem2</li></ol></p>",
               "# List 1\nText between\n# List 2", "<p><ol><li>List 1</li></ol>Text between<ol><li>List 2</li></ol></p>",
               "#No List", "<p>#No List</p>"
              ]);

  textileTest("Hyperlink",
              [" \"Title\":link", "<p> <a href=\"link\">Title</a></p>",
               "\"Title\":http://example.com", "<p><a href=\"http://example.com\">Title</a></p>",
               "\"Title\":http://example.com features", "<p><a href=\"http://example.com\">Title</a> features</p>",
               "\"Title\":http://example.com\nfeatures", "<p><a href=\"http://example.com\">Title</a><br/>features</p>",
               " \"This\":uri ", "<p> <a href=\"uri\">This</a> </p>"
              ]);

  textileTest("Image",
              [" !src!", "<p> <img src=\"src\"></img></p>",
               "!src!:link", "<p><a href=\"link\"><img src=\"src\"></img></a></p>",
               "!src(title)!", "<p><img src=\"src\" title=\"title\"></img></p>",
               "!src(title)!:link", "<p><a href=\"link\"><img src=\"src\" title=\"title\"></img></a></p>"
              ]);

  function parseParam(textile, param, end){
    var index;
    if(typeof param === "number"){
      index = param;
    } else if(typeof param === 'string'){
      index = textile.indexOf(param);
      if(end){
        index += param.length;
      }
    }
    return index;
  }

  function tracingTest(name, textile, selections, testNumber){
    test(name, function() {
      var i = 0,j, trace, l = selections.length, startTrace, endTrace, results, result, key;
      if(testNumber !== undefined){
        i = testNumber*3;
        l = i+3;
      }
      for(; i<l ; i += 3 ){
        startTrace = parseParam(textile,selections[i]);
        endTrace = parseParam(textile,selections[i+1],true);
        results = selections[i+2];
        trace = textileCompiler.trace(textile, startTrace, endTrace);
        console.log(trace);
        equals(trace.length, results.length, "Sequence: " + textile.slice(startTrace, endTrace));
        for(j=0; j<results.length;j++){
          result = results[j];
          if(trace[j]){
            if(typeof result === 'string'){
              equals(trace[j].tag, result);
            } else {
              equals(trace[j].tag, result.tag);
              for(key in result.attr){
                if(result.attr.hasOwnProperty(key)){
                  equals(trace[j].attributes[key], result.attr[key], "on tag " + result.tag);
                }
              }
            }
          }
          else{
            ok(trace[j], "expected trace[" + j + "] to be tag " + (result.tag || result));
          }
        }
      }
    });
  }
  module("textileTracer");
  
  tracingTest("simple Headline", "h1. test test",
              [0,5,['h1'],
               0,0,['h1'],
               5,5,['h1'],
               0,20,['h1'],
               4,5,['h1'],
               5,6,['h1']
              ]);

  tracingTest("starting with markup", "_bla_",
              [
                0,0,['p','i']
              ]);

  tracingTest("advanced paragraph", "this _emphasizes *very* greatly_ a *strong* *oppinion*\n*on* a *very* *important* matter.",[
    0,0,['p'],
    0,100,['p'],
    6,6,['p','i'],
    6,31,['p','i'],
    6,32,['p','i'],
    6,33,['p'],
    6,37,['p'],
    18,22,['p','i','b'],
    18,24,['p','i'],
    32,32,['p','i'],
    33,33,['p'],
    35,53,['p','b'],
    44,59,['p','b'],
    44,61,['p'],
    43,59,['p','b'],
    35,59,['p','b'],
    33,59,['p']
  ]);

  tracingTest("multiple paragraphs", "h1(left). Heading\n\np(left). First\n\nSecond\n\np(left). Third\n\np(left). Fourth\n\nFifth",[
    "h1", "Heading", ['h1'],
    "Heading", "First", [{tag:'h1',attr:{"class":"left"}}],
    "First","Fourth",['p'],
    "First","Second",['p'],
    "Third", "Fourth",[{tag: 'p', attr: {"class": "left"}}],
    "Second", "Third", ['p'],
    "\np(", "\np(", ['h1'],
    "\nSecond", "\nSecond", ['p'],
    "p(", "p(", [{tag: 'p', attr: {"class": "left"}}],
    "\nFifth", "\nFifth", ['p'],
    "Fourth", "Fifth", [{tag: 'p', attr: {}}]
  ]);

  tracingTest("links", "\"First\":src1 \"Second\":src2 \"Third\":src2",[
    0,0,['p', {tag: 'a', attr: {href: "src1"}}],
    0,"src2",['p'],
    "Second","Third",['p', {tag: 'a', attr: {href: "src2"}}]
  ]);

  tracingTest("images", "!src1(Title)! !src2! !src2(Title)! !src2(Title)!:link !src3!:link",[
    0,0,['p', {tag: 'img', attr: {src: "src1", title: "Title"}}],
    0,"src2",['p'],
    "src2","src2(",['p'],
    "src2(",":link",['p', {tag: 'img', attr: {src: 'src2', title: 'Title'}}],
    ":link","src3",['p', {tag: 'a', attr: {href: "link"}}],
    ":link",":",['p','a',{tag: 'img', attr: {src: 'src2',title: 'Title'}}],
    "3!", "3", ['p','a',{tag: 'img', attr: {src: 'src3'}}]
    // Do some more specs with cursors over single entry
  ]);
});

