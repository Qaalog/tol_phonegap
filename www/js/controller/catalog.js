tol.controller('catalog', ['$rootScope','$scope','network', 'page', 'config', 'device', 'httpAdapter', '$timeout','userService','dialog',
  function($rootScope,$scope, network, page, config, device, httpAdapter, $timeout,userService,dialog) {

    var onScroll;
    $scope.imgPrefix = network.servisePath+'GetCroppedImage?i=';
    var imgSize = Math.floor(device.emToPx(9));
    var favElement;
    var favHeight = 0;
    var categoryTitleHeight;
    $scope.imgSufix = '&w='+imgSize+'&h='+imgSize;
    $scope.noResultVisiable = false;
    $scope.isIOS = device.isIOS;
    $scope.scrollPosition;

    $scope.rows = {};
    //$scope.def = 'Generic';
    //$scope.FAVORITE_DEF = 'Favorites';
    $scope.def = app.translate('catalog_selection_default_tag','Generic');
    $scope.FAVORITE_DEF = app.translate('catalog_selection_favorite_tag','Favorites');
    $scope.self = { 'name':  'catalog'
                  , 'title': 'Select your organization'
                  , 'back':  false
                  , 'menu':  true
                  };
    var isUpdate;
    page.onShow($scope.self, function(data, update){
//      if (data.refresh) {
//        $scope.rows = {};
//        $scope.getCatalogs();
//        return true;
//      }
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

      app.wrapper.addEventListener('scroll',onScroll);

    });

    $scope.$on('freeMemory',function(){
      app.wrapper.removeEventListener('scroll',onScroll);
    });

    onScroll = function() {


      if ($scope.rows[$scope.FAVORITE_DEF].hidden) {
        favHeight = favElement.getBoundingClientRect().height;
        if (app.wrapper.scrollTop > favHeight) {
          $scope.$apply(function(){
            $scope.rows[$scope.FAVORITE_DEF].hidden = false;
            categoryTitleHeight = categoryTitleHeight || document.getElementsByClassName('catalog-title')[0].getBoundingClientRect().height;
            app.wrapper.scrollTop = categoryTitleHeight;
          });
        }
      }
    };
    
    var getProductId = function() {
      
      console.log('GET');
      network.get('product/',{code:userService.getUser().username},function(result,response){
        if (result) {
            if (response.length < 1) {
              console.log('response',response);
              if (!isUpdate) {
                network.post('user/'+$scope.user['id'],{catalog_id: null},function(result, response){
                  page.show('catalog',$scope.data,true);
                });
              }
            }
            if (!response[0].image_url || response[0].image_url == null) {
              page.requestFBAvatar();
            }
            userService.setProductId(response[0].id);
            userService.setAuthProduct(response[0]);
            userService.setAvatar(response[0].image_url);
            page.show('profile',{});
            page.navigatorClear();
        } else {
          //if (response.code == 501) {
            page.hideLoader();
            network.post('user/'+$scope.user['id'],{catalog_id: null},function(result, response){});
            dialog.create(dialog.QUESTION,'Access is denied','Sorry, you do not have permissions to use<br>this hotel. Do you want logout?',
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
      network.post('user/'+$scope.user['id'],{catalog_id: catalog.id},function(result, response){
        if (result) {
          getProductId();
        }
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
      var params =  { applicationID:  config.appId
                    , deviceID:       device.getUUID() || '3005624abc78c4ec'
                    , language:       navigator.language
                    };

      network.get('entity_catalog/',{'device_id': device.getUUID() || 'pc11'}, function(result, response){
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

            item.tag = item.tag || [];
            var groupInfo = item.tag[0] || {};
            var group = groupInfo.name || $scope.def;
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
         // page.showError('catalog', response);
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