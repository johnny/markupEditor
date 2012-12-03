$(document).ready(function(){
  ME.setOptions({uri: ['www.google.com','www.example.com','index.html']});
  
  $(".markup").markupEditor({
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

  $(".markupUrlTest").markupEditor({
    denormalizeUrl: function (uri) {
      return "http://" + uri
    },
    normalizeUrl: function (uri) {
      return uri.replace(/http:\/\/(.*)/, "$1")
    }
  })

});
