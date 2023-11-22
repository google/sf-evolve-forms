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
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import DynamicFormsElement from "c/dynamicFormsElement";
import getFieldsToRender from "@salesforce/apex/CalculatedFieldController.getFieldsToRender";

export default class CalculatedFieldSection extends DynamicFormsElement {
  @api
  apexClassName;

  @api
  boundary = false;

  @api
  columns = "1";

  @track
  fields;

  @api
  flowApiName;

  @api
  hideSectionTitle = false;

  @api
  recordId;

  @api
  sectionLabel;

  @track showSpinner = false;

  connectedCallback() {
    this.fetchFieldsToRender();
    this.subscribeToMessageChannel();
  }

  disconnectedCallback() {
    this.unsubscribeToMessageChannel();
  }

  fetchFieldsToRender() {
    this.showSpinner = true;
    getFieldsToRender({
      recordId: this.recordId,
      apexClassName: this.apexClassName,
      flowApiName: this.flowApiName
    })
      .then((result) => {
        if (result) {
          this.fields = result;
        }
        this.showSpinner = false;
      })
      .catch((error) => {
        this.handleError(error);
      });
  }

  handleMessage(message) {
    if (message.eventType === this.EVENT_TYPE.SAVE_END) {
      this.fetchFieldsToRender();
    }
  }

  handleError(event) {
    this.showSpinner = false;
    this.dispatchEvent(
      new ShowToastEvent({
        title: "Error",
        message: event?.body?.message,
        variant: "error"
      })
    );
  }

  get hasFields() {
    return this.fields && this.fields.length > 0;
  }

  get size() {
    return this.columns === "2" ? 6 : 12;
  }

  get boundaryTheme() {
    return this.boundary ? "slds-box slds-theme_default" : "slds-theme_default";
  }
}
