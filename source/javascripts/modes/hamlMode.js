ME.addMode('haml', function(){
  var $ = jQuery;
  return {
    name: "Haml Mode",
    toHTML: function(editor, callback) {
      $.get('/api/markup/to_html', {
        type: 'haml',
        content: editor.textArea.val()
      }, function(html, status, response){
        editor.preview.html(html);
        if(callback){
          callback();
        }
      });
    },
    toText: function(editor, callback) {
      $.get('/api/markup/from_html', {
        type: 'haml',
        content: editor.preview.html()
      }, function(haml, status, response){
        editor.textArea.val(haml);
        if(callback){
          callback();
        }
      });
    }
  };
}());
