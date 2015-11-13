var tol = angular.module('qaalog',[]);
tol.service('config',[function(){
  var $config = this;
  
  
  $config.IS_DEBUG = false;
  $config.SPRINT = 1;
  
  /* DEV Server */
  $config.appId = 'com.qaalog.dev';
  
  /* PROD Server*/
  //this.appId = 'com.leverage.qaalog';
  
  /* API Key */
  //this.appKey = 'de3e00469fa44ff68c695aea2e96b505';
  
  $config.appKey = '37e1d26dd7a0206da9aab83b6e4b4672'; //Azure
  
  $config.startPage = 'login';
  $config.defaultTitle = 'TeamOutLoud';

  $config.googlePlayUrl = 'https://play.google.com/store/apps/details?id=com.leverage.qaalog';
  $config.appStoreUrl = 'https://itunes.apple.com/app/id928036482';
  
  $config.AUTH_KEY = btoa('auth');
  
  $config.pagesInSprints = { 'login':          1
                           , 'facebookLink':   1
                           , 'menu':           1
                           , 'catalog':        1
                           , 'feed':           2
                           , 'post':           1
                           , 'profile':        1
                           , 'changePassword': 1
                           , 'searchPage':     1
                           , 'ranking':        3
                           , 'fullList':       3
                           , 'givePoints':     1
                           , 'chart':          3
                           , 'sql':            1
                           };
  
}]);


