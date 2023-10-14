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

import { api, wire } from "lwc";
import { CurrentPageReference } from "lightning/navigation";
import DynamicFormsElement from "c/dynamicFormsElement";

export default class DynamicFormsPredefinedValues extends DynamicFormsElement {
  @api readValuesFromUrl = false;

  predefinedFields = {};
  urlFieldOverrides = {};

  fieldsThatHaveChanged = new Set();

  @api get predefinedFieldValues() {
    return this.predefinedFields;
  }

  set predefinedFieldValues(value) {
    let oldValues = this.predefinedFields;
    this.predefinedFields = this.tryToParseJSON(value);
    if (this.predefinedFields !== oldValues) {
      this.broadcast(this.EVENT_TYPE.CHECK_OVERRIDES);
    }
  }

  // Read any values passed via URL
  // Param can be Salesforce's standard defaultFieldValues or custom c__fieldOverrides
  // Format: c__fieldOverrides=Status=Assigned,Subject=Multiword+Subject
  @wire(CurrentPageReference)
  getStateParameters(currentPageReference) {
    if (this.readValuesFromUrl) {
      this.urlFieldOverrides = {
        ...this.extractFields(currentPageReference?.state?.defaultFieldValues),
        ...this.extractFields(currentPageReference?.state?.c__fieldOverrides)
      };
    }
  }

  // Extract CSV mapping of field overrides per Salesforce's standard format:
  // Format: c__fieldOverrides=Status=Assigned,Subject=Multiword+Subject
  extractFields(data) {
    let fields = {};
    if (data) {
      data
        .split(",")
        .map((fieldOverride) => fieldOverride.split("="))
        .filter((fieldComponents) => fieldComponents.length === 2)
        .forEach((fieldComponents) => {
          fields[fieldComponents[0]] = decodeURIComponent(fieldComponents[1]);
        });
    }
    return fields;
  }

  // Handle message from Dynamic Forms Message Channel
  handleMessage(message) {
    if (message.eventType === this.EVENT_TYPE.CHECK_OVERRIDES) {
      this.broadcastFieldOverrides();
    } else if (message.eventType === this.EVENT_TYPE.UPDATE) {
      if (this.getPredefinedValue(message.fieldApiName) !== message.newValue) {
        this.fieldsThatHaveChanged.add(message.fieldApiName);
      }
    } else if (message.eventType === this.EVENT_TYPE.CANCEL) {
      this.fieldsThatHaveChanged.clear();
    } else if (message.eventType === this.EVENT_TYPE.SAVE_END) {
      this.fieldsThatHaveChanged.clear();
    }
  }

  // Get predefined value for this field, if it exists
  getPredefinedValue(fieldName) {
    return (
      this.urlFieldOverrides[fieldName] ?? this.predefinedFieldValues[fieldName]
    );
  }

  broadcastFieldOverrides() {
    // URL Field Overrides trump LWC-level defined values
    for (let [field, value] of Object.entries({
      ...this.predefinedFieldValues,
      ...this.urlFieldOverrides
    })) {
      if (!this.fieldsThatHaveChanged.has(field)) {
        this.broadcast(this.EVENT_TYPE.UPDATE, {
          newValue: value,
          fieldApiName: field
        });
      }
    }
  }

  // Connect to Dynamic Forms Message Channel
  connectedCallback() {
    this.subscribeToMessageChannel();
  }

  // Disconnect from Dynamic Forms Message Channel
  disconnectedCallback() {
    this.unsubscribeToMessageChannel();
  }
}
