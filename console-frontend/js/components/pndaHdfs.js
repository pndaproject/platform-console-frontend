/*-------------------------------------------------------------------------------
* Name:        pndaHdfs.js
* Purpose:     The HDFS component on the home page.
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

angular.module('appComponents').directive('pndaHdfs', ['$filter', 'HelpService','customTimer',
        function($filter, HelpService, customTimer) {
  return {
    restrict: 'E',
    scope: {
      onGetMetricData: '&',
      showConfig: '&',
      showOverview: '&'
    },
    templateUrl: 'partials/components/pnda-hdfs.html',
    link: function(scope) {
      // initialise the scope, which will be updated when the callback function gets called by the controller
      scope.metricName = '';
      scope.class = 'hidden';
      scope.healthClass = '';
      scope.showInfoIcon = false;
      scope.severity = '';
      scope.capacity = { total: 0, non_dfs_used: 0, dfs_used: 0, usedPercentageStyle: '' };
      scope.metrics = { live_datanodes: 0, total_files:0, non_dfs_used:0,
        dfs_used:0, total_size: 0, total_used: 0, jvm_heap_used:0, dead_datanodes:0 };
      scope.metricObj = {};
      scope.timeDiff = 0;
      var defaultTimeInterval = 1000;

      // the callback function expects an array of matching metrics
      scope.showDetails = function() {
        if (enableModalView(scope.severity)) {
          scope.showOverview({ metricObj: scope.metricObj });
        }
      };

      scope.showHelp = function() {
        HelpService.showHelp(scope.metricName, scope.metricObj.name);
      };
      
      scope.clickCog = function() {
        scope.showConfig({ metricObj: scope.metricObj });
      };

      // query the DOM to identify dimensions set in PNDA.less. Dimensions are in px
      var dbHeight = $("pnda-hdfs .database").height();
      var dbGap = 0;
      var dhTopHeight = 0;
      var min = 0;
      var max = 0;
      if ($("pnda-hdfs .database .used").length !== 0) {
        dbGap = $("pnda-hdfs .database .used").css("left").replace(/px/, '');
        min = $("pnda-hdfs .database .used .top").height();
        max = dbHeight - dbGap;
      }

      // the callback function expects an array of matching metrics
      var callbackFn = function(metricData) {
        if (metricData.length > 0) {
          // for an HDFS database we're looking for:
          // .health,
          // .capacity_remaining
          // .dfs_capacity_used_non_hdfs
          // .total_dfs_capacity_across_datanodes
          // .total_dfs_capacity_used_across_datanodes
          angular.forEach(metricData, function(metric) {
            if (metric.name.endsWith(".health")) {
              scope.metricName = $filter('metricNameForDisplay')(metric.name);

              scope.class = $filter('metricNameClass')(metric.name);
              scope.severity = metric.info.value;
              scope.timestamp = metric.info.timestamp;
              scope.timeDiff = 0;
              var status = healthStatus(metric.info.value, scope.timestamp, scope.timeDiff);
              scope.isUnavailable = (metric.info.value === "UNAVAILABLE");

//              scope.healthClass += (enableModalView(scope.severity) ? " clickable" : " ");
              scope.healthClass = "health_" + status;
              scope.showInfoIcon = status === 'WARN' || status === 'ERROR';
              scope.latestHealthStatus = metric.info.value;
              scope.metricObj = metric;
            } else if (metric.name.endsWith(".total_dfs_capacity_across_datanodes")) {
              if (!isNaN(metric.info.value)) {
                scope.capacity.total = parseInt(metric.info.value, Constants.RADIX_DECIMAL);
              }
            } else if (metric.name.endsWith(".dfs_capacity_used_non_hdfs")) {
              if (!isNaN(metric.info.value)) {
                scope.capacity.non_dfs_used = parseInt(metric.info.value, Constants.RADIX_DECIMAL);
              }
            } else if (metric.name.endsWith(".total_dfs_capacity_used_across_datanodes")) {
              if (!isNaN(metric.info.value)) {
                scope.capacity.dfs_used = parseInt(metric.info.value, Constants.RADIX_DECIMAL);
              }
            } else if (metric.name.endsWith(".live_datanodes")) {
              scope.metrics.live_datanodes = metric.info.value;
            } else if (metric.name.endsWith(".dead_datanodes")) {
              scope.metrics.dead_datanodes = metric.info.value;
            } else if (metric.name.endsWith(".files_total")) {
              if (!isNaN(metric.info.value)) {
                scope.metrics.total_files = parseInt(metric.info.value, Constants.RADIX_DECIMAL);
              }
            } else if (metric.name.endsWith(".jvm_heap_used_mb")) {
              if (!isNaN(metric.info.value)) {
                scope.metrics.jvm_heap_used = parseInt(metric.info.value, Constants.RADIX_DECIMAL);
              }
            }

//            else {
//              console.log("unknown HDFS metric", metric.name);
//            }
          });
          var calculatePercentage = function(metric) {
            if (metric.total > 0) {
              var usedPercentage = (metric.non_dfs_used + metric.dfs_used) / metric.total;
              var maxHeight = max - min;
              var height = min + maxHeight * usedPercentage;
              var top = max - height;
              metric.usedPercentageStyle = "height:" + height + "px; top:" + top + "px;";

              // don't display if less than 1% is used
              if (usedPercentage < 0.001) {
                metric.usedPercentageStyle += "display: none";
              }
            }
          };

          calculatePercentage(scope.capacity);
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
        scope.healthClass = " health_" + status;
        scope.showInfoIcon = status === 'WARN' || status === 'ERROR';
      };

      scope.onGetMetricData({ cbFn: callbackFn, healthStatusCbFn: healthStatusCallbackFn });
    }
  };
}]);
