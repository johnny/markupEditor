(function(ME){
  // Do not include Enter, Backspace, Delete
  neutralKeys = "9.16.17.18.20.27.33.34.35.36.37.38.39.40.45.91.93.93";
  
  ME.util = {
    isNeutralKey: function (keyCode){
      return neutralKeys.indexOf(""+keyCode) != -1;
    },
    isRemovalKey: function (keyCode){
      return keyCode == 46 || keyCode == 8;
    }
  };
})(ME);
