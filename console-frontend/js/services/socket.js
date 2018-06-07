/*-------------------------------------------------------------------------------
* Name:        socket.js
* Purpose:     Service for receiving Socket.IO notifications.
*
* Author:      Brian Ford, http://www.html5rocks.com/en/profiles/#brianford
* Article:     http://www.html5rocks.com/en/tutorials/frameworks/angular-websockets/
* Source:      https://github.com/btford/angular-socket-io-im/blob/master/public/js/services.js
* License:     http://www.apache.org/licenses/LICENSE-2.0
* Changes:     Added ConfigService to configure socket address.
*-------------------------------------------------------------------------------*/

angular.module('appServices').factory('socket', ['$rootScope', 'ConfigService',
  function ($rootScope, ConfigService) {
    var socket = io.connect();
    return {
      on: function (eventName, callback) {
        socket.on(eventName, function () {
          var args = arguments;
          $rootScope.$apply(function () {
            callback.apply(socket, args);
          });
        });
      },
      emit: function (eventName, data, callback) {
        socket.emit(eventName, data, function () {
          var args = arguments;
          $rootScope.$apply(function () {
            if (callback) {
              callback.apply(socket, args);
            }
          });
        });
      }
    };
  }
]);
