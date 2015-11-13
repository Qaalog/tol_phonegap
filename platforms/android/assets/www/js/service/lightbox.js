tol.service('lightbox',[function(){
    
  var $lightbox = this;
  
  var lightboxWrap = document.querySelector('.lightbox-wrap');
  var lightBoxPointer = 0;
  var imageQueue = [];
  var hrefQueue = [];
  var queueLimit = 1;
  
  $lightbox.visiable = function(){};
  
  
  $lightbox.addImageToLightboxQueue = function(href) {
    var wrap = document.createElement('div');
    wrap.className = 'swipe-wrap to-right';
    var img = document.createElement('img');
    img.src = href;
    img.onload = function(event) {
      $lightbox.calculateImageSize(event.target);
    };
    img.onerror = function() {
      app.onImgError(img);
    };
    wrap.appendChild(img);
    if (imageQueue.length === 0) {
      lightboxWrap.appendChild(wrap);
    } else {
      lightboxWrap.insertBefore(wrap,imageQueue[0]);
    }
    var index = hrefQueue.indexOf(href);
    if (index > -1) {
      $lightbox.removeImages(index, index+1);
    }
    hrefQueue.unshift(href);
    imageQueue.unshift(wrap);
  };
  
  
  $lightbox.removeImages = function(from,to) {
    for (var i = from; i < to; i++) {
      lightboxWrap.removeChild(imageQueue[i]);
    }
    imageQueue.splice(from, to);
    hrefQueue.splice(from, to);
  };
  
  
  $lightbox.showPicture = function(href) {
    $lightbox.addImageToLightboxQueue(href);
    lightBoxPointer = 0;
    if (imageQueue.length > queueLimit) {
      $lightbox.removeImages(queueLimit, imageQueue.length);
    }
    for (var i = 1, l = imageQueue.length; i < l; i++) {
      imageQueue[i].className = 'swipe-wrap to-right';
    }
    imageQueue[0].className = 'swipe-wrap';
    $lightbox.visiable(true);
  };
  
  
  $lightbox.swipe = function(direction) {
    if (direction === 'prev') {
      lightBoxPointer--;
      if (lightBoxPointer < 0) {
        lightBoxPointer = 0;
        return false;
      }
      imageQueue[lightBoxPointer+1].className = 'swipe-wrap to-right';
    }

    if (direction === 'next') {
      lightBoxPointer++;
      if (lightBoxPointer > imageQueue.length-1) {
        lightBoxPointer = imageQueue.length-1;
        return false;
      }
      imageQueue[lightBoxPointer-1].className = 'swipe-wrap to-left';
    }
    imageQueue[lightBoxPointer].className = 'swipe-wrap';
  };
  
  
  window.addEventListener("orientationchange", function(){
    for (var i = 0, l = imageQueue.length; i < l; i++) {
      $lightbox.calculateImageSize(imageQueue[i].querySelector('img'));
    }
  });
  
  
  $lightbox.calculateImageSize = function(target) {
    target.style.height = '';
    screen.orientation = screen.orientation || {};
    var orientation = screen.orientation.type || screen.orientation;
    //alert(window.innerWidth+'X'+window.innerHeight+' '+screen.width+'X'+screen.height);

    var width = window.innerWidth;
    var height = window.innerHeight;

    if (navigator.userAgent.toLowerCase().indexOf('android') > -1) {
//      width = trueWidth;
//      height = trueHeight;
      if (orientation.toLowerCase().indexOf('landscape') > -1) {
        width = height;
        height = width;
      }

    }
    if (navigator.userAgent.toLowerCase().indexOf('windows') > -1) {
      orientation = 'portrait';
      width = 768;
      height = 1280;
    }
    var heightRatio = height / target.height;
    var newWidth = target.width * heightRatio;
    if (newWidth <= width) {
      target.style.height = height + 'px';
    } else {
      var widthRatio = width / target.width;
      newWidth = target.height * widthRatio;
      target.style.height = newWidth + 'px';
    }
  };
  
    
}]);