tol.service('network',['$http', 'page', 'config','$q','$timeout','$rootScope','userService', 
  function($http, page,config,$q,$timeout,$rootScope, userService) {
  var $network = this;
  $network.servisePath = 'http://qas.qaalog.com/ExternalDataServices/Data/';
  //$network.servisePathPHP = 'http://www-dev.qaalog.com/webservice/';
  $network.servisePathPHP = 'http://tolws.azurewebsites.net/';
  if (navigator.userAgent.toLocaleLowerCase().indexOf('windows') > -1) {
    $network.servisePath = 'http://localhost/proxy/qaalog.php/';
    $network.servisePathPHP = 'http://localhost/proxy/tol_php.php/';
  }
  
  var abortBlock = false;
  var cancelerList = [];

  
  var entityKey = config.appKey;
  var userKey = '';

  var activeRequests = {};
  
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
    if (navigator.connection) {
      console.log('CONNECTION TYPE: ', navigator.connection.type);
      if (navigator.connection.type === 'none' && !dialogFlag) {
        dialogFlag = true;
        page.show(config.startPage, {}, false, true);
        $timeout(function () {
          page.navigatorClear();
          if (navigator.notification) {
            navigator.notification.alert(app.translate('network_generic_no_network_message', 'Please check your network settings.'), function () {
              dialogFlag = false;
            }, app.translate('network_generic_no_network_title','Network unavailable'), app.translate('network_generic_error_button_ok','OK'));
          } else {
            alert(app.translate('network_generic_no_network_message','Please check your network settings.'));
          }
        });
        return false;
      }
    }
    return true;
  };


  document.addEventListener("online", function() {
    $network.getConnection();
    console.log('ONLINE');
  });
  document.addEventListener("offline", function() {
    $network.getConnection();
    console.log('OFFLINE');
  });

  var checkAborted = function() {
    //activeRequests.pop();
    if (activeRequests.length === 0)  {
      $network.setAbortBlock(false);
    }
  };
  
  function errorHandler(code,message,path,callback) {
    callback = callback || function(){};
    
    var result = {code: code, message: ''};
    console.error(code,message);
    switch (code) {
      case 401: 
        result.message = 'Unauthorized';
        $network.logout();
        break;
      
      case 0:
       console.log(activeRequests);
       if (!activeRequests[path].canceled)
          //reTry(activeRequests[path].method,path,callback);
       break;
       
      default:
        result.message = 'Unknown error';
        break;
    };
    
    callback(false,result);
  };
  
  function reTry(method,path,callback) {
    console.log('Retry');
    $http({ 'method': method
          , 'url': path
          , timeout: 20000
          })
          
          .success(function(result, status, headers) {
              callback(true, result);
              delete activeRequests[path];
            })
          
          .error(function(data, status, headers, config, statusText) {
            errorHandler(status, data, path, callback);
          });
  };

  $network.get1 = function(methodName, params, callback, reGet, php) {
    
    //if(!$network.getConnection()) {
    //  return false;
    //}
    if (params) {
      var path = $network.servisePath + methodName + '?' + $network.serialize(params);
    } else {
      var path = $network.servisePath + methodName;
    }
    if (php) {
      params['__entityKey'] = entityKey;
      params['__userKey'] = userKey;
      if (params) {
        path = $network.servisePathPHP + methodName + '?' + $network.serialize(params);
      } else {
        var path = $network.servisePathPHP + methodName;
      }
    } 
    
    //console.log('#<<<['+methodName+']',path);
    //var canceler = $q.defer();
    var timeout;
    //cancelerList.push(canceler);
    if (!reGet) {
      activeRequests[path] = {method: 'get', reGetTimeout: 1000};
    }
    $http({ 'method': 'get'
          , 'url': path
//        , 'data':  params
          , timeout: 20000//canceler.promise
          })
            .success(function(result, status, headers) {
              //console.log('#>>>['+methodName+']',result);
              callback(true, result);
              delete activeRequests[path];
              if (typeof timeout === 'function') timeout.cancel();
            })
            .error(function(data, status, headers, config, statusText) {
                console.error('status >>>', status);
              if (status === 401) {
                if (navigator.notification) {
                  navigator.notification.alert('Please check your login and password',function(){},'Login fail','Ok');
                } else {
                  alert('Login fail');
                }
                return false;
              }
              if (status != 500 && status != 401 && status != 404 && status != 403 && status != 501) {
                $timeout(function() {
                  if (typeof timeout === 'function') timeout.cancel();

                  if (activeRequests[path].reGetTimeout > 3000) {
                    activeRequests[path].reGetTimeout = 1000;

                    page.hideExtendedHeader();
                    page.hideMenu();
                    page.hideSearch();
                    if (navigator.notification) {
                      navigator.notification.alert(app.translate('network_generic_timeout_message','Check you internet connection and try again.'),
                        function(){},app.translate('network_generic_timeout_title','Network timeout'),
                        app.translate('network_generic_error_button_ok','OK'));
                    } else {
                      alert(app.translate('network_generic_timeout_message','Check you internet connection and try again.'));
                    }
                    page.showNoResult(app.translate('network_generic_timeout_message','Check you internet connection and try again.'));
                    page.hideLoader();
                    delete activeRequests[path];
                    return false;
                  }
                  console.error('ReGet',activeRequests[path].reGetTimeout);
                  activeRequests[path].reGetTimeout += 1000;
                  console.log(path);
                  if (!$network.getConnection()) {
                    if (typeof timeout === 'function') timeout.cancel();
                    activeRequests[path].reGetTimeout = 1000;
                    return false;
                  }
                  if (!activeRequests[path].canceled) {
                    $network.get(methodName, params, callback, true, php);
                  }

                },activeRequests[path].reGetTimeout);
                callback(false,data);
                return false;
              }
              //alert('Please check your internet connection');
              //page.goBack();
              delete activeRequests[path];
              checkAborted();
              page.hideLoader();
              callback(false,data);
              $network.showErrorAlert();
            });
    timeout = $timeout(function(){
     // canceler.resolve();
    },10);
  };
  
  $network.get = function(methodName, params, callback) {
    callback = callback || function(){};
    
    var path = $network.servisePathPHP + methodName;
    if (params) {
      params['__entityKey'] = entityKey;
      params['__userKey'] = userKey;
      path = $network.servisePathPHP + methodName + '?' + $network.serialize(params);
    }
    
    activeRequests[path] = {method: 'get', reGetTimeout: 1000};
    
    $http({ 'method': 'get'
          , 'url': path
          , timeout: 20000
          })
          
          .success(function(result, status, headers) {
              if (typeof result === 'string') {
                callback(false, result);
                alert('AHTUNG');
                return false;
              }
              callback(true, result);
              delete activeRequests[path];
            })
          
          .error(function(data, status, headers, config, statusText) {
            errorHandler(status, data, path, callback);
          });
  };
  
  $network.post = function(methodName, params, callback, reGet) {
    
    callback = callback || function(){};
    
    params = params || {};
    params['__entityKey'] = entityKey;
    params['__userKey'] = userKey;
    
    var path = $network.servisePathPHP + methodName;

    $http({ 'method': 'post'
          , 'url': path
          , 'data':  params
          , timeout: 20000
          })
            .success(function(result, status, headers) {
              callback(true, result);
            })
            .error(function(data, status, headers, config, statusText) {
              callback(false,data);
            });

  };
  
  $network.put = function(methodName, params, callback, reGet) {
    
    callback = callback || function(){};
    
    params = params || {};
    //params['__entityKey'] = entityKey;
    //params['__userKey'] = userKey;
    
    var path = $network.servisePathPHP + methodName;

    $http({ 'method': 'put'
          , 'url': path + '?__entityKey='+entityKey+'&__userKey='+userKey
          , 'data':  params
          //, timeout: 20000
          })
            .success(function(result, status, headers) {
              callback(true, result);
            })
            .error(function(data, status, headers, config, statusText) {
              callback(false,data);
            });

  };
  
  $network.testPassword = function(methodName, params, callback) {
    callback = callback || function(){};
    params['__entityKey'] = entityKey;
    var path = $network.servisePathPHP + methodName + '?' + $network.serialize(params); ;

    $http({ 'method': 'get'
          , 'url': path
          , timeout: 20000
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
          , timeout: 20000
          })
            .success(function(result, status, headers) {
              callback(true, result);
            })
            .error(function(data, status, headers, config, statusText) {
              callback(false,data);
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
  
  $network.logout = function() {
    localStorage.removeItem(config.AUTH_KEY);
    $network.get('logout/',{},function(){});
    userService.clear();
    page.show('login',{hard: true});
    page.navigatorClear();
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

}]);
