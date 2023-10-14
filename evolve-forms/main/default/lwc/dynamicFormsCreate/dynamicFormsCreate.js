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

import { api, track } from "lwc";
import { createRecord } from "lightning/uiRecordApi";
import { loadStyle } from "lightning/platformResourceLoader";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import DynamicFormsCSS from "@salesforce/resourceUrl/DynamicFormsCSS";
import DynamicFormsElement from "c/dynamicFormsElement";
import { reduceErrors } from "c/dynamicFormsUtils";

/*
 * this component broadcasts completion events so other LWC can react to this component's actions.
 * example:
 *   <c-dynamic-forms-create
 *      oncompletion={closeModal}
 *   ></c-dynamic-forms-create>
 * */
const COMPLETION_EVENT = "completion";

export default class DynamicFormsCreate extends DynamicFormsElement {
  @api objectApiName;
  @api buttonLabel = "Submit";
  @api successMessage = "Record Created";
  @api includeCancelButton = false;
  @api pinToBottom = false;
  @api redirectToRecordOnCreate = false;
  /* Used for Parent component override for custom validations */
  @api disableCreateButton = false;

  @track saveIsDisabled = false;
  @track saveInProgress = false;
  @track requiredFieldApiNames = new Set();
  @track fields = {};

  save() {
    this.broadcast(this.EVENT_TYPE.SAVE_START);

    let event = null;
    let fields = this.fields;
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

  cancel() {
    this.broadcast(this.EVENT_TYPE.CANCEL);
  }

  getSaveIsDisabled() {
    return (
      this.saveInProgress ||
      this.disableCreateButton ||
      Array.from(this.requiredFieldApiNames).find(
        (field) => !this.fields[field]
      )
    );
  }

  generateErrorMessage(error) {
    const errorMessages = reduceErrors(error);
    if (!errorMessages) {
      return error.body.message;
    }
    let message = "The following errors occured:";
    for (const errorMessage of errorMessages) {
      message += `\n\t* ${errorMessage}`;
    }
    return message;
  }

  handleMessage(message) {
    if (message.eventType === this.EVENT_TYPE.UPDATE) {
      this.fields[message.fieldApiName] = message.newValue;
      this.saveIsDisabled = this.getSaveIsDisabled();
    } else if (message.eventType === this.EVENT_TYPE.CANCEL) {
      this.fields = {};
      this.requiredFieldApiNames.clear();
      this.dispatchEvent(
        new CustomEvent(COMPLETION_EVENT, {
          detail: {
            status: "cancel"
          }
        })
      );
    } else if (message.eventType === this.EVENT_TYPE.CHECK_EDIT) {
      this.broadcast(this.EVENT_TYPE.EDIT);
    } else if (message.eventType === this.EVENT_TYPE.SAVE_START) {
      this.saveInProgress = true;
    } else if (message.eventType === this.EVENT_TYPE.SAVE_END) {
      this.saveInProgress = false;
    } else if (message.eventType === this.EVENT_TYPE.REQUIRED_FIELD) {
      this.requiredFieldApiNames.add(message.fieldApiName);
      this.saveIsDisabled = this.getSaveIsDisabled();
    } else if (message.eventType === this.EVENT_TYPE.RESET) {
      this.requiredFieldApiNames.clear();
      this.fields = {};
      this.saveIsDisabled = this.getSaveIsDisabled();
    }
  }

  connectedCallback() {
    this.saveIsDisabled = this.getSaveIsDisabled();
    loadStyle(this, DynamicFormsCSS);
    this.subscribeToMessageChannel();
  }

  disconnectedCallback() {
    this.unsubscribeToMessageChannel();
  }
}
