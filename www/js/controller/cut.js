tol.controller('cut',['$scope', 'page', function($scope, page){
  
  var settings = { name: 'cut'
                 , title: 'Cut Page'
                 , back: true
                 };
  
  
  page.onShow(settings,function(params) {
    page.hideLoader();
  });
  
}]);