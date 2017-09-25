/**
 * @author Gilliard Lopes
 * created on 02.08.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin').factory('myDatePickerUtil', function(){
    
    var that = this,
        dayRange = [1, 31],
        months = [
          'Janeiro',
          'Fevereiro',
          'Março',
          'Abril',
          'Maio',
          'Junho',
          'Julho',
          'Agosto',
          'Setembro',
          'Outubro',
          'Novembro',
          'Dezembro'
        ];

    function changeDate (date) {
      if(date.day > 28) {
        date.day--;
        return date;
      } else if (date.month > 11) {
        date.day = 31;
        date.month--;
        return date;
      }
    };

    return {
      checkDate: function (date) {
        var d;
        if (!date.day || date.month === null || date.month === undefined || !date.year) return false;

        d = new Date(Date.UTC(date.year, date.month, date.day));
        
        if (d && (d.getMonth() === date.month && d.getDate() === Number(date.day))) {
          return d;
        }

        return this.checkDate(changeDate(date));
      },
      days: (function () {
        var days = [];
        while (dayRange[0] <= dayRange[1]) {
          days.push(dayRange[0]++);
        }
        return days;
      }()),
      months: (function () {
        var lst = [],
            mLen = months.length;

        for (var i = 0; i < mLen; i++) {
          lst.push({
            value: i,
            name: months[i]
          });
        }
        return lst;
      }())
    };
    
  });

})();
