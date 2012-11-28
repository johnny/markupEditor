ME.addMode('haml', function(){
  var $ = jQuery;
  return {
    name: "Haml Mode",
    toHTML: function(editor, callback) {
      $.get('/api/markup/to_html', {
        type: 'haml',
        content: editor.textarea.val()
      }, function(html, status, response){
        console.log('to');
        editor.preview.html(html);
        if(callback){
          callback();
        }
        editor.container.trigger('to_html');
      });
    },
    toText: function(editor, callback) {
      $.get('/api/markup/from_html', {
        type: 'haml',
        content: editor.preview.html()
      }, function(haml, status, response){
        console.log('from');
        editor.textarea.val(haml);
        if(callback){
          callback();
        }
        editor.container.trigger('from_html');
      });
    }
  };
}());
