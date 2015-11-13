qaalog.service('page',['config',function(config){
  var $page = this;
  
  $page.show = function(){};
  
  $page.pages = {};
  $page.pageParams = {};
  $page.applyParams = function(){};
  $page.setTitle = function(){};
  $page.showLoader = function(){};
  $page.hideLoader = function(){};
  $page.showNoResult = function(){};
  $page.hideNoResult = function(){};
  $page.onTabChange = function(){};
  $page.setTab = function(){};
  $page.setTabs = function(){};
  $page.setGroupTitle = function(){};
  $page.setExtendedImage = function(){};
  $page.hideExtendedHeader = function(){};
  $page.showExtendedHeader = function(){};
  $page.toggleSearchIcon = function(){};
  $page.toggleShareIcon = function(){};
  $page.stopSwipeHeader = function(){};
  $page.startSwipeHeader = function(){};
  $page.tryExtendedHeader = function(){};
  $page.resetHeaderTop = function(){};
  $page.pauseSwipeHeader = function(){};
  $page.playSwipeHeader = function(){};
  $page.setNoResultText = function(){};
  $page.setCatalogTitleVisiable = function(){};
  $page.hideMenu = function(){};
  $page.hideSearch = function(){};
  $page.hideBackBtn = function(){};
  $page.setResultsTitle = function(){};
  $page.setTabsVisiable = function(){};
  $page.setAnimationStyle = function(){};
  $page.setHeaderVisiable = function(){};
  $page.setPageScrollable = function(){};
  $page.setStatusbarHidden = function(){};
  $page.setOnNoResultClick = function(){};
  $page.currentPage = config.startPage;
  $page.currentParams = {};
  var pageNavigator = [];
  var headerHeight;
  
  $page.addToCurrentParams = function(params) {
    for (var key in params) {
      var value = params[key];
      $page.currentParams[key] = value;
    }
  };
  
  $page.getHeaderHeight = function() {
    return headerHeight;
  };
  
  $page.setHeaderHeight = function(height) {
    headerHeight = height;
  };

  $page.getPageNavigatorLength = function() {
    return pageNavigator.length;
  };
  
  $page.navigatorPush = function(func) {
    console.log('PUSH',pageNavigator);
    //$page.currentParams.scrollPosition = window.pageYOffset;
    if (typeof func === 'function') {
      pageNavigator.push({name:$page.currentPage, params: $page.currentParams, callback: func});
      return false;
    }
    console.log($page.currentParams);
    pageNavigator.push({name:$page.currentPage,params: $page.currentParams}); 
  };
  
  $page.navigatorPop = function() {
    return pageNavigator.pop();
  };
  
  $page.navigatorClear = function() {
    console.log('CLEAR NAVIGATOR');
    pageNavigator = [];
  };
  
  $page.goBack = function(){};
  
  $page.onShow = function(params,callback){
    $page.pages[params.name] = callback;
    $page.pageParams[params.name] = params;
  };
  
  $page.runOnShow = function(pageId,params,isBack) {
    var callback = $page.pages[pageId] || function(){};
    $page.currentPage = pageId;
    $page.currentParams = params;
    $page.applyParams($page.pageParams[pageId],isBack);
    callback(params);
  };
  
}]);

