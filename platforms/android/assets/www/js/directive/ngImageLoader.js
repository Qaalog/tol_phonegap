//tol.directive('ngImageLoader', ['$timeout',function ($timeout) {
//  return function (scope, element, attr) {
//    
//    var loaderURL = attr['ngImageLoader'];
//    var errorImage = attr['ngErrorImage'];
//    var experemental = attr['ngSrcCanvas'];
//    
//    if (!errorImage) {
//      errorImage = app.defaultErrorImage;
//    }
//    
//    var elementImgage = element[0].querySelector('img');
//    elementImgage.isLoaded = false;
//    scope.imageElement = elementImgage;
//    //elementImgage.style.opacity = 0;
//    //elementImgage.style.transition = 'opacity 2s';
//    var positionSetted = false;
//    if (element[0].style.position !== '') {
//      positionSetted = element[0].style.position;
//    }
//    element[0].style.position = 'relative';
//    element[0].style.height = '15em';
//    var div = document.createElement('div');
//    div.style.position = 'absolute';
//    div.style.top = 0;
//    div.style.left = 0;
//    div.style.right = 0;
//    div.style.bottom = 0;
//    div.style.background = '#fff url('+loaderURL+') 50% no-repeat';
//    div.style.backgroundSize = '4em';
//    element[0].appendChild(div);
//    
//    var hideLoader = function() {
//      element[0].removeChild(div);
//      element[0].style.height = '';
//      if (positionSetted) {
//        element[0].style.position = positionSetted;
//      } else {
//        element[0].style.position = '';
//      }
//      elementImgage.removeEventListener('load',onImageLoad);
//      elementImgage.removeEventListener('error',onImageError);
//    };
//    
//    var onImageLoad = function(event){
//      hideLoader();
//     // elementImgage.style.opacity = 1;
//      findRootElement(element[0],function(root){
//        var styles = getComputedStyle(root);
//        var height = styles.height.replace('px','')*1;
//        var marginBottom = styles.marginBottom.replace('px','')*1;
//        root.setAttribute('data-height', height + marginBottom);
//        scope.rootHeight = height + marginBottom;
//      });
//      
//      element[0].style.height = elementImgage.height + 'px';
//      
//      elementImgage.isLoaded = true;
//      try{scope.$digest();}catch(e){};
//      
//      /* killing watchers for optimization*/
////      scope.$$watchers = [];
////      scope.$$watchersCount = 0;
//    };
//    
//    var onImageError = function() {
//      hideLoader();
//    };
//    
//    elementImgage.addEventListener('load',onImageLoad);
//    elementImgage.addEventListener('error',onImageError);
//  };
//  
//
//}]);

var ind = 0;
function ImageLoader(element) {
    if (element.hasAttribute('loaded')) return false;
    var elementImgage = element.querySelector('img');
    var loaderURL = element.getAttribute('data-image-loader');
    var errorImage = element.getAttribute('data-image-error');
    
    if (!errorImage) {
      errorImage = app.defaultErrorImage;
    }
    
    elementImgage.isLoaded = false;
    //elementImgage.style.opacity = 0;
    //elementImgage.style.transition = 'opacity 2s';
    var positionSetted = false;
    if (element.style.position !== '') {
      positionSetted = element.style.position;
    }
    element.style.position = 'relative';
    element.style.height = '15em';
    var div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.top = 0;
    div.style.left = 0;
    div.style.right = 0;
    div.style.bottom = 0;
    div.style.background = '#fff url('+loaderURL+') 50% no-repeat';
    div.style.backgroundSize = '4em';
    element.appendChild(div);
    
    var hideLoader = function() {
      element.removeChild(div);
      element.style.height = '';
      if (positionSetted) {
        element.style.position = positionSetted;
      } else {
        element.style.position = '';
      }
      elementImgage.removeEventListener('load',onImageLoad);
      elementImgage.removeEventListener('error',onImageError);
    };
    
    var onImageLoad = function(event){
      hideLoader();
     // elementImgage.style.opacity = 1;
      var imgRect = event.target.getBoundingClientRect();
      findRootElement(element,function(root){
        element.setAttribute('loaded','');
        var styles = getComputedStyle(root);
        var height = styles.height.replace('px','')*1;
        var marginBottom = styles.marginBottom.replace('px','')*1;
        root.setAttribute('data-height', height + marginBottom);
        
        //if (imgRect.top + (imgRect.height - app.emToPx(5)) + app.wrapper.scrollTop < app.wrapper.scrollTop) {
        if (imgRect.top - app.emToPx(5) + app.wrapper.scrollTop < app.wrapper.scrollTop) {
          //console.log (app.wrapper.scrollTop, (imgRect.height - app.emToPx(15)));
          app.wrapper.scrollTop = app.wrapper.scrollTop + (imgRect.height - app.emToPx(15));
          
        }
//          setTimeout(function(){
//            testImage(elementImgage);
//          });
      });
      
     // element.style.height = elementImgage.height + 'px';
      
      elementImgage.isLoaded = true;
    };
    
    var onImageError = function() {
      if (/img\/error.png/.test(elementImgage.src)) {
        elementImgage.src = 'img/error.png';
        return false;
      }
      element.style.position = 'relative';
      element.style.height = '15em';
      var div = document.createElement('div');
      div.style.position = 'absolute';
      div.style.top = 0;
      div.style.left = 0;
      div.style.right = 0;
      div.style.bottom = 0;
      div.style.background = '#fff';
      
      div.innerHTML = '<div class="image-refresh">\
                         <div class="refresh-connect" style="margin-top: 0!important">\
                           <span class="t-icon_refresh"></span>Try again\
                         </div>\
                       </div>';
      
      div.addEventListener('touchstart',function(event) {
        event.stopPropagation();
        
        element.removeChild(div);
        div = null;
        
        var src = elementImgage.src;
        elementImgage.src = '';
        elementImgage.src = src;
      });
      element.appendChild(div);
    };
    
    elementImgage.addEventListener('load',onImageLoad);
    elementImgage.addEventListener('error',onImageError);
    
    
    
  };
  
  function findRootElement(element,callback) {
    var parent = element.parentElement;
    if (!parent) return false;
    if (parent.className.indexOf('fast-root') >= 0) {
      callback(parent);
      return false;
    }
    findRootElement(parent,callback);
  };
  
  function testImage(node) {
      node.style.display = '';
      var nodeRect = node.getBoundingClientRect();
     // alert('node');
      //console.log(nodeRect.top, nodeRect.height, innerHeight);
      if ( (nodeRect.top + nodeRect.height >= 0 && nodeRect.top <= innerHeight) ) {
        return true;
      }
      
      node.style.display = 'none';
      return false;
      
    }