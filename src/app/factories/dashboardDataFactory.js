/**
 * @author Gilliard Lopes
 * created on 11.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin').factory('dashboardDataFactory', function(){
    
    console.log('dashboardData factory');

    var field = 'Test';
    var chartData = [];

    return {
      
      getTest: function(){
      	return this.field;
      },
      setTest: function(field) {
        this.field = field;
      },
      getData: function(){
      	return this.chartData;
      },
      setData: function(data){
      	this.chartData = data;
      }
    }
  });

})();
