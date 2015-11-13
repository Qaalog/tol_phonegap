tol.service('facebook',['network','userService',function(network,userService){
  
  var $facebook = this;
  var currentAvatar = false;
  
  $facebook.toggleShareMenu = function() {};
  
  $facebook.api = function(method,path,params,callback) {
    callback = callback || function(){};
    openFB.api({ method: method
               , path:   '/'+path
               , params: params
               , success: function(s){
                 callback(true,s);
               }
               , error: function(e){
                 callback(false,e);
               }
               });
  };
  
  $facebook.isActive = function() {
    var token = localStorage.getItem('fbAccessToken'+userService.getUser().id);
    if (token) {
      return true;
    }
    return false;
  };
  
  $facebook.getCurrentAvatar = function() {
    return currentAvatar;
  };
  
  $facebook.getUserAvatar = function(size,callback) {
    callback = callback || function(){};
    var data = { type: size || 'large'
               , redirect: false
               };
    $facebook.api('GET','me/picture',data,function(result,response){
      callback(result,response);
      
      if (result) {
        currentAvatar = response.data.url;
      } else {
        alert(response.type);
      }
      
    });
  };
  
  $facebook.postToFeed = function(post) {
    
    $facebook.api('POST','me/feed',post);
    
  };
  
  $facebook.getBase64Avatar = function(callback,clean) {
    callback = callback || function(){};
    $facebook.getUserAvatar('large',function(result,response){
        if (result) {
          var url = response.data.url;
          var c = document.createElement('canvas');
          var ctx = c.getContext('2d');
          var img = new Image();
          img.setAttribute('crossOrigin', 'anonymous');
          img.src = url;
          img.onload = function() {
            c.width = img.width;
            c.height = img.height;
            ctx.drawImage(img,0,0,img.width,img.height);
            var base = c.toDataURL();
            var mimeType = /image\/\w+/.exec(base)[0];
            if (clean) {
              base = base.replace(/data:image.*;base64,/,'');
            }
            callback(base,mimeType);
            c = null;
          };
        }
      });
  };
  
  //$facebook.getUserAvatar();
}]);


