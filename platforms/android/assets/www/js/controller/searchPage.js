tol.controller('searchPage',['$scope','config','page','network','searchService','userService','dialog','$timeout','lightbox',
  function($scope,config,page,network,searchService,userService,dialog,$timeout,lightbox){
    
  var db;
  var settings = { name: 'searchPage'
                 , search: true
                 , smallSearch: true
                 , smallBack: true
                 , chart: true
                 };
                 
  $scope.imgPrefix = network.servisePathPHP + '/GetCroppedImage?i=';
  $scope.imgSuffix = '&h=256&w=256';
  $scope.showPictureInLightBox = lightbox.showPicture;
                 
  page.onShow(settings,function(params) {   
    $scope.currentProductId = userService.getProductId();
    
    if (params.id) {
      $scope.whoGivePoints(params.id);
      $scope.searchStarted = true;
      page.changePageSettings({ back: true
                              , title: 'Who gaves points'
                              });
      return false;
    }
    db = openDatabase('recent_search_db_2', '1.0', 'Recent Search', 2 * 1024 * 1024);
    
    if (!localStorage.getItem('table_exist_1.1')) {
      createSQLTable();
    } else {
      $scope.loadRecentSearch();
    }
    
  });
  
  $scope.$on('freeMemory',function(){
    $scope.products = [];
    $scope.serchStarted = false;
    searchService.setInputValue('');
  });
  
  $scope.whoGivePoints = function(id) {
    network.get('points_given/',{'post_id': id},function(result,response){
      if (result) {
        if (response.length === 0) {
          page.goBack();
          dialog.create(dialog.INFO,'Empty result','This post has no points yet.','OK').show();
          return false;
        }
        $scope.products = response;
        for (var i in response) {
          response[i].productId = response[i]['from_product_id'];
        }
      }
      page.hideLoader();
    });
  };
  
  function createSQLTable() {
    db.transaction(function (tx) {
      tx.executeSql( 'CREATE TABLE IF NOT EXISTS product'
                   + '(table_id INTEGER PRIMARY KEY,'
                   + ' rely_product_id INTEGER,'
                   + ' rely_hotel_id INTEGER,'
                   + ' id INTEGER,'
                   + ' name TEXT,'
                   + ' header_name TEXT,'
                   + ' image_url TEXT,'
                   + ' last_visit_date INTEGER,'
                   + ' updated_date INTEGER,'
                   + ' created_date INTEGER)', 
        [],
        function(tx, result) {
          $timeout(function(){
            page.hideLoader();
            //alert('table 1.1 created');
            localStorage.setItem('table_exist_1.1',true);
            $scope.loadRecentSearch();
          });
        },
        function(tx, error) {
          console.error(error);
          alert(error.message);
        }
      );
    });
  }
  

  function saveToSQLStorage(data) {
    db.transaction(function (tx) {
      var now = new Date().getTime();
      tx.executeSql('INSERT INTO product (table_id, rely_product_id, rely_hotel_id, id, name, header_name, image_url, last_visit_date, updated_date, created_date) ' + 
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [ null
                                                 , userService.getProductId()
                                                 , userService.getHotelId()
                                                 , data.id
                                                 , data.name
                                                 , data.header_name
                                                 , data.image_url
                                                 , now
                                                 , now
                                                 , now
                                                 ],
        function(tx,result) {},

        function(tx, error) {
          localStorage.removeItem('table_exist_1.1');
          console.error(error);
          alert(error.message);
        }
      );

    });     
  }
  
  function loadFromSQLStorage(callback) {
    page.hideLoader();
    
    db.transaction(function (tx) {
      tx.executeSql('SELECT * FROM product WHERE rely_product_id = ? AND rely_hotel_id = ? ORDER BY last_visit_date DESC', 
        [userService.getProductId(),userService.getHotelId()], function (tx, results) {
         
          if (results.rows.length > 0) {
            var resultArray = [];
            for (var i = 0, l = results.rows.length; i < l; i++) {
              resultArray.push(results.rows.item(i));
            }
            callback(resultArray);
            return true;
          }
          
          callback([]);
          
      }, function(tx, error) {
            localStorage.removeItem('table_exist_1.1');
            console.error(error);
          });
    });
  }
  
  function deleteFromSQLStorage(id) {}
  
  function updateSQLStorage(data, tableId) {
     db.transaction(function (tx) {
       var now = new Date().getTime();
       tx.executeSql('UPDATE product SET' 
                   + ' id = ?,' 
                   + ' name = ?,' 
                   + ' header_name = ?,' 
                   + ' image_url = ?,' 
                   + ' last_visit_date = ?,'
                   + ' updated_date = ?' 
                   + ' WHERE table_id = ?', 
        [data.id, data.name, data.header_name, data.image_url, now, now, tableId],
          function(tx, result){
            console.log(result);
          },
          function(tx, error){
            localStorage.removeItem('table_exist_1.1');
            alert(error.message);
            console.error(error);
          }
       
       );
       
     });
  }
  
  function updateProductFromSQLStorage(data) {
    db.transaction(function (tx) {
       
       tx.executeSql('UPDATE product SET'
       
               + ' name = ?,' 
               + ' header_name = ?,' 
               + ' image_url = ?,' 
               + ' updated_date = ?' 
               + ' WHERE rely_product_id = ? AND rely_hotel_id = ? AND id = ?', 
       
              [ data.name
              , data.header_name
              , data.image_url
              , new Date().getTime()
              , userService.getProductId()
              , userService.getHotelId()
              , data.id
              ],
              
              function(tx, result){
                console.log(result);
              },
              function(tx, error){
                localStorage.removeItem('table_exist_1.1');
                alert(error.message);
                console.error(error);
              }
       );
       
     });
  }
  
  function onProductExpire(product) {
    network.get('product/'+product.id,{},function(result, response){
      if (result) {
       var data = { 'id': response.id
                  , 'name': response.name
                  , 'header_name': response['header_name']
                  , 'image_url': response['image_url']
                  };
        updateProductFromSQLStorage(data);
        product.productId = response.id;
        product.image_url = response['image_url'];
        product.expire_time = new Date().getTime();
      }
    });
  };
  
  $scope.loadRecentSearch = function() {
    page.hideLoader();

    loadFromSQLStorage(function(rows){
      $scope.products = rows;
      for (var i in $scope.products) {
        var product = $scope.products[i];
        product.productId = product.id;
        console.log(product);
        if (product.updated_date + 10*60*1000 < new Date().getTime()) {
          onProductExpire(product);
        }
      }
      try{$scope.$digest();}catch(e){};
    });
  };
  
  $scope.search = function(value) {
    network.get('product/',{filter: value},function(result,response){
      if (result) {
        $scope.products = response;
        for (var i in response) {
          response[i].productId = response[i].id;
        }
      }
    },false,true);
  };
  
  $scope.addToRecent = function(data) {
    
    loadFromSQLStorage(function(rows){
      for (var i in rows) {
        if (rows[i].id*1 === data.id*1) {
          updateSQLStorage(data, rows[i].table_id);
          return false;
        }
      }
      
      saveToSQLStorage(data);
    });
    
  };
  
  
  searchService.onSearch = function(value) {
    if (value) {
      $scope.searchStarted = true;
      $scope.search(value);
    } else {
      $scope.searchStarted = false;
      $scope.loadRecentSearch();
    }
  };
  
  $scope.showProfile = function(product) {
    console.log('GO',product);
    var id = product['from_product_id'] || product.id;
    
    var data = { 'id': product.id
               , 'name': product.name
               , 'header_name': product.header_name
               , 'image_url': product.image_url
               };
    if (product['from_product_id']) {
      data = { 'id': product['from_product_id']
             , 'name': product['from_product_name']
             , 'header_name': product['from_product_header_name']
             , 'image_url': product['from_product_image']
             };
    }
    
    
    $scope.addToRecent(data);
    page.show('profile',{productId: id});
  };
  
  $scope.goToGivePoints = function(product) {
    page.show('givePoints',product);
  };
    
    
}]);