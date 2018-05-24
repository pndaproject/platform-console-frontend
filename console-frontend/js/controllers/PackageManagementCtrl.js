/*-------------------------------------------------------------------------------
* Name:        PackageManagementCtrl.js
* Purpose:     Controller for the packages page.
*
* Author:      PNDA Team
* Created:     2016/04/01
* History:     2016/04/01 - Initial commit
*              2016/05/05 - Updated the default loading animation
*              2016/05/16 - Updated the messages being displayed when the deployment manager fails
*              2016/05/17 - Removed the use of global variables for modules
*              2016/05/19 - Refresh the view automatically when a package gets deleted through the package repo API
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

angular.module('appControllers').controller('PackageManagementCtrl', ['$scope', '$cookies', '$routeParams',
  'DeploymentManagerService', 'socket', '$filter', '$modal', '$location', 'ModalService', '$timeout',
  function($scope, $cookies, $routeParams, DeploymentManagerService, socket, $filter, $modal, $location,
    ModalService, $timeout) {
    $scope.packages = [];
    $scope.deployedPackages = [];
    $scope.gettingPackages = false;
    $scope.gettingDeployedPackages = false;

    $scope.orderProp = "name";

    $scope.packageName = $routeParams.packageName;

    var defaultTimeout = 500;
    var userName = $cookies.get('user');

    $scope.successCallback = function(result, packageName, intent) {
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

      $scope.choosenPackageName = packageName;

      if (status === Constants.PACKAGE.NOTDEPLOYED) {
        if (intent === Constants.PACKAGE.INTENT_DEPLOY) {
          $scope.alertClass = "alert-danger";
          $timeout(function() { $scope.responseText = (information !== null ? information : "Deploy failed!"); },
            defaultTimeout);
        } else {
          $scope.alertClass = "alert-success";
          $timeout(function() { $scope.responseText = "Undeploy successful!"; }, defaultTimeout);
        }
      } else if (status === Constants.PACKAGE.DEPLOYED) {
        if (intent === Constants.PACKAGE.INTENT_UNDEPLOY) {
          $scope.alertClass = "alert-danger";
          $timeout(function() {
            $scope.responseText = (information !== null ? information : "Undeploy failed!");
          }, defaultTimeout);
        } else {
          $scope.alertClass = "alert-success";
          $timeout(function() { $scope.responseText = information; }, defaultTimeout);
        }
      } else if (status === Constants.PACKAGE.DEPLOYING || status === Constants.PACKAGE.UNDEPLOYING || status === 202) {
        $scope.alertClass = "alert-info";
        $scope.responseText = status === Constants.PACKAGE.DEPLOYING ? "Deploying..." :
          status === Constants.PACKAGE.UNDEPLOYING ? "Undeploying..." : "Accepted. Checking Status...";

        var packageStatus = DeploymentManagerService.getPackageStatus(packageName);
        packageStatus.then(function(result) {
          setTimeout(function() {
            $scope.successCallback(result, packageName, intent);
          }, defaultTimeout);
        });
      } else {
        $timeout(function() {
          $scope.responseText = information;
        }, defaultTimeout);
        $scope.alertClass = "alert-danger";
        $timeout(function() { $scope.updatePackageList(true); }, defaultTimeout);
      }
    };

    $scope.errorCallback = function(error, packageName) {
      $scope.choosenPackageName = packageName;
      $scope.response = true;
      $scope.responseText = error.data.information;
      $scope.alertClass = "alert-danger";
    };

    $scope.dismissAlert = function() {
      $scope.response = false;
    };

    // define the function getting the list of packages and launch it straight away
    $scope.updatePackageList = function(force) {
      $scope.gettingPackages = true;
      DeploymentManagerService.getPackages(force).then(function(data) {
        $scope.packages = data;

        // if packageName is defined, we're interested in one package
        if ($scope.packageName !== undefined) {
          angular.forEach(data, function(p) {
            if (p.name === $scope.packageName) {
              $scope.packageDetails = p;
            }
          });
        }

        $scope.gettingPackages = false;
      });
    };

    $scope.updatePackageList();

    $scope.updateDeployedPackageList = function(force) {
      $scope.gettingDeployedPackages = true;
      DeploymentManagerService.getDeployedPackages(force).then(function(data) {
        $scope.deployedPackages = data;
        $scope.gettingDeployedPackages = false;
      });
    };

    $scope.updateDeployedPackageList();

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

    $scope.undeploy = function(packageName, version) {
      var package = packageName + "-" + version;
      displayConfirmation("Are you sure you want to undeploy " + package + "?", function() {
        DeploymentManagerService.undeploy(package, userName).then(function(result) {
          $scope.successCallback(result, package, Constants.PACKAGE.INTENT_UNDEPLOY);
        }, function(error) {
          $scope.errorCallback(error, package);
        });
      });
    };

    $scope.deploy = function(packageName, version) {
      var package = packageName + "-" + version;
      displayConfirmation("Are you sure you want to deploy " + package + "?", function() {
        var submitPackage = DeploymentManagerService.deploy(package, userName);
        submitPackage.then(function(result) {
          $scope.successCallback(result, package, Constants.PACKAGE.INTENT_DEPLOY);
        }, function(error) {
          $scope.errorCallback(error, package);
        });
      });
    };

    $scope.selectPackage = function(id) {
      $location.url('/packages/' + id);
    };

    var updatePackageAvailableStatus = function(name, version, status) {
      var foundPackage;
      var foundPackageIndex = -1;
      var i;
      for (i = 0 ; i < $scope.packages.length ; i++) {
        if ($scope.packages[i].name === name) {
          foundPackage = $scope.packages[i];
          foundPackageIndex = i;
          break;
        }
      }

      var packageVersion = {
        version: version,
        status: status
      };

      if (foundPackage !== undefined && angular.isArray(foundPackage.available_versions)) {
        var foundVersion = false;
        var foundVersionIndex = -1;
        for (i = 0 ; i < foundPackage.available_versions.length ; i++) {
          if (foundPackage.available_versions[i].version === version) {
            foundPackage.available_versions[i].status = status;
            foundVersion = true;
            foundVersionIndex = i;
            break;
          }
        }

        // if this version isn't found, add it
        if (!foundVersion) {
          foundPackage.available_versions.push(packageVersion);
        } else if (status === Constants.PACKAGE.NOTCREATED) {
          // delete one available version for this package
          // if there's no available package remaining, delete the package from the list of packages
          foundPackage.available_versions.splice(foundVersionIndex, 1);
          if (foundPackage.available_versions.length === 0) {
            $scope.packages.splice(foundPackageIndex, 1);
          }
        }
      } else if (status === Constants.PACKAGE.CREATED) {
        // add this new package to the list of packages
        var newPackage = {
          name: name,
          available_versions: [packageVersion],
          deployed_versions: []
        };
        $scope.packages.push(newPackage);
      }
    };

    function socketPackagesUpdate(obj) {
      // update the packages array when receiving an update
      var match;
      if ((match = obj.id.match(/^(.*)-([\d\.]*)$/i)) !== null) {
        var packageName = match[1];
        var version = match[2];

        updatePackageAvailableStatus(packageName, version, obj.state);

        // update the deployedPackages array as well
        if (obj.state === Constants.PACKAGE.DEPLOYED || obj.state === Constants.PACKAGE.NOTDEPLOYED) {
          $scope.updateDeployedPackageList(true);
        }
      } else {
        console.log("Error: could not identify name and versions for package", obj.id);
      }
    }

    socket.on('platform-console-frontend-package-update', socketPackagesUpdate);

    $scope.$on('$destroy', function() {
    });
  }]
);
