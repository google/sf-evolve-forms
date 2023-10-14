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
import DynamicFormsElement from "c/dynamicFormsElement";
import getChildRecordId from "@salesforce/apex/DynamicFormsController.getChildRecordId";
import getParentRecordId from "@salesforce/apex/DynamicFormsController.getParentRecordId";

const GENERAL_ERROR_MESSAGE =
  "An error occured provisioning this component. Please contact a System Administrator.";
const STRATEGY_ERROR = "Error";
const STRATEGY_HIDDEN = "Hidden";
const STRATEGY_NONE = "None";

export default class DynamicFormsRelatedRecord extends DynamicFormsElement {
  @api recordId;
  @api objectApiName;
  @api relatedRecordId = null;
  @api relatedRecordObjectApiName;
  @api childRelation;
  @api noRecordStrategy = STRATEGY_ERROR;
  @api multipleChildrenStrategy = STRATEGY_NONE;
  @api parentRelation;
  @api fieldApiNames;
  @api sectionLabel;
  @api sectionIcon;
  @api hideSectionLabelOnView = false;
  @api hideSectionLabelOnEdit = false;
  @api hideEditHighlighting = false;
  @api readOnlyMode = false;
  @api startInEditMode = false;
  @api columns = "1";
  @api boundary = false;
  @api labelOverrides = {};
  @api helpTextOverrides = {};

  errorMessage = null;
  hideComponent = false;

  connectedCallback() {
    if (!this.group) {
      this.errorMessage = GENERAL_ERROR_MESSAGE;
      return;
    }
    if (this.parentRelation) {
      this.getParentId();
    } else if (this.childRelation) {
      this.getChildId();
    } else {
      this.handleEmptyRecord();
    }
  }

  getParentId() {
    getParentRecordId({
      sObjectType: this.objectApiName,
      pathToParentId: this.parentRelation,
      recordId: this.recordId
    })
      .then((result) => {
        this.relatedRecordId = result;
      })
      .catch((error) => {
        this.errorMessage = error?.body?.message ?? GENERAL_ERROR_MESSAGE;
      })
      .finally(() => this.handleEmptyRecord());
  }

  getChildId() {
    getChildRecordId({
      sObjectType: this.objectApiName,
      childRelation: this.childRelation,
      recordId: this.recordId,
      multipleChildrenStrategy: this.multipleChildrenStrategy
    })
      .then((result) => {
        this.relatedRecordId = result;
      })
      .catch((error) => {
        this.errorMessage = error?.body?.message ?? GENERAL_ERROR_MESSAGE;
      })
      .finally(() => this.handleEmptyRecord());
  }

  handleEmptyRecord() {
    if (this.relatedRecordId !== null) {
      return;
    }
    if (this.noRecordStrategy === STRATEGY_ERROR) {
      this.errorMessage = this.errorMessage || "No record was found.";
    } else if (this.noRecordStrategy === STRATEGY_HIDDEN) {
      this.hideComponent = true;
    }
  }

  get relatedRecordGroup() {
    // this.group is populated via parent DynamicFormsElement class.
    // this new grouping scopes the related record uniquely to this page.
    return `${this.group}-${this.relatedRecordId}`;
  }

  get shouldRenderSection() {
    return !this.errorMessage && this.relatedRecordId;
  }

  openRecord() {
    this.navigateToRecord(this.relatedRecordId);
  }
}
