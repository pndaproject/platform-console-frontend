/*-------------------------------------------------------------------------------
* Name:        DatasetService.js
* Purpose:     Service for calling the backend datasets API.
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

angular.module('appServices').factory('DatasetService', ['$resource', 'ConfigService', '$http', '$q',
  function($resource, ConfigService, $http, $q) {
    return {
      getDatasets: function() {
        var uri ='/api/dm/datasets';
        return $q.all([$http.get(uri)]).then(function(data) {
          return data[0].data.data;
        });
      },
      updateDataset: function(id, message) {
        var uri = '/api/dm/datasets/' + id;
        // console.log('PUT ' + uri + ' ' + JSON.stringify(message));
        $http.put(uri, message).then(function() {
          // console.log('Updated dataset ' + id);
        }, function() {
          console.log('Failed to update dataset ' + id);
        });
      }
    };
  }]
);
