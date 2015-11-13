qaalog.service('httpAdapter',[function(){
    var $adapter = this;
    
    var aliases = {};
    var isArray = function(obj) {
      
      if (typeof obj !== 'string' && Array.isArray(obj)) {
        return true;
      }
      return false;
    };
    
    var _convert = function(obj) {
      
      var result = {};
      if (isArray(obj)) {
        result = [];
      }
      
      if (typeof obj === 'string') {
        return obj;
      };
      
      for (var i in obj) {
        var item = obj[i];
        if (isArray(obj)) {
          result.push( _convert(item) );
        } else {
          
          if (typeof item === 'object') {
            result[aliases[i] || i] = _convert(item);
          } else {
            result[aliases[i] || i] = item;
          }
        }
      }
      
      return result;
    };
    
    $adapter.convert = function(obj) {
      return _convert(obj);
    };
    
    
    aliases = { 'c':      'list'
              , 'd':      'description'
              , 'e':      'groupName'
              , 'f':      'favorite'
              , 'i':      'image'
              , 'n':      'name'
              , 'm':      'gallery'
              , 'o':      'organisation'
              , 'p':      'productDescription'
              , 't':      'tag'
              , 'v':      'value'

              , 'eq':     'relatedList'
              , 'hn':     'productName'
              , 'li':     'listImage'
              , 'll':     'lastLevel'
              , 'ln':     'listName'
              , 'im':     'image'
              , 'pc':     'barcode'
              , 'pe':     'likes'
              , 'ph':     'productHeader'
              , 'pi':     'productImage'
              , 'pk':     'key'
              , 'pn':     'groupName'
              , 'pl':     'productLike'
              , 'ps':     'productDescription'
              , 'pv':     'value'
              , 'tl':     'treeLevel'

              , 'cid':    'charId'
              , 'pid':    'productId'
              , 'pr1':    'price1'
              , 'pr2':    'price2'
              , 'pr3':    'price3'

             // , 'info':   'info'
              };
    
}]);