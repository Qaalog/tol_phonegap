var qaalog = angular.module('qaalog',[]);
qaalog.service('config',[function(){
  var $config = this;
  
  /* DEV Server */
  this.appId = 'com.qaalog.dev';
  
  /* PROD Server*/
  //this.appId = 'com.leverage.qaalog';
  
  this.startPage = 'catalog';
  this.defaultTitle = 'Qaalog';

  this.googlePlayUrl = 'https://play.google.com/store/apps/details?id=com.leverage.qaalog';
  this.appStoreUrl = 'https://itunes.apple.com/app/id928036482';
  
}]);


