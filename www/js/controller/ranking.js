tol.controller('ranking', ['$scope', 'config', 'page', 'network', 'userService', '$sce', 'feed','utils','dialog',
    function ($scope, config, page, network, userService, $sce, feed,utils,dialog) {


        $scope.imgPrefix = network.servisePathPHP + '/GetResizedImage?i=';
        $scope.imgSuffix = '&h=256&w=256';
        var currentTab = {id:'this_month',title:'TODO tm'};
        var settings = {
            name: 'ranking'
            , search: true
            , chart: true
            , tabs: true
            , rankingHeader: true
        };

        page.onShow(settings, function (params) {
            page.onRankingTabChange = onRankingTabChange;
            page.setRankingTab(currentTab);
            $scope.isAdmin = userService.checkForAdmin(userService.getAuthProduct().characteristics);
            console.log('ranking', params);
        });

        $scope.showPictureInLightBox = feed.showPictureInLightBox;
        $scope.hideValuePodiums = config.REMOVE_VALUE_PODIUMS;

        $scope.splitName = function (fullName) {
            if(!!fullName) {
                var clearedFullName = fullName.replace(/\s\s+/g, ' ');
                var splitedName = clearedFullName.split(' ');
                return $sce.trustAsHtml(splitedName[0] + '<br>' + splitedName[1]);
            }
        };

        $scope.getRankings = function (mode) {
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
                , 'limit': 3
                , 'offset': 0
                , 'my_product_id': userService.getProductId()
            };
            if(range){
                data.period = 'custom';
                data.from_date = range.dateFrom;
                data.to_date = range.dateTo;
            }
            network.post('points_given/getLeaders', data, function (result, response) {
                if (result) {
                    console.log(response);
                    $scope.ranking = response.characteristics;
                    feed.getCatalog(function(selectedCatalog){
                        page.hideLoader();
                        var showValuePodiums = false;
                        if (selectedCatalog) {
                            if (selectedCatalog.parameters && selectedCatalog.parameters.category_values !=0) {
                                showValuePodiums = true;
                            }
                        }

                        for (var i = $scope.ranking.length - 1; i >= 0; i--) {
                            if (!showValuePodiums && $scope.ranking[i].id !== 0) {
                                $scope.ranking.splice(i, 1);
                                continue;
                            }
                            if ($scope.ranking[i].places.length < 1) {
                                $scope.ranking.splice(i, 1);
                            }
                        }
                        $scope.ranking.reverse();
                        if ($scope.ranking.length < 2) {
                            page.toggleNoResults(true, 'There is no data for this '+requestMode+'.', '#eaeaea',true);
                            return false;
                        }
                        $scope.changeRanking(rankingPoint);
                    });
                }
            });
        };

        function onRankingTabChange(tab) {
            page.toggleNoResults(false);
            switch (tab.id) {
                case 'this_month':
                    page.showLoader('.ranking-header', '.footer-menu');
                    $scope.getRankings(tab.id);
                    break;
                case 'this_year':
                    page.showLoader('.ranking-header', '.footer-menu');
                    $scope.getRankings(tab.id);
                    break;
                case 'prev_month':
                    page.showLoader('.ranking-header', '.footer-menu');
                    $scope.getRankings(tab.id);
                    break;
                case 'prev_year':
                    page.showLoader('.ranking-header', '.footer-menu');
                    $scope.getRankings(tab.id);
                    break;
            }
            currentTab = tab;
        };

        $scope.getCurrentUserPlace = function (rank) {
            if (rank.places[4]) {
                var place = rank.places[4];
                var placeStr = '';
                if (place.place[place.place.length - 1] == 1) placeStr = 'st';
                if (place.place[place.place.length - 1] == 2) placeStr = 'nd';
                if (place.place[place.place.length - 1] == 3) placeStr = 'rd';
                var pointStr = (place.points == 1) ? ' point</strong> ' : ' points</strong> ';
                return $sce.trustAsHtml('You have <strong>' + place.points + pointStr + '(' + place.place + 'th place)');
            }
            for (var i = 0, l = rank.places.length; i < l; i++) {
                var place = rank.places[i];
                if (place.id * 1 === userService.getProductId()) {
                    if (typeof place.place === 'number') place.place = place.place.toString();
                    var pointStr = (place.points == 1) ? ' point</strong> ' : ' points</strong> ';
                    var placeStr = '';
                    if (place.place[place.place.length - 1] == 1) placeStr = 'st';
                    if (place.place[place.place.length - 1] == 2) placeStr = 'nd';
                    if (place.place[place.place.length - 1] == 3) placeStr = 'rd';
                    return $sce.trustAsHtml('You have <strong>' + place.points + pointStr + '(' + place.place + placeStr + ' place)');
                }

            }

            return $sce.trustAsHtml('You have no points so far');
        }

        var rankingPoint = 0;
        $scope.changeRanking = function (direction) {
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
            $scope.currentUserPlace = $scope.getCurrentUserPlace($scope.currentRanking);

        };

        $scope.showFullList = function (currentRanking) {
            page.showForResult('fullList', {tab: currentTab, category: rankingPoint, fromRankingTab:currentRanking}, function (point) {
                rankingPoint = point;
            }, true);
        };

        $scope.showProfile = function (product) {
            page.show('profile', {productId: product.id});
        };

        $scope.showWhatIsThis = function(currentRanking){
            console.log(currentRanking);
            if(currentRanking.rate_description){
                dialog.create(dialog.INFO,currentRanking.long_name,currentRanking.rate_description,'OK','').show();
            } else if(currentRanking.description){
                dialog.create(dialog.INFO,currentRanking.long_name,currentRanking.description,'OK','').show();
            }

        };

    }]);