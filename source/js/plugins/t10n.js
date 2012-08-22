!function(){
  var currentDefinition = {};
  
  ME.t10n = function(id){
    return currentDefinition[id];
  };

  ME.t10n.load = function(definition){
    currentDefinition = definition;
  };
}()
