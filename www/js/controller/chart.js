tol.controller('chart',['$scope','page',function($scope, page){
   
  var settings = { name: 'chart'
                 , chart: true
                 , chartActive: true
                 , search: true
                 , smallSearch: true
                 , smallBack: true
                 };  
  
  page.onShow(settings,function(params) {
    
    page.hideLoader();
    
  });
    
}]);