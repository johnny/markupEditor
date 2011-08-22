$(document).ready(function(){
  $(".markup").initMarkupEditor({
  });

  $(".markupClick").one("click", function(){
    $(this).initMarkupEditor({
      save: function(editor){
        console.log(editor);
        console.log(editor.textArea.val());
      }
    });
  });

  ME.setOptions({uri: ['www.google.com','www.example.com','index.html']});
});
