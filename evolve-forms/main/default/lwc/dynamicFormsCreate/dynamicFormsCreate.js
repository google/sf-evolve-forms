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
import { createRecord } from "lightning/uiRecordApi";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import DynamicFormsSaveCancel from "c/dynamicFormsSaveCancel";

/*
 * this component broadcasts completion events so other LWC can react to this component's actions.
 * example:
 *   <c-dynamic-forms-create
 *      oncompletion={closeModal}
 *   ></c-dynamic-forms-create>
 * */
const COMPLETION_EVENT = "completion";

export default class DynamicFormsCreate extends DynamicFormsSaveCancel {
  @api objectApiName;
  @api buttonLabel = "Submit";
  @api closeModalOnCancel = false;
  @api successMessage = "Record Created";
  @api includeCancelButton = false;
  @api pinToBottom = false;
  @api redirectToRecordOnCreate = false;
  /* Used for Parent component override for custom validations */
  @api disableCreateButton = false;

  save() {
    this.broadcast(this.EVENT_TYPE.SAVE_START);

    let event = null;
    let fields = this.pendingUpdates;
    const recordInput = { fields };
    recordInput.apiName = this.objectApiName;

    createRecord(recordInput)
      .then((record) => {
        event = {
          status: "success",
          recordId: record.id
        };
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Success",
            message: this.successMessage,
            variant: "success"
          })
        );
        if (this.redirectToRecordOnCreate) {
          this.navigateToRecord(record.id);
        }
      })
      .catch((error) => {
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Error Creating Record",
            message: this.generateErrorMessage(error),
            variant: "error"
          })
        );
      })
      .then(() => {
        this.broadcast(this.EVENT_TYPE.SAVE_END);
        if (event) {
          this.dispatchEvent(
            new CustomEvent(COMPLETION_EVENT, {
              detail: event
            })
          );
        }
      });
  }

  cancelForm() {
    if (this.closeModalOnCancel === true) {
      this.closeAndRedirect(this.objectApiName);
    } else {
      this.cancel();
    }
  }
}
