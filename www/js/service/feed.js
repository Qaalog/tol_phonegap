tol.service('feed', ['network', '$sce', 'page', 'dialog', 'facebook', 'userService', '$rootScope', 'pager', 'lightbox', 'pagerItera', '$filter','$http','config','device',
    function (network, $sce, page, dialog, facebook, userService, $rootScope, pager, lightbox, pagerItera, $filter,$http,config,device) {

        var $feed = this;
        $feed.postDetailUpdateStart = function () {
        };
        $feed.postDetailUpdateStop = function () {
        };
        var currentRepeat, currentScope, repeatsList = {};

        /* CONST */
        $feed.autoShareAllowed = [];//['BookingCom','TripAdvisor'];
        $feed.NORMAL_POST = 1;
        $feed.RECOGNITION_POST = 2;
        $feed.QUOTE_POST = 3;
        $feed.REINFORCE_POST = 4;
        $feed.URL_POST = 5;
        $feed.MULTI_RECOGNITION_POST = 6;
        $feed.NORMAL_POST_WITH_PUSH = 8;//For Oleg to show this posts in notification feed
        $feed.URL_POST_WITH_PUSH = 9;//For Oleg to show this posts in notification feed
        $feed.VOTE_POST = 7;

        $feed.EDITED_POST = 1;
        $feed.GIVED_POINTS = 2;

        $feed.LIKE_TYPE_NORMAL = 1;
        $feed.LIKE_TYPE_FACEBOOK = 2;
        $feed.LIKE_TYPE_RECOGNITION = 3;

        $feed.MESSAGE_LENGTH_TO_SHOW = 3;
        $feed.EXTERNAL_MESSAGE_LENGTH_TO_SHOW = 10;
        $feed.EXTERNAL_BOOKING_LENGTH_TO_SHOW = 4;
        $feed.MESAGE_STRING_LENGTH = 40;
        $feed.LIKES_CAN_BE_REMOVED = [$feed.LIKE_TYPE_NORMAL/*,$feed.LIKE_TYPE_FACEBOOK*/];
        $feed.AUTO_POSTS = ['CUSTOMPOST','BIRTHDAY','ANNIVERSARY','JOINED','LEFT','PHRASE'];
        /* END CONST*/

        $feed.selectedFeedItem;

        $feed.getFeed = function (repeat, params, callback) {
            callback = callback || function () {
                };
            params = params || {};
            currentScope = params.scope;
            currentRepeat = repeat;
            repeatsList[params.context] = repeat;

            var options = {
                'loaderSelector': params.loaderSelector
                , 'containerSelector': params.containerSelector
                , 'topLoaderSelector': params.topLoaderSelector
                , 'for_product_id': params['for_product_id']
                , 'context': params.context
                , 'needUpdate': params.needUpdate
                , 'callback': function () {
                    page.hideLoader();
                }
            };


            pager.start(document.getElementById(params.feedId), repeat, options);

            //page.hideLoader();

            //pagerItera.start(document.getElementById(params.feedId), repeat, options);

//    network.post('post/getEarlier?my_product_id='+userService.getProductId(),{limit:10},
//      function(result,response){
//        page.hideLoader();
//        if (result) {
//          console.time('React render: ');
//          window.Babel.render(response);
//          console.timeEnd('React render: ');
//        }
//
//      });

        };

        $feed.getHtml = function (text,sliceDisabled,isExternal,feedItem) {
            if (!text) return '';
            var bookingPosPresent = false;//Booking Positive feedback
            var bookingNegPresent = false;//Booking Negative feedback
            sliceDisabled = (sliceDisabled || false);
            isExternal = (isExternal || false);
            feedItem = feedItem || false;
            var messageLength = isExternal?$feed.EXTERNAL_MESSAGE_LENGTH_TO_SHOW:$feed.MESSAGE_LENGTH_TO_SHOW;
            if(feedItem && (typeof feedItem.auto_post_name !=='undefined')  && feedItem.auto_post_name == 'BookingCom'){
                messageLength = $feed.EXTERNAL_BOOKING_LENGTH_TO_SHOW;
                bookingPosPresent = (typeof feedItem.attachments[0].data.text_pos !== 'undefined') && feedItem.attachments[0].data.text_pos;
                bookingNegPresent = (typeof feedItem.attachments[0].data.text_neg !== 'undefined') && feedItem.attachments[0].data.text_neg;
            }

            if (page.currentPage == 'postDetails') sliceDisabled = true;
            var strippedText = false;
            if(text.length> messageLength*$feed.MESAGE_STRING_LENGTH+12 && !sliceDisabled){
                var brCount = (text.match(/<br>/g) || []).length;
                strippedText = text.slice(0,($feed.MESAGE_STRING_LENGTH*messageLength+12)-text.length)+'...';
                if(bookingPosPresent && bookingNegPresent){
                    if(text == feedItem.attachments[0].data.text_neg) strippedText += '<div class="show-full">Full post</div>';
                    if(text == feedItem.attachments[0].data.text_pos) feedItem['posWasStripped'] = true;
                } else if(bookingPosPresent){
                    if(text == feedItem.attachments[0].data.text_pos) strippedText += '<div class="show-full">Full post</div>';
                } else if(bookingNegPresent){
                    if(text == feedItem.attachments[0].data.text_neg) strippedText += '<div class="show-full">Full post</div>';
                } else {
                    strippedText += '<div class="show-full">Full post</div>';
                }
            }
            if(strippedText){
                text = strippedText;
            }
            text = text.split('\\"').join('&quot;');
            text = text.split("\\\\'").join('&lsquo;');
            text = text.split('\\\\').join('\\');
            if(bookingPosPresent && bookingNegPresent && text == feedItem.attachments[0].data.text_neg && feedItem['posWasStripped']){
                feedItem['posWasStripped'] = 'undefined';
                text += '<div class="show-full">...Full post</div>'
            }
            if(feedItem.post_type_id*1<0  && typeof feedItem.to_product_id != 'undefined' && feedItem.to_product_id && feedItem.to_product_name){
                text = text.split('##user##').join('<strong data-touch=showProfile(' + feedItem.to_product_id + ')>' + feedItem.to_product_name.trim() + '</strong>');
            }
            text = text.split('##user##').join('');
            text = text.split('##').join('</br>');
            return $sce.trustAsHtml(text);
        };
        $feed.deleteFeedItem = function (item) {

            dialog.create(dialog.QUESTION, 'Delete your post?', 'Your post will be removed from the<br>news feed. Are you sure?', 'YES', 'NO',
                function (answer) {

                    if (answer) {

                        console.log(item);

                        //currentRepeat.deleteItem(item);
                        for (var key in repeatsList) {
                            console.log(key);
                            repeatsList[key].deleteItem(item);
                        }

                        // $rootScope.$broadcast('post_deleting',item);

                        var data = {
                            deleted: 'X'

                        };
                        if(userService.canEditAllPosts && item.from_product_id!==userService.getProductId()){
                            data.cascade=1;
                        }
                        network.post('post/' + item.id, data, function (result, response) {
                            if (result) {
                                //$rootScope.$broadcast('post_deleted');

                                //network.post('post/'+item.id,{deleted: null},function(result, response){});
                                console.log(response);
                            } else {
                                //$rootScope.$broadcast('post_delete_failed',item);
                            }
                        });

                    }
                }).show();

        };

        $feed.editFeedItem = function (item) {
            page.show('post', {editItem: item});
        };

        $feed.updatePost = function (repeat, post, linkName) {
            var items = repeat.getAllItems();
            var item = null;

            for (var i = 0, l = items.length; i < l; i++) {
                if (post.id === items[i][linkName].id) {
                    item = items[i][linkName];
                    break;
                }
            }

            if (item !== null) {
                item.message = post.message;
                item.points = post.points;
                if(post.mark_count>0){
                    item.marks = post.marks;
                    item.mark_count = post.mark_count;
                } else {
                    item.mark_count = post.mark_count;
                    delete item.marks;
                }
                repeat.recompileElement(item);
            }
        };

        $feed.regenerateThumbnail = function(item){

            dialog.create(dialog.QUESTION, 'Regenerate image?', 'The image will be regenerated<br>Are you sure?', 'YES', 'NO',
                function (answer) {
                    if (answer) {
                        var itemType = $feed.getPostType(item);
                        var method = 'post/updatePointsPostImage';
                        if(itemType == 'other-auto-post'){
                            method = 'post/updateAutoPostImage';
                        }
                        network.post(method, {post_id: item.id}, function (result) {
                            page.show('feed', {});
                            network.pagerUpdate();
                        });
                    }
                }).show();
        };

        dialog.addActionListener('all', function (action) {
            switch (action) {

                case 'edit_post':
                    dialog.toggleUserMenu(false);
                    $feed.editFeedItem($feed.selectedFeedItem);
                    break;

                case 'delete_post':
                    dialog.toggleUserMenu(false);
                    $feed.deleteFeedItem($feed.selectedFeedItem);
                    break;

                case 'regenerate_thumb':
                    dialog.toggleUserMenu(false);
                    $feed.regenerateThumbnail($feed.selectedFeedItem);
                    break;
            }
        });

        $feed.showShareMenu = function (feedItem, event) {
            $rootScope.$broadcast('shareMenuShowedEvent', event);
            //var img = angular.element(event.target).scope().imageElement;
            var root = findParentElement(event.target, 'post-box');
            var img = root.querySelector('img.img.main_image');
            if (img && img.isLoaded)
                page.setTabsVisiable(false);
            facebook.toggleShareMenu(true, feedItem, img);
        };

        $feed.userMenuShow = function (feedItem) {
            if (feedItem.from_product_id * 1 !== userService.getProductId() && !userService.checkCanEditAllPosts(userService.getAuthProduct().characteristics)) {
                return false;
            }
//    feedItem.index = index;
            $feed.selectedFeedItem = feedItem;
            $feed.itemCanBeDeleted(feedItem, function(result){
                dialog.toggleUserMenu(true,!result);
            });
        };

        $feed.showWhoGivePoints = function (feedItem) {
            page.show('searchPage', feedItem);
        };

        $feed.retry = function (whatToDo,whatToDoArgs,callback,retryCount,retryTimeout) {
            var DEF_ATTEMPTS = 5;
            var DEF_TIMEOUT = 2000;
            retryCount = retryCount || DEF_ATTEMPTS;
            retryTimeout = retryTimeout || DEF_TIMEOUT;
            var attempt = 1;
            function forceAttempt(args) {
                whatToDo(function(err) {
                    console.log(attempt);
                    if (err && attempt++ < retryCount) {
                        setTimeout(forceAttempt.bind(null,args), retryTimeout);
                    } else {
                        callback.apply(null, arguments);
                    }
                },args);
            }
            forceAttempt(whatToDoArgs);
        };

        $feed.setLikeFeedItem = function (feedItem, likeType, event) {
            if($feed.getTappedByMe(feedItem, likeType) && $feed.LIKES_CAN_BE_REMOVED.indexOf(likeType)==-1){
                return false;
            }

            targetDiv = event.target.tagName.toLowerCase() == 'div' ? ((event.target.className.toLowerCase() == 'mark-inner')? event.target.parentElement:event.target) : event.target.parentElement.parentElement;
            var authUser = userService.getAuthProduct();

            var currentMarkState = {
                mark_count:feedItem.mark_count,
                marks:feedItem.marks?feedItem.marks:undefined
            };

            var applyChanges = function(feedItem,targetDiv){
                if (typeof feedItem.mark_count !== 'undefined') {
                    feedItem.mark_count = feedItem.mark_count * 1;

                    for (var i = 0; i < targetDiv.children[0].childNodes.length; i++) {
                        if (typeof targetDiv.children[0].childNodes[i].tagName !== 'undefined' && targetDiv.children[0].childNodes[i].tagName.toLowerCase() == "span" && ['t-icon_like', 't-icon_link_fb'].indexOf(targetDiv.children[0].childNodes[i].className) === -1) {
                            targetDiv.children[0].childNodes[i].innerHTML = $feed.getMarksCountByType(feedItem, likeType);
                            break;
                        }
                    }
                }
                /* else {

                    //delete feedItem.mark_count;
                }*/
                if ($feed.getTappedByMe(feedItem, likeType)) {
                    targetDiv.className.indexOf('tapped')==-1? targetDiv.className = 'tapped ' + targetDiv.className:'';
                } else {
                    targetDiv.className = targetDiv.className.split('tapped ').join('');
                }
            };

            var setMark = function(retryCallback,args){
                network.post('post/' + args.operation + '/', args.data, function (result, response) {
                    /*result = !!Math.floor(Math.random() * 2);I used it for testing retry recursion*/
                    if (result) {
                        if (typeof response.marks !== 'undefined') {
                            feedItem.marks = response.marks;
                        } else {
                            delete feedItem.marks;
                        }
                        feedItem.mark_count = response.mark_count * 1;
                        applyChanges(feedItem,targetDiv);
                        console.log(response);
                        if(page.currentPage == 'postDetails'){
                            //RFCNSKM
                            $feed.updatePost(window.repeat1,response,'feedItem');
                        };
                    } else {
                        retryCallback(true);
                    }
                });
            }
            // console.log(targetDiv);
            // console.log(targetDiv.className);
            var operation = 'addMark';
            if ($feed.getTappedByMe(feedItem, likeType) && $feed.LIKES_CAN_BE_REMOVED.indexOf(likeType)!==-1) {
                operation = 'removeMark';
            }
            if(operation == 'addMark'){
                var data = {
                    amount: 1
                    ,mark_id:likeType
                    ,my_mark:1
                    ,product_list:[{
                        from_product_header_name:authUser.header_name
                        ,from_product_image:authUser.image_url
                        ,from_product_name:authUser.name
                        ,mark_id:likeType
                        ,product_id:authUser.id
                    }]
                };
                if(feedItem.mark_count>0){
                    feedItem.mark_count++;
                    if(feedItem.marks.length>0){
                        var found = false;
                        for (var n = 0; n < feedItem.marks.length; n++) {
                            if (feedItem.marks[n].mark_id == likeType) {
                                found = ++feedItem.marks[n].amount;
                                feedItem.marks[n].my_mark = 1;
                                if(feedItem.product_list && feedItem.product_list.length){
                                    feedItem.product_list.push(data.product_list);
                                }
                                break;
                            }
                        }
                    }
                    if (!found){
                        found = 1;
                        feedItem.marks.push(data);
                    }
                } else {
                    feedItem.marks = [];
                    feedItem.mark_count = 1;
                    feedItem.marks.push(data);
                }
            } else {//delete
                if(feedItem.mark_count>=1){
                    feedItem.mark_count--;
                    if(feedItem.marks.length>0){
                        var found = false;
                        for (var n = 0; n < feedItem.marks.length; n++) {
                            if (feedItem.marks[n].mark_id == likeType && feedItem.marks[n].my_mark==1) {
                                found == --feedItem.marks[n].amount;
                                delete feedItem.marks[n].my_mark;
                                if(feedItem.product_list && feedItem.product_list.length){
                                    for(var k = 0;k<feedItem.product_list.length;k++){
                                       if(feedItem.product_list[k].id == authUser.id){
                                           feedItem.product_list.splice(k,1);
                                           break;
                                       }
                                    }
                                }
                                break;
                            }
                        }
                    }
                } else {
                    delete feedItem.marks;
                }
            }
            applyChanges(feedItem,targetDiv);
            var data = {
                'id': feedItem.id
                , 'product_id': userService.getProductId()
                , 'mark_id': likeType
            };
            $feed.retry(setMark,{data:data,operation:operation},function()
            {//callback if all attempts failed
                //console.log('restoring previous state of item!!!');
                feedItem.mark_count = currentMarkState.mark_count;
                feedItem.marks = currentMarkState.marks;
                applyChanges(feedItem,targetDiv);
            });
        };

        $feed.getTappedByMe = function (feedItem, markType) {
            var markCount = feedItem.mark_count * 1;
            var tapped = false;
            if (typeof markCount !== 'undefined' && markCount) {
                for (var n = 0; n < feedItem.marks.length; n++) {
                    if (feedItem.marks[n].my_mark && feedItem.marks[n].mark_id == markType) {
                        tapped = true;
                        break;
                    }
                }
            }
            return tapped;
        };

        $feed.getMarksCountByType = function (feedItem, markType) {
            var markCount = feedItem.mark_count * 1;
            var result = '';
            if (typeof markCount !== 'undefined' && markCount > 0) {
                for (var n = 0; n < feedItem.marks.length; n++) {
                    if (feedItem.marks[n].mark_id == markType) {
                        result = feedItem.marks[n].amount;
                        break;
                    }
                }
            }
            return result;
        };

        $feed.prepareLikes = function (feedItem, type) {
            return ($feed.getMarksCountByType(feedItem, type) || '');
        };

        $feed.getPostType = function (feedItem) {
            var result = 'normal';
            if (feedItem.auto_post_name) {
                switch (feedItem.auto_post_name) {
                    case 'TripAdvisor':
                        result = 'external-tripadvisor';
                        break;
                    case 'BookingCom':
                        result = 'external-booking';
                        break;
                    default:
                        result = 'other-auto-post';
                }
            }
            if (feedItem.parent_post){
                result = 'quote';
                if(feedItem.parent_post.auto_post_name){
                    switch (feedItem.parent_post.auto_post_name) {
                        case 'TripAdvisor':
                            result = 'quote-external-tripadvisor';
                            break;
                        case 'BookingCom':
                            result = 'quote-external-booking';
                            break;
                        default:
                            result = 'quote-other-auto-post';
                    }
                }
            }
            return result;
        };
        $feed.checkCustomPost = function(feedItem) {
            var result = false;
            if (feedItem) result = (feedItem.post_type_id*1 < 0 && feedItem.attachment_count && feedItem.attachment_count*1>0
                && feedItem.attachments[0] && feedItem.attachments[0].data && feedItem.attachments[0].data.post_type
                && feedItem.attachments[0].data.post_type.toUpperCase() == 'CUSTOMPOST') || (feedItem.post_type_id*1 < 0
                && feedItem.attachment_count && feedItem.attachment_count*1>0 && feedItem.attachments && feedItem.attachments[0]
                && feedItem.attachments[0].data && feedItem.attachments[0].data.post_name
                && $feed.AUTO_POSTS.indexOf(feedItem.attachments[0].data.post_name.toUpperCase())!==-1);
            return result;
        }

        $feed.getQuoteType = function (feedItem) {
            var result = 'quote-wrap';
            if (feedItem.parent_post) {
                if (feedItem.parent_post.auto_post_name) {
                    if($feed.checkCustomPost(feedItem.parent_post)){//Custom Post
                        return 'external-custom-post-wrap';
                    }
                    switch (feedItem.parent_post.auto_post_name) {
                        case 'Custom':
                            result = 'external-custom-post-wrap';
                            break;
                        case 'TripAdvisor':
                            result = 'external-tripadvisor-wrap';
                            break;
                        case 'BookingCom':
                            result = 'external-booking-wrap';
                            break;
/*
                        default:
                            result = 'other-auto-post';
*/
                    }
                }
                if(feedItem.parent_post.post_type_id == $feed.VOTE_POST){
                    return 'external-vote-wrap';
                }
                if (feedItem.parent_post.post_type_id && (feedItem.parent_post.post_type_id == $feed.URL_POST || feedItem.parent_post.post_type_id == $feed.URL_POST_WITH_PUSH)&& feedItem.attachment_count * 1 > 0) {
                    result = 'quote-url-wrap';
                }


            }
            return result;
        };

        $feed.getExternalQuoteName = function (feedItem) {
            var result = 'the post';
            if (feedItem.parent_post.auto_post_name) {
                switch (feedItem.parent_post.auto_post_name) {
                    case 'TripAdvisor':
                        result = 'TripAdvisor post';
                        break;
                    case 'BookingCom':
                        result = 'Booking.com post';
                        break;
                }
            }
            return result;
        };

        $feed.showPictureInLightBox = function (href) {
            lightbox.showPicture(href);
/*
 //TODO imageZoom needs the page from Julia with inpage css
            var imgContainer = window.open('partial/cut.html','_blank','location=no,enableViewportScale=true');// zoom image
            function processImage() {
                var httpData = { 'method': 'get'
                    , 'url': 'js/lib/imageZoom.js'
                };
                $http(httpData).success(function(result, status, headers) {
                    imgContainer.executeScript(
                        { code:result},function(){
                            imgContainer.executeScript({code:"inject()"},function(values){
                                console.log(values);
                            });
                        }
                    );
                });
            };
            function winClose(event) {
                imgContainer.removeEventListener('loadstop', processImage);
                clearInterval(testInterval);
                imgContainer.removeEventListener('exit', winClose);
            };
            imgContainer.addEventListener( "loadstop", processImage);
            imgContainer.addEventListener( "exit", winClose);
*/
        };

        $feed.showPostDetails = function (feedItem) {
            if (['feed','profile'].indexOf(page.currentPage)!==-1) {
                page.show('postDetails', {postId: feedItem.id, isBack: true});
            } else {
                if(feedItem.media_url || (feedItem.parent_post && feedItem.parent_post.media_url)){
                  if(feedItem.post_type_id==$feed.QUOTE_POST){
                      if(feedItem.parent_post.post_type_id && feedItem.parent_post.post_type_id==$feed.URL_POST){
                          $feed.goToLink(feedItem.parent_post.attachments[0].data.href);
                      } /*else {
                          $feed.showPictureInLightBox(feedItem.parent_post.media_url);
                      }*/

                  } else {
                      if(feedItem.post_type_id && feedItem.post_type_id==$feed.URL_POST) {
                          $feed.goToLink(feedItem.attachments[0].data.href);
                      } /*else {
                          $feed.showPictureInLightBox(feedItem.media_url);
                      }*/
                  }
                }
            }
        };

        $feed.getProductById = function(productId,callback) {
            callback = callback || function(){};
            network.get('product/'+productId,{},function(result, response){
                if (result) {
                    callback(response);
                    page.hideLoader();
                }
            },false,true);
        };
        $feed.getStatusDescription = function (feedItem) {
            feedItem.status_id = feedItem.status_id * 1;

            if (feedItem.status_id === 0) {
                return '';
            }

            if (feedItem.status_id === $feed.EDITED_POST) {
                return feedItem.from_product_name + ' edited post message';
            }

//    if (feedItem.post_type_id*1 === $feed.MULTI_RECOGNITION_POST && feedItem.status_id === $feed.GIVED_POINTS) {
//      if (feedItem.to_product_list.length > 2) {
//        return feedItem.to_product_list[0].to_product_name + ', ' + feedItem.to_product_list[1].to_product_name +
//                ' and ' + $feed.getOtherCount(feedItem.to_product_list) + ' recognized by ' + feedItem.from_product_name;
//      } else {
//        return feedItem.to_product_list[0].to_product_name + ', ' + feedItem.to_product_list[1].to_product_name + ' recognized by ' + feedItem.from_product_name;
//      }
//    
//    }
            if (feedItem.post_type_id * 1 === $feed.MULTI_RECOGNITION_POST && feedItem.status_id === $feed.GIVED_POINTS) {
                return '';
            }

            if (feedItem.status_id === $feed.GIVED_POINTS) {
                return feedItem.to_product_name + ' recognized by ' + feedItem.from_product_name;
            }
        };

        $feed.getOtherCount = function (products) {
            var count = products.length - 2;
            if (count < 1) return false;
            if (count === 1) return '1 other';
            return count + 'others';
        };

        $feed.getOtherCountHtml = function (products) {
            var result = '';
            if (typeof products !== 'undefined' && products.length > 2) {
                var count = products.length - 2;
                if (count < 1) return '';
                if (page.currentPage !== 'postDetails') {
                    result = (count === 1 ? '<span class="blue"><b> 1 other</b></span>' : '<span class="blue"><b> ' + count + ' others</b></span>');
                } else {
                    result = '<span class="blue" data-touch="scope.showProfile(feedItem.to_product_list[2].to_product_id)"><b> '+products[2].to_product_name.trim()+'</b></span>';
                    if (count > 1) {
                        result = '';
                        for(var i=2;i<products.length;i++){
                            result += '<span class="blue"  data-touch="scope.showProfile(feedItem.to_product_list['+i+'].to_product_id)"><b> '+products[i].to_product_name.trim()+'</b></span>'+',';
                        }
                        result = result.slice(0,-1)+' ';
                    }
                }
            }
            return result;
        };

        $feed.openTripAdviserPost = function (url) {
            window.open(url, '_system');
        };

        $feed.isProductOneOfProductList = function (productList) {
            for (var i = 0, ii = productList.length; i < ii; i++) {
                if (userService.getAuthProduct().id * 1 === productList[i].to_product_id * 1
                    || userService.getAuthProduct().id * 1 === productList[i].from_product_id * 1) {
                    return true;
                }
            }
            return false;
        };

        $feed.formatDate = function (dateTime) {
            var date = dateTime.split(' ')[0];
            return $filter('date')(date, 'dd MMM yyyy');
        };

        $feed.getSharePermission = function (feedItem) {
            if (feedItem.can_share * 1 > 0) {
                return true;
            }

            if (feedItem.post_type_id < 0 && typeof feedItem.auto_post_name != 'undefined' && $feed.autoShareAllowed.indexOf(feedItem.auto_post_name) !== -1) {//autoposts can be shared
                return true;
            }
//    if (feedItem.post_type_id*1 === $feed.RECOGNITION_POST) {
//      if (feedItem.from_product_id*1 !== userService.getAuthProduct().id*1 || feedItem.to_product_id*1 !== userService.getAuthProduct().id*1) {
//        return false;
//      }
//    }

            if (feedItem.from_product_id * 1 !== userService.getAuthProduct().id * 1) {
                // console.log(productTypeId, feedItem.post_type_id*1, feedItem.message);
                return false;
            }
            return true;
        };

        $feed.getYouGave = function (feedItem) {
            return 'You gave ' + (feedItem['my_points'] || 0) + ((feedItem['my_points'] == 1) ? ' point' : ' points');
        };

        $feed.preparePoints = function (feedItem) {
            //return (feedItem.points || 0) + ((feedItem.points*1 === 1) ? ' point' : ' points');
            return (feedItem.point_givers > 0 ? feedItem.point_givers : '');
        };

        $feed.goToLink = function (url) {
            window.open(url, '_system');
        };

        $feed.getItemPointsGiven = function(feedItem,callback){
            callback = callback || function(){};
            if(feedItem && feedItem.id){
                network.get('points_given',{post_id:feedItem.id,from_product_id:userService.getAuthProduct().id},function(result,response){
                    if(result){
                        console.log('itemPoints',response);
/*
                        for(var i=0;i<response.length;i++){
                            if(response[i].from_product_id != userService.getAuthProduct().id){
                                //caclculate old reinforce mesage here
                                response.splice(i,1);
                            }
                        }
*/
                        callback(true,response);
                    } else {
                        callback(false,[]);
                    }
                },false);
            } else {
                callback(false,[]);
            }

        };

        $feed.borderedUserTitle = function(feedItem,postType){
            return 'user-title  no-border-important';
/*
            postType = postType || $feed.getPostType(feedItem);
            switch (postType){
                case 'external-tripadvisor':
                    return feedItem.message?'user-title':'user-title  no-border-important';
                    break;
                case 'external-booking':
                    return feedItem.message?'user-title':'user-title  no-border-important';
                    break;
                case 'other-auto-post':
                    return 'user-title  no-border-important';
                    break;
                case 'quote-external-tripadvisor':
                    return feedItem.parent_post.message?'user-title':'user-title  no-border-important';
                    break;
                case 'quote-external-booking':
                    return feedItem.parent_post.message?'user-title':'user-title  no-border-important';
                    break;
                case 'quote-other-auto-post':
                    return 'user-title  no-border-important';
                    break;
                case 'quote':
                    return feedItem.parent_post.message?'user-title':'user-title  no-border-important';
                    break;
                default:
                    return feedItem.message?'user-title':'user-title  no-border-important';
            }
            return feedItem.message?'user-title':'user-title  no-border-important';
*/
        };

        $feed.giversFilter = function (feedItem) {
            //currUser = [userService.getAuthProduct()];
            if (feedItem.point_givers * 1 > 0) {
                return (feedItem.my_points * 1 > 0/* && feedItem.from_product_id!=userService.getAuthProduct().id*/);
            }
            return false;
        }

        $feed.toggleGivePoints = function(feedItem,givePoints){
            if($feed.giversFilter(feedItem)) {
                $feed.unrecognizeItem(feedItem);
            } else {
                if(givePoints(feedItem) === false) $feed.showPostDetails(feedItem);
            }
        };

        $feed.hideMenuLoader = function(item){
            //add <div id="{% 'userMenuLoader_' + feedItem.id%}"></div> into layouts 'user-menu t-icon_menu' div
            var el = document.getElementById('userMenuLoader_'+item.id);
            if(el){
                el.className = '';
            }
        };

        $feed.showMenuLoader = function(item){
            //add <div id="{% 'userMenuLoader_' + feedItem.id%}"></div> into layouts 'user-menu t-icon_menu' div
           var el = document.getElementById('userMenuLoader_'+item.id);
           if(el){
               el.className = 'usermenu-loader';
           }
        };

        $feed.itemCanBeDeleted = function(item,callback){
            //$feed.showMenuLoader(item);
            if(userService.canEditAllPosts) {
                callback(true);
                return;
            }//The user with Admin Role can delete all posts
            network.get('post/' + item.id, {my_product_id: userService.getProductId()}, function (result, response) {
                //$feed.hideMenuLoader(item);
                if (result) {
                    var itemUpdated = false;
                    itemUpdated = response;
                    console.log('itemUpdated:',itemUpdated);
                    var hasChilds = false;
                    if(itemUpdated && typeof itemUpdated.child_post_count !=='undefined' && itemUpdated.child_post_count*1>0){
                        hasChilds = true;
                    }
                    var amIAuthor = itemUpdated.from_product_id == userService.getAuthProduct().id;
                    var hasOthersLikes = false;
                    if(typeof itemUpdated.mark_count !=='undefined' && itemUpdated.mark_count>0 && typeof itemUpdated.marks !='undefined' && itemUpdated.marks.length>0 ){
                        for(var i=0;i<itemUpdated.marks.length;i++){
                            if(hasOthersLikes = ((itemUpdated.marks[i].amount >=1 && !itemUpdated.marks[i].my_mark) || (itemUpdated.marks[i].amount >1 && itemUpdated.marks[i].my_mark)>0)) break;
                        }
                    }
                    var hasOthersPoints = (itemUpdated.point_givers>=1 && !!!itemUpdated.my_points) || (itemUpdated.point_givers>1 && !!itemUpdated.my_points);

                    var dateLimitAlow = false;
                    //var postDateTime = new Date(item.datetime_published);
                    var tmp = itemUpdated.datetime_published.split(/[^0-9]/);
                    var postDateTime=new Date (tmp[0],tmp[1]-1,tmp[2],tmp[3],tmp[4],tmp[5] );
                    console.log(postDateTime);
                    var currentMonth = (new Date()).getMonth()
                    if(postDateTime.getMonth()== currentMonth //we are in the same month as reinforce was made
                        && ((new Date(tmp[0],tmp[1]-1,tmp[2]*1+2,tmp[3],tmp[4],tmp[5]).getMonth() == currentMonth)//and reinforce date - 2 days in the same month
                        && (itemUpdated.age_minutes/60) <= 48)){ //and reinforce age < 48 hours
                        dateLimitAlow = true;
                    }

                    callback(amIAuthor && dateLimitAlow && !hasOthersLikes && !hasOthersPoints && !hasChilds);
                } else {
                    callback(false);
                }
            });

        };
        
        $feed.itemPointsCanBeUnforced = function(item,callback){
            var result = [];
            callback = callback || function(){};
            if(item.from_product_id != userService.getAuthProduct().id){//I'm not author
                $feed.getItemPointsGiven(item,function(isOk,response){
                    if(isOk){
                        var pointsLen = response.length;
                        for(var i = 0;i<pointsLen;i++){
                            var tmp = response[i].datetime.split(/[^0-9]/);

                            pointDateTime=new Date (tmp[0],tmp[1]-1,tmp[2],tmp[3],tmp[4],tmp[5] );

                            var currentMonth = (new Date()).getMonth()
                            if(pointDateTime.getMonth()== currentMonth //we are in the same month as reinforce was made
                                && ((new Date(tmp[0],tmp[1]-1,tmp[2]*1+2,tmp[3],tmp[4],tmp[5]).getMonth() == currentMonth)//and reinforce date - 2 days in the same month
                                && (response[i].age_minutes/60) <= 48)){ //and reinforce age < 48 hours
                                    result.push(response[i]);
                            }
                        }
                        console.log(result);
                        callback(result);
                    } else {
                        callback(result);
                    }
                });
            } else {
                callback(result);
            }

            /*
             - the way to do this is by deleting the post (if it does not have any other subsequent like or reinforce or share) if its a own recognize

             - or by pressing the recognize button again to disable it in case it's a reinforce of someone elses post

             - the recognize button in the post menu bar will activate/deactivate accordingly

             - the number next to the recognize symbol is the nr of people that reinforced, not the amount of points

             - We need to have several business rules for this:

             For re-inforces (not the original recognizer):

             --- can only un-reinforce on the same monthly period as original re-inforce (even the original recognition is from past period); AND

             --- can only un-reinforce on the next 48h following the original reinforce

             For original recognition:

             - the same rules as re-inforces

             - the recognition has no re-inforces
             */


        };

        $feed.unrecognizeItem = function (feedItem) {
            $feed.itemCanBeDeleted(feedItem, function (result) {
                if (result) {
                    dialog.create(dialog.QUESTION, 'Unrecognize?', 'This action cannot be undone.', 'YES', 'NO',
                        function (answer) {
                            if (answer) {
                                console.log(feedItem);
                                for (var key in repeatsList) {
                                    console.log(key);
                                    repeatsList[key].deleteItem(feedItem);
                                }
                                var data = {
                                    deleted: 'X'
                                };

                                if(userService.canEditAllPosts && feedItem.from_product_id!==userService.getProductId()){
                                    data.cascade=1;
                                }
                                network.post('post/' + feedItem.id, data, function (result, response) {
                                    if (result) {
                                        //dialog.toggleToastMessage(true,'You have successfully deleted the post');
                                        console.log(response);
                                    }
                                });
                            }
                        }).show();

                } else {
                    $feed.itemPointsCanBeUnforced(feedItem, function (pointsToUnforce) {
                        if (pointsToUnforce.length > 0) {
                            dialog.create(dialog.QUESTION, 'Unrecognize?', 'This action cannot be undone.', 'YES', 'NO',
                                function (answer) {
                                    if (answer) {
                                        for (var i = 0; i < pointsToUnforce.length; i++) {
                                            var data = {};
                                            network.delete('points_given/' + pointsToUnforce[i].id, data, function (result, response) {
                                                if (result) {
                                                    dialog.toggleToastMessage(true, 'You have successfully unrecognized the post');
                                                    network.post('post/updatePointsPostImage', {post_id: feedItem.id}, function (result) {
                                                        network.post('post/' + feedItem.id, {update_reason: null}, function (result, response) {
                                                            network.pagerUpdate();
                                                        });
                                                    });
                                                }
                                            }, false);
                                        }
                                    }
                                }).show();
                        } else {
                            $feed.showPostDetails(feedItem);
                        }
                    });
                }
            });
        };

        $feed.getCatalog = function(callback){
            callback = callback || function(){};
            var params =  { 'app_id':  config.appId
                , 'device_id': device.getUUID() || 'pc11'
                , language:       navigator.language
            };

            network.get('entity_catalog/',params, function(result, response) {
                if (result) {
                    if (response.length === 0) {
                        page.hideLoader();
                        dialog.create(dialog.INFO, 'INFO', 'Your hotel list is empty. Please change username<br>or contact your administrator', 'OK').show();
                    }
                    var user = userService.getUser();
                    if (user) {
                        for (var i in response) {
                            if (response[i].id * 1 === user.catalog_id * 1) {
                                callback(response[i]);
                                return;
                            }
                        }
                        callback(false);
                        return;
                    }

                } else {
                    callback(false);
                }
            });
        };

    }]);