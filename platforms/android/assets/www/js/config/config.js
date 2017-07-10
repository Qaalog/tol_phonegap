var tol = angular.module('qaalog',[]);
tol.service('config',[function(){
  var $config = this;
  
  
  
  //$config.IS_DEBUG = false;
  
  if (window.AppVersion) {
    $config.version = window.AppVersion.version;
  } else {
    $config.version = app.version;
  }
  
  if ($config.IS_DEBUG !== false || $config.IS_DEBUG !== true) {
    $config.IS_DEBUG = false;
    if (/^\d+\.\d+\.\d+$/.test($config.version)) {
      $config.IS_DEBUG = true;
    }
  }
  //http://tolws-dev.azurewebsites.net/info
  if ($config.IS_DEBUG) {
    /* DEV*/
    $config.appId = 'com.tol.dev';
    $config.servicePath = 'http://tolws-dev.azurewebsites.net/';
  } else {
    /* PROD */
    $config.appId = 'leverage.qaalog.cryst1.cryst';
    $config.servicePath = 'http://tolws.azurewebsites.net/';
  }
  
  $config.startPage = 'login';
  $config.defaultTitle = 'TeamOutLoud';
  $config.SPRINT = 4;
  $config.galleryLength = 1;
  $config.AUTH_KEY = btoa('auth');
  $config.DEFAULT_TIMEOUT = 40000;
  
  /* API Key */
  $config.appKey = '37e1d26dd7a0206da9aab83b6e4b4672'; //Azure
  
  $config.appKey = $config.appId;
  
  /* Dev analytics */
//  $config.analytics = { trackCode: 'UA-71655885-1'
//    
//                      };

  /* Prod analytics */                   
  $config.analytics = { trackCode: 'UA-71877820-3'

                      };
  
  
  $config.googlePlayUrl = 'https://play.google.com/store/apps/details?id=com.leverage.qaalog';
  $config.appStoreUrl = 'https://itunes.apple.com/app/id928036482';
  
  app.version = $config.version;
  
  var aliases = { 'v@r.i': 'vradchenko@itera-research.com'
                , 'y@p.i': 'ypilipenko@itera-research.com'
                , 'r@l.i': 'rleonov@itera-research.com'
                , 'e@p.i': 'epavletsov@itera.ws'
                };
  
  $config.findAlias = function(key) {
    return aliases[key] || null;
  };
  
  $config.pagesInSprints = { 'login':          1
                           , 'facebookLink':   1
                           , 'menu':           1
                           , 'catalog':        1
                           , 'feed':           1
                           , 'post':           1
                           , 'profile':        1
                           , 'changePassword': 1
                           , 'searchPage':     1
                           , 'ranking':        2
                           , 'fullList':       3
                           , 'givePoints':     1
                           , 'chart':          2
                           , 'sql':            1
                           };
  
}]);


