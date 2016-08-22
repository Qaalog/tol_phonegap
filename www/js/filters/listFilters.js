tol.filter('listFilterByTag', function() {
    return function(tagArray,tagArrayIndex,inArray,tag,disabled) {
        var result = {data:[],index:false};
        if(tagArray && typeof tagArrayIndex!='undefined' && inArray && tag && typeof disabled !='undefined'){
            if(disabled) return {data:[true],index:false};
            inputLength=inArray.length;
            for (var i=0; i<inputLength; i++) {
                if (+inArray[i][tag] == +tagArray[tagArrayIndex][tag]) {
                    result = {data:[inArray[i]],index:i};
                    break;
                }
            }
        }
        return result;
    }
});
