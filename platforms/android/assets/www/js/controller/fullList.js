tol.controller('fullList',['$scope','page','network','userService','utils','config',function($scope, page,network,userService,utils,config){
   
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
    page.setRankingTab(params.tab || {id:'this_month',title:'TODO tm'});
    $scope.params = params;
    $scope.listIsNotEmpty = false;
  });

  $scope.getRankings = function(mode) {
    var requestMode = 'month';
    var range = false;
    var currDate = new Date();
    switch(mode){
      case 'prev_month':
        range = utils.getPrevMonthRange(currDate);
        break;
      case 'this_month':
        range = utils.getCurrMonthRange(currDate);
        break;
      case 'prev_year':
        requestMode = 'year';
        range = utils.getPrevYearRange(currDate);
        break;
      case 'this_year':
        requestMode = 'year';
        range = utils.getCurrYearRange(currDate);
        break;

    }
    var data = {
      'mode': requestMode
      , 'limit': 300
      , 'offset': 0
      , 'my_product_id': userService.getProductId()
    };
    if(range){
      data.period = 'custom';
      data.from_date = range.dateFrom;
      data.to_date = range.dateTo;
    }
    network.post('points_given/getLeaders',data,function(result, response) {
      page.hideLoader();
      if (result) {
        console.log(response);
        $scope.ranking = response.characteristics;
        for (var i = $scope.ranking.length-1; i >= 0; i--) {
          if (config.REMOVE_VALUE_PODIUMS && $scope.params.fromRankingTab.rate_type =='Best Giver' &&
              ($scope.ranking[i].id !== 0 || $scope.ranking[i].rate_type !== 'Best Giver')) {
            $scope.ranking.splice(i, 1);
            continue;
          }
          if ($scope.ranking[i].places.length < 1) {
            $scope.ranking.splice(i,1);
          }
        }
        if (config.REMOVE_VALUE_PODIUMS) $scope.ranking.reverse();
        var bestRecieverIndex = false;
        if (config.REMOVE_VALUE_PODIUMS && $scope.params.fromRankingTab.rate_type =='Best Receiver'){
          for (var i = $scope.ranking.length-1; i >= 0; i--) {
            if ($scope.ranking[i].rate_type && $scope.ranking[i].rate_type == 'Best Receiver' ){
              bestRecieverIndex = i;
              break;
            }
          }
        }
        if (config.REMOVE_VALUE_PODIUMS && $scope.params.fromRankingTab.rate_type =='Best Giver' && $scope.ranking.length < 1){
          $scope.listIsNotEmpty = false;
          page.toggleNoResults(true, 'There is no data for this '+requestMode+'.', '#eaeaea',true);
          return false;
        } else if(config.REMOVE_VALUE_PODIUMS && $scope.params.fromRankingTab.rate_type !='Best Giver' && $scope.ranking.length < 2){
          $scope.listIsNotEmpty = false;
          page.toggleNoResults(true, 'There is no data for this '+requestMode+'.', '#eaeaea',true);
          return false;
        } else {
          $scope.listIsNotEmpty = true;
        }
        if(bestRecieverIndex){
          $scope.changeRanking(bestRecieverIndex);
        } else {
          $scope.changeRanking($scope.params.category);
        }
        if(config.REMOVE_VALUE_PODIUMS && $scope.params.fromRankingTab.rate_type =='Best Giver'){
          $scope.showPrevArrow = false;
          $scope.showNextArrow = false;
        }
      }
    });
  };
  
  function onRankingTabChange(tab) {
    page.toggleNoResults(false);
    switch (tab.id) {
      case 'this_month':
        page.showLoader('.ranking-header','.footer-menu');
        $scope.getRankings(tab.id);
        break;
      case 'this_year':
        page.showLoader('.ranking-header','.footer-menu');
        $scope.getRankings(tab.id);
        break;
      case 'prev_month':
        page.showLoader('.ranking-header','.footer-menu');
        $scope.getRankings(tab.id);
        break;
      case 'prev_year':
        page.showLoader('.ranking-header','.footer-menu');
        $scope.getRankings(tab.id);
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