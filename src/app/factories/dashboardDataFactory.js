/**
 * @author Gilliard Lopes
 * created on 11.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin').factory('dashboardDataFactory', function(){
    
    console.log('dashboardData factory');

    var field = 'Test';
    var barChartData = [];
    var lineChartData = [];

    return {
      
      getTest: function(){
      	return this.field;
      },
      setTest: function(field) {
        this.field = field;
      },
      getBarData: function(){
      	return this.barChartData;
      },
      setBarData: function(data){
        console.log('### DASHBOARDFACTORY:setando valor novo', data);
      	this.barChartData = data;
      },
      getLineData: function(){
        return this.barChartData;
      },
      setLineData: function(data){
        console.log('### DASHBOARDFACTORY:setando valor novo', data);
        this.lineChartData = data;
      }
    }
  });

})();
