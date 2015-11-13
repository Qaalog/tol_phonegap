function BrowseTree() {

  var layout = '<div class="%uniqueClass%"'
             + 'ng-repeat="%repeat%"'
             + 'ng-fast-touch="openCategory(%item%,%level%,$event)">'
             + '<div class="subitem-browse" style="margin-left:%margin%" ng-class="'
             + '{\'opened\':%secondLevel%,\'last\':%lastLevel% > 0}">'
             + '%listName%'
             + '<span class="q-icons-category-browse" ng-fast-touch="directOpenProduct(%item%,$event)"'
             + 'ng-hide="%isLoading%"><\/span>'
             + '<span ng-show="%isLoading%"><img src="img/qaalog_loader_32x.gif"'
             + ' class="loader-small-blue" /><\/span>'
             + '<\/div></div>';

  var parent;
  var margin = 0;

  return {

    createLevel: function(element,level,item) {
      if (!item.compilied) {
        var newLayout = layout;
        var parentLevel = level - 1;
        margin = 0.5 * parentLevel;
        newLayout = newLayout.replace('%repeat%', 'item' + level + ' in item' + parentLevel + '.secondLevel');
        newLayout = newLayout.replace('%margin%', margin + 'em');
        newLayout = newLayout.replace('%uniqueClass%', 'browse-tree' + level);
        newLayout = newLayout.replace('%level%', level + 1);
        newLayout = newLayout.replace('%secondLevel%', 'item' + level + '.secondLevel[0]');
        newLayout = newLayout.replace('%lastLevel%', 'item' + level + '.lastLevel');
        newLayout = newLayout.replace('%listName%', '{{::' + 'item' + level + '.listName}}');
        newLayout = newLayout.replace(/%isLoading%/g, 'item' + level + '.isLoading');
        newLayout = newLayout.replace(/%item%/g, 'item' + level);


        setTimeout(function () {
          if (!parent) parent = angular.element(element.parentElement);
          var elementEl = angular.element(element);
          var elementScope = elementEl.scope();
          elementEl.injector().invoke(function($compile){
            var compiledElement = $compile(newLayout)(elementScope);
            elementEl.after(compiledElement);
            elementScope.$apply();
            item.compilied = true;
          });

        }, 100);

      }

    }

  }

}