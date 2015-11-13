tol.service('pager',['network','userService',function(network,userService){
 
  var $pager = this;
  
  var config = { limit: 10
               , maxPages: 10
               , pagesToClean: 5
               , screensToEndBorder: 3
               , screensToStartBorder: 1
               };
  
  var topBuffer = [], bottomBuffer = [], scope, maxScrollHeight, scrollPos, lastItemId, stopped, bottomBorder;
  
  function start(element) {
    
    element = angular.element(element);
    scope = element.scope();
    
    getEarlier(false,function(posts){
      bottomBuffer = posts;
      console.log(bottomBuffer);
      apply(bottomBuffer);
      setTimeout(function(){
       // stopped = false;
        calculate();
      },500);
    });
  };
  
  function stop(){
    
  };
  
  function fillBottomBuffer(id) {
    
  }
  
  function getOlder(id, callback) {
     var data = {limit: config.limit, 'my_product_id':userService.getProductId()};
      if (id) {
        data['from_id'] = id;
      }
//      network.post('post/getOlder/',data,function(result,response){
//
//        if (result) {
//         callback(response);
//        }
//
//      });

        getTestObjects(config.limit,function(result,response){
          if (result) {
            callback(response);
          }
        });
  };
  
  function getEarlier(id, callback) {
     var data = {limit: config.limit, 'my_product_id':userService.getProductId()};
      if (id) {
        data['from_id'] = id;
      }
//      network.post('post/getEarlier/',data,function(result,response){
//
//        if (result) {
//          callback(response);
//        }
//
//      });
      
      getTestObjects(config.limit,function(result,response){
          if (result) {
            callback(response);
          }
        });
  };
  
  function addToBottom() {
    stopped = true;
    getOlder(lastItemId,function(posts){
      bottomBuffer = bottomBuffer.concat(posts);
      console.log(bottomBuffer);
      apply(bottomBuffer);
    });
  }
  
  function addToTop() {
    var buffer = [];
    var offset = 0;
    buffer = topBuffer.splice(topBuffer.length - config.limit, topBuffer.length);
    for (var i = 0, l = buffer.length; i < l; i++) {
      offset += buffer[i].elementHeight;
    }
    scope.feedItems = buffer.concat(scope.feedItems);
    try{scope.$digest();}catch(e){};
    app.wrapper.scrollTop = app.wrapper.scrollTop + offset;
    setTimeout(calculate, 200);
  }
  
  function freeTopElements() {
    var elements = document.getElementsByClassName('post-root');
    var offset = 0;
    for (var i = 0, l = config.limit * config.pagesToClean; i < l; i++) {
      var height = elements[i].getAttribute('data-height')*1;
      offset += height;
      scope.feedItems[i].elementHeight = height;
    }
    topBuffer = topBuffer.concat( (scope.feedItems.splice(0,config.limit * config.pagesToClean)) );
    app.wrapper.scrollTop = app.wrapper.scrollTop - offset;
    try{scope.$digest();}catch(e){};
    
    setTimeout(calculate, 200);
  }
  
  function calculate() {

    if (stopped) { 
      //wait for page render.
      if (maxScrollHeight !== app.wrapper.scrollHeight) {
        stopped = false;
      }
      
      requestAnimationFrame(calculate);
      return false;
    }
    
    maxScrollHeight = app.wrapper.scrollHeight;
    scrollPos = app.wrapper.scrollTop;
    
    if (scrollPos > maxScrollHeight - (innerHeight * config.screensToEndBorder) && scrollPos > innerHeight) {
      
      if (scope.feedItems.length >= config.limit * config.maxPages) {
        freeTopElements();
        return false;
      }
      
      addToBottom();
    }
    
    if (scrollPos < innerHeight / 2 && topBuffer.length > 0) {
      addToTop();
      return false;
    }
    
    requestAnimationFrame(calculate);
  }
  
  function apply(buffer) {
    if (buffer.length === 0) return false;
    bottomBorder = 0;
    scope.feedItems = scope.feedItems.concat( buffer.splice(0, config.limit) );
    try{scope.$digest();}catch(e){};
    lastItemId = scope.feedItems[scope.feedItems.length-1].id;
  };
  
  $pager.start = start;
  $pager.config = config;
  
  var testImgArray = [
    'https://teamoutloud.blob.core.windows.net/crystalho1crystalcy4/posts/image23.jpeg',
    'https://teamoutloud.blob.core.windows.net/crystalho1crystalcy4/posts/image13.jpeg',
    'https://teamoutloud.blob.core.windows.net/crystalho1crystalcy4/posts/image12.jpeg',
    'https://teamoutloud.blob.core.windows.net/crystalho1crystalcy4/posts/image11.jpeg'
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
  
  var testSeek = 0;
  
  function getTestObjects(count,callback) {
    var result = [];
    for (var i = 0; i < count; i++) {
      var obj = {};
      Object.assign(obj,testObject);
      obj.id = testSeek;
      obj.message += ' - '+testSeek;
      obj.media_url = testImgArray[testSeek%4];
      result.push(obj);
      testSeek++;
    }
    
    setTimeout(function(){
      callback(true, result);
    },347);
  }

}]);