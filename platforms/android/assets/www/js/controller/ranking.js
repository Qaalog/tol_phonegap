tol.controller('ranking',['$scope','config','page','network',function($scope,config,page,network){

  var settings = { name: 'ranking'
                 , search: true
                 , chart: true
                 , tabs: true
                 , rankingHeader: true
                 };         
                 
  page.onShow(settings,function(params) {
    page.hideLoader();
  });
  
  $scope.showFullList = function() {
    page.show('fullList',{});
  };
  
  
}]);