tol.service('analytics',['config','userService',function(config, userService){
  
  var $analytics = this;
  var $config = config.analytics;
  var queue = [];
  window.analytics = navigator.analytics;
  
  $analytics.isEnabled = false;
  
  /* Custom Dimentions */
  $analytics.ENTITY = 1;
  $analytics.CATALOG = 2;
  $analytics.ORG_LEVEL_1 = 3;
  $analytics.ORG_LEVEL_2 = 4;
  $analytics.ORG_LEVEL_3 = 5;
  $analytics.USER_TYPE = 6;
  $analytics.POST_TYPE = 7;
  
  /* Custom Metrics*/
  $analytics.POST_MADE = 1;
  $analytics.POINTS_GIVEN = 2;

  
  $analytics.init = function() {
    //window.analytics.startTrackerWithId($config.trackCode, initSuccess, initFail);
    window.analytics.setTrackingId($config.trackCode, initSuccess, initFail);
    console.log('analytics init', $config.trackCode);
  };
  
  function initSuccess(response) {
    console.log('analytics init success >>>', response);
    
    //window.analytics.enableUncaughtExceptionReporting(true, enableUncaughtExceptionReportingSuccess, enableUncaughtExceptionReportingFail);
    
    window.onerror = function(error, path, lineNumber, symbolNumber) {
      var message = 'Error: ' + error + ' in: ' + path + ' on: ' + lineNumber + ' ' + symbolNumber;
      var messageForAlert = 'Error: ' + error + '\nin: ' + path + '\non: ' + lineNumber + ' ' + symbolNumber;
      
      sendException(message);
      alert(messageForAlert);
    };
    
    $analytics.isEnabled = true;
  }
  
  function initFail(error) {
    console.log('analytics init fail >>>', error);
  }
  
//  function enableUncaughtExceptionReportingSuccess(response) {
//    console.log('enableUncaughtExceptionReporting success', response);
//  }
//  
//  function enableUncaughtExceptionReportingFail(error) {
//    console.log('enableUncaughtExceptionReporting fail', error);
//  }
  
  function sendException(error) {
    if (!$analytics.isEnabled) {
      return false;
    }
    
    //window.analytics.trackException(error, false);
    window.analytics.sendException(error, false);
  };
  
  $analytics.trackCustomDimension = function(key, value) {
    if (!$analytics.isEnabled) {
      return false;
    }
    
    console.log('analytics trackCustomDimension', key, value);
//    window.analytics.addCustomDimension(key, value, 
//    
//    function(message) {
//      console.log('addCustomDimension success: ', message);
//    }, 
//    
//    function(e) {
//      console.log('addCustomDimension fail: ', e);
//    });
    
    window.analytics.customDimension(key, value);
    
  };
  
  $analytics.trackCustomMetric = function(key, value) {
    if (!$analytics.isEnabled) {
      return false;
    }
    console.log('Custom metric', key, value);
    window.analytics.customMetric(key, value);
  };
  
  $analytics.trackView = function(pageName) {
    if (!$analytics.isEnabled) {
      return false;
    }
    
    console.log('analytics trackView', pageName);
    //window.analytics.trackView(pageName);
    window.analytics.sendAppView(pageName);
  };
  
  $analytics.trackEvent = function(params, isDelayed) {
    if (!$analytics.isEnabled) {
      return false;
    }
    
    params = params || [];
    params.unshift(userService.getUserId());
    
    if (!isDelayed) {
      //window.analytics.trackEvent.apply({},params);
      window.analytics.sendEvent(params[0].toString(), params[1].toString(), params[2].toString());
      test.apply({},params);
      return true;
    }
    queue.push(params);
    
    //window.analytics.trackEvent(category, action, label, value);
  };
  
  $analytics.execute = function() {
    if (!$analytics.isEnabled) {
      return false;
    }
    
    if (queue.length === 0) return false;
    for (var i = 0, l = queue.length; i < l; i++) {
      //window.analytics.trackEvent.apply({},queue[i]);
      window.analytics.sendEvent(queue[i][0].toString(), queue[i][1].toString(), queue[i][2].toString());
      test.apply({},queue[i]);
    }
    queue = [];
    return true;
  };
  
  function test(a,b,c,d) {
    console.log('Analistic test',a,b,c,d);
  }
  
  $analytics.trackTiming = function(variable, label, time) {
    
    if (!$analytics.isEnabled) {
      return false;
    }
    
    console.log(userService.getUserId().toString());
    
    //window.analytics.trackTiming.apply({},params);
    window.analytics.sendTiming(userService.getUserId().toString(), variable, label, time);
  };
  
  var timeTags = {};
  $analytics.time = function(tag) {
    timeTags[tag] = new Date().getTime();
  };
  
  $analytics.timeEnd = function(tag) {
    if (!timeTags[tag]) return false;
    
    var time = new Date().getTime() - timeTags[tag];
  
    console.info(tag, (time/1000)+'s');

    $analytics.trackTiming(tag, tag, time);
    delete timeTags[tag];
  };
}]);