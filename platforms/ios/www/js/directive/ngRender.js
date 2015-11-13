qaalog.directive('ngFinishRender', ['$timeout', function ($timeout) {
  return function (scope, element, attr) {
    
      if (scope.$last === true) {
        $timeout(function () {
          scope.$emit(attr.ngFinishRender);
        });
      }
    };

}]);