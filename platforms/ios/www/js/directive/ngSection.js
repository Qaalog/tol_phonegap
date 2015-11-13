qaalog.directive('ngSection',[function(){
  return {
    restrict: 'A',
    scope: {},
    link: function (scope, element, attrs) {
    },
    
    templateUrl: function(elem,attrs) {
      return attrs.ngSection || 'partial/home';
    },
    controller : "@",
    name: 'ctrlName'
  };
}]);
