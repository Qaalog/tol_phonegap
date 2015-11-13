tol.service('dialog',[function(){
    
  var $dialog = this;
  $dialog.INFO = 0;
  $dialog.QUESTION = 1;
  
  $dialog.create = function(){};
  $dialog.show = function(){};
  $dialog.hide = function(){};
  $dialog.call = function(){};
  
  $dialog.toggleUserMenu = function(){};
  $dialog.togglePhotoMenu = function(){};
  
  var actions = {};
  var actionId = 0;
  $dialog.action = function(action){
    for (var key in actions) {
      try {
        actions[key](action);
      } catch(e){}
    }
  };
  
  $dialog.addActionListener = function(callback) {
    actionId++;
    actions[actionId] = callback;
    return actionId;
  };
  
  $dialog.removeActionListener = function(actionIndex) {
    delete actions[actionIndex];
  };
  
}]);


