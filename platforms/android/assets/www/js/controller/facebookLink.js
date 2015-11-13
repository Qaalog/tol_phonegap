tol.controller('facebookLink',['$scope','page','config','$timeout','facebook','network','userService','dialog',
  function($scope, page,config, $timeout,facebook,network,userService,dialog){

  $scope.FB = {};
  
  var FBStaus = function(status) {
    console.log(status);
    $timeout(function(){
      $scope.loginStatus = status.status;
      if (status.status === 'connected') {
        facebook.getUserAvatar('large',function(result,response){
          if (result) {
            $timeout(function(){
              try {
              $scope.FB.avatar = response.data.url;
              console.log('avatar', response);
              } catch(e) {};
            });
          }
        });
      } else {
        $scope.FB.avatar = '';
      }
    });
  };
  
  var calculateTopMargin = function() {
    
    var element = document.querySelector('.login-title');
    var bottomElement = document.querySelector('.fb-dont-link');
    
    var marginTop = getComputedStyle(element).marginTop.replace('px','')*1;
    
    var top = bottomElement.getBoundingClientRect().top;
    var height = bottomElement.getBoundingClientRect().height;
    
    var diff = height - (innerHeight - top);
    if (diff > 0)
    var newMargin = (marginTop - diff) - 8;
    element.style.marginTop = newMargin + 'px';
    
  };

  var settings = { name: 'facebookLink'
                 , title: 'Facebook Link'
                 , back: true
                 };         
                 
  page.onShow(settings,function(params) {
    if (localStorage.getItem('fbAccessToken'+userService.getUser().id)) {
      localStorage.setItem('fbAccessToken', localStorage.getItem('fbAccessToken'+userService.getUser().id));
    } else {
      localStorage.removeItem('fbAccessToken');
    } 
    $scope.params = params;
    $timeout(function(){
      calculateTopMargin();
    });
    $scope.onResult = false;
    openFB.getLoginStatus(function(status) {
      if (status.status === 'connected') {
        page.show('catalog',$scope.params);
      } else {
        var doNotLink = localStorage.getItem('do_not_link'+userService.getUser().id);
        if (doNotLink) {
           page.show('catalog',$scope.params);
           return false;
        }
        page.hideLoader();
      }
    });
    
  });
  
  page.onRequestResult(settings,function(params,onResult) {
    $scope.onResult = onResult;
  });
    
  $scope.linkNow = function() {
    
    if (!config.IS_DEBUG && config.SPRINT < 2) {
      dialog.create(dialog.INFO,'Page unavailable',
          'Sorry, this functionality will be available<br>in sprint 2','OK').show();
        return false;
    }
    
    openFB.login(function(response) {
      console.log('login',response.authResponse.accessToken);
      
      $scope.longLife(function() {
        if ($scope.params.requestResult) {
          $scope.onResult(true);
          return false;
        }
        $timeout(function(){
          page.show('catalog',$scope.params);
        });
        //openFB.getLoginStatus(FBStaus);
      });
      
      
    }, {scope: 'publish_actions'});
    
  };
  
  $scope.doNotLink = function() {
   localStorage.setItem('do_not_link'+userService.getUser().id,true);
   if(!$scope.params.username) {
     if ($scope.params.requestResult) {
       $scope.onResult(false);
       return false;
     }
     page.goBack();
     return false;
   }; 
   page.show('catalog',$scope.params);
   
//    openFB.logout(function(info){
//      console.log('logout',info);
//      
//      openFB.getLoginStatus(FBStaus);
//    });
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
        return true;
      }
      if ($scope.params.requestResult) $scope.onResult(false);
    });
  };
  
  /*FACEBOOK TEST METHODS*/

 /* var serialize = function(data) {
    var result = '';
    for (var key in data) {
      var value = data[key];
      result += key + '=' + encodeURI(value) + '&';
    }

    return result.replace(/&$/,'');
  };
  
  var httpReq = function(method,path,data,callback) {
    callback = callback || function(){};
    
    var http = new XMLHttpRequest();
    http.open(method,path,true);
    http.onreadystatechange = function(){
      if (http.readyState === 4) {
        callback(http.responseText);
      }
    };
    http.send(serialize(data));
  };
 
  var pathAuth = 'https://www.facebook.com/dialog/oauth';
  var pathFeed = 'https://graph.facebook.com/me/feed';
  var pothGraphMe = 'https://graph.facebook.com/me';
  var token = '';
  
  $scope.openFB = function(request) {
//      if (!token) token = localStorage.getItem('token');
//      var appToken = '1640922159530753|91174441bf8fe6f939f0e1c0d4be81b8';
//      var data = {
//      //  message: 'TEST NEW M',
//        access_token: token
//      };
//
////      httpReq('POST',pathFeed,data,function(response) {
////        console.log(response);
////      });
//      httpReq('GET',pothGraphMe+'/picture?type=large&redirect=false&access_token='+token,{},function(response) {
//        try {
//          response = JSON.parse(response);
//        }catch(e){};
//        var img = document.createElement('img');
//        img.src = response.data.url;
//        document.body.appendChild(img);
//        console.log(response);
//      });

    openFB.api(
    {
        method: 'GET',
        path: '/me/picture',
        params: {
            type: 'large',
            redirect: false
        },
        success: function(s){console.log(s);},
        error: function(e){console.log(e);}
    });


    };
  
  $scope.loginFb = function() {
    
//    var test = 'https://www.facebook.com/dialog/oauth?client_id=1640922159530753&response_type=token&redirect_uri=http://localhost/TOL/www/index.html';
//
//    var win = window.open(test,'_blank');
//      setTimeout(function(){
//      token = /access_token=(.+)&/.exec(win.location.hash)[1];
//      console.log(token);
//      localStorage.setItem('token',token);
//      win.close();
//    },500);

      openFB.login(function(token){
        console.log(token);
      }, {scope: 'publish_actions'});

  };*/
    
  
  
  
}]);
