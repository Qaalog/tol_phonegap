tol.service('header',['$rootScope',function($rootScope){
    
  var $header = this;
  
  $header.POST = 0;
  $header.SAVE = 1;
  
  $header.cancel = function(){};
  $header.post = function(){};
  $header.save = function(){};
  $header.doIt = function(){
    $rootScope.$broadcast('doItEvent');
  };
  $header.toggleSave = function(){};
  $header.togglePost = function(){};
  $header.switchPost = function(){};
  $header.toggleDoIt = function(){};
    
}]);