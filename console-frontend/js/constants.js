/*-------------------------------------------------------------------------------
 * Name:        constants.js
 * Purpose:     Constants used by the controllers.
 *
 * Author:      PNDA Team
 * Created:     2016/04/01
 * History:     2016/04/01 - Initial commit
 *              2016/05/12 - Added INTENT constants for a package
 *              2016/05/16 - Added the CREATED state for a package
 *              2016/05/19 - Added the NOTCREATED state for a package that has been deleted
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

var Constants = {
  RADIX_DECIMAL: 10,
  RADIX_OCT: 8,
  RADIX_HEXA: 16,

  PACKAGE: {
    NOTDEPLOYED: "NOTDEPLOYED",
    UNDEPLOYING: "UNDEPLOYING",
    DEPLOYING: "DEPLOYING",
    DEPLOYED: "DEPLOYED",
    NOTCREATED: "NOTCREATED",
    CREATED: "CREATED",
    INTENT_DEPLOY: "deploy",
    INTENT_UNDEPLOY: "undeploy"
  },
  APPLICATION: {
    NOTCREATED: "NOTCREATED",
    CREATING: "CREATING",
    CREATED: "CREATED",
    STARTING: "STARTING",
    STARTED: "STARTED",
    STOPPING: "STOPPING",
    DESTROY: "DESTROY"
  },
  PACKAGES_CACHING_DURATION: 60000
};
