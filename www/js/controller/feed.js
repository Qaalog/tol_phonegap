tol.controller('feed', ['$scope', 'page', 'network', 'feed', 'userService', 'device', 'dialog', '$rootScope', '$filter',
    function ($scope, page, network, feed, userService, device, dialog, $rootScope, $filter) {

        var settings = {
            name: 'feed'
            , chart: true
            , tabs: true
            , search: true
        };

//  $scope.imgPrefix = network.servisePathPHP + '/GetCroppedImage?i=';
//  $scope.imgSuffix = '&h=256&w=256';
        $scope.imgPrefix = network.servisePathPHP + '/GetResizedImage?i=';
        $scope.imgSuffix = '&w=' + Math.round(device.emToPx(4));
        var repeat, savedInnerHeight = app.innerHeight;

        $scope.imgResizedPrefix = network.servisePathPHP + 'GetResizedImage?i=';
        $scope.imgResizedSuffix = '&w=' + Math.round(innerWidth - device.emToPx(2));


        $scope.$on('savedDataChanged', function (event, value) {
            $scope.savedData = value;
        });
        $scope.$on('recognizeListChanged', function (event, value) {
            $scope.recognizeList = value;
        });
        $scope.$on('setMindVisible', function (event, value) {
           $scope.isMindVisible = value;
        });
        $scope.$on('onAuthProductChanged',function(event,product){
            $scope.mindProduct = product;
        });
        $scope.clearSavedData = function () {
            $scope.recognizeList = [];
            $scope.savedData = [];
        };

        page.onShow(settings, function (params) {
            $scope.isMindVisible = true;
            $scope.authProductId = userService.getAuthProduct().id;
            $scope.canEditAllPosts = userService.checkCanEditAllPosts(userService.getAuthProduct().characteristics);
            /*
             if (window.Babel) {
             window.Babel.init($scope.imgPrefix, $scope.imgSuffix, $scope);
             }
             */
            app.innerHeight = window.innerHeight;
            if (device.isIOS()) {
                page.setTabsVisiable(true, true);
            } else {
                page.setTabsVisiable(true); // fixed short container when application started with wrong orientation
            }

            window.correct = page.setTabsVisiable;
            app.protectHeader();

            $scope.getFeed(userService.getProductId(), params.needUpdate);
            $scope.product = userService.getAuthProduct();
            $scope.userProductId = userService.getProductId();
            $scope.hotelName = userService.getHotelName();
            $scope.selectedCatalog = userService.getCatalogSelected();
            //document.querySelector('.header').style.display = 'none';
            //document.querySelector('.footer-menu').style.display = 'none';

        });

        $scope.$on('freeMemory', function () {
            $scope.feedItems = [];
        });

        $scope.$on('clearSavedDataEvent', function (event) {
            $scope.clearSavedData();
        });

        var selectedFeedItem = false;
        $scope.givePoints = function (feedItem, isMultiRecongnitionPost) {

//    feedItem.pointsForPost = true;
//    if (!feedItem.from_product_id) feedItem.isAutoPost = true;
//    if (feedItem.from_product_id && feedItem.to_product_id) feedItem.isPointPost = true;
//    if (feedItem.to_product_list && feedItem.to_product_list.length > 0) {
//      page.show('givePoints',{ recognizeList: feedItem.to_product_list
//                             , isMultiRecongnitionPost: isMultiRecongnitionPost
//                             , pointsForPost: true
//                             , postId: feedItem.id
//                             });
//      return false;
//    }
//    page.show('givePoints',feedItem);
//    return false;

            if(feedItem.to_product_list && feedItem.to_product_list.length ) {
                for(var i=0;i<feedItem.to_product_list.length;i++){
                    if(feedItem.to_product_list[i].to_product_id == $scope.product.id) return false;//if i'm in to_product_list disallow recognize
                }
            }


            if (!($scope.product.id != feedItem.from_product_id && !feedItem.my_points && $scope.product.id != feedItem.to_product_id)) {
                return false;
            }

            selectedFeedItem = feedItem;

            var postType = 'normal';
            if (!selectedFeedItem.from_product_id) {
                selectedFeedItem.isAutoPost = true;

            }

            if (selectedFeedItem.from_product_id && (selectedFeedItem.to_product_id || selectedFeedItem.to_product_list)) { //for backward compatibility with version 1.4
                selectedFeedItem.isPointPost = true;
                if(feedItem.to_product_list) {
                    selectedFeedItem.recognizeList = feedItem.to_product_list;
                    //RFCNSKM
                    for(var i=0;i<selectedFeedItem.recognizeList.length;i++){
                        selectedFeedItem.recognizeList[i].id = selectedFeedItem.recognizeList[i].to_product_id;
                    }
                    $rootScope.$broadcast('recognizeListChanged', selectedFeedItem.recognizeList)
                    selectedFeedItem.pointsForPost = true;
                    selectedFeedItem.postId = selectedFeedItem.id;
                }
                postType = 'recognition';
            }

            if (selectedFeedItem.post_type_id * 1 === feed.RECOGNITION_POST) {
                selectedFeedItem.isPointPost = true;
                postType = 'recognition';
            }

            if (selectedFeedItem.post_type_id * 1 === feed.MULTI_RECOGNITION_POST) {
                postType = 'recognition';
                console.log('feedItem', feedItem);
                selectedFeedItem = {
                    recognizeList: feedItem.to_product_list
                    , isMultiRecongnitionPost: /*isMultiRecongnitionPost*/true
                    , pointsForPost: true
                    , postId: feedItem.id

                    , category_alias: feedItem.points_alias_characteristic
                    , points_alias: feedItem.points_alias
                    , points: feedItem.points
                };
                $rootScope.$broadcast('recognizeListChanged', selectedFeedItem.recognizeList)
            }
            if(postType == 'recognition' && selectedFeedItem.points_characteristic_deleted && selectedFeedItem.points_characteristic_deleted ==1){
                return false; //disallow to reinforce post with deleted characteristic
            }

            dialog.togglePointsMenu(true, postType);

        };

        $scope.quoteExternal = function (feedItem) {
            selectedFeedItem = feedItem;
            var postType = 'normal';
            dialog.toggleExternalMenu(true, postType);
        }

        $scope.quoteExternalGeneric = function (feedItem) {
            selectedFeedItem = feedItem;
            if($scope.checkCustomPost(selectedFeedItem) && selectedFeedItem.to_product_id ){
                $scope.toggleGivePoints(selectedFeedItem,$scope.givePoints)
            } else {
                $scope.quoteExternal(selectedFeedItem);
            }
        }

        dialog.addActionListener(settings.name, function (action) {
            delete selectedFeedItem.isQuotePost;
            switch (action) {

                case 'new_recognition':
                    dialog.togglePointsMenu(false);

                    delete selectedFeedItem.make_reinforce;
                    selectedFeedItem.pointsForPost = true;

                    page.show('givePoints', selectedFeedItem);

                    break;
                case 'reinforce':
                    dialog.togglePointsMenu(false);

                    selectedFeedItem.make_reinforce = true;
                    selectedFeedItem.pointsForPost = true;
                    page.show('givePoints', selectedFeedItem);
                    break;
                case 'quote':
                    dialog.togglePointsMenu(false);
                    var productIdToCheck = selectedFeedItem.from_product_id;
                    if($scope.getPostType(selectedFeedItem) == 'other-auto-post'){
                        productIdToCheck = selectedFeedItem.to_product_id
                    }
                    $scope.getProductById(productIdToCheck, function (response) {
                        if (response) {
                            selectedFeedItem.isQuotePost = true;
                            response.isAdded = true;
                            response.productId = response.id;
                            selectedFeedItem.recognizeList = [response];
                            $rootScope.$broadcast('recognizeListChanged', [response])
                            selectedFeedItem.savedData = {};
                            $rootScope.$broadcast('savedDataChanged', {});
                            page.show('givePoints', selectedFeedItem);
                        }
                    });
                    break;
                case 'quote_external':
                    dialog.toggleExternalMenu(false);
                    selectedFeedItem.isQuotePost = true;
                    selectedFeedItem.isQuotePostExternal = true;
                    selectedFeedItem.fromRecognizeButoon = true;
                    selectedFeedItem.recognizeList = [];
                    selectedFeedItem.savedData = {};
                    if($scope.checkCustomPost(selectedFeedItem) && selectedFeedItem.to_product_id){
                        /*$scope.getProductById(selectedFeedItem.to_product_id, function (response) {
                            if (response) {
                                response.isAdded = true;
                                response.productId = response.id;
                                selectedFeedItem.recognizeList = [response];
                                $rootScope.$broadcast('recognizeListChanged', [response])
                                $rootScope.$broadcast('savedDataChanged', {});
                                page.show('givePoints', selectedFeedItem);
                            }
                        });*/
                        $scope.toggleGivePoints(selectedFeedItem,$scope.givePoints);
                    } else {
                        $rootScope.$broadcast('recognizeListChanged', selectedFeedItem.recognizeList)
                        $rootScope.$broadcast('savedDataChanged', selectedFeedItem.savedData);
                        page.show('givePoints', selectedFeedItem);
                    }
                    break;
            }
        });

        $scope.getPostAge = page.getPostAge;
        $scope.getHtml = feed.getHtml;
        $scope.showShareMenu = feed.showShareMenu;
        $scope.userMenuShow = feed.userMenuShow;
        $scope.showWhoGivePoints = feed.showWhoGivePoints;
        $scope.setLikeFeedItem = feed.setLikeFeedItem;
        $scope.showPictureInLightBox = feed.showPictureInLightBox;
        $scope.getStatusDescription = feed.getStatusDescription;
        $scope.getOtherCount = feed.getOtherCount;
        $scope.getOtherCountHtml = feed.getOtherCountHtml;
        $scope.openTripAdviserPost = feed.openTripAdviserPost;
        $scope.isProductOneOfProductList = feed.isProductOneOfProductList;
        $scope.formatDate = feed.formatDate;
        $scope.getSharePermission = feed.getSharePermission;
        $scope.getYouGave = feed.getYouGave;
        $scope.preparePoints = feed.preparePoints;
        $scope.prepareLikes = feed.prepareLikes;
        $scope.goToLink = feed.goToLink;
        $scope.getTappedByMe = feed.getTappedByMe;
        $scope.getMarksCountByType = feed.getMarksCountByType;
        $scope.feedService = feed;
        $scope.getQuoteType = feed.getQuoteType;
        $scope.getExternalQuoteName = feed.getExternalQuoteName;
        $scope.getProductById = feed.getProductById;
        $scope.showPostDetails = feed.showPostDetails;
        $scope.giversFilter = feed.giversFilter;
        $scope.toggleGivePoints = feed.toggleGivePoints;
        $scope.unrecognizeItem = feed.unrecognizeItem;
        $scope.borderedUserTitle = feed.borderedUserTitle;   
        $scope.getPostType = feed.getPostType;
        $scope.checkCustomPost = feed.checkCustomPost;
        $scope.showProfile = function (productId) {
            page.show('profile', {productId: productId});
        };

        $scope.showUserPosts = function (feedItem) {
            var productId = feedItem['from_product_id'] || feedItem['to_product_id'];

            if (feedItem['from_product_id'] && feedItem['to_product_id']) {
                productId = feedItem['to_product_id'];
            }

            if (productId * 1 === userService.getProductId()) {
                page.show('profile', {tab: 'posts'});
                return false;
            }

            page.show('profile', {productId: productId, tab: 'posts'});
        };

        $scope.mindShowMenu = function () {
            dialog.toggleMindMenu(true);
        };

        $scope.getFeed = function (id, needUpdate) {
            repeat = repeat || new ElRepeat(document.querySelector('#common_feed'));//Valera's library Init
            window.repeat1 = repeat;
            var data = {
                'my_product_id': id
                , 'feedId': 'common_feed'
                , 'loaderSelector': 'feed_loader'
                , 'topLoaderSelector': 'top_loader'
                , 'containerSelector': 'feed_container'
                , 'context': 'feed'
                , 'needUpdate': needUpdate
            };

            feed.getFeed(repeat, data, function (feedItems) {
                $scope.feedItems = feedItems;
                page.hideLoader();
            });
        };

    }]);

