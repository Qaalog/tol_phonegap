qaalog.controller('groups',['$scope','page','network','httpAdapter','device',function($scope,page,network,httpAdapter,device){
    
    var getProductHeaderChar;
    $scope.isIOS = device.isIOS;
    $scope.groupByTitle = app.translate('groups_group_by_title','Group by');


    var settings = { name:   'groups'
                   , title:  'groups'
                   , back:   true
                   , menu:   true
                   };

    page.onShow(settings,function(params) {
      page.setTitle(params.name);
      $scope.currentParams = params;
      getProductHeaderChar(params,function(headerChar){
        $scope.activeView = {};
        $scope.chars = headerChar;
        
        page.hideLoader();
      });
    });
    
    $scope.openChar = function(char) {
      char = char || {};
      char.productId = $scope.currentParams.productId;
      char.db = $scope.currentParams.db;
      char.name = $scope.currentParams.name;
      page.show('groupDetail',char);
    };
    
    getProductHeaderChar = function(params, callback) {
      callback = callback || function(){};

      var data = { catalogDB: params.db
                 , pid:       params.productId
                 };

      network.get('GetProductHeaderCharacteristics',data,function(result, response){
        if (result) {
          callback(httpAdapter.convert(response));
        } else {

        }
      });
    
    };
   
    
}]);

