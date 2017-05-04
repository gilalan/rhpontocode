/**
 * @author Gilliard Lopes
 * created on 25/04/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.dashboard')
      .controller('DashboardBarChartCtrl', DashboardBarChartCtrl);

  /** @ngInject */
  function DashboardBarChartCtrl(baConfig, layoutPaths, baUtil, dashboardDataFactory) {
    
    var layoutColors = baConfig.colors;
    var graphColor = baConfig.theme.blur ? '#000000' : layoutColors.primary;
    
    var chartData = dashboardDataFactory.getData();

    console.log('chartData: ', chartData);

    // var chartData = [
    //   {
    //     country: 'USA',
    //     visits: 50,
    //     color: layoutColors.primary
    //   },
    //   {
    //     country: 'China',
    //     visits: 31,
    //     color: layoutColors.danger

    //   },
    //   {
    //     country: 'Japan',
    //     visits: 18,
    //     color: layoutColors.info
    //   },
    //   {
    //     country: 'Germany',
    //     visits: -5,
    //     color: layoutColors.success
    //   },
    //   {
    //     country: 'UK',
    //     visits: -11,
    //     color: layoutColors.warning
    //   },
    //   {
    //     country: 'France',
    //     visits: 0,
    //     color: layoutColors.primaryLight
    //   }
    // ];

    console.log('AmCharts from BarChartCtrl: ', AmCharts);

    var chart = AmCharts.makeChart('barChart', 
    {
      type: 'serial',
      dataProvider: chartData,
      categoryField: 'country',
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
          valueField: 'visits',
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