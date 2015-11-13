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

function enableOverScroll() {
    app.X;
    app.Y;
    app.wrapper.addEventListener('touchstart',function(event){
      app.X = event.touches[0].clientX;
      app.Y = event.touches[0].clientY;
    });
    app.wrapper.addEventListener('touchmove',function(event){
      
      var top = event.touches[0].clientY - app.Y;
      if (top > 0 && app.wrapper.scrollTop <= 0) {
        if (top > 200) {
          app.wrapper.style.marginTop = '';
          return false;
        }
        app.wrapper.style.marginTop = top + 'px';
        console.log(event.touches[0].clientY - app.Y);
      }
    });
    app.wrapper.addEventListener('touchend',function(event){
       app.wrapper.style.marginTop = '';
    });
}

var app = {
    wrapper: false,
    languages: ['en','pt'],
    language: false,
    stringXML: false,
    fbAppId: '849404261841154',
    fbAppSecret: '9dea60def4c9a883d6d8eec52d1d5744',
    defaultErrorImage: 'img/error.png',
    mainPage: 'profile',
    webKitVersion: (function(){
      try{
        return /webkit.+(\d{3}\.\d{2})/.exec(navigator.userAgent.toLowerCase())[1];
      } catch(e){}
    })(),
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        document.addEventListener('DOMContentLoaded', this.resize, false);
        window.onresize = this.resize;
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        console.log('deviceready');
        app.language = false;
        validateLanguages(navigator.language.replace(/-.+$/,''));
        app.xmlParse(function(){
        app.wrapper = document.getElementsByClassName('content-wrapper')[0];
        app.wrapper.style.height = window.innerHeight+'px';
        //validateLanguages('pt');
        screen.lockOrientation('portrait');
        angular.bootstrap(document, ['qaalog']);
        window.open = cordova.InAppBrowser.open;
        openFB.init({appId: app.fbAppId});
        console.log(device);
        });
    },

    resize: function () {
      var width = window.innerWidth;
      var body = document.getElementsByTagName("body")[0];
      var size = (width / 640).toFixed(3);
      body.style.fontSize = size + 'em';
    },

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

    xmlParse: function(callback) {
      callback = callback || function(){};
      var xmlhttp = new XMLHttpRequest();
      xmlhttp.open("GET", "xml/"+app.language+"/strings.xml", true);

      xmlhttp.onload = function (e) {
        if (xmlhttp.readyState === 4) {
          //if (xmlhttp.status === 200) {
            app.stringXML = xmlhttp.responseXML;
            console.log('XML>>>', app.stringXML);
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
          console.log('default');
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
      var transition = (app.webKitVersion === '537.36') ? 'transition' : 'webkitTransition';
      var transform = ('transform' in element.style) ? 'transform' : '-webkit-transform';
      element.style[transition] = transform + animationDuration;
      setTimeout(function(){
        element.style[transition] = '';
      },duration);
    }

  };

app.initialize();

if (navigator.userAgent.toLowerCase().indexOf('windows') > -1) {
  angular.element(document).ready(function() {
    app.wrapper = document.getElementsByClassName('content-wrapper')[0];
    app.wrapper.style.height = window.innerHeight+'px';
    
    openFB.init({appId:app.fbAppId,oauthRedirectURL:'http://localhost/TOL/www/index.html',logoutURL:'http://localhost/proxy/facebook.php'});
    
    app.language = false;
    validateLanguages(navigator.language.replace(/-.+$/,''));
    //validateLanguages('pt');
    app.xmlParse(function(){
      angular.bootstrap(document, ['qaalog']);
    });
    
  });
}