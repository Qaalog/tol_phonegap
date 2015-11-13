qaalog.controller('menu',['$scope','page','menu','share','device','$timeout',function($scope,page,menu,share,device,$timeout){
    
    var closeMenu;
    $scope.STYLE_LIST = 1;
    $scope.STYLE_GRID = 0;
    $scope.isIOS = device.isIOS;
    $scope.listStyle = $scope.STYLE_GRID;
    $scope.sortSelected = 'A';

    $scope.translate = { sortAZ:        app.translate('menu_sort_asc_title','Sort A-Z')
                       , sortZA:        app.translate('menu_sort_desc_title','Sort Z-A')
                       , favorites:     app.translate('menu_favorites','Favorites')
                       , listView:      app.translate('menu_list_view','List view')
                       , galleryView:   app.translate('menu_gallery_view','Gallery view')
                       , catalogInfo:   app.translate('menu_catalog_info','Catalog information')
                       , changeCatalog: app.translate('menu_change_catalog','Change catalog')
                       , share:         app.translate('menu_share','Share')
                       };
    
    var settings = { name: 'menu'
                   , title: 'menu'
                   , back: true
                   };
    page.onShow(settings,function(params) {
      page.setTitle(params.title);
      $scope.menuType = params.menuType || 'main';
      page.hideLoader();
      $scope.catalogInfoAvailable = (menu.getParams().info && menu.getParams().info !== '');
    });

  menu.setShareShow = function(value) {
    $scope.isShareShow = value;
  };
    
    
    $scope.showCatalogInfo = function(outside) {
      var params = menu.getParams();
      if (params.info && params.info !== '') {
        page.show('catalogInfo', params);
        if (!outside) page.navigatorPop();
      }
    };

    menu.showCatalogInfo = $scope.showCatalogInfo;
    
    $scope.toggleViewStyle = function(style) {
      $scope.listStyle = style;
      menu.onChangeViewStyle(style);
      closeMenu();
    };
    
    $scope.showFavorites = function() {
      var data = { params: menu.getParams()
                 , item: {listName: app.translate('menu_favorites')}
                 };
      page.show('browseProduct',data);
      page.navigatorPop();
    };
    
    $scope.sort = function(type) {
      $scope.sortSelected = type;
      menu.sort(type);
      closeMenu();
    };
    
    $scope.changeCatalog = function() {
      page.show('catalog',{refresh: true});
      $timeout(function(){
        page.navigatorPop();
      });
    };

    $scope.share = function() {
      share.exec();
    };


    closeMenu = function() {
      page.goBack();
    };
    
    menu.setIsSortable = function(isSortable){
      $scope.isSortable = isSortable;
    };
    
    menu.setListViewChangeEnabled = function(listViewChangeEnabled){
      $scope.listViewChangeEnabled = listViewChangeEnabled;
    };

    menu.hideChangeCatalog = function() {
      $scope.hideChangeCatalog = true;
    };
    
}]);

