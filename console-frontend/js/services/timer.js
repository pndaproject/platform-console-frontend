/*-------------------------------------------------------------------------------
* Name:        Timer.js
* Purpose:     Service for timer.
*
* Author:      PNDA TEAM
* Created:     2018/05/28
* History:     2018/05/28 - Initial commit
* Changes:     Added timer service
*-------------------------------------------------------------------------------*/

angular.module('appServices').factory('customTimer', ['$interval', function ($interval) {
     var timerId;
     var counter = 0;
     var defaultInterval = 1000;
     var callbacks = {};
     var timer = {
       start: function (timeInterval) {
           if (timerId) return;
           timerId = $interval( function() {
              for( var callbackId in callbacks) {
                callbacks[callbackId]();
              }
           }, timeInterval || defaultInterval );
       },
       on: function(callbackFun, context) {
           if ( typeof callbackFun === "function" ) {
              callbacks[counter++] = callbackFun;
              timer.start();
           }
         },
         off: function(callbackId) {
             delete callbacks[callbackId];
             if ( Object.keys(callbacks).length === 0 ) {
                timer.destroy();
             }
        },
       destroy : function(){
         $interval.cancel(timerId);
         timerId = undefined;
       }
     };
     return timer;
}]);
