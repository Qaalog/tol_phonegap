tol.controller('givePoints',['$scope','page','network','header','userService','imageUpload','device','dialog','$timeout','lightbox',
  function($scope, page, network,header,userService,imageUpload,device,dialog,$timeout,lightbox){
   
  var iconStyleSheet, iconStyleElement, imageSelector;
  
  var onSuccess = function(imageData) {
    document.getElementById('givePoits_photo_wrap').style.display = '';;
    document.getElementById('add-photo-btn').style.display = 'none';
    document.getElementById('givePoits_photo').src = "data:image/jpeg;base64," + imageData;;
    $scope.postBody['media_data']['content'] = imageData;
    $scope.postBody['media_data']['mime_type'] = 'image/jpeg';
    console.log($scope.postBody);
    $timeout(function() {
      validate();
    });
  };

  var onFail = function(message) {
    console.error(message);
    validate();
  };
  
  var clearPostBody = function() {
    $scope.postBody = { message: ''
                      , from_product_id: userService.getProductId()
                      , media_data: { content:   ''
                                    , mime_type: ''
                                    }
                      };
  };
  
  $scope.imgPrefix = network.servisePathPHP + '/GetCroppedImage?i=';
  $scope.imgSuffix = '&h=256&w=256';
  $scope.showPictureInLightBox = lightbox.showPicture;
   
  var settings = { name: 'givePoints'
                 , title: 'Give Points'
                 , cancel: true
                 , doIt: true
                 };  
  
  page.onShow(settings,function(params) {
    page.setCheckBox('pointPost',false);
    console.log('givePoints',params);
    imageUpload.setOnSucces(onSuccess);
    imageUpload.setOnFail(onFail);
    $scope.params = params;
    $scope.productId = (params['from_product_id']) ? params['from_product_id'] : params['id'];
    $scope.isCreatePost = (params.pointsForPost) ? false : true;
    imageSelector = document.getElementById('givePoints_selector_input');
    if (imageSelector) imageSelector.disabled = !$scope.isCreatePost;
    $scope.category = params.category;
    header.toggleDoIt(false);
    $scope.getCategoryConfig();
    $scope.getPoints();
    
    clearPostBody();
    validate();
  });
  
  $scope.$on('freeMemory',function(){
    if (iconStyleElement) {
      iconStyleElement.remove();
      iconStyleElement = false;
      iconStyleSheet = false;
    }
    $scope.point = false;
    $scope.mark = false;
    $scope.markCount = 0;
    $scope.category = false;
    $scope.postBody = false;
  });
  
  $scope.preScroll = function() {
    if (!device.isAndroid()) return false;
    var container = document.getElementById('givePoints_container');
    var header = document.querySelector('.header');
    var textArea = document.getElementById('givePoints_textarea');
    if (container && header && textArea) {
      var headerRect = header.getBoundingClientRect();
      var textAreaRect = textArea.getBoundingClientRect();
      var height = textAreaRect.top - headerRect.height - 10;
      console.log(height, textAreaRect.top, headerRect.height);
      container.style.marginTop = '-' + height + 'px';
    }
  };
  
  $scope.abortPreScroll = function() {
    if (!device.isAndroid()) return false;
    var container = document.getElementById('givePoints_container');
    if (container) container.style.marginTop = '';
  };
  
  var uploadImage = function(data) {
    document.getElementById('givePoits_photo_wrap').style.display = '';;
    document.getElementById('add-photo-btn').style.display = 'none';
    $scope.postBody['media_data'] = data['media_data'];
    console.log($scope.postBody);
    validate();
    $timeout(function() {
      validate();
    });
  };
  
  if (device.isWindows()) imageUpload.addFileInput('givePoints_selector_input', 'givePoits_add_photo', uploadImage);
  
  var createNewStyleSheet = function() {
    
    iconStyleElement = document.createElement('style');
    iconStyleElement.appendChild(document.createTextNode(""));
    iconStyleElement.title = 'icon_styles';
    document.head.appendChild(iconStyleElement);
    for (var i = document.styleSheets.length - 1; i >= 0; i--) {
      if (document.styleSheets[i].title === 'icon_styles') {
        iconStyleSheet = document.styleSheets[i];
        break;
      }
    }
  };
  
  $scope.addPhoto = function() {
    if (navigator.camera && $scope.isCreatePost) dialog.togglePhotoMenu(true);
  };
  
  
  
  var validate = function() {
    if ($scope.category !== undefined && $scope.mark !== undefined) {
      if (!$scope.isCreatePost) {
        header.toggleDoIt(true);
        return true;
      }
      
      if ($scope.postBody.message && $scope.postBody['media_data'].content) {
        header.toggleDoIt(true);
        return true;
      }
    }
    header.toggleDoIt(false);
    return false;
  };
  
  $scope.validate = validate;
  
  var updateCategoryIcon = function(category,icon) {
    if (!iconStyleSheet) {
      createNewStyleSheet();
    }
    iconStyleSheet.addRule('.q-icon_category_'+category+':before', 'content: "\\'+icon+'"!important;');
  };
  
  $scope.toggleCheckBox = function(event) {
    $scope.isCreatePost = page.toggleCheckBox(event);
    if (imageSelector) imageSelector.disabled = !$scope.isCreatePost;
    if (!$scope.isCreatePost) {
      clearPostBody();
      document.getElementById('givePoits_photo_wrap').style.display = 'none';
      document.getElementById('add-photo-btn').style.display = '';
    }
    validate();
  };
  
  $scope.getCategoryConfig = function() {
    network.get('characteristic/',{'short_name':'rate'},function(result, response){
      if (result) {
        $scope.categoryConfig = response;
        $scope.categoryCount = $scope.categoryConfig.length;
        if ($scope.categoryCount === 1) {
          $scope.setCategory(0);
        }
        $scope.markCount = $scope.categoryConfig[0]['point_values'].length;
        console.log('POINTS >>> ',response);
        for (var i in response) {
          if (response[i]['image_url']) {
            updateCategoryIcon((i*1)+1,response[i]['image_url']);
          }
        }
        page.hideLoader();
      }
    },false,true);
  };
  
  var getAchievement = function(char) {
    var levels = char.levels.split(';');
    var result = {};
    for (var i in levels) {
      if (levels[i] > char['points_current_period'].points) {
        
        result = { level: (i*1)+1 
                 , left: levels[i] - char['points_current_period'].points
                 , name: char.long_name
                 };
        break;
      }
    }
    return result;
  };
  
  var compareAchievements = function(achievements) {
    var mostDesired = {};
    for (var i in achievements) {
      if (mostDesired.left) {
        if (mostDesired.left > achievements[i].left) {
          mostDesired = achievements[i];
        }
      } else {
        mostDesired = achievements[i];
      }
    }
    return mostDesired;
  };
  
  $scope.getPoints = function() {
    network.post('product/getPoints/',{id: $scope.productId},function(result, response) {
      if (result) {
        $scope.points = response;
        var achievements = [];
        for (var i in response) {
          achievements.push(getAchievement(response[i]));
        }

        $scope.mostDesired = compareAchievements(achievements);
        console.log('points',response);
      }
    });
  };
  
  
//  $scope.categoryConfig = [
//      {points: [3,6]},
//      {points: [1,2,3,4,5]},
//      {points: [54,57,61]}
//  ];
  
  $scope.setMark = function(mark) {
    $scope.mark = mark*1;
    $scope.point = $scope.categoryConfig[0]['point_values'][mark].points;
    validate();
  };
  
  $scope.setCategory = function(category) {
    $scope.category = category;
    validate();
  };
  
  header.doIt = function() {
    var goBack;
    if (validate()) {
      page.showLoader();
      var data = { 'from_product_id': userService.getProductId()
                 , 'points_given': $scope.point
                 , 'to_product_id': $scope.productId
                 };
      if ($scope.params.pointsForPost) {
        data['post_id'] = $scope.params.id;
      }
      if (data['to_product_id']*1 === userService.getProductId()) {
        page.goBack();
        return false;
      }
      data['characteristic_id'] = $scope.categoryConfig[$scope.category].id;
      network.put('points_given/',data,function(result, response) {
        if (result) {
         console.log(response);
         if (!$scope.isCreatePost) page.show(app.mainPage);
         
         
          if ($scope.isCreatePost) {
            $scope.postBody.message = $scope.postBody.message.replace(/<.*>/gim,'');
            $scope.postBody.message = $scope.postBody.message.replace(/^/gim,'<br>');
            $scope.postBody.message = $scope.postBody.message.replace(/<br>/,'');
            console.log($scope.postBody.message);
            
            network.put('post',$scope.postBody,function(result, response){
              if (result) {
                console.log(response);
                page.show(app.mainPage);
              }
            });
          }
     
        } else {
          page.goBack();
          dialog.create(dialog.INFO,'Giving points fail','Something went wrong.','OK').show();
        }
        
      });

    }
  };
  
    
}]);