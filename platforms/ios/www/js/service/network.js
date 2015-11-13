qaalog.service('network',['$http', 'page', 'config','$q','$timeout', function($http, page,config,$q,$timeout) {
  var $network = this;
  $network.servisePath = 'http://qas.qaalog.com/ExternalDataServices/Data/';
  if (navigator.userAgent.toLocaleLowerCase().indexOf('windows') > -1)
  $network.servisePath = 'http://localhost/proxy/qaalog.php/';
  var userId = false;
  var catalogDB = false;
  var abortBlock = false;
  var cancelerList = [];

  var activeRequests = {};

  $network.setAbortBlock = function(value) {
    abortBlock = value;
  };

  $network.getActiveRequestsCount = function() {
    return activeRequests.length;
  };

  $network.setUserId = function(id) {
    userId = id;
  };
  
  $network.getUserId = function() {
    return userId;
  };
  
  $network.setCatalogDB = function(db) {
    catalogDB = db;
  };
  
  $network.getCatalogDB = function() {
    return catalogDB;
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

  $network.get = function(methodName, params, callback,reGet) {
    
    //if(!$network.getConnection()) {
    //  return false;
    //}
    
    var path = $network.servisePath+methodName+'?'+$network.serialize(params);
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

              if (status != 500) {
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
                    $network.get(methodName, params, callback,true);
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
          })
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
    page.goBack();
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
