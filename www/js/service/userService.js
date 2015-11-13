tol.service('userService',['$rootScope','page','config',function($rootScope,page,config){
    
  var $user = this;
  //var productId, userCode, product, avatar, hotelName, userId = false, user, catalogDB = false, hotelId;
  
  var storage = { productId: false
                , userCode: false
                , product: false
                , authProduct: false
                , avatar: false
                , hotelName: false
                , userId: false
                , user: false
                , catalogDB: false
                , hotelId: false
                };
  
  $user.clear = function() {
    for (var key in storage) {
      storage[key] = false;
    }
  };
  
  $user.setProductId = function(id) {
    storage.productId = id*1;
  };
  
  $user.getProductId = function() {
    return storage.productId;
  };
  
  $user.setUserCode = function(code) {
    storage.userCode = code;
  };
  
  $user.getUserCode = function() {
    return storage.userCode;
  }; 
  
  $user.setProduct = function(data) {
    storage.product = data;
    $rootScope.$broadcast('onProductChanged',storage.product);
  };
  
  $user.getProduct = function() {
    return storage.product;
  };
  
  $user.setAuthProduct = function(data) {
    storage.authProduct = data;
  };
  
  $user.getAuthProduct = function() {
    return storage.authProduct;
  };
  
  $user.setHotelId = function(id) {
    storage.hotelId = id*1;
  };
  
  $user.getHotelId = function() {
    return storage.hotelId;
  };
  
  $user.setHotelName = function(data) {
    storage.hotelName = data;
  };
  
  $user.getHotelName = function() {
    return storage.hotelName;
  };
  
  $user.setAvatar = function(url){
    storage.avatar = url;
  };
  
  $user.getAvatar = function() {
    return storage.avatar;
  };
  
  $user.setUserId = function(id) {
    storage.userId = id*1;
  };
  
  $user.getUserId = function() {
    return storage.userId;
  };
  
  $user.setUser = function(data) {
    storage.user = data;
  };
  
  $user.getUser = function() {
    return storage.user;
  };
  
  $user.setCatalogDB = function(db) {
    storage.catalogDB = db;
  };
  
  $user.getCatalogDB = function() {
    return storage.catalogDB;
  };
}]);