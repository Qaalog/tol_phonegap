var tt;
tol.service('userService',['$rootScope','page','config',function($rootScope,page,config){
    
  var $user = this;
  $user.isAdmin = false;
  $user.canEditAllPosts = false;
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
                , catalogSelected:false
                , hotelId: false
                , password: false
                , orgLevels: {}
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
    $rootScope.$broadcast('onAuthProductChanged',storage.authProduct);
  };
  
  $user.getAuthProduct = function() {
    return storage.authProduct;
  };
  tt = $user.getAuthProduct;
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
    storage.authProduct.image_url = url;
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
  
  $user.setPassword = function(password) {
    storage.password = password;
  };
  
  $user.getPassword = function() {
    return storage.password;
  };

  $user.setCatalogSelected = function(catalog) {
    storage.catalogSelected = catalog;
  };

  $user.getCatalogSelected = function() {
    return storage.catalogSelected;
  };

  $user.checkForAdmin = function(characteristics) {
    for (var i = 0, l = characteristics.length; i < l; i++) {
      var char = characteristics[i];
      
      if (char.short_name === 'role') {
        if (!!char.long_name && char.long_name.toLowerCase() === 'manager' && char.value*1 === 1) {
          $user.isAdmin = true;
          return true;
        }
      }
      
    }
    return false;
  };

  $user.checkCanEditAllPosts = function(characteristics) {
    for (var i = 0, l = characteristics.length; i < l; i++) {
      var char = characteristics[i];

      if (char.short_name === 'role') {
        if (!!char.long_name && char.long_name.toLowerCase() === 'admin' && char.value*1 === 1) {
          $user.canEditAllPosts = true;
          return true;
        }
      }

    }
    return false;
  };

  $user.checkPrivacyTerms = function(currentPrivacyId){
    if(currentUser = $user.getUser()){
       if(typeof currentUser.terms_privacy_accepted !='undefined'){
         return currentUser.terms_privacy_accepted;
       }
    }
    return true;
  }

  $user.normalizeOrgLevels = function(characteristics) {
    for (var i = 0, l = characteristics.length; i < l; i++) {
      var char = characteristics[i];
      
      if (/level\d+/.test(char.short_name)) {
        var index = /level(\d+)/.exec(char.short_name)[1]*1;
        storage.orgLevels[index] = char.value;
      }
    }
    return storage.orgLevels;
  };
  
  $user.getOrgLevel = function(index) {
    if (storage.orgLevels[index]) {
      return storage.orgLevels[index];
    }
    
    return null;
  };
}]);