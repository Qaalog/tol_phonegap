tol.controller('main',['$rootScope','$scope','page','searchService','network','config','$timeout','pager',
  'menu','device','facebook','dialog','$sce','header','feed','userService','imageUpload', 'lightbox',
  function($rootScope,$scope,page,searchService,network,config,$timeout,pager,menu,
    device,facebook,dialog,$sce,header,feed,userService,imageUpload,lightbox){
    
    $scope.isIOS = device.isIOS;
    $scope.app = app;
    
    $scope.activePage = {};
    $scope.currentPage = config.startPage;
    
    $scope.isLoaderVisiable = false;
    $scope.activeView = {};
    $scope.searchModel = {};
    
    $scope.imgPrefix = network.servisePathPHP + '/GetCroppedImage?i=';
    $scope.imgSuffix = '&h=256&w=256';

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
    
    page.showLoader = function(topSelector,bottomSelector) {
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
      
      $scope.isLoaderVisiable = true;
    };
    
    page.hideLoader = function(){
      document.getElementById('loader').style.top = '';
      document.getElementById('loader').style.bottom = '';
      $scope.isLoaderVisiable = false;
    };
    
    $scope.hideLoader = page.hideLoader;

    /*--------- NAVIGATION --------*/
    $scope.onBack = function() {
      console.log('GO BACK');
      if (!network.getConnection()){
        return false;
      }
      return page.goBack();
    };


    page.goBack = function() {
      network.stopAll();

      var oldPage = page.navigatorPop();
      if (oldPage) {
        
        if (oldPage.callback) {
          oldPage.callback(oldPage.params);
          return true;
        }
        
        var delay = 0;
        if (device.isIOS()) delay = 100;
        $timeout(function() {
          page.show(oldPage.name,oldPage.params,true);
        },delay);
        return true;
      } else {
        return false;
      }
    };
    
    document.addEventListener("backbutton", function(event){
      $scope.$apply(function(){
        if(!$scope.onBack()){
          navigator.app = navigator.app || {};
          navigator.app.exitApp();
        };
      });
    }, false);

    page.show = function(pageId, params, isBack, skipConnectionCheck) {
      if (!page.getPermission(pageId)) {
        var savedTab = page.getActiveTabView();
        page.hideLoader();
        dialog.create(dialog.INFO,'Page unavailable',
          'Sorry, this page will be available<br>in sprint '+page.getPageSprint(pageId),'OK').show();
        page.setActiveTabView(savedTab);
        return false;
      };
      
      if (!skipConnectionCheck) {
        if (!network.getConnection()){
          return false;
        }
      }
      $rootScope.$broadcast('freeMemory');
      page.showLoader();
      params = params || {};
      if (!isBack) {
        params.isBack = false;
        page.navigatorPush();
      } else {
        params.isBack = true;
      }

      $scope.activePage = {};
      $scope.activePage[pageId] = true;
      $scope.currentPage = pageId;
      
      page.setActiveTabView(pageId);
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
      $scope.smallSearch = params.smallSearch;
      if (params.smallSearch) {
        app.animate(document.querySelector('.search-wrap'),250);
      }
      
      $scope.profileHeaderShow = params.profileHeader;
      $scope.rankingHeaderShow = params.rankingHeader;
      $scope.tabsAvailable = params.tabs;
      $scope.title = params.title;
    };
    
    page.showForResult = function(pageId,params,resultCallback) {
      resultCallback = resultCallback || function(){};
      params = params || {};
      params.requestResult = true;
      var waitPage = page.currentPage;
      page.show(pageId,params);
      if (typeof page.pageRequestResults[pageId] === 'function') {
        page.navigatorPop();
        page.pageRequestResults[pageId](params,function(response){
          params.response = response;
          page.show(waitPage,params);
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
    
    /*------- AVATAR -------*/
    
    var uploadAvatar = function(data) {
      network.post('product/changeMainMedia/',data,function(result,response){
        if (result) {
          console.log(response);
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
        var img = document.getElementById('avatar_img');
        img.src = "data:image/jpeg;base64," + imageData;
        var data = { media_data: { content: imageData
                                 , mime_type: 'image/jpeg'
                                 }
                   , id: userService.getProductId()
                   };
        uploadAvatar(data);
      });

      imageUpload.setOnFail(function(message) {
        alert('Some thing went wrong when capturing photo');
      });
      
    };
    
    
    
    /*---------- TABS --------*/
    $scope.profileTabs = [
      {title: 'posts'},
      {title: 'points'},
      {title: 'bio'},
      {title: 'config'}
    ];
    
    page.addProfileTab = function(tabTitle) {
      for (var i = $scope.profileTabs.length-1; i >= 0; i-- ) {
        if ($scope.profileTabs[i].title === tabTitle) {
          return false;
        }
      }
      $scope.profileTabs.push({title: tabTitle});
    };
    
    page.removeProfileTab = function(tabTitle){
      for (var i = $scope.profileTabs.length-1; i >= 0; i-- ) {
        if ($scope.profileTabs[i].title === tabTitle) {
          $scope.profileTabs.splice(i,1);
          break;
        }
      }
    };
    
    page.setTabsVisiable = function(value){
      $scope.tabsAvailable = value;
    };
    
    page.onTabChange = function(pageName) {
      page.show(pageName,{});
    };
      
    page.setActiveTabView = function(view) {
      $scope.activeView = {};
      $scope.activeView[view] = true;
    };
    
    page.getActiveTabView = function() {
      return Object.keys($scope.activeView)[0];
    };
    
    $scope.changeView = function(view){
      if (!network.getConnection() || page.getActiveTabView() === view){
        return false;
      }
      page.showLoader('.header','.footer-menu');
      page.onTabChange(view);
      page.navigatorPop();
    };
    
    page.setProfileTab = function(tab) {
     // $timeout(function(){
        $scope.product = userService.getProduct();
      //});
      
      for (var i in $scope.profileTabs) {
        if (tab === $scope.profileTabs[i].title) {
          $scope.profileTabs[i].isActive = true;
          continue;
        } 
        $scope.profileTabs[i].isActive = false;
      }
      
      page.onProfileTabChange(tab);
    };
    
    $scope.onProfileTabTouch = function(tab) {
      page.setProfileTab(tab.title);
    };
    
    /*------ HEADER CONTROL ------*/
    
    $scope.showMenu = function() {
      page.show('menu',{});     
    };
    
    $scope.postNow = function() {
      page.showLoader();
      header.post();
    };
    
    $scope.save = function() {
      header.save();
    };
    
    $scope.onDoIt = function() {
      header.doIt();
    };
    
    $scope.goToChart = function() {
      page.show('chart',{});
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

    /*------- FACEBOOK -------*/
    $scope.getHtml = feed.getHtml;
    facebook.toggleShareMenu = function(value, params) {
      $scope.isShareShow = value;
      if (!value) page.navigatorPop();
      if (value) {
        page.navigatorPush(function(){
          $scope.closeShareMenu(false,true);
          try {$scope.$digest();} catch(e){}
        });
        app.animate(document.getElementsByClassName('animate-fb-share')[0],250);
        $scope.shareItem = params;
        $scope.shareItem.hotel = userService.getHotelName();
      }
    };
    
    $scope.closeShareMenu = function(event,force) {
      if (force || event.target.className.indexOf('popup-block') >= 0) {
        facebook.toggleShareMenu(false);
        page.setTabsVisiable(true);
      }
    };
    
    $scope.shareNow = function(shareItem) {
      facebook.toggleShareMenu(false);
      page.setTabsVisiable(true);
      page.showLoader();
      try{$scope.$digest();}catch(e){};
      var share = function() {
        var data = { message: shareItem.message.replace(/<br>/gim,'')
                   , link: shareItem.media_url
                   };
        facebook.api('POST','me/feed',data,function(result, response){
          page.hideLoader();
          console.log('send',result, response);
          if (result) {
            $timeout(function(){
              dialog.create(dialog.INFO, 'Thanks!', 'Your post was successfully<br/>published in Facebook', 'OK', null).show();
            });
          }
        });
      };
      openFB.getLoginStatus(function(status) {
        if (status.status !== 'connected') {
          facebook.toggleShareMenu(false);
          page.setTabsVisiable(true);
          localStorage.removeItem('do_not_link'+userService.getUser().id);
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
    
    page.requestFBAvatar = function(){
      if (facebook.isActive()) { 
        dialog.create(dialog.QUESTION,'Use Facebook avatar?','Do you want use Facebook avatar?','Yes','No',function(answer){
          if (answer) {
            facebook.getBase64Avatar(function(base,mimeType){
              var data = { media_data: { content: base
                                       , mime_type: mimeType
                                       }
                         , id: userService.getProductId()
                         };
              uploadAvatar(data);
            },true);
          }
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
                  $scope[dialogType] = true;
                  page.navigatorPush(function(){
                    $scope[dialogType] = false;
                    callback(false);
                    try {$scope.$digest();} catch(e){};
                  });
                  try {$scope.$digest();} catch(e){};
                  
               },
               hide: function() {
                 $timeout(function(){
                   $scope[dialogType] = false;
                 });
               }
             };
    };
     
    dialog.toggleUserMenu = function(value) {
      if (value) page.navigatorPush(function(){
        $scope.closeUserMenu(false,true);
        console.log('back');
        try{$scope.$digest();}catch(e){}
      });
      if (!value) page.navigatorPop();
      
      $scope.isUserMenuShow = value;
    };
    
    dialog.togglePhotoMenu = function(value) {
      if (value) page.navigatorPush(function(){
        $scope.closePhotoMenu(false,true);
        try{$scope.$digest();}catch(e){}
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
    $scope.closePhotoMenu = function(event,force) {
      if (force || event.target.className.indexOf('popup-message') >= 0) {
        dialog.togglePhotoMenu(false);
      }

    };
    
    /*------- SEARCH --------*/
    searchService.setInputValue = function(value) {
      $scope.searchModel.value = value;
    };
    
    $scope.onSearchInputFocus = function() {
      if (page.currentPage !== 'searchPage')
        page.show('searchPage',{});
    };
    
    $scope.onSearchInputBlur = function() {
//      setTimeout(function(){
//        $scope.searchModel.value = '';
//        $scope.onBack();
//      },300);
    };
    
    $scope.onSearchChange = function(value) {
      searchService.onSearch(value);
    };

    /*------- LIGHTBOX -------*/

    lightbox.visiable = function(value) {
      $scope.isLightBoxShow = value;
      if (value) {
        page.navigatorPush(function(){
          lightbox.visiable(false);
          if (screen.lockOrientation) screen.lockOrientation('portrait');
        });
      }
      if (screen.unlockOrientation) screen.unlockOrientation();
    };
    
    $scope.closeLightBox = function() {
      page.navigatorPop();
      lightbox.visiable(false);
      if (screen.lockOrientation) screen.lockOrientation('portrait');
    };
    
    $scope.showCloseBtn = function() {
      $scope.isCloseBtnShow = true;
      $timeout(function(){
        $scope.isCloseBtnShow = false;
      },2000);
    };
    
    $scope.swipe = lightbox.swipe;
    
    $scope.showPictureInLightBox = lightbox.showPicture;
    
    /*------- INIT BLOCK --------*/
    document.querySelector('html').addEventListener('keydown',function(event){
      if (event.altKey && event.keyCode === 77) {
          $scope.showMenu();
          $scope.$digest();
      }
      if (event.altKey && event.keyCode === 66) {
        page.goBack();
      }
    });
    
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
    
    $scope.getPostAge = page.getPostAge;
    
    document.addEventListener('pages_ready',function(){
      console.log('pages_ready');
      page.show(config.startPage,{start: true},false);
      //page.hideLoader();
    });
    page.showLoader();
    
//    $timeout(function(){
//      page.show(config.startPage,{},false);
//      page.hideLoader();
//    },300);
    
}]);


