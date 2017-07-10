tol.service('pager',['network','userService','page','device','$timeout','analytics','notification',
  function(network,userService,page,device,$timeout,analytics,notification){
 
  var $pager = this;
  
  var config = { limit: 10
/*
               , maxPages: 5
               , pagesToClean: 2
*/
               , screensToTrigger: 1.4 //Load older posts dependency!!!!
               , updateInterval: 20     //in seconds
               };
               
  $pager.config = config;

  var updateBuffer = [], scope, repeater, rootElement, backButton, pagerOptions, scrollPos, 
          firstItemDate = {}, lastItemDate = {}, stopped, container, topLoader, bottomLoader, 
          isContainerShifted, intervalId, updateBufferLength, loaderLock, pagerState = {},
          context, scrollHeight = {}, repaters = {};
  
  var requestFrame = window[app.requestFrame];
  var cancelFrame = window['cancelAnimationFrame'] || window['webkitCancelAnimationFrame'] || function(){};
  var transform = ('transform' in document.body.style) ? 'transform' : 'webkitTransform';
  var animate = ('transform' in document.body.style) ? 'transform .25s' : '-webkit-transform .25s';
  document.addEventListener('need_reset',onNeedReset);
  document.addEventListener('need_update',onNeedUpdate);
  
  function start(element, elRepeat, options) {
    stopped = false;
    
    init(element, elRepeat, options);

    if (!elRepeat.hasItems() || options.hardReset) {
      analytics.time('Feed refresh speed');
      getEarlier(false, function(items) {

        if (items.length < 1) {
          stop();
          page.hideLoader();
          page.toggleNoResults(true,'No result found.');
          return false;
        }
        
        firstItemDate[context] = items[0]['datetime_updated'];
        lastItemDate[context] = items[items.length-1]['datetime_updated'];

        if (options.hardReset) {
          elRepeat.clearAll();
          hideLoader();
          delete options.hardReset;
        }

        addToBottom(items);
        
        page.hideLoader();

        intervalId = setInterval(getUpdatedFeed, config.updateInterval*1000);

/*
        analytics.trackCustomMetric(analytics.POINTS_GIVEN, 0,function(){
          analytics.trackCustomMetric(analytics.POST_MADE, 0,function(){
            analytics.timeEnd('Feed refresh speed');
          });
        });
*/
      });
    } else {
      $timeout(function(){
        page.hideLoader();
      });
      intervalId = setInterval(getUpdatedFeed, config.updateInterval*1000);
      load();
    }
    
  };
  
  function stop(){
    stopped = true;
    
    if (repeater) {
      save();
    }
    
    destroyBackButton();
    
    updateBuffer = [];
    scope = false;
    backButton = false;
    
    if (container) {
      container.removeEventListener('touchmove',calculate);
      container.removeEventListener('touchend',releaseLoaderLock);
      container.style.transition = '';
      document.getElementById(pagerOptions.loaderSelector || 'feed_loader').style.display = 'none';
      if (device.isIOS()) {
        app.wrapper.removeEventListener('scroll', iOSOnScrollHack);
      }
    }
    
    
    
    if (intervalId) clearInterval(intervalId);

  };
    /**
     * Pager works in context scope
     * context can be feed, profile and postDetails (in current app scope).
     *
     * @param element
     * @param elRepeat
       * @param options
       */
  function init(element, elRepeat, options) {
    pagerOptions = options;
    rootElement = element;
    repeater = elRepeat;
    window.repeater = repeater;
    context = options.context || 'noContext';
    
    repaters[context] = repeater;
    
    updateBufferLength = 0;//Buffer for updated info - every 20 sec we request the server for changes. We set BufferLength to zero on start
    
    element = angular.element(element);
    scope = element.scope();
    
    container = document.getElementById(options.containerSelector);
    topLoader = document.getElementById(options.topLoaderSelector);
    bottomLoader = document.getElementById(options.loaderSelector || 'feed_loader');
    
    container.style.transition = animate;
    if (device.isIOS()) {
      app.wrapper.addEventListener('scroll', iOSOnScrollHack);
    }
    //container.removeEventListener('touchmove',calculate);
    container.addEventListener('touchmove',calculate);
    container.addEventListener('touchend',releaseLoaderLock);
  }
  
  function iOSOnScrollHack(event) {
    if (app.wrapper.scrollTop < 0 && !isContainerShifted && !loaderLock) {
      showLoader(true);
      setTimeout(function() {
        reset();
      }, 300);
    }
  }
  
  function onNeedReset(event) {
    console.log('>>>> onNeedReset');
    stop();
    if (!event.pagerKey) {
      for (var key in repaters) {
        console.log('PAGER ' + key + ' UPDATED');
        repaters[key].clearAll();
        pagerState[key] = 0;
        delete repaters[key];
      }
      repaters = {};
    } else {
      if (repaters[event.pagerKey]) {
        console.log('SINGLE PAGER ' + event.pagerKey + ' UPDATED');
        repaters[event.pagerKey].clearAll();
        pagerState[event.pagerKey] = 0;
        delete repaters[event.pagerKey];
      }
    }
  }
  
  function onNeedUpdate(event) {
    console.log('>>>> onNeedUpdate');
    getUpdatedFeed();
  }
  
  function save() {
    if (page.currentPage !== context) return false;
    pagerState[context] = { scrollOffset: app.wrapper.scrollTop
                          , itemsCount: repeater.getAllItems().length
                          };
  }
  
  function load() {
    setTimeout(function(){
      pagerState[context] = pagerState[context] || {};
      app.wrapper.scrollTop = pagerState[context].scrollOffset || 0;
    });
  }
  
  $pager.save = save;
  $pager.load = load;
  
  function reset() {
    stop();
    pagerOptions.hardReset = true;
    start(rootElement, repeater, pagerOptions);
  }
  
  var calculateFlag = {};
  var timeoutId;
  
  function calculate(event) {
      if (scrollPos > app.wrapper.scrollTop) {//show button if new post has been posted somebody
        showBackButton();
      }

      if (scrollPos < app.wrapper.scrollTop) {//hide new post button on scroll down
        hideBackButton();
      }

      refresh(event);


      scrollPos = app.wrapper.scrollTop;
      scrollHeight['feed'] = app.wrapper.scrollHeight;
      if (scrollPos >= scrollHeight[context] - (innerHeight*config.screensToTrigger) && !calculateFlag[context]) {
        calculateFlag[context] = true;
        showLoader();
        getOlder(lastItemDate[context], function(items) {
          addToBottom(items);
          hideLoader();
        });
        return false;
      } 

      if (scrollPos < scrollHeight[context] - (innerHeight*config.screensToTrigger)) {
        calculateFlag[context] = false;
      }
      setTimeout(wait,200);
  }
  
  
  function wait() {  // this function deny fast touch until scroll does not stopped.
    if (scrollPos === app.wrapper.scrollTop) {
      setTimeout(function(){
        scrollBlock = false;
      },500);
      return false;
    }
    
    scrollBlock = true;
    scrollPos = app.wrapper.scrollTop;
    requestFrame(wait);
  }
  
  var coord = {x: -1, y: 10000, scrollTop: -1};
  
  function refresh(event) {
    if (coord.scrollTop === app.wrapper.scrollTop && app.wrapper.scrollTop === app.wrapper.scrollHeight - innerHeight 
            && !isContainerShifted && !loaderLock) {
      showLoader();
      loaderLock = true;
      getOlder(lastItemDate[context], function(items){
        addToBottom(items);
        hideLoader();
      });
    }
    
    if (app.wrapper.scrollTop === 0 && coord.y < event.touches[0].clientY && !isContainerShifted && !loaderLock) {
      showLoader(true);
      //loaderLock = true;
      //getUpdatedFeed();
      setTimeout(function() {
        reset();
      }, 300);
      
    }
    
    coord.scrollTop = app.wrapper.scrollTop;
    coord.y = event.touches[0].clientY;
  }
  
  function releaseLoaderLock() {
    loaderLock = false;
    coord.y = 10000;
  }
  
  function addToBottom(buffer) {
    if (stopped) return false;
    repeater.append(buffer);
    
    if (buffer.length < 1) stopped = true;
    
    repeater.addCompileListener('addToBottom',function() {
      var items = repeater.getAllItems();
      //bottomTrigger = items[items.length - config.bottomTrigger][0];
      scrollHeight[context] = app.wrapper.scrollHeight;
      
//      if (device.isIOS()) {
//        var share = document.getElementsByClassName('fb-share');
//        for (var i = 0, l = share.length; i < l; i++) {
//          share[i].addEventListener('touchend', function(event) {
//            if (app.focusStop || !app.tempCoord) return false;
//            var coord = {x: event.changedTouches[0].pageX, y: event.changedTouches[0].pageY};
//            if (coord.x !== app.tempCoord.x || coord.y !== app.tempCoord.y) return false;
//
//            document.getElementById('fb_message').focus();
//            delete app.tempCoord;
//          });
//          share[i].addEventListener('touchmove', function() {
//            app.focusStop = true;
//          });
//          share[i].addEventListener('touchstart', function(event) {
//            app.tempCoord = {x: event.touches[0].pageX, y: event.touches[0].pageY};
//            app.focusStop = false;
//          });
//        }
//      }
    });
    
  }
  
  function getUpdatedFeed() {
    getEarlier(firstItemDate[context], function(items) {
      updateBuffer = items;
      
      if (updateBuffer.length > 0 && updateBufferLength !== updateBuffer.length) {
        firstItemDate[context] = updateBuffer[0]['datetime_updated'];
        repaters[context].update(updateBuffer);
        console.log(updateBuffer);
        if (updateBuffer.length > 0) {
//          if (app.wrapper.scrollTop !== 0) {
          if (!backButton) createBackButton()
          else showBackButton();
//          } else {
//            gotoBack();
//          }
        }
      }
      
      updateBufferLength = updateBuffer.length;
      hideLoader();
    });
  }
  
  function getOlder(date, callback) {
    var data = {limit: config.limit};
    if (date) {
        data['from_date'] = date;
      }
    var path = 'post/getOlder?my_product_id='+userService.getProductId();
    
    if (pagerOptions['for_product_id']) {
     // data['for_product_id'] = pagerOptions['for_product_id'];
      path+= '&for_product_id='+pagerOptions['for_product_id'];
    }
    network.post(path,data,function(result,response){
      if (result) {
       if (response.length > 0) lastItemDate[context] = response[response.length-1]['datetime_updated'];
       callback(response);
      }

    });

//        getTestObjects(config.limit,function(result,response){
//          if (result) {
//            callback(response);
//          }
//        });
  };
  
  function getEarlier(date, callback) {
     var data = {limit: config.limit};
      if (date) {
        data['from_date'] = date;
      }
      var path = 'post/getEarlier?my_product_id='+userService.getProductId();
      
      if (pagerOptions['for_product_id']) {
        //data['for_product_id'] = pagerOptions['for_product_id'];
        path += '&for_product_id=' + pagerOptions['for_product_id'];
      }
      
      network.post(path,data,function(result,response){

        if (result) {
          callback(response);
        }

      });

//      page.hideLoader();
//      getTestObjects(config.limit,function(result,response){
//          if (result) {
//            
//            callback(response);
//          }
//        });
  };
  
  function gotoBack() {
    page.showLoader();
    repeater.clearAll();
    $pager.stop();
    setTimeout(function(){
      $pager.start(rootElement, repeater, pagerOptions);
    },300);
  }
  
  var link = {
    'gotoBack': gotoBack
  };
  
  function createBackButton() {
    backButton = document.createElement('div');
    backButton.className = 'back-button';
    backButton.setAttribute('data-touch','gotoBack()');
    repeater.compileElement(backButton, link);
    document.body.appendChild(backButton);
    showBackButton();
  }
  
  function showBackButton() {
    if (!backButton) return false;
    if (backButton.style.opacity === '1') return false;
    if (updateBuffer.length > 0) {
      backButton.innerHTML = 'Show '+ updateBuffer.length + ((updateBuffer.length > 1) ? ' new posts' : ' new post');
    } else {
      backButton.innerHTML = 'Back to the top';
    }
    setTimeout(function(){
      if (backButton && backButton.style){
        backButton.style.opacity = '1';
      }
    },1000);
  }
  
  function hideBackButton() {
    if (!backButton) return false;
    if (!backButton.style.opacity) return false;
    backButton.style.opacity = '';
  }
  
  function destroyBackButton() {
    if (backButton) {
      document.body.removeChild(backButton);
      backButton = null;
    }
  }
  
  function showLoader(isUp) {
    isContainerShifted = true;
    if (isUp) {
      container.style.transition = '';
      container.style[transform] = 'translate3d(0,-'+device.emToPx(4)+'px,0)';
      topLoader.style.display = '';
      setTimeout(function(){
        container.style.transition = animate;
        container.style[transform] = 'translate3d(0,0,0)';
      },100);
    } else {
      container.style[transform] = 'translate3d(0,'+device.emToPx(8)+'px,0)';
      bottomLoader.style.display = '';
      setTimeout(function(){
        container.style.transition = animate;
        container.style[transform] = '';
      },100);
    }
  }
  
  function hideLoader() {
    container.style.transition = '';
    container.style[transform] = '';
    topLoader.style.display = 'none';
    bottomLoader.style.display = 'none';
    setTimeout(function(){
      container.style.transition = animate;
      isContainerShifted = false;
    },100);
  }
  
  function updatePoints() {
    var items = repeater.getAllItems();
    var linkName = Object.keys(items[0])[1];
    for (var i = 0, l = items.length; i < l; i++) {
      var item = items[i];
      for (var n = 0, ln = updateBuffer.length; n < ln; n++) {
        var newItem = updateBuffer[n];
        if (item[linkName].id === newItem.id && item[linkName].points*1 !== newItem.points*1) {
          var element = item[0];
/*
          newItem.points = newItem.points || 0;
          element.querySelector('.points strong').innerHTML = newItem.points + ( (newItem.points != 1) ? ' points' : ' point' );
*/
          newItem.points = newItem.points || 0;
          newItem.point_givers = newItem.point_givers || '';
          element.querySelector('.points strong').innerHTML = newItem.point_givers;
          break;
        }
      }
    }
  }
  
  /* EXPORTS */
  $pager.start = start;
  $pager.stop = stop;
  $pager.config = config;
  
  
  /* TESTING */
  var testImgArray = [
    'https://teamoutloud.blob.core.windows.net/crystalho1crystalcy4/posts/image23.jpeg'
    ,'https://teamoutloud.blob.core.windows.net/crystalho1crystalcy4/posts/image13.jpeg'
    ,'https://teamoutloud.blob.core.windows.net/crystalho1crystalcy4/posts/image12.jpeg'
    ,'https://teamoutloud.blob.core.windows.net/crystalho1crystalcy4/posts/image11.jpeg'
    ,'https://teamoutloud.blob.core.windows.net/crystalho1crystalcy4/posts/image33.jpeg'
  ];
  
  var testObject = {
    age_days: "11"
    ,age_minutes: "15979"
    ,datetime_published: "2015-10-28 13:06:50.660"
    ,datetime_updated: "2015-10-28 13:06:51.923"
    ,deleted: null
    ,from_product_id: null
    ,from_product_image: null
    ,from_product_name: null
    ,id: "5"
    ,media_url: "https://teamoutloud.blob.core.windows.net/crystalho1crystalcy4/posts/image5.png"
    ,message: "I have to say it"
    ,points: "15"
    ,post_type_id: "1"
    ,rowid: "5"
    ,to_product_id: null
    ,to_product_image: null
    ,to_product_name: null
  };
  
  aa = {
    age_days: "11"
    ,age_minutes: "15979"
    ,datetime_published: "2015-10-28 13:06:50.660"
    ,datetime_updated: "2015-10-28 13:06:51.923"
    ,deleted: null
    ,from_product_id: 8
    ,from_product_image: 'https://teamoutloud.blob.core.windows.net/crystalho1crystalcy4/product_media/image12.jpeg'
    ,from_product_name: null
    ,id: "5"
    ,media_url: "https://teamoutloud.blob.core.windows.net/crystalho1crystalcy4/posts/image5.png"
    ,message: "I have to say it"
    ,points: "15"
    ,post_type_id: "1"
    ,rowid: "5"
    ,to_product_id: null
    ,to_product_image: null
    ,to_product_name: null
  };;
  
  var testSeek = 0;
  
  function getTestObjects(count,callback) {
    var result = [];
    for (var i = 0; i < count; i++) {
      var obj = JSON.stringify(testObject);
      obj = JSON.parse(obj);
      obj.id = testSeek;
      obj.message += ' - '+testSeek;
      obj.media_url = testImgArray[testSeek%5];
      result.push(obj);
      testSeek++;
    }
    
    setTimeout(function(){
      callback(true, result);
    },347);
  }

}]);