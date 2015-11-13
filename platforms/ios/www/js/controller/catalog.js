qaalog.controller('catalog', ['$rootScope','$scope','network', 'page', 'config', 'device', 'httpAdapter', '$timeout',
  function($rootScope,$scope, network, page, config, device, httpAdapter, $timeout) {

    device.setIsLoaded(true);
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
                  , 'title': 'Qaalog'
                  , 'back':  false
                  };
    page.onShow($scope.self, function(data, update){
      if (data.refresh) {
        $scope.rows = {};
        $scope.getCatalogs();
        return true;
      }
      page.hideLoader();
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
            categoryTitleHeight = categoryTitleHeight || document.getElementsByClassName('category-title')[0].getBoundingClientRect().height;
            app.wrapper.scrollTop = categoryTitleHeight;
          });
        }
      }
    };

    $scope.selectCatalog = function(catalog) {
      $scope.scrollPosition = app.wrapper.scrollTop;
      network.setCatalogDB(catalog.db);
      page.show('products',catalog);
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

    $scope.getCatalogs = function() {
      var params =  { applicationID:  config.appId
                    , deviceID:       device.getUUID() || '3005624abc78c4ec'
                    , language:       navigator.language
                    };
      network.get('GetCatalogs', params, function(result, response){
        if(result) {
          //var test = '[{"o":"Descontos até 30% em cartão","n":"QAS - Well\u0027s Christmas Catalogue","db":"Qaalog_Wells","d":"Exclusive online","info":"","i":"http://image.qas.qaalog.com/logos/wells.jpg","f":0,"t":[]}]';
          //var test = '[]';
          //test = JSON.parse(test);
          response = httpAdapter.convert(response);
          page.hideLoader();
          if (response.length === 0) {
            $scope.noResultVisiable = true;
            page.setCatalogTitleVisiable(false);
            return true;
          }

          if (response.length === 1) {
            response[0].canBackDisable = true;
            $scope.selectCatalog(response[0]);
            return false;
          }

          $scope.rows[$scope.FAVORITE_DEF] = {'name':$scope.FAVORITE_DEF, 'items':[], 'hidden':false, style:{}};
          angular.forEach(response, function(item) {
            var data =  { image:        item.image
                        , name:         item.name
                        , organisation: item.organisation
                        , description:  item.description
                        , db:           item.db
                        , favorite:     item.favorite
                        , info:         item.info
                        };
            var groupInfo = item.tag[0] || {};
            var group = groupInfo.name || $scope.def;
            $scope.rows[group] = $scope.rows[group] || {'name':group, 'items':[], 'hidden':false, style:{}};
            $scope.rows[group]['items'].push(data);

            if(item.favorite > 0) {
              $scope.rows[$scope.FAVORITE_DEF]['items'].push(data);
            }

          });

          var temp = $scope.rows[$scope.def];
          delete $scope.rows[$scope.def];
          $scope.rows[$scope.def] = temp;

        } else {
         // page.showError('catalog', response);
          $scope.noResultVisiable = true;
          page.setCatalogTitleVisiable(false);
          console.log("ERROR");
          return false;
        }

        if ($scope.rows[$scope.FAVORITE_DEF].items.length > 0) {
          $scope.rows[$scope.FAVORITE_DEF].hidden = true;
        }
      });
    };

    $scope.getCatalogs();
    var categoryHeight;
    $scope.$on('favRendered',function(){
      console.log('rendered');

    });

    var like = function(catalog) {
      catalog.favorite++;
      $scope.rows[$scope.FAVORITE_DEF]['items'].push(catalog);

      if ($scope.rows[$scope.FAVORITE_DEF]['items'].length > 1) {
        if ($scope.rows[$scope.FAVORITE_DEF].hidden) {
          favHeight = favElement.getBoundingClientRect().height;
          $scope.rows[$scope.FAVORITE_DEF].hidden = false;
          // app.wrapper.scrollTop = app.wrapper.scrollTop + (favHeight - 110);
        }
      } else {
        app.wrapper.scrollTop = 0;
        $scope.rows[$scope.FAVORITE_DEF].hidden = true;
      }
    };

    var unlike = function(catalog) {
      catalog.favorite--;
      for (var i in $scope.rows[$scope.FAVORITE_DEF]['items']) {
        var item = $scope.rows[$scope.FAVORITE_DEF]['items'][i];
        if (catalog.db === item.db) {
          $scope.rows[$scope.FAVORITE_DEF]['items'].splice(i,1);
          break;
        }
      }

      if ($scope.rows[$scope.FAVORITE_DEF]['items'].length < 1) {
        $scope.rows[$scope.FAVORITE_DEF]['hidden'] = false;
        categoryTitleHeight = categoryTitleHeight || document.getElementsByClassName('category-title')[0].getBoundingClientRect().height;
        app.wrapper.scrollTop = app.wrapper.scrollTop + categoryTitleHeight;
      }
    };

    $scope.addToFavorites = function(catalog,event) {
      favElement = document.getElementsByClassName('group')[0];
      event.stopPropagation();
      categoryHeight = categoryHeight || document.getElementsByClassName('category')[0].getBoundingClientRect().height;

      if (catalog.favorite < 1) {
        like(catalog);
        var action = 'like';
      } else {
        unlike(catalog);
        var action = 'unlike';
      }

      $rootScope.$broadcast('recalculateListHeight');
      var data = { catalogDB: catalog.db
                 , deviceID: device.getUUID() || 'asdqwe'
                 };
      network.get('ToggleCatalogFavorite', data, function(result, response){
        if (result) {
          console.log(response, response != 'true');
         if (response != 'true' && response != true) {
           $scope.rows = {};
           $scope.getCatalogs();
         }
        } else {
          if (action === 'like') unlike(catalog);
          if (action === 'unlike') like(catalog);
          //$scope.rows = {};
          //$scope.getCatalogs();
        }
      });
    };


    
}]);