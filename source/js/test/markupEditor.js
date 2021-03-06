$(function(){
  $("div.markupClick.textile").click()
  var editor,
  timeout_ms = 200;

  function async(editor, trigger, callback){
    if(!trigger){
      asyncOld(editor);
      return;
    }
    var func = function(event){
      console.log(event);
      event.stopPropagation();
      editor.unbind(trigger,func);
      callback();
    };
    editor.bind(trigger,func);
  }

  function asyncOld(callback) {
    setTimeout(callback, timeout_ms);
  }

  editor = $("div.markupClick.textile").parent()

  module("Markup");
  
  test("click and load", function(){
    ok(editor.find(".preview")[0], "Editor should be initialized");
  });

  test("save and close buttons should be visible on div-loaded MarkupEditor", function(){
    var tb = editor.find(".toolbar");
    ok(tb.find("a.save").is(":visible"), "save button should be visible");
    ok(tb.find("a.close").is(":visible"), "close button should be visible");
  });

  test("save and close buttons should not be visible on textarea loaded MarkupEditor", function(){
    ok(!$("#textile a.save").is(":visible"), "save button should not be visible");
    ok(!$("#textile a.close").is(":visible"), "close button should not be visible");
  });

  test('change between preview and data should work', function(){
    var previewButton = editor.find('a.wysiwyg'),
    changeMode = editor.find('.changeDataMode');

    previewButton.mouseup();
    ok(!previewButton.is('.on'), 'preview off');
    previewButton.mouseup();
    ok(previewButton.is('.on'), 'preview on');

    changeMode.val('haml').change();
    ok(previewButton.is(':visible'), 'preview button should be visible');
    ok(editor.find('.preview').is(':visible'), 'preview should be visible');
    ok(previewButton.is('.on'), 'preview on');

    previewButton.mouseup();
    stop(2);
    
    async(editor, 'from_html', function(){
      start();
      ok(!previewButton.is('.on'), 'preview off');
      ok(changeMode.val() === 'haml', 'The datamode should stay the same, was ' + changeMode.val());
      previewButton.mouseup();
      async(editor, 'to_html', function(){
        start();
        ok(previewButton.is('.on'), 'preview on');
        ok(changeMode.val() === 'haml', 'The datamode should stay the same, was ' + changeMode.val());
      });
    });
  });

  test('should not raise error', function(){
    editor.find('.toolbar').mouseup();
    ok(true, 'should not raise error');
  });

  test('should hide changeDataMode select if there is only one option', function(){
    ok($('#externalSelect2 .changeDataMode').is(':hidden'), 'changeDataMode should be hidden');
    ok(editor.find('.changeDataMode option').length > 1, 'changeDataMode should have more than one option');
    ok(editor.find('.changeDataMode').is(':visible'), 'changeDataMode should be visible if more than one option exists');
  });

  test('close and reopen', function(){
    var div = editor.find(".preview");
    editor.find('a.close').mouseup();
    ok(div.parent()[0] !== editor[0], 'editor should be closed');
    ok(!div.data('events') || !div.data('events').keyup, 'events should be removed');
    ok(div.attr('contentEditable') === 'false', 'content should no longer be editable');

    $('.markupClick.textile').click()
    editor = $('.markupClick.textile').parent()
    div = $('.markupClick.textile')
    ok(div.attr('contentEditable') === 'true', 'editor should be reopened');
    ok(div.parent().find("a.save").is(":visible"), "save settings should be remembered");
    ok(div.parent().find("select.changeDataMode option[value='unknown']")[0], "select settings should be remembered");
  });

  var externalSelect = $('select.availableModes'),
  editor1 = $('textarea.ta1').parents('.markupEditor'),
  editor2 = $('textarea.ta2').parents('.markupEditor'),
  changeMode1 = editor1.find('.changeDataMode'),
  changeMode2 = editor2.find('.changeDataMode'),
  textarea1 = editor1.find('textarea'),
  helper1 = new GeneralHelper({
    form: editor1,
    textarea: textarea1
  });
  
  test('should hide external select', function(){
    ok(externalSelect.is(':hidden'), 'external select should be hidden');
  });

  test('should ignore non existant select', function(){
    var select = $('#wrongExternalSelect .changeDataMode');
    ok(select.is(':visible'), 'select should be visible');
    ok(select.find('option').length > 0, 'select should contain items');
  });

  test('should sync the different select boxes', function(){
    var newVal = 'completeSyncMode';
    
    if(editor1.find('.wysiwyg').is('.on')){
      helper1.click('.wysiwyg');
    }
    
    changeMode1.val(newVal).change();
    ok(externalSelect.val() === newVal, 'change in one editor should change external select');
    ok(changeMode2.val() === newVal, 'change in one editor should change select in other editor');

    newVal = 'textile';
    externalSelect.val(newVal).change();
    ok(changeMode1.val() === newVal, 'change in external select should change editor 1');
    ok(changeMode2.val() === newVal, 'change in external select should change editor 2');

    helper1.off('wysiwyg')
      .click('.wysiwyg')
      .on('wysiwyg');

    ok(editor2.find('.wysiwyg').is('.on'), 'preview mode change should sync');
    
    newVal = 'completeSyncMode';
    changeMode1.val(newVal).change();
    ok(changeMode2.val() === newVal, 'sync with wysiwyg should change Datamode');
    ok(editor2.find('.wysiwyg').is('.on'), 'preview mode change should sync');
  });

  test('if the mode has no toHTML, hide the preview', function(){
    helper1.change('.changeDataMode', 'unknown')
      .handleDialog('notice', function(d){
        d.click("Ok");
      });

    ok(editor1.find('.preview').is(":hidden"), 'preview in editor 1 should be hidden');
    ok(editor2.find('.preview').is(":hidden"), 'preview in editor 2 should be hidden');
    
    helper1.change('.changeDataMode', 'modeWithoutToText')
      .handleDialog('notice', function(d){
        d.click("Ok");
      });
    ok(!editor1.find('.preview').is(":hidden"), 'preview in editor 1 should be visible');
    ok(!editor2.find('.preview').is(":hidden"), 'preview in editor 2 should be visible');

    changeMode1.val('textile').change();
    ok(editor1.find('.preview').is(":visible"), 'preview in editor 1 should be visible');
    ok(editor2.find('.preview').is(":visible"), 'preview in editor 2 should be visible');
  });

  test('mode change to mode without toText should leave the textarea untouched', function(){
    var text = 'some text',
    dialogOpen = false,
    dialogText = '';

    changeMode1.val('textile').change();
    textarea1.val(text).mouseup();
    
    changeMode1.val('unknown').change();
    helper1.handleDialog('notice', function(d){
      dialogOpen = true;
      dialogText = d.dialog.text();
      d.click("Ok");
    });
    ok(dialogOpen, 'a change to a mode without toText should warn');
    ok(/convert HTML to your markup/.test(dialogText), 'The dialog should warn about unsupported conversion to markup, text was: ' + dialogText);
    
    ok(textarea1.val() === text, 'The text should not change, was ' + textarea1.val());

    text = text + 'bla';
    textarea1.val(text);

    dialogOpen = false;
    changeMode1.val('textile').change();
    helper1.handleDialog('notice', function(d){
      dialogOpen = true;
      dialogText = d.dialog.text();
      d.click("Ok");
    });
    ok(dialogOpen, 'a change to a mode with preview should warn about possible problems');
    ok(/convert to HTML/.test(dialogText), 'The dialog should warn about unsupported conversion to HTML, text was: ' + dialogText);
    
    ok(textarea1.val() === text, 'Textile Mode should not convert preview div, was ' + textarea1.val());
    
    changeMode1.val('modeWithoutToText').change();
    dialogOpen = false;
    helper1.handleDialog('notice', function(d){
      dialogOpen = true;
      dialogText = d.dialog.text();
      d.click("Ok");
    });
    ok(dialogOpen, 'a change to a mode without toText should warn');
    ok(/convert HTML to your markup/.test(dialogText), 'The dialog should warn about unsupported conversion to markup, text was: ' + dialogText);

    ok(textarea1.val() === text, 'The text should not change, was ' + textarea1.val());

    editor1.find('.preview').html('<p>Changed text</p>');

    changeMode1.val('textile').change();
  
    dialogOpen = false;
    helper1.handleDialog('notice', function(d){
      dialogOpen = true;
    });

    ok(!dialogOpen, 'a change to a mode with preview should not warn about possible problems if the source mode has toHTML');
    
    ok(textarea1.val() === 'Changed text', 'Textile mode should use preview div');
    
    changeMode1.val('modeWithoutToText').change();
    helper1.handleDialog('notice', function(d){
      d.click("Cancel");
    });

    ok(changeMode1.val() === 'textile', 'Pressing cancel should rollback the mode change');
    ok(changeMode2.val() === 'textile', 'Pressing cancel should rollback the sync too');
  });

  test('change mode should work with async modes', function(){
    var text = 'some text',
    previewButton = editor1.find('a.wysiwyg');

    changeMode1.val('textile').change();
    
    if(previewButton.is('.on')){
      previewButton.mouseup();
    }

    textarea1.val(text).mouseup();

    changeMode1.val('haml').change();
    stop();

    async(editor1, 'from_html', function(){
      changeMode1.val('textile').change();

      async(editor1, 'to_html', function(){
        start();
        ok(textarea1.val() === text, 'The text should not change, was ' + textarea1.val());
      });
    });
  });

  test('From div should work only, if the mode has toText or getText', function(){
    var dialogOpen, $textarea,
    $editor = $('.markupClick.haml');

    $editor.click();
    
    dialogOpen = false;
    helper1.handleDialog('notice', function(d){
      dialogOpen = true;
    });

    stop();

    async(function(){
      start();

      $textarea = $editor.parent().find('textarea');

      ok(!dialogOpen, 'loading from haml should not open dialog');
      ok(/server version/.test($textarea.val()), 'haml should load from server');
      ok($textarea.is(':visible'), 'textarea should be visible if loaded from file');
      equals($editor.parent().find('.changeDataMode').val(), 'haml', 'should set select to haml');

      $editor = $('.markupClick.unknown2');
      $textarea = $editor.find('textarea');

      $editor.click();
            
      dialogOpen = false;
      helper1.handleDialog('notice', function(d){
        dialogOpen = true;
        d.click('Ok');
      });

      ok(dialogOpen, 'loading from unknown without src should open dialog');

    });
  });

});
