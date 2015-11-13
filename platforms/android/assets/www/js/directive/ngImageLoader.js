tol.directive('ngImageLoader', ['$timeout',function ($timeout) {
  return function (scope, element, attr) {
    
    var loaderURL = attr['ngImageLoader'];
    var errorImage = attr['ngErrorImage'];
    var experemental = attr['ngSrcCanvas'];
    
    if (!errorImage) {
      errorImage = app.defaultErrorImage;
    }
    
    var elementImgage = element[0].querySelector('img');
    var positionSetted = false;
    if (element[0].style.position !== '') {
      positionSetted = element[0].style.position;
    }
    element[0].style.position = 'relative';
    element[0].style.height = '15em';
    var div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.top = 0;
    div.style.left = 0;
    div.style.right = 0;
    div.style.bottom = 0;
    div.style.background = '#fff url('+loaderURL+') 50% no-repeat';
    element[0].appendChild(div);
    
    var hideLoader = function() {
      element[0].removeChild(div);
      element[0].style.height = '';
      if (positionSetted) {
        element[0].style.position = positionSetted;
      } else {
        element[0].style.position = '';
      }
      elementImgage.removeEventListener('load',onImageLoad);
      elementImgage.removeEventListener('error',onImageError);
    };
    
    var onImageLoad = function(event){
      hideLoader();
      
      findRootElement(element[0],function(root){
        var styles = getComputedStyle(root);
        var height = styles.height.replace('px','')*1;
        var marginBottom = styles.marginBottom.replace('px','')*1;
        root.setAttribute('data-height', height + marginBottom);
        scope.rootHeight = height + marginBottom;
      });

    };
    
    var onImageError = function() {
      hideLoader();
    };
    
//    if (experemental) {
//      elementImgage.remove();
//      var rect = element[0].getBoundingClientRect();
//      var canvas = document.createElement('canvas');
//      var ctx = canvas.getContext('2d');
//      var img = new Image();
//      img.setAttribute('cross-origin', 'anonymous');
//      img.src = experemental;
//      img.onload = function() {
//        canvas.width = rect.width;
//        canvas.height = 700;
//        ctx.drawImage(img,0,0,rect.width,700);
//        hideLoader();
//        element[0].appendChild(canvas);
//      };
//    }
    
    elementImgage.addEventListener('load',onImageLoad);
    elementImgage.addEventListener('error',onImageError);
  };
  
  function findRootElement(element,callback) {
    var parent = element.parentElement;
    if (!parent) return false;
    if (parent.className.indexOf('post-root') >= 0) {
      callback(parent);
      return false;
    }
    findRootElement(parent,callback);
  };

}]);