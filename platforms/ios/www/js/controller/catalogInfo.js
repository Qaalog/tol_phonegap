qaalog.controller('catalogInfo',['$scope','page','$sce',function($scope,page,$sce){
    
    
    var settings = { name:   'catalogInfo'
                   , title:  app.translate('catalog_selection_catalog_info_title','Catalog Information')
                   , back:   true
                   , menu:   true
                   };

    $scope.getInfo = function(){};
    page.onShow(settings,function(params) {
      $scope.currentParams = params;
      console.log($scope.currentParams);
      $scope.getInfo = function(){
        return $sce.trustAsHtml($scope.currentParams.info);
      };
      page.hideLoader();
    });


    
}]);


