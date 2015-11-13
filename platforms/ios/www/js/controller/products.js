qaalog.controller('products', ['$scope','network', 'page', 'config', 'device',
  'httpAdapter', '$timeout', 'search', 'menu', 'pager', '$sce',
  function($scope, network, page, config, device, httpAdapter, $timeout, search, menu, pager,$sce) {
    
    $scope.STYLE_LIST = 1;
    $scope.STYLE_GRID = 0;
    $scope.isIOS = device.isIOS;
    
    var getCatalogConfig;
    var createUser;
    var getProductTree;
    var getProductFromCategory;
    var getNearbyProducts;
    var onTabChange;
    var onSearch;
    var listOffset;
    var barcodeAutoSearch;
    var stopAutosearch = false;
    var barcodeAutocompleteClearFlag = false;
    var imgWidth = Math.round(device.emToPx(38));
    var imgHeight = Math.round(device.emToPx(20));
    var readPCVs;
    var tree;

    $scope.scanButtonTitle = app.translate('barcode_input_info_button','Press scan button');
    $scope.inputTitle = app.translate('barcode_input_info_number','or type barcode number');
    $scope.scanButtonLabel = app.translate('barcode_button_scan_label','scan');

    $scope.imgPrefix = network.servisePath+'GetResizedImage?i=';
    $scope.imgSufix = '&w='+imgWidth+'&h='+imgHeight;
    $scope.elementHeight;
    $scope.listStyle = $scope.STYLE_GRID;
    $scope.products = [];
    $scope.productTree = [];
    //$scope.window = window;
    
    $scope.activeView = {};
    
    
    var settings = { name:           'products'
                   , title:          'products'
                   , back:           true
                   , tabs:           true
                   , search:         true
                   , menu:           true
                   , extendedHeader: true
                   , swipeHeader:    true
                   };

    page.onShow(settings,function(params) {
      $scope.loadDownHidden = true;
      console.log('product params',params);
      page.setAnimationStyle(0);
      //if (params.db === 'Qaalog_PapaLeguas') page.setAnimationStyle(2);
      //if (params.db === 'Qaalog_Agrovinhos') page.setAnimationStyle(1);
      //if (params.db === 'Qaalog_Farmacias') page.setAnimationStyle(4);
      tree = new BrowseTree();
      $scope.products = [];
      $scope.isTabBoxHide = false;
      if (params.canBackDisable) {
        page.hideBackBtn();
        page.navigatorPop();
        menu.hideChangeCatalog();
      }

      if (typeof $scope.unwatchProducts === 'function') {
        $scope.unwatchProducts();
      }
      
      if (typeof $scope.unwatchBrowse === 'function') {
        $scope.unwatchBrowse();
      }
      
      listOffset = 0;
      search.onSearch = onSearch;
      page.onTabChange = onTabChange;
      menu.setIsSortable(true);
      menu.setListViewChangeEnabled(true);
      
      page.setTitle(params.name);
      page.setExtendedImage(params.image);
      if (!params.isBack) {
        delete params.maxRows;
        delete params.startRow;
        delete params.tab;
        $scope.resultVisiable = true;
      } else {
        $scope.resultVisiable = !params.resultVisiable;
        if (!$scope.resultVisiable) page.hideExtendedHeader();
      }
      
      $scope.currentParams = params;
      menu.setParams(params);

      
      getCatalogConfig($scope.currentParams,function(catalogConfig){

        $scope.tabs = [{name: 'list', value: app.translate('main_menu_option_list','List')}];
        $scope.catalogConfig = {};
        for (var i in catalogConfig) {
          var item = catalogConfig[i];
          $scope.catalogConfig[item.key] = item.value;
          if (item.key === 'toggle_characteristic_group')
            $scope.tabs.splice(1,0,{name: 'browse', value: app.translate('main_menu_option_product_tree','Browse')});
          if (item.key === 'has_barcode')
            $scope.tabs.push({name: 'barcode', value: app.translate('main_menu_option_barcode','Barcode')});
          if (item.key === 'proximity_meters')
            $scope.tabs.push({name: 'nearMe', value: app.translate('main_menu_option_near','Near me')});
        }
        page.setTabs($scope.tabs);

        $scope.activeView = {};
        page.setTab($scope.currentParams.tab || 'list');

        if ($scope.tabs.length < 2) {
          page.setTabsVisiable(false);
          $scope.isTabBoxHide = true;
        }
        
        
        
        var upperLoaderOnToggle = function(state) {
          console.log('toggle',state);
          $scope.loadDownHidden = state;
        };
        
        $scope.pagerOptions = { scope:               $scope
                              , ajaxMethod:          'searchProducts'
                              , itemClass:           'products'
                              , listName:            'products'
                              , marginRule:          ($scope.listStyle === $scope.STYLE_GRID) ? {value:1,type:'em'} : 0
                              , upperLoaderOnToggle: upperLoaderOnToggle
                              };
      
        menu.sort = function(direction) {
          $scope.currentParams.sortDirection = direction;
          delete $scope.currentParams.state;
        };
        
        $scope.unwatchProducts = $scope.$watch('products',function(){
          if ($scope.products.length === 0) {
             page.showNoResult('No result found');
          } else {
            page.hideNoResult();
          }
        });
        
        $scope.unwatchBrowse = $scope.$watch('productTree',function(){
          if ($scope.productTree.length === 0) {
            page.showNoResult();
          } else {
            page.hideNoResult();
          }
        });
        
        menu.onChangeViewStyle = function(style){
          $scope.listStyle = style;

          var rule = (style === $scope.STYLE_GRID) ? {value:1,type:'em'} : 0;

          var listViewSize = Math.floor(device.emToPx(14));
          console.log(listViewSize);
          $scope.imgPrefix = (style === $scope.STYLE_GRID) ? network.servisePath+'GetCroppedImage?i=' : network.servisePath+'GetResizedImage?i=';
          $scope.imgSufix = (style === $scope.STYLE_GRID) ? '&w='+imgWidth+'&h='+imgHeight : '&w='+listViewSize+'&h='+listViewSize;
          delete $scope.currentParams.state;
          return true;
        };
        
        if ($scope.currentParams.state) {
          $timeout(function () {
            pager.loadState($scope.currentParams.state, $scope.pagerOptions);
            delete $scope.currentParams.state;
          }, 200);
          return true;
        }
        pager.startPager($scope.pagerOptions);
        
      });
      
    });

    $scope.$on('freeMemory',function(){
      console.log('freeMemory PRODUCTS');
      if (typeof $scope.unwatchProducts === 'function') {
        $scope.unwatchProducts();
      }

      if (typeof $scope.unwatchBrowse === 'function') {
        $scope.unwatchBrowse();
      }
      $scope.products = [];
      $scope.productTree = [];
      $scope.nearProducts = [];
      document.getElementById('barcode-input').blur();
    });
    
    
    onTabChange = function(view,outerProducts) {

      if (network.getActiveRequestsCount() > 0) {
        network.setAbortBlock(true);
      }
      if (Object.keys($scope.activeView)[0] !== view) {
        
        if (Object.keys($scope.activeView)[0] === 'list') {
          pager.pause();
        }

        page.resetHeaderTop();

        $scope.activeView = {};
        $scope.activeView[view] = true;
        
        
        page.toggleSearchIcon(false);
        page.hideNoResult();
        menu.setIsSortable(false);
        menu.setListViewChangeEnabled(false);
        $scope.loadDownHidden = true;
        switch (view) {
          case 'list':
            menu.setIsSortable(true);
            menu.setListViewChangeEnabled(true);
            page.toggleSearchIcon(true);
            pager.play();
            page.playSwipeHeader();
            $scope.currentParams.tab = 'list';
            
            if (!$scope.currentParams.isBack) {

              createUser($scope.currentParams,function(userId){
                network.setUserId(userId);
              });

              if (!outerProducts) {
                
                
              } else {
                $scope.products = outerProducts;
                outerProducts = false;
              }
              
            }
            
            $scope.currentParams.isBack = false;
            break;
          case 'browse':
            page.hideExtendedHeader();
            page.pauseSwipeHeader();
            page.showLoader();
            $scope.currentParams.tab = 'browse';
          //  if (!$scope.currentParams.isBack) {
              getProductTree($scope.currentParams,function(productTree){
                page.hideLoader();
                $scope.productTree = productTree;
              });
            //}
            $scope.currentParams.isBack = false;
            break;
          case 'nearMe':
            page.hideExtendedHeader();
            page.pauseSwipeHeader();
            $scope.currentParams.tab = 'nearMe';
            page.showLoader();
            getNearbyProducts({},function(products){
              $scope.nearProducts = products;
              console.log('NEAR',products);
            });
            break;
          case 'barcode':
            page.hideExtendedHeader();
            page.pauseSwipeHeader();
            $scope.currentParams.tab = 'barcode';
            $scope.barcode = {};
            $scope.barcodeAutocomplete = [];
            break;
        };
      }
    };

    $scope.selectProduct = function(product) {
      $timeout(function(){
        network.getConnection();
      });
      product = product || {};
      console.log('SELECT',product);

      if (product.tag > 1) {
        $scope.openGroupsChar(product);
        return false;
      }

      product.db = $scope.currentParams.db;
      page.show('productDetail',product);
    };

    
    $scope.openGroupsChar = function(product) {
      product = product || {};
      product.db = $scope.currentParams.db;
      product.name = $scope.currentParams.name;
      page.show('groups',product);
    };
    
    getCatalogConfig = function(params,callback) {
      callback = callback || function(){};
      network.get('GetCatalogConfig',{catalogDB: params.db},function(result, response) {
       if (result) {
         callback(httpAdapter.convert(response));
       } else {
         
       }
     });
    };
    
    createUser = function(params,callback) {
      callback = callback || function(){};
      var data = { catalogDB: params.db
                 , did:       device.getUUID() || 'asdqwe'
                 , osn:       device.getPlatform()
                 , osv:       device.getPlatformVersion() || '0'
                 , n:         'buildbot'
                 , e:         ''
                 , f:         ''
                 };
      network.get('CreateUser',data,function(result, response){
        if (result) {
          callback(response);
        } else {
          
        }
      });
    };
    
    $scope.i = 0;
    $scope.searchProducts = function(pagerOptions,callback) {
      callback = callback || function(){};
      var data = { catalogDB:   $scope.currentParams.db
                 , searchTerm:  $scope.currentParams.searchTerm || ''
                 , sort:        $scope.currentParams.sortDirection || 'A'
                 , maxRows:     pagerOptions.maxRows || 75
                 , startRow:    pagerOptions.startRow || 1
                 };
      network.get('Search', data, function(result, response){
        if(result) {
          page.showExtendedHeader();
          if (typeof response === 'string') {
            document.getElementsByClassName('title')[0].style.transition = '';
            $scope.loadDownHidden = true;
            pager.stopPager();
            page.hideLoader();
            try {
              document.getElementsByClassName('product-load-down')[0].remove();
            } catch (e){};
            $timeout(function(){
              page.hideExtendedHeader();
              page.setNoResultText(app.translate('main_menu_option_no_data_in_catalog','Sorry, there are no data in the catalog'));
              page.hideMenu();
              page.hideSearch();
              page.setResultsTitle('No results for ');
            });
          }
          if (response.length < 1) {
            page.setResultsTitle('No results for ');
            if ($scope.localSearchTerm) {
              page.setNoResultText( (app.translate('main_menu_option_no_result_found_for','No results found for')) + ': ' + $scope.localSearchTerm);
            } else {
              page.setNoResultText(app.translate('main_menu_option_no_data_in_catalog','Sorry, there are no data in the catalog'));
            }
          }
          for (var i in response) {
            var item = response[i];
            item.index = $scope.i++;
          }
          if (response.length < (pagerOptions.maxRows || 75) ) {
            $scope.loadDownHidden = true;
          } else {
            $scope.loadDownHidden = false;
          }
          callback(httpAdapter.convert(response));
          
          page.hideLoader();
        } else {
          
        }
      });
    };
    
    getNearbyProducts = function(pager,callback) {
      callback = callback || function(){};

      network.getGeoPosition(function(result,coords) {
        
        if (!coords) {
          console.error('NO COORDS');
          $timeout(function(){
            if (device.isAndroid()) {
              try {
                window.plugins.AndroidDialog.locationDialog(app.translate('product_near_location_off_title','No service')
                  ,app.translate('product_near_location_off_message','This functionality requires location services on. Would you like to open location settings?'));
              } catch (e) {}
            }
            page.hideLoader();
            page.showNoResult(app.translate('product_near_no_location_message','Couldn\'t get your location :('));
            page.setOnNoResultClick(function(){
              page.hideNoResult();
              page.showLoader();
              getNearbyProducts(pager,callback);
            });
          });
          return false;
        }
        page.showLoader();
        var data = { catalogDB:   $scope.currentParams.db
                   , mr:    pager.maxRows || 20
                   , sr:    pager.startRow || 1
                   , lt:    coords.latitude //|| '38.7166700'
                   , lg:    coords.longitude //|| '-9.1333300'
                   , md:    $scope.catalogConfig['proximity_meters'] || 50000
                   };
        network.get('GetNearbyProducts', data, function(result, response){
          if(result) {
            page.hideNoResult();
            if (response.length < 1) {
              page.hideLoader();
              page.showNoResult(app.translate('product_near_no_results_message','Nothing found in a vicinity of %s meters from you :(').replace('%s',$scope.catalogConfig['proximity_meters'] || 50000));
              return false;
            }
            for (var i in response) {
              var item = response[i];
              item.index = $scope.i++;
            }
            page.hideLoader();
           
            callback(httpAdapter.convert(response));
          } else {

          }
        });
        
      });
      
    };
    var loadingItem = {};
    
    $scope.openCategory = function(item,treeLevel,event) {
      event = event || {stopPropagation: function(){}};
      if (item.lastLevel < 1) {

        network.stopAll();
        loadingItem.isLoading = false;
        loadingItem = item;

        item.isLoading = true;

        if (!item.secondLevel) {
          item = item || {};
          item.db = $scope.currentParams.db;
          item.treeLevel = treeLevel;
          getProductTree(item,function(productTreeSecondLevel){
            if (typeof productTreeSecondLevel === 'string') {
              item.isLoading = false;
              network.showErrorAlert();
              return false;
            }
            if (productTreeSecondLevel.length === 0) item.lastLevel = 1;
            item.secondLevel = productTreeSecondLevel;
            item.isLoading = false;
            console.log(productTreeSecondLevel);
            tree.createLevel(event.target,treeLevel,item);
          },event.target);
        } else {
          delete item.secondLevel;
          item.isLoading = false;
        }
      } else {
        item.isLoading = false;
        var PCVs = readPCVs(event.target);
        $scope.openProduct(item,event,PCVs);
      }
    };

    $scope.directOpenProduct = function(item,event) {
      network.stopAll();
      loadingItem.isLoading = false;
      loadingItem = item;
      item.isLoading = true;
      item = item || {};
      item.db = $scope.currentParams.db;
      getProductTree(item,function(productTreeSecondLevel){
        item.isLoading = false;
        var parent = event.target.parentElement;
        var PCVs = {pc: parent.getAttribute('data-pc'), pcv: parent.getAttribute('data-pcv')};
        $scope.openProduct(item,event,PCVs);
      },event.target.parentElement);

    };

    
    $scope.openProduct = function(item,event,PCVs) {
      event.stopPropagation();
     // if (item.barcode) productPCs.push(item.barcode);
    //  if (item.pcv) productPCVs.push(item.pcv);
      $scope.currentParams = $scope.currentParams || {};
      $scope.currentParams.pcs = PCVs.pc; //productPCs.join();
      $scope.currentParams.pcvs = PCVs.pcv;//productPCVs.join();
      var data = { params: $scope.currentParams
                 , list: false
                 , item: item
                 , ajaxMethod: 'getProductFromCategory'
                 };
      
      page.show('browseProduct',data);
      productPCs = [];
      productPCVs = [];
    };
    
    var productPCs = [];
    var productPCVs = [];

    var productPCs1 = [];
    var productPCVs1 = [];

    readPCVs = function(element) {
      var parent = element.parentElement;
      parent = parent.parentElement;
      parent = parent.firstElementChild;

      console.log('parent',parent);
      if (parent) {
        var pc = parent.getAttribute('data-pc');
        var pcv = parent.getAttribute('data-pcv');

        return {pc: pc, pcv: pcv};
      }
    };

    var writePCVs = function(element,params) {

      var oldPCVs = readPCVs(element);
      oldPCVs = oldPCVs || {};
      console.log('old', oldPCVs);

      if (oldPCVs.pc) {
        params.barcode = oldPCVs.pc + ',' + params.barcode
      }

      if (oldPCVs.pcv) {
        params.pcv = oldPCVs.pcv + ',' + params.pcv
      }

      element.setAttribute('data-pc', params.barcode);
      element.setAttribute('data-pcv', params.pcv);
    };
    
    getProductTree = function(params,callback,element) {
      callback = callback || function(){};
      console.log(element);
      var PCVs = {};
      if (element) {
        writePCVs(element,params);
        PCVs = {pc: element.getAttribute('data-pc'), pcv: element.getAttribute('data-pcv')};
      }
    //  if (params.barcode && productPCs[productPCs.length-1] !== params.barcode) productPCs.push(params.barcode);
      //if (params.pcv  && productPCVs[productPCVs.length-1] !== params.pcv) productPCVs.push(params.pcv);
      console.log(PCVs);

      var data = { catalogDB:  params.db
                 , pc:         PCVs.pc || ''
                 , pcv:        PCVs.pcv || ''
                 , tl:         params.treeLevel || 1
                 };
      network.get('GetProductTreeLevelChildren', data, function(result, response){
        if(result) {
          callback(httpAdapter.convert(response));
        } else {

        }
      });
    };

    var navigatorFlag = false;
    onSearch = function(searchTerm) {
      $scope.currentParams = $scope.currentParams || {};
      $scope.currentParams.searchTerm = searchTerm;
      $scope.localSearchTerm = searchTerm;
      $scope.products = [];
      pager.stopPager();
      pager.startPager($scope.pagerOptions);
      $scope.resultVisiable = false;
      page.setResultsTitle(app.translate('main_menu_option_result_for','Result for') +' ');
      if (!navigatorFlag) {
        navigatorFlag = true;
        page.navigatorPush(function () {
          page.showLoader();
          delete $scope.currentParams.searchTerm;
          pager.stopPager();
          pager.startPager($scope.pagerOptions);
          $scope.resultVisiable = true;
          navigatorFlag = false;
        });
      }
 
    };
    
    $scope.toogleLikes = function(item) {
      console.log(item);
      if (item.currentLike === undefined) item.currentLike = 0;
      item.likes = (item.currentLike > 0) 
          ? --item.likes : ++item.likes;
          
      item.currentLike = (item.currentLike === 0) ? 1 : 0;
      var data = { catalogDB: $scope.currentParams.db
                 , uid:       network.getUserId()
                 , pid:       item.id
                 , on:        item.currentLike
                 , glat:      ''
                 , glong:     ''
                 };
      network.get('ToggleEndorsementProduct',data,function(result,response){
        
      });
      
    };
    
    $scope.showBarScanner = function() {
      cordova.plugins.barcodeScanner.scan(
      function (result) {
        $scope.$apply(function(){
          $scope.barcode = { value: +result.text
                           , format: result.format
                           };

          $scope.barcodeSearch($scope.barcode.value,true);
        });
        
      }, 
      function (error) {
          alert("Scanning failed: " + error);
      });
      
    };
    $scope.barcodeAutocompleteRequests = 0;
    
    $scope.barcodeSearch = function(value,doAutoSearch) {
        if (value === null || value === 0) {
          //page.navigatorPop();
          $scope.barcode.value = null;
          $scope.barcodeAutocomplete = [];
          return false;
        }
        value = value + '';
        if (value.length > 0) {
          $scope.barcodeAutoCompLoaderVisiable = true;
          $scope.barcodeAutocompleteVisiable = true;
          var data = {
            catalogDB: $scope.currentParams.db
            , st: value
            , mr: 3
          };
          $scope.barcodeAutocompleteRequests++;
          if ($scope.barcodeAutocompleteRequests > 1) {
            network.stopAll();
            if (network.getActiveRequestsCount() > 0) {
              network.setAbortBlock(true);
            }
          }
          $timeout(function(){

            //window.stop();
          },1000);
          network.get('SearchBarcode', data, function (result, response) {
            $scope.barcodeAutocompleteRequests--;
            console.log('barcodeAutocompleteRequests',$scope.barcodeAutocompleteRequests);
            $scope.barcodeAutoCompLoaderVisiable = false;
            if (!$scope.barcodeFlag) {
              $scope.barcodeAutocomplete = httpAdapter.convert(response);
            }
            if ($scope.barcodeAutocomplete.length === 1) {
              $scope.currentBarcodeItem = $scope.barcodeAutocomplete[0];
              if (doAutoSearch) {
                $timeout(function () {
                  document.getElementById('barcode-input').blur();
                  barcodeAutoSearch();
                });
              }
            } else {
              $scope.currentBarcodeItem = false;
            }
            if ($scope.barcodeAutocomplete.length < 1 && !$scope.barcodeFlag) {
              $scope.barcodeAutocomplete.push({groupName: app.translate('barcode_input_no_results', 'No results found')});
            }
            console.log('BARCODE', $scope.barcodeAutocomplete);
          });
        } else {
          $scope.barcodeAutocomplete = [];
        }
    };

    $scope.barcodePaddingTop = '5em';
    $scope.barcodeInputFocus = function(value) {
     // if (!$scope.isIOS()) {
        $scope.barcodeFlag = false;
        $scope.inputStarted = true;
        page.setTabsVisiable(false);
        $scope.barcodePaddingTop = '0';
      //} else {
      //
      //  $timeout(function(){
      //    console.log('scroll');
      //    window.scrollTo(0,250);
      //  },300);
      //
      //  StatusBar.hide();
      //}

      if (!value) value = '';
      value = value + '';
      if (!$scope.barcodeAutocomplete[0] && !device.isIOS()) {
        page.navigatorPush(function() {
          $scope.barcodeAutocomplete = [];
          $scope.barcode.value = null;
        });
      }
      if (value.length > 0) {
        $scope.barcodeSearch(value);
      }
      
    };

    barcodeAutoSearch = function() {
      if ($scope.currentBarcodeItem) {
        $scope.selectProductByBarcode($scope.currentBarcodeItem);
        $scope.currentBarcodeItem = false;
       // page.navigatorPop();
        return true;
      }

      //$timeout(function(){
      //  document.getElementById('barcode-input').blur();
      //});

    };

    $scope.clearBarcodeAutocomplete = function() {
      $scope.barcodeAutocomplete = [];
    };

    $scope.barcodeOnBlur = function() {
      //if ($scope.isIOS()) {
      //  StatusBar.show();
      //}

      $scope.inputStarted = false;
      page.setTabsVisiable(true);
      $scope.barcodePaddingTop = '5em';
      if ($scope.barcodeAutocompleteRequests > 0) {
        //$scope.clearBarcodeInput();
        //if (!device.isIOS())
        //  page.navigatorPop();
        //return false;
        //window.stop();
      }
      $timeout(function(){
        if (!barcodeAutocompleteClearFlag) {
          $scope.clearBarcodeAutocomplete();
          barcodeAutocompleteClearFlag = false;
        }
      },100);
      $timeout(function(){
        if (!stopAutosearch) {
          barcodeAutoSearch();
        }
        stopAutosearch = false;
      },300);

      if (!device.isIOS())
        page.navigatorPop();
    };

    $scope.onBarcodeKeyPress = function(event) {
      if (!$scope.barcode.value || $scope.barcode.value === null || $scope.barcode.value === '') {
        $scope.barcodeAutocomplete = [];
      }
      if (event.keyCode === 13) {
          if (device.isIOS())
            document.getElementById('barcode-input').blur();
      }
    };
    $scope.barcodeFlag = false;
    $scope.clearBarcodeInput = function() {
      stopAutosearch = true;
      $timeout(function(){
        if (device.isIOS()) {
          document.getElementById('barcode-input').blur();
        }
        $scope.barcodeFlag = true;
        $scope.barcode.value = '';
        $scope.barcodeAutoCompLoaderVisiable = false;
        $scope.clearBarcodeAutocomplete();
      });
     // page.navigatorPop();
    };
    
    $scope.barcodeFilter = function(code,layout) {
      if (!code || !layout) return '';
      code = code + '';
      layout = layout + '';
      var first = code.slice(0,code.indexOf(layout));
      var last = code.slice(code.indexOf(layout) + layout.length,code.length);
      //console.log('First: '+first,'Last: '+last,'Code: '+code,'layout.length: '+layout.length);
      return $sce.trustAsHtml(first + '<span>' + layout + '</span>' + last);
    };

    $scope.selectProductByBarcode = function(item) {


      item = item || {};

      item.id = item.productId;
      delete item.productId;
      console.log('BARCODE SELECT',item);
      if (!item.id) {
        return false;
      }
      $scope.selectProduct(item);
      $scope.clearBarcodeInput();

    };
    
}]);

