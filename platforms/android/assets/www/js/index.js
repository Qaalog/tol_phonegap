var scrollBlock = false;
var validateLanguages = function(lang) {
  for (var i in app.languages) {
    if (lang === app.languages[i]) {
      app.language = app.languages[i];
      return true;
    }
  }
  app.language = app.languages[0];
  return false;
};

var tttt = 0;

function findParentElement(node, className) {
  if (!node) return node;
  if (node.className.indexOf(className) > -1) return node;
  return findParentElement(node.parentElement, className);
}

var app = {
    wrapper: false,
    layouts: [ 'default'
             , 'multiRecognition'
             , 'tripAdvisor'
             , 'bookingCom'
             , 'url'
             , 'urlWrap'
             , 'pointsWrap'
             , 'multiPointsWrap'
             , 'multiUrlWrap'
             , 'quote'
             , 'quoteWrap'
             , 'quoteUrlWrap'
             ],
    languages: ['en','pt'],
    language: false,
    stringXML: false,
//    fbAppId: '849404261841154', //DEV
//    fbAppSecret: '9dea60def4c9a883d6d8eec52d1d5744', //DEV
    fbAppId: '507272639432025', //PROD
    fbAppSecret: '0fead7ac2b8ef541000458851a10ff92', //PROD
    defaultErrorImage: 'img/error.png',
    mainPage: 'feed',
    version: '0',
    webKitVersion: (function(){
      try{
        var version = /webkit.+(\d{3}\.\d{2})/.exec(navigator.userAgent.toLowerCase())[1];
        return parseFloat(version);
      } catch(e){}
    })(),
    initialize: function() {
        this.bindEvents();
    },

    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        document.addEventListener('DOMContentLoaded', this.resize, false);
        window.onresize = this.resize;
    },
    onDeviceReady: function() {
        console.log('deviceready');
        var push = PushNotification.init({
            android: {
                senderID: "723206060296",
                "icon": "push_icon",
                "iconColor": "#FFFFFF"
            },
            ios: {
                alert: "true",
                badge: true,
                sound: 'false'
            },
            windows: {}
        });
        app.push = push;
        
        push.on('registration', function(data) {
          console.log('push registration',data.registrationId);
          app.notificationId = data.registrationId;
        });
        app.language = false;
        //app.requestFrame = window['requestAnimationFrame'] || window['webkitRequestAnimationFrame'];
        app.testMonitor = document.getElementById('monitor');
        validateLanguages(navigator.language.replace(/-.+$/,''));
        app.xmlParse(function(){
        app.wrapper = document.getElementsByClassName('content-wrapper')[0];
        app.wrapper.style.height = window.innerHeight + 'px';
        app.innerHeight = window.innerHeight;
        //validateLanguages('pt');
        screen.lockOrientation('portrait');
        document.querySelector('.toast-message').style.display = ''; //  element hidden until angular will not bootstraped.
        angular.bootstrap(document, ['qaalog']);
        window.open = cordova.InAppBrowser.open;
        openFB.init({appId: app.fbAppId});
        console.log(device);
        var angularBody = angular.element(document.body);
        var scope = angularBody.scope();
        
        setTimeout(app.initInputs, 1000);

        });
    },
    
//    connectLocalistic: function() {
//      if (!window.Localytics) return false;
//      document.addEventListener("resume", app.onLocalyticsResume, false);
//      document.addEventListener("pause", app.onLocalyticsPause, false);
//      Localytics.integrate();
//      Localytics.openSession();
//      Localytics.upload();
//      console.log('Localytics started!', Localytics);
//    },
    
//    onLocalyticsResume: function () {
//      if (!window.Localytics) return false;
//      Localytics.openSession();
//      Localytics.upload();
//    },
//    
//    onLocalyticsPause: function () {
//      if (!window.Localytics) return false;
//      Localytics.closeSession();
//      Localytics.upload();
//    },
    
    initInputs: function() {
      app.inputs = document.querySelectorAll('input');
      if (app.isIOS()) {
        var iosStatusbar = document.querySelectorAll('.ios-statusbar');
        for (var i = 0, ii = iosStatusbar.length; i < ii; i++) {
          var input = iosStatusbar[i];
          if (input.className.indexOf('ios-statusbar') > -1) {
            input.addEventListener('focus', app.onInputFocus);
            input.addEventListener('blur', app.onInputBlur);
          }
        }
      }
      
    },
    
    onInputFocus: function() {
      if (window.StatusBar) {
        StatusBar.hide();
      }
    },
    
    onInputBlur: function() {
      if (window.StatusBar) {
        StatusBar.show();
      }
    },

    resize: function () {
      var width = window.innerWidth;
      var body = document.getElementsByTagName("body")[0];
      var size = (width / 640).toFixed(3);
      body.style.fontSize = size + 'em';
    },
    
    isIOS: function() {
      if (navigator.userAgent.toLowerCase().indexOf('iphone') > -1 || navigator.userAgent.toLowerCase().indexOf('ipad') > -1) {
        return true;
      }
      return false;  
    },
    
    requestFrame: (function() {
      return ('requestAnimationFrame' in window) ? 'requestAnimationFrame' : 'webkitRequestAnimationFrame';
    })(),
    
    cancelFrame: (function() {
      return ('cancelAnimationFrame' in window) ? 'cancelAnimationFrame' : 'webkitCancelAnimationFrame';
    })(),

    onImgError: function(target) {
      var parent = target.parentElement;
      var rect = parent.getBoundingClientRect();
      if (rect.width <= rect.height) {
        target.style.margin = 0;
        target.src = 'img/error2.png';
        return false;
      }
      target.style.margin = '';
      target.src = 'img/error.png';
      //console.log('error',target);
    },
    
    onAvatarError: function(target) {
      target.src = 'img/default-staff.png';
    },

    onImgLoaded: function(target) {
      target.style.height = '';
      var width = window.innerWidth;
      var height = window.innerHeight;
      
      if (navigator.userAgent.toLowerCase().indexOf('android') > -1) {
        width = screen.width;
        height = screen.height;
      }
      
      if (navigator.userAgent.toLowerCase().indexOf('windows') > -1) {
        width = 768;
        height = 1280;
      }
      
      console.log('height: '+height, 'width: '+width, height+'x'+width, target.height, target.width);

      var heightRatio = height / target.height;
      var newWidth = target.width * heightRatio;


      if (newWidth <= width) {
        console.log('IN HEIGHT', height + 'px');
        target.style.height = height + 'px';
      } else {
        var widthRatio = width / target.width;
        newWidth = target.height * widthRatio;
        console.log('IN WIDTH', (target.height * widthRatio) + 'px');
        target.style.height = newWidth + 'px';
      }

    },
    
    xmlConfigParse: function(callback) {
      callback = callback || function(){};
      var xmlhttp = new XMLHttpRequest();
      xmlhttp.open("GET", "../config.xml", true);

      xmlhttp.onload = function (e) {
        if (xmlhttp.readyState === 4) {
          //if (xmlhttp.status === 200) {
            var configXML = xmlhttp.responseXML;
            callback(configXML);
          //}
        }
      };
      xmlhttp.send();
    },

    xmlParse: function(callback) {
      callback = callback || function(){};
      var xmlhttp = new XMLHttpRequest();
      xmlhttp.open("GET", "xml/"+app.language+"/strings.xml", true);

      xmlhttp.onload = function (e) {
        if (xmlhttp.readyState === 4) {
          //if (xmlhttp.status === 200) {
            app.stringXML = xmlhttp.responseXML;
            callback();
          //}
        }
      };
      xmlhttp.send();
    },

    translate: function(key, defaultValue){
      defaultValue = defaultValue || '';
      var value = null;
      if (app.stringXML) {
        var element = app.stringXML.getElementsByName(key)[0];
        if (!element) {
          return defaultValue;
        }
          
        try {
          value = element.childNodes[0].data;
          if (value === '%NULL%') return defaultValue;
        } catch(e){
          console.error(e);
          return defaultValue;
        }
        console.log('VALUE >>>>>> ',value);
      }
      return value;
    },
    
    animate: function(element,duration) { //This method need to gpu animation on webkit version 534.30
      var animationDuration = ' ' + duration/1000 + 's';
      var transition = (app.webKitVersion >= 537.36) ? 'transition' : 'webkitTransition';
      var transform = ('transform' in element.style) ? 'transform' : '-webkit-transform';
      element.style[transition] = transform + animationDuration;
      setTimeout(function(){
        element.style[transition] = '';
      },duration);
    }, 
    
    emToPx: function(em) {
      var fontSize = document.getElementsByTagName('body')[0].style.fontSize.replace('em','') * 1;
      var pxInEm = 16 * fontSize;
      pxInEm = (pxInEm >= 6) ? pxInEm : 6;
      return  em * pxInEm;
    },
    
    /*
   * protectHeader need for prevent search input focus in Android 4.3
   */
    protectHeader: function () {
      var headerBottom = document.querySelector('header').getBoundingClientRect().bottom;
      var block = document.createElement('div');
      block.style.position = 'absolute';
      block.style.top = 0;
      block.style.left = 0;
      block.style.right = 0;
      block.style.bottom = (innerHeight - headerBottom)+'px';
      block.style.zIndex = 999;
      document.body.appendChild(block);
      setTimeout(function() {
         document.body.removeChild(block);
      },300);
    }

  };

app.initialize();

if (navigator.userAgent.toLowerCase().indexOf('windows') > -1 
        || navigator.userAgent.toLowerCase().indexOf('macintosh') > -1) {
  
  
  
  app.push = {//Test push 
    notification: {},
    on: function(key,fn) {
      app.push.notification[key] = fn;
    },
    testData: {
      additionalData: {},
      message: '',
      title: ''
    }
    
  };
  
  app.notify = function() {
    app.push.notification['notification'](app.push.testData);
  };
  
  angular.element(document).ready(function() {
    app.wrapper = document.getElementsByClassName('content-wrapper')[0];
    //app.wrapper.addEventListener('scroll', TouchLib.onScroll);
    app.innerHeight = window.innerHeight;
    app.wrapper.style.height = window.innerHeight + 'px';
    app.testMonitor = document.getElementById('monitor');
    openFB.init({appId:app.fbAppId,oauthRedirectURL:'http://localhost/TOL/www/index.html',logoutURL:'http://localhost/proxy/facebook.php'});
    //app.requestFrame = window['requestAnimationFrame'] || window['webkitRequestAnimationFrame'];
    app.language = false;
    validateLanguages(navigator.language.replace(/-.+$/,''));
    //validateLanguages('pt');
    app.xmlParse(function() {
      
      app.xmlConfigParse(function(XMLConfig) {
        
        var widget = XMLConfig.getElementsByTagName('widget')[0];
        app.version = widget.getAttribute('version');
        document.querySelector('.toast-message').style.display = ''; //  element hidden until angular will not bootstraped.
        angular.bootstrap(document, ['qaalog']);
        
      });
      
    });
    
    window.onerror = function(error, path, lineNumber, symbolNumber) {
      alert('error: '+error + '\nin file:' + path + '\non: ' + lineNumber + ' ' + symbolNumber);
      
    };
    
    //setTimeout(function() {i();}, 5000);
    
  });
}


//document.addEventListener('DOMContentLoaded',function(){
//  app.wrapper = document.getElementsByClassName('content-wrapper')[0];
//  app.testMonitor = document.getElementById('monitor');
//  app.wrapper.addEventListener('scroll', function() {
//    app.testMonitor.innerHTML = ++tttt;
//  });
//});