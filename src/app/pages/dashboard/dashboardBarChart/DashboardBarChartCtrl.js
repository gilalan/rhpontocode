/**
 * @author Gilliard Lopes
 * created on 25/04/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.dashboard')
      .controller('DashboardBarChartCtrl', DashboardBarChartCtrl);

  /** @ngInject */
  function DashboardBarChartCtrl(baConfig, layoutPaths, baUtil) {
    
    var layoutColors = baConfig.colors;
    var graphColor = baConfig.theme.blur ? '#000000' : layoutColors.primary;
    
    var chartData = [
      {
        country: 'USA',
        visits: 3025,
        color: layoutColors.primary
      },
      {
        country: 'China',
        visits: 1882,
        color: layoutColors.danger

      },
      {
        country: 'Japan',
        visits: 1809,
        color: layoutColors.info
      },
      {
        country: 'Germany',
        visits: 1322,
        color: layoutColors.success
      },
      {
        country: 'UK',
        visits: 1122,
        color: layoutColors.warning
      },
      {
        country: 'France',
        visits: 1114,
        color: layoutColors.primaryLight
      }
    ];

    console.log('AmCharts from BarChartCtrl: ', AmCharts);

    var chart = AmCharts.makeChart('amBarChart', {
      type: 'serial',
      theme: 'blur',
      color: layoutColors.defaultText,
      dataProvider: chartData,
      valueAxes: [
        {
          axisAlpha: 0,
          position: 'left',
          title: 'Visitors from country',
          gridAlpha: 0.5,
          gridColor: layoutColors.border,
        }
      ],
      startDuration: 1,
      graphs: [
        {
          balloonText: '<b>[[category]]: [[value]]</b>',
          fillColorsField: 'color',
          fillAlphas: 0.7,
          lineAlpha: 0.2,
          type: 'column',
          valueField: 'visits'
        }
      ],
      chartCursor: {
        categoryBalloonEnabled: false,
        cursorAlpha: 0,
        zoomable: false
      },
      categoryField: 'country',
      categoryAxis: {
        gridPosition: 'start',
        labelRotation: 45,
        gridAlpha: 0.5,
        gridColor: layoutColors.border,
      },
      export: {
        enabled: true
      },
      creditsPosition: 'top-right',
      pathToImages: layoutPaths.images.amChart
    });

    console.log('chart from Bar: ', chart);

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