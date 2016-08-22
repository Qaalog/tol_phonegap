tol.service('notification',[function(){
  var $notification = this;
  
  $notification.incCount = function(){};
  $notification.decCount = function(){};
  $notification.getCount = function(){};
  $notification.setCount = function(){};
  $notification.getNewNotificationCount = function(){};
  $notification.clear = function() {
    $notification.setCount(0);
    try {
      cordova.plugins.notification.badge.clear();
    } catch (e) {};
  };
  
}]);