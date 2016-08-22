var a;
tol.controller('sql',['$scope','page',function($scope,page) {
    
  var db;
  var db_select = document.getElementById('sql_db_name');
  var settings = { name: 'sql'
                 , title: 'SQLLite tester'
                 , back: true
                 };         
        
  page.onShow(settings,function(params) {
    page.hideLoader();
    db = openDatabase(db_select.value, '1.0', 'Recent Search', 2 * 1024 * 1024);
    document.getElementById('sql_result').innerHTML = '';
  });
  
  
  db_select.addEventListener('change',function(){
    db = openDatabase(db_select.value, '1.0', 'Recent Search', 2 * 1024 * 1024);
    document.getElementById('sql_result').innerHTML = '';
  });
  
  $scope.getTables = function() {
    db.transaction(function (tx) {
      
      tx.executeSql("SELECT * FROM sqlite_master WHERE type = 'table' AND tbl_name <> '__WebKitDatabaseInfoTable__'",[],function(tx, result) {
        showResult(result,true);
      },
      function(tx, error){
        showError(error);
      });
    });
  };
  
  $scope.execute = function() {
    var sql = document.getElementById('sql_command').value;
    
    db.transaction(function (tx) {
      
      tx.executeSql(sql,[],
      
      function(tx,result){
        showResult(result);
      },
      
      function(tx, error) {
        showError(error);
      });
      
      
    });
    
  };
  
  function showResult(result,addListener) {
    var wrap = document.getElementById('sql_result');
    wrap.innerHTML = 'Success';
    try {
      if (result.rows.length > 0) {
        var header = Object.keys(result.rows.item(0));

        var tr = document.createElement('tr');
        for (var i = 0, l = header.length; i < l; i++) {
          var th = document.createElement('th');
          th.style.textAlign = 'center';
          th.style.border = '1px solid #000';
          th.style.padding = '2px';
          th.innerHTML = header[i];
          tr.appendChild(th);
        }
        wrap.appendChild(tr);
      }
    } catch(e){ alert(e); };

    try {
      if (result.rows.length > 0) {
        for (var i = 0, l = result.rows.length; i < l; i++) {
          var row = result.rows.item(i);
          var tr = document.createElement('tr');

          for (var key in row) {
            var value = row[key];
            var td = document.createElement('td');
            td.style.textAlign = 'center';
            td.style.border = '1px solid #000';
            td.style.padding = '2px';
            td.innerHTML = value;
            if (addListener && key === 'name') {
              td.addEventListener('click',function(event){
                var sql_pequest = 'SELECT * FROM ' + event.target.innerHTML;
                document.getElementById('sql_command').value = sql_pequest;
                console.log(event.target.innerHTML);
              });
            }
            tr.appendChild(td);
          }
          
          td = null;
          wrap.appendChild(tr);
        }
      }
    } catch(e){alert(e);};
  }
  
  function showError(error) {
    var wrap = document.getElementById('sql_result');
    wrap.innerHTML = '<tr><th>Code</th><th>Message</th></tr><tr><td>'+error.code+'</td><td>'+error.message+'</td></tr>';
  }
    
    
}]);