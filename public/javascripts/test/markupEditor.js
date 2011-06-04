$(function(){
  var markupDiv = $("div.markupClick.textile").click();

  module("Markup");
  
  test("click and load", function(){
    ok(markupDiv.find(".preview")[0], "Editor should be initialized");
  });

  test("save button should be visible on div-loaded MarkupEditor", function(){
    var ta = markupDiv.find(".toolbar");
    ok(ta.find("a.save").is(":visible"), "save button should be visible");
  });

  test("save button should not be visible on textarea loaded MarkupEditor", function(){
    console.log($("#textile a.save"));
    ok(!$("#textile a.save").is(":visible"), "save button should not be visible");
  });
});
