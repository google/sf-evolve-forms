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

/* eslint-disable @lwc/lwc/no-api-reassignments */
import { LightningElement, api } from "lwc";

export default class DynamicFormsCollapsibleSection extends LightningElement {
  @api isOpen;
  @api label;
  @api hideLabel = false;

  get sectionClass() {
    return this.isOpen ? "slds-section slds-is-open" : "slds-section";
  }

  connectedCallback() {
    if (this.isOpen === undefined || this.isOpen === null) {
      this.isOpen = true;
    }
  }

  toggleOpen(event) {
    event.preventDefault();
    this.isOpen = !this.isOpen;
  }

  handleKeyPress(event) {
    if (["Enter", "Space", " "].includes(event?.key)) {
      this.toggleOpen(event);
    }
  }
}
