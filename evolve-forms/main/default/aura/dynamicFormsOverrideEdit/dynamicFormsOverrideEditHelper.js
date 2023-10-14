/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* eslint-disable no-unused-expressions */
({
  closeEditTabAndNavigateToRecordDetail: function (
    component,
    recordId,
    workspaceAPI
  ) {
    workspaceAPI.getFocusedTabInfo().then(function (response) {
      let focusedTab = response.tabId;
      workspaceAPI
        .openTab({
          recordId: recordId,
          focus: true
        })
        .then(function () {
          component.find("publishEditEventCompId").invoke();
        })
        .then(function () {
          workspaceAPI.closeTab({ tabId: focusedTab });
        });
    });
  },

  navigateToRecordDetailPage: function (component, recordId) {
    var sObjectName = component.get("v.sObjectName");
    var navLink = component.find("navLink");
    var pageRef = {
      type: "standard__recordPage",
      attributes: {
        actionName: "view",
        objectApiName: sObjectName,
        recordId: recordId
      },
      state: {
        c__startInEditMode: true
      }
    };
    navLink.navigate(pageRef, true);
  }
});
