
tol.controller('searchPage',['$scope','config','page','network','searchService','userService','dialog','$timeout','lightbox','$sce','$rootScope','$filter',
  function($scope,config,page,network,searchService,userService,dialog,$timeout,lightbox,$sce,$rootScope,$filter){
    
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

    $scope.addAllVisible = true;
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

    $scope.recognizeListDep = [];

    $scope.searchStarted = false;
    $scope.currentProductId = userService.getAuthProduct().id;
    recentName = 'recent_' + userService.getProductId() + '_' + userService.getHotelId();
    //db = openDatabase('recent_search_db_2', '1.0', 'Recent Search', 2 * 1024 * 1024);
    $scope.departmentName = '';
    if (params['characteristic_id']) {

      var data = { 'characteristic_id[]': params['characteristic_id']
                 , 'characteristic_value[]': params['characteristic_value']
                 };
      $scope.charSearch(data);
      $scope.searchStarted = true;
      $scope.departmentName  =  params['characteristic_value'][0];
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
    page.toggleNoResults(false);
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
        $scope.departmentEmployeesCount = response.length;
        $scope.products = response;
        for (var i = 0, l = response.length; i < l; i++) {
          response[i]['productId'] = response[i].id;
          for (var n = 0, nn = $scope.recognizeList.length; n < nn; n++) {
            if ($scope.recognizeList[n].id*1 === response[i].id*1) {
              response[i] = $scope.recognizeList[n];
              $scope.recognizeListDep.push($scope.recognizeList[n]);
              $scope.addAllVisible = false;
            }
          }
        }
        $timeout(function() {
          countRecoWrapWidth();
        },0,true);
        if (response.length < 1) {
          page.toggleNoResults(true,'No results found.');
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

  $scope.$on('clearSavedDataEvent',function(event){
    $scope.recognizeList = [];
    $scope.savedData = {};
  });

  $scope.$watchCollection('recognizeList', function(newval,oldval) {
    $rootScope.$broadcast('recognizeListChanged',newval);
  });
  $scope.$watchCollection('savedData', function(newval,oldval) {
    $rootScope.$broadcast('savedDataChanged',newval);
  });

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
          page.toggleNoResults(true,'No results found.');
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
    var id = product['from_product_id'] || product.id;
    document.getElementById('search-input').blur();
    saveRecent(prepareProductDataForRecent(product));
    page.show('profile',{productId: id});
  };
  
  $scope.goToGivePoints = function(product) {
    document.getElementById('search-input').blur();
    product.backPage = { name: 'feed'
                       , params: {}
                       };
    page.show('givePoints',product);
  };
  function prepareProductDataForRecent(product){
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
    return data;
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
    
    checkStorageDataActuality(readFromLocalstorage(recentName),function(result,data){
        $scope.products = data;
        writeToLocalstorage(recentName,data);
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
        //var searchInput = document.getElementById('search-input');
    });
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

  function checkStorageDataActuality(data,callback) {
      callback = callback || function(){};
      var resultData = [];
      if (data.length) {
          var params = {
              'ids[]': []
          };
          for (var i = 0; i < data.length; i++) {
              params['ids[]'].unshift(data[i].id);
          }
          network.get('product/', params, function (result, response) {
              if (result) {
                  for(var j = 0;j<response.length;j++){
                      for(var k = 0;k<data.length;k++){
                          if(data[k].id == response[j].id){
                             var tmp =  prepareProductDataForRecent(response[j]);
                             tmp['updated_date'] = new Date().getTime();
                             resultData.unshift(tmp);
                             break;
                          }
                      }
                  }
                  callback(true,resultData);
              } else {
                  callback(false,data);
              }
          });
      }
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
    if($scope.recognizeList.length>0){
      var wrap = document.getElementById('search-reco-inner');
      var wrapWidth = wrap.getBoundingClientRect().width;
      wrap.style.width = (wrapWidth + app.emToPx(60)) + 'px';
    }
    product.isAdded = true;
    $scope.recognizeList.unshift(product);
    if($scope.departmentName){
      $scope.fillRecoDep();
    }
    $timeout(function(){
        countRecoWrapWidth();
    },0,true);
    console.log($scope.recognizeList);
    if($scope.searchStarted && config.ADD_TO_RECENT_SEARCH_SELECTED){
      saveRecent(prepareProductDataForRecent(product));
    }
    
  };
  $scope.removeFromRecognizeList = function(index) {
    if(index !== false){
      var foundedObj;
      var wasFound = false;
      var productsLength = $scope.products.length;
      console.log(foundedObj);
      delete $scope.recognizeList[index].isAdded;
      $scope.recognizeList.splice(index,1);
      if($scope.departmentName){
        $scope.fillRecoDep();
      }
      /*
            if(index>2){
              var wrap = document.getElementById('search-reco-inner');
              var wrapWidth = wrap.getBoundingClientRect().width;
              wrap.style.width = (wrapWidth - app.emToPx(30)) + 'px';
            }
      */
      $timeout(function() {
        countRecoWrapWidth();
      });
    }
  };

  $scope.departmentFilter = function(tagArray,tagArrayIndex,inArray,tag,disabled) {
    var found = $filter('listFilterByTag')(tagArray,tagArrayIndex,inArray,tag,disabled);
    return found;
  }

  $scope.fillRecoDep = function(){
    var recoDepTemp = [];
    var productsLength = $scope.products.length;
    for(var i = 0;i<productsLength;i++){
      var filteredData = $scope.departmentFilter($scope.products,i,$scope.recognizeList,'id',false);
      if(filteredData.data.length){
        recoDepTemp.push($scope.recognizeList[filteredData.index]);
      }
    }
    $scope.addAllVisible = !(recoDepTemp.length>0);
    $scope.recognizeListDep = recoDepTemp;
  }

  $scope.getIndexAtRecognizeList = function(product){
    var found = false;
    if($scope.recognizeList.length>0){
      for(var i=0;i<$scope.recognizeList.length;i++){
        if($scope.recognizeList[i].id == product.id){
          found = i;
          break;
        }
      }
    }
    return found;
  }
  $scope.splitName = function(product) {
    var fullName = product.name || product.from_product_name;
    fullName = fullName.replace(/\s\s+/g, ' ');
    var splitedName = fullName.split(' ');
    return $sce.trustAsHtml(splitedName[0] + '<br>' + splitedName[1]);
  };
  
  $scope.$on('searchRecognizeListRendered', function() {
    $timeout(function(){
      countRecoWrapWidth();
    },0,true);
  });
  
  function countRecoWrapWidth() {
    var elements = document.getElementsByClassName('search-recognized');
    var recognizedStripped = document.getElementsByClassName('searchs recognized stripped');
    var recognizedStrippedWidth = 0;
    var wrap = document.getElementById('search-reco-inner');
    var scrollWrap = document.getElementById('search-reco-scroll');
    var width = 0;
    if (recognizedStripped && recognizedStripped.length>0){
      recognizedStrippedWidth = recognizedStripped[0].getBoundingClientRect().width;
    }
    if (elements.length < 2) {
      wrap.style.width = innerWidth + 'px';
      return false;
    }
    
    for (var i = 0, ii = elements.length; i < ii; i++) {
      width += elements[i].getBoundingClientRect().width;
    }
    width+=recognizedStrippedWidth;
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

  $scope.addAll = function(){
    if($scope.products.length){
      var recalculateWidthNeeded = false;
      for(var i=0;i<$scope.products.length;i++){
        if ($scope.products[i].isAdded) continue;
        if ($scope.products[i].productId*1 === userService.getAuthProduct().id*1) {
          continue;
        }
        if (!$scope.products[i].productId && $scope.products[i].id*1 === userService.getAuthProduct().id*1) {
          continue;
        }
        if($scope.recognizeList.length>1){
          var wrap = document.getElementById('search-reco-inner');
          var wrapWidth = wrap.getBoundingClientRect().width;
          wrap.style.width = (wrapWidth + app.emToPx(60)) + 'px';
          recalculateWidthNeeded = true;
        }
        $scope.products[i].isAdded = true;
        $scope.recognizeList.unshift($scope.products[i]);
      }
      if($scope.departmentName){
        $scope.fillRecoDep();
      }
      if(recalculateWidthNeeded) {
        $timeout(function() {
           countRecoWrapWidth();
        },0,true);
      }
    }
  } ;

  $scope.removeAll = function () {
    $scope.addAllVisible = true;
    var productsLength =$scope.products.length;
    var recalculateWidthNeeded = false;
    if( productsLength>0 && $scope.recognizeList.length>0){
      for(var i=0;i<productsLength;i++){
        var found = $scope.departmentFilter($scope.products,i,$scope.recognizeList,'id',false);
        if(found.data.length>0){
          delete $scope.products[i].isAdded;
          $scope.recognizeList.splice(found.index,1);
          recalculateWidthNeeded = true;
        }
      }
      $scope.fillRecoDep();
    }
    if(recalculateWidthNeeded) {
      $timeout(function() {
        countRecoWrapWidth();
      },0,true);
    }
  }
    
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