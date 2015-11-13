qaalog.directive('ngSwipeHeader',['page','device','$timeout','search',function(page,device,$timeout,search){
  return {
       scope: {
       },
       link: function (scope, element, attrs) {
         scope.wrapper = app.wrapper;
         var header = document.getElementsByTagName('header')[0];
         var title = document.getElementsByClassName('title')[0];
         var body = angular.element(document.getElementsByTagName('body')[0]);
         var startPos;
         var top = 0;
         var height;
         var direction = 'bottom';
         var pauseFlag = true;
         var touchFlag = false;
         var header;
         var timerId;
         var firstStep = Math.floor(480 / window.devicePixelRatio);
         var secondStep = Math.floor(2200 / window.devicePixelRatio);
         var hidePosition = (device.isIOS()) ? 17 : 0;
         var MOVE_IN_PIXELS = 15;
         var ANIMATION_STYLE = 2;
          
         var oldScrollTop = 0;
         
         page.setAnimationStyle = function(style) {
          // ANIMATION_STYLE = style;
         };
         
         var stepDown = function() {
           top -= MOVE_IN_PIXELS;
           header.style.top = top + 'px';
           if (top > hidePosition - height) {
             requestAnimationFrame(stepDown);
             return false;
           }
           top = hidePosition - height;
           header.style.top = (hidePosition - height) + 'px';
         };
         
         var stepUp = function() {
           top += MOVE_IN_PIXELS;
           header.style.top = top + 'px';
           if (top < hidePosition) {
             requestAnimationFrame(stepUp);
             return false;
           }
           top = hidePosition;
           header.style.top = hidePosition + 'px';
         };

         
         var onScrollStop = function() {
           if (direction === 'bottom' && top > hidePosition - height) {
             if (ANIMATION_STYLE === 0) {
                var intervalId = window.setInterval(function () {
                 top -= MOVE_IN_PIXELS;
                 header.style.top = top + 'px';
                 if (top <= hidePosition - height) {
                   window.clearInterval(intervalId);
                   header.style.top = (hidePosition - height) + 'px';
                 }
                },10);
             }
             if (ANIMATION_STYLE === 2 || ANIMATION_STYLE === 1) {
               header.style.top = (hidePosition - height) + 'px';
             }
             
             if (ANIMATION_STYLE === 4) {
               requestAnimationFrame(stepDown);
             }
            }
             
            if (direction === 'top' && top < hidePosition) {
              if (ANIMATION_STYLE === 0) {
                var intervalId = window.setInterval(function () {
                  top += MOVE_IN_PIXELS;
                  header.style.top = top + 'px';
                  if (top >= hidePosition) {
                    window.clearInterval(intervalId);
                    header.style.top = hidePosition + 'px';
                 }
                },10);
              }
              if (ANIMATION_STYLE === 2 || ANIMATION_STYLE === 1) {
                header.style.top = hidePosition + 'px';
              }
              
              if (ANIMATION_STYLE === 4) {
                requestAnimationFrame(stepUp);
              }
            }
         };
         
         page.tryExtendedHeader = function(){
           $timeout(function(){
            if (app.wrapper.scrollTop < firstStep) {
             page.showExtendedHeader(true);
           }
           });
         };
          
         var toggleHeader = function() {
           search.stopSearching();
           height = header.getBoundingClientRect().height;
           if (app.wrapper.scrollTop > firstStep) {
             page.hideExtendedHeader();
           }

           if (app.wrapper.scrollTop < firstStep) {
             page.showExtendedHeader(true);
           }

           if (app.wrapper.scrollTop > secondStep && app.wrapper.scrollTop - oldScrollTop > 0) {
             direction = 'bottom';

             if (ANIMATION_STYLE === 0) {
               top -= MOVE_IN_PIXELS;
               if (top <= hidePosition - height || oldScrollTop - app.wrapper.scrollTop < -500) {
                 top = hidePosition - height;
               }
             }
             
             if (ANIMATION_STYLE === 4) {
               requestAnimationFrame(stepDown);
             }

             if (ANIMATION_STYLE === 2 || ANIMATION_STYLE === 1) {
               top = hidePosition - height;
             }
             header.style.top = top + 'px';
           } else {
             if (app.wrapper.scrollTop - oldScrollTop > -700) {
               direction = 'top';

               if (ANIMATION_STYLE === 0) {
                 top += MOVE_IN_PIXELS;
                 if (top >= hidePosition || oldScrollTop - app.wrapper.scrollTop > 500) {
                   top = hidePosition;
                 }
               }
               
               if (ANIMATION_STYLE === 4) {
                 requestAnimationFrame(stepUp);
               }
               
               if (ANIMATION_STYLE === 2 || ANIMATION_STYLE === 1) {
                 top = hidePosition;
               }
               
               header.style.top = top + 'px';
             }
           }

           oldScrollTop = app.wrapper.scrollTop;
        };

         page.resetHeaderTop = function(){
           header.style.top = hidePosition + 'px';
         };

         page.pauseSwipeHeader = function(){
           pauseFlag = true;
           header.style.top = hidePosition + 'px';
         };
         page.playSwipeHeader = function(){
           pauseFlag = false;
         };

        page.stopSwipeHeader = function() {
          page.hideExtendedHeader();
          pauseFlag = true;
          header.style.top = hidePosition + 'px';
          if (typeof scope.unwatch === 'function') scope.unwatch();
          if (ANIMATION_STYLE !== 1) {
            title.style.transition = '';
          }
          if (ANIMATION_STYLE === 2) {
            header.style.transition = '';
          }
        };

        page.startSwipeHeader = function() {
          if (typeof scope.unwatch === 'function') scope.unwatch();
          header = document.getElementsByTagName('header')[0];
          top = 0;
          header.style.top = hidePosition + 'px';
          $timeout(function(){
            if (ANIMATION_STYLE !== 1) {
              title.style.transition = 'all .3s ease-out';
            }
            if (ANIMATION_STYLE === 2) {
              header.style.transition = 'top .2s ease-out';
            }
          },300);
          
          var direction = 'bottom';
          scope.unwatch = scope.$watch('wrapper.scrollTop', function () {
            if (timerId) window.clearTimeout(timerId);
            if (!pauseFlag) {
              toggleHeader();
              timerId = window.setTimeout(function(){
                if (!touchFlag) {
                  onScrollStop();
                }
              },100);
            }
          });
          $timeout(function(){
            pauseFlag = false;
          });
        };

        body.on('touchstart',function(event){
          if (!pauseFlag) {
            touchFlag = true;
            startPos = app.wrapper.scrollTop;
          }
        });
         
        body.on('touchmove',function(event){
          
        });
         
        body.on('touchend',function(event){
          if (!pauseFlag) {
            touchFlag = false;
            onScrollStop();
          }
        });
         
       }
       
      
       };
}]);



