/*-------------------------------------------------------------------------------
* Name:        pndaTreeView.js
* Purpose:     Takes a JSON object and displays it in a tree view.
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

angular.module('appComponents').directive('pndaTreeView', ['$filter', function() {
  return {
    restrict: 'E',
    scope: {
      onConfirmOverrides: '&',
      editable: '@',
      json: '@', // reading from the parent controller. Note that this is a string
      autoSave: '@'
    },
    templateUrl: 'partials/components/pnda-tree-view.html',
    link: function(scope) {
      /**
       * Traverses a JSON object and transforms it in a an array for display.

       * @param o     JSON object to parse
       * @param array array to add rows to
       * @param level current depth level for parsing
       */
      function jsonTraverse(o, array, level) {
        var type = typeof o;
        if (level === undefined) {
          level = 0;
        }

        if (type === "object") {
           Object.keys(o).sort().forEach( function(key) {
           array.push({ level: level, key: key, collapsed: false, visible: true });
           jsonTraverse(o[key], array, level + 1);
           });
        } else {
          var previousElement = array[array.length - 1];
          previousElement.value = String(o);
          previousElement.newValue = String(o);
          delete previousElement.collapsed;
        }
      }
      /**
       * Transforms an array used for display back to a JSON object.

       * @param array         array to transform to a JSON object
       * @param previousLevel level of depth used for the previous row
       * @returns JSON object
       */
      function arrayToJSON(array, previousLevel) {
        var res = {};
        if (previousLevel === undefined) {
          previousLevel = -1;
        }

        for (var i = 0 ; i < array.length ; i++) {
          var currentLevel = array[i].level;
          var key = array[i].key;
          var val = array[i].value;
          var subarray = [];

          // only deal with objects one level below. Other levels are being handled by recursion
          if (currentLevel === previousLevel + 1) {
            // if the current object is an array
            if (val === undefined) {
              var j = i + 1;
              while (j < array.length && array[j].level > currentLevel) {
                subarray.push(array[j]);
                j++;
              }
              res[key] = arrayToJSON(subarray, currentLevel);
            } else {
              res[key] = val;
            }
          }
        }

        return res;
      }

      /**
       * Like the arrayToJSON function, this goes through an array used for display and
       * transforms it back to a JSON object.
       * However it only outputs the values that have been changed.
       
       * @param array         array to transform to a JSON object
       * @param previousLevel level of depth used for the previous row
       * @returns JSON object
       */
      function exportOverrides(array, previousLevel) {
        var res = {};
        if (previousLevel === undefined) {
          previousLevel = -1;
        }

        var atLeastOneChange = false;
        for (var i = 0 ; i < array.length ; i++) {
          var currentLevel = array[i].level;
          var key = array[i].key;
          var val = array[i].value;
          var newValue = array[i].newValue;
          var subarray = [];

          // only deal with objects one level below. Other levels are being handled by recursion
          if (currentLevel === previousLevel + 1) {
            // if the current object is an array
            if (val === undefined) {
              var j = i + 1;
              while (j < array.length && array[j].level > currentLevel) {
                subarray.push(array[j]);
                j++;
              }

              var overridesLevelDown = exportOverrides(subarray, currentLevel);
              if (overridesLevelDown.changed) {
                res[key] = overridesLevelDown.overrides;
                atLeastOneChange = true;
              }
            } else {
              if (val !== newValue) {
                res[key] = newValue;
                atLeastOneChange = true;
              }
            }
          }
        }

        return { overrides: res, changed: atLeastOneChange };
      }

      scope.isNode = function(row) {
        return row.value === undefined;
      };

      scope.calculatePadding = function(row) {
        // if row.value is undefined, we're dealing with an array and there will be a + or - icon displayed
        // otherwise because there is an +/- sign in the row above, we want to add a bit more padding
        var padding = 15 * row.level + (scope.isNode(row) || row.level === 0 ? 0 : 12);
        return padding;
      };

      function changeVisibilityForNodeAtIndexAndChildren(index, visibility, parentLevel) {
        while (index < scope.jsonObject.length && scope.jsonObject[index].level > parentLevel) {
          var o = scope.jsonObject[index];
          if (scope.isNode(o)) {
            index = changeVisibilityForNodeAtIndexAndChildren(index + 1, visibility && !o.collapsed, o.level);
            o.visible = visibility;
          } else {
            o.visible = visibility;
            index++;
          }
        }

        return index;
      }

      scope.toggleCollapse = function(row, index) {
        row.collapsed = !row.collapsed;

        // toggle visibility status for all children elements
        var visibility = row.collapsed ? false : true;
        var i = index + 1;
        while (i < scope.jsonObject.length && scope.jsonObject[i].level > row.level) {
          i = changeVisibilityForNodeAtIndexAndChildren(i, visibility, row.level);
        }
      };

      // as scope.json is being passed from the parent controller as a string, we need to transform it
      // to a JSON object first - only when scope.json is ready
      scope.$watch('json', function(newval) {
        if (newval.length > 0) {
          scope.json = JSON.parse(scope.json);

          // JSON object in the right format for display with pnda-tree-view.html
          scope.jsonObject = [];
          jsonTraverse(scope.json, scope.jsonObject);
        }
      });
      // scope.editable is also a string and we need to convert it to a boolean
      scope.editable = scope.editable === "true";

      // scope.autoSave is also a string to be converted to a boolean
      scope.autoSave = scope.autoSave === "true";

      /**
       * Revert the value for a specific row.

       * @param row  the row to revert to its original value
       */
      scope.revertValue = function(row) {
        row.newValue = row.value;
        scope.confirmOverrides();
      };

      /**
       * Go over the array and determine was values have changed.
       
       * @param calledBySaveButton  indicates that this was called by clicking on the Save button
       * @returns overrides as a JSON object
       */
      scope.confirmOverrides = function(calledBySaveButton) {
        if (calledBySaveButton || scope.autoSave) {
          var overrides = exportOverrides(scope.jsonObject);

          scope.onConfirmOverrides({ overrides: overrides.overrides });
        }
      };
    }
  };
}]);
