
 (function(cordova){
    var AndroidDialog = function() {

    };


   AndroidDialog.prototype.locationDialog = function(title,message,success,fail) {
        success = success || function(){};
        fail = fail || function(){};
        return cordova.exec(function(args) {
            success(args);
        }, function(args) {
            fail(args);
        }, 'AndroidDialog', 'locationDialog', [title, message]);
    };


    window.AndroidDialog = new AndroidDialog();
    
    // backwards compatibility
    window.plugins = window.plugins || {};
    window.plugins.AndroidDialog = window.AndroidDialog;
})(window.PhoneGap || window.Cordova || window.cordova);
