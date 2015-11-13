qaalog.service('share',['device','config',function(device,config){
  var $share = this;
  
  var currentParams;
  
  $share.setParams = function(params) {
      currentParams = params;
    };
    
  $share.getParams = function() {
     return currentParams;
  };
  
  $share.exec = function(text,subject,image,link) {
    text = currentParams.text || null;
    subject = currentParams.subject || null;
    image = currentParams.image || null;
    link = currentParams.link || null;
    text += '\nApp iOS: ' + config.appStoreUrl;
    text += '\nApp Android: ' + config.googlePlayUrl;

    try {

       window.plugins.socialsharing.share(text, null, null, null);
        //window.plugins.socialsharing.share(text, null, image, null);

    } catch(e) {
      alert('Sharing temporarily unavailable. \nPlease try again later');
    }

  };
  
}]);

