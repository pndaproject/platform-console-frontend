/*-------------------------------------------------------------------------------
* Name:        MetricsListCtrl.js
* Purpose:     Controller for the metrics page.
*
* Author:      PNDA Team
* Created:     2016/04/01
* History:     2016/04/01 - Initial commit
*              2016/05/05 - Make the HDFS resolution link point to HDFS on Cloudera Manager
*              2016/05/10 - Refactored the modal views
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

angular.module('appControllers').controller('MetricListCtrl', ['$scope', 'MetricService', 'ConfigService',
  'ModalService', 'DeploymentManagerService', 'UtilService',
  'socket', '$filter', '$modal', '$interval', '$location', '$window',
  function($scope, MetricService, ConfigService, ModalService, DeploymentManagerService, UtilService,
    socket, $filter, $modal, $interval, $location, $window) {

    var locationParameters = $location.search();
    $scope.theme = (locationParameters.theme === undefined ? '' : 'css/generated/themes/'
    + locationParameters.theme + '.css');

    $scope.showModal = function(healthInfo, metricsInfo) {
      var fields = {
        title: healthInfo.info.source + " Overview",
        componentName: healthInfo.info.source,
        content: healthInfo.info.causes,
        severity: healthInfo.info.value,
        linkDoesNotExist: false,
        link: findResolutionUrlForSource(healthInfo.info.source, true)
      };
      if (fields.link === '/') {
        fields.linkDoesNotExist = true;
      }

      if (metricsInfo != null) {
        fields.metrics = metricsInfo;
      }

      ModalService.createModalView('partials/modals/component-overview.html', fields);
    };

    $scope.showModalTable = function(data, titleContext) {
      angular.forEach(data, function(metric) {
        metric.info.resolutionURL = findResolutionUrlForSource(metric.info.source, true);
      });

      var fields = {
        title: titleContext + " Overview",
        metrics: data
      };

      ModalService.createModalView('partials/modals/metric-issues.html', fields);
    };

    $scope.showModalComponentInfo = function(data, healthInfo) {
      var fields = {
        title: "Kafka Overview",
        brokers: data,
        content: healthInfo.info.causes,
        link: findResolutionUrlForSource(healthInfo.info.source, true),
        severity: healthInfo.info.value
      };

      ModalService.createModalView('partials/modals/kafka.html', fields);
    };

    $scope.showConfigPage = function(healthInfo) {
      var link = findResolutionUrlForSource(healthInfo.info.source);
      $window.open(link, '_blank');
    };

    function resetTrafficLightStatus() {
      $scope.trafficLightStatus = {
        errors: [],
        warnings: [],
        status: "unknown"
      };
    }

    function computeTrafficLightStatus() {
      return $scope.trafficLightStatus.errors.length > 0 ? "ERROR" :
        $scope.trafficLightStatus.warnings.length > 0 ? "WARN" : "OK";
    }

    resetTrafficLightStatus();

    $scope.metrics = MetricService.query(function(response) {
      resetTrafficLightStatus();
      angular.forEach(response, function(metric) {
        // turn the 'value' promise into its value when it's available
        metric.info.then(function(response) {
          metric.info = response[0];
          metric.info.causes = (metric.info.causes === undefined || metric.info.causes === ""
            || metric.info.causes === "[\"\"]" ? [] :
            UtilService.isJson(metric.info.causes) ? JSON.parse(metric.info.causes) : [metric.info.causes]);
          metric.info.displayCauses = metric.info.causes.length > 0;
          if (metric.name.endsWith(".health")) {
            if (metric.info.value === "ERROR") {
              $scope.trafficLightStatus.errors.push(metric);
            } else if (metric.info.value === "WARN") {
              $scope.trafficLightStatus.warnings.push(metric);
            }
          }

          $scope.trafficLightStatus.status = computeTrafficLightStatus();

          // if there is a callback function for this metric, call it
          var foundCb = $filter('getByName')($scope.metricCallbacks, metric.name);

          // if more than one callback function is found, call all of them
          // because we might want a component to appear more than once
          if (foundCb.length > 0) {
            angular.forEach(foundCb, function(cb) {
              cb.callbackFn([metric]);
            });
          }
        });
      });
    });
    $scope.metricCallbacks = [];

    $scope.orderProp = "name";

    $scope.sortedLinks = function() {
      var links = ConfigService.userInterfaceIndex;
      var sortedLinks = {};
      Object.keys(links).sort().forEach(function(key) {
        sortedLinks[key] = links[key];
      });
      return sortedLinks;
    };

    /**
     * Finds the network address of said component.
     * Some components are distributed across multiple machines.
     * This function returns only the first endpoint of said component,
     * other instances are ignored

     * @param componentName componentName The name of the component for which to find a URL
     * @returns firstURL The first url to an instance of said component
     */
    $scope.findFirstComponentUrl = function (componentName) {
      // get comma separated list of URLs and return the first one
      var urlList = $scope.findComponentUrl(componentName);
      return urlList.split(",")[0];
    };

    $scope.findComponentUrl = function(componentName) {
      var component = ConfigService.userInterfaceIndex[componentName];
      return component !== undefined ? component : "";
    };

    // if we want to show the same component more than once, set addIfDuplicate=true when calling this function
    $scope.getMetricData = function(metricName, callbackFn, healthStatusCbFn, addIfDuplicate) {
      var found = $filter('getByName')($scope.metrics, metricName);
      callbackFn(found);

      // add callback function to the array to get updates later on
      var foundCb = $filter('getByName')($scope.metricCallbacks, metricName);
      if (foundCb.length === 0 || (addIfDuplicate !== undefined && addIfDuplicate)) {
        $scope.metricCallbacks.push({ name: metricName, callbackFn: callbackFn });
      } else {
        angular.forEach(foundCb, function(cb) {
          cb.callbackFn = callbackFn;
        });
      }

      // add callback function to the array to get updates later on
      var foundTimerCb = $filter('getByName')($scope.updateNowTimerCallbacks, metricName);
      if (foundTimerCb.length === 0 || (addIfDuplicate !== undefined && addIfDuplicate)) {
        $scope.updateNowTimerCallbacks.push({ name: metricName, callbackFn: healthStatusCbFn });
      } else {
        angular.forEach(foundTimerCb, function(cb) {
          cb.callbackFn = healthStatusCbFn;
        });
      }
    };

    $scope.now = Date.now();
    $scope.updateNowTimerCallbacks = [];
    var stop = $interval(function() {
      $scope.now = Date.now();
      angular.forEach($scope.updateNowTimerCallbacks, function(cb) {
        if (cb.callbackFn !== undefined) {
          cb.callbackFn($scope.now);
        }
      });
    }, 1000);

    $scope.stopUpdateNowTimer = function() {
      if (angular.isDefined(stop)) {
        $interval.cancel(stop);
        stop = undefined;
      }
    };

    $scope.displayMetricData = function(metricName, callbackFn, addIfDuplicate) {
      var found = $filter('getByName')($scope.metrics, metricName);
      callbackFn(found);

      // add callback function to the array to get updates later on
      var foundCb = $filter('getByName')($scope.metricCallbacks, metricName);
      if (foundCb.length === 0 || (addIfDuplicate !== undefined && addIfDuplicate)) {
        $scope.metricCallbacks.push({ name: metricName, callbackFn: callbackFn });
      } else {
        angular.forEach(foundCb, function(cb) {
          cb.callbackFn = callbackFn;
        });
      }
    };

    function updateHealthIndicator() {
      resetTrafficLightStatus();
      angular.forEach($scope.metrics, function(metric) {
        if (metric.name.endsWith(".health")) {
          if (metric.info.value === "ERROR") {
            $scope.trafficLightStatus.errors.push(metric);
          } else if (metric.info.value === "WARN") {
            $scope.trafficLightStatus.warnings.push(metric);
          }
        }
      });
      $scope.trafficLightStatus.status = computeTrafficLightStatus();
    }

    // update metrics when socket.io updates are received.
    function socketMetricsUpdate(obj) {
      var causes = (obj.causes === undefined || obj.causes === "" || obj.causes === "[\"\"]" ? [] : obj.causes
      && UtilService.isJson(obj.causes) ? JSON.parse(obj.causes) : [obj.causes]);

      var displayCauses = causes.length > 0;
      var found = $scope.metrics.find(function(element) {
        if (element.name === obj.metric) {
          element.info.value = obj.value;
          element.info.source = obj.source;
          element.info.timestamp = obj.timestamp;
          element.info.causes = causes;
          element.info.displayCauses = displayCauses;
          return element;
        }
      });

      // if the element wasn't found, it's a new metric
      if (found === undefined) {
        found = {
          name: obj.metric,
          info: {
            source: obj.source,
            value: obj.value,
            timestamp: obj.timestamp,
            causes: causes,
            displayCauses: displayCauses
          }
        };
        $scope.metrics.push(found);
      }

      // if there is a callback function for this metric, call it
      var foundCb = $filter('getByName')($scope.metricCallbacks, obj.metric);
      if (foundCb.length > 0) {
        angular.forEach(foundCb, function(cb) {
          cb.callbackFn([found]);
        });
      }

      updateHealthIndicator();
    }

    socket.on('platform-console-frontend-metric-update', socketMetricsUpdate);

    $scope.dm_endpoints;
    $scope.operationalEndpoints = {
      edgeNode: ConfigService.edge_node,
      httpFS: ""
    };
    DeploymentManagerService.getEndpoints().then(function(data) {
      $scope.dm_endpoints = data;
      $scope.operationalEndpoints.httpFS = data.webhdfs_host + ":" + data.webhdfs_port;

      // update the list of links in the Config Service using endpoints from the deployment manager endpoints API
      ConfigService.userInterfaceIndex["Kafka Manager"] = $scope.dm_endpoints.kafka_manager;
      ConfigService.userInterfaceIndex["YARN Resource Manager"] = "http://" + data.yarn_resource_manager_host + ":" +
        data.yarn_resource_manager_port;
      if ('hue_host' in data) {
        ConfigService.userInterfaceIndex.Hue = "http://" + data.hue_host + ":" + data.hue_port;
      }
    });

    function findResolutionUrlForSource(source, showDefault) {
      var resolutionUrl = "/";
      var opentsdbIndex = "OpenTSDB";
      if ($scope.dm_endpoints !== undefined) {
        if (source === "kafka") {
          resolutionUrl = $scope.dm_endpoints.kafka_manager;
        } else if (source === "deployment-manager") {
          resolutionUrl = ConfigService.userInterfaceIndex["PNDA logserver"];

          // setting the search/query string to "deployment manager"
          resolutionUrl += "/#/dashboard/Default?_g=()&_a=(filters:!()," +
          "query:(query_string:(analyze_wildcard:!t,query:%27deployment-manager%27)),title:Default)";
        } else if (source === "opentsdb") {
          resolutionUrl = ConfigService.userInterfaceIndex[opentsdbIndex].split(",")[0];
        } else if (source === "grafana") {
        //for grafana, the string is a comma-separated list
          resolutionUrl = $scope.dm_endpoints[source].split(',')[0];
        } else if ((source === "hdfs01" || source === "HDFS") && showDefault !== true) {
          if (ConfigService.hadoop_distro === 'CDH') {
            resolutionUrl = ConfigService.userInterfaceIndex.Hue + "/filebrowser/";
          } else {
            resolutionUrl = ConfigService.userInterfaceIndex["Hadoop Cluster Manager"] +
              "#/main/views/FILES/1.0.0/PNDA_FILES_SU/";
          }
        } else if ((source === "yarn01" || source === "YARN")) {
          resolutionUrl = ConfigService.userInterfaceIndex["YARN Resource Manager"];
        } else if (source === "OOZIE") {
          resolutionUrl = ConfigService.userInterfaceIndex["Hadoop Cluster Manager"] +
            '#/main/views/WORKFLOW_MANAGER/1.0.0/PNDA_WORKFLOW';
        } else if (source === "AMBARI" || source === "CM") {
          resolutionUrl = ConfigService.userInterfaceIndex["Hadoop Cluster Manager"];
        } else if ($scope.dm_endpoints.cm_status_links !== undefined) {
          resolutionUrl = $scope.dm_endpoints.cm_status_links[source];
        }
      }

      return resolutionUrl;
    }

    /* Window events and other custom events that force a redraw */

    // when the user scrolls the page, move the position of the #dataFlow element
    var dataFlowElement = $("#curatedView #dataFlow");
    $(document).scroll(function() {
      dataFlowElement.css("top", -$(window).scrollTop());
    });

    var windowResizeCallbacks = {};
    $scope.registerWindowResizeCallback = function(topic, callback) {
      windowResizeCallbacks[topic] = callback;
    };

    $(window).resize(function() {
      // call all registered callback functions
      angular.forEach(windowResizeCallbacks, function(cb, topic) {
        cb(topic);
      });
    });

    var documentHeightChangeTimer;
    $scope.onDocumentHeightChange = function(callback) {
      var lastHeight = $(document).height();
      var newHeight;

      // Don't start a new timer if we already have one
      if (angular.isDefined(documentHeightChangeTimer)) return;

      documentHeightChangeTimer = $interval(function run() {
        newHeight = $(document).height();
        if (lastHeight !== newHeight) {
          callback(newHeight);
          lastHeight = newHeight;
        }
      }, 200);
    };

    $scope.stopDocumentChangeTimer = function() {
      if (angular.isDefined(documentHeightChangeTimer)) {
        $interval.cancel(documentHeightChangeTimer);
        documentHeightChangeTimer = undefined;
      }
    };

    $scope.$on('$destroy', function() {
      // Make sure that the interval is destroyed too
      $scope.stopDocumentChangeTimer();
      $scope.stopUpdateNowTimer();
    });

    $scope.onDocumentHeightChange(function(newHeight) {
      // and make sure the #dataFlow element takes the whole height of the document
      // (which can be more than the window height)
      dataFlowElement.css("height", newHeight);
    });
  }]
);
