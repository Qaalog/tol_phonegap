qaalog.directive('ngCntHeight', ['$timeout',function ($timeout) {
  return function (scope, element, attr) {
    $timeout(function(){
    var attribute = element[0].getBoundingClientRect().height + '';
    element[0].setAttribute('data-height',attribute);
    });
  };

}]);