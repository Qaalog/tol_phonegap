tol.controller('catalog', ['$rootScope','$scope','network', 'page', 'config', 'device', 'httpAdapter', '$timeout','userService','dialog','notification','analytics',
  function($rootScope,$scope, network, page, config, device, httpAdapter, $timeout,userService,dialog,notification,analytics) {

    var onScroll;
    $scope.imgPrefix = network.servisePath+'GetCroppedImage?i=';
    var imgSize = Math.floor(device.emToPx(7));
    var favElement;
    var favHeight = 0;
    var categoryTitleHeight;
    $scope.imgSufix = '&w='+imgSize+'&h='+imgSize;
    $scope.noResultVisiable = false;
    $scope.isIOS = device.isIOS;
    $scope.scrollPosition;

    $scope.rows = {};
    $scope.def = 'Generic';
    $scope.FAVORITE_DEF = 'Favorites';

    $scope.self = { 'name':  'catalog'
                  , 'title': 'Select your organization'
                  , smallBack: true
                  };
    var isUpdate;
    page.onShow($scope.self, function(data, update){
      
      app.innerHeight = window.innerHeight;
      page.setTabsVisiable(true); // fixed short container when application started with wrong orientation

      isUpdate = update;
      $scope.data = data;
      $scope.rows = {};
      $scope.getCatalogs(data);
      $scope.user = data;
      
      if ($scope.scrollPosition) {
        $timeout(function(){
          app.wrapper.scrollTop = $scope.scrollPosition;
          $scope.scrollPosition = false;
        });
      }

      //app.wrapper.addEventListener('scroll',onScroll);

    });

    $scope.$on('freeMemory',function(){
      //app.wrapper.removeEventListener('scroll',onScroll);
    });

    onScroll = function() {


      if ($scope.rows[$scope.FAVORITE_DEF].hidden) {
//        favHeight = favElement.getBoundingClientRect().height;
//        if (app.wrapper.scrollTop > favHeight) {
//          $scope.$apply(function(){
//            $scope.rows[$scope.FAVORITE_DEF].hidden = false;
//            categoryTitleHeight = categoryTitleHeight || document.getElementsByClassName('catalog-title')[0].getBoundingClientRect().height;
//            app.wrapper.scrollTop = categoryTitleHeight;
//          });
//        }
      }
    };
    
    function sendNotificationId(productId) {
      if (device.isWindows()) return false;
      var deviceType = '';
      if (device.isAndroid()) {
        deviceType = 'android';
      }
      if (device.isIOS()) {
        deviceType = 'ios';
      }
      var data = { device_id: device.getUUID()
                 , device_type: deviceType
                 , product_id: productId
                 , registration_id: app.notificationId || '0'
                 };
                 
      network.post('user/registerDevice',data);
    }
    
    var getProductId = function() {
      
      network.get('product/',{code:userService.getUser().username},function(result,response){
        if (result) {
            if (response.length < 1) {
              console.log('response',response);
              if (!isUpdate) {
                network.post('user/'+$scope.user['id'],{catalog_id: null},function(result, response){
                  page.show('catalog',$scope.data,true);
                });
              }
              dialog.create(dialog.QUESTION,'Access is denied','You are not created as a user on this hotel.<br>Please notify your HR manager.<br>Do you want logout?',
              'YES','NO',function(answer){
                if (answer) network.logout();
              }).show();
            }
            if (!response[0].image_url || response[0].image_url == null) {
              page.requestFBAvatar();
            }
            userService.setProductId(response[0].id);
            userService.setAuthProduct(response[0]);
            userService.setAvatar(response[0].image_url);
            userService.normalizeOrgLevels(response[0].characteristics);
            var isAdmin = userService.checkForAdmin(response[0].characteristics);
            if (isAdmin) {
              analytics.trackCustomDimension(analytics.USER_TYPE, 'Manager');
            } else {
              analytics.trackCustomDimension(analytics.USER_TYPE, 'Employee');
            }
            
            if (userService.getOrgLevel(1)) {
              analytics.trackCustomDimension(analytics.ORG_LEVEL_1, userService.getOrgLevel(1));
            }
            if (userService.getOrgLevel(2)) {
              analytics.trackCustomDimension(analytics.ORG_LEVEL_2, userService.getOrgLevel(2));
            }
            if (userService.getOrgLevel(3)) {
              analytics.trackCustomDimension(analytics.ORG_LEVEL_3, userService.getOrgLevel(3));
            }
            
            sendNotificationId(response[0].id);
            notification.getNewNotificationCount(response[0].id);
            if (app.coldStart && !app.started) {
              page.show('notification',{});
              app.started = true;
            } else {            
              page.show('feed',{});
              app.started = true;
            }
            page.navigatorClear();
        } else {
          //if (response.code == 501) {
            page.hideLoader();
            network.post('user/'+$scope.user['id'],{catalog_id: null},function(result, response){});
            dialog.create(dialog.QUESTION,'Access is denied','You are not created as a user on this hotel.<br>Please notify your HR manager.<br>Do you want logout?',
              'YES','NO',function(answer){
                if (answer) network.logout();
              }).show();
          //}
        }
      },false,true);  
    };

    $scope.selectCatalog = function(catalog) {
      page.showLoader();
      userService.setHotelName(catalog.name);
      userService.setHotelId(catalog.id);

      network.post('entity_catalog/CatalogProductExist',{'catalog_id': catalog.id, 'product_code':$scope.user.username}, 
        function(result, response) {
          
        if (result) {
          if (response.result === true) {
            console.log('catalog pager update');
            network.pagerReset();
            network.post('user/'+$scope.user['id'],{catalog_id: catalog.id, entity_id: catalog.entity_id},function(result, response){
              if (result) {
                analytics.trackCustomDimension(analytics.CATALOG, catalog.name);
                analytics.trackCustomDimension(analytics.ENTITY, catalog.entity_name);
                getProductId();
              }
            });
            return true;
          }
        }
        
        page.hideLoader();
        dialog.create(dialog.QUESTION,'Access is denied','You are not created as a user on this hotel.<br>Please notify your HR manager.<br>Do you want logout?',
              'YES','NO',function(answer){
                if (answer) network.logout();
              }).show();
        
        console.log(response);
      });
      

     
      
      
//      $scope.scrollPosition = app.wrapper.scrollTop;
//      network.setCatalogDB(catalog.db);
//      page.show('products',catalog);
    };

    $scope.toggleGroup = function(group,event){
      group.hidden = !group.hidden;
      if (group.hidden && group.name !== $scope.FAVORITE_DEF) {
        $timeout(function(){
          event.target.scrollIntoView();
          app.wrapper.scrollTop -= window.innerHeight/5; //Math.floor(device.emToPx(13));
          console.log('MATH',Math.floor(device.emToPx(13)),window.innerHeight/5);
        });
      }

      if (group.hidden && group.name === $scope.FAVORITE_DEF) {
        try {
          //favBottom = favElement.getBoundingClientRect().bottom;
        } catch (e){};
      }
    };

    $scope.$on('onListOpen',function(event,element){
      element.className += ' opened';
    });
    $scope.$on('onListClose',function(event,element){
      element.className = element.className.replace(' opened','');
    });

    $scope.getCatalogs = function(data) {
      var params =  { 'app_id':  config.appId
                    , 'device_id': device.getUUID() || 'pc11'
                    , language:       navigator.language
                    };

      network.get('entity_catalog/',params, function(result, response){
        if(result) {

          if (response.length === 0) {
            page.hideLoader();
            dialog.create(dialog.INFO,'INFO','Your hotel list is empty. Please change username<br>or contact your administrator','OK').show();
          }
          
          if ($scope.user.catalog_id) {
            for (var i in response) {
              if (response[i].id*1 === $scope.user.catalog_id*1) {
                $scope.selectCatalog(response[i]);
              }
            }
            return false;
          }
          
          
          page.hideLoader();
          if (response.length === 0) {
            $scope.noResultVisiable = true;
            return true;
          }

//          if (response.length === 1) {
//            response[0].canBackDisable = true;
//            $scope.selectCatalog(response[0]);
//            return false;
//          }

          $scope.rows[$scope.FAVORITE_DEF] = {'name':$scope.FAVORITE_DEF, 'items':[], 'hidden':false, style:{}};
          angular.forEach(response, function(item) {
            item.tags = item.tags || [];
            var groupInfo = item.tags[0];
            
            var group = groupInfo || $scope.def;
            $scope.rows[group] = $scope.rows[group] || {'name':group, 'items':[], 'hidden':false, style:{}};
            $scope.rows[group]['items'].push(item);

            if(item['is_favorite'] == 1) {
              $scope.rows[$scope.FAVORITE_DEF]['items'].push(item);
            }

          });

          var temp = $scope.rows[$scope.def];
          delete $scope.rows[$scope.def];
          $scope.rows[$scope.def] = temp;

        } else {
          page.hideLoader();
          dialog.create(dialog.INFO,'INFO','Your hotel list is empty. Please change username<br>or contact your administrator','OK',null,
            function(){
              page.show('login',{logout: true});
            }).show();
          console.log("ERROR");
          return false;
        }

        if ($scope.rows[$scope.FAVORITE_DEF].items.length > 0) {
          $scope.rows[$scope.FAVORITE_DEF].hidden = true;
        }
      });
    };

    
    var categoryHeight;
    $scope.$on('favRendered',function(){
      console.log('rendered');

    });

    var like = function(catalog) {
      console.log('like');
      catalog['is_favorite'] = 1;
      $scope.rows[$scope.FAVORITE_DEF]['items'].push(catalog);

      if ($scope.rows[$scope.FAVORITE_DEF]['items'].length > 1) {
        if ($scope.rows[$scope.FAVORITE_DEF].hidden) {
          //favHeight = favElement.getBoundingClientRect().height;
          $scope.rows[$scope.FAVORITE_DEF].hidden = false;
          // app.wrapper.scrollTop = app.wrapper.scrollTop + (favHeight - 110);
        }
      } else {
        app.wrapper.scrollTop = 0;
        $scope.rows[$scope.FAVORITE_DEF].hidden = true;
      }
    };

    var unlike = function(catalog) {
      console.log('unlike');
      catalog['is_favorite'] = 0;
      for (var i in $scope.rows[$scope.FAVORITE_DEF]['items']) {
        var item = $scope.rows[$scope.FAVORITE_DEF]['items'][i];
        if (catalog.db === item.db) {
          $scope.rows[$scope.FAVORITE_DEF]['items'].splice(i,1);
          break;
        }
      }

      if ($scope.rows[$scope.FAVORITE_DEF]['items'].length < 1) {
        $scope.rows[$scope.FAVORITE_DEF]['hidden'] = false;
        categoryTitleHeight = categoryTitleHeight || document.getElementsByClassName('catalog-title')[0].getBoundingClientRect().height;
        app.wrapper.scrollTop = app.wrapper.scrollTop + categoryTitleHeight;
      }
    };

    $scope.addToFavorites = function(catalog,event) {
      console.log('addToFavorites');
      favElement = document.getElementsByClassName('group')[0];
      event.stopPropagation();
      categoryHeight = categoryHeight || document.getElementsByClassName('category')[0].getBoundingClientRect().height;

      var value = 0;
      if (catalog['is_favorite'] != 1) {
        like(catalog);
        value = 1;
      } else {
        unlike(catalog);
      }

      $rootScope.$broadcast('recalculateListHeight');
      var data = { 'catalog_id': catalog.id
                 , 'device_id': device.getUUID() || 'pc11'
                 , 'value': value
                 };
                 console.log(data);
      network.post('entity_catalog/SetIsFavorite', data, function(result, response){
        if (result) {
          console.log(response);
        } else {
          if (action === 'like') unlike(catalog);
          if (action === 'unlike') like(catalog);
          //$scope.rows = {};
          //$scope.getCatalogs();
        }
      });
    };


    
}]);