/*-------------------------------------------------------------------------------
* Name:        pndaBasicComponent.js
* Purpose:     A basic component for a set of metrics on the home page.
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

angular.module('appComponents').directive('pndaBasicComponent', ['$filter', 'HelpService', 'customTimer',
  function($filter, HelpService, customTimer) {
    return {
      restrict: 'E',
      scope: {
        onGetMetricData: '&',
        showOverview: '&',
        showConfig: '&',
        overwriteDisplayName: '@',
        forceWrapDisplayName: '@'
      },
      templateUrl: 'partials/components/pnda-basic-component.html',
      link: function(scope) {
        // initialise the scope, which will be updated when the callback function gets called by the controller
        scope.metricName = '';
        scope.metricNameForModalView = '';
        scope.class = 'hidden';
        scope.isUnavailable = false;
        scope.timestamp = 0;
        scope.metricObj = {};
        scope.fullMetrics = {};
        scope.severity = '';
        scope.timeDiff = 0;
        var defaultTimeInterval = 1000;
        scope.showDetails = function() {
          if (scope.severity) {
            scope.showOverview({ metricObj: scope.metricObj, metrics: scope.fullMetrics });
          }
        };

        scope.showHelp = function() {
          HelpService.showHelp(scope.metricNameForModalView, scope.metricObj.name);
        };

        scope.showCog = function() {
          return scope.metricName !== 'Zookeeper' && !scope.isUnavailable;
        };

        scope.clickCog = function() {
          scope.showConfig({ metricObj: scope.metricObj });
        };
        // the callback function expects an array of matching metrics
        var callbackFn = function(metricData) {
          if (metricData.length > 0) {
            angular.forEach(metricData, function(metric) {
              scope.fullMetrics[metric.name] = metric;
            });

            // for a basic component we just care about the health
            var healthMetric = metricData.find(function(element) {
              if (element.name.endsWith(".health")) {
                return element;
              }
            });
            if (healthMetric !== undefined) {
              scope.metricNameForModalView = scope.overwriteDisplayName !== undefined
                ? scope.overwriteDisplayName : $filter('metricNameForDisplay')(healthMetric.name);

              scope.metricName = scope.forceWrapDisplayName === "true" ?
                scope.metricNameForModalView.replace(/ /g, '<br />') : scope.metricNameForModalView;
              scope.timestamp = healthMetric.info.timestamp;
              scope.timeDiff = 0;
              scope.severity = healthMetric.info.value;
              scope.metricObj = healthMetric;
              scope.class = $filter('metricNameClass')(healthMetric.name);
              scope.isUnavailable = (healthMetric.info.value === "UNAVAILABLE");

              scope.latestHealthStatus = healthMetric.info.value;
              scope.healthClass = " health_" + healthStatus(healthMetric.info.value, scope.timestamp, scope.timeDiff);

              // animate all relevant health objects
              showMetricUpdateAnimation($("." + $filter('metricNameClass')(healthMetric.name)));
            }
          }
        };
       
        scope.callback = function() {
           scope.timeDiff += defaultTimeInterval;
        };
        
        var timerCallbackId = customTimer.on(scope.callback);
        
        scope.$on('$destroy',function(){
           customTimer.off(timerCallbackId);
        });
      
        var healthStatusCallbackFn = function() {
          scope.healthClass = " health_" + healthStatus(scope.latestHealthStatus, scope.timestamp, scope.timeDiff);
        };

        scope.onGetMetricData({ cbFn: callbackFn, healthStatusCbFn: healthStatusCallbackFn });
      }
    };
  }]);
