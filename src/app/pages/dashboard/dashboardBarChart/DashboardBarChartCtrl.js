/**
 * @author Gilliard Lopes
 * created on 25/04/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.dashboard')
      .controller('DashboardBarChartCtrl', DashboardBarChartCtrl);

  /** @ngInject */
  function DashboardBarChartCtrl($scope, baConfig, layoutPaths, baUtil, dashboardDataFactory) {
    
    var layoutColors = baConfig.colors;
    var graphColor = baConfig.theme.blur ? '#000000' : layoutColors.primary;
    
    $scope.chartBarData = dashboardDataFactory.getBarData();

    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!chartData: ',  $scope.chartBarData );

    $scope.$watch(function () { return dashboardDataFactory.getBarData(); }, function (newValue, oldValue) {
      if (newValue !== oldValue) {
        $scope.chartBarData = newValue;
        console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!chartData NEW VALUE TRIGGER: ',  $scope.chartBarData );
        //Setting the new data to the graph
        chart.dataProvider = $scope.chartBarData;

        //Updating the graph to show the new data
        chart.validateData();
      }
    }); 

    //console.log('AmCharts from BarChartCtrl: ', AmCharts);

    var chart = AmCharts.makeChart('barChart', 
    {
      type: 'serial',
      dataProvider: $scope.chartBarData,
      categoryField: 'axisX',
      //theme: 'blur',
      //color: layoutColors.defaultText,
      valueAxes: [
        {
          axisAlpha: 0,
          position: 'left',
          title: 'Horas trabalhadas',
          gridAlpha: 0.5,
          gridColor: layoutColors.border,
        }
      ],
      categoryAxis: {
        gridPosition: 'start',
        labelRotation: 45,
        gridAlpha: 0.5,
        gridColor: layoutColors.border,
      },
      startDuration: 1,
      chartCursor: {
        categoryBalloonEnabled: false,
        cursorAlpha: 0,
        zoomable: false
      },
      graphs: [
        {
          valueField: 'value',
          type: 'column',
          balloonText: '<b>[[category]]: [[value]]</b>',
          fillColorsField: 'color',
          fillAlphas: 0.7,
          lineAlpha: 0.2
        }
      ],        
      export: {
        enabled: true
      },
      creditsPosition: 'top-right',
      pathToImages: layoutPaths.images.amChart
    }

    );

    // function zoomChart() {
    //   chart.zoomToDates(new Date(2013, 3), new Date(2014, 0));
    // }

    // chart.addListener('rendered', zoomChart);
    // zoomChart();
    // if (chart.zoomChart) {
    //   chart.zoomChart();
    // }
  }
})();