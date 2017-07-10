tol.controller('chart',['$scope','page','network','$compile','searchService',function($scope, page,network,$compile,searchService){
   
  var settings = { name: 'chart'
                 , chart: true
                 , chartActive: true
                 //, searchChart: true
                 , search: true
                 , smallSearch: true
                 , smallBack: true
                 };  
  
  page.onShow(settings,function(params) {
    console.log(params);
    
    app.protectHeader();
    
    if (params.isBack) {
      page.hideLoader();
      return false;
    }
    
    $scope.tree = [];
    document.getElementById('chart_box_wrap').innerHTML = '';
    searchService.clearSearchChartInput();
    getTree();

  });
  
  $scope.$on('freeMemory',function(){
    
  });
  
  
//  searchService.onSearchChart = function(value) { //fast search
//    if (value.length < 3) value = '';
//      
//    search(value);
//  } 
  
  /* search after enter button pressed */
  
  var searchValue = '';
  searchService.onSearchChart = function(value) {
    searchValue = value;
  };
  
  searchService.doSearchChart = function() {
    search(searchValue);
  };
  
  /* ----------------------------------- */
  
  var rows = [];
  
  function getTree() {
    network.post('characteristic/getTree',{},function(result,response) {
      page.hideLoader();
      if (result) {
        console.log(response);
        $scope.tree = response;
        var wrap = document.getElementById('chart_box_wrap');
        parseTree(response, wrap);
        $compile(wrap)($scope);
        rows = findElements(wrap);
        
        setTimeout(function() { //tree first element auto open
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
      
      elementBody.innerHTML = '<span class="t-icon_folder"></span> <span class="chart_value">' + key + 
              '</span> <span class="t-icon_users"></span>';
      
      elementWrap.appendChild(elementBody);

      if (treeObject[key].children.length !== 0) {
        var dropdown = document.createElement('div');
        dropdown.className = 'dropdown';
        parseTree(treeObject[key].children, dropdown);
        elementWrap.appendChild(dropdown);
      }
      
      elementWrap.setAttribute('ng-fast-touch','onRowClick($event)');
      elementWrap.querySelector('.t-icon_users').setAttribute('ng-fast-touch','onRowClick($event,true)');
      
      
      treeObject[key].description = treeObject[key].description || {};
      elementWrap.setAttribute('data-char-id', treeObject[key].description.id);
      elementWrap.setAttribute('data-char-name', key);
      
      wrap.appendChild(elementWrap);
    }
     
  }
  
 
  function findDescription(treeObject, name, id, callback) {
    callback = callback || function(){};
    for (var key in treeObject) {
      
      if (key === name) {
        treeObject[key].description = treeObject[key].description || {};
        if (treeObject[key].description.id*1 === id*1) {
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
    callback = callback || function(){};
    var walker = document.createTreeWalker(parent, NodeFilter.SHOW_ELEMENT, null, false);
    while(walker.nextNode()) {
      if (walker.currentNode.className.indexOf('chart-row') > -1)
        elements.push(walker.currentNode);
    }

    return elements;
  }
  
  function findParents(element,ids,values) {
   
     if (!element) {
      return false;
    }
    
    if (element.className.indexOf('chart-row') > -1) {
      ids.push(element.getAttribute('data-char-id'));
      values.push(element.getAttribute('data-char-name'));
    }
    
    findParents(element.parentElement,ids,values);
     
    
  }
  
  
  function findWrap(element, callback) {
    callback = callback || function(){};
    
    if (element.className.indexOf('chart-row') < 0) {
      findWrap(element.parentElement,callback);
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
  
  $scope.onRowClick = function(event, forced) {
    findWrap(event.target, function(wrap){
      
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
      findParents(wrap,ids,values);

      var data = { 'characteristic_id': ids
                 , 'characteristic_value': values
                 };
                 console.log(data);
      $scope.selectProducts(data);

        
    }); 
  };
  
  $scope.selectProducts = function(data) {
    data.saveList = true;
    page.show('searchPage',data);
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