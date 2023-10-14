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

import { LightningElement, wire, api } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { getObjectInfo } from "lightning/uiObjectInfoApi";

const USER = "User";
const GROUP = "Group";
const RECORDTYPE = "RecordType";

export default class DynamicFormsCompactPageLayout extends LightningElement {
  @api lookupObjectApiName;
  @api lookupRecordId;
  @api lookupFieldValue;

  isLookupUserOrGroupOrRecordType = false;
  objectInfo;
  iconUrl = "";
  iconColor = "";

  @wire(getObjectInfo, { objectApiName: "$lookupObjectApiName" })
  wireObjectInfo(result) {
    if (result && result.data) {
      this.objectInfo = result.data;
      this.iconUrl =
        result.data.themeInfo && result.data.themeInfo.iconUrl
          ? result.data.themeInfo.iconUrl
          : "";
      this.iconColor =
        result.data.themeInfo && result.data.themeInfo.color
          ? result.data.themeInfo.color
          : "";
    } else if (result.error) {
      this.handleError(result.error);
    }
  }

  connectedCallback() {
    this.isLookupUserOrGroupOrRecordType =
      this.lookupObjectApiName === USER ||
      this.lookupObjectApiName === GROUP ||
      this.lookupObjectApiName === RECORDTYPE
        ? true
        : false;
  }

  handleError(event) {
    this.dispatchEvent(
      new ShowToastEvent({
        title: "Error",
        message: event.body.message,
        variant: "error"
      })
    );
  }

  get iconBackgroundColor() {
    return "background-color: #" + this.iconColor;
  }

  get isLookupRecordType() {
    return this.lookupObjectApiName === RECORDTYPE;
  }
}
