/*-------------------------------------------------------------------------------
* Name:        LoginCtrl.js
* Purpose:     Controller for the login panel.
*
* Author:      PNDA Team
* Created:     2016/04/01
* History:     2016/04/01 - Initial commit
*              2016/05/17 - Removed the use of global variables for modules
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

angular.module('login').controller('LoginCtrl', ['$scope', '$http', '$location', '$rootScope', '$cookies', '$window',
  'ConfigService', function($scope, $http, $location, $rootScope, $cookies, $window, ConfigService) {

    $scope.login = function() {

      var path;
      if (ConfigService.login_mode === 'PAM') {
        path = '/pam/validate';
      }

      var dataMan = ConfigService.backend["data-manager"];
      var host = dataMan.host;
      var port = dataMan.port;

      var data = $.param({
        username: $scope.username,
        password: Base64.encode($scope.password)
      });

      $http({
        url: 'http://' + host + ':' + port + path,
        method: 'POST',
        data: data,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })
      .then(function successCallback(response) {
        if (response.data.success) {
          var authdata = Base64.encode($scope.username);
          $rootScope.globals = {
            currentUser: {
              username: $scope.username,
              authdata: authdata
            }
          };
          
          // $http.defaults.headers.common['Authorization'] = 'Basic ' + authdata;

          // add to cookies
          var expireDate = new Date();
          expireDate.setDate(expireDate.getDate() + 1);
          $cookies.put('userLoggedIn', true, { expires: expireDate });
          $cookies.put('user', $scope.username, { expires: expireDate });
          $cookies.put('userRole', response.data.role, { expires: expireDate });
          $cookies.put('globals', $rootScope.globals, { expires: expireDate });

          $location.url("/");

        } else {
          // user not present or invalid credentials
          $scope.loginError = "Invalid username/password combination";
          $scope.result = 'error';
          console.log('Login failed');

          $('.alert').show();
        }
      }, function errorCallback(response) {
        // failed to connect to the console backend
        $scope.loginError = response.data || "Request failed." + "\n";
        $scope.loginError += " Failed to connect to the console backend.";

        $('.alert').show();
      });
    };

    // Base64 encoding service
    var Base64 = {
      encode: function (input) {
        return $window.btoa(input);
      },
      decode: function (input) {
        return $window.atob(input);
      }
    };
  }]
);

angular.module('logout').controller('LogoutCtrl', function($scope, $http, $location, $rootScope, $cookies) {

  // remove cookie data and logout user
  $rootScope.globals = {};

  $cookies.remove('globals');
  $cookies.remove('userLoggedIn');
  $cookies.remove('user');
  $cookies.remove('userRole');

  // custom jquery to remove navbar dropdown
  $("#navWelcomeText").text('');
  $(".role").remove();
  $location.url("/login");
  
});
