tol.service('imageUpload',['userService','dialog', 'network',function(userService,dialog,network){
  
  var $imageUpload = this; 
  
  var onSuccess, onFail, allowEdit = false, parseTimerId;
  
  $imageUpload.addFileInput = function(id, wrapId, onload) {
    onload = onload || function(){};
    var wrap = document.getElementById(wrapId);
    var fileSelector = document.createElement('input');
    fileSelector.type = 'file';
    fileSelector.id = id;
    fileSelector.onchange = function(event) {
      var file = fileSelector.files[0];
      if (!file) return false;
      
      var reader = new FileReader();

      reader.onloadend = function () {
        var img = wrap.querySelector('.img');
        //if (img) img.src = reader.result;
        var data = { media_data: { content: reader.result.replace(/data:image.*;base64,/,'')
                                 , mime_type: file.type
                                 }
                   , id: userService.getProductId()
                   };
        onload(data,reader.result);
      };

      reader.readAsDataURL(file);
    };

    wrap.appendChild(fileSelector);

  };
  
  $imageUpload.setOnSucces = function(func) {
    func = func || function(){};
    onSuccess = func;
  };
  
  $imageUpload.setOnFail = function(func) {
    func = func || function(){};
    onFail = func;
  };
  
  var getPhoto = function() {
     try {
      navigator.camera.getPicture(onSuccess, onFail, 
        { quality: 50
        , destinationType: Camera.DestinationType.DATA_URL
        , sourceType: Camera.PictureSourceType.CAMERA
        , mediaType: Camera.MediaType.CAMERA
        , encodingType: Camera.EncodingType.JPEG
        , correctOrientation: true
        , allowEdit: true
        , targetWidth: 0.3
        , targetHeight: 0.3
        });
    } catch(e) {
      console.log(e);
    };
  };

  var getPictureFromGallery = function() {
    try {
      var data = { quality: 50
                 , destinationType: Camera.DestinationType.DATA_URL
                 , sourceType: Camera.PictureSourceType.PHOTOLIBRARY
                 , encodingType: Camera.EncodingType.JPEG
                 , mediaType: Camera.MediaType.PICTURE
                 , correctOrientation: true
                 , targetWidth: 0.3
                 , targetHeight: 0.3
                 };
      if (allowEdit) {
        data.allowEdit = true;
      }
      navigator.camera.getPicture(onSuccess, onFail, data);
    } catch(e) {
      console.log(e);
    };
  };
  
  dialog.addActionListener('all',function(action) {
    switch (action) {
      case 'take_photo':
        dialog.togglePhotoMenu(false);
        getPhoto();
        break;

      case 'select_from_gallery':
        dialog.togglePhotoMenu(false);
        getPictureFromGallery();
        break;
    }
  });
  
  var MIN_SIZE = 700;
  
  function cut(img) {
    
    if (img.width > MIN_SIZE || img.height > MIN_SIZE) {
      
      var attrs = {width: 0, height: 0};
      var mainSize = (img.width >= img.height) ? img.width : img.height;
      
      var diff = MIN_SIZE / mainSize;
      
      if (img.width >= img.height) {
        attrs.width = MIN_SIZE;
        attrs.height = img.height * diff;
      } else {
        attrs.width = img.width * diff;
        attrs.height = MIN_SIZE;
      }
      
      return attrs;
    }
    
    return img;
  }
  
  function callculate(width, height, selector) {
    var wrap = document.querySelector(selector);
    var rect = wrap.getBoundingClientRect();
    
    var diff = rect.width / width;
    
    return {width: rect.width, height: height * diff};
    
  }
  
  $imageUpload.rotate = function(canvas, img, selector, deg, trueSize) {
    var ctx = canvas.getContext('2d');
    var attrs = {};
    if (trueSize) {
      //attrs = cut(callculate(img.width, img.height, selector));
      attrs = {width: img.width, height: img.height};
    } else {
      attrs = callculate(img.width, img.height, selector);
    }


    if (90 === Math.abs(deg)) {
      canvas.width = attrs.height;
      canvas.height = attrs.width;
    } else {
      canvas.width = attrs.width;
      canvas.height = attrs.height;
    }
    
    

    switch (deg) {
      case 90:
        ctx.translate(canvas.width,0);
        ctx.rotate(90*Math.PI/180);
        ctx.drawImage(img, 0, 0, canvas.height, canvas.width);
        break;
      case 180:
        ctx.translate(canvas.width,canvas.height);
        ctx.rotate(180*Math.PI/180);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        break;
      case -90:
        ctx.translate(0,canvas.height);
        ctx.rotate(-90*Math.PI/180);
        ctx.drawImage(img, 0, 0, canvas.height, canvas.width);
        break;
      default:
        ctx.translate(0,0);
        ctx.rotate(0*Math.PI/180);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        break;
    }
  };
  
  $imageUpload.setAllowEdit = function(value) {
    allowEdit = value;
  };
  
  $imageUpload.parseMessage = function(message, callback, onTake) {
    callback = callback || function(){};
    onTake = onTake || function(){};
    
    if (parseTimerId) clearTimeout(parseTimerId);
    
    if (/http.?:\/\/.+\..+/i.test(message)) {
      onTake();
      parseTimerId = setTimeout(function() {
        var url = /(http.?:\/\/.+\.[^\s]+)/i.exec(message)[1];
        //Check youtube url
        var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\?v=)([^#\&\?]*).*/;
        var match = url.match(regExp);
        var url_youtube = false;
        if(match && match[2] && match[2].length == 11){//valid youtube url
          url_youtube = 'https://youtu.be/'+match[2]+'?app=desktop';
        }

        network.getOutside(url_youtube?url_youtube:url, {}, function(result, response) {
          
          if (result) {
            var ogImage = /<meta[^>]+property="og:image[^>]*"/i.exec(response);
            var ogDescriptionSrc = /<meta[^>]+"description[^>]*"/i.exec(response);
            var host = /(http.?:\/\/)/i.exec(url)[1];
            var link = url.replace(/http.?:\/\//i,'').replace(/\/.*/g,'');

            if (ogDescriptionSrc  && !url_youtube) {
              
              var ogDescription = /description".+"([^"]+)/i.exec(ogDescriptionSrc);
              
              if (!ogDescription) {
                ogDescription = /"([^"]+)".+description/i.exec(ogDescriptionSrc);
              }

              if (!ogDescription) {
                ogDescription = /"(.+)"/i.exec(ogDescriptionSrc)
              }


              if (ogDescription) {
                ogDescription = htmlDecode(ogDescription[1]);
              } 
              
            } else {
              ogDescription = /<title>(.+)<\/title>/i.exec(response);
              console.log('false', ogDescription);
              if (ogDescription) {
                ogDescription = htmlDecode(ogDescription[1]);
              }
            }

            var imgSrc = false;
            
            if (!ogImage || ! /(http.?:\/\/[^"]+)/.test(ogImage[0])) {
              var imgs = response.match(/<img[^>]+src=["'][^>]*["']/ig);
              if (!imgs){
                  imgs = response.match(/<img[^>]+src=["'\n\r][^>]+["']/ig);
              }
              if (!imgs) {
                callback(false);
                return false;
              }

              for (var i = 0, ii = imgs.length; i < ii; i++) {
                if (/(http.?:\/\/[^"]+)/i.test(imgs[i])) {
                  ogImage = [imgs[i]];
                } else {
                  var src = /src=["']([^"']+)["']/i.exec(imgs[i]);
                  if (src) {
                    imgSrc = host + link + '/' + src[1];
                  }
                }
                if(!imgSrc){
                    if(/src=[\r\n]\s*["']([^"]+)["']/i.test(imgs[i])){
                        var src = /src=[\r\n]\s*["']([^"]+)["']/i.exec(imgs[i])
                        if(src){
                            imgSrc = host + src[1].replace('//','');
                        }
                    }
                }
                if (/\.jpg|\.png/i.test(imgs[i])) {
                  break;
                }
              }
              
            }
            
            if (ogImage && /(http.?:\/\/[^"]+)/.test(ogImage[0])) {
              imgSrc = /(http.?:\/\/[^"]+)/.exec(ogImage[0]);
            }
            
            if (!imgSrc) {
              callback(false);
              return false;
            } else if (typeof imgSrc !== 'string'){
              imgSrc = imgSrc[1];
            }
            
            callback({ title: ogDescription
                     , link: link
                     , urlImage: imgSrc
                     , href: url
                     });
          } else {
            callback(false);
          }
        });
      },2000);
    } else {
      callback(false);
    }
  };
  
  function htmlDecode(s) {
    var el = document.createElement("div");
    el.innerHTML = s;
    s = el.innerText;
    return s;
  }
  
    
}]);
    


