tol.controller('feed',['$scope','page','network','feed','userService',
  function($scope,page,network,feed,userService){
  
  
  
  var settings = { name:  'feed'
                 , chart: true
                 , tabs:  true
                 , search: true
                 };
                 
  $scope.imgPrefix = network.servisePathPHP + '/GetCroppedImage?i=';
  $scope.imgSuffix = '&h=256&w=256';
  
  page.onShow(settings,function(params) {
    
    console.log('feed params',params);
    
    $scope.getFeed(userService.getProductId());
    $scope.product = userService.getAuthProduct();
    $scope.hotelName = userService.getHotelName();
  });                
    
  $scope.$on('freeMemory',function(){
    $scope.feedItems = [];
  });
  
  $scope.givePoints = function(feedItem) {
    feedItem.pointsForPost = true;
    page.show('givePoints',feedItem);
  };
  
  $scope.getPostAge = page.getPostAge;
  $scope.getHtml = feed.getHtml;
  $scope.showShareMenu = feed.showShareMenu;
  $scope.userMenuShow = feed.userMenuShow;
  $scope.showWhoGivePoints = feed.showWhoGivePoints;
  $scope.showPictureInLightBox = feed.showPictureInLightBox;
  
  $scope.$on('post_deleting',function(event,item){
    if (!$scope.feedItems) return false;
    if ($scope.feedItems.length < 1) return false;
    $scope.feedItems.splice(item.index,1);
  });
  
  $scope.$on('post_delete_failed',function(event,item){
    if (!$scope.posts) return false;
    if ($scope.posts.length < 1) return false;
    $scope.posts.splice(item.index,0,item);
    //$scope.$digest();
  });
  
  $scope.showUserPosts = function(feedItem) {
    page.show('profile',{productId: feedItem['from_product_id'], tab: 'posts'});
  };
  
  $scope.getFeed = function(id) {
    feed.getFeed({},{'my_product_id': id},function(feedItems) {
      $scope.feedItems = feedItems;
      page.hideLoader();
    });
  };
  
  
  
//  $scope.getProductId = function() {
//    if (userService.getProductId()) {
//      getFeed(userService.getProductId());
//      return false;
//    }
//    console.log('GET');
//    network.get('product/',{code:userService.getUser().username},function(result,response){
//      if (result) {
//          if (!response[0].image_url || response[0].image_url == null) {
//            page.requestFBAvatar();
//          }
//          userService.setProductId(response[0].id);
//          userService.setAvatar(response[0].image_url);
//          console.log(userService.getProductId());
//          $scope.product = response[0];
//          
//          getFeed(response[0].id);
//          
//      } else {
//        var user = userService.getUser();
//        delete user['catalog_id'];
//        page.show('catalog',user);
//        page.navigatorClear();
//      }
//    },false,true);  
//  };
  
}]);

