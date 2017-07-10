tol.controller('main',['$rootScope','$scope','page','searchService','network','config','$timeout','pager',
  'menu','device','facebook','dialog','$sce','header','feed','userService','imageUpload', 'lightbox', 'analytics','pagerItera','notification','utils',
  function($rootScope,$scope,page,searchService,network,config,$timeout,pager,menu,
    device,facebook,dialog,$sce,header,feed,userService,imageUpload,lightbox,analytics, 
    pagerItera,notification,utils){
    
    $scope.isIOS = device.isIOS;
    $scope.isBigScreen = app.isBigScreen;
    $scope.app = app;
    $scope.main = {};
    $scope.activePage = {};
    $scope.currentPage = config.startPage;
    
    $scope.isLoaderVisiable = false;
    $scope.isFeedLoaderVisible = false;
    $scope.activeView = {};
    $scope.searchModel = {};
    $scope.shareMenuShowedEvent = {};
    $scope.hideDeleteButton = false;
    $scope.hideRegenerateThumbButton = true;
    //$scope.imgPrefix = network.servisePathPHP + '/GetCroppedImage?i=';
    $scope.imgPrefix = network.servisePathPHP + '/GetResizedImage?i=';
    $scope.imgSuffix = '&h=256&w=256';

    $scope.$on('savedDataChanged',function(event,value){
      $scope.main.savedData = value;
    });
    $scope.$on('recognizeListChanged',function(event,value){
      $scope.main.recognizeList = value;
    });
    $scope.$on('clearSavedDataEvent',function(event){
      $scope.clearSavedData();
    });
    $scope.$on('shareMenuShowedEvent',function(event,value){
      $scope.shareMenuShowedEvent = value;
    });

    $scope.$on('fbLinkedChanged',function(event,value){
      $scope.isFBLinked = value;
    });

    $scope.$on('recognizeButtonClickNeeded',function(event,value){
      $scope.recognizeButtonClick('recobutton');
    });
    $scope.clearSavedData = function(){
      $scope.main.recognizeList = [];
      $scope.main.savedData = {};
    };
    if (navigator.connection) {
      $scope.connection = navigator.connection;
      $scope.$watch('connection.type',function(value) {
        console.log('CONNECTION CHANGE', value);
        network.getConnection();
      });
    }

    page.setHeaderVisiable = function(value){
      $scope.headerIsHidden = !value;
    };

    page.setPageScrollable = function(value){
      if (!value) {
        $scope.scrollType = {'overflow-y': 'hidden'};
      } else {
        $scope.scrollType = '';
      }
    };

    page.setTitle = function(title) {
      $scope.title = title;
    };
    
    var loaderTimerId;
    page.showLoader = function(topSelector,bottomSelector) {
      $rootScope.$broadcast('setMindVisible',false);
      if (loaderTimerId) clearTimeout(loaderTimerId);
      
      var loader = document.getElementById('loader');
      if (topSelector) {
        var element = document.querySelector(topSelector);
        try {
          var rect = element.getBoundingClientRect();
          var top = rect.top + rect.height;
          loader.style.top = top+'px';
        } catch(e) {}
      }
      
      if (bottomSelector) {
        var element = document.querySelector(bottomSelector);
        try {
          var rect = element.getBoundingClientRect();
          var bottom = innerHeight - rect.top;
          loader.style.bottom = bottom+'px';
        } catch(e) {}
      }
      if(['catalog','facebookLink','termsPrivacy'].indexOf(page.currentPage)!==-1){
        $scope.isLoaderVisiable = false;
        $scope.isFeedLoaderVisible = true;
      } else {
        $scope.isLoaderVisiable = true;
        $scope.isFeedLoaderVisible = false;
      }

      
      loaderTimerId = setTimeout(function() {
        $timeout(function() {
          if (!$scope.isLoaderVisiable && !$scope.isFeedLoaderVisible) return false;
          network.stopAll();
          
          dialog.create(dialog.INFO,'Oooops!',
                'Something went wrong...<br>Let\'s reload!','OK','', function() {
                  network.repeatLastRequest(function(result) {
                    if (!result) {
                      if(page.currentPage =='catalog'){
                        $scope.isLoaderVisiable = false;
                        $scope.isFeedLoaderVisible = true;
                      } else {
                        $scope.isLoaderVisiable = true;
                        $scope.isFeedLoaderVisible = false;
                      }
                      dialog.create(dialog.INFO,'Gosh!',
                        'Looks like the problem is serious.<br>Please try again later','OK','', function() {
                          page.hideLoader();
                          page.goBack();
                        }).show();
                        
                    }
                  }, config.DEFAULT_TIMEOUT);
                  
                }).show();
        });
      }, config.DEFAULT_TIMEOUT);
    };
    
    page.hideLoader = function(){
      $rootScope.$broadcast('setMindVisible',true);
      document.getElementById('loader').style.top = '';
      document.getElementById('loader').style.bottom = '';
      $scope.isLoaderVisiable = false;
      $scope.isFeedLoaderVisible = false;
    };
    
    $scope.hideLoader = page.hideLoader;
    
    page.showNoConnection = function(retryFunction, priority) {
      $scope.retryFunction = retryFunction;
      $timeout(function(){
        page.hideLoader();
        $scope.noConnection = true;
        document.getElementById('no_connection').style.zIndex = priority || '';
      });
    };
       
    page.hideNoConnection = function() {
      $timeout(function(){
        $scope.noConnection = false;
      });
    };
    
    $scope.hideNoConnection = page.hideNoConnection;
    
    $scope.retry = function() {
      page.showLoader();
      if (typeof $scope.retryFunction === 'function')
        $scope.retryFunction();
    };

    /*--------- NAVIGATION --------*/
    $scope.onCancel = function() {
      $scope.blurTextAreas();
      //$scope.clearSavedData();
      var delay = 100;
      if (device.isIOS())  {
        // "over ckick" on iOS prevent.
        delay = 300;
        //if (['searchPage','givePoints','postDetails'].indexOf(page.currentPage) !==-1) delay = 300;
      }
      if(userService.getAuthProduct()){
        $timeout(function() {
          page.show('feed', {});
        },delay);
      } else {
        $timeout(function() {
          page.show('login',{logout:true})
        },delay);
      }
      page.navigatorClear();

    };
    
    $scope.onBack = function() {
      console.log('GO BACK');
      $scope.blurTextAreas();
      if (!network.getConnection()){
        return false;
      }
      return page.goBack();
    };

    $scope.blurTextAreas = function(){
      document.getElementById('post_textarea').blur();
      document.getElementById('givePoints_textarea').blur();
    };

    page.goBack = function(stopAllDeny) {
      document.getElementById('search-input').blur();
      
      if (!stopAllDeny) network.stopAll();
      if(page.currentPage === 'feed') return false;//native android backbutton exit from app
      var oldPage = page.navigatorPop();
      if (oldPage) {
        
        if (oldPage.callback) {
          oldPage.callback(oldPage.params);
          return true;
        }
        
        var delay = 100;
        if (device.isIOS())  {
          // this code prevent "over ckick" on iOS.
          delay = 300;
          //if (page.currentPage === 'searchPage') delay = 300;
        }
        $timeout(function() {
          page.show(oldPage.name,oldPage.params,true);
        },delay);
        return true;
      } else {
        return false;
      }
    };
    
    document.addEventListener("backbutton", function(event){
      $timeout(function(){
        if(!$scope.onBack()){
          navigator.app = navigator.app || {};
          navigator.app.exitApp();
        };
      });
    }, false);

    page.show = function(pageId, params, isBack, skipConnectionCheck, denyMemoryFree) {
      
      if (app.inputs) {
        for (var i = 0, ii = app.inputs.length; i < ii; i++) {
          if (app.inputs[i].id !== 'search-input') {
            app.inputs[i].blur();
          }
        }
      }
      
      if (device.isIOS() && window.StatusBar) {
        StatusBar.show();
      }
      page.toggleNoResults(false);
      page.hideNoConnection();
//      if (!page.getPermission(pageId)) {
//        var savedTab = page.getActiveTabView();
//        page.hideLoader();
//        dialog.create(dialog.INFO,'Page unavailable',
//          'Sorry, this page will be available<br>in sprint '+page.getPageSprint(pageId),'OK').show();
//        page.setActiveTabView(savedTab);
//        return false;
//      };
      
      if (!skipConnectionCheck) {
        if (!network.getConnection()){
          return false;
        }
      }
      if (!denyMemoryFree) $rootScope.$broadcast('freeMemory');
      page.showLoader();
      params = params || {};
      if (!isBack) {
        params.isBack = false;
        page.navigatorPush();
      } else {
        params.isBack = true;
      }
      
      pager.stop();
      pagerItera.stop();
      feed.postDetailUpdateStop();

      $scope.activePage = {};
      $scope.activePage[pageId] = true;
      $scope.currentPage = pageId;
      $scope.isFBLinked = ( localStorage.getItem('fbAccessToken'+userService.getUser().id) ) ? true : false;
      $scope.userHasPhoto = userService.getAuthProduct().image_url;
      if (analytics.isEnabled){
        analytics.trackCustomMetric(analytics.POST_MADE, 0, function () {
          analytics.trackCustomMetric(analytics.POINTS_GIVEN, 0, function () {
            analytics.trackView($scope.currentPage);
          });
        });
      }
      page.setActiveTabView(pageId);
      page.toggleVersionVisiable(false);      
      imageUpload.setAllowEdit(true);//Image Allow EDit
      params.callPage = page.currentPage;
      page.runOnShow(pageId,params,isBack);
    };

    page.applyParams = function(params,isBack){
      params = params || {};
      
      $scope.canChart = params.chart;
      $scope.chartActive = params.chartActive;
      $scope.canCancel = params.cancel;
      $scope.canPost = params.post;
      $scope.canSave = params.save;
      $scope.canSmallBack = params.smallBack;
      $scope.canDoIt = params.doIt;
      $scope.canBack = params.back;

      $scope.canSearch = params.search;
      $scope.canSearchChart = params.searchChart;
      $scope.smallSearch = params.smallSearch;
      if (params.smallSearch) {
        var classSelector = (!params.searchChart) ? '.search-product' : '.search_chart';
        app.animate(document.querySelector(classSelector),250);
      }
      $scope.profileHeaderShow = params.profileHeader;
      $scope.rankingHeaderShow = params.rankingHeader;
      page.setTabsVisiable(params.tabs);
      $scope.title = params.title;
    };
    
    page.showForResult = function(pageId,params,resultCallback, keepControl) {
      resultCallback = resultCallback || function(){};
      params = params || {};
      params.requestResult = true;
      var waitPage = page.currentPage;
      page.show(pageId,params);
      if (typeof page.pageRequestResults[pageId] === 'function') {
        page.pageRequestResults[pageId](params,function(response){
          params.response = response;
          if (!keepControl) page.show(waitPage,params);
          resultCallback(response);
        });
      } else {
        delete params.requestResult;
        page.show(waitPage,params);
        resultCallback(false);
      }
    };
    
    page.changePageSettings = function(settings) {
      page.applyParams(settings);
    };
    
    page.toggleNoResults = function (isShow, text, bgColor,removeTop) {
      removeTop = removeTop || false;
      $timeout(function() {
        var wrap = document.getElementById('no_result_wrap');
        wrap.style.backgroundColor = '';
        if(removeTop) {
          wrap.style.top = '0em'
        } else {
          wrap.style.top = '';
        }
        $scope.isNoResultShow = isShow;
        $scope.noResultText = text || 'No result.';
        if (bgColor) {
          wrap.style.backgroundColor = bgColor;
        }
      });
      
    };
    /*------- AVATAR -------*/
    
    var uploadAvatar = function(data) {
      var img = document.getElementById('avatar_img');
      img.src = 'img/tol_loader_gr_wh.gif';
      
      network.post('product/changeMainMedia/',data,function(result,response){
        if (result) {
          console.log(response);
          userService.setAvatar(response.image_url);
          $scope.showUserPhotoNeededMarker = !userService.getAuthProduct().image_url;
          $scope.userHasPhoto = userService.getAuthProduct().image_url;
          network.pagerReset();
          img.src = $scope.imgPrefix + response.image_url + $scope.imgSuffix;
          img.onerror = function() {
            img.src = 'img/default-staff.png';
          };
          
        }
      });
    };
    
    $scope.changeAvatar = function(product) {
      console.log(product.id, userService.getProductId());
      if (product.id*1 !== userService.getProductId()) {
        feed.showPictureInLightBox(product.image_url);
        return false;
      }
      
      if (!device.isWindows()) dialog.togglePhotoMenu('true');
    };
    
    if (device.isWindows()) imageUpload.addFileInput('avatar_selector_input', 'avatar_wrap', uploadAvatar);
    page.onProfileShow = function() {
      
      imageUpload.setOnSucces(function(imageData) {
//        var img = document.getElementById('avatar_img');
//        img.src = "data:image/jpeg;base64," + imageData;

        var data = { media_data: { content: imageData
                                 , mime_type: 'image/jpeg'
                                 }
                   , id: userService.getProductId()
                   };
        uploadAvatar(data);
      });

      imageUpload.setOnFail(function(message) {
        console.log('Some thing went wrong when capturing photo', message);
      });
      
    };
    
    
    
    /*---------- TABS --------*/
    $scope.profileTabs = [
      {title: 'bio'},
      {title: 'posts'},
      /*{title: 'points'},*/

      {title: 'config'}
    ];
    
    page.addProfileTab = function(tabTitle) {

      $scope.showUserPhotoNeededMarker = !userService.getAuthProduct().image_url;
      $scope.showFBlinkNeededMarker = !$scope.isFBLinked;

      for (var i = $scope.profileTabs.length-1; i >= 0; i-- ) {
        if ($scope.profileTabs[i].title === tabTitle) {
          return false;
        }
      }
      $scope.profileTabs.push({title: tabTitle});
    };
    
    page.removeProfileTab = function(tabTitle){
      if(tabTitle == 'config'){
        $scope.showUserPhotoNeededMarker = false;
        $scope.showFBlinkNeededMarker = false;
      }
      for (var i = $scope.profileTabs.length-1; i >= 0; i-- ) {
        if ($scope.profileTabs[i].title === tabTitle) {
          $scope.profileTabs.splice(i,1);
          break;
        }
      }
    };
    
    page.setTabsVisiable = function(value, force){
      if (value) {
        var footerHeight = (app.emToPx(app.isBigScreen()?6.25:6.25) + 1);
        if (force) {
          app.wrapper.style.height = (innerHeight - footerHeight) + 'px';
        } else {
          app.wrapper.style.height = (app.innerHeight - footerHeight) + 'px';
        }
      } else {
        app.wrapper.style.height = app.innerHeight + 'px';
      }
      $scope.tabsAvailable = value;
    };
    
    
//    function iOSRecalculateHeight() {
//      return false;
//      if (isHeightWatchStopped) return false;
//      if ($scope.tabsAvailable) {
//        var footerHeight = (app.emToPx(6.25) + 1);
//        app.wrapper.style.height = (innerHeight - footerHeight) + 'px';
//      } else {
//        app.wrapper.style.height = (innerHeight + 18) + 'px';
//      }
//      app.innerHeight = innerHeight;
//      app.savedHeight = innerHeight;
//    }
    
    document.addEventListener("resume", function() {
//      if (device.isIOS()) {
//        iOSRecalculateHeight();
//      }
      
      if (userService.getAuthProduct().id) {
        notification.getNewNotificationCount(userService.getAuthProduct().id);
      }
      
    });
    
//    var isHeightWatchStopped = false;
//    var heightWatcher = null;
//    
//    if (device.isIOS()) {
//      setTimeout(function() {
//        app.textAreas = document.querySelectorAll('textarea');
//        if (app.textAreas) {
//          for (var i = 0, ii = app.textAreas.length; i < ii; i++) {
//            app.textAreas[i].addEventListener('focus',stopHeightWatch);
//            app.textAreas[i].addEventListener('blur',startHeightWatch);
//          }
//        }
//      }, 1000);
//      
//      
//      
//      app.savedHeight = window.innerHeight;
//      function heightWatch() {
//        if (isHeightWatchStopped) return false;
//        if (app.savedHeight !== window.innerHeight) {
//          iOSRecalculateHeight();
//        }
//
//       heightWatcher = window[app.requestFrame](heightWatch);
//      }
//      startHeightWatch();
//    }
//    
//    function stopHeightWatch() {
//      console.log('stopHeightWatch');
//      isHeightWatchStopped = true;
//      window[app.cancelFrame](heightWatcher);
//    }
//    
//    function startHeightWatch() {
//      isHeightWatchStopped = false;
//      heightWatcher = window[app.requestFrame](heightWatch);
//    }

    
    page.onTabChange = function(pageName) {
      page.show(pageName,{fromTabChange:true});
    };
      
    page.setActiveTabView = function(view) {
      $scope.activeView = {};
      $scope.activeView[view] = true;
    };
    
    page.getActiveTabView = function() {
      return Object.keys($scope.activeView)[0];
    };
    
    var requestFrame = window[app.requestFrame];
    
    function fastScroll() {
      if (app.wrapper.scrollTop <= 0) return false;
      app.wrapper.scrollTop = app.wrapper.scrollTop - 500;
      requestFrame(fastScroll);
    }
    
    $scope.changeView = function(view){
      if (view === 'feed' && page.getActiveTabView() === 'feed') {
        fastScroll();
      }
      
      if (page.getActiveTabView() === view){
        if (view === 'profile' && $scope.userProductId == $scope.profileProductId) {
          return false;
        }
      }

      page.toggleNoResults(false);
      page.hideNoConnection();
      pager.stop();
      pagerItera.stop();
      page.showLoader('.header','.footer-menu');
      page.onTabChange(view);
      page.navigatorPop();
    };
    
    $scope.onProfileTabTouch = function(tab) {    
      page.toggleNoResults(false);
      page.hideNoConnection();
      page.setProfileTab(tab.title);
    };
    
    page.setProfileTab = function(tab) {
      $scope.product = userService.getProduct();

      for (var i in $scope.profileTabs) {
        if (tab === $scope.profileTabs[i].title) {
          $scope.profileTabs[i].isActive = true;
          continue;
        } 
        $scope.profileTabs[i].isActive = false;
      }
      
      page.onProfileTabChange(tab);
    };
    
    page.setProfileProductId = function(id) {
      $timeout(function() {
        $scope.userProductId = userService.getProductId();
        $scope.profileProductId = id;
      });
    };
    
    
    var currDate = new Date();
    $scope.rankingTabs = [ {id:'prev_month',title: utils.getShrotMonthName((currDate.getMonth()-1>=0?currDate.getMonth()-1:11))}
                         , {id:'this_month',title: utils.getShrotMonthName(currDate.getMonth())}
                         , {id:'prev_year',title: currDate.getFullYear()-1+''}
                         , {id:'this_year',title: currDate.getFullYear()+''}
                         ];
    
    $scope.onRankingTabTouch = function(tab) {  
      page.setRankingTab(tab);
    };
    
    page.setRankingTab = function(tab) {
      
      for (var i in $scope.rankingTabs) {
        if (tab.id === $scope.rankingTabs[i].id) {
          $scope.rankingTabs[i].isActive = true;
          continue;
        } 
        $scope.rankingTabs[i].isActive = false;
      }
      
      page.onRankingTabChange(tab);
    };
    
    /*------ HEADER CONTROL ------*/
    
    $scope.showMenu = function() {
      page.show('menu',{});     
    };
    
    $scope.postNow = function() {
      $scope.blurTextAreas();
      //page.showLoader();
      header.post();
    };
    
    $scope.save = function() {
      $scope.blurTextAreas();
      header.save();
    };
    
    $scope.onDoIt = function() {
      $scope.blurTextAreas();
      header.doIt();
    };
    
    $scope.goToChart = function() {
      var data = {recognizeList:$scope.main.recognizeList,savedData:$scope.main.savedData};
      if (page.currentPage === 'searchPage') {
        data.saveList = true;
      }
      page.show('chart',data);
    };
    
    header.togglePost = function(value) {
      $scope.isPostEnabled = value;
    };
    
    header.toggleSave = function(value) {
      $scope.isSaveEnabled = value;
    };
    
    header.toggleDoIt = function(value) {
      $scope.isDoItEnabled = value;
    };
    
    header.switchPost = function(switchTo) {
      if (!$scope.canPost && !$scope.canSave) {
        return false;
      }
      switch (switchTo) {
        
        case header.POST:
          $scope.canPost = true;
          $scope.canSave = false;
          break;
        
        case header.SAVE:
          $scope.canPost = false;
          $scope.canSave = true;
          break;
      }
      
    };
    
    $scope.getHotelName = function() {
      var name = userService.getHotelName();
      if (name.length > 30) {
        return name.slice(0, 27 - name.length) + '...';
      }

      return name;
    };
    
    /*------- FOOTER CONTROL --------*/
    
    $scope.isVersionShow = false;
    
    page.toggleVersionVisiable = function(value) {
      $scope.isVersionShow = value;
    };

    /*------- FACEBOOK -------*/
    
    /* iOS hack (textarea focus) */
    var fbTextarea, fbTextareaLayout;
    function focus() {
      fbTextareaLayout = fbTextareaLayout || document.getElementById('fb_message_layout');
      fbTextarea = fbTextarea || document.getElementById('fb_message');
      if (device.isIOS()) {
        var rect = fbTextareaLayout.getBoundingClientRect();
        fbTextarea.style.top = rect.top + 'px';
        fbTextarea.style.left = rect.left + 'px';
        fbTextarea.style.width = rect.width + 'px';
        fbTextarea.style.height = rect.height + 'px';
        fbTextarea.style.opacity = 1;
        fbTextarea.style.background = '#fff';
        fbTextarea.focus();
      } else {
        fbTextareaLayout.focus();
      }
    };
    
    function blur() {
      if (device.isIOS()) {
        if (!fbTextarea) return false;
        fbTextarea.style.top = '-10em';
        fbTextarea.style.left = 0;
        fbTextarea.style.width = '';
        fbTextarea.style.height = '';
        fbTextarea.style.opacity = 0;
        fbTextarea.style.background = '';
        fbTextarea.blur();
      } else {
        if (!fbTextareaLayout) return false;
        fbTextareaLayout.blur();
      }
      
    }
    /*iOS hack end*/
    
    $scope.getHtml = feed.getHtml;
    facebook.toggleShareMenu = function(value, params,img) {
      $scope.isShareShow = value;
      if (!value) page.navigatorPop();
      if (value) {
        page.navigatorPush(function(){
          $timeout(function(){
            $scope.closeShareMenu(false,true);
          });
        });
        app.animate(document.getElementsByClassName('animate-fb-share')[0],250);
        
          var canvas = document.getElementById('canvas');
          var canvasWrap = canvas.parentElement;
          var description = document.getElementById('fb-preview-desc');
          
          var ctx = canvas.getContext('2d');
          
          if (img && img.width < img.height) {
            canvasWrap.style.width = '30%';
            canvasWrap.style.float = 'left';
            canvasWrap.style.marginRight = '0.5em';
            description.style.marginTop = '0';

            setTimeout(function(){
              canvas.width = img.width;
              canvas.height = img.height;
              ctx.drawImage(img,0, 0, img.width, img.height);
            }, 300);
          } else if(img){
            canvasWrap.style.width = '';
            canvasWrap.style.float = '';
            canvasWrap.style.marginRight = '';
            description.style.marginTop = '0.5em';

            setTimeout(function(){
              var rect = canvasWrap.getBoundingClientRect();
              canvas.width = rect.width;
              canvas.height = rect.height;
              var start = (img.height / 2) - (canvas.height / 2);
              if (img.height <= canvas.height) {
                ctx.drawImage(img,0, 0, img.width, img.height);
              } else {
                ctx.drawImage(img,0,start, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
              }
              
            },300);
          }
          console.log(params);
        $scope.fbMessage = '';
        $scope.shareItem = params;
        $scope.shareItem.hotel = userService.getHotelName();
      }
    };
    
    $scope.closeShareMenu = function(event,force) {
      if (force || event.target.className.indexOf('popup-block') >= 0) {
        var canvas = document.getElementById('canvas');
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0,0,canvas.width,canvas.height);
        facebook.toggleShareMenu(false);
        page.setTabsVisiable(true);
      }
    };
    
    $scope.shareNow = function(shareItem, fbMessage) {
      blur();
      $timeout(function(){
        facebook.toggleShareMenu(false);
        page.setTabsVisiable(true);
        page.showLoader();
      });
      
      var share = function() {
        var data = { message: fbMessage || ''
                   //, message: shareItem.message.replace(/<br>/gim,'')
                   , link: 'http://www.teamoutloud.com'
                   , picture: shareItem.media_url
                   , name: userService.getHotelName()
                   //, caption: ''
                   , description: 'Increase your employee engagement.'
                   };
        facebook.api('POST','me/feed',data,function(result, response){
          page.hideLoader();
          console.log('send',result, response);
          //feed.setLikeFeedItem(shareItem,feed.LIKE_TYPE_FACEBOOK,$scope.shareMenuShowedEvent);
          if (result) {
            feed.setLikeFeedItem(shareItem,feed.LIKE_TYPE_FACEBOOK,$scope.shareMenuShowedEvent);
            $timeout(function(){
              dialog.create(dialog.INFO, 'Thanks!', 'Your post was successfully<br/>published in Facebook', 'OK', null).show();
            });
            
            if (shareItem.from_product_id*1 !== userService.getAuthProduct().id && shareItem.can_share*1 > 0) {
              var data = { post_id: shareItem.id
                         , by_product_id: userService.getAuthProduct().id
                         , product_id: shareItem.from_product_id
                         , message: 'share your post on Facebook'
                         };
               network.put('post_notification',data);
            }
            
            
          }
        });
      };
      
      openFB.getLoginStatus(function(status) {
        if (status.status !== 'connected') {
          facebook.toggleShareMenu(false);
          page.setTabsVisiable(true);
          localStorage.removeItem('do_not_link'+userService.getUser().id);
          shareItem.firstLogin = true;
          page.showForResult('facebookLink',shareItem,function(result){
            if (result) {
              share();
            }
          });
          return false;
        }
        share();

    
      });
      
    };
    
    page.requestFBAvatar = function(callback){
      callback = callback || function(){};
      if (facebook.isActive()) { 
        dialog.create(dialog.QUESTION,'Use Facebook picture?','Do you want to use your Facebook profile<br>\
          picture on TeamOutLoud?','Yes','No',function(answer){
          if (answer) {
            facebook.getBase64Avatar(function(base,mimeType){
              var data = { media_data: { content: base
                                       , mime_type: mimeType
                                       }
                         , id: userService.getProductId()
                         };
              document.getElementById('avatar_img').src = 'data:image/jpeg;base64,'+base;
              uploadAvatar(data);
            },true);
            network.pagerReset();
          }
          callback(answer);
        }).show();
      }
    };

    /*------- DIALOGS -------*/
    dialog.create = function(type, title, message, positiveBtn, negativeBtn, callback) {
      callback = callback || function(){};
      var dialogType;
      $scope['isInfoShow'] = false;
      $scope['isQuestionShow'] = false;
      if (type === dialog.INFO) {
         dialogType = 'isInfoShow';
      }
      if (type === dialog.QUESTION) {
        dialogType = 'isQuestionShow';
      }
      
      $scope.dialog = { title: title
                      , message: $sce.trustAsHtml(message)
                      , positiveBtn: positiveBtn
                      , negativeBtn: negativeBtn
                      };           
      $scope.positiveBtnTouch = function() {
        page.navigatorPop();
        $scope[dialogType] = false;
        callback(true);
      };
      
      $scope.negativeBtnTouch = function() {
        page.navigatorPop();
        $scope[dialogType] = false;
        callback(false);
      };
      
      return { show: function() {
                  $timeout(function() {
                    $scope[dialogType] = true;
                    page.navigatorPush(function(){
                      $timeout(function() {
                        $scope[dialogType] = false;
                        callback(false);
                      });
                    });
                  });
                  
               },
               hide: function() {
                 $timeout(function() {
                   $scope[dialogType] = false;
                 });
               }
             };
    };
     
    dialog.toggleUserMenu = function(value,hideDeleteButton) {
      hideDeleteButton = hideDeleteButton || false;
      $scope.hideDeleteButton = hideDeleteButton;
      $scope.hideRegenerateThumbButton = true;
      if(userService.checkCanEditAllPosts(userService.getAuthProduct().characteristics) && value){
          var itemType = feed.getPostType(feed.selectedFeedItem);
          //Regenerate thumbs available only for recognition and not external auto
          if(itemType.indexOf('external')===-1 && itemType.indexOf('quote')===-1
              && ((itemType == 'normal' && feed.selectedFeedItem.point_givers!=0) || itemType == 'other-auto-post')){
              $scope.hideRegenerateThumbButton = false;
          }
      }
      if (value) page.navigatorPush(function(){
        $timeout(function() {
          $scope.closeUserMenu(false,true);
          console.log('back');
        });
        
      });
      if (!value) page.navigatorPop();
      
      $scope.isUserMenuShow = value;
    };
    dialog.toggleMindMenu = function(value) {
      if (value) page.navigatorPush(function(){
        $timeout(function() {
          $scope.closeMindMenu(false,true);
          console.log('back');
        });

      });
      if (!value) page.navigatorPop();

      $scope.isMindMenuShow = value;
    };
    dialog.addActionListener('all',function(action) {
      switch (action) {
        case 'create_post':
          dialog.toggleMindMenu(false);
          page.navigatorPush();
          $scope.changeView('post')
          break;

        case 'create_recognition':
          dialog.toggleMindMenu(false);
          page.navigatorPush();
          $scope.recognizeButtonClick('mindmenu');
          break;
      }
    });
    
    $scope.recognizeButtonClick = function(from){
      var backPage = { name: 'feed'
        , params: {}
      };
      if(from == 'profile'){
        $scope.product.isAdded = true;
        $scope.product.productId = $scope.product.id;
        $scope.main.recognizeList = [$scope.product];
        $scope.main.savedData = {};
        $rootScope.$broadcast('recognizeListChanged',$scope.main.recognizeList);
        page.show('givePoints',{backPage: backPage, recognizeList:$scope.main.recognizeList,savedData:{}})
      } else {
        $rootScope.$broadcast('recognizeListChanged',$scope.main.recognizeList);
        page.show('givePoints',{recognizeList: $scope.main.recognizeList||[], backPage: backPage, savedData: $scope.main.savedData || {},fromRecognizeButton:(from=='recobutton'),fromMindMenu:(from=='mindmenu')});
      }
    };

    dialog.togglePhotoMenu = function(value) {
      if (value) page.navigatorPush(function(){
        $timeout(function() {
          $scope.closePhotoMenu(false,true);
        });
        
      });
      if (!value) page.navigatorPop();
      
      $scope.isPhotoMenuShow = value;
    };
    
    $scope.dialogAction = function(action) {
      dialog.action(action);
    };
    
    $scope.closeUserMenu = function(event,force) {
      if (force || event.target.className.indexOf('popup-message') >= 0) {
        dialog.toggleUserMenu(false);
      }
    };
    $scope.closeMindMenu = function(event,force) {
      if (force || event.target.className.indexOf('popup-message') >= 0) {
        dialog.toggleMindMenu(false);
      }
    };
    $scope.closePhotoMenu = function(event,force) {
      if (force || event.target.className.indexOf('popup-message') >= 0) {
        dialog.togglePhotoMenu(false);
      }
    };
    
    dialog.togglePointsMenu = function(value, postType){
      if (value) {
        page.navigatorPush(function(){
          $timeout(function() {
            $scope.closePointsMenu(false,true);
          });
        });
        $scope.menuPostType = postType;
      }
      if (!value) page.navigatorPop();
      
      $scope.isPointsMenuShow = value;
    };
    
     $scope.closePointsMenu = function(event,force) {
      if (force || event.target.className.indexOf('popup-message') >= 0) {
        dialog.togglePointsMenu(false);
      }
    };

    dialog.toggleExternalMenu = function(value, postType){
      if (value) {
        page.navigatorPush(function(){
          $timeout(function() {
            $scope.closeExternalMenu(false,true);
          });
        });
        $scope.menuPostType = postType;
      }
      if (!value) page.navigatorPop();

      $scope.isExternalMenuShow = value;
    };

     $scope.closeExternalMenu = function(event,force) {
      if (force || event.target.className.indexOf('popup-message') >= 0) {
        dialog.toggleExternalMenu(false);
      }
    };

    
    $scope.toast = { isExist: false
                   , isHidden: true
                   };
    
    
    dialog.toggleToastMessage = function(value, text) {
      console.log(value, text);
      if (value) {
        $scope.toast.isExist = true;
        $scope.toast.text = text;
        
        $timeout(function() {
         $scope.toast.isHidden = false; 
        });
        
        $timeout(function() {
          dialog.toggleToastMessage(false);
        },5000);
      } else {
        $scope.toast.isHidden = true;
        $timeout(function(){
          $scope.toast.isExist = false;
        },500);
      }
    };
    
    /*------- SEARCH --------*/
    var body = document.body;
    searchService.setInputValue = function(value) {
      $scope.searchModel.value = value;
    };
    
    $scope.onSearchInputFocus = function() {
//      if (device.isIOS()) {
//        console.log('preventScroll set');
//        body.addEventListener('touchmove', preventScroll);
//      }
      var data = {saveList:false,savedData:$scope.main.savedData,recognizeList:$scope.main.recognizeList};
/*
      if (page.currentPage === 'chart') {
        data.saveList = true;
      }
*/
      if (page.currentPage !== 'searchPage') {
        page.show('searchPage',data);
      }
    };
    
    $scope.onSearchInputBlur = function() {
//      if (device.isIOS()) {
//        console.log('preventScroll cancel');
//        body.removeEventListener('touchmove', preventScroll);
//      }
    };
    
    function preventScroll(event) {
      if (body.scrollTop !== 0) {
        event.preventDefault();
        event.stopPropagation();
        body.scrollTop = 0;
        setTimeout(function(){
          body.scrollTop = 0;
        });
      }
    }
    
    $scope.onSearchChange = function(value) {
      searchService.onSearch(value);
    };
    
    $scope.onSearchChartChange = function(value) {
      searchService.onSearchChart(value);
    };
    
    $scope.onSearchChart = function(event) {
      if (event.keyCode === 13) {
        searchService.doSearchChart();
      }
    };
    
    searchService.clearSearchChartInput = function(){
      $scope.chartSearchModel = '';
    };

    /*------- LIGHTBOX -------*/

    lightbox.visiable = function(value) {
      $scope.isLightBoxShow = value;
      if (value) {
        if (device.isIOS() && window.StatusBar) {
          StatusBar.hide();
        }
        $scope.toggleCloseBtn(true);
        page.navigatorPush(function(){
          lightbox.visiable(false);
          if (screen.lockOrientation) screen.lockOrientation('portrait');
        });
        if (screen.unlockOrientation) screen.unlockOrientation();
      }
    };
    
    $scope.closeLightBox = function() {
      $timeout(function() {
        page.navigatorPop();
        lightbox.visiable(false);
        $scope.toggleCloseBtn(false);
        if (device.isIOS() && window.StatusBar) {
          StatusBar.show();
        }
        if (screen.lockOrientation) {
          screen.lockOrientation('portrait');
        }
      }, 300); //timeout for iOS to prevent search input focus
    };
    
    $scope.toggleCloseBtn = function(value) {
      $scope.isCloseBtnShow = value;
    };
    
    $scope.swipe = lightbox.swipe;
    
    $scope.showPictureInLightBox = lightbox.showPicture;
    
    /*------- NOTIFICATIONS -------*/
    
    $scope.notificationCount = notification.getCount() || 0;

    notification.incCount = function(){
      var count = notification.getCount();
      count++;
      applyNotificationCount(count);
    };
    
    notification.decCount = function(){
      var count = notification.getCount();
      if (count <= 0) return false;
      count--;
      applyNotificationCount(count);
    };
    
    function applyNotificationCount(count) {
      $scope.notificationCount = count;
      notification.setCount(count);
    }
    
    notification.setCount = function(count){
      $scope.notificationCount = count;
      localStorage.setItem('tol-notification-count', count);
    };
    
    notification.getCount = function(){
      return localStorage.getItem('tol-notification-count')*1;
    };
    
    if (app.push) {
      app.push.on('notification', function(data) {
        if (data.additionalData.coldstart) {
          app.coldStart = data;
        } 

        if (data.additionalData.foreground === false) {
          app.coldStart = data;
        }
        notification.getNewNotificationCount(userService.getAuthProduct().id);
        console.log('notification', data);
      });
    }
    
    notification.getNewNotificationCount = function(productId) {
      network.post('post_notification/getFeedSections',{product_id: productId}, function(result, response) {
        if (result) {
          notification.setCount(response.not_seen*1);
          
          try {
            if (response.not_seen*1 < 1) {
              cordova.plugins.notification.badge.clear();
            } else {
              cordova.plugins.notification.badge.set(response.not_seen*1);
            }
          } catch(e) {
            console.log('cordova.plugins.notification.badge', e);
          }
          
        }
      });
    };
    
    /*------- INIT BLOCK --------*/
    
    document.querySelector('html').addEventListener('keydown',function(event){
      if (event.altKey && event.keyCode === 77) {//Alt-M System Menu
          $timeout(function() {
            $scope.showMenu();
          });
          
      }
      if (event.altKey && event.keyCode === 66) {//Back Alt-B
        page.goBack();
      } 
      if (event.altKey && event.keyCode === 86) {//Alt-v  current HTMLCUT work
        page.show('cut',{});
      }
    });

    network.get('/info', false, function(result, response) {//Get version of WEB Service
      if (result) {
        $scope.WSVersion = response.version;
      }
    },true);
    
    page.getPermission = function(pageId) {
      if (config.IS_DEBUG) return true;
      if (!config.pagesInSprints[pageId]) return false;
      if (config.pagesInSprints[pageId] <= config.SPRINT) return true;
      return false;
    };
    
    page.getPageSprint = function(pageId) {
      if (!config.pagesInSprints[pageId]) return 'n/a';
      return config.pagesInSprints[pageId];
    };
    
    $scope.getPostAge = page.getPostAge;//
    page.setHeaderVisiable(false);
    document.addEventListener('pages_ready',function(){
      network.checkAppVersion(function(result){
        if(result) {
          page.setHeaderVisiable(true);
          if (window.analytics) analytics.init();
          page.showLoader();
          page.show(config.startPage,{start: true},false);
        } else {
          page.hideLoader();
          dialog.create(dialog.INFO, 'New version available',config.newVersionText.replace('[$force_version$]',network.forceVersion), 'UPGRADE',false,
              function (answer) {
                if (answer) {
                  if(app.isDesktop){
                    window.location = 'https://play.google.com/store/apps/details?id='+config.storeAppId;
                  } else if(app.isIOS()) {
                    window.open('itms-apps://itunes.com/apps/' + config.appName, '_system');
                    var event = document.createEvent('Event');
                    event.initEvent('pages_ready', true, true);
                    document.dispatchEvent(event);
                  } else {
                    window.open('market://details?id='+config.storeAppId,'_system');
                    navigator.app.exitApp();
                  }
                } else {
                  page.navigatorClear();
                  if(!app.isDesktop && !app.isIOS()) navigator.app.exitApp();
                }
              }
          ).show();
        }
      });
    });
}]);


