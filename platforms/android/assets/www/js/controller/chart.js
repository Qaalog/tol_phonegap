tol.controller('chart', ['$scope', 'page', 'network', '$compile', 'searchService', '$timeout','$sce','$rootScope', function ($scope, page, network, $compile, searchService, $timeout,$sce,$rootScope) {

    var settings = {
        name: 'chart'
        , chart: true
        , chartActive: true
        //, searchChart: true
        , search: true
        , smallSearch: true
        , smallBack: true
    };
    $scope.imgPrefix = network.servisePathPHP + '/GetResizedImage?i=';
    $scope.imgSuffix = '&h=256&w=256';

    $scope.$on('clearSavedDataEvent',function(event){
       $scope.recognizeList = [];
    });

    $scope.recognizeList = [];

    $scope.showProfile = function(product) {
        var id = product['from_product_id'] || product.id;
        page.show('profile',{productId: id});
    };

    $scope.countRecoWrapWidth = function () {
        var elements = document.getElementsByClassName('chart-search-recognized');
        var wrap = document.getElementById('chart-search-reco-inner');
        var recognizedStripped = document.getElementsByClassName('chart recognized stripped');
        var recognizedStrippedWidth = 0;
        var scrollWrap = document.getElementById('chart-search-reco-scroll');
        var width = 0;
        if (recognizedStripped && recognizedStripped.length>0){
            recognizedStrippedWidth = recognizedStripped[0].getBoundingClientRect().width;
        }
        if (elements.length < 2) {
            wrap.style.width = innerWidth + 'px';
            return false;
        }

        for (var i = 0, ii = elements.length; i < ii; i++) {
            width += elements[i].getBoundingClientRect().width;
        }
        width+=recognizedStrippedWidth;
        if (width > innerWidth) {
            wrap.style.width = width + 'px';
        } else {
            wrap.style.width = innerWidth + 'px';
        }
        scrollWrap.scrollLeft = 0;
    }

    page.onShow(settings, function (params) {
        console.log(params);

        app.protectHeader();

        if (params.recognizeList.length) {
            $scope.recognizeList = params.recognizeList;
        }
        if (params.savedData) {
            $scope.savedData = params.savedData;
        }

        $timeout(function () {
            $scope.countRecoWrapWidth();
        },0,true);

        if (params.isBack) {
            page.hideLoader();
            return false;
        }

        $scope.tree = [];
        document.getElementById('chart_box_wrap').innerHTML = '';
        searchService.clearSearchChartInput();
        getTree();
    });

    $scope.$watchCollection('recognizeList', function(newval,oldval) {
        $rootScope.$broadcast('recognizeListChanged',newval);
    });

    $scope.$on('recognizeListChanged', function (event, value) {
        $scope.recognizeList = value;
    });
    $scope.$on('savedDataChanged', function (event, value) {
        $scope.savedData = value;
    });

    $scope.$on('clearSavedDataEvent', function (event) {
        $scope.recognizeList = [];
        $scope.savedData = {};
    });
    $scope.$on('freeMemory', function () {
    });

    $scope.recognize = function() {
        if ($scope.recognizeList.length !== 0) {
            var backPage = { name: 'feed'
                , params: {}
            };
            page.show('givePoints',{recognizeList: $scope.recognizeList,savedData:$scope.savedData, backPage: backPage});
        }
    };

    $scope.removeFromRecognizeList = function(index) {
        delete $scope.recognizeList[index].isAdded;
        $scope.recognizeList.splice(index,1);

        if(index>2){
            var wrap = document.getElementById('search-reco-inner');
            var wrapWidth = wrap.getBoundingClientRect().width;
            wrap.style.width = (wrapWidth - app.emToPx(30)) + 'px';
        }

        $timeout(function() {
            $scope.countRecoWrapWidth();
        });
    };

    $scope.splitName = function(product) {
        var fullName = product.name || product.from_product_name;
        if(!!fullName) {
            fullName = fullName.replace(/\s\s+/g, ' ');
            var splitedName = fullName.split(' ');
            return $sce.trustAsHtml(splitedName[0] + '<br>' + splitedName[1]);
        } 
        
    };

//  searchService.onSearchChart = function(value) { //fast search
//    if (value.length < 3) value = '';
//      
//    search(value);
//  } 

    /* search after enter button pressed */

    var searchValue = '';
    searchService.onSearchChart = function (value) {
        searchValue = value;
    };

    searchService.doSearchChart = function () {
        search(searchValue);
    };

    /* ----------------------------------- */

    var rows = [];

    function getTree() {
        network.post('characteristic/getTree', {}, function (result, response) {
            page.hideLoader();
            if (result) {
                console.log(response);
                $scope.tree = response;
                var wrap = document.getElementById('chart_box_wrap');
                parseTree(response, wrap);
                $compile(wrap)($scope);
                rows = findElements(wrap);

                setTimeout(function () { //tree first element auto open
                    var row = document.querySelector('.chart-row');
                    $scope.onRowClick({target: row});
                });

            }
        });
    }


    function parseTree(treeObject, wrap) {

        for (var key in treeObject) {

            var elementWrap = document.createElement('div');
            var elementBody = document.createElement('div');

            elementWrap.className = 'chart-row';
            elementBody.className = 'chart-title';

            elementBody.innerHTML = '<span class="icon t-icon_arrow_down"></span> <span class="chart_value">' + key +
                '</span> <span class="t-icon_account"></span>';

            elementWrap.appendChild(elementBody);

            if (treeObject[key].children.length !== 0) {
                var dropdown = document.createElement('div');
                dropdown.className = 'dropdown';
                parseTree(treeObject[key].children, dropdown);
                elementWrap.appendChild(dropdown);
            } else {
                elementWrap.className = 'chart-row last';

              //Ask Pedro
/*
            var last = elementWrap.getElementsByClassName('chart-title');
                if(last.length>0){
                    last[0].style = 'padding-left: 1.75em;';
                }
*/
            }

            elementWrap.setAttribute('ng-fast-touch', 'onRowClick($event)');
            elementWrap.querySelector('.t-icon_account').setAttribute('ng-fast-touch', 'onRowClick($event,true)');

            treeObject[key].description = treeObject[key].description || {};
            elementWrap.setAttribute('data-char-id', treeObject[key].description.id);
            elementWrap.setAttribute('data-char-name', key);

            wrap.appendChild(elementWrap);
        }

    }


    function findDescription(treeObject, name, id, callback) {
        callback = callback || function () {
            };
        for (var key in treeObject) {

            if (key === name) {
                treeObject[key].description = treeObject[key].description || {};
                if (treeObject[key].description.id * 1 === id * 1) {
                    callback(treeObject[key].description);
                    return true;
                }
            }

            if (treeObject[key].children) {
                findDescription(treeObject[key].children, name, id, callback);
            }
        }
    }

    function findElements(parent, name, callback) {
        var elements = [];
        callback = callback || function () {
            };
        var walker = document.createTreeWalker(parent, NodeFilter.SHOW_ELEMENT, null, false);
        while (walker.nextNode()) {
            if (walker.currentNode.className.indexOf('chart-row') > -1)
                elements.push(walker.currentNode);
        }

        return elements;
    }

    function findParents(element, ids, values) {

        if (!element) {
            return false;
        }

        if (element.className.indexOf('chart-row') > -1) {
            ids.push(element.getAttribute('data-char-id'));
            values.push(element.getAttribute('data-char-name'));
        }

        findParents(element.parentElement, ids, values);


    }


    function findWrap(element, callback) {
        callback = callback || function () {
            };

        if (element.className.indexOf('chart-row') < 0) {
            findWrap(element.parentElement, callback);
            return false;
        }

        callback(element);
    }


    function openBranch(element) {
        var parent = element.parentElement;
        if (parent) {
            if (parent.className.indexOf('chart-row') > -1) {
                parent.className = 'chart-row opened';
            }
            openBranch(parent);
        }
    }

    $scope.onRowClick = function (event, forced) {
        findWrap(event.target, function (wrap) {

            if (wrap.className.indexOf('opened') > -1 && !forced) {
                wrap.className = 'chart-row';
                return false;
            }

            if (wrap.children[wrap.children.length - 1].className.indexOf('dropdown') > -1 && !forced) {
                wrap.className = 'chart-row opened';
                return false;
            }


            var ids = [];
            var values = [];
            findParents(wrap, ids, values);

            var data = {
                'characteristic_id': ids
                , 'characteristic_value': values
            };
            console.log(data);
            $scope.selectProducts(data);


        });
    };

    $scope.selectProducts = function (data) {
        data.saveList = true;
        //data.backPage = {name:'chart'};
        page.show('searchPage', data);
    };

    function search(value) {
        for (var i = 0, l = rows.length; i < l; i++) {
            var row = rows[i];
            var charTitle = row.getElementsByClassName('chart-title')[0];
            charTitle.style.color = '';
            charTitle.style.backgroundColor = '';
            row.className = 'chart-row';
            if (row.getAttribute('data-char-name').toLowerCase().indexOf(value.toLowerCase()) > -1 && value) {
                charTitle.style.color = '#006800';
                charTitle.style.backgroundColor = '#a7d1a2';//'#edf7ed';
                openBranch(row);
            }
        }
    }


}]);