tol.controller('changePassword',['$scope','page','header','network','dialog','config','userService','$timeout',
  function($scope,page,header,network,dialog,config,userService,$timeout){
    
    var save;
    var testPassword;
    var settings = { name: 'changePassword'
                   , title: 'Change Password'
                   , save: true
                   , cancel: true
                   };
                   
    page.onShow(settings,function(params) {
      
      $scope.passwords = {};
      $scope.params = params || {};
      header.save = save;
      header.toggleSave(false);

      $timeout(function(){
        $scope.isInputsShow = true;
        page.hideLoader();
      },300);
    });
    
    $scope.$on('freeMemory',function(){
      $scope.isInputsShow = false;
    });
    
    testPassword = function(callback) {
      callback = callback || function(){};
      var code = userService.getUserCode() || {};
      
      var userKey = btoa((code || $scope.params.username) + ':' + $scope.passwords.old);
      console.log(code, $scope.params.username,(code || $scope.params.username) + ':' + $scope.passwords.old, $scope.passwords.old,userKey);
      network.testPassword('user/',{'__userKey':userKey},function(result,response) {
        if (result) {
          console.log('user', response);
          callback(true);
        } else {
          callback(false);
        }
      });
    };
    
    save = function() {
      
      if (!$scope.passwords.new || $scope.passwords.new === '') {
//        $scope.passwords.new = '';
//        $scope.passwords.confirm = '';
//        dialog.create(dialog.INFO,'INFO','Password cannot be empty','OK').show();
        return false;
      }
      
      if ($scope.passwords.new !== $scope.passwords.confirm) {
        $scope.confirmError = true;
        return false;
      }
      
      $scope.confirmError = false;
      
      page.showLoader();
      testPassword(function(result){
        if (result) {
          $scope.oldPasswordError = false;
          var data = { password: $scope.passwords.new
                     , 'password_reset': null
                     };
          network.post('user/'+userService.getUserId(),data,function(result, response){
            page.hideLoader();
            network.logout();
            dialog.create(dialog.INFO,'INFO','Password changed<br>Your new password is now set','OK').show();
          });
        } else {
          page.hideLoader();
          $scope.passwords.old = '';
          $scope.oldPasswordError = true;
         // dialog.create(dialog.INFO,'ERROR','Please, check old password.','OK').show();
        }
      });

      
    };
    
    $scope.onEnter = function(event) {
      if (event.keyCode === 13) {
        save();
        var inputs = document.querySelectorAll('.change-pass-input');
        for (var i = 0, l = inputs.length; i < l; i++) {
          inputs[i].blur();
        }
      }
    };
    
    $scope.validate = function() {
      if ($scope.passwords.old !== userService.getPassword()) {
        $scope.oldPasswordError = true;
        header.toggleSave(false);
        return false;
      }
      
      $scope.oldPasswordError = false;
      $scope.confirmError = false;
      if (!$scope.passwords.new || !$scope.passwords.confirm) {
        header.toggleSave(false);
        return false;
      }
      
      header.toggleSave(true);
      
    };
    
}]);