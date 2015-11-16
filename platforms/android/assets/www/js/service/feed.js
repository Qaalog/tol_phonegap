tol.service('feed',['network','$sce','page','dialog','facebook','userService','$rootScope','pager','lightbox',
  function(network,$sce,page,dialog,facebook,userService,$rootScope,pager,lightbox){
    
  var $feed = this;
  
  $feed.selectedFeedItem;
  
  $feed.getFeed = function(pagerOptions, params, callback) {
    callback = callback || function(){};
    params = params || {};
    
    network.get('post/',params,function(result, response){
      if (result) {
        callback(response);
      }
    },false,true);
    
//    page.hideLoader();
//    pager.start(document.getElementById('common_feed'));
  };
  
  $feed.getHtml = function(text) {
    return $sce.trustAsHtml(text);
  };
  
  $feed.deleteFeedItem = function(item) {
    
    dialog.create(dialog.QUESTION,'Delete your post?','Your post will be removed from the<br>news feed. Are you sure?','YES','NO',
      function(answer){

        if (answer) {
          console.log(item);
          $rootScope.$broadcast('post_deleting',item);
          var data = { deleted: 'X'

                     };
          network.post('post/'+item.id,data,function(result, response){
            if (result) {
              $rootScope.$broadcast('post_deleted');
              console.log(response);
            } else {
              $rootScope.$broadcast('post_delete_failed',item);
            }
          });
        }
      }).show();
         
  };
  
  $feed.editFeedItem = function(item) {
    page.show('post',{editItem:item});
  };
  

  dialog.addActionListener(function(action) {
    switch (action) {

      case 'edit_post':
        dialog.toggleUserMenu(false);
        $feed.editFeedItem($feed.selectedFeedItem);
        break;

      case 'delete_post':
        dialog.toggleUserMenu(false);
        $feed.deleteFeedItem($feed.selectedFeedItem);
        break;
    }
  });
  
  $feed.showShareMenu = function(feedItem, event) {
    page.setTabsVisiable(false);
    var img = angular.element(event.target).scope().imageElement;
    if (img.isLoaded)
      facebook.toggleShareMenu(true,feedItem,img);
  };
  
  $feed.userMenuShow = function(feedItem,index) {
    if (feedItem.from_product_id*1 !== userService.getProductId()) {
      return false;
    }
    feedItem.index = index;
    $feed.selectedFeedItem = feedItem;
    dialog.toggleUserMenu(true);
  };

  $feed.showWhoGivePoints = function(feedItem) {
    page.show('searchPage',feedItem);
  };
  
  $feed.showPictureInLightBox = function(href) {
    lightbox.showPicture(href);
  };

    
}]);