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
  'ConfigService','Idle','ModalService','Title', 
  function($scope, $http, $location, $rootScope, $cookies, $window, ConfigService,Idle,ModalService,Title) {

    var loginPath;
    if (ConfigService.login_mode === 'PAM') {
      loginPath = '/pam/login';
    }
	document.getElementById("username").focus();
	
    var dataMan = ConfigService.backend["data-manager"];
    var host = dataMan.host;
    var port = dataMan.port;
	//Setting Default valus for session Expiry (in seconds)
    var defaultSessionExpiryTime = 21600;
    var defaultWarningMessageDuration = 30;
    var defaultIdleStayTime = defaultSessionExpiryTime - defaultWarningMessageDuration;
    var minimumSessionAge = 300;

    $scope.login = function() {

      var data = $.param({
        username: $scope.username,
        password: Base64.encode($scope.password)
      });     
      $http({
        url: loginPath,
        method: 'POST',
        data: data,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })
      .then(function successCallback(response) {
        if (response.data.username) {
          var authdata = Base64.encode($scope.username + ':' + $scope.password);
          $rootScope.globals = {
            currentUser: {
              username: $scope.username,
              authdata: authdata
            }
          };
          //Getting session_max_age and time duration for warning message from backend in milliseconds
          var timeoutForLogout = response.data.session_max_age / 1000;
          var sessionExpiryWarningDuration = response.data.session_expiry_warning_duration / 1000;
          
          // add to cookies
          var expireDate = new Date();
          expireDate.setDate(expireDate.getDate() + 1);
          $cookies.put('userLoggedIn', true, { expires: expireDate });
          $cookies.put('user', $scope.username, { expires: expireDate });
          $cookies.put('userRole', response.data.role, { expires: expireDate });
          $cookies.put('globals', $rootScope.globals, { expires: expireDate });
          $location.url("/");
          
          var timeoutForIdle = timeoutForLogout - sessionExpiryWarningDuration;
          
          //Setting the session timeout and warning message duration (in seconds)
          if((timeoutForIdle !== undefined && sessionExpiryWarningDuration !== undefined &&
              timeoutForIdle > 0 && sessionExpiryWarningDuration > 0 && timeoutForLogout > minimumSessionAge)){
              Idle.setIdle(timeoutForIdle);
              Idle.setTimeout(sessionExpiryWarningDuration);
              Idle.watch();
          }else{
              Idle.setIdle(defaultIdleStayTime);
              Idle.setTimeout(defaultWarningMessageDuration);
              Idle.watch();
          }
          
          //Events for session activity
          $rootScope.$on('IdleTimeout', function() {
               var original = Title.original();
               Title.timedOutMessage(original);
               $location.path('/logout');
               $('#sessionModalHideBtn').click();
          });
          
          $rootScope.$on('IdleWarn', function(e,countdown) {
             var original = Title.original();
             Title.idleMessage(original);
             var fields = {
                title: 'Warning',
                countdown:countdown,
                timeoutWarningInSec:sessionExpiryWarningDuration
             };
             if(countdown === sessionExpiryWarningDuration)
             ModalService.createModalView('partials/modals/session-expiry-warning.html', fields);
          });
          $rootScope.$on('IdleEnd', function() {
             $('#sessionModalHideBtn').click();
          });
          
        } else {
          // user not present or invalid credentials
          $scope.loginError = "Invalid username/password combination";
          $scope.result = 'error';
          console.log('Login failed');
          $('.alert').show();
        }
      }, function errorCallback() {
        // user not present or invalid credentials
        $scope.loginError = "Invalid username/password combination.";
        $scope.result = 'error';
        console.log('Login failed');
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

angular.module('logout')
  .controller('LogoutCtrl', function($scope, $http, $location, $rootScope, $cookies, $window, ConfigService) {

    var logoutPath;
    if (ConfigService.login_mode === 'PAM') {
      logoutPath = '/pam/logout';
    }

    // remove cookie data and logout user
    $rootScope.globals = {};
    $cookies.remove('globals');
    $cookies.remove('userLoggedIn');
    $cookies.remove('user');
    $cookies.remove('userRole');
    $window.localStorage.clear();
    $http({
    url: logoutPath,
    method: 'GET'
  });

  // custom jquery to remove navbar dropdown
    $("#navWelcomeText").text('');
    $(".role").remove();
    $location.url("/login");
  
  });
