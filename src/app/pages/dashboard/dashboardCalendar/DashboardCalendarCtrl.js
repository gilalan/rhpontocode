/**
 * @author v.lugovksy
 * created on 16.12.2015
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.dashboard')
      .controller('DashboardCalendarCtrl', DashboardCalendarCtrl);

  /** @ngInject */
  function DashboardCalendarCtrl(baConfig, appointmentAPI) {
    var dashboardColors = baConfig.colors.dashboard;
    //var dataHoje = new Date(currentDate.data.date);//data de hoje do server
    init();
    
    var $element = $('#calendar').fullCalendar({
      //height: 335,
      header: {
        left: 'prev,next today',
        center: 'title',
        right: 'month,agendaWeek,agendaDay'
      },
      //defaultDate: '2016-03-08',
      option: {
        lang: 'pt-BR'
      },
      defaultDate: '2018-02-15',
      selectable: true,
      selectHelper: true,
      select: function (start, end) {
        var title = prompt('Event Title:');
        var eventData;
        if (title) {
          eventData = {
            title: title,
            start: start,
            end: end
          };
          $element.fullCalendar('renderEvent', eventData, true); // stick? = true
        }
        $element.fullCalendar('unselect');
      },
      editable: true,
      eventLimit: true, // allow "more" link when too many events
      events: [
        {
          title: 'Correção',
          start: '2018-02-01',
          color: dashboardColors.silverTree
        },
        {
          title: 'Folga (horas adicionais)',
          start: '2018-02-07',
          end: '2018-02-10',
          color: dashboardColors.blueStone
        },
        {
          title: 'Licença médica',
          //start: '2016-03-14T20:00:00',
          start: '2018-02-14',
          color: dashboardColors.surfieGreen
        },
        {
          title: 'Ajuste',
          //start: '2016-04-01T07:00:00',
          start: '2018-03-01',
          color: dashboardColors.gossipDark
        }
      ]
    });

    function init() {
      
      appointmentAPI.getCurrentDate().then(function sucessCallback(response){

        var newDate = new Date(response.data.date);
        console.log('newDate in client from server', newDate);

      }, function errorCallback(response) {

        $scope.errorMsg = "Erro ao obter a data do servidor, tente novamente dentro de alguns segundos";
        console.log("Erro de registro: " + response.data.message);

      });

    };
  }
})();