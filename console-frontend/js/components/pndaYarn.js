/*-------------------------------------------------------------------------------
* Name:        pndaYarn.js
* Purpose:     The YARN component on the home page.
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

angular.module('appComponents').directive('pndaYarn', ['$filter', 'HelpService','customTimer',
        function($filter, HelpService, customTimer) {
  return {
    restrict: 'E',
    scope: {
      onGetMetricData: '&',
      showConfig: '&',
      showOverview: '&'
    },
    templateUrl: 'partials/components/pnda-yarn.html',
    link: function(scope) {
      // initialise the scope, which will be updated when the callback function gets called by the controller
      scope.metricName = '';
      scope.class = 'hidden';
      scope.healthClass = '';
      scope.showInfoIcon = false;
      scope.metricObj = {};
      scope.fullMetrics = {};
      scope.severity = '';
      scope.timeDiff = 0;
      var defaultTimeInterval = 1000;

      // total = allocated + available
      scope.memory = { total: 0, available: 0, allocated: 0, allocatedPercentage: 0, allocatedPercentageStyle: '' };
      scope.vcores = { total: 0, available: 0, allocated: 0, allocatedPercentage: 0, allocatedPercentageStyle: '' };

      // the callback function expects an array of matching metrics
      scope.showDetails = function() {
        if (scope.severity) {
          scope.showOverview({ metricObj: scope.metricObj, metrics: scope.fullMetrics });
        }
      };

      scope.clickCog = function() {
        scope.showConfig({ metricObj: scope.metricObj });
      };

      scope.showHelp = function() {
        HelpService.showHelp(scope.metricName, scope.metricObj.name);
      };

      var callbackFn = function(metricData) {
        if (metricData.length > 0) {
          // for yarn we're looking for:
          // .health,
          // .allocated_memory_mb_across_yarn_pools, .total_available_memory_mb_across_yarn_pools,
          // .allocated_vcores_across_yarn_pools, .total_available_vcores_across_yarn_pools
          angular.forEach(metricData, function(metric) {
            scope.fullMetrics[metric.name] = metric;

            if (metric.name.endsWith(".health")) {
              scope.metricName = $filter('metricNameForDisplay')(metric.name);

              scope.class = $filter('metricNameClass')(metric.name);
              scope.severity = metric.info.value;
              scope.metricObj = metric;
              scope.timestamp = metric.info.timestamp;
              scope.timeDiff = 0;
              var status = healthStatus(metric.info.value, scope.timestamp, scope.timeDiff);
              scope.healthClass = "health_" + status;
              scope.isUnavailable = (metric.info.value === "UNAVAILABLE");

//              scope.healthClass += (enableModalView(scope.severity) ? " clickable" : " ");
              scope.latestHealthStatus = metric.info.value;
            } else if (metric.name.endsWith(".allocated_memory_mb_across_yarn_pools")) {
              scope.memory.allocated = parseInt(metric.info.value, Constants.RADIX_DECIMAL);
            } else if (metric.name.endsWith(".total_available_memory_mb_across_yarn_pools")) {
              scope.memory.available = parseInt(metric.info.value, Constants.RADIX_DECIMAL);
            } else if (metric.name.endsWith(".allocated_vcores_across_yarn_pools")) {
              scope.vcores.allocated = parseInt(metric.info.value, Constants.RADIX_DECIMAL);
            } else if (metric.name.endsWith(".total_available_vcores_across_yarn_pools")) {
              scope.vcores.available = parseInt(metric.info.value, Constants.RADIX_DECIMAL);
            } else {
//              console.log("unknown Yarn metric", metric.name);
            }
          });

          var calculatePercentage = function(metric) {
            metric.total = metric.allocated + metric.available;
            if (metric.total > 0) {
              metric.allocatedPercentage = metric.allocated * 100 / metric.total;
              metric.allocatedPercentageStyle = "width:" + metric.allocatedPercentage + "%";
            }
          };

          calculatePercentage(scope.memory);
          calculatePercentage(scope.vcores);

          showMetricUpdateAnimation($("pnda-yarn .health"));
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
        var status = healthStatus(scope.latestHealthStatus, scope.timestamp, scope.timeDiff);
        scope.healthClass = "health_" + status;
      };

      scope.onGetMetricData({ cbFn: callbackFn, healthStatusCbFn: healthStatusCallbackFn });
    }
  };
}]);
