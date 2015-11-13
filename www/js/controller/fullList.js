tol.controller('fullList',['$scope','page',function($scope, page){
   
  var settings = { name: 'fullList'
                 , search: true
                 , chart: true
                 , tabs: true
                 , rankingHeader: true
                 };  
  
  page.onShow(settings,function(params) {
    
    page.hideLoader();
    
  });
    
}]);