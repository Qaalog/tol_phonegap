aa = '';
tol.service('pager1',['network','userService','page','device',function(network,userService,page,device){
 
  var $pager = this;
  
  var config = { limit: 10
               , maxPages: 5
               , pagesToClean: 2
               , screensToEndBorder: 2
               , screensToStartBorder: 1
               , updateInterval: 20     //in seconds
               };
  
  var topBuffer = [], bottomBuffer = [], updateBuffer, scope, maxScrollHeight, scrollPos, lastItemId, firstItemDate, lastItemDate, firstItemId, 
  stopped, bottomBorder, rootElement, repeater, length = 0, backButton, intervalId, container, isContainerShifted, loaderSelector, 
  containerSelector, currentOptions, olderRequested, topLoader;
  
  var requestFrame = window['requestAnimationFrame'] || window['webkitRequestAnimationFrame'];
  var cancelFrame = window['cancelAnimationFrame'] || window['webkitCancelAnimationFrame'] || function(){};
  var transform = ('transform' in document.body.style) ? 'transform' : 'webkitTransform';
  var animate = ('transform' in document.body.style) ? 'transform .25s' : '-webkit-transform .25s';
  
  function start(element, elRepeat, options) {
    stopped = false;
    currentOptions = options;
    loaderSelector = options.loaderSelector;
    var topLoaderSelector = options.topLoaderSelector;
    containerSelector = options.containerSelector;
    container = document.getElementById(containerSelector);
    topLoader = document.getElementById(topLoaderSelector);
    container.style.transition = animate;
    repeater = elRepeat;
    rootElement = element;
    element = angular.element(element);
    scope = element.scope();
    container.addEventListener('touchmove',refresh);
    container.addEventListener('touchend',releaseLoaderLock);
    
    getEarlier(false,function(posts){
      if (posts.length < 1) {
        stop();
        page.hideLoader();
        page.toggleNoResults(true,'No result found.');
        return false;
      }
      
      firstItemId = posts[0].id;
      firstItemDate = posts[0]['datetime_updated'];
      lastItemDate = posts[posts.length-1]['datetime_updated'];
      bottomBuffer = posts;
      apply(bottomBuffer, true);
      document.getElementById(loaderSelector || 'feed_loader').style.display = '';
      if (options.callback) options.callback();
      setTimeout(function(){
        calculate();
      },500);
    });
    
    //intervalId = setInterval(getUpdatedFeed, config.updateInterval*1000);
    
  };
  
  function stop(){
    console.log('stop');
   stopped = true;
   if (container) {
     container.removeEventListener('touchmove',refresh);
     container.removeEventListener('touchend',releaseLoaderLock);
     container.style.transition = '';
   }
   document.getElementById(loaderSelector || 'feed_loader').style.display = 'none';
   if (intervalId) clearInterval(intervalId);
   //if (repeater) repeater.clearAll();
   length = 0;
   updateBuffer = false;
   destroyBackButton();
  };
  
  function getUpdatedFeed() {
    firstItemId = repeater.getItem(0).id;
    
    getEarlier(firstItemDate, function(posts) {
       
       if (app.wrapper.scrollTop < innerHeight) hideLoader();
       updateBuffer = posts;
       
       if (updateBuffer.length > 0) {
        if (app.wrapper.scrollTop !== 0) {
          if (!backButton) createBackButton();
          showBackButton();
          updatePoints();
        } else {
          //repeater.insert(0, updateBuffer);
          gotoBack();
          //firstItemDate = repeater.getItem(0)['datetime_updated'];
        }
             
       }
    });
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
          newItem.points = newItem.points || 0;
          element.querySelector('.points strong').innerHTML = newItem.points + ( (newItem.points != 1) ? ' points' : ' point' );
          break;
        }
      }
    }
  }
  
  var coord = {x: -1, y: 10000, scrollTop: -1};
  var loaderLock = false;
  function refresh(event) {
    
    if (coord.scrollTop === app.wrapper.scrollTop && !isContainerShifted && !loaderLock && 
            app.wrapper.scrollTop === app.wrapper.scrollHeight - innerHeight) {
      
      loaderLock = true;
      coord = {x: -1, y: 10000, scrollTop: -1};
      showLoader();
      addToBottom();
      return false;
      
    }

    if (app.wrapper.scrollTop === 0 && !isContainerShifted && coord.y < event.touches[0].clientY && !loaderLock) {
      loaderLock = true;
      showLoader(true);
      getUpdatedFeed();
      setTimeout(function(){
        hideLoader();
      }, 2000);
      return false;
    }
    
    coord.scrollTop = app.wrapper.scrollTop;
    coord.y = event.touches[0].clientY;
  }
  
  function releaseLoaderLock() {
    loaderLock = false;
    coord.y = 10000;
  }
  
  function showLoader(isUp) {
    isContainerShifted = true;
    if (isUp) {
      container.style.transition = '';
      container.style[transform] = 'translate3d(0,-'+device.emToPx(4)+'px,0)';
      topLoader.style.display = '';
      setTimeout(function(){
        container.style.transition = animate;
        container.style[transform] = 'translate3d(0,3em,0)';
      },100);
    } else {
      container.style[transform] = 'translate3d(0,-7em,0)';
    }
  }
  
  function hideLoader() {
    console.log('hideLoader');
    container.style.transition = '';
    container.style[transform] = '';
    topLoader.style.display = 'none';
    isContainerShifted = false;
    setTimeout(function(){
      container.style.transition = animate;
    },100);
  }
  
  
  function getOlder(date, callback) {
    var data = {limit: config.limit};
    if (date) {
        data['from_date'] = date;
      }
    if (currentOptions['from_product_id']) data['from_product_id'] = currentOptions['from_product_id'];
    network.post('post/getOlder?my_product_id='+userService.getProductId(),data,function(result,response){
      hideLoader();
      if (result) {
       if (response.length > 0) lastItemDate = response[response.length-1]['datetime_updated'];
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
      if (currentOptions['from_product_id']) data['from_product_id'] = currentOptions['from_product_id'];
      network.post('post/getEarlier?my_product_id='+userService.getProductId(),data,function(result,response){

        if (result) {
          callback(response);
        }

      });
      console.log('getEarlier');
        
//      page.hideLoader();
//      getTestObjects(config.limit,function(result,response){
//          if (result) {
//            
//            callback(response);
//          }
//        });
  };
  
  var bottomLock = false;
  function addToBottom() {
          wait();
    olderRequested = true;
    console.log('add to bottom');
    if (!bottomLock) {
      bottomLock = true;
      getOlder(lastItemDate,function(posts){
        olderRequested = false;
        bottomBuffer = bottomBuffer.concat(posts);
        apply(bottomBuffer);
        //if (posts.length === config.limit)
        bottomLock = false;
      });
    }
  }
  
  var topLock = false;
  
  function addToTop() {
    console.log('add To Top');
    if (!topLock) {
      topLock = true;
      var height = 0;
      var start = topBuffer.length - config.limit;
      for (var i = start, l = topBuffer.length; i < l; i++) {
        height += topBuffer[i].$elementHeight;
      }
      var buf = topBuffer.splice(start, config.limit);
      repeater.insert(0,buf);
      app.wrapper.scrollTop = app.wrapper.scrollTop + height;
      length += buf.length;
      console.log('length:',length);
      wait();
      
      setTimeout(function(){
        topLock = false;
      },200);
    }
  }
  
  function freeTopElements() {
    console.log('freeTopElements');
    var height = repeater.getHeight(0, config.limit * config.pagesToClean);
    app.wrapper.scrollTop = app.wrapper.scrollTop - height;
    var removed = repeater.remove(0, config.limit * config.pagesToClean);
    updateBuffer = [];
    createBackButton();
    //topBuffer = topBuffer.concat(removed);
    length -= config.limit * config.pagesToClean;
    console.log('free top elements', length);
  }
  
  function freeBottomElements() {
    console.log('freeBottomElements');
    var removed = repeater.remove(length - config.limit * config.pagesToClean, length);
    length -= config.limit * config.pagesToClean;
    console.log(removed);
  }
  
  function gotoBack() {
    console.log('gotoBack');
    hideLoader();
    stop();
    start(rootElement, repeater, currentOptions);
  }
  
  var link = {
    'gotoBack': gotoBack
  };
  
  function createBackButton() {
    backButton = document.createElement('div');
    backButton.className = 'back-button';
    backButton.setAttribute('data-touch','gotoBack()');
    repeater.compileElement(backButton, link);
    document.getElementsByClassName('header')[0].appendChild(backButton);
    showBackButton();
  }
  
  function showBackButton() {
    if (!backButton) return false;
    if (backButton.style.opacity === '1') return false;
    if (updateBuffer.length > 0) {
      backButton.innerHTML = 'Show new '+ updateBuffer.length +' posts';
    } else {
      backButton.innerHTML = 'Back to the top';
    }
    setTimeout(function(){
      backButton.style.opacity = '1';
    },300);
  }
  
  function hideBackButton() {
    if (!backButton) return false;
    if (!backButton.style.opacity) return false;
    backButton.style.opacity = '';
  }
  
  function destroyBackButton() {
    if (backButton) {
      document.getElementsByClassName('header')[0].removeChild(backButton);
      backButton = null;
    }
  }
  
  function getBottomOffset() {
   return app.wrapper.scrollHeight- (innerHeight * config.screensToEndBorder);
  }
  
  function getTopOffset() {
    return innerHeight / 2;
  }
  
  
  var waitId;
  function wait() {
    if (stopped) {
      if (waitId) cancelFrame(waitId);
      return false;
    }
    //console.log('wait');
    if (app.wrapper.scrollTop === app.wrapper.scrollHeight - innerHeight && olderRequested) showLoader();
    if (app.wrapper.scrollTop < getBottomOffset() && app.wrapper.scrollTop > getTopOffset()) {
      requestFrame(calculate);
      return false;
    }

    waitId = requestFrame(wait);
  }
  
  var calculateId;
  function calculate() {
    if (stopped) {
      if (calculateId) cancelFrame(calculateId);
      return false;
    }
    //repeater.testImages();
    //console.log('calculate');
    if (scrollPos > app.wrapper.scrollTop) {
      showBackButton();
    }
    
    if (scrollPos < app.wrapper.scrollTop) {
      hideBackButton();
    }
    
    maxScrollHeight = app.wrapper.scrollHeight;
    scrollPos = app.wrapper.scrollTop;
    
    if (scrollPos > getBottomOffset() && scrollPos > innerHeight) {
      
      if (calculateId) cancelFrame(calculateId);
      
      if (length >= config.limit * config.maxPages) {
        freeTopElements();
      }
      
      addToBottom();
      
      return false;
    }

//    if (scrollPos < getTopOffset() && updateBuffer) {
//      if (calculateId) cancelFrame(calculateId);
//
//      createBackButton();
//      return false;
//    }
   
    calculateId = requestFrame(calculate);
  }
  
  function apply(buffer, start) {
    console.log('apply');
    if (buffer.length < 1) {
      //wait();
      return false;
    }
    
    bottomBorder = 0;
    var buf = buffer.splice(0, config.limit);
    repeater.append(buf);
    lastItemId = buf[buf.length-1].id;
    length += buf.length;
    console.log('length:',length);
    //if (!start) wait();
  };
  
  /* EXPORTS */
  $pager.start = start;
  $pager.stop = stop;
  $pager.config = config;
  
  
  /* TESTING */
  var testImgArray = [
    'https://teamoutloud.blob.core.windows.net/crystalho1crystalcy4/posts/image23.jpeg',
    'https://teamoutloud.blob.core.windows.net/crystalho1crystalcy4/posts/image13.jpeg',
    'https://teamoutloud.blob.core.windows.net/crystalho1crystalcy4/posts/image12.jpeg',
    'https://teamoutloud.blob.core.windows.net/crystalho1crystalcy4/posts/image11.jpeg',
    'https://teamoutloud.blob.core.windows.net/crystalho1crystalcy4/posts/image33.jpeg'
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
    console.log('getTestObjects');
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