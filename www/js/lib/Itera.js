/* Itera*/
(function Itera(window, document){
  var Itera = window.Itera || (window.Itera = {});
  
  Itera.createClass = createClass;
  Itera.createElement = createElement;
  Itera.getType = getType;
  
  function getType(obj) {
    var description = Object.prototype.toString.call(obj).toLowerCase();
    return /\s(\w+)\]/.exec(description)[1];
  };
  
  function createClass(iteraClass) {
    if (!iteraClass || typeof iteraClass.render !== 'function') {
      throw new Error("Itera.createClass: render method required");
    }
    
    iteraClass['$$iteraCalss'] = true;
    
    return iteraClass;
  }
  
  function createElement(type, attributes, child) {
    if (typeof type === 'object') {
      if (!type['$$iteraCalss']) {
        throw new Error("Itera.createElement: first argument must be string or Itera class object");
      }
      var element = type.render.call(attributes);
      return element;
    }
    
    var element = document.createElement(type);
    for (var key in attributes) {
      element.setAttribute(key, attributes[key]);
    }

    if (getType(child) === 'array') {
      for (var i = 0, l = child.length; i < l; i++) {
        if (typeof child[i] === 'object' && ('setAttribute' in child[i])) {
          element.appendChild(child[i]);
        }
        if (typeof child[i] === 'string') {
          var text = document.createTextNode(child[i]);
          element.appendChild(text);
        }
      }
      
      return element;
    }

    if (typeof child === 'string') {
      element.innerHTML = child;
    } 
    
    if (typeof child === 'object' && ('setAttribute' in child)) {
      element.appendChild(child);
    }
    
    if (typeof child === 'function') {
      element.appendChild(child());
    }
    
    return element;
  }
  
})(window, document);

/* Itera DOM*/
(function IteraDOM(window, document){
  var IteraDOM = window.IteraDOM || (window.IteraDOM = {});
  
  IteraDOM.render = DOMRender;
  IteraDOM.compile = DOMCompile;
  IteraDOM.toCompile = toCompile;
  
  var compileQueue = [];
  
  function DOMRender(iteraClass, params, rootNode, before) {
    if (arguments.length < 2) {
      throw new Error("IteraDOM.render: at least 2 arguments required");
      return false;
    }
    
    if (! ('setAttribute' in rootNode) ) {
      throw new Error("IteraDOM.render: the last argument must be node element");
      return false;
    }

    if (Itera.getType(params) !== 'array') {
      var element = iteraClass.render.call(params,params);
      
      if (before) {
        rootNode.insertBefore(element, before);
        return true;
      }
      
      rootNode.appendChild(element);
      return true;
    }
    
    for (var i = 0, l = params.length; i < l; i++) {
      var element = iteraClass.render.call(params[i], params[i]);
      
      if (before) {
        rootNode.insertBefore(element, before);
        continue;
      }
      
      rootNode.appendChild(element);
    }
    return true;

  }
  
  function DOMCompile() {
    for (var i = 0, l = compileQueue.length; i < l; i++) {
      var item = compileQueue[i];
      item.compile(item.params);
    }
    compileQueue = [];
  }
  
  function toCompile(compile, params) {
    if (typeof compile === 'function') {
      compileQueue.push({compile: compile, params: params});
    }
  }
  
})(window, document);

//function rrr() {
//  document.querySelector('#common_feed').innerHTML = '';
//  var FeedElement = React.createClass({
//    displayName: 'FeedElement',
//    
//    render: function render() {
//      return React.createElement('div', null, "Hello", this.props.name);
//    }
//  });
//  
//  var node = document.getElementById('common_feed');
//
//  ReactDOM.render(React.createElement(FeedElement, {name: 'John'}), node);
//}