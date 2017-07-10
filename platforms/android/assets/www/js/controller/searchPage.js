tol.controller('searchPage',['$scope','config','page','network','searchService','userService','dialog','$timeout','lightbox','$sce',
  function($scope,config,page,network,searchService,userService,dialog,$timeout,lightbox,$sce){
    
  $scope.recognizeList = [];
  var recentName = '';
  var settings = { name: 'searchPage'
                 , search: true
                 , smallSearch: true
                 , smallBack: true
                 , chart: true
                 };
                 
  $scope.imgPrefix = network.servisePathPHP + '/GetResizedImage?i=';
  $scope.imgSuffix = '&h=256&w=256';
  $scope.showPictureInLightBox = lightbox.showPicture;
                 
  page.onShow(settings,function(params) {
    if (window.cordova) {
      try {
        window.cordova.plugins.Keyboard.disableScroll(true);
        window.cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
      } catch(e) {
        console.log(e);
      }
    }
    
    if (!params.saveList && !params.isBack) {
      $scope.recognizeList = [];
      $scope.savedData = params.savedData;
    }
    if (params.recognizeList && !params.saveList) {
      $scope.recognizeList = params.recognizeList;
      $scope.savedData = params.savedData;
    }
    
    if (params.recognizeList) {
      $timeout(function() {
        countRecoWrapWidth();
      });
    }
    $scope.searchStarted = false;
    $scope.currentProductId = userService.getAuthProduct().id;
    recentName = 'recent_' + userService.getProductId() + '_' + userService.getHotelId();
    //db = openDatabase('recent_search_db_2', '1.0', 'Recent Search', 2 * 1024 * 1024);
    
    if (params['characteristic_id']) {

      var data = { 'characteristic_id[]': params['characteristic_id']
                 , 'characteristic_value[]': params['characteristic_value']
                 };
      $scope.charSearch(data);
      $scope.searchStarted = true;
      page.changePageSettings({ back: true
                              , title: params['characteristic_value'][0]
                              });
      
      return false;
    }
    
    if (params.id) {
      $scope.whoGivePoints(params.id);
      $scope.searchStarted = true;
      page.changePageSettings({ back: true
                              , title: 'Who gave points'
                              });
      return false;
    }
    
    page.hideLoader();
    loadRecent();
  });
  
  $scope.$on('freeMemory',function(){
    $scope.products = [];
    $scope.serchStarted = false;
    searchService.setInputValue('');
  });
  
  $scope.charSearch = function(params) {
    network.get('product',params,function(result, response){
      page.hideLoader();
      if (result) {
        console.log(response);
        $scope.products = response;
        for (var i = 0, l = response.length; i < l; i++) {
          response[i]['productId'] = response[i].id;
          for (var n = 0, nn = $scope.recognizeList.length; n < nn; n++) {
            if ($scope.recognizeList[n].id*1 === response[i].id*1) {
              response[i] = $scope.recognizeList[n];
            }
          }
        }
        if (response.length < 1) {
          page.toggleNoResults(true,'No result found.');
          $scope.products = [];
        }
      }     
    });
  };
  
  $scope.whoGivePoints = function(id) {
    network.post('points_given/getPostGivers',{'post_id': id},function(result,response){
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
  

  
  function onProductExpire(product) {
    network.get('product/'+product.id,{},function(result, response){
      if (result) {
       var data = { 'id': response.id
                  , 'name': response.name
                  , 'header_name': response['header_name']
                  , 'image_url': response['image_url']
                  };
        writeToLocalstorageQueue(data);
        product.productId = response.id;
        product.image_url = response['image_url'];
        product.expire_time = new Date().getTime();
      }
    });
  }; 
  
  $scope.search = function(value) {
    page.toggleNoResults(false);
    network.get('product/',{filter: value},function(result,response){
      if (result) {
        if (response.length < 1) {
          page.toggleNoResults(true,'No result found.');
          $scope.products = [];
          return false;
        }
        
        $scope.products = response;
        for (var i in response) {
          response[i].productId = response[i].id;
          for (var n = 0, nn = $scope.recognizeList.length; n < nn; n++) {
            if ($scope.recognizeList[n].id*1 === response[i].id*1) {
              response[i] = $scope.recognizeList[n];
            }
          }
        }
      }
    },false,true);
  };
  
  searchService.onSearch = function(value) {
    network.stopAll();
    if (value) {
      $scope.searchStarted = true;
      $scope.search(value);
    } else {
      $scope.searchStarted = false;
      $scope.products = [];
      loadRecent();
    }
  };
  
  $scope.showProfile = function(product) {
    console.log('GO',product);
    document.getElementById('search-input').blur();
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
    
    saveRecent(data);
    page.show('profile',{productId: id});
  };
  
  $scope.goToGivePoints = function(product) {
    document.getElementById('search-input').blur();
    product.backPage = { name: 'feed'
                       , params: {}
                       };
    page.show('givePoints',product);
  };
  
  function saveRecent(product) {
    product['updated_date'] = new Date().getTime();
    product.productId = product.id;
    
    var recent = readFromLocalstorage(recentName);
    recent.unshift(product);
    
    for (var i = 1, l = recent.length; i < l; i++) {
      if (recent[i].id === product.id) {
        recent.splice(i,1);
        break;
      } 
    }
    
    if (recent.length > 5) {
      recent.splice(5, recent.length);
    }
    
    writeToLocalstorage(recentName, recent);
  }
  
  function loadRecent() {
    $timeout(function() {
      page.hideLoader();
    });

    page.toggleNoResults(false);
    
    $scope.products = readFromLocalstorage(recentName);
    
    if ($scope.products.length < 1) {
      page.toggleNoResults(true,'No result found.','.search-title');
      return false;
    }
    
    for (var i = 0, l = $scope.products.length; i < l; i++) {
      var product = $scope.products[i];
      if (product['updated_date'] + 10*60*1000 < new Date().getTime()) {
        onProductExpire(product);
      }
      for (var n = 0, nn = $scope.recognizeList.length; n < nn; n++) {
        console.log($scope.recognizeList[n].id*1, product.id*1);
        if ($scope.recognizeList[n].id*1 === product.id*1) {
          $scope.products[i] = $scope.recognizeList[n];
        }
      }
    }
    
    executeLocalstorageQueue(recentName);
    var searchInput = document.getElementById('search-input');
    
  }
  
  function writeToLocalstorage(name, data) {
    var stringData = '';
    
    if (typeof data === 'string') {
      stringData = data;
    }
    
    try {
     stringData = JSON.stringify(data);
    } catch (e) {
      
    }
    
    window.localStorage.setItem(name, stringData);
  };
  
  function readFromLocalstorage(name) {
    var data = [];
    
    var stringData = window.localStorage.getItem(name);
    
    if (stringData) {
      try {
        data = JSON.parse(stringData);
      } catch (e) {

      }
    }
    
    return data;
  }
  
  var localstorageQueue = [];
  function writeToLocalstorageQueue(product) {
    localstorageQueue.push(product);
  };
  
  function executeLocalstorageQueue(name) {
    if (localstorageQueue.length < 1) return false;
    
    var data = readFromLocalstorage(name);
    
    for (var i = 0, l = data.length; i < l; i++) {
      for (var n = 0, ln =  localstorageQueue.length; n < ln; n++) {
        var product = localstorageQueue[n];
        if (product.id === data[i].id) {
          data[i] = JSON.parse(JSON.stringify(product));
          data[i]['updated_date'] = new Date().getTime();
          console.log(data[i]);
          break;
        }
      }
    }
    writeToLocalstorage(name, data);
    localstorageQueue = [];
    
  }
  
  function removeFromLocalstorage(name, from, count) {
    var data = readFromLocalstorage(name);
    try {
      data.splice(from, count);
      writeToLocalstorage(name, data);
    } catch(e) {
      
    }
    
  }
  

  $scope.recognize = function() {
    if ($scope.recognizeList.length !== 0) {
      var backPage = { name: 'feed'
                     , params: {}
                     };
      page.show('givePoints',{recognizeList: $scope.recognizeList, backPage: backPage, savedData: $scope.savedData});
    }
  };

  
  $scope.addToRecognizeList = function(product) {
    if (product.isAdded) return false;

    var wrap = document.getElementById('search-reco-inner');
    var wrapWidth = wrap.getBoundingClientRect().width;
    wrap.style.width = (wrapWidth + app.emToPx(15)) + 'px';
    product.isAdded = true;
    
    $scope.recognizeList.unshift(product);
    console.log($scope.recognizeList);
  };
  
  $scope.removeFromRecognizeList = function(index) {
    delete $scope.recognizeList[index].isAdded;
    $scope.recognizeList.splice(index,1);
    
    var wrap = document.getElementById('search-reco-inner');
    var wrapWidth = wrap.getBoundingClientRect().width;
    wrap.style.width = (wrapWidth - app.emToPx(15)) + 'px';
    
    $timeout(function() {
      countRecoWrapWidth();
    });
  };
  
  $scope.splitName = function(product) {
    var fullName = product.name || product.from_product_name;
    var splitedName = fullName.split(' ');
    return $sce.trustAsHtml(splitedName[0] + '<br>' + splitedName[1]);
  };
  
  $scope.$on('searchRecognizeListRendered', function() {
    countRecoWrapWidth();
  });
  
  function countRecoWrapWidth() {
    var elements = document.getElementsByClassName('search-recognized');
    var wrap = document.getElementById('search-reco-inner');
    var scrollWrap = document.getElementById('search-reco-scroll');
    var width = 0;
    
    if (elements.length < 3) {
      wrap.style.width = innerWidth + 'px';
      return false;
    }
    
    for (var i = 0, ii = elements.length; i < ii; i++) {
      width += elements[i].getBoundingClientRect().width;
    }
    if (width > innerWidth) {
      wrap.style.width = width + 'px';
    } else {
      wrap.style.width = innerWidth + 'px';
    }
    scrollWrap.scrollLeft = 0;
  }
  
  $scope.isAddButtonVisiable = function(product) {
    if (product.productId*1 === userService.getAuthProduct().id*1) {
      return false;
    }
    if (!product.productId && product.id*1 === userService.getAuthProduct().id*1) {
      return false;
    }
    return true;
  };
    
    
}]);

//  function createSQLTable() {
//    db.transaction(function (tx) {
//      tx.executeSql( 'CREATE TABLE IF NOT EXISTS product'
//                   + '(table_id INTEGER PRIMARY KEY,'
//                   + ' rely_product_id INTEGER,'
//                   + ' rely_hotel_id INTEGER,'
//                   + ' id INTEGER,'
//                   + ' name TEXT,'
//                   + ' header_name TEXT,'
//                   + ' image_url TEXT,'
//                   + ' last_visit_date INTEGER,'
//                   + ' updated_date INTEGER,'
//                   + ' created_date INTEGER)', 
//        [],
//        function(tx, result) {
//          $timeout(function(){
//            page.hideLoader();
//            //alert('table 1.1 created');
//            localStorage.setItem('table_exist_1.1',true);
//            setTimeout(function(){
//              $scope.loadRecentSearch();
//            },300);
//          });
//        },
//        function(tx, error) {
//          console.error(error);
//          alert(error.message);
//        }
//      );
//    });
//  }
  

//  function saveToSQLStorage(data) {
//    db.transaction(function (tx) {
//      var now = new Date().getTime();
//      tx.executeSql('INSERT INTO product (table_id, rely_product_id, rely_hotel_id, id, name, header_name, image_url, last_visit_date, updated_date, created_date) ' + 
//        'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [ null
//                                                 , userService.getProductId()
//                                                 , userService.getHotelId()
//                                                 , data.id
//                                                 , data.name
//                                                 , data.header_name
//                                                 , data.image_url
//                                                 , now
//                                                 , now
//                                                 , now
//                                                 ],
//        function(tx,result) {},
//
//        function(tx, error) {
//          localStorage.removeItem('table_exist_1.1');
//          console.error(error);
//          alert(error.message);
//        }
//      );
//
//    });     
//  }
  
//  function loadFromSQLStorage(callback) {
//    page.hideLoader();
//    
//    db.transaction(function (tx) {
//      tx.executeSql('SELECT * FROM product WHERE rely_product_id = ? AND rely_hotel_id = ? ORDER BY last_visit_date DESC', 
//        [userService.getProductId(),userService.getHotelId()], function (tx, results) {
//         console.log('SQL', userService.getProductId(),userService.getHotelId());
//          if (results.rows.length > 0) {
//            var resultArray = [];
//            for (var i = 0, l = results.rows.length; i < l; i++) {
//              resultArray.push(results.rows.item(i));
//            }
//            callback(resultArray);
//            return true;
//          }
//          
//          callback([]);
//          
//      }, function(tx, error) {
//            localStorage.removeItem('table_exist_1.1');
//            console.error(error);
//          });
//    });
//  }
  
//  function deleteFromSQLStorage(id) {
//    db.transaction(function (tx) {
//      tx.executeSql('DELETE FROM product WHERE table_id=?', 
//        [id], function (tx, results) {
//         console.log('Deleted', results); 
//      }, function(tx, error) {
//            localStorage.removeItem('table_exist_1.1');
//            console.error(error);
//          });
//    });
//  }
  
//  function updateSQLStorage(data, tableId) {
//     db.transaction(function (tx) {
//       var now = new Date().getTime();
//       tx.executeSql('UPDATE product SET' 
//                   + ' id = ?,' 
//                   + ' name = ?,' 
//                   + ' header_name = ?,' 
//                   + ' image_url = ?,' 
//                   + ' last_visit_date = ?,'
//                   + ' updated_date = ?' 
//                   + ' WHERE table_id = ?', 
//        [data.id, data.name, data.header_name, data.image_url, now, now, tableId],
//          function(tx, result){
//            console.log(result);
//          },
//          function(tx, error){
//            localStorage.removeItem('table_exist_1.1');
//            alert(error.message);
//            console.error(error);
//          }
//       
//       );
//       
//     });
//  }
//  
//  function updateProductFromSQLStorage(data) {
//    db.transaction(function (tx) {
//       
//       tx.executeSql('UPDATE product SET'
//       
//               + ' name = ?,' 
//               + ' header_name = ?,' 
//               + ' image_url = ?,' 
//               + ' updated_date = ?' 
//               + ' WHERE rely_product_id = ? AND rely_hotel_id = ? AND id = ?', 
//       
//              [ data.name
//              , data.header_name
//              , data.image_url
//              , new Date().getTime()
//              , userService.getProductId()
//              , userService.getHotelId()
//              , data.id
//              ],
//              
//              function(tx, result){
//                console.log(result);
//              },
//              function(tx, error){
//                localStorage.removeItem('table_exist_1.1');
//                alert(error.message);
//                console.error(error);
//              }
//       );
//       
//     });
//  }

//  $scope.addToRecent = function(data) {
//    
//    //try {
//      loadFromSQLStorage(function(rows){
//        for (var i in rows) {
//          if (rows[i].id*1 === data.id*1) {
//            updateSQLStorage(data, rows[i].table_id);
//            return false;
//          }
//        }
//
//        saveToSQLStorage(data);
//      });
//   // } catch(e) {};
//    
//  };

//  $scope.loadRecentSearch = function() {
//    page.hideLoader();
//
//    loadFromSQLStorage(function(rows){
//      if (rows.length < 1) {
//        page.toggleNoResults(true,'No result found.','.search-title');
//        return false;
//      }
//      page.toggleNoResults(false);
//      $scope.products = rows;
//      var limit = 5;
//      for (var i in rows) {
//        var product = $scope.products[i];
//        product.productId = product.id;
//        if (i >= limit) {
//          deleteFromSQLStorage(product.table_id);
//          continue;
//        }
//        if (product.updated_date + 10*60*1000 < new Date().getTime()) {
//          onProductExpire(product);
//        }
//      }
//      try{$scope.$digest();}catch(e){};
//    });
//  };