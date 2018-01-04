/*-------------------------------------------------------------------------------
* Name:        app.js
* Purpose:     The main application.
*
* Author:      PNDA Team
* Created:     2016/04/01
* History:     2016/04/01 - Initial commit
*              2016/05/18 - Added functionality to copy text to the clipboard
*
* Copyright (c) 2016 Cisco and/or its affiliates.
*
* This software is licensed to you under the terms of the Apache License,
* Version 2.0 (the "License").  You may obtain a copy of the License at
* http://www.apache.org/licenses/LICENSE-2.0
*
* The code, technical concepts, and all information contained herein, are the
* property of Cisco Technology, Inc. and/or its affiliated entities, under
* various laws including copyright, international treaties, patent, and/or
* contract. Any use of the material herein must be in accordance with the terms
* of the License. All rights not expressly granted by the License are reserved.
*
* Unless required by applicable law or agreed to separately in writing,
* software distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*-------------------------------------------------------------------------------*/

var consoleFrontendApp = angular.module('consoleFrontendApp', [
    'ngRoute',
    'appServices',
    'appControllers',
    'ngCookies',
    'login',
    'logout',
    'appFilters',
    'appComponents',
    'ngSanitize',
	'angularUtils.directives.dirPagination'
  ])
  .provider('ConfigService', function () {
    var options = {};
    this.config = function (opt) {
      angular.extend(options, opt);
    };

    this.$get = [function () {
      if (!options) {
        throw new Error('Config options must be configured');
      }

      return options;
    }];
  }).config(['$httpProvider', function($httpProvider) {
    $httpProvider.defaults.withCredentials = true;
  }])
  .config(['$routeProvider',
    function($routeProvider) {
      $routeProvider.
        when('/', {
          templateUrl: 'partials/curated-view.html',
          controller: 'MetricListCtrl'
        }).
        when('/login', {
          templateUrl: 'partials/login.html',
          controller: 'LoginCtrl'
        }).
        when('/logout', {
          template: " ",
          controller: 'LogoutCtrl'
        }).
        when('/applications', {
          templateUrl: 'partials/applications.html',
          controller: 'ApplicationCtrl'
        }).
        when('/metrics', {
          templateUrl: 'partials/metric-list.html',
          controller: 'MetricListCtrl'
        }).
        when('/packages', {
          templateUrl: 'partials/package-management.html',
          controller: 'PackageManagementCtrl'
        }).
        when('/packages/:packageName', {
          templateUrl: 'partials/package-details.html',
          controller: 'PackageManagementCtrl'
        }).
        when('/datasets', {
          templateUrl: 'partials/datasets.html',
          controller: 'DatasetsCtrl'
        }).
        otherwise({
          redirectTo: '/'
        });
    }]);

consoleFrontendApp.run(function($rootScope, $location, $cookies, $http, ConfigService, HelpService, ModalService) {
  $rootScope.globals = $cookies.get('globals') || {};
  var userName = $cookies.get('userLoggedIn');
  
  $rootScope.$on('$routeChangeStart', function() {
    var userName = $cookies.get('userLoggedIn');

    if (userName !== undefined && userName) {
      $("#navWelcomeText").text('Welcome, ' + $cookies.get('user') + '  ');
      $("#navWelcomeText").append('<span class="caret"></span>');
      $(".role").remove();

      //$(".dropdown-menu").prepend('<li class="role"><a href="#">' + $cookies.get('userRole') + '</a></li>');
    } else {
      $location.path('/login');
    }

    // redirect to login page if not logged in and trying to access a restricted page
    var restrictedPage = $.inArray($location.path(), ['/login']) === -1;

  });
  
  $rootScope.pageHelp = function() {
    HelpService.showHelp('Page', $location.$$path);
  };
  
  $rootScope.versionInfo = function() {
    ModalService.showPndaInfo(ConfigService);
  };

});

// manually bootstrap the app when the document is ready and both config files have been loaded
function bootstrapApplication() {
  angular.element(document).ready(function() {
    angular.bootstrap(document, ["consoleFrontendApp"]);

    // enable 'copy to clipboard' functionality on all buttons with the copy-to-clipboard class
    new Clipboard('.copy-to-clipboard');
  });
}

(function loadConfigFilesAndBootstrapTheApp() {
  var initInjector = angular.injector(["ng"]);
  var $http = initInjector.get("$http");
  $http.get('conf/config.json')
    .then(function(json) {

      consoleFrontendApp.config(['ConfigServiceProvider', function (ConfigServiceProvider) {
        ConfigServiceProvider.config(json.data);
      }]);

      return $http.get('conf/dummy-metrics.json');
    })
    .then(function(json) {

      consoleFrontendApp.config(['ConfigServiceProvider', function (ConfigServiceProvider) {
        ConfigServiceProvider.config(json.data);
      }]);

      return $http.get('conf/PNDA.json');
    })
    .then(function(json) {

      consoleFrontendApp.config(['ConfigServiceProvider', function (ConfigServiceProvider) {
        var userInterfaces = json.data.user_interfaces;
        delete json.data.user_interfaces;
        json.data.user_interfaces = undefined;
        ConfigServiceProvider.config(json.data);
        var userInterfacesIndex = {};
        if (userInterfaces !== undefined) {
          for (var i = 0; i < userInterfaces.length; i++) {
            var userInterface = userInterfaces[i];
            if (userInterface.name !== undefined && userInterface.link !== undefined) {
              userInterfacesIndex[userInterface.name] = userInterface.link;
            }
          }
        }

        ConfigServiceProvider.config({ userInterfaceIndex: userInterfacesIndex });
      }]);

      bootstrapApplication();
    });
}());
