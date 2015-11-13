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

var app = {
    wrapper: false,
    languages: ['en','pt'],
    language: false,
    stringXML: false,
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

    onImgLoaded: function(target) {
      target.style.height = '';
      var width = window.innerWidth;
      var height = window.innerHeight;
      if (navigator.userAgent.toLowerCase().indexOf('windows') > -1) {
        width = 1280;
        height = 768;
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
    }

  };

app.initialize();

if (navigator.userAgent.toLowerCase().indexOf('windows') > -1) {
  angular.element(document).ready(function() {
    app.wrapper = document.getElementsByClassName('content-wrapper')[0];
    app.wrapper.style.height = window.innerHeight+'px';

    app.language = false;
    validateLanguages(navigator.language.replace(/-.+$/,''));
    //validateLanguages('pt');
    app.xmlParse(function(){
      angular.bootstrap(document, ['qaalog']);
    });
  });
}