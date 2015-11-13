tol.controller('profile',['$scope','page','network','facebook','config','feed','$sce','$timeout','dialog','userService',
  function($scope, page, network,facebook,config,feed,$sce,$timeout,dialog,userService){
    
  var currentTab, pointsTables = [];  
  var settings = { name: 'profile'
                 , search: true
                 , chart: true
                 , tabs:  true
                 , profileHeader: true
                 };       
  $scope.productId;
  
  $scope.imgPrefix = network.servisePathPHP + '/GetCroppedImage?i=';
  $scope.imgSuffix = '&h=256&w=256';
  
  page.onShow(settings,function(params) {
    console.log('profile params',params);
    if (params.productId === null) {
      page.goBack();
      dialog.create(dialog.INFO,'INFO', 'Information about this<br>person is missing ','OK').show();
    }
    page.onProfileShow();
    var fileSelector = document.getElementById('avatar_selector_input');
    $scope.params = params;
    $scope.isFBLinked = ( localStorage.getItem('fbAccessToken'+userService.getUser().id) ) ? true : false;
    $scope.userProductId = userService.getProductId();
    console.log($scope.isFBLinked);
    if (params.productId && params.productId*1 !== $scope.userProductId) {
      page.removeProfileTab('config');
      if (fileSelector) fileSelector.disabled = true;
    } else {
      page.addProfileTab('config');
      if (fileSelector) fileSelector.disabled = false;
    }
    $scope.productId = params.productId || $scope.userProductId;
    $scope.getProduct();
    $scope.hotelName = userService.getHotelName();
    
  });
  
  $scope.$on('freeMemory',function(){
    $scope.product = false;
    $scope.posts = [];
    $scope.points = [];
  });
  
  $scope.$on('onProductChanged',function(product){

  });
  
  $scope.getProduct = function() {
    network.get('product/'+$scope.productId,{},function(result, response){
      if (result) {
        $scope.product = response;
        userService.setProduct(response);
        console.log(response);
        $scope.chars = response.characteristics;
        $scope.telephone = false;
        for (var i = $scope.chars.length-1; i >= 0; i--) {
          var char = $scope.chars[i];
          if (char.short_name === 'phone' || char.short_name === 'tel' || char.short_name === 'telephone') {
            $scope.telephone = $scope.chars.splice(i,1)[0];
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
        if (!currentTab) page.setProfileTab('points'); else page.setProfileTab(currentTab);
      }
    },false,true);
  };

  page.onProfileTabChange = function(tab) {
    currentTab = tab;
    $scope.isPointsShow = false;
    $scope.isPostsShow = false;
    $scope.isBioShow = false;
    $scope.isConfigShow = false;
    switch (tab) {
      
      case 'posts':
        $scope.isPostsShow = true;
        $scope.getMyPosts();
        page.showLoader('.profile-header','.footer-menu');
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
  
  var normalizePointsPerYear = function(pointsPerYear) {
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

 
  var months = ['December','January','February','March','April','May','June','July','August','September','October','November'];
  var currentPoint = 0;
  var maxPointIndex = 0;
  $scope.getPoints = function() {
    network.post('product/getPoints/',{id: $scope.productId},function(result, response){
      if (result) {
        for (var i in response) {
          if (response[i]['points_per_year']) {
            response[i]['points_per_year'] = normalizePointsPerYear(response[i]['points_per_year']);
          }
        }
        $scope.points = response;
        maxPointIndex = response.length - 1;
        $scope.point = response[currentPoint];
        console.log('POINTS >>> ',response);
        pointsTables = document.getElementsByClassName('profile_points_tables');
        $scope.changePoint();
        $scope.showPrevArrow = false;
      }
      page.hideLoader();
    });
  };
  
  $scope.changePoint = function(direction) {
    $scope.showPrevArrow = true;
    $scope.showNextArrow = true;
//    for (var i = 0, l = pointsTables.length; i < l; i++) {
//      pointsTables[i].style.height = '';
//    }
    
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
      currentPoint = 0;
      $scope.pointIndex = 0;
      $scope.currentPoint = $scope.points[0];
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
    
    setTimeout(function(){
        for (var i = 0, l = pointsTables.length; i < l; i++) {
          if (pointsTables[i].className.indexOf('center') > -1) continue;
          pointsTables[i].style.height = '1em';
        }
      },300);
    
//    if (pointsTables[0]) {
//      var transition = (pointsTables[0].style.transition !== undefined)? 'transition' : 'webkitTransition';
//      var transform = (pointsTables[0].style.transform !== undefined)? 'transform' : 'webkitTransform';
//    }
    
    
      
//    setTimeout(function(){
//      for (var i = 0, l = pointsTables.length; i < l; i++) {
//        pointsTables[i].style[transition] = 'transform 0.3s';
//        if (pointsTables[i].className.indexOf('center') >= 0)
//          pointsTables[i].style[transform] = 'translate3d(0,0,0)';
//        if (pointsTables[i].className.indexOf('right') >= 0)
//          pointsTables[i].style[transform] = 'translate3d(120%,0,0)';
//        if (pointsTables[i].className.indexOf('left') >= 0)
//          pointsTables[i].style[transform] = 'translate3d(-120%,0,0)';
//      }
//    },100);

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
    page.show('givePoints',feedItem);
  };
  
  $scope.getPostAge = page.getPostAge;
  
  $scope.getHtml = feed.getHtml;
  $scope.showShareMenu = feed.showShareMenu;
  $scope.userMenuShow = feed.userMenuShow;
  $scope.deleteFeedItem = feed.deleteFeedItem;
  $scope.editFeedItem = feed.editFeedItem;
  $scope.showWhoGivePoints = feed.showWhoGivePoints;
  $scope.showPictureInLightBox = feed.showPictureInLightBox;
  
  $scope.getMyPosts = function() {
    feed.getFeed({},{'from_product_id': $scope.productId,'my_product_id': userService.getProductId()}, function(feedItems) {
      $scope.posts = feedItems;
      page.hideLoader();
    });
    
  };
  
  $scope.$on('post_deleting',function(event,item){
    if (!$scope.posts) return false;
    if ($scope.posts.length < 1) return false;
    $scope.posts.splice(item.index,1);
  });
  
  $scope.$on('post_delete_failed',function(event,item){
    if (!$scope.posts) return false;
    if ($scope.posts.length < 1) return false;
    $scope.posts.splice(item.index,0,item);
    //$scope.$digest();
  });
  
  
  $scope.goToChangePassword = function() {
    page.show('changePassword',{});
  };
  
  $scope.logout = function() {
    network.logout();
  };
  
  $scope.changeOrganization = function() {
    var user = userService.getUser();
    delete user['catalog_id'];
    page.show('catalog',user);
    page.navigatorClear();
  };
  
  $scope.loginToFb = function() {
    if (!config.IS_DEBUG && config.SPRINT < 2) {
      dialog.create(dialog.INFO,'Page unavailable',
          'Sorry, this functionality will be available<br>in sprint 2','OK').show();
        return false;
    }
    openFB.login(function(response) {
      console.log('login',response.authResponse.accessToken);
      $timeout(function(){
        $scope.isFBLinked = true;
      });
      $scope.longLife(function(){
        dialog.create(dialog.INFO,'Connected!','You have linked your Facebook<br>account successfully.','OK').show();
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
        callback();
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
    if (bio.short_name !== 'address') return false;
    var address = bio.oldValue.replace(/[^a-zA-Z\s0-9,]/g,'');
    network.getAddressLink(address, function(path){
      if (!path) {
        path = 'http://maps.google.com/maps?q=loc:' + address;
      }
      window.open(path, '_system');
    });
  };
    
}]);

