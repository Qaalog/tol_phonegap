tol.controller('postDetails', ['$scope', 'page', 'userService', 'feed', 'network', 'device', 'dialog', '$rootScope',
    function ($scope, page, userService, feed, network, device, dialog, $rootScope) {

        $scope.TABS = {
            TAB_RECOGNIZED: 1,
            TAB_LIKED: 2,
            TAB_SHARED: 3
        };
        $scope.MARKS_TABS_LIST = [
            {
                type: $scope.TABS.TAB_LIKED,
                textSingular: 'like',
                text: 'likes',
                emptyText: 'Nobody liked this post so far',
                titleText: '',
                markType: feed.LIKE_TYPE_NORMAL
            },
            {
                type: $scope.TABS.TAB_SHARED,
                textSingular: 'share',
                text: 'shares',
                emptyText: 'Nobody shared this post so far',
                titleText: '',
                markType: feed.LIKE_TYPE_FACEBOOK
            },

        ];
        var settings = {
            name: 'postDetails'
            , title: 'Post Details'
            , chart: false
            , tabs: true
            , search: false
            , smallSearch: false
            , smallBack: true
        };
        var repeat, updateIntervalId = 0;

        $scope.markTabs = {
            activeTab: $scope.TABS.TAB_RECOGNIZED,
            currentFeedItem: {
                mark_count: 0,
                marks: []
            },
            hasLikes: false,
            togleTab: function (tab) {
                this.activeTab = tab;
            },
            init: function (feedItem) {
                this.currentFeedItem = feedItem;
            },
            bindEvents: function () {
                $scope.$on('itemUpdated', this.onItemUpdatedHandler)
            },
            onItemUpdatedHandler: function (event, data) {
                $scope.markTabs.currentFeedItem = data;
                console.log($scope.markTabs.currentFeedItem)
            },
            itemHasMark: function (markType) {
                var result = false;
                if (this.currentFeedItem.mark_count > 0) {
                    var marksLength = this.currentFeedItem.marks.length;
                    for (var i = 0; i < marksLength; i++) {
                        if (this.currentFeedItem.marks[i].mark_id == markType) {
                            result = true;
                            break;
                        }
                    }
                }
                return result;
            },
            getMarksCountByType: function (markType) {
                return feed.getMarksCountByType(this.currentFeedItem, markType);
            },
            getPersonListByMarkType: function (markType) {
                var result = [];
                if (this.currentFeedItem.mark_count > 0) {
                    var marksLength = this.currentFeedItem.marks.length;
                    for (var i = 0; i < marksLength; i++) {
                        if (this.currentFeedItem.marks[i].mark_id == markType) {
                            if (this.currentFeedItem.marks[i].product_list.length > 0) result = this.currentFeedItem.marks[i].product_list;
                            break;
                        }
                    }
                }
                return result;
            },

        };
        page.onShow(settings, function (params) {
            $scope.hotelName = userService.getHotelName();
            $scope.selectedCatalog = userService.getCatalogSelected();
            $scope.product = userService.getAuthProduct();
            $scope.authProductId = $scope.product.id;
            repeat = repeat || new ElRepeat(document.querySelector('#post-detail-wrap'));
            repeat.clearAll();
            getPost(params.postId || params.id);
            $scope.markTabs.bindEvents();
        });

        $scope.imgPrefix = network.servisePathPHP + '/GetResizedImage?i=';
        $scope.imgSuffix = '&w=' + Math.round(device.emToPx(4));
        $scope.imgResizedPrefix = network.servisePathPHP + 'GetResizedImage?i=';
        $scope.imgResizedSuffix = '&w=' + Math.round(innerWidth - device.emToPx(2));

        $scope.getPostAge = page.getPostAge;
        $scope.getHtml = feed.getHtml;
        $scope.showShareMenu = feed.showShareMenu;
        $scope.userMenuShow = feed.userMenuShow;
        $scope.showWhoGivePoints = feed.showWhoGivePoints;
        $scope.showPictureInLightBox = feed.showPictureInLightBox;
        $scope.getStatusDescription = feed.getStatusDescription;
        $scope.getOtherCount = feed.getOtherCount;
        $scope.getOtherCountHtml = feed.getOtherCountHtml
        $scope.isProductOneOfProductList = feed.isProductOneOfProductList;
        $scope.formatDate = feed.formatDate;
        $scope.getSharePermission = feed.getSharePermission;
        $scope.getYouGave = feed.getYouGave;
        $scope.preparePoints = feed.preparePoints;
        $scope.goToLink = feed.goToLink;
        $scope.showPostDetails = feed.showPostDetails;
        $scope.getQuoteType = feed.getQuoteType;
        $scope.setLikeFeedItem = feed.setLikeFeedItem;
        $scope.prepareLikes = feed.prepareLikes;
        $scope.getTappedByMe = feed.getTappedByMe;
        $scope.getMarksCountByType = feed.getMarksCountByType;
        $scope.feedService = feed;
        $scope.getExternalQuoteName = feed.getExternalQuoteName;
        $scope.giversFilter = feed.giversFilter;
        $scope.toggleGivePoints = feed.toggleGivePoints;
        $scope.unrecognizeItem = feed.unrecognizeItem;
        $scope.borderedUserTitle = feed.borderedUserTitle;
        $scope.getPostType = feed.getPostType;
        $scope.getProductById = feed.getProductById;
        $scope.checkCustomPost = feed.checkCustomPost;
        $scope.showProfile = function(productId) {
            page.show('profile',{productId: productId});
        };

        $scope.quoteExternal = function (feedItem) {
            selectedFeedItem = feedItem;
            var postType = 'normal';
            dialog.toggleExternalMenu(true, postType);
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
/*
                    dialog.togglePointsMenu(false);
                    selectedFeedItem.isQuotePost = true;
                    page.show('givePoints', selectedFeedItem);
*/
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
                            selectedFeedItem.savedData = $scope.savedData || {};
                            $rootScope.$broadcast('savedDataChanged', {});
                            page.show('givePoints', selectedFeedItem);
                        }
                    });

                    break;
                case 'quote_external':
                    dialog.toggleExternalMenu(false);
                    selectedFeedItem.isQuotePost = true;
                    selectedFeedItem.isQuotePostExternal = true;
                    selectedFeedItem.fromRecognizeButton = true;
                    selectedFeedItem.recognizeList = [];
                    selectedFeedItem.savedData = {};
                    $rootScope.$broadcast('recognizeListChanged', selectedFeedItem.recognizeList)
                    $rootScope.$broadcast('savedDataChanged', {});
                    page.show('givePoints', selectedFeedItem);
                    break;
            }
        });


        function getPost(id) {
            network.get('post/' + id, {my_product_id: userService.getProductId()}, function (result, response) {
                page.hideLoader();
                if (result) {
                    repeat.append([response]);
                    feed.postDetailUpdateStart(id);
                    $scope.markTabs.init(response);
                }
            });
        }

        function updatePost(id) {
            network.get('post/' + id, {my_product_id: userService.getProductId()}, function (result, response) {
                page.hideLoader();
                if (result) {
                    repeat.update([response]);
                    $rootScope.$broadcast('itemUpdated', response)
                }
            });
        }

        feed.postDetailUpdateStart = function (id) {
            updateIntervalId = setInterval(function () {
                updatePost(id);
            }, 20000);
        };

        feed.postDetailUpdateStop = function () {
            if (updateIntervalId) clearInterval(updateIntervalId);
        };

        var selectedFeedItem = false;
        $scope.givePoints = function (feedItem) {

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

        /*dialog.addActionListener(settings.name, function (action) {
            switch (action) {

                case 'new_recognition':
                    dialog.togglePointsMenu(false);

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
                    selectedFeedItem.isQuotePost = true;
                    page.show('givePoints', selectedFeedItem);
                    break;
                case 'quote_external':
                    dialog.toggleExternalMenu(false);
                    selectedFeedItem.isQuotePost = true;
                    selectedFeedItem.isQuotePostExternal = true;
                    selectedFeedItem.fromRecognizeButoon = true;
                    selectedFeedItem.recognizeList = $scope.recognizeList || [];
                    selectedFeedItem.savedData = $scope.savedData || {};
                    $rootScope.$broadcast('recognizeListChanged', selectedFeedItem.recognizeList)
                    $rootScope.$broadcast('savedDataChanged', selectedFeedItem.savedData);
                    page.show('givePoints', selectedFeedItem);
                    break;

            }
        });*/

    }]);