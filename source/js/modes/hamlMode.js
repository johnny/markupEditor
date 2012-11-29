ME.addMode('haml', function(){
  var $ = jQuery;
  return {
    name: "Haml Mode",
    toHTML: function(editor, text, callback) {
      $.get('/api/markup/to_html', {
        type: 'haml',
        content: text
      }, function(html, status, response){
        console.log('to');
        callback(html)
        editor.container.trigger('to_html');
      });
    },
    toText: function(editor, html, callback) {
      $.get('/api/markup/from_html', {
        type: 'haml',
        content: html
      }, function(haml, status, response){
        console.log('from');
        callback(haml)
        editor.container.trigger('from_html');
      });
    }
  };
}());
