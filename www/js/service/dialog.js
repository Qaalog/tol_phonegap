tol.service('dialog',['page',function(page){
    
  var $dialog = this;
  $dialog.INFO = 0;
  $dialog.QUESTION = 1;
  
  $dialog.create = function(){};
  $dialog.show = function(){};
  $dialog.hide = function(){};
  $dialog.call = function(){};
  
  $dialog.toggleUserMenu = function(){};
  $dialog.togglePhotoMenu = function(){};
  $dialog.togglePointsMenu = function(){};
  $dialog.toggleToastMessage = function(){};
  
  var actions = {};
  var actionId = 0;
  $dialog.action = function(action){
    var pageId = page.currentPage;
    for (var key in actions[pageId]) {
      try {
        actions[pageId][key](action);
      } catch(e){}
    }
    for (var key in actions['all']) {
      try {
        actions['all'][key](action);
      } catch(e){}
    }
  };
  
  $dialog.addActionListener = function(pageId, callback) {
    actionId++;
    actions[pageId] = actions[pageId] || {};
    actions[pageId][actionId] = callback;
    return actionId;
  };
  
  $dialog.removeActionListener = function(actionIndex) {
    delete actions[actionIndex];
  };
  
}]);


