tol.controller('profile',['$scope','page','network','facebook','config','feed','$sce','$timeout','dialog','userService','device','$filter',
  'analytics','imageUpload', 'pager','$rootScope',
  function($scope, page, network,facebook,config,feed,$sce,$timeout,dialog,userService,device,$filter, analytics,imageUpload,pager,$rootScope){
    
  var currentTab, pointsTables = [];  
  var settings = { name: 'profile'
                 , search: true
                 , chart: true
                 , tabs:  true
                 , smallBack: true
                 , smallSearch: true
                 , profileHeader: true
                 };       
  $scope.productId;
  
  //$scope.imgPrefix = network.servisePathPHP + '/GetCroppedImage?i=';
  $scope.imgPrefix = network.servisePathPHP + '/GetResizedImage?i=';
  $scope.imgSuffix = '&h=256&w=256';
  
  $scope.imgResizedPrefix = network.servisePathPHP + 'GetResizedImage?i=';
  $scope.imgResizedSuffix = '&w=' + Math.round(innerWidth - device.emToPx(2));
  var repeat;
  var lastProductId;
  
  page.onShow(settings,function(params) {
    lastProductId = lastProductId || userService.getProductId();
    imageUpload.setAllowEdit(true);
    console.log('profile params',params);
    app.protectHeader();
    $scope.authProductId = userService.getAuthProduct().id;
    $scope.getFBName = facebook.getName;
    
    if (params.productId === null) {
      page.goBack();
      dialog.create(dialog.INFO,'INFO', 'Information about this<br>person is missing ','OK').show();
    }
    
    
    page.onProfileShow();
    
    var fileSelector = document.getElementById('avatar_selector_input');
    $scope.params = params;
    $scope.isFBLinked = ( localStorage.getItem('fbAccessToken'+userService.getUser().id) ) ? true : false;
    $scope.userProductId = userService.getProductId();
    
    if (params.productId && params.productId*1 !== $scope.userProductId) {
      page.removeProfileTab('config');
      if (fileSelector) fileSelector.disabled = true;
    } else {
      page.addProfileTab('config');
      if (fileSelector) fileSelector.disabled = false;
    }
    
    $scope.productId = params.productId || $scope.userProductId;
    if (lastProductId !== $scope.productId) {
      console.log('profile pager update');
      network.pagerReset('profile');
      lastProductId = $scope.productId;
      savedPoint = 0;
      page.setProfileTab('bio');
    }
    
    $scope.getProduct();
    $scope.hotelName = userService.getHotelName();
    params.productId = params.productId || $scope.userProductId;
    page.setProfileProductId(params.productId*1);
  });
  
  $scope.$on('freeMemory',function(){
    $scope.product = false;
    $scope.posts = [];
    $scope.points = [];
  });
  
  $scope.$on('onProductChanged',function(product){

  });
  
  var iconStyleElement, iconStyleSheet;
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
  
  var updateCategoryIcon = function(category,icon) {
    if (!iconStyleSheet) {
      createNewStyleSheet();
    }
    iconStyleSheet.addRule('.q-icon_category_'+category+':before', 'content: "\\'+icon+'"!important;');
  };
  
  $scope.getProduct = function() {
    network.get('product/'+$scope.productId,{characteristic_display: 4},function(result, response){
      if (result) {
        $scope.product = response;
        userService.setProduct(response);
        console.log(response);
        $scope.chars = response.characteristics;
        $scope.telephone = false;
        for (var i = $scope.chars.length-1; i >= 0; i--) {
          var char = $scope.chars[i];
          
          
          if (char.short_name === 'phone' || char.short_name === 'email') {
            var href = (char.short_name === 'phone') ? 'tel:' : 'mailto:';
            if (char.short_name === 'email') {
              char.short_name = 'mail'; // gmail hack for android.
            }
            var html = '';
            if (char.image_url) {
              html = '<span class="q-icon_category_'+ char.short_name
                   + ' icon"></span><a href=\'' + href + char.value + '\' class="phone">'
                   + char.value + '</a>';
              updateCategoryIcon(char.short_name, char.image_url);
            } else {
              html = '<a href="mailto:' + char.value + '" class="phone" style="padding: 0;">'+ char.value + '</a>';
            }
            char.long_name = '';
            char.value = html;
          }
          
          if (char.short_name === 'date') {
            char.value = $filter('date')(char.value, 'dd MMMM yyyy');
          }
          
          char.oldValue = char.value;
          if (/^http.?:\/\//.test(char.value)) {
            char.value = $sce.trustAsHtml('<a href="'+char.value+'">'+char.value+'</a>');
          } else {
            char.value = $sce.trustAsHtml(char.value);
          }
          
        }
        
        page.hideLoader();
        currentTab = $scope.params.tab || currentTab;
        if (!currentTab) page.setProfileTab('bio'); else page.setProfileTab(currentTab);
      }
    },false,true);
  };

  page.onProfileTabChange = function(tab) {
    if (currentTab === 'posts') {
      pager.stop();
    }
    currentTab = tab;
    $scope.isPointsShow = false;
    $scope.isPostsShow = false;
    $scope.isBioShow = false;
    $scope.isConfigShow = false;
    page.toggleVersionVisiable(false);
    switch (tab) {

      case 'posts':
        $scope.isPostsShow = true;
        $scope.getMyPosts();
        page.showLoader('.profile-header','.footer-menu');
        pager.load();
        break;
        
      case 'points':
        $scope.isPointsShow = true;
        $scope.getPoints();
        page.showLoader('.profile-header','.footer-menu');
        break;

      case 'bio':
        page.hideLoader();
        $scope.isBioShow = true;
        break;
        
      case 'config':
        page.hideLoader();
        $scope.isConfigShow = true;
        page.toggleVersionVisiable(true);
        break;
    }
    
  };
  
  /*----- POINTS -----*/
 
  var test = {
    '2014': {
      
      '2015-10': {
        'characteristic_id': "3",
        'month': "10",
        'period': "2015-10",
        'points': "39",
        'to_product_id': "8"
      },
      '2015-09': {
        'characteristic_id': "3",
        'month': "09",
        'period': "2015-09",
        'points': "50",
        'to_product_id': "8"
      }
      
    }
  };
  
  var calculateTotalPointsPerYear = function(year) {
    var totalPoints = 0;
    for (var month in year) {
      totalPoints += year[month].points*1;
    }
    return totalPoints;
  };
  
  var normalizePointsPerYear1 = function(pointsPerYear) {
    var years = [];
    var months = [];
    
    for (var year in pointsPerYear) {
      
      for (var month in pointsPerYear[year]) {
        pointsPerYear[year][month].year = year;
        months.push(pointsPerYear[year][month]);
      }
      pointsPerYear[year] = months;
      pointsPerYear[year][0].total = calculateTotalPointsPerYear(pointsPerYear[year]);
      years.push(pointsPerYear[year]);
    }
    return years;
  };
  
  $scope.isEmptyObject = function(obj) {
    return (Object.keys(obj).length > 0) ? false : true;
  };
  
  
  function normalizePointsPerYear(pointsPerYear) {
    console.log('pointsPerYear', pointsPerYear);
  }
 
  var months = ['December','January','February','March','April','May','June','July','August','September','October','November'];
  var currentPoint = 0;
  var maxPointIndex = 0;
  var savedPoint = 0;
  
  $scope.getPoints = function() {
    network.post('product/getPoints/',{id: $scope.productId},function(result, response){
      page.hideLoader();
      if (result) {
        if (response.length < 1) {
          page.toggleNoResults(true, 'No result found.', '#eaeaea');
          return false;
        }
//        for (var i in response) {
//          if (response[i]['points_per_year']) {
//            response[i]['points_per_year'] = normalizePointsPerYear(response[i]['points_per_year']);
//          }
//        }
        
        $scope.points = response;
        maxPointIndex = response.length - 1;
        $scope.point = response[currentPoint];
        console.log('POINTS >>> ',response);
        pointsTables = document.getElementsByClassName('profile_points_tables');
        $scope.changePoint();

      }
      
    });
  };
  
  $scope.changePoint = function(direction) {
    $scope.showPrevArrow = true;
    $scope.showNextArrow = true;
    
    if (direction === 'prev') {
      currentPoint--;
      
      if (currentPoint < 1) {
        currentPoint = 0;
        $scope.showPrevArrow = false;
      }
      
      pointsTables[currentPoint].style.height = '';
      $scope.pointIndex = currentPoint;
      $scope.currentPoint = $scope.points[currentPoint];
    }
    
    if (direction === 'next') {
      currentPoint++;
      if (currentPoint >= maxPointIndex) {
        currentPoint = maxPointIndex;
        $scope.showNextArrow = false;
      }

      pointsTables[currentPoint].style.height = '';
      $scope.pointIndex = currentPoint;
      $scope.currentPoint = $scope.points[currentPoint];
    }

    if (!direction) {
      savedPoint = savedPoint || 0;
      currentPoint = savedPoint;
      $scope.pointIndex = savedPoint;
      $scope.currentPoint = $scope.points[savedPoint];
      if (currentPoint === 0) $scope.showPrevArrow = false;
      if (currentPoint === $scope.points.length - 1) $scope.showNextArrow = false;
    }
    
    var levels = $scope.point.levels.split(';');
    $scope.pointsLeft = 0;
    $scope.currentLevel = 0;
    $scope.maxLevel = levels.length;
    
    for (var i in levels) {
      if ($scope.point['points_current_period'].points*1 < levels[i]*1) {
        $scope.pointsLeft = levels[i] - $scope.point['points_current_period'].points;
        break;
      }
      $scope.currentLevel++;
    }
    
    savedPoint = currentPoint;
    
    setTimeout(function(){
       for (var i = 0, l = pointsTables.length; i < l; i++) {
        if (pointsTables[i].className.indexOf('center') > -1) continue;
        pointsTables[i].style.height = '1em';
      }
    },300);

  };
  
  
//  $scope.onSwipeMove = function(event,index,position) {
//    
//    var transition = (pointsTables[index].style.transition !== undefined)? 'transition' : 'webkitTransition';
//    var transform = (pointsTables[index].style.transform !== undefined)? 'transform' : 'webkitTransform';
//    
//    pointsTables[index].style[transform] = 'translate3d('+position.x+'px,0,0)';
//    pointsTables[index].style[transition] = '';
//    if (position.x < 0 && pointsTables[index+1]) {
//      pointsTables[index+1].style[transform] = 'translate3d('+(innerWidth + position.x)+'px,0,0)';
//      pointsTables[index+1].style[transition] = '';
//    }
//
//    if (position.x > 0 && pointsTables[index-1]) {
//      pointsTables[index-1].style[transform] = 'translate3d(-'+(innerWidth - position.x)+'px,0,0)';
//      pointsTables[index-1].style[transition] = '';
//    }
//  };
  
  $scope.getMonth = function(month){
    month = month*1;
    month = (month > 11) ? 0 : month;
    return months[month];
  };
  
  /*----- -----*/
  
  $scope.givePoints = function(feedItem) {
    //page.show('givePoints',feedItem);
    return false;
  };
  
  $scope.getPostAge = page.getPostAge;
  
  $scope.getHtml = feed.getHtml;
  $scope.showShareMenu = feed.showShareMenu;
  $scope.userMenuShow = feed.userMenuShow;
  $scope.deleteFeedItem = feed.deleteFeedItem;
  $scope.editFeedItem = feed.editFeedItem;
  $scope.showWhoGivePoints = feed.showWhoGivePoints;
  $scope.showPictureInLightBox = feed.showPictureInLightBox;
  $scope.getStatusDescription = feed.getStatusDescription;
  $scope.getOtherCount = feed.getOtherCount;
  $scope.getOtherCountHtml = feed.getOtherCountHtml
  $scope.isProductOneOfProductList = feed.isProductOneOfProductList;
  $scope.formatDate = feed.formatDate;
  $scope.getSharePermission = feed.getSharePermission;
  $scope.getYouGave = feed.getYouGave;
  $scope.preparePoints = feed.preparePoints;
  $scope.goToLink = feed.goToLink;
  $scope.getQuoteType = feed.getQuoteType;
  $scope.setLikeFeedItem = feed.setLikeFeedItem;
  $scope.prepareLikes = feed.prepareLikes;
  $scope.getTappedByMe = feed.getTappedByMe;
  $scope.getMarksCountByType = feed.getMarksCountByType;
  $scope.feedService = feed;
  $scope.getExternalQuoteName = feed.getExternalQuoteName;
  $scope.giversFilter = feed.giversFilter;
  $scope.toggleGivePoints = feed.toggleGivePoints;
  $scope.unrecognizeItem = feed.unrecognizeItem;
  $scope.borderedUserTitle = feed.borderedUserTitle;
  $scope.getPostType = feed.getPostType;
  $scope.showPostDetails = feed.showPostDetails;
  $scope.showProfile = function (productId) {
    page.show('profile', {productId: productId});
  };

  $scope.getMyPosts = function() {
    repeat = repeat || new ElRepeat(document.querySelector('#profile_feed'));

    var data = { 'for_product_id': $scope.productId
               , 'my_product_id': userService.getProductId()
               , 'feedId': 'profile_feed'
               , 'loaderSelector': 'profile_loader'
               , 'topLoaderSelector': 'profile_top_loader'
               , 'containerSelector': 'profile_container'
               , 'context': 'profile'
               , 'needUpdate': $scope.params.needUpdate
               };

    feed.getFeed(repeat, data, function(feedItems) {

      $scope.posts = feedItems;
      page.hideLoader();

    });
  };
  
//  $scope.$on('post_deleting',function(event,item){
//    if (!$scope.posts) return false;
//    if ($scope.posts.length < 1) return false;
//    $scope.posts.splice(item.index,1);
//  });
//  
//  $scope.$on('post_delete_failed',function(event,item){
//    if (!$scope.posts) return false;
//    if ($scope.posts.length < 1) return false;
//    $scope.posts.splice(item.index,0,item);
//    //$scope.$digest();
//  });
  
  
  $scope.goToChangePassword = function() {

//    analytics.trackEvent([ 'Change password profile button click'
//                         , 'Change password profile button click'
//                         , 1
//                         ]);
    
    page.show('changePassword',{});
  };
  
  $scope.logout = function() {
//    analytics.trackEvent([ 'Logout profile button click'
//                         , 'Logout profile button click'
//                         , 1
//                         ]);
    $rootScope.$broadcast('clearSavedDataEvent')
    network.logout();
  };
  
  $scope.changeOrganization = function() {
    var user = userService.getUser();
    delete user['catalog_id'];
    page.show('catalog',user);
    //page.navigatorClear();
  };
  
  $scope.loginToFb = function() {
//    analytics.trackEvent([ 'Link Facebook account profile button click'
//                         , 'Link Facebook account profile button click'
//                         , 1
//                         ]);
    
    openFB.login(function(response) {
      console.log('login',response.authResponse.accessToken);
      $timeout(function(){
        $scope.isFBLinked = true;
      });
      $scope.longLife(function(){
        dialog.create(dialog.INFO,'Connected!','You have linked your Facebook<br>account successfully.','OK', '', function(){
          page.requestFBAvatar();
        }).show();
      });
      
      
    }, {scope: 'publish_actions'});
  };
  
  $scope.longLife = function(callback) {
    callback = callback || function(){};
    var data = {
      grant_type: 'fb_exchange_token'           
      , client_id: app.fbAppId
      , client_secret: app.fbAppSecret
      , fb_exchange_token: localStorage.fbAccessToken
    };
    
    facebook.api('GET','oauth/access_token',data,function(result, response) {
      
      if (result) {
        var parsedResponse = /access_token=(.*)&expires=(.*)/.exec(response);
        localStorage.removeItem('do_not_link'+userService.getUser().id);
        localStorage.setItem('fbAccessToken',parsedResponse[1]);
        localStorage.setItem('fbAccessToken'+userService.getUser().id,parsedResponse[1]);
        localStorage.setItem('fbTokenExpire'+userService.getUser().id, new Date().getTime() + (parsedResponse[2]*1000) );
        facebook.loadName(function(result, response) {
          callback();
        });
      }
    });
  };
  
  $scope.logoutToFb = function() {
    dialog.create(dialog.QUESTION,'Unlink FB account?','Your Facebook account will be<br>unlinked. Are you sure?','YES','NO',
      function(answer){
        if (answer) {
          localStorage.removeItem('fbAccessToken'+userService.getUser().id);
          localStorage.removeItem('fbTokenExpire'+userService.getUser().id);
          openFB.logout(function(info){
            console.log('logout',info);
          });
          $scope.isFBLinked = false;
        }
    }).show();
  };
  
  $scope.showMap = function(bio) {
    if (bio.short_name === 'address') {
      var address = bio.oldValue.replace(/[^a-zA-Z\s0-9,]/g,'');
      network.getAddressLink(address, function(path){
        if (!path) {
          path = 'http://maps.google.com/maps?q=loc:' + address;
        }
        window.open(path, '_system');
      });
    }
    
    if (bio.short_name === 'email') {
      location.href = 'mailto:'+bio.oldValue;
    }
  };
  
  $scope.getUserName = function() {
    return userService.getAuthProduct().name;
  };
  
  $scope.getHotelName = function() {
    return userService.getHotelName();
  };
    
}]);

