function fireEvent(element, eventName){
  $(element)[eventName]();
}
$(function(){
  form = $("form#textile");
  textarea = form.find("textarea");

  textile = new TextileHelper({
    form: form,
    textarea: textarea
  });
});
