/*-------------------------------------------------------------------------------
* Name:        pndaKafka.js
* Purpose:     The Kafka component on the home page.
*
* Author:      PNDA Team
* Created:     2016/04/01
* History:     2016/04/01 - Initial commit
*              2016/05/06 - Topic rates are now being summed up across all brokers
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

var hideInternalTopics = true;
var timestampTimeoutMs = 3 * 60 * 1000;

angular.module('appComponents').directive('pndaKafka',
['$filter', '$window', 'HelpService', 'ConfigService','customTimer',
  function($filter, $window, HelpService, ConfigService,customTimer) {
  return {
    restrict: 'E',
    scope: {
      onGetMetricData: '&',
      showOverview: '&',
      showInfo: '&'
    },
    templateUrl: 'partials/components/pnda-kafka.html',
    link: function(scope) {
      // initialise the scope, which will be updated when the callback
		// function gets called by the controller
      scope.metricName = '';
      scope.class = 'hidden';
      scope.healthClass = '';
      scope.brokers = {};
      scope.topics = {};
      scope.nodes = [];
      scope.metricObj = {};
      scope.severity = '';
      scope.chosenRate = 'MeanRate';
      scope.selectedPageCount = "5";
      scope.rates = [
        { value:"FifteenMinuteRate", label:"15 minutes rate" },
        { value:"FiveMinuteRate", label:"5 minutes rate" },
        { value:"OneMinuteRate", label:"1 minute rate" },
        { value:"MeanRate", label:"Mean rate" }
      ];
      scope.pagesmenu = [
          { value:"5", label:"5 Per Page" },
          { value:"10", label:"10 Per Page" },
          { value:"15", label:"15 Per Page" }
        ];
      
      scope.showComponentInfo = function() {
        scope.showInfo({ brokers: scope.brokers, metricObj: scope.metricObj });
      };

      scope.showHelp = function() {
        HelpService.showHelp(scope.metricName, scope.metricObj.name);
      };

      scope.showConfig = function() {
        var link = ConfigService.userInterfaceIndex["Kafka Manager"];
        if (link !== undefined) $window.open(link, '_blank');
      };

      function findBroker(id) {
        if (scope.brokers[id] === undefined) {
          scope.brokers[id] = {};
        }

        return scope.brokers[id];
      }

      function interpreteValue(value) {
        return (isNaN(value) ? value.replace(/\"/g, '') : Number(value));
      }
      
      scope.numberOfTopicsShown = function() {
        var nb = 0;
        angular.forEach(scope.topics, function(topic) {
          // explicitly convert to String
          topic = topic.toString();
          if (!hideInternalTopics || (ConfigService.topics.hidden).indexOf(topic) === -1) {
            nb++;
          }
        });
        return nb;
      };

      // the callback function expects an array of matching metrics
      var callbackFn = function(metricData) {
        if (metricData.length > 0) {
          // for kafka we're looking for:
          // .health,
          // kafka.brokers.2.topics.avro.internal.testbot.BytesInPerSec.Count
          // kafka.brokers.2.topics.avro.internal.testbot.BytesInPerSec.EventType
          // kafka.brokers.2.topics.avro.internal.testbot.BytesInPerSec.FifteenMinuteRate
          // kafka.brokers.2.topics.avro.internal.testbot.BytesInPerSec.FiveMinuteRate
          // kafka.brokers.2.topics.avro.internal.testbot.BytesInPerSec.MeanRate
          // kafka.brokers.2.topics.avro.internal.testbot.BytesInPerSec.OneMinuteRate
          // kafka.brokers.2.topics.avro.internal.testbot.BytesInPerSec.RateUnit
          // kafka.brokers.2.topics.avro.internal.testbot.BytesOutPerSec.Count
          // kafka.brokers.2.topics.avro.internal.testbot.BytesOutPerSec.EventType
          // kafka.brokers.2.topics.avro.internal.testbot.BytesOutPerSec.FifteenMinuteRate
          // kafka.brokers.2.topics.avro.internal.testbot.BytesOutPerSec.FiveMinuteRate
          // kafka.brokers.2.topics.avro.internal.testbot.BytesOutPerSec.MeanRate
          // kafka.brokers.2.topics.avro.internal.testbot.BytesOutPerSec.OneMinuteRate
          // kafka.brokers.2.topics.avro.internal.testbot.BytesOutPerSec.RateUnit
          // kafka.brokers.2.topics.avro.internal.testbot.MessagesInPerSec.Count
          // kafka.brokers.2.topics.avro.internal.testbot.MessagesInPerSec.EventType
          // kafka.brokers.2.topics.avro.internal.testbot.MessagesInPerSec.FifteenMinuteRate
          // kafka.brokers.2.topics.avro.internal.testbot.MessagesInPerSec.FiveMinuteRate
          // kafka.brokers.2.topics.avro.internal.testbot.MessagesInPerSec.MeanRate
          // kafka.brokers.2.topics.avro.internal.testbot.MessagesInPerSec.OneMinuteRate
          // kafka.brokers.2.topics.avro.internal.testbot.MessagesInPerSec.RateUnit
          angular.forEach(metricData, function(metric) {
            if (metric.name.endsWith(".health") && !metric.name.includes(".topics.")) {
              scope.metricName = $filter('metricNameForDisplay')(metric.name);

              scope.class = $filter('metricNameClass')(metric.name);
              scope.timestamp = metric.info.timestamp;
              scope.severity = metric.info.value;
              scope.serverTime = $window.localStorage.getItem('serverTime');
              scope.timeDiff = scope.serverTime - scope.timestamp;
              scope.metricObj = metric;
              scope.isUnavailable = (metric.info.value === "UNAVAILABLE");
              scope.healthClass = "health_" + healthStatus(metric.info.value, scope.timestamp, scope.timeDiff);
              scope.healthClass += (enableModalView(scope.severity) ? " clickable" : " ");
              scope.latestHealthStatus = metric.info.value;
            } else {
              var match;
              var brokerId, broker;
              scope.currentTopicList = [];
              scope.currentTopicData = $window.localStorage.getItem('currentTopics');
              if(scope.currentTopicData)
               scope.currentTopicList = scope.currentTopicData.split(",");
              //compare scope.topics with currentTopicList to check if any topic is deleted
              if(metric.name.endsWith(".available.topics")){
                if(scope.topics && scope.currentTopicList){
                   for(var topicObj in scope.topics){
                     if(scope.currentTopicList.indexOf(topicObj) === -1){
                        delete scope.topics[topicObj];
                      }
                   }
                }
              }
              // look for topics
              // jscs:disable maximumLineLength
              if ((match = metric.name.match(/^kafka\.brokers\.(\d+)\.topics\.(.*)\.((?:BytesInPerSec|BytesOutPerSec|MessagesInPerSec))\.(.*)/i)) !== null) {
                // example: [
                // "kafka.brokers.1.topics.avro.internal.testbot.BytesOutPerSec.Count",
                // "1", // broker id
                // "avro.internal.testbot", // topic
                // "BytesOutPerSec", // in or out metric
                // "Count", // sub-metric
                // index: 0,
                // input:
                // "kafka.brokers.1.topics.avro.internal.testbot.BytesOutPerSec.Count"
                // ]
                brokerId = match[1];
                var topic = match[2];
                var inOutMetric = match[3];
                var subMetric = match[4];
                broker = findBroker(brokerId);
                if (broker.topics === undefined) {
                  broker.topics = {};
                }
                scope.serverTime = $window.localStorage.getItem('serverTime');
                scope.timeDiff = scope.serverTime - metric.info.timestamp;
                //Add topic for display purpose into scope.topics only when that topic present in currentTopicList
                if(scope.currentTopicList.indexOf(topic) !== -1){
                    var addTopic = function(array, topic, metric, submetric, value, broker, timestamp) {
                      if (array[topic] === undefined) {
                        array[topic] = {};
                      }

                      if (array[topic][metric] === undefined) {
                        array[topic][metric] = {};
                      }

                      if (array[topic][metric][submetric] === undefined) {
                        array[topic][metric][submetric] = {};
                      }

                      array[topic][metric][submetric][broker] = value;
                     //updating each topic with it's own timestamp
                      array[topic].lastUpdateTime = timestamp;
                     };

                    if (!(hideInternalTopics && (ConfigService.topics.hidden).indexOf(topic) !== -1)) {
                      var value = metric.info.value === undefined ? "" : interpreteValue(metric.info.value);
                      var timestamp = metric.info.timestamp;
                      addTopic(broker.topics, topic, inOutMetric, subMetric, value, brokerId, timestamp);
                      addTopic(scope.topics, topic, inOutMetric, subMetric, value, brokerId, timestamp);
                    }
                }
              } else if ((match = metric.name.match(/^kafka\.brokers\.(\d+)\.topics\.(.*)\.health/i)) !== null) {
                // parse the kafka brokers health metric
                var topicExists = match[2];
                if ((!hideInternalTopics || (ConfigService.topics.hidden).indexOf(topicExists) === -1) &&
                    scope.timeDiff <= timestampTimeoutMs) {
                  if (scope.topics[topicExists] === undefined) {
                    scope.topics[topicExists] = {};
                  }

                  scope.topics[topicExists].lastUpdateTime = metric.info.timestamp;
                }
              } else if ((match = metric.name.match(/^kafka\.brokers\.(\d+)\.(.*)/i)) !== null) {
                // parse the other kafka brokers metrics
                brokerId = match[1];
                broker = findBroker(brokerId);
                var fields = match[2].split(".");
                var i;
                var current = broker;
                for (i = 0 ; i < fields.length ; i++) {
                  if (i === fields.length - 1) {
                    current[fields[i]] = metric.info.value === undefined ? "" : interpreteValue(metric.info.value);
                  } else if (current[fields[i]] === undefined) {
                    current[fields[i]] = {};
                  }

                  current = current[fields[i]];
                }
              } else if (metric.name === "kafka.nodes") {
                // list of nodes
                scope.nodes = (metric.info.value !== undefined ? metric.info.value.split(",") : metric.info.value);
              }
            }
          });

          showMetricUpdateAnimation($("pnda-kafka .health"));
        }
      };

      var healthStatusCallbackFn = function() {
        scope.serverTime = $window.localStorage.getItem('serverTime');
        scope.timeDiff = scope.serverTime - scope.timestamp;
        scope.healthClass = " health_" + healthStatus(scope.latestHealthStatus, scope.timestamp, scope.timeDiff);
      };

      scope.onGetMetricData({ cbFn: callbackFn, healthStatusCbFn: healthStatusCallbackFn });
    }
  };
}]);
