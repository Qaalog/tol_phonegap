tol.controller('fullList',['$scope','page','network','userService',function($scope, page,network,userService){
   
  var settings = { name: 'fullList'
                 , search: true
                 , chart: true
                 , tabs: true
                 , smallSearch: true
                 , smallBack: true
                 , rankingHeader: true
                 };  
  
  page.onShow(settings,function(params) {
    page.onRankingTabChange = onRankingTabChange;
    page.setRankingTab(params.tab || 'this month');
    $scope.params = params;
  });
  
  
  $scope.getRankings = function(mode) {
    var data = { 'mode': mode
               , 'limit': 300
               , 'offset': 0
               , 'my_product_id': userService.getProductId()
               };
    network.post('points_given/getLeaders',data,function(result, response) {
      page.hideLoader();
      if (result) {
        console.log(response);
        $scope.ranking = response.characteristics;
        
        for (var i = $scope.ranking.length-1; i > 0; i--) {
          if ($scope.ranking[i].places.length < 1) {
            $scope.ranking.splice(i,1);
          }
        }
        if ($scope.ranking.length < 2) {
          page.toggleNoResults(true, 'No result found.', '#eaeaea');
          return false;
        }

        $scope.changeRanking($scope.params.category);
      }
    });
  };
  
  function onRankingTabChange(tab) {
    page.toggleNoResults(false);
    switch (tab) {
      case 'this month':
        page.showLoader('.ranking-header','.footer-menu');
        $scope.getRankings('month');
        break;
      case 'year to date':
        page.showLoader('.ranking-header','.footer-menu');
        $scope.getRankings('year');
        break;
    }
  };
  
  
  var rankingPoint = 0;
  $scope.changeRanking = function(direction) {
    $scope.showPrevArrow = true;
    $scope.showNextArrow = true;
    
    if (direction === 'prev') {
      rankingPoint--;
    }
    
    if (direction === 'next') {
      rankingPoint++;
    }
    
    if (typeof direction === 'number') {
      rankingPoint = direction;
    }
    
    if (!direction) {
      rankingPoint = 0;
    }
    
    if (rankingPoint < 1) {
      rankingPoint = 0;
      $scope.showPrevArrow = false;
    }
      
    var max = $scope.ranking.length - 1;
    if (rankingPoint >= max) {
      rankingPoint = max;
      $scope.showNextArrow = false;
    }
    $scope.onResult(rankingPoint);
    $scope.currentRanking = $scope.ranking[rankingPoint];
      
  };
  
  $scope.showProfile = function(product) {
    page.show('profile',{productId: product.id});
  };
  
  page.onRequestResult(settings,function(params, onResult) {
    $scope.onResult = onResult;
  });
    
}]);