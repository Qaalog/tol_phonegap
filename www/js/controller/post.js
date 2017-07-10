tol.controller('post',['$scope','$timeout','page','network','facebook','device','header','dialog','userService','imageUpload','lightbox','pager',
  'analytics','feed','$sce',
  function($scope,$timeout,page,network,facebook,device,header,dialog,userService,imageUpload,lightbox,pager,analytics,feed,$sce){
  
  var postNow;
  
  var previewCanvas = document.getElementById('test_canvas');
  var img;
  var angles = [0,90,180,-90];
  var anglePointer = 0;
  
  var onImageLoad = function(data,result) {
    anglePointer = 0;
    $scope.isPostLoaderShow = true;
    $scope.postBody['media_data'] = data['media_data'];
    loaded();
    img = new Image();
    img.src = result;
    img.onload = function() {
      $timeout(function(){
        $scope.isURL = false;
        document.getElementById('file_selector_input').remove();

        imageUpload.rotate(previewCanvas, img, '#post_preview_wrap', 0);

        $scope.isPostLoaderShow = false;
      });
    };
    
    $timeout(function(){
      $scope.validatePost();
    });
    console.log($scope.postBody);
  };
  
  
  //$scope.imgPrefix = network.servisePathPHP + '/GetCroppedImage?i=';
  $scope.imgPrefix = network.servisePathPHP + '/GetResizedImage?i=';
  $scope.imgSuffix = '&h=256&w=256';
  $scope.isExternalPost = false;
  $scope.hotelName = userService.getHotelName();
  $scope.formatDate = feed.formatDate;
  $scope.tripAdvisorHtml = function(textToHTML){
    return $sce.trustAsHtml(textToHTML);
  };

  cleanPostBody();
  $scope.$watch('postBody.message',function(newVal,oldVal){
    newVal = newVal.replace(/<.*>/gim,'');
    newVal = newVal.replace(/^/gim,'<br>');
    newVal = newVal.replace(/<br>/,'');

    if(newVal.length>250) $scope.postBody.message = oldVal;
  });
  $scope.rotate = function() {
    anglePointer++;
    if (anglePointer > 3) anglePointer = 0;
    imageUpload.rotate(previewCanvas, img, '#post_preview_wrap', angles[anglePointer]);
  };

  var onSuccess = function(imageData) {
        $scope.isURL = false;
        $scope.isPostLoaderShow = true;
        img = new Image();
        img.src = 'data:image/jpeg;base64,'+imageData;
        loaded();
        //TODO here we can resize image to needed sizes
        img.onload = function() {
          $timeout(function() {
            imageUpload.rotate(previewCanvas, img, '#post_preview_wrap', 0);
            $scope.isPostLoaderShow = false;
          });
          
        };
        $scope.postBody['media_data']['content'] = imageData;
        $scope.postBody['media_data']['mime_type'] = 'image/jpeg';
        $timeout(function(){
          $scope.validatePost();
        });

  };

  var onFail = function(message) {
    console.error(message);
    $scope.validatePost();
  };
  
  $scope.validatePost = function() {
    if ($scope.postBody.message && ($scope.postBody['media_data'].content || $scope.params.editItem || $scope.postBody.media_url) ) {
      header.togglePost(true);
      header.toggleSave(true);
      return true;
    } else {
      header.togglePost(false);
      header.toggleSave(false);
      return false;
    }
  };
  
  
  var settings = { name:  'post'
                 , title: 'Post'
                 , tabs:  true
                 , post: true
                 };  
  
  page.onShow(settings,function(params) {
    $scope.isExternalPost = false;
    if(params.editItem && typeof params.editItem.parent_post != 'undefined' && ['BookingCom','TripAdvisor'].indexOf(params.editItem.parent_post.auto_post_name)!==-1){
      $scope.isExternalPost = true;
    }
    imageUpload.setOnSucces(onSuccess);
    imageUpload.setOnFail(onFail);
    $scope.isURL = false;
    anglePointer = 0;
    $scope.isPostLoaderShow = false;
    page.setCheckBox('post_switcher',false);
    page.setCheckBox('other_can_share_switcher',false);
    page.setCheckBox('send_notification_switcher',false);
    $scope.postToFB = (page.getSwitchState('post_switcher'))? 1 : 0;
    previewCanvas = document.getElementById('test_canvas');
    $scope.otherCanShare = (page.getSwitchState('other_can_share_switcher')) ? 1 : 0;
    $scope.sendNotification = (page.getSwitchState('send_notification_switcher')) ? 1 : 0;
    header.togglePost(false);
    header.save = postNow;
    $scope.userAvatar = userService.getAvatar();
    $scope.hideSendNotification = true;
    if(userService.checkForAdmin(userService.getAuthProduct().characteristics)){
        $scope.hideSendNotification = false;
    }
    page.hideLoader();
    $scope.isEdit = (params.editItem) ? true : false;

    $scope.params = params;
    
    if (params.editItem) {
      $scope.isPostLoaderShow = true;
      page.changePageSettings({ cancel: true
                              , title: 'Post'
                              , tabs:  true
                              , post: true
                              });

      $scope.postBody.message = params.editItem.message?params.editItem.message.replace(/<br>/gim,''):'';
      $scope.postBody.message = $scope.postBody.message.split('\\"').join('"');
      $scope.postBody.message = $scope.postBody.message.split('\\\\').join('\\');

      console.log(params.editItem.$$element);
      var img = params.editItem.$$element.querySelector('.main_image');
      $timeout(function(){
        if(img){
          imageUpload.rotate(previewCanvas, img, '#post_preview_wrap', 0);
          $scope.isPreviewCanvasShow = true;
        }
        $scope.isPostLoaderShow = false;

      });
      
      header.switchPost(header.SAVE);
      $scope.validatePost();
      var fileInput = document.getElementById('file_selector_input');
      if (fileInput) {
        fileInput.remove();
      }
      return false;
    }
    
    if (device.isWindows()) {
      var fileSelector = document.getElementById('file_selector_input');
      if (!fileSelector)
        imageUpload.addFileInput('file_selector_input','post_preview_wrap',onImageLoad);//addFileInput();
    }

    header.switchPost(header.POST);
  });
  
  $scope.$on('freeMemory',function(){
    header.togglePost(true);
    header.toggleSave(true);
  });
  
    
//  function clearImageBox() {
//    $timeout(function(){
//      $scope.isPreviewCanvasShow = false;
//      $scope.isPostLoaderShow = false;
//      delete $scope.postBody.media_url;
//      $scope.postBody['media_data'] = {};
//      $scope.validatePost();
//    });
//  }
  
  function loaded() {
    anglePointer = 0;
    $scope.isPostLoaderShow = false;
    $scope.isPreviewCanvasShow = true;
  }
 
  var parseTimerId = false;
  $scope.parseMessage = function(message) {
    if ($scope.isEdit) return false;
    
    imageUpload.parseMessage(message, function(caption) {
      console.log('caption',caption);
      
      if (caption) {
        $scope.caption = caption;
        var img = new Image();
            img.src = caption.urlImage;
            img.onload = function() {
              $timeout(function(){
                $scope.isURL = true;
                loaded();
                imageUpload.rotate(previewCanvas, img, '#post_preview_wrap', 0);
                $scope.postBody.media_url = caption.urlImage;
                $scope.validatePost();
              });
            };
            img.onerror = function() {
              img.src = 'img/error.png';
              $scope.caption.urlImage = 'img/error.png';
            };
            $scope.postBody.attachment = caption;
      } else {
        $timeout(function() {
          $scope.isPostLoaderShow = false;
        });
      }
      
    }, function() {
      console.log('take');
      $scope.isPostLoaderShow = true;
    });
    
  };
  
  $scope.showPictureInLightBox = lightbox.showPicture;
  
  $scope.toggleCheckBox = function(event) {
    page.toggleCheckBox(event);
    $scope.postToFB = page.getSwitchState('post_switcher');
    $scope.otherCanShare = (page.getSwitchState('other_can_share_switcher')) ? 1 : 0;
    $scope.sendNotification = (page.getSwitchState('send_notification_switcher')) ? 1 : 0;
  };
  
  function cleanPostBody() {
    $scope.postBody = { message:      ''
                      , from_product_id: userService.getProductId()
                      , media_data: { content:   ''
                                    , mime_type: ''
                                    , rotate: 0
                                    }
                      , post_type_id: feed.NORMAL_POST
                      };
    

    $scope.isPreviewCanvasShow = false;

  };
  
  $scope.$on('freeMemory',function(){
    cleanPostBody();
  });
  
  $scope.addPhoto = function() {
    document.getElementById('post_textarea').blur();
    if (navigator.camera && !$scope.params.editItem) dialog.togglePhotoMenu(true);
  };

  var doPostToFb = function(params) {
    network.put('post',params,function(result, response){
      if (result) {
        console.log(response);
        var data = { message: params.message
                   , link: response.media_url
                   };
        var createdItem = response;
        facebook.api('POST','me/feed',data,function(result, response){
          if(result){
            console.log('send',result, response);
            cleanPostBody();

            //TODO add after sprint 6 -
            if(createdItem && createdItem.id){
              var data = {
                'id': createdItem.id
                , 'product_id': userService.getProductId()
                , 'mark_id': feed.LIKE_TYPE_FACEBOOK
              };
              network.post('post/addMark/', data, function (result, response) {
                if (result) {
                  if (typeof response.marks !== 'undefined') {
                    createdItem.marks = response.marks;
                  } else {
                    delete createdItem.marks;
                  }
                  createdItem.mark_count = response.mark_count * 1;
                }
              });
            }
            network.pagerReset();
            page.show(app.mainPage,{needUpdate: true});
            dialog.create(dialog.INFO, 'Thanks!', 'Your post was successfully<br/>published in Facebook', 'OK', null).show();
          } else {
            network.pagerReset();
            page.show(app.mainPage,{needUpdate: true});
            //dialog.create(dialog.INFO, 'Thanks!', 'Your post was successfully<br/>published in Facebook', 'OK', null).show();
          }
        });
      }
    });
  };
  
  postNow = function() {
    if($scope.validatePost()){
      page.showLoader();
      console.log('post now');

      console.log('timer');

      if ($scope.postBody['media_data']) {
        if (angles[anglePointer] === 90) {
          $scope.postBody['media_data'].rotate = -90;
        } else if (angles[anglePointer] === -90) {
          $scope.postBody['media_data'].rotate = 90;
        } else {
          $scope.postBody['media_data'].rotate = angles[anglePointer];
        }
      }

      $scope.postBody.message = $scope.postBody.message.replace(/<.*>/gim,'');
      $scope.postBody.message = $scope.postBody.message.replace(/^/gim,'<br>');
      $scope.postBody.message = $scope.postBody.message.replace(/<br>/,'');
      $scope.postBody.message = $scope.postBody.message.replace(/\\+$/,'');

      $scope.postBody.can_share = $scope.otherCanShare;
      if($scope.sendNotification){
          $scope.postBody.send_push = $scope.sendNotification;
          $scope.postBody.post_type_id = feed.NORMAL_POST_WITH_PUSH;//To show this post in notification feed for Oleg
      } else {
        delete $scope.postBody.send_push;
      }
      console.log($scope.postBody.message);

      if ($scope.params.editItem) {
        var postData = { message: $scope.postBody.message
          , can_share: $scope.otherCanShare
          , status_id: feed.EDITED_POST
          , update_reason: '<strong data-touch=showProfile('+userService.getAuthProduct().id+')>' +userService.getAuthProduct().name + '</strong>' +' edited post message'
        };
        if($scope.sendNotification){
            postData['send_push'] = $scope.sendNotification;
            $scope.postBody.post_type_id = feed.NORMAL_POST_WITH_PUSH;//To show this post in notification feed for Oleg
        } else {
          delete postData['send_push'];
        }
        var item = $scope.params.editItem;
        network.post('post/'+item.id,postData,function(result, response){
          if (result) {
            console.log(response);
            cleanPostBody();
            page.show($scope.params.callPage,($scope.params.callPage == 'postDetails'?{postId:item.id}:{}));
            if($scope.params.callPage == 'postDetails'){
              page.navigatorPop();
              page.navigatorPop();
            }
            network.pagerUpdate();
          }
          page.hideLoader();
        });

        return false;
      }


      if (!$scope.postBody.message || (!$scope.postBody['media_data'].content && !$scope.postBody.media_url)) {
        page.hideLoader();
        return false;
      }

      if ($scope.postToFB) {
        var data = JSON.parse(JSON.stringify($scope.postBody));
        console.log(data);
        openFB.getLoginStatus(function(status) {
          if (status.status !== 'connected') {
            localStorage.removeItem('do_not_link'+userService.getUser().id);
            page.showForResult('facebookLink',{firstLogin:true},function(result){
              page.showLoader();
              if (result) {
                doPostToFb(data);
              } else {
                postToFeed(data);
              }
            });
            return false;
          }

          doPostToFb(data);
        });
        return false;
      }
      console.log($scope.postBody);

      postToFeed($scope.postBody);
    }
  };
  
  function postToFeed(params) {
    network.pagerReset();
    var postType = 'Normal post';
    analytics.time('Post speed');
    if ($scope.postBody.media_url) {
      params.post_type_id = feed.URL_POST;
      if($scope.postBody.send_push ==1){
          params.post_type_id = feed.URL_POST_WITH_PUSH;
      }
      postType = 'URL post';
      delete params['media_data'];
    }
    network.put('post',params,function(result, response){
      if (result) {
        cleanPostBody();
        console.log(response);
        page.show(app.mainPage);
        $timeout(function(){
          analytics.trackCustomDimension(analytics.POST_TYPE, postType,function(){
            analytics.trackCustomMetric(analytics.POST_MADE, 1,function(){
              analytics.trackEvent([ 'DO IT button on post'
                , postType
                , 1
              ],false,function(){
                analytics.trackCustomDimension(analytics.POST_TYPE, '',function(){
                  analytics.trackCustomMetric(analytics.POST_MADE, 0,function(){
                    analytics.timeEnd('Post speed');
                  });
                });
              });
            });
          });
        },1500);
      }
    });
  }
  
  function test() {
    return $scope.bostBody;
  }
  
  header.post = postNow;
}]);