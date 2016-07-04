/*-------------------------------------------------------------------------------
* Name:        DatasetsCtrl.js
* Purpose:     Controller for the datasets page.
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

angular.module('appControllers').controller('DatasetsCtrl', ['$scope', '$filter', '$http',
  'DatasetService', 'ModalService', 'ConfigService', 'UtilService',
  function($scope, $filter, $http, DatasetService, ModalService, ConfigService, UtilService) {
    $scope.datasets = []; // data that will be displayed
    $scope.oldDatasets = []; // copy of the data on the server
    $scope.changed = false;
    $scope.datasetsIndex = {};
    $scope.hiddenNames = ConfigService.datasets.hidden;
    $scope.orderProp = "id";

    // initializes datasetsIndex, indexing every dataset by its ID
    $scope.initIndex = function() {
      $scope.filteredDatasetCount = 0;
      for (var i = 0; i < $scope.datasets.length; i++) {
        var dataset = $scope.datasets[i];
        var id = dataset.id;
        if (id !== undefined) {
          $scope.datasetsIndex[dataset.id] = dataset;
          if (!UtilService.inArray(dataset.id, $scope.hiddenNames)) {
            $scope.filteredDatasetCount++;
          }
        }
      }
    };

    DatasetService.getDatasets().then(function(data) {
      $scope.datasets = data;
      $scope.oldDatasets = angular.copy(data); // makes a deep copy
      $scope.initIndex();
    });

    $scope.filterDatasets = function(dataset) {
      for (var i = 0; i < $scope.hiddenNames.length; i++) {
        if (dataset.id.indexOf($scope.hiddenNames[i]) !== -1) {
          return false;
        }
      }

      return true;
    };

    $scope.datasetChanged = function() {
      $scope.changed = !angular.equals($scope.datasets, $scope.oldDatasets);
    };

    $scope.save = function() {
      var errors = [];
      var messages = [];

      // compare the new and old datasets, and check for errors and messages
      validate(errors, messages);

      if (errors.length > 0) { // if there are any errors, display an alert
        // console.log(errors.join('\n'));
        displayError('Error', errors);
      } else if (messages.length > 0) { // if there are messages, display a confirm dialog
        // console.log(messages.join('\n'));
        displayConfirmation('Do you want to save changes?', messages, function() {
          performChanges();
          $scope.oldDatasets = angular.copy($scope.datasets); // fast forward the backup to the saved data
          $scope.changed = false;
        });
      }
    };

    function validate(errors, messages) {
      for (var i = 0; i < $scope.datasets.length; i++) {
        var dataset = $scope.datasets[i];
        var oldDataset = $scope.oldDatasets[i];
        var days = dataset.max_age_days;
        var oldDays = oldDataset.max_age_days;
        var gigs = dataset.max_size_gigabytes;
        var oldGigs = oldDataset.max_size_gigabytes;
        var message;

        // no need to validate hidden datasets
        if ($scope.hiddenNames !== undefined && $scope.hiddenNames.indexOf(dataset.id) !== -1) {
          continue;
        }

        if (dataset.mode !== oldDataset.mode) {
          if (dataset.mode === 'keep') {
            messages.push('Data for "' + dataset.id + '" will be kept indefinitely.');
          } else if (dataset.mode === 'archive') {
            messages.push('Data for "' + dataset.id + '" will be archived when it expires.');
          } else if (dataset.mode === 'delete') {
            messages.push('Data for "' + dataset.id + '" will be deleted when it expires.');
          }
        }

        if (dataset.mode !== 'keep') {
          if (dataset.policy === 'age' && (days === undefined || days <= 0)) {
            errors.push('The age for "' + dataset.id +
              '" should be a valid number.');
          }

          if (dataset.policy === 'size' && (gigs === undefined || gigs <= 0)) {
            errors.push('The size for "' + dataset.id +
              '" should be a valid number.');
          }

          if (dataset.policy !== oldDataset.policy) {
            message = 'The data retention policy for "' + dataset.id +
              '" will be changed from ' + oldDataset.policy + ' to ' + dataset.policy + '.';
            if (dataset.policy === 'age' && days > 0) {
              message += ' Data will be ' + past(dataset.mode) + ' after ' + plural(days, 'day') + '.';
            } else if (dataset.policy === 'size' && gigs > 0) {
              message += ' Data will be ' + past(dataset.mode) + ' after ' + gigs + ' GB.';
            }

            messages.push(message);
          } else {
            if (dataset.policy === 'age' && days !== oldDays) {
              message = 'The data retention age for "' + dataset.id +
                '" will be changed from ' + oldDays + ' to ' + days + ' days.';
              if (oldDays > days) {
                message += ' Up to ' + plural(oldDays - days, 'day') + ' of data could be ' + past(dataset.mode) + '.';
              }

              messages.push(message);
            } else if (dataset.policy === 'size' && gigs !== oldGigs) {
              message = 'The data retention size for "' + dataset.id +
                '" will be changed from ' + oldGigs + ' to ' + gigs + ' GB.';
              if (oldGigs > gigs) {
                message += ' Up to ' + (oldGigs - gigs) + ' GB of data could be ' + past(dataset.mode) + '.';
              }

              messages.push(message);
            }
          }
        }
      }
    }

    function plural(number, unit) {
      var formatted = String(number) + ' ' + unit;
      if (number !== 1) formatted += 's';
      return formatted;
    }

    function past(mode) {
      if (mode === 'keep') return 'kept'; // not needed but included for completeness
      if (mode === 'archive') return 'archived';
      if (mode === 'delete') return 'deleted';
      return mode;
    }

    function displayError(title, messages) {
      var modalOptions = {
        // closeButtonText: 'Cancel',
        actionButtonText: 'OK',
        title: title,
        bodyArray: messages,
        whenClose: function() {
          // don't do anything if the user closes the modal window
        },
        whenOk: function() {
          // nothing here either
        }
      };

      ModalService.showModal(modalOptions);
    }

    function displayConfirmation(title, messages, actionIfConfirmed) {
      var modalOptions = {
        closeButtonText: 'Cancel',
        actionButtonText: 'Save',
        title: title,
        bodyArray: messages,
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

    function performChanges() {
      for (var i = 0; i < $scope.datasets.length; i++) {
        var dataset = $scope.datasets[i];
        var oldDataset = $scope.oldDatasets[i];
        var days = dataset.max_age_days;
        var oldDays = oldDataset.max_age_days;
        var gigs = dataset.max_size_gigabytes;
        var oldGigs = oldDataset.max_size_gigabytes;
        var message = {};

        if (dataset.mode !== oldDataset.mode) {
          message.mode = dataset.mode;
        }

        if (dataset.policy !== oldDataset.policy) {
          message.policy = dataset.policy;

          if (dataset.policy === 'age' && days > 0) {
            message.max_age_days = days;
          } else if (dataset.policy === 'size' && gigs > 0) {
            message.max_size_gigabytes = gigs;
          }
        } else {
          if (dataset.policy === 'age' && days !== oldDays) {
            message.policy = dataset.policy;
            message.max_age_days = days;
          } else if (dataset.policy === 'size' && gigs !== oldGigs) {
            message.policy = dataset.policy;
            message.max_size_gigabytes = gigs;
          }
        }

        if (!angular.equals(message, {})) {
          DatasetService.updateDataset(dataset.id, message);
        }
      }
    }

    $scope.revert = function() {
      $scope.datasets = angular.copy($scope.oldDatasets);
      $scope.changed = false;
    };

    $scope.policies = ['age', 'size'];
    $scope.modes = ['keep', 'archive', 'delete'];
    $scope.class = 'pnda-datasets';
  }]
);
