function fireEvent(element, eventName){
  $(element)[eventName]();
}
$(function(){
  form = $("form#textile");
  textArea = form.find("textarea");

  textile = new TextileHelper({
    form: form,
    textArea: textArea
  });
});
