# Change Log
All notable changes to this project will be documented in this file.

## [Unreleased]
### Added:
- PNDA-3562: Add PAM authentication

### Changed:
- PNDA-3601: disable emailtext in Jenkins file and replace it with notifier stage and job

## [0.2.1] 2017-11-24
### Fixed:
- ISSUE-45: Added UI for opentsdb component with info, help, settings icons and color code for health status in console homepage.
### Added:
- PNDA-2445: Support for Hortonworks HDP
- PNDA-439: When creating an application the user to run the application as is now a required field in the form.

## [0.2.0] 2017-06-29
### Added:
- PNDA-2691: Refactor for offline installation
### Changed
- PNDA-2827: Changed the display of the application metrics to lose the filter info.
- PNDA-3098: Sort kafka topics by name PNDA console.
### Fixed
- PNDA-2374: Pin down specific dependencies
- PNDA-3016: When kafka topics have been deleted stop showing them in the PNDA console.
- PNDA-3086: Limit number of metrics shown on the metrics tab to 50, use the filter feature to show the others.

## [0.1.4] 2017-01-02
### Changed
- PNDA-2537: modify version of grunt compress to 1.3.0 in order to work with npm 3.10
- PNDA-2499: Display the error text returned from the deployment manager

## [0.1.3] 2016-12-12
### Changed
- PNDA-2340: All components appear on the curated view regardless of which components are actually provisioned
- Externalized build logic from Jenkins to shell script so it can be reused

## [0.1.2] 2016-10-21
### Changed
- PNDA-2272: Only show links to parts of the system which are present to allow modularisation of PNDA

## [0.1.1] 2016-09-13
### Changed
- Enhanced CI support

## [0.1.0] 2016-07-01
### First version

## [Pre-release]

### 2016-06-02
* Dataset management view improvements.

### 2016-05-26
* Updated the package management view to update automatically when a package has been deleted.
* Harmonized the style of the package, app and dataset management views.

### 2016-05-18
* Added 'copy to clipboard' functionality to the Edge node and HttpFS boxes on the main view.
* Removed dependency on coffeescript.

### 2016-05-17
* Use built-in base64 encode/decode functions.

### 2016-05-16
* Updated the contextual help to add information about the different components, as per the PNDA guide.
* Updated the package management view to update automatically when a new package has been uploaded.
* Fixed the package management view to handle failure notifications from the deployment manager.

### 2016-05-10
* Updated the application management view: Replaced "Destroy" by "Delete" for removing an existing an app.
* Refactored the modal views to improve code quality.

### 2016-05-06
* Fixed the rate drop down menu for kafka.
* The rates displayed in the kafka component are now the sum of the rates across all brokers for each topic.

### 2016-05-05
* Removed pndaDataFlow component as it was not used anymore.
* Updated the components to open links in a new window when clicking on the gear icon.
* The resolution link is there's a problem with HDFS points at Cloudera Manager as it used to.

### 2016-05-05
* Changed the default loading animation used on the package management view.
* Fixed bugs related to the deployment management component (main view) not being in sync with the app management view.

### 2016-05-04
* Added a link to YARN resource manager and Hue.
* Links now open in a new window or tab.
* Fixed the style and bugs associated with the application management view.

### 2016-04-29
* Fixed issue with KPI metrics being shown for applications.
* Added endpoints for the edge node and httpFS to the main view.

### 2016-04-28
* Removed particle animation for the topics.
* Removed demo feature.
* Added an About modal view when clicking on "PNDA" to display the versions of PNDA and its components.

### 2016-04-28
* Fixed display issues caused by long comma separated lists of nodes.
* Fixed a minor issue causing the YARN info icon not to be shown.

### 2016-04-27
* The broker IDs displayed in the Kafka info modal view are now correct.

### 2016-04-27
* Added contextual help for all the components and pages.
* Added an icon for each component as a link to an associated web UI (e.g. Kafka Manager or Cloudera Manager).
* Updated the layout of the main view to fit on a small screen (with a minimum width of 1150px).
* Various bug fixes.
* Removed items (icons, fonts) that were not compliant with the Apache v2 license.

### 2016-04-25
* Added link to the Jupyter UI to the console.
* Implemented several improvements to the application view.

### 2016-04-22
* New application KPI metrics are now added to the list automatically.
* Deployment Manager metrics are now reported without the 'platform' prefix.

### 2016-04-21
* Updated the application view not to have to click the Save button when editing the properties of an app.

### 2016-04-21
* Refactored components, controllers and services into separate files.

### 2016-04-20
* Renamed metrics.json to config.json.
* Hidden datasets are now configurable in config.json.

### 2016-04-19
* Select first application by default in apps view.
* Make entire row clickable while selecting applications or packages.
* Fix feedback process while performing any operations in apps view.
* Remove dataset management component from curated-view.
* Hide certain datasets e.g. testbot by default.

### 2016-04-15
* Fixed - PANDA-1209 delint comments
* Fixed - PANDA-1209 openTSDB links not working with multiple servers
* Fixed issue where duplicate metrics were being displayed.
* Disabled login screen by default.

### 2016-04-15
* Now console shows kafka topic name which have alphanumeric characters
* Show connection refused error in application view if DM API is down.
* Sort metric field names for all components.
* Update README

### 2016-04-13
- Show any package deployment errors.

### 2016-04-13
- Show any application deployment errors.
- Minor bug fixes.

### 2016-04-12
- Added application KPI metrics.

### 2016-04-12
- User remains logged in when he refreshes the console.
- Loads of improvement around application deployment in the apps view.
- Use the new health metric for deployment manager component.
- Few bug fixes.

### 2016-04-07
- Package, Application & Data management now live. 
- Added application KPI metrics.

### 2016-03-21
- First release of the PNDA platform console backend.
