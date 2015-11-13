qaalog.controller('barcodeScan',['$scope','page','network','httpAdapter',function($scope,page,network,httpAdapter){
    
    var settings = { name:   'barcodeScan'
                   , title:  'Barcode Scaner'
                   , back:   true
                   , menu:   true
                   };

    page.onShow(settings,function(params) {
      $scope.currentParams = params;
      page.hideLoader();

    });
    
}]);


