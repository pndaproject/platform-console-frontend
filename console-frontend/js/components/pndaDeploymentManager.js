/*-------------------------------------------------------------------------------
* Name:        pndaDeploymentManager.js
* Purpose:     Shows deployed applications on the home page.
*
* Author:      PNDA Team
* Created:     2016/04/01
* History:     2016/04/01 - Initial commit
*              2016/05/05 - Handled real time notifications when applications get deleted
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

angular.module('appComponents').directive('pndaDeploymentManager', ['$filter', 'DeploymentManagerService',
  '$timeout', 'socket', 'ModalService', 'HelpService',
  function($filter, DeploymentManagerService, $timeout, socket, ModalService, HelpService) {
    return {
      restrict: 'E',
      scope: {
        onGetMetricData: '&',
        showConfig: '&',
        showOverview: '&'
      },
      templateUrl: 'partials/components/pnda-deployment-manager.html',
      link: function(scope) {
        // initialise the scope, which will be updated when the callback function gets called by the controller
        scope.class = 'hidden';
        scope.healthClass = '';
        scope.metrics = {};
        scope.fullMetrics = {};
        scope.orderProp = "name";
        scope.severity = '';
        scope.pagecountApp = "5";
        scope.pages = [
            { value:"5", label:"5 Per Page" },
            { value:"10", label:"10 Per Page" },
            { value:"15", label:"15 Per Page" }
          ];
        scope.showDetails = function() {
          if (scope.severity) {
            scope.showOverview({ metricObj: scope.metricObj, metrics: scope.fullMetrics });
          }
        };

        scope.showHelp = function() {
          HelpService.showHelp('Deployment Manager', scope.metricObj.name);
        };

        scope.clickCog = function() {
          scope.showConfig({ metricObj: scope.metricObj });
        };
        
        scope.applications = [];
        scope.getAppsList = function() {
          DeploymentManagerService.getApplications().then(function(data) {
            if (angular.isArray(data)) {
              scope.applications = data;
            } else {
              console.log("DeploymentManagerService.getApplications() returned:", data);
            }
          });
        };

        scope.getAppsList();

        function displayConfirmation(message, actionIfConfirmed) {
          var modalOptions = {
            closeButtonText: 'Cancel',
            actionButtonText: 'Confirm',
            title: 'Warning',
            body: message,
            whenClose: function() {
              // don't do anything if the user closes the modal window
            },
            whenOk: function() {
              if (actionIfConfirmed !== undefined) {
                actionIfConfirmed();
              }
            }
          };

          ModalService.showModal(modalOptions);
        }

        scope.startOrStopApplication = function(name, status) {
          var action = status === Constants.APPLICATION.CREATED ? "start" : status === Constants.APPLICATION.STARTED
            ? "stop" : undefined;
          if (action !== undefined) {
            displayConfirmation("Are you sure you want to " + action + " " + name + "?", function() {
              scope.animateApplication(name, false);
              var res = DeploymentManagerService.performApplicationAction(name, action);
              res.then(function() {
                // success callback. update the app icon.
                scope.animateApplication(name, false);
              }, function() {
                // error callback. just animate the icon for now.
                scope.animateApplication(name, false);
              });
            });
          }
        };

        var spinnerSize = 28;
        var animationDuration = 1;
        function terminateApplicationAnimation(applicationName, target) {
          var found = scope.applications.find(function(element) {
            if (element.name === applicationName) {
              return element;
            }
          });

          // if the status of the application is still STARTING or STOPPING, keep animating
          var reRunAnimation = false;
          if (found === undefined) {
            console.log("Error: the application", applicationName, "could not be found");
          } else {
            reRunAnimation = found.status === Constants.APPLICATION.STARTING
              || found.status === Constants.APPLICATION.STOPPING;
          }

          if (reRunAnimation) {
            TweenLite.to(target, animationDuration, {
              rotation: "+360_cw", strokeDashoffset: 0.66 * spinnerSize,
              ease: Linear.easeNone, onComplete: scope.animateApplication, onCompleteParams: [applicationName, true]
            });
          } else {
            // as the new status has been received, terminate the animation and update the new status
            TweenLite.to(target, animationDuration, {
              rotation: 1080,
              strokeDashoffset: 0,
              ease: Linear.easeNone
            });
          }
        }

        scope.animateApplication = function(applicationName, rerun) {
          var target = "#" + $filter("applicationNameId")(applicationName) + " svg circle";

          // if it's the first run, start from angle 0
          if (rerun === undefined || !rerun) {
            TweenLite.fromTo(target, animationDuration, { rotation: 0, strokeDashoffset: 0,
              transformOrigin: "50% 50%" }, {
              rotation: "+720", strokeDashoffset: 3.14 * spinnerSize,
              ease: Linear.easeNone, onComplete: terminateApplicationAnimation,
              onCompleteParams: [applicationName, target]
            });
          } else {
            TweenLite.to(target, animationDuration, {
              rotation: "+720",
              ease: Power1.easeNone
            });
            TweenLite.to(target, 1, {
              strokeDashoffset: 2.9 * spinnerSize,
              ease: Linear.easeNone, onComplete: terminateApplicationAnimation,
              onCompleteParams: [applicationName, target]
            });
          }
        };

        function socketApplicationsUpdate(obj) {
          var foundIndex = -1;
          var found = scope.applications.find(function(element, index) {
            if (element.name === obj.id) {
              element.status = obj.state;
              foundIndex = index;
              return element;
            }
          });

          if (found === undefined) {
            found = {
              name: obj.id,
              status: obj.state
            };
            scope.applications.push(found);
          } else if (obj.state === Constants.APPLICATION.NOTCREATED && foundIndex !== -1) {
            // a NOTCREATED status means that the app has been destroyed so remove it from the array
            scope.applications.splice(foundIndex, 1);
          }
        }

        socket.on('platform-console-frontend-application-update', socketApplicationsUpdate);

        // when this scope gets destroyed, cancel the $timeout
        scope.$on('$destroy', function() {
        });

        // the callback function expects an array of matching metrics
        var oldestTimestamp;
        var callbackFn = function(metricData) {
          if (metricData.length > 0) {
            // for deployment manager we're looking for:
            // deployment-manager.packages_available_count
            // deployment-manager.packages_available_succeeded
            // deployment-manager.packages_available_time_ms
            // deployment-manager.packages_deployed_count
            // deployment-manager.packages_deployed_succeeded
            // deployment-manager.packages_deployed_time_ms
            oldestTimestamp = Date.now() + 60000; // one minute in the future
            angular.forEach(metricData, function(metric) {
              scope.fullMetrics[metric.name] = metric;

              scope.metrics[metric.name.substring(metric.name.lastIndexOf(".") + 1)] = metric.info.value;
              oldestTimestamp = Math.min(oldestTimestamp, metric.info.timestamp);
            });

            var healthMetric = metricData.find(function(element) {
              if (element.name.endsWith(".health")) {
                return element;
              }
            });

            if (healthMetric !== undefined) {
              scope.class = '';
              scope.timestamp = healthMetric.info.timestamp;
              scope.severity = healthMetric.info.value;
              scope.metricObj = healthMetric;
              scope.healthClass = "health_" + healthStatus(healthMetric.info.value, scope.timestamp);
              scope.healthClass += (enableModalView(scope.severity) ? " clickable" : " ");
              scope.latestHealthStatus = healthMetric.info.value;
              scope.isUnavailable = (healthMetric.info.value === "UNAVAILABLE");

              showMetricUpdateAnimation($("pnda-deployment-manager .health"));
            }
          }
        };

        var healthStatusCallbackFn = function(now) {
          scope.healthClass = " health_" + healthStatus(scope.latestHealthStatus, scope.timestamp, now);
        };

        scope.onGetMetricData({ cbFn: callbackFn, healthStatusCbFn: healthStatusCallbackFn });
      }
    };
  }]);
