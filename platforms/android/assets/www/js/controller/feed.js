tol.controller('feed',['$scope','page','network','feed','userService','device', 'dialog',
  function($scope,page,network,feed,userService,device,dialog){

  var settings = { name:  'feed'
                 , chart: true
                 , tabs:  true
                 , search: true
                 };
                 
//  $scope.imgPrefix = network.servisePathPHP + '/GetCroppedImage?i=';
//  $scope.imgSuffix = '&h=256&w=256';
  $scope.imgPrefix = network.servisePathPHP + '/GetResizedImage?i=';
  $scope.imgSuffix = '&w=' + Math.round(device.emToPx(4));
  var repeat, savedInnerHeight = app.innerHeight;

  $scope.imgResizedPrefix = network.servisePathPHP + 'GetResizedImage?i=';
  $scope.imgResizedSuffix = '&w=' + Math.round(innerWidth - device.emToPx(2));
  
  page.onShow(settings,function(params) {
    $scope.authProductId = userService.getAuthProduct().id;
/*
    if (window.Babel) {
      window.Babel.init($scope.imgPrefix, $scope.imgSuffix, $scope);
    }
*/
    app.innerHeight = window.innerHeight;
    if (device.isIOS()) {
      page.setTabsVisiable(true,true);
    } else {
      page.setTabsVisiable(true); // fixed short container when application started with wrong orientation
    }

    window.correct = page.setTabsVisiable;
    app.protectHeader();
   
    $scope.getFeed(userService.getProductId(), params.needUpdate);
    $scope.product = userService.getAuthProduct();
    $scope.userProductId = userService.getProductId();
    $scope.hotelName = userService.getHotelName();
    //document.querySelector('.header').style.display = 'none';
    //document.querySelector('.footer-menu').style.display = 'none';
    
  });                
    
  $scope.$on('freeMemory',function(){
    $scope.feedItems = [];
  });
  
  var selectedFeedItem = false;
  $scope.givePoints = function(feedItem, isMultiRecongnitionPost) {
    
//    feedItem.pointsForPost = true;
//    if (!feedItem.from_product_id) feedItem.isAutoPost = true;
//    if (feedItem.from_product_id && feedItem.to_product_id) feedItem.isPointPost = true;
//    if (feedItem.to_product_list && feedItem.to_product_list.length > 0) {
//      page.show('givePoints',{ recognizeList: feedItem.to_product_list
//                             , isMultiRecongnitionPost: isMultiRecongnitionPost
//                             , pointsForPost: true
//                             , postId: feedItem.id
//                             });
//      return false;
//    }
//    page.show('givePoints',feedItem);
//    return false;
    
    selectedFeedItem = feedItem;
    var postType = 'normal';
    if (!selectedFeedItem.from_product_id) {
      selectedFeedItem.isAutoPost = true;
    }
    
    if (selectedFeedItem.from_product_id && selectedFeedItem.to_product_id) { //for backward compatibility with version 1.4
      selectedFeedItem.isPointPost = true;
      postType = 'recognition';
    }

    if (selectedFeedItem.post_type_id*1 === feed.RECOGNITION_POST) {
      selectedFeedItem.isPointPost = true;
      postType = 'recognition';
    }
    
    if (selectedFeedItem.post_type_id*1 === feed.MULTI_RECOGNITION_POST) {
      postType = 'recognition';
      console.log('feedItem',feedItem);
      selectedFeedItem = { recognizeList: feedItem.to_product_list
                         , isMultiRecongnitionPost: isMultiRecongnitionPost
                         , pointsForPost: true
                         , postId: feedItem.id
                         
                         , category_alias: feedItem.points_alias_characteristic
                         , points_alias: feedItem.points_alias
                         , points: feedItem.points
                         };
    }
    dialog.togglePointsMenu(true, postType);
    
  };
  
  dialog.addActionListener(settings.name, function(action) {
    delete selectedFeedItem.isQuotePost;
    switch (action) {

      case 'new_recognition':
        dialog.togglePointsMenu(false);
        
        delete selectedFeedItem.make_reinforce;
        selectedFeedItem.pointsForPost = true;
        
        page.show('givePoints',selectedFeedItem);
        break;
      case 'reinforce':
        dialog.togglePointsMenu(false);
        
        selectedFeedItem.make_reinforce = true;
        selectedFeedItem.pointsForPost = true;
        page.show('givePoints',selectedFeedItem);
        break;
      case 'quote':
        dialog.togglePointsMenu(false);
        selectedFeedItem.isQuotePost = true;
        page.show('givePoints',selectedFeedItem);
        break;
    }
  });
  
  $scope.getPostAge = page.getPostAge;
  $scope.getHtml = feed.getHtml;
  $scope.showShareMenu = feed.showShareMenu;
  $scope.userMenuShow = feed.userMenuShow;
  $scope.showWhoGivePoints = feed.showWhoGivePoints;
  $scope.showPictureInLightBox = feed.showPictureInLightBox;
  $scope.getStatusDescription = feed.getStatusDescription;
  $scope.getOtherCount = feed.getOtherCount;
  $scope.openTripAdviserPost = feed.openTripAdviserPost;
  $scope.isProductOneOfProductList = feed.isProductOneOfProductList;
  $scope.formatDate = feed.formatDate;
  $scope.getSharePermission = feed.getSharePermission;
  $scope.getYouGave = feed.getYouGave;
  $scope.preparePoints = feed.preparePoints;
  $scope.goToLink = feed.goToLink;
  
  $scope.showUserPosts = function(feedItem) {
    var productId = feedItem['from_product_id'] || feedItem['to_product_id'];
    
    if (feedItem['from_product_id'] && feedItem['to_product_id']) {
      productId = feedItem['to_product_id'];
    }
    
    if (productId*1 === userService.getProductId()) {
      page.show('profile',{tab: 'posts'});
      return false;
    }
    
    page.show('profile',{productId: productId, tab: 'posts'});
  };
  
  $scope.showPostDetails = function(feedItem) {
    page.show('postDetails', {postId: feedItem.id});
  };
  
  $scope.getFeed = function(id, needUpdate) {
    repeat = repeat || new ElRepeat(document.querySelector('#common_feed'));//Init of Valera's library
      window.repeat1 = repeat;
    var data = { 'my_product_id': id
               , 'feedId': 'common_feed'
               , 'loaderSelector': 'feed_loader'
               , 'topLoaderSelector': 'top_loader'
               , 'containerSelector': 'feed_container'
               , 'context': 'feed'
               , 'needUpdate': needUpdate
               };
    
    feed.getFeed(repeat,data,function(feedItems) {
      $scope.feedItems = feedItems;
      page.hideLoader();
    });
  };

}]);

