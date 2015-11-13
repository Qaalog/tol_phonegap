qaalog.service('menu',[function(){
    var $menu = this;
    var currentParams;
    
    $menu.sort = function(){};
    $menu.onChangeViewStyle = function(){};
    $menu.setIsSortable = function(){};
    $menu.setListViewChangeEnabled = function(){};
    $menu.hideChangeCatalog = function(){};
    $menu.showCatalogInfo = function() {};
    $menu.setShareShow = function(){};
    
    $menu.setParams = function(params) {
      currentParams = params;
    };
    
    $menu.getParams = function() {
       return currentParams;
    };
    
    
   
}]);

