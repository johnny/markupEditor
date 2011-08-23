(function($) {
  // TODO cache fields
  var opts, errorMsgType, initialized,
  methods = {
    check: function(options) {
      var $this = this, valid = true;
      //Hide any errors that are already showing
      $this.find(opts.errorElement + '.' + opts.errorClass).remove();
      $this.find(':input.' + opts.inputErrorClass).removeClass(opts.inputErrorClass);

      //Get all the required inputs
      $this.find(':input.required').each(function() {
        var $input = $(this),
        fieldValue = $.trim($input.val()),
        labelText = $input.siblings('label').text().replace(opts.removeLabelChar, ''),
        errorMsg = '';
        
        //Check if it's empty or an invalid email
        if(fieldValue === '') {
	  errorMsg = hasLabelPlaceholder ? errorMsg = opts.errorText.replace('{label}',labelText) : errorMsg = opts.errorText;
	  valid = false;
        } else if($input.hasClass('email')) {
	  if(!(/^([_a-z0-9-]+)(\.[_a-z0-9-]+)*@([a-z0-9-]+)(\.[a-z0-9-]+)*(\.[a-z]{2,4})$/.test(fieldValue))) {
	    errorMsg = hasLabelPlaceholder ? errorMsg = opts.emailErrorText.replace('{label}',labelText) : errorMsg = opts.emailErrorText;
	    valid = false;
	  }
        }
        
        //If there is an error, display it
        if(errorMsg !== '') {
          $input.parent().addClass(opts.errorClass);
	  //$input.addClass(opts.inputErrorClass).after('<'+opts.errorElement+' class="'+opts.errorClass+'">' + errorMsg + '</'+opts.errorElement+'>');
        }
      });

      return valid;
    },
    reset: function(){
      return this.find(':input.required').each(function(){
        $(this).parent().removeClass(opts.errorClass);
      });
    }
  };

  /**
   * Validates forms
   *
   * @memberOf jQuery.prototype
   *
   * @param {String} [method="init"] The method to call
   */
  $.fn.isValid = function(method) {
    if (!methods[method]) {
      method = 'check';
    }
    return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
  };
  
  $.fn.isValid.init = function(options){
    opts = $.extend({}, $.fn.isValid.defaults, options);
    hasLabelPlaceholder = opts.errorText.indexOf("{label}") > -1;
  };

  // default options
  $.fn.isValid.defaults = {
    errorClass: 'error',
    errorText: '{label} is a required field.',
    emailErrorText: 'Please enter a valid {label}',
    errorElement: 'strong',
    removeLabelChar: '*'
  };
})(jQuery);
