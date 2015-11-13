qaalog.controller('groupDetail',['$scope','page','network','httpAdapter','device',function($scope,page,network,httpAdapter,device){
    
    var getProductCharValue;
    var getProductsByValue;
    
    $scope.imgPrefix = network.servisePath+'GetCroppedImage?i=';
    var imgHeight = Math.floor(device.emToPx(20));
    $scope.imgSufix = '&w=768&h='+imgHeight;
    
    var settings = { name:   'groupDetail'
                   , title:  'Group Details'
                   , back:   true
                   , menu:   true
                   , groupTitle: true
                   };

    page.onShow(settings,function(params) {
      $scope.currentParams = params;
      page.setGroupTitle(params.list);
      page.setTitle(params.name);
      
      getProductCharValue(params,function(valueList){
        $scope.charsValueList = valueList;
        console.log($scope.charsValueList);
      });
      
      page.hideLoader();

    });
    
    $scope.openCharValueList = function(item) {
      item = item || {};

      if (item.hidden === true) {
        item.hidden = false;
        return false;
      }
      
      item.charValueList = item.charValueList || [];
      
      if (!item.hidden) {
        
        if (!item.charValueList[0]) {
          
          item.productId = $scope.currentParams.productId;
          item.db = $scope.currentParams.db;
          item.isLoading = true;
          getProductsByValue(item,function(list){
            item.charValueList = list;
            item.hidden = true;
            item.isLoading = false;
          });
          return true;
        }
        
        item.hidden = true;
      } else {
        item.hidden = false;
      }
      
    };
    
    $scope.showProductDetail = function(charValue) {
      
      charValue = charValue || {};
      charValue.db = $scope.currentParams.db;
      charValue.id = charValue.productId;
      delete charValue.productId;
      page.show('productDetail',charValue);
      
    };
    
    $scope.toogleLikes = function(charValue) {
      charValue.productLike = (charValue.ilov > 0) 
          ? --charValue.productLike : ++charValue.productLike;
          
      charValue.ilov = (charValue.ilov === 0) ? 1 : 0;
      var data = { catalogDB: $scope.currentParams.db
                 , uid:       network.getUserId()
                 , pid:       charValue.productId
                 , on:        charValue.ilov
                 , glat:      ''
                 , glong:     ''
                 };
      network.get('ToggleEndorsementProduct',data,function(response){
        
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


