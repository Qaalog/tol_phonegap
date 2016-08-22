tol.service('utils', ['network', '$sce',
    function (network, $sce) {
        var $utils = this;
        $utils.getMonthLastDay = function(date){
            var d;
            d = new Date(date.getFullYear(),date.getMonth() + 1, 0);
            return d.getDate();
        };

        $utils.getPrevMonthRange = function(date){
            var firstDay = '01';
            var lastDay = $utils.getMonthLastDay(date);
            if(date.getMonth()==0){
                return {dateFrom:date.getFullYear()-1+'-12-'+firstDay,
                    dateTo:date.getFullYear()-1+'-12-'+lastDay};
            } else {
                return {dateFrom:date.getFullYear()+'-'+((date.getMonth()+'').length>1?date.getMonth()+'':'0'+date.getMonth())+'-'+firstDay,
                    dateTo:date.getFullYear()+'-'+((date.getMonth()+'').length>1?date.getMonth()+'':'0'+date.getMonth())+'-'+lastDay};
            }
        };

        $utils.getCurrMonthRange = function(date){
            var firstDay = '01';
            var lastDay = $utils.getMonthLastDay(date);
            return {dateFrom:date.getFullYear()+'-'+(((date.getMonth()*1+1)+'').length>1?(date.getMonth()*1+1)+'':'0'+(date.getMonth()*1+1))+'-'+firstDay,
                dateTo:date.getFullYear()+'-'+(((date.getMonth()*1+1)+'').length>1?(date.getMonth()*1+1)+'':'0'+(date.getMonth()*1+1))+'-'+lastDay};
        };

        $utils.getCurrYearRange = function(date){
            var currYear = date.getFullYear();
            return {dateFrom:currYear+'-01-01',
                dateTo:currYear+'-12-31'};
        };

        $utils.getPrevYearRange = function(date){
            var currYear = date.getFullYear();
            return {dateFrom:currYear-1+'-01-01',
                dateTo:currYear-1+'-12-31'};
        };

        $utils.getShrotMonthName = function(month){
            var monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            if(month>=0 && month<12){
                return monthNamesShort[month];
            } else {
                return false;
            }
        };
        $utils.getLongMonthName = function(month){
            var monthNames = [ 'January'
                , 'February'
                , 'March'
                , 'April'
                , 'May'
                , 'June'
                , 'July'
                , 'August'
                , 'September'
                , 'October'
                , 'November'
                , 'December'
            ];
            if(month>=0 && month<12){
                return monthNames[month];
            } else {
                return false;
            }
        };



    }]);