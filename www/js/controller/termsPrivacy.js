tol.controller('termsPrivacy', ['$scope', 'config', 'page', 'network', 'device', 'userService', 'dialog', '$sce', '$timeout',
    function ($scope, config, page, network, device, userService, dialog, $sce, $timeout) {

        var settings = {
            name: 'termsPrivacy'
            , title: 'Terms Privacy'
        };

        var loadedFrames = 0;
        var framesSumHeight = 0;
        var framePrivacyHeight = 0;
        var frameTermsHeight = 0;

        page.onShow(settings, function (params) {
            if (device.isIOS() && window.StatusBar) {
                StatusBar.hide();
            }
            var user = userService.getUser();

            if(user && user.app && user.app.presets && typeof user.app.presets.parameter !='undefined'){
                var parameters = user.app.presets.parameter;
                if(parameters.privacy_page_url && typeof parameters.privacy_page_url.value !='undefined' && parameters.terms_page_url && typeof parameters.terms_page_url.value !='undefined'){
                    $scope.privacyUrl = $sce.trustAsResourceUrl(parameters.privacy_page_url.value);
                    $scope.termsUrl = $sce.trustAsResourceUrl(parameters.terms_page_url.value);
                    if(loadedFrames > 0) page.hideLoader();
                } else {
                    page.hideLoader();
                    page.show('facebookLink', page.currentParams);
                }
            } else {
                page.hideLoader();
                page.show('facebookLink', page.currentParams);
            }

            /*
             network.getOutside('http://www.teamoutloud.com/privacy',{},function(result,response){
             var tmpDiv = document.createElement('div');
             tmpDiv.innerHTML = response;
             var resultsPrivacy = tmpDiv.getElementsByTagName('article');
             $scope.privacyContent = $sce.trustAsHtml(resultsPrivacy[0].innerHTML);
             });
             */
        });

        $scope.iframeLoaded = function (event) {
            if(loadedFrames == 2){//reinit frames
                loadedFrames = 0;
                framesSumHeight = 0;
                framePrivacyHeight = 0;
                frameTermsHeight = 0;
            }
            var curHeight = event.currentTarget.contentWindow.document.body.scrollHeight;
            framesSumHeight += curHeight;
            event.currentTarget.id == 'termsFrame' ? frameTermsHeight = curHeight : framePrivacyHeight = curHeight;
            if (++loadedFrames == 2) {
                $timeout(function () {
                    $scope.framesStyle = {height: framesSumHeight + 'px'};
                    $scope.termsFrameStyle = {width: "100%", height: frameTermsHeight + 'px'};
                    $scope.privacyFrameStyle = {width: "100%", height: framePrivacyHeight + 'px'};
/*
                    var h1 = document.getElementsByClassName('privacy-page')[0].offsetHeight;
                    var h2 = document.getElementById('privacyButton');
                    h2 = parseInt(document.defaultView.getComputedStyle(h2, '').getPropertyValue('height')) +
                        parseInt(document.defaultView.getComputedStyle(h2, '').getPropertyValue('margin-top')) + parseInt(document.defaultView.getComputedStyle(h2, '').getPropertyValue('margin-bottom'));
                    var h3 = document.getElementById('privacyTitle');
                    h3 = parseInt(document.defaultView.getComputedStyle(h3, '').getPropertyValue('height')) +
                        parseInt(document.defaultView.getComputedStyle(h3, '').getPropertyValue('margin-top')) + parseInt(document.defaultView.getComputedStyle(h3, '').getPropertyValue('margin-bottom'));
                    document.getElementById('privacyDesc').style.height = h1 - h2 - h3 + 'px';
*/
                    page.hideLoader();
                },50);
            }
        };



        $scope.acceptClick = function () {
            var user = userService.getUser();
            console.log(user);
            if (user.id) {
                page.show('facebookLink', page.currentParams);
                if(typeof  user.terms_privacy_accepted!='undefined' && !user.terms_privacy_accepted
                    && typeof user.terms_privacy_revision !='undefined' && user.terms_privacy_revision){
                    network.post('user/updateProp', {prop_name:'last_terms_privacy_revision',prop_value:user.terms_privacy_revision},
                        function (result, response) {
                            if (result) {
                                page.show('facebookLink', page.currentParams);
                            } else {
                                console.log('set privacy accepted error occured');
                            }
                        });
                } else {
                    page.show('facebookLink', page.currentParams);
                }
            }
        };

    }]);

