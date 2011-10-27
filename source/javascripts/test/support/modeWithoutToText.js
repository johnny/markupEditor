ME.addMode('modeWithoutToText', function(){
  return {
    name: "Basic Mode",
    toHTML: function(editor) {
      return editor.htmlDiv.html();
    }
  };
}());
ME.addMode('completeSyncMode', function(){
  return {
    name: "Sync Mode",
    toHTML: function(editor) {
      return editor.htmlDiv.html();
    },
    toText: function(editor) {
      return editor.htmlDiv.html();
    }
  };
}());
