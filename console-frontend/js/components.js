/*-------------------------------------------------------------------------------
* Name:        components.js
* Purpose:     Miscellaneous vars and functions used by other components.
*
* Author:      PNDA Team
* Created:     2016/04/01
* History:     2016/04/01 - Initial commit
*              2016/05/06 - Added the pndaLoader animation directive
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

// timeout before a component goes amber (WARN):
// if the latest timestamp happened more than 3 minutes ago, change the health status to WARN
var timestampTimeoutMs = 3 * 60 * 1000; // 3 minutes
// depending on the last known health status and the latest update timestamp,
// this function will return one of the following values:
// - OK
// - WARN
// - WARN_NO_RECENT_UPDATE
// - ERROR
function healthStatus(lastKnownHealthStatus, lastUpdateTimestamp, diff) {
  // if it's already a warning or an error, leave it as it is
  if (lastKnownHealthStatus !== "OK") {
    return lastKnownHealthStatus;
  }
  return (diff > timestampTimeoutMs ? "WARN_NO_RECENT_UPDATE" : lastKnownHealthStatus);
}

function enableModalView(severity) {
  return severity === 'ERROR' || severity === 'WARN';
}

var now = Date.now();

function animateComponentPulse(element) {
  if (element) {
    //fade out and set visibility:hidden
    TweenLite.to(element, 0.2, { autoAlpha: 0.5 });

    // fade back in
    TweenLite.to(element, 0.2, { autoAlpha: 1, delay: 0.2 });
  }
}

function showMetricUpdateAnimation(selectorArray) {
  if (selectorArray != null && selectorArray.length > 0) {
    // handle as an array so we have the flexibility to animate multiple div
    // elements on the UI depending on which selector we use above
    for (var i = 0 ; i < selectorArray.length ; i++) {
      // Source component that has received the metric update
      animateComponentPulse(selectorArray[i]);
    }
  }
}

angular.module('appComponents').directive('myPostRepeatDirective', function() {
  return function(scope) {
    if (scope.$last) {
      scope.$emit('LastElem');
    }
  };
});

angular.module('appComponents').directive('pndaLoader', function() {
  var linker = function (scope, element) {
    var duration = 0.8;
    var staggerDelay = 0.6 * duration;
    var circles = element[0].querySelectorAll(".loader-container .circle");
    var timelines = [];

    function animateCircle(target, firstDelay) {
      var easing = Power2.easeOut;
      var tl = new TimelineMax({ delay: firstDelay });
      var timelineIndex = timelines.length + 1;
      timelines.push(tl);
      tl.to(target, duration, { scale: 1, ease: easing });
      tl.to(target, duration, { scale: 0.2, ease: easing,
        onComplete: function restartAnimation(target, delay) {
          // remove the reference we kept for this animation
          tl.kill();
          tl = null;
          timelines.splice(timelineIndex, 1);

          // restart the animation if the condition is still met
          if (scope.animationCondition) {
            animateCircle(target, delay);
          } else {
            // otherwise terminate the animation by scaling to 0
            TweenLite.to(target, duration / 2, { scale: 0, ease: easing });
          }
        }, onCompleteParams: [target, staggerDelay] });
    }

    // make sure the circles are not displayed by default by setting their scale to 0
    TweenLite.set(circles, { scale: 0 });

    function init() {
      TweenLite.set(circles, { scale: 0 });
      angular.forEach(circles, function(el, index) {
        animateCircle(element[0].querySelectorAll(".circle:nth-of-type(" + (index + 1) + ")"), index * staggerDelay);
      });
    }

    function terminate() {
      // accelerate all timelines for the animation to finish in half the remaining time
      timelines.forEach(function(tl) {
        tl.timeScale(2);
      });

      // clear all timeline references
      timelines = [];
    }

    scope.$watch('animationCondition', function() {
      if (scope.animationCondition) {
        init();
      } else {
        terminate();
      }
    });
  };

  return {
    scope: {
      animationCondition: '='
    },
    link: linker,
    template: '<div class="loader-container loader-container">' +
      ' <div class="circle"></div>' +
      ' <div class="circle"></div>' +
      ' <div class="circle"></div>' +
      '</div>'
  };
});
