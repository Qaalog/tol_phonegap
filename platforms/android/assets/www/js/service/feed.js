tol.service('feed',['network','$sce','page','dialog','facebook','userService','$rootScope','pager','lightbox','pagerItera','$filter',
  function(network,$sce,page,dialog,facebook,userService,$rootScope,pager,lightbox,pagerItera,$filter){
    
  var $feed = this;
  $feed.postDetailUpdateStart = function(){};
  $feed.postDetailUpdateStop = function(){};
  var currentRepeat, currentScope, repeatsList = {};
  
  /* CONST */
  
  $feed.NORMAL_POST = 1;
  $feed.RECOGNITION_POST = 2;
  $feed.QUOTE_POST = 3;
  $feed.REINFORCE_POST = 4;
  $feed.URL_POST = 5;
  $feed.MULTI_RECOGNITION_POST = 6;
  
  $feed.EDITED_POST = 1;
  $feed.GIVED_POINTS = 2;
  
  
  /* END CONST*/
  
  $feed.selectedFeedItem;
  
  $feed.getFeed = function(repeat, params, callback) {
    callback = callback || function(){};
    params = params || {};
    currentScope = params.scope;
    currentRepeat = repeat;
    repeatsList[params.context] = repeat;

    var options = { 'loaderSelector': params.loaderSelector
                  , 'containerSelector': params.containerSelector
                  , 'topLoaderSelector': params.topLoaderSelector
                  , 'for_product_id': params['for_product_id']
                  , 'context': params.context
                  , 'needUpdate': params.needUpdate
                  , 'callback': function() {
                      page.hideLoader();
                    }
                  };
      

    pager.start(document.getElementById(params.feedId), repeat, options);
    
    //page.hideLoader();
    
    //pagerItera.start(document.getElementById(params.feedId), repeat, options);
    
//    network.post('post/getEarlier?my_product_id='+userService.getProductId(),{limit:10},
//      function(result,response){
//        page.hideLoader();
//        if (result) {
//          console.time('React render: ');
//          window.Babel.render(response);
//          console.timeEnd('React render: ');
//        }
//
//      });
    
  };
  
  $feed.getHtml = function(text) {
    if (!text) return '';
    return $sce.trustAsHtml(text);
  };
  
  $feed.deleteFeedItem = function(item) {
    
    dialog.create(dialog.QUESTION,'Delete your post?','Your post will be removed from the<br>news feed. Are you sure?','YES','NO',
      function(answer){

        if (answer) {
          
          console.log(item);
          
          //currentRepeat.deleteItem(item);
          for (var key in repeatsList) {
            console.log(key);
            repeatsList[key].deleteItem(item);
          }
          
         // $rootScope.$broadcast('post_deleting',item);
         
          var data = { deleted: 'X'

                     };
          network.post('post/'+item.id,data,function(result, response){
            if (result) {
              //$rootScope.$broadcast('post_deleted');
              
              //network.post('post/'+item.id,{deleted: null},function(result, response){});
              console.log(response);
            } else {
              //$rootScope.$broadcast('post_delete_failed',item);
            }
          });
          
        }
      }).show();
         
  };
  
  $feed.editFeedItem = function(item) {
    page.show('post',{editItem:item});
  };
  
  $feed.updatePost = function (repeat,post,linkName) {
    var items = repeat.getAllItems();
    var item = null;
    
    for (var i = 0, l = items.length; i < l; i++) {
      if (post.id === items[i][linkName].id) {
        item = items[i][linkName];
        break;
      }
    }
    
    if (item !== null) {
      item.message = post.message;
      item.points = post.points;
      repeat.recompileElement(item);
    }
  };
  

  dialog.addActionListener('all',function(action) {
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
    //var img = angular.element(event.target).scope().imageElement;
    var root = findParentElement(event.target,'post-box');
    var img = root.querySelector('img');
    if (img.isLoaded)
      facebook.toggleShareMenu(true,feedItem,img);
  };
  
  $feed.userMenuShow = function(feedItem) {
    if (feedItem.from_product_id*1 !== userService.getProductId()) {
      return false;
    }
//    feedItem.index = index;
    $feed.selectedFeedItem = feedItem;
    dialog.toggleUserMenu(true);
  };

  $feed.showWhoGivePoints = function(feedItem) {
    page.show('searchPage',feedItem);
  };
  
  $feed.showPictureInLightBox = function(href) {
    lightbox.showPicture(href);
  };
  
  $feed.getStatusDescription = function(feedItem) {
    feedItem.status_id = feedItem.status_id * 1;
    
    if (feedItem.status_id === 0) {
      return '';
    }
    
    if (feedItem.status_id === $feed.EDITED_POST) {
      return feedItem.from_product_name + ' edited post message';
    }
    
//    if (feedItem.post_type_id*1 === $feed.MULTI_RECOGNITION_POST && feedItem.status_id === $feed.GIVED_POINTS) {
//      if (feedItem.to_product_list.length > 2) {
//        return feedItem.to_product_list[0].to_product_name + ', ' + feedItem.to_product_list[1].to_product_name +
//                ' and ' + $feed.getOtherCount(feedItem.to_product_list) + ' recognized by ' + feedItem.from_product_name;
//      } else {
//        return feedItem.to_product_list[0].to_product_name + ', ' + feedItem.to_product_list[1].to_product_name + ' recognized by ' + feedItem.from_product_name;
//      }
//    
//    }
    if (feedItem.post_type_id*1 === $feed.MULTI_RECOGNITION_POST && feedItem.status_id === $feed.GIVED_POINTS) {
      return '';
    }
    
    if (feedItem.status_id === $feed.GIVED_POINTS) {
      return feedItem.to_product_name + ' recognized by ' + feedItem.from_product_name;
    }
  };
  
  $feed.getOtherCount = function(products) {
    var count = products.length - 2;
    if (count < 1) return false;
    if (count === 1) return '1 other';
    return count + ' others';
  };
  
  $feed.openTripAdviserPost = function(url) {
    window.open(url, '_system');
  };
  
  $feed.isProductOneOfProductList = function(productList) {
    for (var i = 0, ii = productList.length; i < ii; i++) {
      if (userService.getAuthProduct().id*1 === productList[i].to_product_id*1 
              || userService.getAuthProduct().id*1 === productList[i].from_product_id*1) {
        return true;
      }
    }
    return false;
  };
  
  $feed.formatDate = function(dateTime) {
    var date = dateTime.split(' ')[0];
    return $filter('date')(date, 'dd MMM yyyy');
  };
  
  $feed.getSharePermission = function(feedItem) {
  if (feedItem.can_share*1 > 0) {
    return true;
  }
  
    
//    if (feedItem.post_type_id*1 === $feed.RECOGNITION_POST) {
//      if (feedItem.from_product_id*1 !== userService.getAuthProduct().id*1 || feedItem.to_product_id*1 !== userService.getAuthProduct().id*1) {
//        return false;
//      }
//    }
   
    if (feedItem.from_product_id*1 !== userService.getAuthProduct().id*1) {
     // console.log(productTypeId, feedItem.post_type_id*1, feedItem.message);
       return false;
    }
    
    return true;
  };
  
  $feed.getYouGave = function(feedItem) {
    return 'You gave ' + (feedItem['my_points'] || 0) + ((feedItem['my_points'] == 1) ? ' point' : ' points');
  };
  
  $feed.preparePoints = function(feedItem) {
    return (feedItem.points || 0) + ((feedItem.points*1 === 1) ? ' point' : ' points');
  };

  $feed.goToLink = function(url) {
    window.open(url, '_system');
  };
    
}]);