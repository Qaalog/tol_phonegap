tol.service('network',['$http', 'page', 'config','$q','$timeout','$rootScope','userService','$httpParamSerializer','$filter', 'device','dialog',
  function($http, page,config,$q,$timeout,$rootScope, userService,$httpParamSerializer,$filter, device,dialog) {
  var $network = this;
  $network.servisePathPHP = config.servicePath;
  if (navigator.userAgent.toLocaleLowerCase().indexOf('windows') > -1 
          || navigator.userAgent.toLowerCase().indexOf('macintosh') > -1) {
//    $network.servisePathPHP = 'http://localhost/proxy/proxy.php/';
//    $http.defaults.headers.common['X-PATH'] = config.servicePath;
    
//    $network.servisePathPHP = 'http://localhost/proxy/tol_php.php/';
//    if (config.IS_DEBUG) {
//      $http.defaults.headers.common['X-DEBUG'] = true;
//    }
  }
  
  
  var CANCEL_TIMEOUT = config.DEFAULT_TIMEOUT;
  
  var abortBlock = false;
  var cancelerList = [];

  
  var entityKey = config.appKey;
  var userKey = '';

  var activeRequests = {};
  var lastRequest = {};
  
  $network.setUserKey = function(key) {
    userKey = key;
  };
  
  $network.setAbortBlock = function(value) {
    abortBlock = value;
  };
  
  $network.getActiveRequestsCount = function() {
    return activeRequests.length;
  };


  $network.stopAll = function() {
    for (var key in activeRequests) {
      var request = activeRequests[key];
      request.canceled = true;
      request.reGetTimeout = 1000;
    }

    window.stop();
  };


  var dialogFlag = false;
  $network.getConnection = function() {
//    if (navigator.connection) {
//      console.log('CONNECTION TYPE: ', navigator.connection.type);
//      if (navigator.connection.type === 'none' && !dialogFlag) {
//        dialogFlag = true;
//        page.show(config.startPage, {}, false, true);
//        $timeout(function () {
//          page.navigatorClear();
//          if (navigator.notification) {
//            navigator.notification.alert(app.translate('network_generic_no_network_message', 'Please check your network settings.'), function () {
//              dialogFlag = false;
//            }, app.translate('network_generic_no_network_title','Network unavailable'), app.translate('network_generic_error_button_ok','OK'));
//          } else {
//            alert(app.translate('network_generic_no_network_message','Please check your network settings.'));
//          }
//        });
//        return false;
//      }
//    }
    return true;
  };


//  document.addEventListener("online", function() {
//    $network.getConnection();
//    console.log('ONLINE');
//  });
//  document.addEventListener("offline", function() {
//    $network.getConnection();
//    console.log('OFFLINE');
//  });

  var checkAborted = function() {
    //activeRequests.pop();
    if (activeRequests.length === 0)  {
      $network.setAbortBlock(false);
    }
  };
  
  function setLastRequest(method,path,callback,params) {
    lastRequest = { method: method
                  , path: path
                  , callback: callback
                  , params: params
                  };
  };
  
  function getLastRequest() {
    return lastRequest;
  }
  
  function repeatLastRequest(onRepeatLastRequest, timeout) {
    onRepeatLastRequest = onRepeatLastRequest || function() {};
    var request = getLastRequest();
    if (!request.path) return false;
    reTry(request.method, request.path, request.callback, request.params, timeout, onRepeatLastRequest);
  }
  
  $network.repeatLastRequest = repeatLastRequest;
  
  function errorHandler(code,message,path,callback,params) {
    callback = callback || function(){};
    
    var result = {code: code, message: ''};
    console.log('error',code,message);
    switch (code) {
      case 401: 
        result.message = 'Unauthorized';
        $network.logout();
        break;
      
      case -1:
       console.log('activeRequests',activeRequests);
       if (typeof activeRequests[path] !== 'undefined' && !activeRequests[path].canceled) {
         console.log('no network');
         page.showNoConnection(function(){
           reTry(activeRequests[path].method, path, callback, params);
         });
       }
          
       break;
       
      default:
        result.message = 'Unknown error';
        break;
    };
    
    callback(false,result);
  };
  
  function reTry(method,path,callback,params, timeout, onReTry ) {
    console.log('Retry', params);
    onReTry = onReTry || function() {};
    var httpData = { 'method': method
                   , 'url': path
                   , timeout: timeout || CANCEL_TIMEOUT
                   };
    
    if (method.toLowerCase() !== 'get') {
      httpData.data = params;
    }
    
    $http(httpData)
          
          .success(function(result, status, headers) {
              callback(true, result);
              page.hideNoConnection();
              delete activeRequests[path];
              page.hideLoader();
              onReTry(true);
            })
          
          .error(function(data, status, headers, config, statusText) {
            errorHandler(status, data, path, callback, params);
            onReTry(false);
          });
  };
  
  $network.addAuth = function(params) {
    params['__appKey'] = entityKey;
    params['__userKey'] = userKey;
  };
  
  $network.get = function(methodName, params, callback, disableDefaultErrorHandler) {
    callback = callback || function(){};
    
    var path = $network.servisePathPHP + methodName;
    if (params) {
      $network.addAuth(params);
      path = $network.servisePathPHP + methodName + '?' + $httpParamSerializer(params);//$network.serialize(params);
    }
    
    activeRequests[path] = {method: 'get', reGetTimeout: 1000};
    setLastRequest('get', path, callback, params);
    
    $http({ 'method': 'get'
          , 'url': path
          , timeout: CANCEL_TIMEOUT
          })
          
          .success(function(result, status, headers) {
              if (typeof result === 'string') {
                callback(false, result);
                //alert('AHTUNG');
                return false;
              }
              callback(true, result);
              delete activeRequests[path];
            })
          
          .error(function(data, status, headers, config, statusText) {
            if (!disableDefaultErrorHandler) {
              errorHandler(status, data, path, callback);
              return true;
            }
            callback(false,data,status);
          });
  };
  
  $network.post = function(methodName, params, callback, disableDefaultErrorHandler) {
    
    callback = callback || function(){};
    
    params = params || {};
    $network.addAuth(params);
    
    var path = $network.servisePathPHP + methodName;

    activeRequests[path] = {method: 'post', reGetTimeout: 1000};
    setLastRequest('post', path, callback, params);
    
    var reqData = {'method': 'post'
                  , 'url': path
                  , 'data':  params
                  , timeout: CANCEL_TIMEOUT
                  };
    
    if (params.length) {
      reqData.url = path + '?__appKey='+entityKey+'&__userKey='+userKey;
    }
    
    $http(reqData)
            .success(function(result, status, headers) {
              callback(true, result);
            })
            .error(function(data, status, headers, config, statusText) {
              console.log(headers());
              if (!disableDefaultErrorHandler) {
                errorHandler(status, data, path, callback, params);
                return true;
              }
              callback(false,data,status);
            });

  };

  $network.delete = function(methodName, params, callback, disableDefaultErrorHandler) {

    callback = callback || function(){};

    params = params || {};
    $network.addAuth(params);

    var path = $network.servisePathPHP + methodName;

    activeRequests[path] = {method: 'delete', reGetTimeout: 1000};
    setLastRequest('delete', path, callback, params);

    var reqData = {'method': 'delete'
                  , 'url': path
                  , 'data':  params
                  , timeout: CANCEL_TIMEOUT
                  };

    if (params.length) {
      reqData.url = path + '?__appKey='+entityKey+'&__userKey='+userKey;
    }

    $http(reqData)
            .success(function(result, status, headers) {
              callback(true, result);
            })
            .error(function(data, status, headers, config, statusText) {
              console.log(headers());
              if (!disableDefaultErrorHandler) {
                errorHandler(status, data, path, callback, params);
                return true;
              }
              callback(false,data,status);
            });
  };

  $network.put = function(methodName, params, callback, disableDefaultErrorHandler) {
    
    callback = callback || function(){};
    
    params = params || {};
    //params['__entityKey'] = entityKey;
    //params['__userKey'] = userKey;
    
    var path = $network.servisePathPHP + methodName;
    
    activeRequests[path] = {method: 'put', reGetTimeout: 1000};
    setLastRequest('put', path, callback, params);

    $http({ 'method': 'put'
          , 'url': path + '?__appKey='+entityKey+'&__userKey='+userKey
          , 'data':  params
          //, timeout: CANCEL_TIMEOUT
          })
            .success(function(result, status, headers) {
              callback(true, result);
            })
            .error(function(data, status, headers, config, statusText) {
              
              if (!disableDefaultErrorHandler) {
                errorHandler(status, data, path, callback, params);
                return true;
              }
              callback(false,data,status);
            });

  };
  
  $network.testPassword = function(methodName, params, callback) {
    callback = callback || function(){};
    params['__appKey'] = entityKey;
    var path = $network.servisePathPHP + methodName + '?' + $network.serialize(params); ;

    $http({ 'method': 'get'
          , 'url': path
          , timeout: CANCEL_TIMEOUT
          })
          .success(function(result, status, headers) {
            callback(true, result);
          })
          .error(function(data, status, headers, config, statusText) {
            callback(false,data);
          });
  };
  
  $network.resetPassword = function(methodName, params, callback, reGet) {
    callback = callback || function(){};

    var path = $network.servisePathPHP + methodName;

    $http({ 'method': 'post'
          , 'url': path
          , 'data':  params
          , timeout: CANCEL_TIMEOUT
          })
            .success(function(result, status, headers) {
              callback(true, result);
            })
            .error(function(data, status, headers, config, statusText) {
              callback(false,data);
            });
  };
  
  $network.getOutside = function(path, params, callback) {
    callback = callback || function(){};
    
    var headers = {};
//    if (navigator.userAgent.toLocaleLowerCase().indexOf('windows') > -1 
//          || navigator.userAgent.toLowerCase().indexOf('macintosh') > -1) {
//          
//       var headerPath = path;
//       path = 'http://localhost/TOL/out.php';
//       headers['X-OUT-PATH'] = headerPath;
//    }
    
    $http({ 'method': 'get'
          , 'url': path
          , headers: headers
          , timeout: CANCEL_TIMEOUT
          })
          
          .success(function(result, status, headers) {      
            callback(true, result);
          })
          
          .error(function(data, status, headers, config, statusText) {
            callback(false,data,status);
          });
  };


  $network.getAddressLink = function(address,callback) {

    var path = 'http://maps.google.com/maps/api/geocode/json?address='+address+'&sensor=false';
    console.log('get coords for '+path);

    $http({ 'method': 'get'
          , 'url': path
          , 'dataType': 'json'
          })
          .success(function(data) {
            try {
              console.log('GEO DATA', data.results[0].geometry.location);
              var location = data.results[0].geometry.location;
              var mapsPath = 'http://maps.google.com/maps?q=loc:' + location.lat + ',' + location.lng;
              callback(mapsPath);
            } catch(e) {
              callback(false);
            }
          });
  };

  $network.logout = function(hideLogin) {
    hidelogin = hideLogin || false;
    localStorage.removeItem(config.AUTH_KEY);

    var deviceType = null;
    if (device.isAndroid()) deviceType = 'android';
    if (device.isIOS()) deviceType = 'ios';
    if (deviceType) {
      var data = { device_id: device.getUUID()
                 , device_type: deviceType
                 , product_id: userService.getAuthProduct().id
                 , registration_id: null
                 };

      $network.post('user/registerDevice',data);
    }
    
    $network.get('logout/',{},function(){});
    userService.clear();
    
    $network.pagerReset();
    if(!hideLogin){
        page.show('login',{hard: true});
    }
    page.navigatorClear();
    try {
      cordova.plugins.notification.badge.clear();
    } catch(e) {}
  };
  
  $network.pagerReset = function(key) {
    console.log('>>>>> network pager reset');
    var event = document.createEvent('Event');
    event.initEvent('need_reset', true, true);
    event.pagerKey = key;
    document.dispatchEvent(event);
  };
  
  $network.pagerUpdate = function(key) {
    console.log('>>>>> network pager update');
    var event = document.createEvent('Event');
    event.initEvent('need_update', true, true);
    event.pagerKey = key;
    document.dispatchEvent(event);
  };
  
  $network.getGeoPosition = function(callback) {
    callback = callback || function(){};
    if (!navigator.geolocation) {
      console.log('no geolocation');
      callback(false);
      return false;
    };
    
    var onSuccess = function(position) {
      callback(true,position.coords);
    };
    var onError = function(error) {
      console.error(error);
      callback(false);
    };
    navigator.geolocation.getCurrentPosition(onSuccess, onError,{timeout: 5000, enableHighAccuracy: true});
  };

  $network.showErrorAlert = function() {
    if (navigator.notification) {
      navigator.notification.alert(app.translate('network_generic_app_error_message','Something went wrong while fetching data.'),
        function(){},app.translate('network_generic_error_title','Network error'),
        app.translate('network_generic_error_button_ok','OK'));
    } else {
      alert(app.translate('network_generic_app_error_message','Something went wrong while fetching data.'));
    }
    //page.goBack();
  };
  
  
  $network.serialize = function(obj, prefix) {
    var str = [];
    for(var p in obj) {
      if (obj.hasOwnProperty(p)) {
        var k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];
        str.push(typeof v == "object" ?
          serialize(v, k) :
          encodeURIComponent(k) + "=" + encodeURIComponent(v));
      }
    }
    return str.join("&");
  };


  $network.now = function() {
    var date = new Date().getTime();
    return $filter('date')(date, 'yyyy-MM-dd HH:mm:ss');
  };

  $network.forceVersion = false;
  $network.checkAppVersion = function (callback) {
      function ltrim(str,search){
          while(str.charAt(0) === search)
              str = str.substr(1);
          return str;
      }
      callback = callback || function(){};
      var appVersion = app.version.split('.').join('');
      appVersion = ltrim(appVersion,'0');
      $network.get('/info', {appId: config.appId}, function (result, response) {
          if (result) {
              console.log(response);
              if(response.app &&  response.app.presets && response.app.presets.parameter
                 && response.app.presets.parameter.force_upg_version && response.app.presets.parameter.force_upg_version.value){
                  $network.forceVersion = response.app.presets.parameter.force_upg_version.value;
                  var forceVersion = $network.forceVersion.split('.').join('');
                  forceVersion = ltrim(forceVersion,'0');
                  callback(forceVersion*1 <= appVersion*1);
              } else {
                  callback(true);
              }
          } else {
              callback(true);
          }
      }, true);
  };

  $network.doLogin = function(login, start,fromLoginButton,scope) {
          var AUTH_KEY = config.AUTH_KEY;
          scope = scope || false;
          start = start || false;
          fromLoginButton = fromLoginButton || false;
          $network.setUserKey(login);
          $network.get('logout/',{},function(){
              $network.get('user',{},function(result,response,status) {
                  if (result && response.length === 1) {

                      var password = atob(login).split(':')[1];

                      userService.setPassword(password);
                      userService.setUserId(response[0].id);
                      userService.setUser(response[0]);
                      userService.setUserCode(response[0].username);

//          if (window.Localytics) {
//            Localytics.setCustomerEmail(response[0].username);
//            Localytics.setCustomerFullName(response[0].username);
//            Localytics.setCustomerId(response[0].id);
//            Localytics.upload();
//            console.log('Localytics set user data');
//          }

                      if (response[0]['password_reset']*1 !== 1) {
                          response[0].firstLogin = fromLoginButton;
                          if(!userService.checkPrivacyTerms()){
                              page.show('termsPrivacy',response[0]);
                          } else {
                              page.show('facebookLink',response[0]);
                          }
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
                      if(scope) scope.auth.password = '';
                      if (!start) {

                          if (status == 401) {
                              dialog.create(dialog.INFO,'Login failed','Incorrect username or password.','OK').show();
                              if(scope) scope.auth.password = '';
                          } else {
                              page.showNoConnection(function() {
                                  $network.doLogin(login, start);
                                  page.hideNoConnection();
                              }, 99);
                          }

                      }
                  }
              }, true);
          });
      };

}]);
