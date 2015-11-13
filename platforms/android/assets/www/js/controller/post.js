tol.controller('post',['$scope','$timeout','page','network','facebook','device','header','dialog','userService','imageUpload','lightbox',
  function($scope,$timeout,page,network,facebook,device,header,dialog,userService,imageUpload,lightbox){
  
  var postNow;
  
  var onImageLoad = function(data) {
    var img = document.getElementById('post_preview_img');
    document.querySelector('.add-photo-label').style.display = 'none';
    img.style.display = '';
    $scope.postBody['media_data'] = data['media_data'];
    
    $timeout(function(){
      $scope.validatePost();
    });
    console.log($scope.postBody);
  };
  
  $scope.imgPrefix = network.servisePathPHP + '/GetCroppedImage?i=';
  $scope.imgSuffix = '&h=256&w=256';
  
  
  $scope.postBody = { message:      ''
                    , from_product_id: userService.getProductId()
                    , media_data: { content:   ''
                                  , mime_type: ''
                                  }
                    };

  var onSuccess = function(imageData) {
    console.log(imageData);
    document.querySelector('.add-photo-label').style.display = 'none';
    var img = document.getElementById('post_preview_img');
    img.src = "data:image/jpeg;base64," + imageData;
    img.style.display = '';
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
    if ($scope.postBody.message && ($scope.postBody['media_data'].content || $scope.params.editItem) ) {
      header.togglePost(true);
      header.toggleSave(true);
      return true;
    }
    header.togglePost(false);
    header.toggleSave(false);
  };
  
  
  var settings = { name:  'post'
                 , title: 'Post'
                 , tabs:  true
                 , post: true
                 };  
  
  page.onShow(settings,function(params) {
    imageUpload.setOnSucces(onSuccess);
    imageUpload.setOnFail(onFail);
    
    page.setCheckBox('post_switcher',false);
    
    header.togglePost(false);
    header.save = postNow;
    var photoLabel = document.querySelector('.add-photo-label');
    photoLabel.style.display = '';
    $scope.userAvatar = userService.getAvatar();

    page.hideLoader();
    $scope.isEdit = (params.editItem) ? true : false;

    $scope.params = params;
    
    if (params.editItem) {
     page.changePageSettings({ cancel: true
                             , title: 'Post'
                             , tabs:  true
                             , post: true
                             });
      var img = document.getElementById('post_preview_img');
      img.src = params.editItem.media_url;
      img.style.display = '';
      photoLabel.style.display = 'none';
      $scope.postBody.message = params.editItem.message.replace(/<br>/gim,'');;
      header.switchPost(header.SAVE);
      $scope.validatePost();
      var fileInput = document.getElementById('file_selector_input');
      if (fileInput) {
        fileInput.remove();
      }
      return false;
    }
    
    if (device.isWindows()) imageUpload.addFileInput('file_selector_input','post_preview_wrap',onImageLoad);//addFileInput();
    header.switchPost(header.POST);
  });
  
  $scope.$on('freeMemory',function(){
    header.togglePost(true);
    header.toggleSave(true);
  });
  
  $scope.showPictureInLightBox = lightbox.showPicture;
  
  $scope.toggleCheckBox = function(event) {
    $scope.postToFB = page.toggleCheckBox(event);
  };
  
  var cleanPostBody = function() {
    $scope.postBody = { message:      ''
                      , from_product_id: userService.getProductId()
                      , media_data: { content:   ''
                                    , mime_type: ''
                                    }
                      };
    var img = document.getElementById('post_preview_img');
    img.src = "";
    img.style.display = 'none';
  };
  
  $scope.$on('freeMemory',function(){
    cleanPostBody();
  });
  
  $scope.addPhoto = function() {
    if (navigator.camera) dialog.togglePhotoMenu(true);
  };
  
  
  var doPostToFb = function(params) {
    network.put('post',params,function(result, response){
      if (result) {
        console.log(response);
        var data = { message: params.message
                   , link: response.media_url
                   };
        facebook.api('POST','me/feed',data,function(result, response){
          console.log('send',result, response);
          cleanPostBody();
          page.show(app.mainPage,{});
          dialog.create(dialog.INFO, 'Thanks!', 'Your post was successfully<br/>published in Facebook', 'OK', null).show();
        });
      }
    });
  };
  
  postNow = function() {
    
    $scope.postBody.message = $scope.postBody.message.replace(/<.*>/gim,'');
    $scope.postBody.message = $scope.postBody.message.replace(/^/gim,'<br>');
    $scope.postBody.message = $scope.postBody.message.replace(/<br>/,'');
    console.log($scope.postBody.message);
    page.showLoader();
    
    if ($scope.params.editItem) {
      
      var item = $scope.params.editItem;

      network.post('post/'+item.id,{message: $scope.postBody.message},function(result, response){
        if (result) {
          console.log(response);
          cleanPostBody();
          page.goBack();
        }
        page.hideLoader();
      });
      
      return false;
    }
    
    if (!$scope.postBody.message || !$scope.postBody['media_data'].content) {
      page.hideLoader();
      return false;
    }
    
    if ($scope.postToFB) {
      var data = {};
      Object.assign(data,$scope.postBody);
      console.log(data);
      openFB.getLoginStatus(function(status) {
        if (status.status !== 'connected') {
          localStorage.removeItem('do_not_link'+userService.getUser().id);
          page.showForResult('facebookLink',{},function(result){
            if (result) {
              doPostToFb(data);
            }
          });
          return false;
        }
        
        doPostToFb(data);
      });
      return false;
    }
    
    network.put('post',$scope.postBody,function(result, response){
      if (result) {
        console.log(response);
        page.show(app.mainPage,{});
      }
    });
        
  };
  
  header.post = postNow;
}]);