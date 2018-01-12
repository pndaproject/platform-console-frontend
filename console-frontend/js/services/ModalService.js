/*-------------------------------------------------------------------------------
* Name:        ModalService.js
* Purpose:     Service providing a confirmation modal view with two buttons.
* Params:      This service expects a JSON object containing the following:
*
* @param title             title of the modal view
* @param body              body text to display
* @param closeButtonText   text for the Close button
* @param actionButtonText  text for the OK button
* @param whenClose         function to call when the Close button is clicked
* @param whenOk            function to call when the OK button is clicked
*
* Author:      PNDA Team
* Created:     2016/04/01
* History:     2016/04/01 - Initial commit
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

/**
 */
angular.module('appServices').service('ModalService', ['$modal','$filter',
  function ($modal, $filter) {
    this.showModal = function (customModalOptions) {
      return this.show(customModalOptions);
    };

    this.show = function (customModalOptions) {
      var confirmModalCtrl = function($scope) {
        $scope.modalOptions = customModalOptions;
        $scope.modalOptions.close = function() {
          if (customModalOptions.whenClose !== undefined) {
            customModalOptions.whenClose();
          }

          $scope.$hide();
        };

        $scope.modalOptions.ok = function() {
          if (customModalOptions.whenOk !== undefined) {
            customModalOptions.whenOk();
          }

          $scope.$hide();
        };
      };

      confirmModalCtrl.$inject = ['$scope'];
      var myModal = $modal({
        controller: confirmModalCtrl, templateUrl: 'partials/modals/confirm.html', show: false
      });
      myModal.$promise.then(myModal.show);
    };

    this.createModalView = function(templateUrl, scopeFields) {
      // bind the data prior to creating the modal overlay
      function MyModalController($scope) {
        angular.forEach(scopeFields, function(value, key) {
          $scope[key] = value;
        });
      }

      MyModalController.$inject = ['$scope','$filter'];

      // use a partial view template to create the modal view,
      // and it will then use the data we bound to it above.
      var myModal = $modal({
        templateUrl: templateUrl,
        controller: MyModalController,
        show: false
      });

      myModal.$promise.then(myModal.show);
    };
    
    this.showPndaInfo = function(config) {
      var fields = {
        components: [
          { name: "Console front-end", version: config.frontend.version }
        ]
      };

      this.createModalView('partials/modals/about.html', fields);
    };
  }
]);
