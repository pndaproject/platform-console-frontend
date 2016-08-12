/*-------------------------------------------------------------------------------
* Name:        GraphiteService.js
* Purpose:     Service for calling the Graphite API.
*
* Author:      PNDA Team
* Created:     2016/04/01
* History:     2016/04/01 - Initial commit
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

angular.module('appServices').factory('GraphiteService', ['$resource', 'ConfigService', '$http', '$q',
  function($resource, ConfigService, $http, $q) {
    return {
      // from and until specify a date range in milliseconds
      getMetric: function(metric, from, until) {
        var graphiteManager = ConfigService.backend["graphite"];
        
        var graphiteUrl = "http://" + graphiteManager.host + ":" + graphiteManager.port + 
          "/render?target=" + metric + "&format=json";
        if (from !== undefined && from !== "") 
          graphiteUrl += "&from=" + Math.floor(from / 1000);
        if (until !== undefined && until !== "") 
          graphiteUrl += "&until=" + Math.floor(until / 1000);
        
        // console.log(graphiteUrl);
        
        return $q.all([$http.get(graphiteUrl)]).then(function(data) {
          var response = data[0];
          if (response !== undefined) {
            var metricData = response['data'];
            if (metricData !== undefined && metricData[0] !== undefined) {
              return metricData;
            } else {
              console.log("Couldn't get data for metric. " + JSON.stringify(response));
              return null;
            }
          } else {
            console.log("Error connecting to Graphite API.");
            return null;
          }
        });
      },
      
      // filters out null values from the datapoints,
      // and reformats the array of [value, time] arrays
      // into an array of {x: time, y: value} objects
      // datapoints: [[null, 101], [42, 102], [43, 103], [null, 104]]
      // returns: [{x: 102, y: 42}, {x: 103, y: 43}]
      filterMetricData: function(metricData) {
        if (metricData == null) return null;

        var results = [];
        for (var j = 0; j < metricData.length; j++) {
          var datapoints = metricData[j].datapoints;
          var filtered = [];
          var count = datapoints.length;
          for (var i = 0; i < count; i++) {
            var point = datapoints[i];
            var y = point[0];
            if (y != null) {
              filtered.push({ x: point[1], y: y });
            }
          }
          results.push(filtered);
        }
        

        return results;
      }
      
    };
  }]
);
