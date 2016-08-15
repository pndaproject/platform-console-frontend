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

angular.module('appComponents').directive('pndaChart',
  ['$filter', 'GraphiteService', 'formatNumbersFilter',
  function(filter, GraphiteService, formatNumbersFilter) {
    return {
      restrict: 'E',
      scope: {
        chartId: '@',
        chartClass: '@',
        metric: '@',
        from: '@',
        until: '@',
        updateCounter: '@',
        format: '@',
        width: '@', // if undefined, will use responsive layout
        height: '@'
      },
      templateUrl: 'partials/components/pnda-chart.html',
      link: function(scope) {
        var updateDelay = 750;
        
        function minutesAgo(minutes) {
          if (minutes === undefined || minutes === '') return undefined;
          return Date.now() - minutes * 60000;
        }
        
        scope.formatDate = function(value) {
          var date = new Date(value * 1000);

          // var year = date.getFullYear();
          // var month = date.getMonth() + 1;
          // var day = date.getDate();
          var hours = date.getHours();
          var minutes = date.getMinutes();
          var seconds = date.getSeconds();
      
          function pad(number) {
            if (number < 10) { number = ("0" + number); }

            return number;
          }
      
          return ' ' + pad(hours) + ':' + pad(minutes) /* + ':' + pad(seconds) */;
        };
        
        scope.formatValue = function(value) {
          if (value < 0) value = 0 - value; // display positive label for mirrored data
          return formatNumbersFilter(value, scope.metric);
        };
        
        scope.makeChart = function() {
          GraphiteService.getMetric(scope.metric, minutesAgo(scope.from), minutesAgo(scope.until))
			.then(function(metricData) {
            var chartDiv = '#' + scope.chartId.replace(/\./g, "\\.");
            var noDataMessage = 'No history available for';
            if (metricData != null && metricData.length > 0) {
              var series = GraphiteService.filterMetricData(metricData, true);
    
              var chartOptions = {
                width: scope.width, // if undefined, will use responsive layout
                height: scope.height,
                showPoint: true,
                showArea: true,
                lineSmooth: true, // Chartist.Interpolation.step()
                axisX: {
                  showGrid: false,
                  showLabel: true,
                  scaleMinSpace: 60,
                  type: Chartist.AutoScaleAxis,
                  labelInterpolationFnc: scope.formatDate
                },
                axisY: {
                  offset: 70,
                  scaleMinSpace: 30,
                  onlyInteger: true,
                  labelInterpolationFnc: scope.formatValue
                }
              };
    
              var data = { series: series };
              if ($(chartDiv).html() === noDataMessage) $(chartDiv).html('');
              scope.chart = new Chartist.Line(chartDiv, data, chartOptions);
            } else {
              $(chartDiv).html(noDataMessage);
            }
          });
        };

        scope.makeChart();
        
        scope.$watch('metric', function() { scope.makeChart(); });
        scope.$watch('from', function() { scope.makeChart(); });
        scope.$watch('until', function() { scope.makeChart(); });
        scope.$watch('updateCounter', function(newval) {
          if (newval != null) {
            // console.log('updateCounter changed: ' + newval);
            // wait a tick for data to be available in graphite, as Socket.IO is faster
            setTimeout(function() {
              scope.makeChart();
            }, updateDelay);
          }
        });
      }
    };
  }]);
