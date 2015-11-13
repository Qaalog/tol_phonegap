qaalog.service('pager',['$timeout','search',function($timeout,search){
  var $pager = this;

  /* CONSTANTS */
  var PAGE_COUNT = 3,
  ITEMS_IN_PAGE = 25,
  UPPER_LIMIT_PERSENT = 5,
  LOWER_LIMIT_PERSENT = 85,
  BUFFER_SIZE = 1,
  BUFFERS_COUNT = 2;
  var loadedPages =  PAGE_COUNT + (BUFFER_SIZE * BUFFERS_COUNT);
  
  /* ATTRIBUTES */
  var scope, method, list, seekLower, seekUpper, lowerBuffer, upperBuffer, itemClass, marginRule, marginHeight, 
      itemHeight, height, upperLimit, lowerLimit, offset, body, scrollTimerId, busyFlag, upperBusyFlag,
      additionalProperties, pauseFlag, pauseOffset, lastSide;
  
  /* METHODS */
  var getData, addToLowerBuffer, getFromLowerBuffer, addToUpperBuffer, getFromUpperBuffer,
      addAdditionalProperties, onScroll, calculate, itemRectCalculate, onScrolling, onScrollStop, 
      addToBottom, addToTop, toggleLowerLoader, toggleUpperLoader, countElementsHeight, removeExtraElements;
  
  $pager.startPager = function(options) {
    $pager.initPager(options);
    
    var pagerParams = { startRow: seekLower
                      , maxRows: ITEMS_IN_PAGE * (PAGE_COUNT + BUFFER_SIZE)
                      };

    getData(pagerParams,function(items){
      if (!items || items.length === 0) {
        $pager.stopPager();
        return false;
      };
      addToLowerBuffer(items);
      scope[list] = getFromLowerBuffer(ITEMS_IN_PAGE * PAGE_COUNT);
      addAdditionalProperties();
      seekLower += ITEMS_IN_PAGE * PAGE_COUNT;

      itemRectCalculate();
      try {
        search.setSearchCount(scope[list].length);
      } catch (e) {}
    });

  };
  
  $pager.stopPager = function() {

    upperBuffer = [];
    lowerBuffer = [];
    additionalProperties = false;
    app.wrapper.removeEventListener('scroll',onScroll);
    $pager.isStarted = false;
    app.wrapper.scrollTop = 0;
    pauseOffset = 0;
    offset = 0;
    
    if (typeof toggleUpperLoader === 'function')
      toggleUpperLoader(false);
    if (typeof toggleLowerLoader === 'function')
      toggleLowerLoader(false);
    
  };
  
  $pager.pause = function() {
    pauseFlag = true;
    pauseOffset = offset;
    console.log('pause off',pauseOffset);
  };
  
  $pager.play = function() {
    pauseFlag = false;
    $timeout(function(){
      app.wrapper.scrollTop = pauseOffset;
    });
  };
  
  $pager.saveState = function() {
    if (!$pager.isStarted) {
      return false;
    }

    onScrollStop();
    return { offset:               app.wrapper.scrollTop
           , seekLower:            seekLower - (ITEMS_IN_PAGE * PAGE_COUNT)
           , seekUpper:            seekUpper
           , itemHeight:           itemHeight
           , marginHeight:         marginHeight
           , additionalProperties: additionalProperties
           , upperBuffer:          JSON.stringify(upperBuffer)
           };
  };
  
  $pager.loadState = function(state,optons) {
    $pager.initPager(optons);

    upperBuffer = JSON.parse(state.upperBuffer);
    lowerBuffer = [];
    seekLower = state.seekLower;
    seekUpper = state.seekUpper;
    itemHeight = state.itemHeight;
    marginHeight = state.marginHeight;
    additionalProperties = state.additionalProperties;

    var pagerParams = { startRow: seekLower
                      , maxRows: ITEMS_IN_PAGE * (PAGE_COUNT + BUFFER_SIZE)
                      };

    getData(pagerParams,function(items){
      addToLowerBuffer(items);
      scope[list] = getFromLowerBuffer(ITEMS_IN_PAGE * PAGE_COUNT);
      addAdditionalProperties();
      seekLower += ITEMS_IN_PAGE * PAGE_COUNT;
      $timeout(function(){
        app.wrapper.scrollTop = state.offset;
      });
      if(upperBuffer.length !== 0) upperBusyFlag = false;
      try {
        search.setSearchCount(scope[list].length);
      } catch (e) {}
    });
  };
  
  $pager.initPager = function(options) {
    app.wrapper.removeEventListener('scroll',onScroll);
    
    body = document.getElementsByTagName('body')[0];
    
    scope = options.scope;
    list = options.listName;
    method = options.ajaxMethod;
    seekLower = 1;
    seekUpper = 1 - ITEMS_IN_PAGE;
    itemClass = options.itemClass;
    marginRule = options.marginRule;
    additionalProperties = options.properties;
    pauseOffset = 0;
    
    busyFlag = false;
    upperBusyFlag = true;
    pauseFlag = false;
    lastSide = 'bottom';
    
    lowerBuffer = [];
    upperBuffer = [];
    
    toggleLowerLoader = options.lowerLoaderOnToggle || function(){};
    toggleUpperLoader = options.upperLoaderOnToggle || function(){};
    
    app.wrapper.addEventListener('scroll',onScroll);
    $pager.isStarted = true;
  };
  
  addToBottom = function(){
    if (scope[list].length >= ITEMS_IN_PAGE * PAGE_COUNT && lowerBuffer.length > 0) {
      upperBusyFlag = false;
    }
    scope.$apply(function(){
      lastSide = 'bottom';
      scope[list] = scope[list].concat(getFromLowerBuffer(ITEMS_IN_PAGE));
      addAdditionalProperties();
      
      if (scope[list].length >= (ITEMS_IN_PAGE * PAGE_COUNT) * PAGE_COUNT) {
        onScrollStop();
        
        seekLower += ITEMS_IN_PAGE;
        seekUpper += ITEMS_IN_PAGE;
        var pagerParams = { startRow: seekLower
                          , maxRows: ITEMS_IN_PAGE
                          };
        getData(pagerParams,function(newItems){
          addToLowerBuffer(newItems);
        });
      };
      
    });
  };
  
  addToTop = function() {
    busyFlag = false;
    toggleUpperLoader(true);
    var items = getFromUpperBuffer(ITEMS_IN_PAGE);
    if (items.length !== 0) {
      scope.$apply(function () {
        lastSide = 'top';
        scope[list] = items.concat(scope[list]);
        addAdditionalProperties();
        var elHeight = countElementsHeight(ITEMS_IN_PAGE * (PAGE_COUNT - 1), ITEMS_IN_PAGE * PAGE_COUNT);
        addToLowerBuffer(scope[list].splice(scope[list].length - ITEMS_IN_PAGE, ITEMS_IN_PAGE));
        app.wrapper.scrollTop = app.wrapper.scrollTop + elHeight;
      });
    }
  };
  
  onScroll = function(event) {
    if (!pauseFlag) {
      calculate();
      toStatistic();
      onScrolling();

      if (app.wrapper.scrollTop > lowerLimit && !busyFlag) {
        addToBottom();
      };
      
      if (app.wrapper.scrollTop < upperLimit && !upperBusyFlag) {
        addToTop();
      };

      if (app.wrapper.scrollTop < lowerLimit && app.wrapper.scrollTop > upperLimit) {
        //console.log('middle');
        busyFlag = false;
      }
    }
  };
  
  onScrolling = function() {
    if (scrollTimerId) window.clearTimeout(scrollTimerId);
    scrollTimerId = window.setTimeout(function(){
      scrollTimerId = false;
      onScrollStop();
    },700);
  };
  
  onScrollStop = function() {
    if (scope[list].length > ITEMS_IN_PAGE * PAGE_COUNT) {
      if (lastSide === 'bottom') {
        removeExtraElements();
      }

      if (lastSide === 'top') {
        //var diff = scope[list].length - ITEMS_IN_PAGE * PAGE_COUNT;
        //addToUpperBuffer(scope[list].splice( (ITEMS_IN_PAGE * PAGE_COUNT) - 1, diff));
       // app.wrapper.scrollTop = app.wrapper.scrollTop - ( (itemHeight + marginHeight) * diff);
      }

    }
  };

  removeExtraElements = function() {
    var diff = scope[list].length - ITEMS_IN_PAGE * PAGE_COUNT;
    var elHeight = countElementsHeight(0,diff);
    addToUpperBuffer(scope[list].splice(0, diff));
    app.wrapper.scrollTop = app.wrapper.scrollTop - elHeight;
  };

  addToLowerBuffer = function(items) {
    if (lowerBuffer.length === 0) {
      lowerBuffer = items;
      return false;
    }
    
    items = items.concat(lowerBuffer);
    lowerBuffer = items;
    
    if (lowerBuffer.length > ITEMS_IN_PAGE) {
      lowerBuffer.splice(lowerBuffer.length - ITEMS_IN_PAGE,ITEMS_IN_PAGE);
    }
    
  };
  
  getFromLowerBuffer = function(count) {
    try {
      var items = lowerBuffer.splice(0, count);

      $timeout(function () {
        if (lowerBuffer.length === 0 && scope[list].length > ITEMS_IN_PAGE * PAGE_COUNT) {
          seekLower += ITEMS_IN_PAGE;
          seekUpper += ITEMS_IN_PAGE;
          var pagerParams = {
            startRow: seekLower
            , maxRows: ITEMS_IN_PAGE
          };

          getData(pagerParams, function (newItems) {
            addToLowerBuffer(newItems);

            if (newItems.length !== 0 && items.length === 0) {
              console.log('NULL');
              $timeout(function () {
                addToBottom();
               // onScrollStop();
               // busyFlag = false;
              },1000);
            }
//            busyFlag = false;
          });
        }
      });
      if (items.length === 0) {
        busyFlag = true;
      }
      return items;
    } catch (e) {
      return [];
    }
  };
  
  addToUpperBuffer = function(items) {
      if (upperBuffer.length === 0) {
        upperBuffer = items;
        
        if (upperBuffer.length > ITEMS_IN_PAGE) {
          var diff = upperBuffer.length - ITEMS_IN_PAGE;
          upperBuffer.splice(0,diff);
        }
        
        return false;
      }
      
      upperBuffer = upperBuffer.concat(items);
      
      if (upperBuffer.length > ITEMS_IN_PAGE) {
        var diff = upperBuffer.length - ITEMS_IN_PAGE;
        upperBuffer.splice(0,diff);
      }

    };
    
    getFromUpperBuffer = function(count) {
      var items = upperBuffer.splice(upperBuffer.length - count,count);
     // if (seekUpper === ITEMS_IN_PAGE+1) items = [];
      $timeout(function(){
        
        //if (seekUpper < ITEMS_IN_PAGE) return false;
        
       // if (seekUpper < 1) seekUpper = 1;
       seekUpper -= ITEMS_IN_PAGE;
          
        if (upperBuffer.length === 0 && seekUpper > 0) {
          seekLower -= ITEMS_IN_PAGE;
          var pagerParams = { startRow: seekUpper
                            , maxRows: ITEMS_IN_PAGE
                            };

          getData(pagerParams,function(newItems){
            addToUpperBuffer(newItems);
            toggleUpperLoader(false);
            if (newItems.length !== 0) {
              $timeout(function(){
                upperBusyFlag = false;
                onScrollStop();
              });
            }
            
          });
        } else {
          seekUpper = 1 - ITEMS_IN_PAGE;
          seekLower -= ITEMS_IN_PAGE;
          upperBusyFlag = true;
          toggleUpperLoader(false);
        }
      });
      if (items.length === 0) upperBusyFlag = true;
      return items;
    };
    
  $pager.setAdditionalProperties = function(properties) {
    additionalProperties = properties;
  };
  
  addAdditionalProperties = function() {
    if (!additionalProperties) {
      return false;
    }

    for (var i in scope[list]) {
      var item = scope[list][i];
      for (var key in additionalProperties) {
        var value = additionalProperties[key];
        item[key] = value;
      }
    }
  };
  
  getData = function(pagerParams,callback) {
    callback = callback || function(){};
    scope[method](pagerParams,function(items){
      callback(items);
    });
  };
  
  calculate = function() {
    height = app.wrapper.scrollHeight;
    offset = app.wrapper.scrollTop;
    upperLimit = (height * UPPER_LIMIT_PERSENT)/100;
    lowerLimit = (height * LOWER_LIMIT_PERSENT)/100;
  };
  
  itemRectCalculate = function() {
    $timeout(function(){
      try {
        var item = document.getElementsByClassName(itemClass)[0];
        marginHeight = getMarginHeight(marginRule);
        itemHeight = item.getBoundingClientRect().height;
      } catch (e) {};
    });
  };
  
  getMarginHeight = function(marginRule) {
    if (!marginRule) {
      return 0;
    }

    switch (marginRule.type) {
      case 'px':
        return marginRule.value;
        break;
      case 'vw':
        return (window.innerWidth * marginRule.value) / 100;
        break;
      case 'vh':
        return (window.innerHeigh * marginRule.value) / 100;
        break;
      case 'em':
        var fontSize = body.style.fontSize.replace('em','') * 1;
        var pxInEm = 16 * fontSize;
        pxInEm = (pxInEm >= 6) ? pxInEm : 6;
        return  marginRule.value * pxInEm;
        break;
    }
  };

  countElementsHeight = function(from,count) {
    var elements = document.getElementsByClassName(itemClass);
    var elHeight = 0;
    for (var i = from; i < count; i++) {
      var element = elements[i];
      try {
        elHeight += element.getAttribute('data-height') * 1;
        elHeight += marginHeight;
      } catch (e) {
        console.error('ERROR '+i);
      }
    }
    console.log(elHeight);
    return elHeight;
  };
  
  toStatistic = function() {
      scope.$apply(function(){
        scope.info = { offset:      offset
                     , upperLimit:  upperLimit
                     , lowerLimit:  lowerLimit
                     , total:       height
                     , length:      scope[list].length
                     , row:         seekLower
                     , row2:        seekUpper
                     , el:          itemHeight
                     , mh:          marginHeight
                     , ub:          upperBuffer.length
                     , lb:          lowerBuffer.length
                     };
      });
    };
  
}]);

