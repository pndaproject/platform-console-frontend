/*-------------------------------------------------------------------------------
* Name:        HelpService.js
* Purpose:     Service for showing the contextual help panel.
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

angular.module('appServices').service('HelpService', ['ConfigService', 'ModalService', '$http', '$window',
  function (ConfigService, ModalService, $http, $window) {
    var helpTopics = {};

    $http.get('help/topics.json').then(function(json) {
      helpTopics = json.data.helpTopics;
    });

    this.showHelp = function (name, key) {
      return this.show(name, key);
    };

    this.show = function (name, key) {
      var topic = helpTopics[key];
      var modalInfo = { title: name + " Help", body: "Help with " + key, actionButtonText: "OK" };

      if (topic !== undefined) {
        if (topic.title !== undefined) {
          modalInfo.title = topic.title + " Help";
        }

        if (topic.body !== undefined) {
          if (typeof topic.body === 'object') {
            modalInfo.bodyArray = topic.body;
            modalInfo.body = null;
          } else {
            modalInfo.body = topic.body;
          }
        }

        if (topic.link !== undefined) {
          modalInfo.closeButtonText = "More info…";
          modalInfo.whenClose = function() {
            var link = topic.link;
            if (typeof link === 'object') {
              link = link[ConfigService.hadoop_distro];
            }
            $window.open(link, 'HelpWindow');
          };
        }
      }

      ModalService.showModal(modalInfo);
    };
  }
]);
