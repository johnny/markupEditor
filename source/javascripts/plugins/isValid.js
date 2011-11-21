/**
 * Validate a given Form and display errors as tips, if formfields are
 * invalid.
 *
 * inspired by tipsy
 */
(function($, _) {
  var opts, errorMsgType, initialized;

  function Validator($form){
    this.$form = $form;
    
    //Get all the required inputs
    this.inputs = $form.find(':input.required');
  }

  Validator.prototype = {
    check: function() {
      var valid = true;

      this.reset(true);
      
      this.inputs.each(function() {
        var $input = $(this),
        fieldValue = $.trim($input.val()),
        labelText = $input.parent().prev().text(),
        errorMsg;
        
        //Check if it's empty or an invalid email
        if(fieldValue === '') {
          errorMsg = _('errorText') || opts.errorText;
	  valid = false;
        } else if($input.hasClass('email')) {
	  if(!(/^([_a-z0-9-]+)(\.[_a-z0-9-]+)*@([a-z0-9-]+)(\.[a-z0-9-]+)*(\.[a-z]{2,4})$/.test(fieldValue))) {
	    errorMsg = _('emailErrorText') || opts.emailErrorText;
	    valid = false;
	  }
        }
        
        //If there is an error, display it
        if(errorMsg) {
          errorMsg = errorMsg.replace('{label}',labelText);
          $input.parent()
            .addClass(opts.errorClass)
            .error('show', errorMsg);
        }
      });

      return valid;
    },
    reset: function(fadeOut){
      return this.inputs.each(function(){
        $(this).parent()
          .removeClass(opts.errorClass)
          .error('hide', fadeOut);
      });
    }
  };

  function get($element, constructor, dataField){
    var data = $element.data(dataField);
    if (!data) {
      data = new constructor($element);
      $element.data(dataField, data);
    }
    return data;
  }
  /**
   * Validates forms
   *
   * @memberOf jQuery.prototype
   *
   * @param {String} [method="check"] The method to call
   */
  $.fn.isValid = function(method, options) {
    var valid = true;

    this.each(function(){
      var validator = get( $(this), Validator, 'isValid');
      
      if (!validator[method]) {
        method = 'check';
      }
      
      valid = validator[method](options) ? valid : false;
    });
    
    return valid;
  };
  
  $.fn.isValid.init = function(options){
    opts = $.extend({}, $.fn.isValid.defaults, options);
  };

  // default options
  $.fn.isValid.defaults = {
    errorClass: 'error',
    errorText: '{label} is a required field.',
    emailErrorText: 'Please enter a valid {label}'
  };

  function Error($element) {
    this.$element = $element;
    this.$tip = $('<div class="error-tip"></div>')
      .html('<div class="arrow"></div><div class="inner"></div>')
      .prependTo(document.body);
  }
  
  Error.prototype = {
    opacity: 0.8,
    show: function(message) {
      var $tip = this.$tip;
      this.hidden = false;
      
      $tip.find('.inner').text(message);
      $tip.css({top: 0, left: 0, visibility: 'hidden', display: 'block'});
      
      var pos = $.extend({}, this.$element.offset(), {
        width: this.$element[0].offsetWidth,
        height: this.$element[0].offsetHeight
      });
      
      var actualHeight = $tip[0].offsetHeight;
      
      $tip.css({
        top: pos.top + pos.height / 2 - actualHeight / 2,
        left: pos.left + pos.width
      });

      $tip.stop().css({opacity: 0, display: 'block', visibility: 'visible'})
        .animate({opacity: this.opacity});
    },
    
    hide: function(fadeOut) {
      var that = this;
      if(this.hidden){
        return;
      }
      if (fadeOut) {
        this.$tip.stop().fadeOut(function() { that.hidden = true; });
      } else {
        this.$tip.hide();
        this.hidden = true;
      }
    }
  };

  function getError($ele) {
    var error = $ele.data('error');
    if (!error) {
      error = new Error($ele);
      $ele.data('error', error);
    }
    return error;
  }

  $.fn.error = function(method, options) {
    return this.each(function(){
      get( $(this), Error, 'error' )[method](options);
    });
  };
})(jQuery, ME.t10n);
