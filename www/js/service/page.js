tol.service('page',['config',function(config){
  var $page = this;
  
  $page.show = function(){};
  
  $page.pages = {};
  $page.pageParams = {};
  $page.pageRequestResults = {};
  $page.applyParams = function(){};
  $page.setTitle = function(){};
  $page.showLoader = function(){};
  $page.hideLoader = function(){};
  $page.onTabChange = function(){};
  $page.toggleSearchIcon = function(){};
  $page.setTabsVisiable = function(){};
  $page.setPageScrollable = function(){};

  /* NEW */
  $page.setProfileTab = function(){};
  $page.onProfileTabChange = function(){};
  $page.setActiveTabView = function(){};
  $page.showForResult = function(){};
  $page.onResult = function(){};
  $page.addProfileTab = function(){};
  $page.removeProfileTab = function(){};
  $page.requestFBAvatar = function(){};
  $page.onProfileShow = function(){};
  $page.getActiveTabView = function(){};
  $page.changePageSettings = function(){};
  /* END NEW*/
  
  $page.currentPage = config.startPage;
  $page.currentParams = {};
  var pageNavigator = [];
  
  $page.addToCurrentParams = function(params) {
    for (var key in params) {
      var value = params[key];
      $page.currentParams[key] = value;
    }
  };

  $page.getPageNavigatorLength = function() {
    return pageNavigator.length;
  };
  
  $page.navigatorPush = function(func) {
    if (typeof func === 'function') {
      pageNavigator.push({name:$page.currentPage, params: $page.currentParams, callback: func});
      return false;
    }
    pageNavigator.push({name:$page.currentPage,params: $page.currentParams}); 
  };
  
  $page.navigatorPop = function() {
    return pageNavigator.pop();
  };
  
  $page.navigatorClear = function() {
    pageNavigator = [];
  };
  
  $page.goBack = function(){};
  
  var loadedPagesCount = 0;
  var pagesCount = document.getElementsByClassName('page_section').length;
  $page.onShow = function(params,callback){
    loadedPagesCount++;
    $page.pages[params.name] = callback;
    $page.pageParams[params.name] = params;
    if (pagesCount === loadedPagesCount) {
      var event = document.createEvent('Event');
      event.initEvent('pages_ready', true, true);
      document.dispatchEvent(event);
    }
  };
  
  $page.onRequestResult = function(params,requestCallback) {
    requestCallback = requestCallback || function(){};
    $page.pageRequestResults[params.name] = requestCallback;
  };
  
  $page.runOnShow = function(pageId,params,isBack) {
    var callback = $page.pages[pageId] || function(){};
    $page.currentPage = pageId;
    $page.currentParams = params;
    $page.applyParams($page.pageParams[pageId],isBack);
    callback(params);
  };
  
  $page.getPostAge = function(feedItem) {
    if (!feedItem) return false;
    if (feedItem.age_days > 0) {
      
      if (feedItem.age_days == 1) {
        return '1 day ago';
      }
      return feedItem.age_days + ' days ago';
      
    } else {
      
      if (feedItem.age_minutes < 1) {
        return 'less than minute ago';
      }
      if (feedItem.age_minutes == 1) {
        return '1 minute ago';
      }
      
      if (feedItem.age_minutes > 59) {
        var hours = Math.floor(feedItem.age_minutes / 60);
        if (hours === 1) return '1 hour ago';
        return hours + ' hours ago';
      }
      
      return feedItem.age_minutes + ' minutes ago';
      
    }
    
  };
  
  $page.toggleCheckBox = function(event) {
    var element = (event.target.className.indexOf('switcher') >= 0) ? event.target.parentElement : event.target;
    var switcher = (event.target.className.indexOf('switcher') >= 0) ? event.target : element.querySelector('.switcher');
    if (element.className.indexOf('checked') >= 0) {
      app.animate(switcher,250);
      element.className = element.className.replace(' checked','');
      return false;
    } else {
      app.animate(switcher,250);
      element.className += ' checked';
      return true;
    }
  };
  
  $page.setCheckBox = function(id,state) {
    var element = document.getElementById(id);
    if (state) {
      element.className += ' checked';
    } else {
      element.className = element.className.replace(' checked','');
    }
    
  };
  
}]);

