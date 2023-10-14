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

import { api } from "lwc";
import userId from "@salesforce/user/Id";
import { displayToast, reduceErrors } from "c/dynamicFormsUtils";
import DynamicFormsElement from "c/dynamicFormsElement";
import fetchUserRecordAccess from "@salesforce/apex/DynamicFormsController.fetchUserRecordAccess";

export default class DynamicFormsHeadlessEdit extends DynamicFormsElement {
  @api executeInvoke = false;
  @api recordId = null;
  userId = userId;

  renderedCallback() {
    if (this.executeInvoke === true) {
      this.invoke();
    }
  }

  checkAccess() {
    fetchUserRecordAccess({
      userId: this.userId,
      recordId: this.recordId
    })
      .then((result) => {
        if (result && result.HasEditAccess) {
          this.broadcast(this.EVENT_TYPE.EDIT);
        } else {
          displayToast(this, "Info", "Record cannot be edited", "info");
        }
      })
      .catch((error) => {
        displayToast(this, "Error", this.generateErrorMessage(error), "error");
      });
  }

  generateUserAccessErrorMessage(error) {
    const errorMessages = reduceErrors(error);
    let message =
      "There is an issue with retrieving user access for this record:";
    for (const errorMessage of errorMessages) {
      message += `\n\t* ${errorMessage}`;
    }
    return message;
  }

  @api invoke() {
    this.checkAccess();
  }
}
