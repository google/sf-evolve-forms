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

import getFieldsFromFieldSetAPIName from "@salesforce/apex/DynamicFormsController.getFieldsFromFieldSetAPIName";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { reduceErrors } from "c/dynamicFormsUtils";
import { LightningElement, api } from "lwc";

export default class DynamicFormsFieldSet extends LightningElement {
  @api boundary = false;
  @api fieldSetApiName;
  @api numberOfColumns = "2";
  @api objectApiName;
  @api recordId = null;
  @api sectionLabel;
  @api readOnlyMode = false;
  @api hideEditHighlighting = false;
  @api startInEditMode = false;
  @api labelOverrides = {};
  @api helpTextOverrides = {};

  apiNamesCsv;

  /**
   * description fetch field api names only if fieldset api name is defined
   */
  connectedCallback() {
    if (this.fieldSetApiName) {
      this.getFieldAPINamesFromFieldSet();
    }
  }
  /**
   * description fetch field api names in the fieldset for the object by fieldset api name.
   */
  getFieldAPINamesFromFieldSet() {
    getFieldsFromFieldSetAPIName({
      objectApiName: this.objectApiName,
      fieldSetApiName: this.fieldSetApiName
    })
      .then((result) => {
        this.sectionLabel = this.sectionLabel
          ? this.sectionLabel
          : result["fieldSetLabel"];
        this.apiNamesCsv = result["apiNamesCsv"];
      })
      .catch((error) => {
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Error",
            message: this.generateErrorMessage(error),
            variant: "error"
          })
        );
      });
  }
  /**
   * Method to generate error message
   * @param error - error object
   */
  generateErrorMessage(error) {
    let message = "The following errors occured:";
    for (const errorMessage of reduceErrors(error)) {
      message += `\n\t* ${errorMessage}`;
    }
    return message;
  }
}
