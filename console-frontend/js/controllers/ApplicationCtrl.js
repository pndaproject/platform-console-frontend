/*-------------------------------------------------------------------------------
* Name:        ApplicationCtrl.js
* Purpose:     Controller for the applications page.
*
* Author:      PNDA Team
* Created:     2016/04/01
* History:     2016/04/01 - Initial commit
*              2016/04/20 - Added application metrics
*              2016/04/27 - Improved RegEx filtering of application metrics
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

angular.module('appControllers').controller('ApplicationCtrl', ['$scope', '$filter', '$cookies',
  'DeploymentManagerService', '$timeout', 'socket', '$compile', '$window', 'ModalService',
  'MetricService', 'UtilService', function($scope, $filter, $cookies, DeploymentManagerService,
    $timeout, socket, $compile, $window, ModalService, MetricService, UtilService) {

    var defaultTimeout = 500;

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

    function getStatusText(status) {
      var text = '';
      if (status !== undefined && status) {
        switch (status) {
          case 200:
            text = "Success. Reloading...";
            break;
          case 202:
            text = "Accepted. Checking status...";
            break;
          case 400:
            text = "Request body validation failed. Please try again.";
            break;
          case 404:
            text = "Not found.";
            break;
          case 409:
            text = "Application already exists! Please provide a different name.";
            break;
          case 500:
            text = "Internal server error.";
            break;
          case "NOTCREATED":
            text = "Success. Reloading...";
            break;
          case "CREATING":
            text = "Creating...";
            break;
          case "CREATED":
            text = "Created.";
            break;
          case "STARTING":
            text = "Starting...";
            break;
          case "STARTED":
            text = "Started.";
            break;
          case "STOPPING":
            text = "Stopping...";
            break;
          case "DESTROYING":
            text = "Deleting...";
            break;
        }
        return text;
      }
    }

    $scope.successCallback = function(result, applicationName, isNewApp) {
      isNewApp = isNewApp || false;
      var status;
      var information = null;
      if (result.status) {
        status = result.status;
      } else if (result) {
        status = result;
      }

      if (result.information !== "" && result.information !== undefined && result.information !== null) {
        information = result.information;
      }

      $scope.response = true;
      $scope.responseText = getStatusText(status);

      // NOTCREATED status when app gets deleted and DM doesn't know about it.
      if ((status === "NOTCREATED" && information === null) || status === "DESTROYING") {
        $scope.alertClass = "alert-success";
        $timeout($scope.getAppsList, 2000);
      } else if (status === 200 || status === "CREATED" || status === "STARTED") {
        $scope.alertClass = "alert-success";
        $timeout($scope.refreshAppsList(applicationName, status, isNewApp), 3000);
      } else if (status === 202 || status === "CREATING"
        || status === "STARTING" || status === "STOPPING") {
        $scope.alertClass = "alert-info";
        var appStatus = DeploymentManagerService.getApplicationStatus(applicationName);
        appStatus.then(function(result) {
          setTimeout(function() {
            $scope.successCallback(result, applicationName, isNewApp);
          }, defaultTimeout);
        });
      } else {
        // timeout needed to refresh element.
        $timeout(function() {
          $scope.responseText = information;
        }, defaultTimeout);
        $scope.alertClass = "alert-danger";

        $scope.creatingApp = false;

        // remove the application from appList
        $('#app_' + applicationName).empty();
      }
    };

    $scope.errorCallback = function(error) {
      $scope.response = true;
      var status = error.status;
      $scope.submitAppResponse = true;
      var msg = getStatusText(status);
      if (error.data.information) {
        msg += ' ' + error.data.information;
      }

      $scope.responseText = msg;
      $scope.alertClass = "alert-danger";
    };

    $scope.dismissAlert = function() {
      $scope.response = false;
    };

    function arrayObjectIndexOf(myArray, searchTerm, property) {
      for (var i = 0, len = myArray.length; i < len; i++) {
        if (myArray[i][property] === searchTerm.toString())  {
          $scope.getApplicationDetails(myArray[i]);
        }
      }

      return -1;
    }

    $scope.applications = [];

    /* refresh applications list */
    $scope.refreshAppsList = function(applicationName, status, isNewApp) {
      DeploymentManagerService.getApplications().then(function(data) {
        $scope.applications = data;
      });
      if (status === 'CREATED' && isNewApp) {
        if ($scope.applications.length > 0) {
          $timeout(function() {
            arrayObjectIndexOf($scope.applications, applicationName, "name");

            // the app has been created successfully, so we can now reset the creatingApp flag
            $scope.creatingApp = false;
          }, defaultTimeout);
        }
      } else {
        if ($scope.fullApplicationDetail && $scope.fullApplicationDetail.name === applicationName) {
          $scope.fullApplicationDetail.status = status;
          $scope.viewAppProps = false;
          DeploymentManagerService.getApplicationInfo(applicationName).then(function(data) {
             $scope.appDetailJson = data;
             $scope.viewAppProps = true;
           });
        }
      }

      $scope.response = false;
    };

    /* get applications list */
    $scope.getAppsList = function() {
      DeploymentManagerService.getApplications().then(function(data) {
        $scope.dmError = false;

        // an internal server error.
        if (typeof data === 'string') {
          $scope.dmError = true;
          $scope.alertClass = "alert-danger";
          $scope.responseText = "Internal Server Error. ";
          $scope.responseText += "Failed to reach application server";
        }

        $scope.applications = data;
        $scope.viewAppProps = false;
        $scope.response = false;
        $scope.newApp = false;
        $scope.showApplicationDetail = false;

        // by default, select the first application
        // makes the functionality of the page more obvious
        if ($scope.applications.length > 0 && !$scope.dmError) {
          $scope.getApplicationDetails($scope.applications[0]);
        }
      });
    };

    /* get package list */
    $scope.gettingDeployedPackages = false;
    $scope.getPackageList = function() {
      $scope.gettingDeployedPackages = true;
      DeploymentManagerService.getDeployedPackages().then(function(data) {
        $scope.packages = data;
        $scope.gettingDeployedPackages = false;
        var packagesArray = [];
        angular.forEach($scope.packages, function(item) {
          var packageWithVersions = {};
          packageWithVersions.name = item.name;
          packageWithVersions.version = item.version;
          packageWithVersions.detail = item.name + "-" + item.version;

          // push the json object into the array
          packagesArray.push(packageWithVersions);
        });
        $scope.packagesList = packagesArray;
      });
    };

    $scope.getAppsList();

    $scope.startOrStopApplication = function(name, status) {
      var action = status === Constants.APPLICATION.CREATED ? "start" : status === Constants.APPLICATION.STARTED
      ? "stop" : undefined;
      if (action !== undefined) {
        displayConfirmation("Are you sure you want to " + action + " " + name + "?", function() {
          var found = $scope.applications.find(function(element) {
            if (element.name === name) {
              return element;
            }
          });
          if (action === 'start') {
            found.status = 'STARTING';
			$scope.getApplicationSummary(name);
          } else if (action === 'stop') {
            found.status = 'STOPPING';
			$scope.getApplicationSummary(name);
          }

          // $scope.animateApplication(name, false);
          var res = DeploymentManagerService.performApplicationAction(name, action);
          res.then(function(result) {
          $scope.successCallback(result, name);
        }, function(error) {
          $scope.errorCallback(error);
        });
        });
      }
    };

    $scope.destroyApplication = function(name) {
      if (name !== undefined) {
        // $scope.animateApplication(name, false);
        displayConfirmation("Are you sure you want to delete " + name + "?", function() {
          var found = $scope.applications.find(function(element) {
            if (element.name === name) {
              return element;
            }
          });
          found.status = 'DESTROYING';
          var res = DeploymentManagerService.destroyApplication(name);
          res.then(function(result) {
            $scope.successCallback(result, name);
          }, function(error) {
            $scope.errorCallback(error);
          });
        });
      }
    };

    $scope.changeParentValue = function(newVal, $scope) {
      $scope.appJson = newVal.defaults;
      $scope.reloadAppProperties = true;
    };

    $scope.viewAppProps = false;

    $scope.getApplicationDetails = function(app) {
      if (app !== undefined && app !== $scope.fullApplicationDetail) {
        $scope.fullApplicationDetail = app;
        $scope.viewAppProps = false;
        DeploymentManagerService.getApplicationInfo(app.name).then(function(data) {
          $scope.appDetailJson = data;
          $scope.viewAppProps = true;
        });
		$scope.getApplicationSummary(app.name);
        $scope.showApplicationDetail = true;
        $scope.newApp = false;
        $scope.metricFilter = 'application\\.kpi\\.' + app.name + '\\.';
        $scope.appMetrics = $filter('getByNameForDisplay')($scope.allMetrics, $scope.metricFilter);
      }
    };
	
	$scope.getApplicationSummary = function(appName){
       DeploymentManagerService.getApplicationSummary(appName).then(function(data) {
         $scope.appSummaryJson = data;
       });
    };

    $scope.createNewApp = function() {
      $scope.newApp = true;
      $scope.creatingApp = false;
      $scope.getPackageList();
      $scope.choosePackage = true;
      $scope.showProperties = false;
      $scope.showPagerForPropertiesView = false;
      $scope.showPagerForSubmitView = false;
      $scope.reloadAppProperties = false;
      $scope.confirmProperties = false;
    };
	
    $scope.showInfoModal = function(){
    var fields = {};
    var appName;
    if($scope.appSummaryJson === undefined){
       fields = {
       error: "ERROR: Request is not successful."
       };
       ModalService.createModalView('partials/modals/application-status-error.html', fields);
    
    }else if($scope.appSummaryJson !== undefined 
            && $scope.appSummaryJson[Object.keys($scope.appSummaryJson)[0]].status !== undefined){
        appName = Object.keys($scope.appSummaryJson)[0];
        fields = {
            error: "No Data found. Please refresh the page and try again later.",
            title: 'application',
            name: appName
        };
        ModalService.createModalView('partials/modals/application-status-error.html', fields);

    }else{
     appName = Object.keys($scope.appSummaryJson)[0];
     var oozieComponents = [];
     var sparkComponents = [];
     fields = {
         title: 'warning',
         name: appName,
         showTable: false,
     };
    fields.showSubComponent = function(){
         $('#showOozie').addClass("hidden");
         if($('#hideOozie').hasClass("hidden"))
            $('#hideOozie').removeClass("hidden");
    };
    fields.hideSubComponent = function(){
         $('#hideOozie').addClass("hidden");
         if($('#showOozie').hasClass("hidden"))
           $('#showOozie').removeClass("hidden");
    };
    fields.showWorkflow = function(index){
         $('#showWorkflow-'+index).addClass("hidden");
         if($('#hideWorkflow-'+index).hasClass("hidden"))
            $('#hideWorkflow-'+index).removeClass("hidden");
    };
    fields.hideWorkflow = function(index){
         $('#hideWorkflow-'+index).addClass("hidden");
         if($('#showWorkflow-'+index).hasClass("hidden"))
            $('#showWorkflow-'+index).removeClass("hidden");
     };
     fields.showSummary = function(id){
        if($('#stageJobSummary-'+id).hasClass("hidden"))
           $('#stageJobSummary-'+id).removeClass("hidden");
    };
    fields.hideSummary = function(id){
        if(!$('#stageJobSummary-'+id).hasClass("hidden"))
            $('#stageJobSummary-'+id).addClass("hidden");
    };
   
    for (var keys in $scope.appSummaryJson[appName]){
        if(keys.startsWith("oozie")){
          if($scope.appSummaryJson[appName].hasOwnProperty(keys)){
                var oozieObject = {};
                for(var property in $scope.appSummaryJson[appName][keys]){
                oozieObject[property] = $scope.appSummaryJson[appName][keys][property];
                }
                oozieComponents.push(oozieObject);
           }
        }
        if(keys.startsWith("spark")){
            if($scope.appSummaryJson[appName].hasOwnProperty(keys)){
                var sparkObject = {};
                for(var prop in $scope.appSummaryJson[appName][keys]){
                    sparkObject[prop] = $scope.appSummaryJson[appName][keys][prop];
                }
                sparkComponents.push(sparkObject);
            }
        }
     }
     if(sparkComponents.length > 0){
         fields.sparkComponents = sparkComponents;
     }
    if(oozieComponents.length > 0){
         fields.oozieComponents = oozieComponents;
    }
    ModalService.createModalView('partials/modals/application-status.html', fields);
    }
   };

    $scope.appInfo = null;
    $scope.json = {};
    $scope.response = false;
    $scope.creatingApp = false;

    $scope.chooseApplicationProperties = function(name) {
      $scope.appDetail = name;
      $scope.newApp = true;
      $scope.showPagerForPropertiesView = true;
      $scope.showPagerForSubmitView = false;
      $scope.choosePackage = false;
      $scope.showProperties = true;

      $scope.saved = false;
      $scope.getOverrides = function(json) {
        $scope.json = json;
        $scope.saved = true;
      };

      $scope.confirmProperties = false;
      DeploymentManagerService.getPackageInfo($scope.appDetail).then(function(data) {
        $scope.changeParentValue(data, $scope);
      });
    };

    // $scope.appDetail = null;
    $scope.confirmApplication = function(name) {
      $scope.reloadAppProperties = false;
      $scope.appDetailName = name;
      $scope.newApp = true;
      $scope.appProperties = $scope.json;
      $scope.showPagerForPropertiesView = false;
      $scope.showPagerForSubmitView = true;
      $scope.choosePackage = false;
      $scope.showProperties = false;
      $scope.confirmProperties = true;
    };

    $scope.submitApplication = function(package) {
      $scope.appNameisEmpty = false;
      var applicationName = $('#applicationName').val();
      var userName = $cookies.get('user');
      var appProperties = $scope.json;
      var finalAppJson = {};
      finalAppJson = appProperties;
      finalAppJson.package = package;
      finalAppJson.user = userName;
      $scope.response = false;
      $scope.appNameError = false;
      if (applicationName === "") {
        $scope.appNameError = true;
        $scope.appNameErrorText = 'Sorry. Please specify an application name';
      } else if (/^[a-zA-Z0-9-_]*$/.test(applicationName) === false) {
        $scope.appNameError = true;
        $scope.appNameErrorText = "Your app name string contains illegal characters. ";
        $scope.appNameErrorText += "Characters allowed: a-z, A-Z, 0-9, -, _.";
      } else {
        $scope.creatingApp = true;
        var submitApp = DeploymentManagerService.createApplication(applicationName, finalAppJson);
        submitApp.then(function(result) {
          $scope.successCallback(result, applicationName, true);
        }, function(error) {
          $scope.creatingApp = false;
          $scope.errorCallback(error);
        });
      }
    };

    $scope.dismissAppSubmitErrorAlert = function() {
      $scope.appNameError = false;
      $scope.submitAppResponse = false;
    };

    function socketApplicationsUpdate(obj) {
      var foundIndex = -1;
      var found = $scope.applications.find(function(element, index) {
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
        $scope.applications.push(found);
      } else if (obj.state === Constants.APPLICATION.NOTCREATED && foundIndex !== -1) {
        // a NOTCREATED status means that the app has been destroyed so remove it from the array
        $scope.applications.splice(foundIndex, 1);
      }
    }

    socket.on('platform-console-frontend-application-update', socketApplicationsUpdate);

    $scope.appMetrics = [];

    $scope.allMetrics = MetricService.query(function(response) {
      angular.forEach(response, function(metric) {
        // turn the 'value' promise into its value when it's available
        metric.info.then(function(response) {
          metric.info = response[0];
          metric.info.causes = (metric.info.causes === undefined || metric.info.causes === "" ? [] :
            UtilService.isJson(metric.info.causes) ? JSON.parse(metric.info.causes) : [metric.info.causes]);
          metric.info.displayCauses = metric.info.causes.length > 0;
        });
      });
    });

    // update metrics when socket.io updates are received.
    function socketMetricsUpdate(obj) {
      var causes = (obj.causes === undefined || obj.causes === "" ? [] : obj.causes
        && UtilService.isJson(obj.causes) ? JSON.parse(obj.causes) : [obj.causes]);

      var displayCauses = causes.length > 0;
      var found = $scope.allMetrics.find(function(element) {
        if (element.name === obj.metric) {
          element.info.value = obj.value;
          element.info.source = obj.source;
          element.info.timestamp = obj.timestamp;
          element.info.causes = causes;
          element.info.displayCauses = displayCauses;

          // console.log("Updated app metric: " + element.name);
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

        // console.log("Found new app metric: " + found.name);
        $scope.allMetrics.push(found);

        // if there's a new metric, re-filter the list
        if ($scope.fullApplicationDetail !== undefined && $scope.fullApplicationDetail.name !== undefined) {
          $scope.appMetrics = $filter('getByNameForDisplay')($scope.allMetrics, $scope.metricFilter);
        }
      }
    }

    socket.on('platform-console-frontend-metric-update', socketMetricsUpdate);
  }]);
