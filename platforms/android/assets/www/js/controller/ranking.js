tol.controller('ranking',['$scope','config','page','network','userService','$sce','feed',
  function($scope,config,page,network,userService,$sce,feed){


  $scope.imgPrefix = network.servisePathPHP + '/GetResizedImage?i=';
  $scope.imgSuffix = '&h=256&w=256';
  var currentTab = 'this month';
  var settings = { name: 'ranking'
                 , search: true
                 , chart: true
                 , tabs: true
                 , rankingHeader: true
                 };         
                 
  page.onShow(settings,function(params) {
    page.onRankingTabChange = onRankingTabChange;
    page.setRankingTab(currentTab);
    $scope.isAdmin = userService.checkForAdmin(userService.getAuthProduct().characteristics);
    console.log('ranking', params);
  });
  
  $scope.showPictureInLightBox = feed.showPictureInLightBox;
  
  $scope.getRankings = function(mode) {
    var data = { 'mode': mode
               , 'limit': 3
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
        $scope.changeRanking(rankingPoint);
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
    currentTab = tab;
  };
  
  function getCurrentUserPlace(rank) {
    if (rank.places[4]) {
      var place = rank.places[4];
      var placeStr = '';
      if (place.place[place.place.length-1] == 1) placeStr = 'st';
      if (place.place[place.place.length-1] == 2) placeStr = 'nd';
      if (place.place[place.place.length-1] == 3) placeStr = 'rd';
      var pointStr = (place.points == 1)?' point</strong> ':' points</strong> ';
      return 'You have <strong>' + place.points + pointStr + '('+ place.place +'th place)';
    }
    for (var i = 0, l = rank.places.length; i < l; i++) {
       var place = rank.places[i];
       if (place.id*1 === userService.getProductId()) {
         if (typeof place.place === 'number') place.place = place.place.toString();
         var pointStr = (place.points == 1)?' point</strong> ':' points</strong> ';
         var placeStr = '';
         if (place.place[place.place.length-1] == 1) placeStr = 'st';
         if (place.place[place.place.length-1] == 2) placeStr = 'nd';
         if (place.place[place.place.length-1] == 3) placeStr = 'rd';
         return 'You have <strong>' + place.points + pointStr + '('+ place.place + placeStr +' place)';
       }
       
    }
    
    return 'You have no points so far';
  }
  
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
      $scope.showPrevArrow = false;
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
    
    $scope.currentRanking = $scope.ranking[rankingPoint];
    $scope.currentUserPlace = $sce.trustAsHtml(getCurrentUserPlace($scope.currentRanking));
      
  };
  
  $scope.showFullList = function() {
    page.showForResult('fullList',{tab: currentTab, category: rankingPoint}, function(point) {
      rankingPoint = point;
    }, true);
  };
  
  $scope.showProfile = function(product) {
    page.show('profile',{productId: product.id});
  };
  
  
}]);