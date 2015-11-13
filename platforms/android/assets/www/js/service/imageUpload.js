tol.service('imageUpload',['userService','dialog',function(userService,dialog){
  
  var $imageUpload = this; 
  
  var onSuccess, onFail;
  
  $imageUpload.addFileInput = function(id, wrapId, onload) {
    onload = onload || function(){};
    var wrap = document.getElementById(wrapId);
    var fileSelector = document.createElement('input');
    fileSelector.type = 'file';
    fileSelector.id = id;
    fileSelector.onchange = function(event) {
      var file = fileSelector.files[0];

      var reader = new FileReader();

      reader.onloadend = function () {
        var img = wrap.querySelector('.img');
        img.src = reader.result;
        var data = { media_data: { content: reader.result.replace(/data:image.*;base64,/,'')
                                 , mime_type: file.type
                                 }
                   , id: userService.getProductId()
                   };
        onload(data);
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
        , correctOrientation: false
        });
    } catch(e) {
      console.log(e);
    };
  };

  var getPictureFromGallery = function() {
    try {
      navigator.camera.getPicture(onSuccess, onFail, 
        { quality: 100
        , destinationType: Camera.DestinationType.DATA_URL
        , sourceType: Camera.PictureSourceType.PHOTOLIBRARY
        , encodingType: Camera.EncodingType.JPEG
        , mediaType: Camera.MediaType.PICTURE
        });
    } catch(e) {
      console.log(e);
    };
  };
  
  dialog.addActionListener(function(action) {
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
  
    
}]);
    


