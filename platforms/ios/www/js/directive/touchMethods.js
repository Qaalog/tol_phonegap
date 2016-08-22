tol.directive('ngFastTouch', function() {
  return function(scope, element, attr) {
    var fn = function() {
      if(scope != undefined) {
       // window[app.requestFrame](function() {
          scope.$apply(function() { 
            scope.$eval(attr.ngFastTouch); 
          });
        //});
      }
    };
    
    var touchAllow = false;
    var timeout;
    var isTouchSupported = 'ontouchstart' in window;
    var coords = {};
    var square = 10;

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
    } else {
      
      element.on('mousedown', function(event) {
        scrollBlock = false;
        var body = document.getElementsByTagName('body')[0];
        coords = {x: event.x, y: event.y};
        touchAllow = true;
        timeout = window.setTimeout(function(){
          touchAllow = false;
        },1000);
      });
      
      element.on('mouseup', function(event) {
        scope.$event = event;
        var curCoords = {x: event.x, y: event.y};
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

tol.directive('ngSwipe', function() {
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
    var preventDefault = scope.$eval(attr.ngSwipe);
    
    element.on('touchstart', function(event) {
      coords = {x: event.changedTouches[0].screenX, y: event.changedTouches[0].screenY};
    });
    
    element.on('touchmove', function(event) {
      if (preventDefault) event.preventDefault();
      curCoords = {x: event.changedTouches[0].screenX, y: event.changedTouches[0].screenY};
      scope.$position = {x: curCoords.x - coords.x, y: curCoords.y - coords.y};
      scope.$event = event;
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
        scope.$direction = 0;
        fnDown();
      }
      
      if (diffY < -100) {
        scope.$direction = 1;
        fnUp();
      }
      
    });
    
  };
});

tol.directive('ngHoldTouch', function() {
  return function(scope, element, attr) {
    var fn = function() {
      scope.$apply(function() {
        scope.$eval(attr.ngHoldTouch);
      });
    };

    element.on('touchstart', function(event) {
      coords = {x: event.changedTouches[0].screenX, y: event.changedTouches[0].screenY};
      timeout = window.setTimeout(function(){
          fn();
      },1000);
    });
    element.on('touchmove', function(event) {
        clearTimeout(timeout);
    });
    element.on('touchend', function(event) {
      clearTimeout(timeout);
    });
  };
});