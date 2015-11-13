var firstFlag = true;
var scrollBlock = false;
qaalog.directive('ngFastTouch', function() {
  return function(scope, element, attr) {
    var fn = function() {
      if(scope != undefined) {
        scope.$apply(function() { 
          scope.$eval(attr.ngFastTouch); 
        });
      }
    };
    
    var touchAllow = false;
    var timeout;
    var isTouchSupported = 'ontouchstart' in window;
    var coords = {};
    var square = 10;
    
    var onScroll = function() {
      scrollBlock = true;
    };
    
    if (firstFlag) {
      app.wrapper.addEventListener('scroll', onScroll);
      firstFlag = false;
    };

    if (isTouchSupported) {
      
      element.on('touchstart', function(event) {
        scrollBlock = false;
        var body = document.getElementsByTagName('body')[0];
        coords = {x: event.changedTouches[0].screenX, y: event.changedTouches[0].screenY};
        touchAllow = true;
        timeout = window.setTimeout(function(){
          touchAllow = false;
        },1000);
      });
      
      element.on('touchend', function(event) {
        scope.$event = event;
        var curCoords = {x: event.changedTouches[0].screenX, y: event.changedTouches[0].screenY};
        var x = Math.abs(curCoords.x - coords.x);
        var y = Math.abs(curCoords.y - coords.y);
        if(x < square && y < square) {
          if (touchAllow) {
            event.stopPropagation();
            touchAllow = false;
            clearTimeout(timeout);
            window.setTimeout(function() {
              if (!scrollBlock) {
                fn();
              }
            },50);
          }
        }
      });
    } 
  };
});

qaalog.directive('ngSwipe', function() {
  return function(scope, element, attr) {
    
    var fnLeft = function() {
      if(scope !== undefined) {
        scope.$apply(function() { 
          scope.$eval(attr.ngOnLeft); 
        });
      }
    };
    
    var fnRight = function() {
      if(scope !== undefined) {
        scope.$apply(function() { 
          scope.$eval(attr.ngOnRight); 
        });
      }
    };
    
    var fnMove = function() {
      if(scope !== undefined) {
        scope.$apply(function() { 
          scope.$eval(attr.ngOnMove); 
        });
      }
    };
    
    var fnUp = function() {
      if(scope !== undefined) {
        scope.$apply(function() { 
          scope.$eval(attr.ngOnUp); 
        });
      }
    };
    
    var fnDown = function() {
      if(scope !== undefined) {
        scope.$apply(function() { 
          scope.$eval(attr.ngOnDown); 
        });
      }
    };

    
    var coords = {};
    var curCoords = {};
    
    element.on('touchstart', function(event) {
      coords = {x: event.changedTouches[0].screenX, y: event.changedTouches[0].screenY};
    });
    
    element.on('touchmove', function(event) {
      event.preventDefault();
      curCoords = {x: event.changedTouches[0].screenX, y: event.changedTouches[0].screenY};
      scope.$position = {x: curCoords.x - coords.x, y: curCoords.y - coords.y};
      fnMove();
    });
    
    element.on('touchend', function(event) {
      curCoords = {x: event.changedTouches[0].screenX, y: event.changedTouches[0].screenY};
      var diffX = curCoords.x - coords.x;
      var diffY = curCoords.y - coords.y;

      if (diffX > 100) {
        scope.$direction = 0;
        fnLeft();
      }
      
      if (diffX < -100) {
        scope.$direction = 1;
        fnRight();
      }
      
      if (diffY > 100) {
        console.log(diffY, curCoords.y, coords.y);
        scope.$direction = 0;
        fnDown();
      }
      
      if (diffY < -100) {
        console.log(diffY, curCoords.y, coords.y);
        scope.$direction = 1;
        fnUp();
      }
      
    });
    
  };
});