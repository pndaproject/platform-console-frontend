/*-------------------------------------------------------------------------------
* Name:        SessionHandler.js
* Purpose:     Service for maintaining session.
* Author:      Shubhangi Garg
*-------------------------------------------------------------------------------*/

angular.module('appServices').factory('SessionHandler', ['$rootScope', '$window','Idle','ModalService','Title',
  '$location', '$cookies','$timeout',
  function ($rootScope, $window, Idle, ModalService, Title, $location, $cookies, $timeout) {

    var defaultSessionExpiryTime = 21600;
    var defaultWarningMessageDuration = 30;
    var defaultIdleStayTime = defaultSessionExpiryTime - defaultWarningMessageDuration;
    var minimumSessionAge = 300;
    var unbind;
    var session = {};
      session.init = function () {
          var timeoutForLogout = JSON.parse($window.localStorage.getItem('timeoutForLogout'));
          var sessionExpiryWarningDuration = JSON.parse($window.localStorage.getItem('sessionExpiryWarningDuration'));
          var timeoutForIdle = JSON.parse($window.localStorage.getItem('timeoutForIdle'));

         //Below function checks if user manually deleted cookies from browser
          unbind = $rootScope.$watch(function(){
              return $cookies.get('user');
          },function(changedValue){
               if(!changedValue){
                  $location.path('/logout');
               }
          },true);

          //Below function checks if session got timed out (time out value is fetched from server through login request)
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
      };
      session.off = function(){
          if(unbind !== undefined){
            unbind();
          }
      };
      return session;
  }
]);
