qaalog.service('device',['$rootScope',function($rootScope){
  var $device = this;
  
  var device = window.device || {};

  $device.setIsLoaded = function(){};
  
  $device.getPlatform = function() {
    return device.platform || 'PC';
  };
  
  $device.getUUID = function() {
    return device.uuid || false;
  };
  
  $device.getPlatformVersion = function() {
    return device.version || false;
  };
  
  $device.getModel = function() {
    return device.model || false;
  };
  
  $device.emToPx = function(em) {
    var fontSize = document.getElementsByTagName('body')[0].style.fontSize.replace('em','') * 1;
    var pxInEm = 16 * fontSize;
    pxInEm = (pxInEm >= 6) ? pxInEm : 6;
    console.log(em,pxInEm, em * pxInEm);
    return  em * pxInEm;
  };
  
  
  var currentPlatform = 'Windows';
  var getPlatform = function () {
    var platfotms = { 'Android': 'android'
                    , 'iphone': 'iphone' 
                    , 'ipad': 'ipad' 
                    , 'BlackBerry': 'BB10'
                    , 'WindowsPhone' : 'Windows Phone'
                    };
    for (var platform in platfotms) {
      var platformIndex = platfotms[platform].toLowerCase();
      if (navigator.userAgent.toLowerCase().indexOf(platformIndex) > -1) {
        currentPlatform = platform;
        break;
      }
    }  
    console.log('PALTFORM >>>>',currentPlatform);
  };

  getPlatform();
  
  $device.isBlackBerry = function() {
    return (currentPlatform === 'BlackBerry') ? true : false;
  };
  $device.isIOS = function() {
    //return true;
    return (currentPlatform === 'iphone' || currentPlatform === 'ipad') ? true : false;
  };
  $device.isAndroid = function() {
    return (currentPlatform === 'Android') ? true : false;
  };
  $device.isWindows = function() {
    return (currentPlatform === 'Windows') ? true : false;
  };
  $device.isWindowsPhone = function() {
    return (currentPlatform === 'WindowsPhone') ? true : false;
  };
  
  window.addEventListener("orientationchange", function(){
    $rootScope.$broadcast('orientationchange');
  });
  
}]);


