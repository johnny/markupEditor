$(document).ready(function(){
  $(".markup").markupEditor({
  });

  $(".markupExternalSelect").markupEditor({
    select: $("#externalSelect select")
  });

  $(".markupExternalSelect2").markupEditor({
    select: $("#externalSelect2 select")
  });

  $(".markupClick").markupEditor("prepare",{
    save: function(editor){
      console.log(editor);
      console.log(editor.textArea.val());
    }
  });

  ME.setOptions({uri: ['www.google.com','www.example.com','index.html']});
});
