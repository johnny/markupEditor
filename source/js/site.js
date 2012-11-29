$(document).ready(function(){
  ME.setOptions({uri: ['www.google.com','www.example.com','index.html']});
  
  $(".markup").markupEditor({
    denormalizeUrl: function (uri) {
      return "http://" + uri
    },
    normalizeUrl: function (uri) {
      return uri.replace(/http:\/\/(.*)/, "$1")
    }
  });

  $(".markupExternalSelect").markupEditor({
    select: $("#externalSelect select")
  });

  $(".markupExternalSelect2").markupEditor({
    select: $("#externalSelect2 select")
  });

  $("#wrongExternalSelect textarea").markupEditor({
    select: $("#wrongExternalSelect select")
  });

  $(".markupClick").markupEditor("prepare",{
    save: function(editor){
    },
    select: $("#externalSelect select.availableModes")
  });

});
