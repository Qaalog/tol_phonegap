tol.controller('notification',['$scope', 'page', 'userService', 'feed', 'network', 'device', 'dialog','notification',
  function($scope, page, userService, feed, network, device, dialog, notification){
    
  var settings = { name:  'notification'
                 , chart: true
                 , tabs:  true
                 , search: true
                 };

  page.onShow(settings,function(params) {
    getNotifications();
    $scope.hotelName = userService.getHotelName();
  });
  
  $scope.imgPrefix = network.servisePathPHP + 'GetResizedImage?i=';
  $scope.imgSuffix = '&w=' + Math.round(innerWidth - device.emToPx(2));
  $scope.getPostAge = page.getPostAge;
  

  function getNotifications() {
    page.toggleNoResults(false);
    var data = { product_id: userService.getAuthProduct().id
      
               };
    network.post('post_notification/getFeed', data, function(result, response) {
      notification.clear();
      page.hideLoader();
     // notification.getNewNotificationCount(userService.getAuthProduct().id);
      if (result) {
        if (response.length < 1) {
          page.toggleNoResults(true);
        }
        $scope.notifications = response;
      }
    });
  }
  
  $scope.postDetail = function(note) {
    if (!note.read_at && !note.id) {
      createNotification(note, function() {
        notification.getNewNotificationCount(userService.getAuthProduct().id);
      });
    }
    if (note.id) {
      updateNotification(note, function() {
        if (!note.read_at) {
          notification.getNewNotificationCount(userService.getAuthProduct().id);
        }
      });
    }
    page.show('postDetails', {postId: note.notification_post_id});
  };
  
  function createNotification(note, callback) {
    callback = callback || function(){};
    var data = { post_id: note.notification_post_id
               , product_id: userService.getAuthProduct().id
               , read_at: 'now()'
               };
    network.put('post_notification',data, callback);
  }
  
  function updateNotification(note, callback) {
    callback = callback || function(){};
    var data = { read_at: 'now()'
               };
    network.post('post_notification/' + note.id,data, callback);
  }
  
  $scope.getAvatar = function(item) {
    if (item.notification_type === 'TripAdvisor') {
      return 'img/icon_tripadvisor.svg';
    }
    if (item.notification_type === 'BookingCom') {
      return 'img/icon_booking.svg';
    }
    return (item.by_product_image) ? $scope.imgPrefix + item.by_product_image + $scope.imgSuffix : 'img/default-staff.png';
  };

}]);


