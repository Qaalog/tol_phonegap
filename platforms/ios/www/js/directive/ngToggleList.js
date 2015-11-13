qaalog.directive('ngToggleList',['$timeout','$rootScope',function($timeout,$rootScope){
  return {
       scope: {
         options: '=ngToggleList'
       },
       link: function (scope, element, attrs) {

        var coords = {};
        var square = 10;
        var titleElement = element[0].getElementsByClassName(scope.options.titleElement || 'category-title')[0];
        var angTitleElement = angular.element(titleElement);
        angTitleElement.on('touchstart', function(event) {
          coords = {x: event.changedTouches[0].screenX, y: event.changedTouches[0].screenY};
        });
        
        element[0].style.maxHeight = scope.options.startHeight;
        element[0].style.transition = 'all '+ (scope.options.delay / 1000) +'s linear';
        element[0].style.overflow = 'hidden';
        var height;
        
        
        
        var recalculateHeight = function() {
          var listWrapElement = element[0].getElementsByClassName(scope.options.itemWrap || 'list-wrap')[0];
              
          var listWrapRect = listWrapElement.getBoundingClientRect();
          var titleElementRect = titleElement.getBoundingClientRect();
          listWrapElement.style.boxSizing = 'border-box';
          height = listWrapRect.height;
          element[0].style.height = height + titleElementRect.height + 'px';
        };
        
        scope.$on('recalculateListHeight',function(){
          $timeout(function(){
            recalculateHeight();
          });
        });
        
        angTitleElement.on('touchend', function(event) {
          var curCoords = {x: event.changedTouches[0].screenX, y: event.changedTouches[0].screenY};
          var x = Math.abs(curCoords.x - coords.x);
          var y = Math.abs(curCoords.y - coords.y);
          var realInnerHeight = window.innerHeight * window.devicePixelRatio;
          if(x < square && y < square) {
            if (!height) {
              recalculateHeight();
            }
            
            if (element[0].style.maxHeight && element[0].style.maxHeight !== realInnerHeight+'px') {
              element[0].style.maxHeight = realInnerHeight+'px';
              $rootScope.$broadcast('onListOpen',element[0]);
              $timeout(function(){
                element[0].style.maxHeight = '';
              },scope.options.delay);
            } else {
              
             element[0].style.maxHeight = realInnerHeight+'px';
             
             $timeout(function(){
              element[0].style.maxHeight = scope.options.startHeight;
              $rootScope.$broadcast('onListClose',element[0]);
             });
            
            }
          }
        });
         
        }
       };
}]);


