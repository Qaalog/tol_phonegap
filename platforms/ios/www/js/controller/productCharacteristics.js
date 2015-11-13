qaalog.controller('productCharacteristics',['$scope','page','network','httpAdapter',function($scope,page,network,httpAdapter){
   
 var getProductHeaderChar;
 var getProductCharValue;
 var getProductsByValue;
 $scope.charValueList = [];
 $scope.tagList = [{list:'Products',canDelete:true}];
 $scope.currentChar = false;
  
   
  var settings = { name: 'productCharacteristics'
                 , title: 'productCharacteristics'
                 , back:  true
                 };

  page.onShow(settings,function(params) {
    $scope.currentParams = params;
    getProductHeaderChar(params,function(headerChar){
      $scope.activeView = {};
      $scope.chars = headerChar;
      $scope.changeView('char');
    });
  });
  
  $scope.applyTagList = function(char) {
    $scope.tagList[0] = $scope.tagList[0] || {};
    if ($scope.tagList[0].canDelete) {
      $scope.tagList.shift();
    }
    for (var i in $scope.tagList) {
      var tag = $scope.tagList[i];
      if (tag.list === char.list) {
        return false;
      }
    }
    $scope.tagList.push(char);
    $scope.changeView(char.list,char);
    $scope.currentChar = char;
  };
  
  $scope.openCharValueList = function(item) {
    item = item || {};
    item.charValueList = item.charValueList || [];
    if (!item.charValueList[0]) {
      item.productId = $scope.currentParams.productId;
      item.db = $scope.currentParams.db;
      getProductsByValue(item,function(list){
        item.charValueList = list;
      });
    } else {
      item.charValueList = [];
    }
  };
  
  $scope.showProductDetail = function(charValue) {
    charValue = charValue || {};
    charValue.db = $scope.currentParams.db;
    charValue.id = charValue.productId;
    delete charValue.productId;
    page.show('productDetail',charValue);
  };
  
  $scope.changeView = function(view,params) {
      if (Object.keys($scope.activeView)[0] !== view) {
        $scope.activeView = {};
        $scope.activeView[view] = true;
      }
      
      if (view !== 'char' && view !== 'Products') {
        params = params || {};
        params.productId = $scope.currentParams.productId;
        params.db = $scope.currentParams.db;
        getProductCharValue(params,function(valueList){
          $scope.charsValueList = valueList;
        });
      }
    };
  
  getProductHeaderChar = function(params, callback) {
    callback = callback || function(){};
    
    var data = { catalogDB: params.db
               , pid:       params.productId
               };
    
    network.get('GetProductHeaderCharacteristics',data,function(result, response){
      if (result) {
        page.hideLoader();
        callback(httpAdapter.convert(response));
      } else {
        
      }
    });
  };
  
  getProductCharValue = function(params, callback) {
    callback = callback || function(){};
    
    var data = { catalogDB: params.db
               , pid:       params.productId
               , cid:       params.id
               };
    
    network.get('GetProductCharacteristicValues',data,function(result, response){
      if (result) {
         callback(httpAdapter.convert(response));
      } else {
        
      }
    });
  };
  
  getProductsByValue = function(params, callback) {
    callback = callback || function(){};
    
    var data = { catalogDB: params.db
               , pid:       params.productId
               , cid:       params.id
               , cv:        params.value
               , uid:       network.getUserId()
               };
    
    network.get('GetProductsForProductHeaderCharacteristicAndValue',data,function(result, response){
      if (result) {
         callback(httpAdapter.convert(response));
      } else {
        
      }
    });
  };
    
}]);
