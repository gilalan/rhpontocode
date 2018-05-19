/**
 * @author Gilliard Lopes
 * created on 21/04/2016
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.entities', [
  	'BlurAdmin.pages.entities.institutions',
  	'BlurAdmin.pages.entities.campus',
  	'BlurAdmin.pages.entities.sectors'
	])
  .config(routeConfig);

  /** @ngInject */
  function routeConfig($stateProvider) {
  	$stateProvider
      .state('entities', {
        url: '/entities',
        //templateUrl: 'app/pages/entities/entities.html',
        template: '<ui-view  autoscroll="true" autoscroll-body-top></ui-view>',
        abstract: true,
        title: 'Entidades',
        sidebarMeta: {
          icon: 'ion-android-home',
          order: 10,
        },
        accessLevel: [4, 5]
      });
  }

})();