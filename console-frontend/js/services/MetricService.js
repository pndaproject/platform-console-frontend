/*-------------------------------------------------------------------------------
* Name:        MetricService.js
* Purpose:     Service for calling the backend metrics API.
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

angular.module('appServices').factory('MetricService', ['$resource', 'ConfigService', '$http', '$q', '$filter',
  function($resource, ConfigService, $http, $q, $filter) {
    var dataManager = ConfigService.backend["data-manager"];
    var host = dataManager.host;
    var port = dataManager.port;
    var MetricService = $resource('http://' + host + ':' + port + '/metrics/:metricId?values=y', {}, {
      query: { method:'GET', params:{ metricId:'' }, isArray:true, transformResponse: function(data) {
        var json = JSON.parse(data);

        // if we received an array, it's the list of metrics
        if (json.metrics !== undefined && angular.isArray(json.metrics)) {
          // for each metric, get its latest value asynchronously using the /metrics/metricId API
          var metrics = [];

          angular.forEach(json.metrics, function (metric) {
            var deferred = $q.defer();
            deferred.resolve(metric.info);
            var promisedMetric = { name: metric.name, info: $q.all([deferred.promise]) };
            metrics.push(promisedMetric);
          });

          var dummyValue = { source: "default", value: "UNAVAILABLE", timestamp: 1451606400000 };

          // add dummy metrics to make sure all components appear
          angular.forEach(ConfigService.dummy_metrics, function(m) {
            var foundMetric = $filter('getByName')(metrics, m.name);
            if (foundMetric.length === 0) {
              var deferred = $q.defer();
              deferred.resolve(dummyValue);
              if (m.hadoop_distro.includes(ConfigService.hadoop_distro)) {
                metrics.push({ name: m.name, info: $q.all([deferred.promise]) });
              }
            }
          });
          return metrics;
        } else {
          console.log("not an array", json);
          return [json];
        }

      } }
    });

    return MetricService;
  }]
);
