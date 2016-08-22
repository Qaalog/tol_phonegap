tol.controller('givePoints',['$scope','page','network','header','userService','imageUpload','device','dialog','$timeout','lightbox','pager',
  'analytics','$timeout','feed','$sce','$rootScope',
  function($scope, page, network,header,userService,imageUpload,device,dialog,$timeout,lightbox,pager,analytics, $timeout,feed,$sce,$rootScope){
   
  var iconStyleSheet, iconStyleElement, imageSelector;
  
  var previewCanvas = document.getElementById('preview_give_points_canvas');
  var img;
  var angles = [0,90,180,-90];
  var anglePointer = 0;
  var WRAP_ID = '#givePoits_add_photo';
  
  var onSuccess = function(imageData) {
    $scope.isPostLoaderShow = true;
    anglePointer = 0;
    var photoWrap = document.getElementById('givePoits_photo_wrap');
    img = new Image();
    img.src = "data:image/jpeg;base64," + imageData;
    img.onload = function() {
      $timeout(function(){
        $scope.isURL = false;
        imageUpload.rotate(previewCanvas, img, WRAP_ID, 0);
        $scope.isPostLoaderShow = false;
        $scope.isPreviewCanvasShow = true;
      });
      
    };
    $scope.postBody['media_data']['content'] = imageData;
    $scope.postBody['media_data']['mime_type'] = 'image/jpeg';
    
    $timeout(function(){
      validate();
    });
    
    app.wrapper.scrollTop = photoWrap.getBoundingClientRect().top - app.emToPx(5.5);
    console.log($scope.postBody);

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
                                    , rotate: 0
                                    }
                      , post_type_id: feed.RECOGNITION_POST
                      };
    $scope.isPreviewCanvasShow = false;
  };

  $scope.clearSavedData = function(){
    $scope.recognizeList = [];
    $scope.savedData = [];

  };
  //$scope.imgPrefix = network.servisePathPHP + '/GetCroppedImage?i=';
  $scope.imgPrefix = network.servisePathPHP + '/GetResizedImage?i=';
  $scope.imgSuffix = '&h=256&w=256';
  $scope.showPictureInLightBox = lightbox.showPicture;
  $scope.formatDate = feed.formatDate;

  $scope.showProfile = function (productId) {
    page.show('profile', {productId: productId});
  };




    var settings = { name: 'givePoints'
                 , title: 'Recognize'
                 , cancel: true
                 , doIt: true
                 };


  $scope.$watch('postBody.message',function(newVal,oldVal){
    if(newVal && newVal.length>250) {
      $scope.postBody.message = oldVal;
      $scope.validate();
    }
  });

  page.onShow(settings,function(params) {
    console.log('givePoints',params);
    if(typeof params.savedData !== 'undefined' && typeof params.savedData.savedParams !=='undefined'){
      var backData = angular.extend({},params.savedData);
      params.savedData.savedParams.recognizeList = params.recognizeList;
      params = params.savedData.savedParams;
      delete backData.savedParams;
      params.savedData = backData;
    }

    if(!!$scope.recognizeList && $scope.recognizeList.length == 0){
      if(!!params.savedData){
        delete params.savedData.mark;
        delete params.savedData.category;
        if(params.savedData.postBody && params.savedData.postBody.message) delete params.savedData.postBody.message;
      }
      //params.isQuotePost = false;
      //params.isQuotePostExternal = false;
      $rootScope.$broadcast('savedDataChanged',params.savedData);
    }

    params.pointsForPost = false; // Disabling ability to give points to existing post. For returning this ability just remove this string.
    $scope.pointSelected = false;
    $scope.categorySelected = false;
    $scope.isURL = false;
    $scope.isReinforce = false;
    $scope.savedData = params.savedData;

    //if($scope.recognizeList && $scope.recognizeList.length > 0 && (!params.recognizeList || params.recognizeList.length ==0)){
      params.recognizeList = $scope.recognizeList;
    //}

    $scope.recognizeList = false;

    $scope.isQuotePost = params.isQuotePost;
    $scope.isQuotePostExternal = params.isQuotePostExternal || false;
    $scope.fromRecognizeButton = params.fromRecognizeButton || false;
    $scope.fromMindMenu = params.fromMindMenu || false;

    if ($scope.isQuotePost && params.post_type_id*1 === feed.URL_POST) {
      $scope.isQuotePostUrl = true;
    } else {
      delete $scope.isQuotePostUrl;
    }
    
    $scope.hotelName = userService.getHotelName();
   
    app.wrapper.scrollTop = 0;
    page.setCheckBox('pointPost',false);
    $scope.isPostLoaderShow = false;
    imageUpload.setOnSucces(onSuccess);
    imageUpload.setOnFail(onFail);
    anglePointer = 0;

    $scope.params = params;
    if (params.recognizeList) {
      console.log('params.recognizeList',params.recognizeList);
      if(params.recognizeList.length == 0 && params.make_reinforce){
        oneProductInit(params);
      } else {
        multiProductInit(params);
      }
    } else {
      oneProductInit(params);
    }
    imageSelector = document.getElementById('givePoints_selector_input');
    
    $scope.isPreviewCanvasShow = false;
    
        
    if (imageSelector) imageSelector.disabled = !$scope.isCreatePost;

    $scope.category = params.category;
    $scope.mark = false;
    if(params.savedData && params.savedData.category!==false) $scope.category = params.savedData.category;
    if(params.savedData && params.savedData.mark!==false) $scope.mark = params.savedData.mark;

        header.toggleDoIt(false);
    $scope.getCategoryConfig();
    
    if (device.isWindows()) {
      var fileSelector = document.getElementById('givePoints_selector_input');
      if (!fileSelector)
      imageUpload.addFileInput('givePoints_selector_input', 'givePoits_add_photo', uploadImage);
    }
    
    clearPostBody();
    validate();
  });

  $scope.$on('recognizeListChanged',function(event,value){
    $scope.recognizeList = value;
  });
  $scope.countRecoWrapWidth = function () {
    var elements = document.getElementsByClassName('points-recognized');
    var wrap = document.getElementById('points-reco-inner');
    var scrollWrap = document.getElementById('points-reco-scroll');
    var width = 0;

    if (elements.length < 3) {
      wrap.style.width = innerWidth + 'px';
      return false;
    }

    for (var i = 0, ii = elements.length; i < ii; i++) {
      width += elements[i].getBoundingClientRect().width;
    }
    if (width > innerWidth) {
      wrap.style.width = width + 'px';
    } else {
      wrap.style.width = innerWidth + 'px';
    }
    scrollWrap.scrollLeft = 0;
  }


    function oneProductInit(params) {
    setProduct(params);
    $scope.isCreatePost = (params.pointsForPost) ? false : true;
  }

  function multiProductInit(params) {
    console.log('params.recognizeList',params.recognizeList);
    if (params.isMultiRecongnitionPost) {

      for (var i = 0, ii = params.recognizeList.length; i < ii; i++) {
        params.recognizeList[i].name = params.recognizeList[i].to_product_name;
        params.recognizeList[i].image_url = params.recognizeList[i].to_product_image;
        params.recognizeList[i].id = params.recognizeList[i].to_product_id;
        params.recognizeList[i].productId = params.recognizeList[i].to_product_id;
      }
    }
    
    $scope.isCreatePost = (params.pointsForPost) ? false : true;
    $scope.recognizeList = params.recognizeList;
    $scope.product = {};
    $scope.product.id = userService.getAuthProduct().id;
/*
    var wrap = document.getElementById('points-reco-inner');
    wrap.style.width = ( ($scope.recognizeList.length + 1) * app.emToPx(15)) + 'px';
    console.log('$scope.recognizeList', $scope.recognizeList);
    setTimeout(function() {
      var recoScroll = document.getElementById('points-reco-scroll');      
      recoScroll.scrollLeft = 0;
    },300);
*/
    $timeout(function() {
      $scope.countRecoWrapWidth();
    });

  }
  
  function reinforce(params) {
    $scope.params.pointsForPost = true;
    $scope.isCreatePost = false;
    $scope.category = false;
    $scope.mark = false;
    console.log('REINFORCE', $scope.categoryConfig, params);
    $scope.isReinforce = true;
    var categoryIndex = 0;
    for (var i = 0, ii = $scope.categoryConfig.length; i < ii; i++) {
      var category = $scope.categoryConfig[i];
      if (category.long_name === params.category_alias || category.long_name === params.points_alias_characteristic) {
        $scope.setCategory(i*1);
        categoryIndex = i*1;
        break;
      }
    }
    
    for (i = 0, ii = $scope.categoryConfig[categoryIndex].point_values.length; i < ii; i++) {
      var value = $scope.categoryConfig[categoryIndex].point_values[i];
      if (value.name === params.points_alias) {
        $scope.setMark(i*1);
        break;
      }
    }
    if($scope.category!==false && $scope.mark!==false){
      header.doIt();
    } else {
      page.goBack();
      $timeout(function() {
        //category or marks was removed or changed
        dialog.create(dialog.QUESTION, 'Reinforce is not possible', 'Please create a new recognition', 'New recognition', 'Cancel',
            function (answer) {
              if (answer) {
                $rootScope.$broadcast('recognizeButtonClickNeeded');
              }
            }).show();
      }, 500);
      return false;
    }

  }
  
  $scope.$on('pointsRecognizeListRendered', function() {
    var scrollWrap = document.getElementById('points-reco-scroll');
    scrollWrap.scrollLeft = scrollWrap.scrollWidth;
  });
  
  $scope.getPostAge = page.getPostAge;
  $scope.getHtml = feed.getHtml;
  $scope.goToLink = feed.goToLink;
  
  $scope.addMore = function() {
    //save marks for back button
    $scope.params.savedData = $scope.params.savedData ||{};
    $scope.params.savedData.mark = $scope.mark;
    $scope.params.savedData.category = $scope.category;
    $scope.params.savedData.postBody = $scope.postBody;
    $scope.params.savedData.anglePointer = anglePointer;
    //-----------------------------------------------
    var data = { recognizeList: $scope.recognizeList
               , savedData: { category: $scope.category
                            , mark: $scope.mark
                            , postBody: $scope.postBody
                            , anglePointer: anglePointer
                            ,savedParams: $scope.params
                            }
               };
    page.navigatorPush();
    page.show('searchPage',data);
/*
    page.navigatorPop();
    page.navigatorPop();
*/
  };
  
  $scope.$on('freeMemory',function(){
    if (iconStyleElement) {
      iconStyleElement = false;
      iconStyleSheet = false;
    }
    
    
    $scope.point = false;
    $scope.mark = false;
    $scope.markCount = 0;
    $scope.category = false;
    $scope.postBody = false;
    
    if (page.currentPage === settings.name) {
      $scope.isPreviewCanvasShow = false;
    }
  });
  
  $scope.splitName = function(fullName) {
    if(!!fullName){
      var clearedFullName = fullName.replace(/\s\s+/g, ' ');
      var splitedName = clearedFullName.split(' ');
      return $sce.trustAsHtml(splitedName[0] + '<br>' + splitedName[1]);
    }
  };
  $scope.tripAdvisorHtml = function(textToHTML){
    return $sce.trustAsHtml(textToHTML);
  };
  function setProduct(params) {
    $scope.product = {};
    if (params.isAutoPost || params.isPointPost) {
      $scope.product.id = params['to_product_id'];
      $scope.product.name = params['to_product_name'];
      $scope.product.image = params['to_product_image'];
      return true;
    }
    
    if (!params['from_product_id'] && !params['to_product_id']) {
      $scope.product.id = params['id'];
      $scope.product.name = params['name'];
      $scope.product.image = params['image_url'];
      return true;
    }
    
    if (params['from_product_id'] && !params['to_product_id']) {
      $scope.product.id = params['from_product_id'];
      $scope.product.name = params['from_product_name'];
      $scope.product.image = params['from_product_image'];
      return true;
    }
    
    if (!params['from_product_id'] && params['to_product_id']) {
      $scope.product.id = params['to_product_id'];
      $scope.product.name = params['to_product_name'];
      $scope.product.image = params['to_product_image'];
      return true;
    }
    
    if (params['from_product_id']) {
      $scope.product.id = params['from_product_id'];
      $scope.product.name = params['from_product_name'];
      $scope.product.image = params['from_product_image'];
      return true;
    }
  };
  
  var scrollTop;
  var container;
  var textAreaRect = false;
  var headerRect = false;
  var conteinerPaddingTop = false;
  var requestFrame = window[app.requestFrame];
  var step = 0;
  var stepsMade = 0;
  function fastScroll() {
    if(textAreaRect && headerRect){
      if(app.wrapper.scrollTop+step >= (textAreaRect.top-headerRect.height-10)){
        app.wrapper.scrollTop = app.wrapper.scrollTop-step*stepsMade + (textAreaRect.top - headerRect.height-10);
        return false;
      }
    }
    scrollTop = app.wrapper.scrollTop;
    app.wrapper.scrollTop = scrollTop + step;
    stepsMade++;
    requestFrame(fastScroll);
      /*
      if(textAreaRect && headerRect/!* && conteinerPaddingTop!==false*!/){
        if(app.wrapper.scrollTop+100 >= (textAreaRect.top-headerRect.height-10/!* - conteinerPaddingTop*!/)){
          if(app.wrapper.scrollTop!==0){
            app.wrapper.scrollTop = app.wrapper.scrollTop + (textAreaRect.top - headerRect.height-10);
          } else {
            app.wrapper.scrollTop = (textAreaRect.top - headerRect.height-10);
          }
          return false;
        }
      }
      if (app.wrapper.scrollTop === scrollTop) return false;

      scrollTop = app.wrapper.scrollTop;
      app.wrapper.scrollTop = scrollTop + 100;
      requestFrame(fastScroll);
  */
  }
  
  function backScroll() {
    if (app.wrapper.scrollTop <= 0) {
      container.style.height = '';
      return false;
    }
    app.wrapper.scrollTop = app.wrapper.scrollTop - 100;
    requestFrame(backScroll);
  }
  
  $scope.preScroll = function() {
    if (!device.isAndroid()) return false;
    container = document.getElementById('givePoints_container');
    var header = document.querySelector('.header');
    var textArea = document.getElementById('givePoints_textarea');
    if (container && header && textArea) {
      headerRect = header.getBoundingClientRect();
      textAreaRect = textArea.getBoundingClientRect();
      var height = textAreaRect.top - headerRect.height - 10;
      conteinerPaddingTop = parseInt(getComputedStyle(container).paddingTop);
      if((innerHeight + height - conteinerPaddingTop)>container.getBoundingClientRect().height){
        container.style.height = (innerHeight + height - conteinerPaddingTop) + 'px';
      }
      step = Math.abs(app.wrapper.scrollTop -(textAreaRect.top - headerRect.height-10))/4;
      stepsMade = 0;
      fastScroll(container,0,height);
    }
  };
  
  $scope.abortPreScroll = function() {
    if (!device.isAndroid()) return false;
    var container = document.getElementById('givePoints_container');
    if (container) backScroll(container);
  };
  
  var uploadImage = function(data,result) {
    $scope.isPostLoaderShow = true;
    anglePointer = 0;
    loaded();
    var photoWrap = document.getElementById('givePoits_photo_wrap');
    $scope.postBody['media_data'] = data['media_data'];
    img = new Image();
    img.src = result;
    img.onload = function() {
      $timeout(function() {
        document.getElementById('givePoints_selector_input').remove();
        $scope.isURL = false;
        imageUpload.rotate(previewCanvas, img, WRAP_ID, 0);

        $scope.isPostLoaderShow = false;
        app.wrapper.scrollTop = photoWrap.getBoundingClientRect().top - app.emToPx(5.5);

      });
           
    };
   
    console.log($scope.postBody);
    validate();
    $timeout(function() {
      validate();
    });
  };
  
  $scope.rotate = function() {
    anglePointer++;
    if (anglePointer > 3) anglePointer = 0;
    imageUpload.rotate(previewCanvas, img, WRAP_ID, angles[anglePointer]);
  };
  
  function createNewStyleSheet() {
    iconStyleElement = document.head.querySelector('#icon_styles');

    if (!iconStyleElement) {
      iconStyleElement = document.createElement('style');
      iconStyleElement.appendChild(document.createTextNode(""));
      iconStyleElement.title = 'icon_styles';
      iconStyleElement.id = 'icon_styles';
      document.head.appendChild(iconStyleElement);
    }

    for (var i = document.styleSheets.length - 1; i >= 0; i--) {
      if (document.styleSheets[i].title === 'icon_styles') {
        iconStyleSheet = document.styleSheets[i];
        break;
      }
    }
  };
  
  $scope.addPhoto = function() {
    document.getElementById('givePoints_textarea').blur();
    if (navigator.camera && $scope.isCreatePost) dialog.togglePhotoMenu(true);
  };
  
  $scope.parseMessage = function(message) {
      imageUpload.parseMessage(message, function(caption) {
      if (caption) {
        $scope.caption = caption;
        var img = new Image();
            img.src = caption.urlImage;
            img.onload = function() {
              $timeout(function(){
                $scope.isURL = true;
                loaded();
                imageUpload.rotate(previewCanvas, img, WRAP_ID, 0);
                $scope.postBody.media_url = caption.urlImage;
                $scope.validate();
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
  
  function loaded() {
    anglePointer = 0;
    $scope.isPostLoaderShow = false;
    $scope.isPreviewCanvasShow = true;
  }
  
  var validate = function() {
    if ($scope.category !== undefined && $scope.category!==false && $scope.mark !== false && $scope.mark !== undefined && $scope.category !== null && $scope.mark !== null) {
      if($scope.postBody.message && $scope.postBody.message.length>250){
        header.toggleDoIt(false);
        return false;
      }
      if ($scope.recognizeList) {
        if ($scope.recognizeList.length < 1 && !$scope.isReinforce) {
          header.toggleDoIt(false);
          return false;
        }
      }
      
      if (!$scope.isCreatePost) {
        header.toggleDoIt(true);
        return true;
      }

      header.toggleDoIt(true);
      return true;

/*
      if ($scope.postBody.message) {
        header.toggleDoIt(true);
        return true;
      }
*/
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
      $scope.isPreviewCanvasShow = false;
      $scope.isURL = false;
    }
    validate();
  };
  
  $scope.getCategoryConfig = function() {
    network.get('characteristic/',{'short_name':'rate'},function(result, response){
      if (result) {
        $scope.getPoints();
        $scope.categoryConfig = response;
        $scope.categoryCount = $scope.categoryConfig.length;

        console.log('POINTS >>> ',response);
        for (var i in response) {
         
          
            
          if (response[i]['image_url']) {
            updateCategoryIcon((i*1)+1,response[i]['image_url']);
          }
        }
      }
    },false,true);
  };
  
  var getAchievement = function(char) {
    var levels = char.levels.split(';');
    var currentLevel = char.current_level;
    var result = { level: currentLevel+1
                 , left: char.to_next_level
                 , name: char.long_name
                 };
                 
    if (currentLevel >= levels.length) {
      result.topLevel = 'has already reached top level on ' + char.long_name;
    }
    
    return result;
  };
  
  $scope.getPoints = function() {
    if($scope.product.id){
      network.post('product/getPoints/',{id: $scope.product.id},function(result, response) {
        if (result) {
          $scope.points = response;
          $scope.achievements = [];

          $scope.categoryMark = 0;
          if (!$scope.categoryConfig[$scope.categoryMark] || !$scope.categoryConfig[$scope.categoryMark]['point_values']) {
            page.goBack();
            $timeout(function() {
              dialog.create(dialog.INFO, 'Oppps', 'Points category is empty, please contact with administrator', 'Ok').show();
            }, 500);
            return false;
          }
          $scope.markCount = $scope.categoryConfig[$scope.categoryMark]['point_values'].length;
          var matchIndex = false;
          for (var i in response) {

            if ($scope.params.point) {
              if ($scope.params.point.id === response[i].id) {
                matchIndex = i*1;
              }
            }

            $scope.achievements.push(getAchievement(response[i]));
          }
          console.log('achievements', $scope.achievements);
          console.log('points',response);
          if (matchIndex) $scope.setCategory(matchIndex);


          if ($scope.categoryCount === 1) {
            $scope.setCategory(0);
          }

          if ($scope.params.make_reinforce) {
            reinforce($scope.params);
          }

        }
        if ($scope.savedData) {
          if ($scope.savedData.category || $scope.savedData.category === 0) {
            $scope.setCategory($scope.savedData.category);
          }
          if ($scope.savedData.mark || $scope.savedData.mark === 0) {
            $scope.setMark($scope.savedData.mark);
          }
          if ($scope.savedData.anglePointer) {
            anglePointer = $scope.savedData.anglePointer;
          }
          if ($scope.savedData.postBody) {
            $scope.postBody = $scope.savedData.postBody;
            if ($scope.postBody.media_data && $scope.postBody.media_data.content) {
              $scope.isPreviewCanvasShow = true;
            }
          }
          validate();
        }
        if (!$scope.params.make_reinforce) {
          page.hideLoader();
        }
      });
    } else {
      page.goBack();
      $timeout(function () {
        //dialog.create(dialog.INFO, 'Oppps', 'The Recognized user not found, please contact with administrator', 'Ok').show();
        dialog.create(dialog.QUESTION, 'Reinforce is not possible', 'Please create a new recognition', 'New recognition', 'Cancel',
            function (answer) {
              if (answer) {
                $rootScope.$broadcast('recognizeButtonClickNeeded');
              }
            }).show();
      }, 500);
      return false;
    }
  };
  
  $scope.saveMarksCategory = function(){
    if($scope.recognizeList && $scope.recognizeList.length > 0 ) {
      $scope.savedData = $scope.savedData || {};
      $scope.savedData.mark = (typeof $scope.mark == 'number'?$scope.mark*1:false);
      $scope.savedData.category = (typeof $scope.category == 'number'?$scope.category*1:false);
      $rootScope.$broadcast('savedDataChanged',$scope.savedData);
    }
    page.currentParams.savedData = page.currentParams.savedData || {};
    page.currentParams.savedData['category'] = (typeof $scope.category == 'number'?$scope.category*1:false);
    page.currentParams.savedData['mark'] = (typeof $scope.mark == 'number'?$scope.mark*1:false);
  };

  $scope.setMark = function(mark) {
    $scope.mark = mark*1;
    $scope.pointSelected = true;
    if (!$scope.category && typeof $scope.category !== 'number') return false;
    $scope.point = $scope.categoryConfig[$scope.category]['point_values'][mark].points;
    $scope.pointsAlias = $scope.categoryConfig[$scope.category]['point_values'][mark].name;
    console.log('setMark',$scope.point);
    $scope.saveMarksCategory();
    validate();
  };
  
  $scope.setCategory = function(category) {
    $scope.categorySelected = true;
    $scope.category = category;
    $scope.categoryMark = category;
    $scope.achiev = $scope.achievements[category];
    $scope.markCount = $scope.categoryConfig[category]['point_values'].length;
    if ($scope.mark > $scope.markCount - 1) $scope.setMark($scope.markCount - 1);
    if (typeof $scope.mark === 'number') $scope.setMark($scope.mark);
    console.log('setCategory',$scope.mark, $scope.point, typeof $scope.mark);
    //set saved data foe marks
    $scope.saveMarksCategory();
    validate();
  };
  
  function givePoints(postId, isPictureEmpty) {
    var data = { 'from_product_id': userService.getProductId()
               , 'points_given': $scope.point
               , 'to_product_id': $scope.product.id
               , 'points_alias': $scope.pointsAlias
               };
    var pointsToAnalytics = $scope.point;     
    if ($scope.params.pointsForPost) {
      data['post_id'] = $scope.params.id;
      
      var updateReason = '';//$scope.product.name.trim() + ' recognized by ' + userService.getAuthProduct().name.trim();
      if ($scope.isReinforce) {
        updateReason = '<strong data-touch=showProfile('+userService.getAuthProduct().id+')>' + userService.getAuthProduct().name.trim() + '</strong>' + ' reinforced this';
      }
      network.post('post/' + data['post_id'], {update_reason: updateReason});
    }
               
    if (postId) {
      data['post_id'] = postId;
    }
    
    if (data['to_product_id']*1 === userService.getProductId()) {
      page.goBack();
      return false;
    }
    
    data['characteristic_id'] = $scope.categoryConfig[$scope.category].id;
    console.log(data, $scope.product.id, postId);
    network.put('points_given/',data,function(result, response) {
      if (result) {
        console.log('give points',response);
        
        if ($scope.isQuotePost || $scope.isQuotePostExternal) {
          dialog.toggleToastMessage(true,'You have successfully quoted the post');
        }
        
        if (isPictureEmpty) {
          network.post('post/updatePointsPostImage',{post_id: data['post_id']}, function(result) {
            analytics.trackCustomMetric(analytics.POINTS_GIVEN, pointsToAnalytics.toString());
            analytics.timeEnd('Post speed');
            $scope.savedData = {};
            $scope.recognizeList = [];
            $rootScope.$broadcast('clearSavedDataEvent');
            if (!$scope.isCreatePost || $scope.isQuotePost || $scope.isQuotePostExternal || (!$scope.fromRecognizeButton && !$scope.fromMindMenu)) {
              console.log('test1');
              page.show('feed', {});
              network.pagerUpdate();
            } else {
              console.log('test2');
              network.pagerReset();
              page.show('feed', {});
            }
          });
          return true;
        }
        $rootScope.$broadcast('clearSavedDataEvent');
        if (!$scope.isCreatePost || $scope.isQuotePost || $scope.isQuotePostExternal || (!$scope.fromRecognizeButton && !$scope.fromMindMenu)) {
          console.log('test3');
          page.show('feed', {});
          network.pagerUpdate();
        } else {
          console.log('test4');
          network.pagerReset();
          page.show('feed', {});
        }
        analytics.timeEnd('Post speed');

        
        
      }
      
      delete $scope.params.make_reinforce;
    });
  }
  
  function giveMultiPoints(postId, isPictureEmpty) {
    var dataArray = [];

    for (var i = 0, ii = $scope.recognizeList.length; i < ii; i++) {
      var data = { 'from_product_id': userService.getProductId()
                 , 'points_given': $scope.point
                 , 'points_alias': $scope.pointsAlias
                 , 'to_product_id': $scope.recognizeList[i].id
                 , 'characteristic_id': $scope.categoryConfig[$scope.category].id
                 };
        
      if (postId) {
        data.post_id = postId;
      } else {
        data.post_id = $scope.params.postId;
      }
      dataArray.push(data);
    }
    
    var pointsToAnalytics = $scope.point * $scope.recognizeList.length; 
    
    if (!postId) {
      var updateReason = '';
      if ($scope.isReinforce) {
        updateReason = '<strong data-touch=showProfile('+userService.getAuthProduct().id+')>' + userService.getAuthProduct().name.trim() + '</strong>' + ' reinforced this';
      } else if ($scope.recognizeList.length < 3) {
        updateReason = $scope.recognizeList[0].name.trim() + ' and ' + $scope.recognizeList[1].name.trim()
            + ' recognized by ' + userService.getAuthProduct().name.trim();
      } else {
        updateReason = $scope.recognizeList[0].name.trim() + ', ' + $scope.recognizeList[1].name.trim() + ' and ' +
            feed.getOtherCount($scope.recognizeList) + ' recognized by ' + userService.getAuthProduct().name.trim();
      }
      network.post('post/' + data['post_id'], {update_reason: updateReason});
    }
    
    console.log('dataArray', dataArray);
    
    network.post('points_given/bulkInsert',dataArray,function(result, response) {
      console.log('points_given/bulkInsert',response);

      if ($scope.isQuotePost || $scope.isQuotePostExternal) {
        dialog.toggleToastMessage(true,'You have successfully quoted the post');
      }
      if (isPictureEmpty) {
        network.post('post/updatePointsPostImage',{post_id: data['post_id']}, function(result) {
          $scope.savedData = {};
          $scope.recognizeList = [];
          $rootScope.$broadcast('clearSavedDataEvent');

          if (!$scope.isCreatePost || $scope.isQuotePost || $scope.isQuotePostExternal || (!$scope.fromRecognizeButton && !$scope.fromMindMenu)) {
            console.log('test5');
            page.show('feed', {});
            network.pagerUpdate();
          } else {
            console.log('test6');
            network.pagerReset();
            page.show('feed', {});
          }

          analytics.timeEnd('Post speed');
        });
        return true;
      }

      $scope.savedData = {};
      $scope.recognizeList = [];
      $rootScope.$broadcast('clearSavedDataEvent');
      if (!$scope.isCreatePost || $scope.isQuotePost || $scope.isQuotePostExternal || (!$scope.fromRecognizeButton && !$scope.fromMindMenu)) {
        console.log('test5');
        page.show('feed', {});
        network.pagerUpdate();
      } else {
        console.log('test6');
        network.pagerReset();
        page.show('feed', {});
      }
      analytics.timeEnd('Post speed');
      
      delete $scope.params.make_reinforce;
    });
  }

  $scope.$on('clearSavedDataEvent',function(event){
    $scope.clearSavedData();
  });


  $scope.$on('doItEvent',function(event) {
    if(page.currentPage === 'givePoints'){
      if (validate()) {
        page.showLoader();
        analytics.time('Post speed');
        var isPictureEmpty = false;

        if(typeof $scope.postBody['media_data'] != 'undefined'){
          if (angles[anglePointer] === 90) {
            $scope.postBody['media_data']['rotate'] = -90;
          } else if (angles[anglePointer] === -90) {
            $scope.postBody['media_data']['rotate'] = 90;
          } else {
            $scope.postBody['media_data']['rotate'] = angles[anglePointer];
          }

          if (!$scope.postBody['media_data']['content'] && !$scope.isURL && !$scope.isQuotePost) {
            delete $scope.postBody['media_data'];
            $scope.postBody['media_url'] = 'https://teamoutloud.blob.core.windows.net/crystalho1crystalcy4/gift_points.png';
            isPictureEmpty = true;
          }
        }
        if ($scope.isCreatePost) {
          $scope.postBody.message = $scope.postBody.message.replace(/<.*>/gim,'');
          $scope.postBody.message = $scope.postBody.message.replace(/^/gim,'<br>');
          $scope.postBody.message = $scope.postBody.message.replace(/<br>/,'');
          console.log($scope.postBody.message);

          if ($scope.product.id*1 === userService.getProductId() && !$scope.recognizeList) {
            page.goBack();
            return false;
          }

          if ($scope.recognizeList && $scope.recognizeList.length > 1) {
            $scope.postBody['post_type_id'] = feed.MULTI_RECOGNITION_POST;
          } else {

            if ($scope.recognizeList) {
              $scope.postBody['to_product_id'] = $scope.recognizeList[0].id;
            } else {
              $scope.postBody['to_product_id'] = $scope.product.id;
            }

            $scope.postBody['post_type_id'] = feed.RECOGNITION_POST;
          }

          if ($scope.isURL) {
            delete $scope.postBody['media_data'];
          }

          if ($scope.isQuotePost || $scope.isQuotePostExternal) {
            $scope.postBody.parent_id = $scope.params.id;
            $scope.postBody['post_type_id'] = feed.QUOTE_POST;
            if ($scope.isQuotePostUrl) {
              var caption = $scope.params.attachments[0].data;
              console.log('caption',caption);
              $scope.postBody.attachment = { title: caption.title
                , link: caption.link
                , urlImage: caption.urlImage
                , href: caption.href
              };
              console.log('QuotePostUrl', $scope.params);
            }
            delete $scope.postBody['media_data'];
          }

          $scope.postBody.status_id = feed.GIVED_POINTS;
          if(!$scope.postBody.from_product_id){
            $scope.postBody.from_product_id = userService.getAuthProduct().id;
          }
          network.put('post',$scope.postBody,function(result, response){
            if (result) {
              console.log('post',response);
              if ($scope.recognizeList && $scope.recognizeList.length > 1) {
                giveMultiPoints(response.id, isPictureEmpty);

                analytics.trackCustomDimension(analytics.POST_TYPE, 'Multi Recognition post');
                analytics.trackCustomMetric(analytics.POST_MADE, 1);
                analytics.trackEvent([ 'DO IT button on post'
                  , 'Multi Recognition post'
                  , 1
                ]);
              } else {
                if ($scope.recognizeList) {
                  $scope.product = $scope.product || {};
                  $scope.product.id = $scope.recognizeList[0].id;
                }

                givePoints(response.id, isPictureEmpty);
                analytics.trackCustomDimension(analytics.POST_TYPE, 'Recognition post');
                analytics.trackCustomMetric(analytics.POST_MADE, 1);
                analytics.trackEvent([ 'DO IT button on post'
                  , 'Recognition post'
                  , 1
                ]);
              }
            }
          });

          return true;
        }

        if (!$scope.recognizeList || $scope.recognizeList.length == 0) {
          givePoints();
        } else {
          giveMultiPoints();
        }

      } else {
        //page.goBack();
        //dialog.create(dialog.INFO,'Giving points fail','Something went wrong.','OK').show();
      }
    }
  });
  
  
  $scope.removeFromRecognizeList = function(index) {
    $scope.recognizeList.splice(index,1);
    if(!$scope.recognizeList.length){
      $timeout(function(){//reset marks and categories
        delete $scope.mark;
        delete $scope.category;
        if($scope.postBody && $scope.postBody.message) delete $scope.postBody.message;
        //$scope.isQuotePost = false;
        //$scope.isQuotePostExternal = false;
        $scope.isCreatePost = true;
        $scope.pointSelected = false;
        $scope.categorySelected = false;
        $scope.saveMarksCategory();
        $scope.savedData = {};
        if(page.currentParams && page.currentParams.savedData){
          page.currentParams.savedData = {};
        }
        $rootScope.$broadcast('clearSavedDataEvent');
        console.log(page.currentParams);
      },0,true);
    }
    validate();
//    var wrap = document.getElementById('search-reco-inner');
//    var wrapWidth = wrap.getBoundingClientRect().width;
//    wrap.style.width = (wrapWidth - app.emToPx(15)) + 'px';
//    
//    $timeout(function() {
//      countRecoWrapWidth();
//    });
  };
    
}]);