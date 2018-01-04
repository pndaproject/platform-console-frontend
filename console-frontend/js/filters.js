/*-------------------------------------------------------------------------------
* Name:        filters.js
* Purpose:     Filters used by the controllers and the view templates (partials).
*
* Author:      PNDA Team
* Created:     2016/04/01
* History:     2016/04/01 - Initial commit
*              2016/05/06 - Added the sumValues filter
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

var metricFilters = angular.module('appFilters', []);

metricFilters.filter('toArray', function () {
  return function (obj, addKey) {
    if (!(obj instanceof Object)) {
      return obj;
    }

    if (addKey === false) {
      return Object.values(obj);
    } else {
      return Object.keys(obj).map(function (key) {
        return Object.defineProperty(obj[key], '$key', { enumerable: false, value: key });
      });
    }
  };
});

metricFilters.filter('naturalSort', function() {
  function naturalSort(a, b) {
      var aparts = a.split(/(\d+)/).filter(Boolean);
      var bparts = b.split(/(\d+)/).filter(Boolean);
      var i;
      for (i = 0; i < aparts.length; i++) {
        // no more parts in b, b < a
        if (i >= bparts.length) {
          return 1;
        }

        var apartstr = aparts[i];
        var bpartstr = bparts[i];
        var apartnum = parseInt(apartstr, 10);
        var bpartnum = parseInt(bpartstr, 10);

        // if both parts string, compare as strings
        if (isNaN(apartnum) && isNaN(bpartnum)) {
          if (apartstr < bpartstr) {
            return -1;
          } else if (apartstr > bpartstr) {
            return 1;
          }
        }

        // if string vs number, number < string
        else if (isNaN(apartnum)) {
          return 1;
        } else if (isNaN(bpartnum)) {
          return -1;
        }

        // if both parts numbers compare as numbers
        else {
          if (apartnum < bpartnum) {
            return -1;
          } else if (apartnum > bpartnum) {
            return 1;
          }
        }

        // if same move to next part
      }

      // no more parts in a, a < b
      return -1;
    }

  return function(arrInput) {
    var arr = arrInput.sort(function(a, b) {
      var sortResult = naturalSort(a.$key, b.$key);
      return sortResult;
    });
    return arr;
  };
});

metricFilters.filter('formatNumbers', ['ConfigService', '$filter', function(ConfigService, $filter) {
  function formatNumbersFilter(input, metricName, displaySpace, displayUnit) {
    if (input === undefined || metricName === undefined || ConfigService.metrics === undefined) {
      return input;
    }

    // a list of nodes (metric name ending in '.nodes') is a comma separated list of IP:port fields
    // we need to insert a space after each comma for those
    if (metricName.endsWith(".nodes")) {
      return input.replace(/,/g, ", ");
    }

    // only handle numbers otherwise
    if (isNaN(input)) {
      return input;
    }

    var value = input;
    var metricUnit = ConfigService.metrics[metricName];
    if (metricUnit !== undefined) {
      while (value > 1024 && metricUnit !== "TB") {
        switch (metricUnit) {
          case "B":
            value /= 1024;
            metricUnit = "KB";
            break;
          case "KB":
            value /= 1024;
            metricUnit = "MB";
            break;
          case "MB":
            value /= 1024;
            metricUnit = "GB";
            break;
          case "GB":
            value /= 1024;
            metricUnit = "TB";
        }
      }

      // round the value
      //value = Math.round(value * 10) / 10;
    }

    // format the value (for thousands and decimals)
    // we want to show decimals only
    value = $filter('number')(value, 1);//(metricUnit !== undefined ? 2 : 0));

    value = value.toString().replace(/\.[0]*$/, '');

    var showSpace = (displaySpace !== undefined ? displaySpace : true);
    var showUnit = (displayUnit !== undefined ? displayUnit : true);

    return value + (metricUnit !== undefined && showUnit ? (showSpace ? " " : "") + metricUnit : "");
  }

  formatNumbersFilter.$stateful = true;
  return formatNumbersFilter;
}]);

/* Sums the values (transformed from string to int) of an array */
metricFilters.filter('sumValues', function() {
  return function(input) {
    var sum = 0;
    angular.forEach(input, function(value) {
      sum += parseInt(value, Constants.RADIX_DECIMAL);
    });
    return sum;
  };
});

metricFilters.filter('changeAppStatusForDisplay', function() {
  return function(status) {
    function capitalizeFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }

    var display = '';
    if (status !== undefined && status !== "" && status !== null) {
      display = capitalizeFirstLetter(status);
      switch (status) {
        case "NOTCREATED":
          display = "Not created";
          break;
        case "CREATING":
          display = "Creating...";
          break;
        case "CREATED":
          display = "Stopped";
          break;
        case "STARTING":
          display = "Starting...";
          break;
        case "STARTED":
          display = "Running";
          break;
        case "STOPPING":
          display = "Stopping...";
          break;
      }
    }

    return display;
  };
});

// return a list of all element matching the regex name in an array of metrics or metricCallbacks
metricFilters.filter('getByName', function() {
  return function(input, name) {
    var matches = [];
    var i = 0;
    var len = input.length;
    for (; i < len; i++) {
      if (input[i].name.match(name) !== null || name.match(input[i].name) !== null) {
        matches.push(input[i]);
      }
    }

    return matches;
  };
});

// return a list of all element matching the regex name in an array of metrics
// and also add a more appropriate display name (i.e. stripped from the internal
// filtering info).
metricFilters.filter('getByNameForDisplay', function(getByNameFilter) {
  return function(input, name) {
    var array = getByNameFilter(input, name);
    console.log("in: " + array.length);
    var regexp = new RegExp(name);
    array.forEach(function(item, index, array) {array[index].displayName = array[index].name.replace(regexp, '');});
    console.log("out: " + array.length);
    return array;
  };
});

// transform a metric name into a class that can be referenced in a CSS file
metricFilters.filter('metricNameClass', function() {
  return function(metricName) {
	if(metricName !== undefined)
    return metricName.toString().replace(/\./g, '-');
  };
});

// transform an application name into an ID that can be referenced in a CSS file
metricFilters.filter('applicationNameId', function() {
  return function(appName) {
	if(appName !== undefined)
    return "app_" + appName.toString().replace(/\./g, '-');
  };
});

metricFilters.filter('metricNameForDisplay', function() {
  return function(metricName) {
    var display = metricName;
    switch (metricName) {
      case "hadoop.CLUSTER_MANAGER.health":
        display = "Cluster Manager";
        break;
      case "hadoop.HUE.health":
        display = "Hue";
        break;
      case "hadoop.HQUERY.health":
        display = "Hive Query";
        break;
      case "hadoop.IMPALA.health":
        display = "Impala";
        break;
      case "opentsdb.health":
        display = "OpenTSDB";
        break;
      case "hadoop.HBASE.health":
        display = "HBase";
        break;
      case "hadoop.HIVE.health":
        display = "Hive Metastore";
        break;
      case "hadoop.YARN.health":
        display = "YARN";
        break;
      case "hadoop.OOZIE.health":
        display = "Oozie";
        break;
      case "hadoop.HDFS.health":
        display = "HDFS";
        break;
      case "kafka.health":
        display = "Kafka";
        break;
      case "zookeeper.health":
        display = "Zookeeper";
        break;
      case "hadoop.SPARK_ON_YARN.health":
        display = "Spark";
        break;
    }
    return display;
  };
});

metricFilters.filter('severityForDisplay', function() {
  return function(severity) {
    var display = severity;
    switch (severity) {
      case "WARN":
        display = "Warning";
        break;
      case "ERROR":
        display = "Error";
        break;
    }
    return display;
  };
});

metricFilters.filter('simplifyTime', function() {
  return function(millis, days, hours, minutes) {

    var res = "";
    if (days > 0) {
      res = days + " day" + (days > 1 ? "s " : " ");
    } else if (hours > 0) {
      res = hours + " hour" + (hours > 1 ? "s" : "");
    } else if (minutes > 0) {
      res = minutes + " minute" + (minutes > 1 ? "s" : "");
    } else {
      res = "just now";
    }

//    if (days > 0) {
//      res = days + " day" + (days > 1 ? "s " : " ");
//    }
//    if (hours > 0 || res.length > 0) {
//      res += hours + " hour" + (hours > 1 ? "s " : " ");
//    }
//    if (minutes > 0 || res.length > 0) {
//      res += minutes + " min" + (minutes > 1 ? "s " : " ");
//    }
//    res += seconds + " sec" + (seconds > 1 ? "s" : "");

    return res;
  };
});

metricFilters.filter('range', function() {
  return function(input, total) {
    total = parseInt(total, Constants.RADIX_DECIMAL);

    for (var i = 0; i < total; i++) {
      input.push(i);
    }

    return input;
  };
});

metricFilters.filter('plural', function() {
  return function(input, textToPluralize) {
    return input + " " + textToPluralize + (input > 1 ? "s" : "");
  };
});

metricFilters.filter('orderObjectBy', function() {
  return function(object, field, reverse) {
    var array = [];
    angular.forEach(object, function(obj) {
      array.push(obj);
    });
    array.sort(function (a, b) {
      return (a[field] > b[field] ? 1 : -1);
    });
    if (reverse) {
      array.reverse();
    }

    return array;
  };
});

// takes a json object, stringifies it and adds spaces for display
metricFilters.filter('addJsonSpaces', function() {
  return function(input) {
    var output = input;
    if (input !== undefined) {
      output = JSON.stringify(output);
      output = output.replace(/:/g, ": ");
      output = output.replace(/,/g, ", ");
    }

    return output;
  };
});
