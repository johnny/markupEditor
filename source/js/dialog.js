(function($, _){
  var callback,
  loadedDialogs = {},
  dialogFields = {
    link: [
      ['title', {
        required: true
      }],
      ['uri', {
        combobox: {key: 'uri'},
        required: true
      }]
    ],
    insertImage: [
      ['imageUri', {
        combobox: {key: 'imageUri'},
        required: true
      }],
      ['title'],
      ['uri', {
        combobox: {key: 'uri'}
      }]
    ]
  }

  $.fn.isValid.init();
  
  function Proxy($dialogNode, $textNode){
    this.body = $dialogNode.find('.modal-body')
    this.footer = $dialogNode.find('.modal-footer')
    this.dialogNode = $dialogNode
    this.textNode = $textNode;
  }
  
  Proxy.prototype = {
    show: function (buttons, values, cb) {
      this.setButtons(buttons);
      if(typeof values === 'string')
        this.setText(values)
      else if(values)
        this.setValues(values)
      if(cb){
        callback = cb;
      }
      this.dialogNode.modal('show');
    },
    find: function(query){
      return this.dialogNode.find(query);
    },
    setButtons: function(buttons){
      var html = '',
      i = buttons.length;
      while(i--){
        html = html + '<a class=\"btn ' + buttons[i].toLowerCase() + '\">' + buttons[i] + '</a>'
      }
      this.footer.html(html)
    },
    setText: function(text){
      if(this.textNode){
        this.textNode.html(text);
      }
    },
    setValues: function(values){
      for(var field in values)
        this.find(field).val(values[field])
    }
  };

  function initDialog($dialogNode){
    var $textNode = $dialogNode.append('<p>');
    
    $dialogNode.modal().on('hidden', function() {
      if(callback && callback.close){
        callback.close();
      }
    }).on('click', '.ok', function(){
      if(callback && callback.submit){
        callback.submit();
      }
      $dialogNode.modal("hide");
    });

    return new Proxy($dialogNode, $textNode);
  }

  function initFormDialog($dialogNode, fieldDefinitions){
    var fieldsLength = fieldDefinitions.length,
    $form = $('<form>').appendTo($dialogNode.find('.modal-body')),
    fields = initFields($form, fieldDefinitions);
    
    var submit = function() {
      var args = [],i;
      for(i=0; i < fieldsLength; i++){
        args[i] = fields[i].submit().val();
      }
      if($form.isValid()){
        callback.submit.apply(this,args);
        $dialogNode.modal("hide");
      }
    };

    $dialogNode.modal().on('hidden', function() {
      $form.isValid('reset');
      if(callback.close){
        callback.close();
      }
      for(var i = 0; i < fieldsLength; i++){
        fields[i].val('')
          .removeAttr('checked')
          .removeAttr('selected');
      }
    }).on('show', function(){
      for(var i = 0; i < fieldsLength; i++){
        fields[i].change();
      }
      fields[0][0].setSelectionRange(0,0);
    }).on('click', '.create, .update', submit)
      .on('click', '.remove', function(){
        callback.remove();
        $dialogNode.modal("hide");
      })

    return new Proxy($dialogNode);
  }

  function initFields($form, fieldDefinitions){
    var jQueryFunctions, fieldName, method, args, i,
    fields = [],
    fieldsLength = fieldDefinitions.length;
    
    for(i=0; i < fieldsLength; i++){
      fieldName = fieldDefinitions[i][0];
      jQueryFunctions = fieldDefinitions[i][1];
      
      $form.append(
        '<label for=\"' + fieldName + '\">'+ _(fieldName) + '</label>'
      );
      fields[i] = $('<input type=\"text\" class=\"' + fieldName + '\" name=\"' + fieldName + "\">")
        .appendTo($form);
      
      fields[i].enhanceTextfield({prompt: _(fieldName+"Prompt")});
      
      if(jQueryFunctions){
        for(method in jQueryFunctions){
          args = jQueryFunctions[method];
          fields[i][method](args);
        }
      }
    }
    return fields;
  }

  function createDialog(name, fieldDefinitions){
    var $dialogNode, proxy;

    $dialogNode = $('<div id='+ name + '-dialog class=modal>')
      .append('<div class=modal-header><a class=close data-dismiss=modal>x</a><h3>' + _(name + "Title") + '</h3></div>')
      .append('<div class=modal-body>')
      .append('<div class=modal-footer>')
      .on('click', '.cancel', function(){
        $dialogNode.modal("hide");
      })

    if(fieldDefinitions){
      proxy = initFormDialog($dialogNode, fieldDefinitions);
    } else {
      proxy = initDialog($dialogNode);
    }

    return proxy;
  }

  function  getDialog(name) {
    if(!loadedDialogs[name])
      loadedDialogs[name] = createDialog(name, dialogFields[name])
    return loadedDialogs[name]
  }

  ME.showDialog = function(name, buttons, values, callback) {
    getDialog(name).show(buttons, values, callback)
  }
  
})(jQuery, ME.t10n);
