var debugArray;
function ElRepeat(wrapper) {
  
  var DIRECTIVE_PREFIX = 'data-';
  //var htmls = {};
  
  /*AngularJS support*/
  var scope = {};
  var angularElement;
  var feedService;
  if (window.angular) {
    angularElement = angular.element(wrapper);
    scope = angularElement.scope();
    
    angularElement.injector().invoke(function(feed){
      feedService = feed;
    });
    
  }
  /*-----------------*/
  
  
//  for (var i = 0, ii = root.length; i < ii; i++) {
//    htmls[root[i].getAttribute(DIRECTIVE_PREFIX + 'type')] = root[i].outerHTML.replace('style="display: none"','');
//    wrapper.removeChild(root[i]);
//  }
  
  //var html = root.outerHTML.replace('style="display: none"','');
  var linkName = 'feedItem';
  var globalLinks = [];
  var rootScopes = [];
  var compileExpresions = {};
  
  var compileListeners = {};
  var DIRECTIVES = [ 'touch'
                   , 'hold-touch'
                   , 'show'
                   , 'image-loader'
                   , 'src'
                   ];
  var AUTO_POSTS = ['CUSTOMPOST','BIRTHDAY','ANNIVERSARY','JOINED','LEFT','PHRASE'];

  
  
  function getNearest(node,className, callback) {
    callback = callback || function(){};
    var element = node.querySelector('.'+className);
    if (!element) {
      var parent = node.parentElement;
    }
  }
  
  function hasDirective(node) {
    for (var i = 0, l = DIRECTIVES.length; i < l; i++) {
      if ( node.hasAttribute( DIRECTIVE_PREFIX + DIRECTIVES[i] ) ) {
        return true;
      }
    }
    return false;
  }
  
  function showDirective(element) {
    //var value = eval(element.getAttribute(DIRECTIVE_PREFIX + 'show'));
    var value = element.getAttribute(DIRECTIVE_PREFIX + 'show');
    if (!value || value === "false" || value === "0" || value === "null" || value === "undefined") {
      element.style.display = 'none';
    } else {
      element.style.display = '';
    }
  }
  
  function srcDirective(element) {
    var src = element.getAttribute(DIRECTIVE_PREFIX + 'src');
    element.src = src;
  }
  
  function layoutDirective(compileString, link, linkName) {
    /*
     * Example
     * <layout name="quote-wrap" expression="(feedItem.attachment_count*1 > 0) ? 'quote-wrap' : 'points-wrap'"></layout>
     */
    
    var error = new Error('Layout directive must have attribute "name" with default name of layout and can have\
 attribute "expression" (optional) which result is returned name of layout');
    
    var layouts = compileString.match(/<layout.+><\/layout>/g);
    
      if (layouts) {
        for (var i = 0, ii = layouts.length; i < ii; i++) {
          var defaultName = /name="([^"]+)"/.exec(layouts[i]);
          var name = '';
          if (!defaultName) {
            throw error;
          }
          var expression = /expression="([^"]+)"/.exec(layouts[i]);
          if (expression)  {
            expression = expression[1];
            var linkReg = new RegExp(linkName,'g');
            var result = eval(expression.replace(linkReg, 'link'));
            name = result;
          } else {
            if (defaultName) {
              name = defaultName[1];
            } else {
              throw error;
              return false;
            }
          }
          
          var smallLayout = ElRepeatIniter.getLayout(name);
          var reg = '<layout.+name="' + defaultName[1] + '".+><\/layout>';
          var reg = new RegExp(reg);
          compileString = compileString.replace(reg, smallLayout);
        }
      }
      
    return compileString;
  }
  
  function prepare(links, htmlString) {
    var compileString = '';
    var compileArray = [];
    if (htmlString) {
      compileString = htmlString;
    }
    
    for (var i = 0, l = links.length; i < l; i++) {
      //var link = links[i];
      if(links[i].post_type_id*1 === feedService.URL_POST_WITH_PUSH)  links[i].post_type_id =  feedService.URL_POST;
      if(links[i].post_type_id*1 === feedService.NORMAL_POST_WITH_PUSH)  links[i].post_type_id =  feedService.NORMAL_POST;

      compileString = ElRepeatIniter.getLayout('normal');
      
      if (links[i].post_type_id*1 === feedService.MULTI_RECOGNITION_POST) {
        compileString = ElRepeatIniter.getLayout('multi-recognition');
      }
      
      if (links[i].auto_post_name && links[i].auto_post_name === 'TripAdvisor') {
        compileString = ElRepeatIniter.getLayout('trip-adviser');
      }
      if (links[i].auto_post_name && links[i].auto_post_name === 'BookingCom') {
        compileString = ElRepeatIniter.getLayout('booking-com');
      }
      if (links[i].post_type_id*1 < 0 && links[i].attachment_count && links[i].attachment_count*1>0 && links[i].attachments && links[i].attachments[0]
          && links[i].attachments[0].data && links[i].attachments[0].data.post_name
          && (AUTO_POSTS.indexOf(links[i].attachments[0].data.post_name.toUpperCase())!==-1)){
        compileString = ElRepeatIniter.getLayout('custom-post');
      }
      if (links[i].post_type_id*1 < 0 && links[i].attachment_count && links[i].attachment_count*1>0 && links[i].attachments && links[i].attachments[0]
          && links[i].attachments[0].data && links[i].attachments[0].data.post_type
          && links[i].attachments[0].data.post_type.toUpperCase() =='CUSTOMPOST'){
        compileString = ElRepeatIniter.getLayout('custom-post');
      }
      if (links[i].post_type_id*1 === feedService.VOTE_POST) {
        //if (links[i].attachment_count*1 < 1) continue;
        compileString = ElRepeatIniter.getLayout('vote-post');
      }
      if (links[i].post_type_id*1 === feedService.URL_POST) {
        //if (links[i].attachment_count*1 < 1) continue;
        compileString = ElRepeatIniter.getLayout('url-post');
      }
      if (links[i].post_type_id*1 === feedService.QUOTE_POST) {
        compileString = ElRepeatIniter.getLayout('quote-post');
      }

      compileString = layoutDirective(compileString, links[i], linkName);
      
      eval('var '+ linkName + ' = links[i]');
      var index = globalLinks.length;
      var layout = compileString.replace(/&amp;/g,'&');
      
      var shows = layout.match(/<[^>]+data-show="[^{%]*\{%.+%\}/g) || [];

     // var itesForId = layout.match(/<[^>{]+\{%[^}]+%\}/g) || [];
      for (var j = 0, jj = shows.length; j < jj; j++) {
        
        var str = shows[j].replace(/(<[^\s]+)/,'$1 data-id="'+ElRepeatIniter.globalId+'" ');
        try {
          compileExpresions['$$'+ElRepeatIniter.globalId] = /\{\%([^\}]+)\%\}/g.exec(shows[j])[1];
          ElRepeatIniter.globalId++;
          layout = layout.replace(shows[j], str);
        } catch(e) {
          console.log(e);
        }
        
      }
      var items = layout.match(/\{\%([^\}]+)\%\}/g) || [];
      for (var n = 0, nn = items.length; n < nn; n++) {
        var strCommad = items[n].replace('{%','').replace('%}','');
        try {
          var ev = eval(strCommad);
          layout = layout.replace(items[n], ev);
          layout = layout.replace('$index',i*1+index);
        } catch(e) {
          console.log(e);
          layout = layout.replace(strCommad, '').replace('{%','').replace('%}','');
        }
      }
      
      compileArray.push(layout);
    }
    
    return compileArray.join(' ');
  }
  
  function compile(root, startFrom, end) {
    var cildrenIndex = 0;
    var to = end || globalLinks.length;
    for (var i = startFrom; i < to; i++) {
     var rootChild = root.children[cildrenIndex];
      var isolateScope = {'0': rootChild
                         };
      globalLinks[i].$$element = rootChild;            
      isolateScope[linkName] = globalLinks[i];
      
      if (!end) {
        rootScopes.push(isolateScope);
      } else {
        rootScopes.unshift(isolateScope);
      }
      
      if (rootChild) {
        var walker = document.createTreeWalker(rootChild, NodeFilter.SHOW_ELEMENT, null, false);
        while(walker.nextNode()) {
          compileElement(walker.currentNode, isolateScope);
        }
      }
      
      cildrenIndex++;
      globalLinks[i].$compilied = true;
    }
    onCompile();
  }
  
  function compileElement(element, link) {
    if (hasDirective(element)) {
      if (element.hasAttribute(DIRECTIVE_PREFIX + 'touch')) {
        TouchLib.testFastTouch(element, element.getAttribute(DIRECTIVE_PREFIX + 'touch'), link)();
      }

      if (element.hasAttribute(DIRECTIVE_PREFIX + 'hold-touch')) {
        TouchLib.testHoldTouch(element, element.getAttribute(DIRECTIVE_PREFIX + 'hold-touch'), link)();
      }

      if (element.hasAttribute(DIRECTIVE_PREFIX + 'show')) {
        showDirective(element);
      }

      if (element.hasAttribute(DIRECTIVE_PREFIX + 'src')) {
        srcDirective(element);       
      }

      if (element.hasAttribute(DIRECTIVE_PREFIX + 'image-loader')) {
        ImageLoader(element);
      }
    }
  }
  
  function getLinkIndex(link) {
    return globalLinks.indexOf(link);
  }
  
  function recompileElement(link) {
    var index = getLinkIndex(link);
    var element = rootScopes[index][0];
    var htmlString = prepare([link]);
    var range = document.createRange();
    var fragment;
    try{
      fragment = range.createContextualFragment(htmlString);
    } catch (e){//ios safari doesn't support createcontextual fragment:-(
      var temp = document.createElement('TEMPLATE');
      temp.innerHTML = htmlString;
      fragment = temp.content;
    }
    var newElement = fragment.querySelector('.feed-box');
    element.parentElement.insertBefore(newElement, element);
    element.parentElement.removeChild(element);
    globalLinks[index] = link;
    var isolateScope = {0: newElement};
    isolateScope[linkName] = link;
    rootScopes[index] = isolateScope;
    var walker = document.createTreeWalker(newElement, NodeFilter.SHOW_ELEMENT, null, false);
    while(walker.nextNode()) {
      compileElement(walker.currentNode, isolateScope);
    }
  }
  
  function updateElement(element, link) {
    var bindNodes = element.querySelectorAll('['+DIRECTIVE_PREFIX+'binding]');
    for (var i = 0, ii = bindNodes.length; i < ii; i++) {
      var field = bindNodes[i].getAttribute(DIRECTIVE_PREFIX+'binding');

      if (bindNodes[i].getAttribute(DIRECTIVE_PREFIX+'show')) {
        var id = bindNodes[i].getAttribute(DIRECTIVE_PREFIX+'id');
        var expresion = compileExpresions['$$'+id];
        expresion = expresion.replace(/feedItem/g,'link');
        var ev = eval(expresion);
        bindNodes[i].setAttribute(DIRECTIVE_PREFIX+'show', ev);
        showDirective(bindNodes[i]);
      }
      
      if (/.+\(.*\)/.test(field)) {
        field = 'scope.' + field.replace(/feedItem/g,'link');
        bindNodes[i].innerHTML = eval(field);
      } else {
        if (link[field]) {
          bindNodes[i].innerHTML = link[field];
        } else if(link[field] == null){
          bindNodes[i].innerHTML = '';
        } else if (field) {
          bindNodes[i].innerHTML = field;
        }
      }
    }
    var bindNodes = element.querySelectorAll('['+DIRECTIVE_PREFIX+'class-binding]');
    for (var i = 0, ii = bindNodes.length; i < ii; i++) {
      var field_class = bindNodes[i].getAttribute(DIRECTIVE_PREFIX+'class-binding');
      if (/.+\(.*\)/.test(field_class)) {
        field_class = 'scope.' + field_class.replace(/feedItem/g,'link');
        bindNodes[i].className = eval(field_class);
      } else {
        if (link[field_class]) {
          bindNodes[i].className = link[field_class];
        } else if (field_class) {
          bindNodes[i].className = field_class;
        }
      }
    }
    link.$$updated = true;
    link.$$element = element;
    link.$compile = true;
    return link;
  }
  
  function append(links) {
    console.time('elRepeat render time: ');
    if (links.length < 1) return false;
    var page = document.createElement('div');
    page.innerHTML = ' ' + prepare(links);
    wrapper.appendChild(page);
    var startFrom = globalLinks.length;
    globalLinks = globalLinks.concat(links);
    setTimeout(function(){
      console.time('elRepeat compile time: ');
      compile(page, startFrom);
      console.timeEnd('elRepeat compile time: ');
    });
    console.timeEnd('elRepeat render time: ');
  }
  
  function update(updateLinks) {
    console.time('elRepeat update');
    for (var i = 0, ii = updateLinks.length; i < ii; i++) {
      var updateLink = updateLinks[i];
      for (var n = 0, nn = globalLinks.length; n < nn; n ++) {
        var globalLink = globalLinks[n];
        
        if (globalLink.id*1 === updateLink.id*1) {
          globalLinks[n] = updateElement(globalLink.$$element, updateLink);
          recompileElement(updateLink);
          rootScopes[n][linkName] = globalLinks[n];
        }
        
      }
    }
    for (var i = updateLinks.length - 1; i >= 0; i--) {
      if (updateLinks[i].$$updated) {
        updateLinks.splice(i, 1);
      }
    }
    console.timeEnd('elRepeat update');
  }
  
  function insert(before, links) {
    if (links.length < 1) return false;
    var page = document.createElement('div');
    page.innerHTML = ' ' + prepare(links);
    wrapper.insertBefore(page, rootScopes[before][0].parentElement);
    globalLinks = links.concat(globalLinks);
    setTimeout(function(){
      compile(page, 0, links.length);
    });
  }
  
  function getHeight(from, to) {
    var height = 0;
    for (var i = from; i < to; i++) {
      height += rootScopes[i][0].getAttribute('data-height')*1 || 0;
    }
    return height;
  }
  
  function remove(from, to) {
    var count = to - from;
    if (count < 1) return false;
    for (var i = from; i < to; i++) {
      var parent = rootScopes[i][0].parentElement;
      parent.removeChild(rootScopes[i][0]);
      rootScopes[i][linkName].$elementHeight = rootScopes[i][0].getAttribute('data-height')*1 || 0;
      rootScopes[i] = rootScopes[i][linkName];
      delete rootScopes[i].$compilied;
    }
    
    return rootScopes.splice(from, count);
  }
  
  function deleteItem(item) {
    var pointer = -1;
    for (var i = 0, l = rootScopes.length; i < l; i++) {

      if (rootScopes[i][linkName].id === item.id) {
        pointer = i*1;
        break;
      }
    }

    if (pointer !== -1) {
      var parent = rootScopes[pointer][0].parentElement;
      parent.removeChild(rootScopes[pointer][0]);
      rootScopes.splice(pointer, 1);
    }
    
  }
  
  function getItem(index) {
    return rootScopes[index][linkName];
  }
  
  function getAllItems() {
    return rootScopes;
  }
  
  var lock = false;
  var scrollTop = 0;
  function testImages() {
    //document.getElementById('monitor').innerHTML = app.wrapper.scrollTop;
    if (!lock && scrollTop !== app.wrapper.scrollTop) {
      lock = true;
      setTimeout(function() {
        for (var i = 0, l = rootScopes.length; i < l; i++) {
          var element = rootScopes[i][0];
          var img = element.querySelector('.main_image');
          testImage(img);
        }
        lock = false;
      });
    }
    scrollTop = app.wrapper.scrollTop;
  }
  
  function hide(from, to) {
    from = from || 0;
    to = to || rootScopes.length;
    for (var i = from; i < to; i++) {
      rootScopes[i][0].style.display = 'none';
    }
  }
  
  function show(from, to) {
    from = from || 0;
    to = to || rootScopes.length;
    for (var i = from; i < to; i++) {
      rootScopes[i][0].style.display = '';
    }
  }
  
  function clearAll() {
    globalLinks = [];
    rootScopes = [];
    wrapper.innerHTML = '';
  }
  
  function hasItems() {
    if (rootScopes.length > 0) return true;
    return false;
  }
  
  function addCompileListener(id,callback) {
    callback = callback || function(){};
    compileListeners[id] = callback;
  }
  
  function onCompile() {
    for (var key in compileListeners) {
      compileListeners[key]();
    }
  }
  
  /* EXPORT */
  this.append = append;
  this.insert = insert;
  this.remove = remove;
  this.deleteItem = deleteItem;
  this.getItem = getItem;
  this.getAllItems = getAllItems;
  this.getLinkIndex = getLinkIndex;
  this.recompileElement = recompileElement;
  this.testImages = testImages;
  this.hide = hide;
  this.show = show;
  this.getHeight = getHeight;
  this.hasItems = hasItems;
  this.clearAll = clearAll;
  this.compileElement = compileElement;
  this.addCompileListener = addCompileListener;
  this.update = update;
  
};


/**
 * // Touch methods //
*/

TouchLib = {
  
  timerId: false,
  onScroll: function() {
    //app.testMonitor.innerHTML = ++tttt;
    //scrollBlock = true;
      
      
//      if (TouchLib.timerId) clearTimeout(TouchLib.timerId);
//      TouchLib.timerId = setTimeout(function(){
//        var event = document.createEvent('Event');
//        event.initEvent('scroll_stop', true, true);
//        app.wrapper.dispatchEvent(event);
//      },100);
    },
    
  createFunction: function(strFunction, link, scope) {
    var funcName = strFunction.replace(/\(.*/,'');
    var funcAttrs = strFunction.match(/\((.*)\)/)[1].split(',');
    
    if (funcName in link) funcName = 'link.'+funcName;
    if (funcName in scope) funcName = 'scope.'+funcName;
    for (var i in funcAttrs) {
      funcAttrs[i] = funcAttrs[i].trim();
      if (!/^\d/.test(funcAttrs[i])) {
        if (funcAttrs[i].replace(/\..*/,'') in link) funcAttrs[i] = 'link.'+funcAttrs[i];
        if (funcAttrs[i].replace(/\..*/,'') in scope) funcAttrs[i] = 'scope.'+funcAttrs[i];
      }
    }
    return funcName + '(' + funcAttrs.join(',') + ')';
  },
    
  testFastTouch : function(element, strFunction, link) {
    
    var scope = {};
    if (angular) {
      scope = angular.element(element).scope() || {};
    }
    
    strFunction = TouchLib.createFunction(strFunction, link, scope);

  return function() {
    
    var touchAllow = false;
    var coords = {};
    var timeout;
    var isTouchSupported = 'ontouchstart' in window;
    var square = 10;
    var test;

    if (isTouchSupported) {

        element.addEventListener('touchstart', function(event) {
          //scrollBlock = false;
//          app.wrapper.removeEventListener('scroll', TouchLib.onScroll);
//          setTimeout(function(){
//            app.wrapper.addEventListener('scroll', TouchLib.onScroll);
//          },1000);
          var body = document.getElementsByTagName('body')[0];
          coords = {x: event.changedTouches[0].screenX, y: event.changedTouches[0].screenY};
          touchAllow = true;
          timeout = window.setTimeout(function(){
            touchAllow = false;
          },1000);
        });

        element.addEventListener('touchend', function(event) {
          
          var curCoords = {x: event.changedTouches[0].screenX, y: event.changedTouches[0].screenY};
          var x = Math.abs(curCoords.x - coords.x);
          var y = Math.abs(curCoords.y - coords.y);
          if(x < square && y < square) {
            if (touchAllow) {
              event.stopPropagation();
              touchAllow = false;
              clearTimeout(timeout);
              window.setTimeout(function() {
                if (!scrollBlock) {
                  eval(strFunction);
                  if (angular && (typeof scope.$apply === 'function')) scope.$apply();
                }
              },200);
            }
          }
        });
      }
    
    };
  
  },
  
  testHoldTouch: function(element, strFunction, link) {
    var scope = {};
    if (angular) {
      scope = angular.element(element).scope() || {};
    }
    
    strFunction = TouchLib.createFunction(strFunction, link, scope);
    var timeout;
    return function() {
      element.addEventListener('touchstart', function(event) {
        coords = {x: event.changedTouches[0].screenX, y: event.changedTouches[0].screenY};
        timeout = window.setTimeout(function(){
          eval(strFunction);
          if (angular && (typeof scope.$apply === 'function')) scope.$apply();
        },1000);
      });
      element.addEventListener('touchmove', function(event) {
          clearTimeout(timeout);
      });
      element.addEventListener('touchend', function(event) {
        clearTimeout(timeout);
      });
    };
  }

};


  
//  function recompile2(element, link) {
//    var prepared = prepare([link]);
//    element.outerHTML = prepared;
//    setTimeout(function() {
//      compile(element.parentElement, globalLinks.length);
//      console.log('compile');
//    },1000);
//  }
//  window.test = function(element) {
//    recompile2(element, window.rrr);
//  };
//  
  window.rrr = {   
__permissions: {canUpdate: true, canRemove: false},
canRemove: false,
canUpdate: true,
age_days:"0",
age_minutes:"383",
attachment_count:"0",
auto_post_name:null,
can_share:"0",
datetime_published:"2016-03-29 06:46:41.087",
datetime_updated:"2016-03-29 12:07:49.723",
deleted:null,
from_product_id:"8",
from_product_image:"https://teamoutloud.blob.core.windows.net/kharkivhot49thoffice18/product_media/image12.jpeg?12:47:56",
from_product_name:"Yulia Pilipenko1 ",
id:"230",
media_url:"https://teamoutloud.blob.core.windows.net/crystalho1crystalcy4/gift_points.png",
message:"ok1",
my_points:null,
points:"9",
points_alias:"Норм",
points_alias_characteristic:"Пунктуальность",
points_product_count:"3",
post_type_id:"2",
rowid:"101",
status_id:"1",
to_product_id:null,
to_product_image:null,
//to_product_list:[
//{to_product_id:"8",
//to_product_image:"https://teamoutloud.blob.core.windows.net/kharkivhot49thoffice18/product_media/image11.jpeg?12:04:25",
//to_product_name:"Valeriy Radchenko "},
//{to_product_id:"8",
//to_product_image:"https://teamoutloud.blob.core.windows.net/kharkivhot49thoffice18/product_media/image11.jpeg?12:04:25",
//to_product_name:"Valeriy Radchenko "},
//{to_product_id:"8",
//to_product_image:"https://teamoutloud.blob.core.windows.net/kharkivhot49thoffice18/product_media/image11.jpeg?12:04:25",
//to_product_name:"Valeriy Radchenko "}
//],
to_product_name:null,
update_reason:"Yulia Pilipenko edited post message"
};




