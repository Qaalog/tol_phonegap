tol.service('pagerItera',['network','userService','page','device','$timeout',
  function(network,userService,page,device,$timeout){
 
  var $pager = this;
  
  var config = { limit: 10
               , maxPages: 5
               , pagesToClean: 2
               , screensToTrigger: 1
               , updateInterval: 10     //in seconds
               };
               
  $pager.config = config;

  var scope, rootElement, backButton, pagerOptions, scrollPos, structure = {}, newItemsToShow = 0,
        firstItemDate = {}, lastItemDate = {}, stopped, container, topLoader, bottomLoader, 
        isContainerShifted, intervalId, loaderLock, context, scrollHeight = {};
  
  var root;
  
  var requestFrame = window[app.requestFrame];
  var cancelFrame = window['cancelAnimationFrame'] || window['webkitCancelAnimationFrame'] || function(){};
  var transform = ('transform' in document.body.style) ? 'transform' : 'webkitTransform';
  var animate = ('transform' in document.body.style) ? 'transform .25s' : '-webkit-transform .25s';
  document.addEventListener('need_update',onNeedReset);
  
  function start(element, elRepeat, options) {
    stopped = false;

    if (options.needUpdate) {
      
    }
    
    init(element, elRepeat, options);

    getEarlier(false, function(items) {

      if (items.length < 1) {
        stop();
        page.hideLoader();
        page.toggleNoResults(true,'No result found.');
        return false;
      }

      firstItemDate[context] = items[0]['datetime_updated'];
      lastItemDate[context] = items[items.length-1]['datetime_updated'];

      addToBottom(items);

      page.hideLoader();

      intervalId = setInterval(getUpdatedFeed, config.updateInterval*1000);
    });
   
  };
  
  function stop(){
    stopped = true;
    
    destroyBackButton();
    
    scope = false;
    backButton = false;
    
    if (container) {
      save();
      container.removeEventListener('touchmove',calculate);
      container.removeEventListener('touchend',releaseLoaderLock);
      container.style.transition = '';
      document.getElementById(pagerOptions.loaderSelector || 'feed_loader').style.display = 'none';
    }
    
    if (intervalId) clearInterval(intervalId);

  };
  
  function init(element, elRepeat, options) {
    pagerOptions = options;
    rootElement = element;
    context = options.context || 'noContext';
    root = element;
    
    newItemsToShow = 0;
    element = angular.element(element);
    scope = element.scope();
    
    container = document.getElementById(options.containerSelector);
    topLoader = document.getElementById(options.topLoaderSelector);
    bottomLoader = document.getElementById(options.loaderSelector || 'feed_loader');
    
    container.style.transition = animate;
    
    container.addEventListener('touchmove',calculate);
    container.addEventListener('touchend',releaseLoaderLock);
  }
  
  function onNeedReset() {
    
  }
  
  function save() {
    
  }
  
  function load() {
    
  }
  
  var calculateFlag = {};
  
  function calculate() {
    if (scrollPos > app.wrapper.scrollTop) {
      showBackButton();
    }
    
    if (scrollPos < app.wrapper.scrollTop) {
      hideBackButton();
    }
    
    refresh();
    
    
    scrollPos = app.wrapper.scrollTop;

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
  
  function refresh() {
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
      loaderLock = true;
      getUpdatedFeed();
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
    if (buffer.length < 1) stopped = true;
    console.time('Itera render time: ');
    IteraDOM.render(FeedElement, buffer, root);
    IteraDOM.compile();
    console.timeEnd('Itera render time: ');
    if (!structure[context]) structure[context] = [];
    structure[context] = structure[context].concat(buffer);
    scrollHeight[context] = app.wrapper.scrollHeight;
    
  }
  
  function getUpdatedFeed() {
    getEarlier(firstItemDate[context], function(items) {
      if (!items || items.length < 1) return false;
      if (app.wrapper.scrollTop !== 0) {

        var newItemsCount = inspectStructure(items);
        firstItemDate[context] = items[0]['datetime_updated'];
        
        if (newItemsCount && newItemsCount > 0) {
          if (!backButton) {
            createBackButton(newItemsCount);
          } else {
            showBackButton(newItemsCount);
          }
        }


      } else {

        gotoBack();

      }
      
      hideLoader();
    });
  }
  
  function inspectStructure(items) {
    if (!structure[context]) return false;
    console.log('inspectStructure', items);
    var newElementsCount = items.length;
    
    for (var i = 0, ii = structure[context].length; i < ii; i++) {
      for (var n = 0, nn = items.length; n < nn; n++) {
        
        if (compereStructureItems(structure[context][i], items[n])) {
          replaceFeedItem(i, items[n]);
          newElementsCount--;
          break;
        }
        
      }
    }
    
    return newElementsCount;
    
  }
  
  function compereStructureItems(oldItem, newItem) {
    if (oldItem.id === newItem.id) {
      return true;
    }
    
    return false;
  }
  
  function replaceFeedItem2(index, item) {
    var test = app.wrapper.scrollTop;
    console.log('replaceFeedItem', index, item);
    var elements = document.getElementsByClassName(context);
    if (index < 0 || index > elements.length) return false;
    
    if (index*1 === elements.length) {
      console.time('Itera render time: ');
      IteraDOM.render(FeedElement, item, root);
      IteraDOM.compile();
      console.timeEnd('Itera render time: ');
      root.removeChild(elements[elements.length - 1]);
      return true;
    }
    
    console.time('Itera render time: ');
    IteraDOM.render(FeedElement, item, root, elements[index]);
    IteraDOM.compile();
    console.timeEnd('Itera render time: ');
    //root.removeChild(elements[index*1 + 1]);
    setTimeout(function() {
     // app.wrapper.scrollTop = test;
    });
  }
  
  function replaceFeedItem(index, item) {
    var elements = document.getElementsByClassName(context);
    if (index < 0 || index > elements.length) return false;
    
    console.time('Itera replace time: ');
      var oldElement = elements[index];
      var newElement = FeedElement.render.call(item);
      root.replaceChild(newElement, oldElement);
      IteraDOM.compile();
//      oldElement.querySelector('.post-title').innerHTML = item.message;
//      oldElement.querySelector('.strong_text').innerHTML = (item.points || 0) + ((item.points == 1) ? ' point' : ' points');
//      oldElement.querySelector('.time-published').innerHTML = page.getPostAge(item) + ' - ' + userService.getHotelName();
    console.timeEnd('Itera replace time: ');
    
  }
  
  function getOlder(date, callback) {
    var data = {limit: config.limit};
    if (date) {
        data['from_date'] = date;
      }
    if (pagerOptions['from_product_id']) data['from_product_id'] = pagerOptions['from_product_id'];
    network.post('post/getOlder?my_product_id='+userService.getProductId(),data,function(result,response){
      if (result) {
       if (response.length > 0) lastItemDate[context] = response[response.length-1]['datetime_updated'];
       callback(response);
      }

    });
  };
  
  function getEarlier(date, callback) {
     var data = {limit: config.limit};
      if (date) {
        data['from_date'] = date;
      }
      if (pagerOptions['from_product_id']) data['from_product_id'] = pagerOptions['from_product_id'];
      network.post('post/getEarlier?my_product_id='+userService.getProductId(),data,function(result,response){

        if (result) {
          callback(response);
        }

      });
  };
  
  function gotoBack() {
    console.log('goto back');
    app.wrapper.scrollTop = 0;
  }
  
  var link = {
    'gotoBack': gotoBack
  };
  
  function createBackButton(newItems) {
    backButton = document.createElement('div');
    backButton.className = 'back-button';
    TouchLib.testFastTouch(backButton, 'gotoBack()', link);
    document.body.appendChild(backButton);
    showBackButton(newItems);
  }
  
  function showBackButton(newItems) {
    if (!backButton) return false;
    newItemsToShow += newItems || 0;
    if (backButton.style.opacity === '1') return false;
    if (newItemsToShow > 0) {
      backButton.innerHTML = 'Show new ' + newItemsToShow + ((newItemsToShow*1 !== 1) ? ' posts' : ' post');
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
        container.style[transform] = 'translate3d(0,3em,0)';
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
    console.log('hideLoader');
    container.style.transition = '';
    container.style[transform] = '';
    topLoader.style.display = 'none';
    bottomLoader.style.display = 'none';
    setTimeout(function(){
      container.style.transition = animate;
      isContainerShifted = false;
    },100);
  }
  
  
  /* EXPORTS */
  $pager.start = start;
  $pager.stop = stop;
  $pager.config = config;
 
  
  // Itera classes
  var PostBox = Itera.createClass({
  render: function() {
    var self = this;
    var postTitle = Itera.createElement('h2', {class: 'post-title'}, self.message);
    
    var giveButton, give;
    
    if (self.from_product_id*1 !== scope.userProductId && !self.my_points && scope.userProductId !== self.to_product_id*1) {
      giveButton = Itera.createElement('span', {class: 't-icon_point'});
      give = Itera.createElement('div', {class: 'give'}, [giveButton, 'Give']);
    }
    
    if (self.my_points) {
      var youGave = Itera.createElement('div', {class: 'you-gave'}, 
        'You gave ' + self.my_points + ((self.my_points == 1) ? ' point' : ' points'));
    }
    
    var postImageWrap = Itera.createElement('div', 
      {class: 'post-img-wrap', style: 'height: 15em', 'data-image-loader':'img/tol_loader_gray_128.gif'}, 
      function() {
        return Itera.createElement('img', {class: 'img main_image', 
          src: scope.imgResizedPrefix + self.media_url + scope.imgResizedSuffix});
      });

    var pointsWrap = Itera.createElement('div', {class: 'points-wrap'}, [give, youGave, postImageWrap]);
    
    var postInfo = Itera.createElement(PostInfo, self);
    
    IteraDOM.toCompile(function(elemets) {
      TouchLib.testFastTouch(elemets[0], 'showPictureInLightBox(feedItem.media_url)', 
        {feedItem: self })();
      
      if (elemets[1]) {
        TouchLib.testFastTouch(elemets[1], 'givePoints(feedItem)', 
         {feedItem: self })();
      }

      ImageLoader(elemets[0]);
      
      self.$$element = elemets[0];
    }, [postImageWrap, give]);
    
    
    
    return Itera.createElement('div', {class: 'post-box'}, [postTitle, pointsWrap, postInfo]);
  }
});

var PostInfo = Itera.createClass({
  render: function() {
    var self = this;
    var iconPoint = Itera.createElement('span', {class: 't-icon_point'});
    var strongText = Itera.createElement('strong', {class: 'strong_text'}, 
      (self.points || 0) + ((self.points == 1) ? ' point' : ' points'));
    var points = Itera.createElement('div', {class: 'points left'}, 
      [iconPoint, 'This post has ', strongText, ' so far']);
    
    var iconLinkToFB, shareToFB;
    if (scope.userProductId === self.from_product_id*1) {
      iconLinkToFB = Itera.createElement('span', {class: 't-icon_link_fb'});
      shareToFB = Itera.createElement('div', {class: 'fb-share right'}, [iconLinkToFB, 'Share']);
    }
    
    var postInfo = Itera.createElement('div', {class: 'post-info'}, [points, shareToFB]);
    
    IteraDOM.toCompile(function(elemets) {
      TouchLib.testFastTouch(elemets[0], 'showWhoGivePoints(feedItem)', 
        {feedItem: self})();
      
      if (elemets[1]) {
        TouchLib.testFastTouch(elemets[1], 'showShareMenu(feedItem, event)', 
         {feedItem: self})();
      }
      
    }, [postInfo, shareToFB]);
    
    return postInfo;
  }
});

var UserPosted = Itera.createClass({
  render: function() {
    var self = this;
    
    var avatar;
    
    if (!self.from_product_id || !self.to_product_id) {
      avatar = Itera.createElement('img', {class: 'img', 
        src: (self.from_product_image || self.to_product_image) ? 
        scope.imgPrefix+
                (self.from_product_image || self.to_product_image)+
                scope.imgSuffix
        : 'img/default-staff.png'});
    }
    
    if (self.from_product_id && self.to_product_id) {
    avatar = Itera.createElement('img', {class: 'img', 
      src: (self.to_product_image) ? 
      scope.imgPrefix + self.to_product_image + scope.imgSuffix
      : 'img/default-staff.png'});
    }
    
    
    var imgInnerWrap = Itera.createElement('div', {class: 'img-inner-wrap'}, avatar);
    var imgMiddleWrap = Itera.createElement('div', {class: 'img-middle-wrap'}, imgInnerWrap);
    var imgWrap = Itera.createElement('div', {class: 'image-wrap'}, imgMiddleWrap);
    
    var feedTitle;
    
    if ((self.from_product_id && !self.to_product_id) 
            || (!self.from_product_id && self.to_product_id)) {
      
      var userName = Itera.createElement('span', {class: 'user-name'}, 
        self.from_product_name || self.to_product_name || 'Anonymous user');
        
      feedTitle =  Itera.createElement('div', {class: 'feed-title'}, 
        [userName, (!self.from_product_id) ? self.message : ' published a new post']);
    }
    
    if (self.from_product_id && self.to_product_id) {
      
      var userName = Itera.createElement('span', {class: 'user-name'}, self.to_product_name);
        
      feedTitle =  Itera.createElement('div', {class: 'feed-title'}, 
        [userName, ' is considered '+self.points_alias+' on '+self.points_alias_characteristic+' by ' + self.from_product_name]);
    }
      
    var timePublished = Itera.createElement('div', {class: 'time-published'}, 
      page.getPostAge(self) + ' - ' + userService.getHotelName());
     
    var userTitle = Itera.createElement('div', {class: 'user-title'}, 
      [feedTitle, timePublished]);

    var userMenu;
    if (scope.userProductId === self.from_product_id*1) {
      userMenu = Itera.createElement('div', {class: 'user-menu t-icon_menu'});
    }
    var userPosted = Itera.createElement('div', {class: 'user-posted this-user'}, 
      [imgWrap, userTitle, userMenu]);
      
    IteraDOM.toCompile(function(elemets) {
      TouchLib.testFastTouch(elemets[0], 'showUserPosts(feedItem)', 
        {feedItem: self})();
      
      if (elemets[1]) {
        if (!self.from_product_id || !self.to_product_id) {
          TouchLib.testFastTouch(elemets[1], 
           'showPictureInLightBox(feedItem.from_product_image || link.feedItem.to_product_image)"', 
           {feedItem: self})();
        }
        
        if (self.from_product_id && self.to_product_id) {
          TouchLib.testFastTouch(elemets[1], 
           'showPictureInLightBox(feedItem.to_product_image)"', 
           {feedItem: self})();
        }
      }
      
      if (elemets[2]) {
        TouchLib.testFastTouch(elemets[2], 'userMenuShow(feedItem)', 
         {feedItem: self})();
      }
      
    }, [userPosted, imgWrap, userMenu]);
    
    return userPosted;
  }
});

var FeedElement = Itera.createClass({
  render: function() {
    var self = this;

    var postBox = Itera.createElement(PostBox, self);
    var userPosted = Itera.createElement(UserPosted, self);
    var feedBox = Itera.createElement('div', {class: 'feed-box fast-root'}, 
      [userPosted, postBox]);
    
    return (feedBox);
  }
  
});

}]);