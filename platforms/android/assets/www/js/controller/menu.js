tol.controller('menu',['$scope','page','menu','device','$timeout','network','facebook','$sce',
  function($scope,page,menu,device,$timeout,network,facebook,$sce){
    
    $scope.isIOS = device.isIOS;
    
    var settings = { name: 'menu'
                   , title: 'menu'
                   , back: true
                   };
    page.onShow(settings,function(params) {
      page.hideLoader();
    });
    
    $scope.fonts = [];
    
    $scope.fontView = function() {
      var parent = document.getElementById('test1');
      parent.style.display = 'none';
      for (var i = 59648; i < 60138; i++) {
        var hex = i.toString(16);
        var div = document.createElement('div');
        div.innerHTML = 'icon: <span class="q-icon">&#x'+hex+';</span>  hex: '+hex;
        parent.appendChild(div);
      }
      parent.style.display = '';
    };
    
    $scope.sqlTester = function() {
      page.show('sql',{});
    };

    
  
    
}]);

