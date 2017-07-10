tol.controller('notification',['$scope', 'page', 'userService', 'feed', 'network', 'device', 'dialog','notification','$sce',
  function($scope, page, userService, feed, network, device, dialog, notification,$sce){
    
  var settings = { name:  'notification'
                 , chart: true
                 , tabs:  true
                 , search: true
                 };

  page.onShow(settings,function(params) {
    getNotifications();
    $scope.hotelName = userService.getHotelName();
    $scope.selectedCatalog = userService.getCatalogSelected();
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
    if ((item.notification_type && item.notification_type.toUpperCase() === 'CUSTOMPOST') || (item.auto_post_name && feed.AUTO_POSTS.indexOf(item.auto_post_name.toUpperCase())!==-1)) {
        return $scope.selectedCatalog.image_url?$scope.imgPrefix + ($scope.selectedCatalog.image_url) + $scope.imgSuffix : 'img/icon_custom.svg';
    }
    return (item.by_product_image) ? $scope.imgPrefix + item.by_product_image + $scope.imgSuffix : 'img/default-staff.png';
  };

  $scope.prepareMessage = function(item){
      text = item.notification_message?item.notification_message:'';
      if(!text) return '';
      if(item.auto_post_name && feed.AUTO_POSTS.indexOf(item.auto_post_name.toUpperCase())!==-1){
          text = text.split('\\"').join('&quot;');
          text = text.split("\\\\'").join('&lsquo;');
          text = text.split('\\\\').join('\\');
          if(item.by_product_name){
              text = text.split('##user##').join('<span class="user-name">'+item.by_product_name+'</span>');
          }
          text = text.split('##user##').join('');
          text = text.split('##').join('</br>');
      } else {
          text = '<span class="user-name">'+(item.by_product_name?item.by_product_name:'')+'</span>'+' '+item.notification_message;
      }
      return $sce.trustAsHtml(text);
  }
}]);


