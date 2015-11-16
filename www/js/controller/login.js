tol.controller('login',['$scope','config','page','network','device','userService','dialog',
  function($scope,config,page,network,device,userService,dialog){
    
 
  $scope.auth = {};
  var AUTH_KEY = config.AUTH_KEY;
  
  var settings = { name: 'login'
                 , title: 'Login'
                 };         
        
  page.onShow(settings,function(params) {
    console.log('PARAMS LOGIN',params);
    if (params.hard) {
      $scope.auth = {};
    }
    
    $scope.rememberMe = true; 
    page.setCheckBox('remember_me',$scope.rememberMe);
    
    if (!params.isBack && !params.logout) {
      var oldAuth = localStorage.getItem(AUTH_KEY);
      if (oldAuth && oldAuth !== null) {
        var encodedAuth = atob(oldAuth).split(':');
        console.log('encodedAuth',encodedAuth);
        $scope.auth.login = encodedAuth[0];
        $scope.auth.password = encodedAuth[1];
//        $scope.rememberMe = true; 
//        page.setCheckBox('remember_me',$scope.rememberMe);
        $scope.doLogin(oldAuth, params.start);
        return false;
      } 
    }
    page.hideLoader();
    
  });
  
  $scope.toggleCheckBox = function(event) {
    $scope.rememberMe = page.toggleCheckBox(event);
  };
  
  
  
  $scope.doLogin = function(login, start) {
    console.log('AUTH....',login);
               
    network.setUserKey(login);
    network.get('user',{},function(result,response) {
      if (result && response.length === 1) {
        console.log('user', response);
        
        var password = atob(login).split(':')[1];

        userService.setPassword(password);
        userService.setUserId(response[0].id);
        userService.setUser(response[0]);
        userService.setUserCode(response[0].username);

        if (response[0]['password_reset']*1 !== 1) {
          page.show('facebookLink',response[0]);
        } else {
          localStorage.removeItem(AUTH_KEY);
          page.show('changePassword',response[0]);
          setTimeout(function(){
            page.navigatorClear();
            page.navigatorPush(function() {
              page.show('login',{hard: true});
              page.navigatorClear();
            });
          },300);
        }
     //   page.show('catalog',{});
        
      } else {
        page.hideLoader();
        $scope.auth.password = '';
        if (!start) {
          loginError();
        }
      }
    }, true);
  };
  
  $scope.login = function(auth) {
    
    if (auth.login === 'g@m.i') {
      page.show('menu',{});
      return false;
    }
    
    if (!auth.login) {
      loginError();
      return false;
    }
    if (!auth.password) {
      loginError();
      return false;
    }
    page.showLoader();
    /*---- ONLY FOR TEST -----*/
    if (config.IS_DEBUG) {
      console.log(auth.login);
      if (auth.login === 'v@r.i') {
        auth.login = 'vradchenko@itera-research.com';
      }
      if (auth.login === 'y@p.i') {
        auth.login = 'ypilipenko@itera-research.com';
      }
    }
    /*---- TODO REMOVE -----*/

    var codedAuth = btoa(auth.login+':'+auth.password);
    
    if ($scope.rememberMe) {
      var oldAuth = localStorage.getItem(AUTH_KEY);

      if (oldAuth !== codedAuth) {
        localStorage.setItem(AUTH_KEY,codedAuth);
        console.log('change ' + oldAuth + ' to ' + codedAuth);
      }

    } else {
      localStorage.removeItem(AUTH_KEY);
      
    }
    
    $scope.doLogin(codedAuth);
    console.log('login', codedAuth, auth);
  };
  
  $scope.resetPassword = function(email) {
    if (email === undefined) {
      dialog.create(dialog.INFO,'Request failed','User name should be email','OK').show();
      $scope.forgotEmail = '';
      return false;
    }
    if (email === 'v@r.i') {
      $scope.forgotEmail = 'vradchenko@itera-research.com';
      email = 'vradchenko@itera-research.com';
    }
    network.resetPassword('user/forgotPassword',{username:email},function(result, response){
      console.log('Reset Password',response);
      $scope.isForgotPassShow = false;
    });
  };


  $scope.openForgotPass = function() {
    app.animate(document.querySelector('.forgot-test'),250);
    $scope.isForgotPassShow = true;
  };
  
  $scope.closeForgotPass = function(event) {
    if (event.target.className.indexOf('popup-block') >= 0) {
      $scope.isForgotPassShow = false;
    }
  };
  
  $scope.changeForgotPassPosition = function(isTop) {
    if (device.isAndroid()) {
      var wrap = document.querySelector('.white-box');
      setTimeout(function(){
        if (isTop) {
         wrap.style.top = 0;
        } else {
         wrap.style.top = '';
        }
      },500);
    }
  };
  
  $scope.onEnter = function(event,auth) {
    if (event.keyCode === 13) {
      $scope.login(auth);
      var inputs = document.querySelectorAll('.login-input');
      for (var i = 0, l = inputs.length; i < l; i++) {
        inputs[i].blur();
      }
    }
  };
  
  function loginError() {
    dialog.create(dialog.INFO,'Login failed','Incorrect username or password.','OK').show();
    $scope.auth.password = '';
  }
  
}]);

