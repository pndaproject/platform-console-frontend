/*-------------------------------------------------------------------------------
* Name:        DeploymentManagerService.js
* Purpose:     Service for calling the backend packages API.
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

angular.module('appServices').factory('DeploymentManagerService', ['$resource', 'ConfigService', '$http', '$q',
  function($resource, ConfigService, $http, $q) {
    var packages = [];
    var deployedPackages = [];
    var packagesTimestamp, deployedPackagesTimestamp;
    var dataManager = ConfigService.backend["data-manager"];
    var packagesAPI = "http://" + dataManager.host + ":" + dataManager.port + "/packages";
    var applicationSummaryAPI = "http://" + dataManager.host + ":" + dataManager.port + "/applications";

    return {
      getPackages: function(force) {
        // get the list of packages from the backend data manager

        // if the list of packages is already available and we got the list recently, send this cached list
        // otherwise (or if we're forcing a refresh), get an updated list
        var now = Date.now();
        if (packages.length > 0 && force === undefined &&
          packagesTimestamp !== undefined && now - packagesTimestamp < Constants.PACKAGES_CACHING_DURATION) {

          var deferred = $q.defer();
          var promise = deferred.promise;
          deferred.resolve(packages);
          return promise;
        }

        // $q.all will wait for an array of promises to resolve,
        // then will resolve its own promise (which it returns)
        // with an array of results in the same order.
        return $q.all([
            $http.get(packagesAPI)
          ])
          .then(function(results) {
            packages = results[0].data.packages;
            packagesTimestamp = Date.now();
            return packages;
          });
      },
      getDeployedPackages: function(force) {
        // get the list of deployed packages from the backend data manager

        // if the list of deployed packages is already available and we got the list recently, send this cached list
        // otherwise (or if we're forcing a refresh), get an updated list
        var now = Date.now();
        if (deployedPackages.length > 0 && force === undefined
            && deployedPackagesTimestamp !== undefined
            && now - deployedPackagesTimestamp < Constants.PACKAGES_CACHING_DURATION) {

          var deferred = $q.defer();
          var promise = deferred.promise;
          deferred.resolve(deployedPackages);
          return promise;
        }

        // $q.all will wait for an array of promises to resolve,
        // then will resolve its own promise (which it returns)
        // with an array of results in the same order.
        return $q.all([
            $http.get(packagesAPI + "/deployed")
          ])
          .then(function(results) {
            deployedPackages = [];
            angular.forEach(results[0].data.deployedPackages, function(p) {
              var match;
              if ((match = p.match(/^(.*)-([\d\.]*)$/i)) !== null) {
                var packageName = match[1];
                var version = match[2];
                deployedPackages.push({ name: packageName, version: version });
              }
            });
            deployedPackagesTimestamp = Date.now();
            return deployedPackages;
          });
      },
      getPackageInfo: function(package) {
        // get the list of packages from the backend data manager

        // $q.all will wait for an array of promises to resolve,
        // then will resolve its own promise (which it returns)
        // with an array of results in the same order.
        return $q.all([
            $http.get(packagesAPI + "/" + package)
          ])
          .then(function(results) {
            packages = results[0].data;
            return packages;
          });
      },
      
      deploy: function(package) {
        return $http.put(packagesAPI + "/" + package);
      },
      undeploy: function(package) {
        return $http.delete(packagesAPI + "/" + package);
      },
      getPackageStatus: function(name) {
        var result = {};
        var packagesApiStatus = packagesAPI + "/" + name + "/status";
        return $q.all([
            $http.get(packagesApiStatus)
          ])
          .then(function(results) {
            result.status = results[0].data.status;
            result.information = results[0].data.information;
            return result;
          });
      },
      getApplications: function() {
        var applicationsApi = "http://" + dataManager.host + ":" + dataManager.port + "/applications";

        // $q.all will wait for an array of promises to resolve,
        // then will resolve its own promise (which it returns)
        // with an array of results in the same order.
        return $q.all([
            $http.get(applicationsApi)
          ])

          // process all of the results from the two promises
          // above, and join them together into a single result.
          // since then() returns a promise that resolves to the
          // return value of its callback, this is all we need
          // to return from our service method.
          .then(function(results) {
            if (typeof results[0].data === 'string') {
              // something went wrong. return status string
              return results[0].data;
            } else {
              // return application array
              return angular.isArray(results[0].data.applications) ? results[0].data.applications : [];
            }
          });
      },
      getApplicationInfo: function(name) {
        var dataManager = ConfigService.backend["data-manager"];
        var applicationsApi = "http://" + dataManager.host + ":" + dataManager.port + "/applications/";
        return $q.all([
            $http.get(applicationsApi + "/" + name)
          ])
          .then(function(results) {
            packages = results[0].data;
            return packages;
          });
      },
      getApplicationSummary: function(appName) {
          return $q.all([
              $http.get(applicationSummaryAPI + "/" + appName + "/summary")
            ])
            .then(function(results) {
              var summary = results[0].data;
              return summary;
            });
       },
      createApplication: function(name, body) {
        var dataManager = ConfigService.backend["data-manager"];
        var applicationsApi = "http://" + dataManager.host + ":" + dataManager.port + "/applications/" + name;
        var res = $http.put(applicationsApi, body);
        return res;
      },
      getApplicationStatus: function(name) {
        var result = {};
        var dataManager = ConfigService.backend["data-manager"];
        var applicationsApi = "http://" + dataManager.host + ":" + dataManager.port + "/applications/"
        + name + "/status";
        return $q.all([
            $http.get(applicationsApi)
          ])
          .then(function(results) {
            result.status = results[0].data.status;
            result.information = results[0].data.information;
            return result;
          });
      },
      destroyApplication: function(name) {
        var dataManager = ConfigService.backend["data-manager"];
        var applicationsApi = "http://" + dataManager.host + ":" + dataManager.port + "/applications/" + name;
        var res = $http.delete(applicationsApi);
        return res;
      },
      performApplicationAction: function(name, action) {
        var applicationsApi = "http://" + dataManager.host + ":" + dataManager.port
        + "/applications/" + name + "/" + action;
        var res = $http.post(applicationsApi);
        return res;
      },
      getEndpoints: function() {
        var endpointsAPI = "http://" + dataManager.host + ":" + dataManager.port + "/endpoints";

        // $q.all will wait for an array of promises to resolve,
        // then will resolve its own promise (which it returns)
        // with an array of results in the same order.
        return $q.all([
            $http.get(endpointsAPI),
            $http.get('/conf/dm_address_mapping.json')
          ])

          // process all of the results from the two promises
          // above, and join them together into a single result.
          // since then() returns a promise that resolves to the
          // return value of its callback, this is all we need
          // to return from our service method.
          .then(function(results) {
            var endpoints = results[0].data.endpoints;
            function replaceValuesInObject(obj, regexMatch, replacement) {
              var output = {};
              angular.forEach(obj, function(value, key) {
                if (angular.isObject(value)) {
                  var subObj = replaceValuesInObject(value, regexMatch, replacement);
                  output[key] = subObj;
                } else {
                  output[key] = value.replace(regexMatch, replacement);

//                  if (output[key] !== value) console.log(value, " -> ", output[key]);
                }
              });
              return output;
            }

            // parse the mapping file to find the new mappings and replace the values in the output of the endpoints API
            angular.forEach(results[1].data, function(replacement, key) {
              endpoints = replaceValuesInObject(endpoints, key, replacement);
            });
            return endpoints;
          });
      }
    };
  }]
);
