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

import { LightningElement, api, track, wire } from "lwc";
import getLayoutSectionsByPageLayoutName from "@salesforce/apex/DynamicFormsController.getLayoutSectionsByPageLayoutName";
import { getRecordUi } from "lightning/uiRecordApi";
import { displayToast } from "c/dynamicFormsUtils";

const ASTERISK = "*";
const COMMA = ",";
const EMPTY_STRING = "";
const ERROR_TITLE = "Error";
const ERROR_VARIANT = "error";
const FIELD = "Field";
const FULL = "Full";
const RECORD_TYPE_ID_PREFIX = "012";
const VIEW = "View";

export default class DynamicFormsPageLayout extends LightningElement {
  @api objectApiName;
  @api recordId = null;
  @api pageLayoutName;
  @api labelOverrides = {};
  @api helpTextOverrides = {};
  @api startInEditMode = false;
  @api boundary = false;
  @api disableCompactLayoutHover = false;

  @track layoutSections;
  @track pageLayoutId;
  @track error;

  @wire(getRecordUi, {
    recordIds: "$recordId",
    layoutTypes: FULL,
    modes: [VIEW]
  })
  wiredUI(result) {
    if (this.pageLayoutName || !this.recordId) {
      return;
    }
    if (result.data) {
      this.layoutSections = this.extractLayoutSectionsFromResponse(result.data);
    }
    if (result.error) {
      console.error({ error: result.error });
      displayToast(this, ERROR_TITLE, result.error?.body?.error, ERROR_VARIANT);
    }
  }

  get boundaryTheme() {
    return this.boundary ? "slds-box slds-theme_default" : "slds-theme_default";
  }

  extractLayoutSectionsFromResponse(responseData) {
    let result = [];
    for (let key in responseData.layouts[this.objectApiName]) {
      if (key.startsWith(RECORD_TYPE_ID_PREFIX)) {
        for (let section of responseData.layouts[this.objectApiName][key].Full[
          VIEW
        ].sections) {
          let fields = [];
          for (let layoutRow of section.layoutRows) {
            for (let layoutItem of layoutRow.layoutItems) {
              for (let component of layoutItem.layoutComponents) {
                fields.push(
                  this.getFieldStringRepresentation(component, layoutItem)
                );
              }
            }
          }
          let hideHeader = section.useHeading === false;
          let formattedSection = {
            id: section.id,
            sectionLabel: section.heading,
            numberOfColumns: section.columns.toString(),
            apiNamesCsv: fields.join(COMMA),
            hideSectionLabelOnView: hideHeader,
            hideSectionLabelOnEdit: hideHeader
          };
          result.push(formattedSection);
        }
      }
    }
    return result;
  }

  getFieldStringRepresentation(component, layoutItem) {
    if (component.componentType === FIELD) {
      let isReadOnly =
        (layoutItem.editableForUpdate === false && this.recordId) ||
        (layoutItem.editableForNew === false && !this.recordId);
      let formattedApiName = `${layoutItem.required ? ASTERISK : EMPTY_STRING}${
        component.apiName
      }${isReadOnly ? ASTERISK : EMPTY_STRING}`;
      return formattedApiName;
    }
    return EMPTY_STRING;
  }

  getPageLayout() {
    if (this.pageLayoutName) {
      getLayoutSectionsByPageLayoutName({
        layoutName: this.pageLayoutName
      }).then((response) => {
        this.layoutSections = response;
      });
    }
  }

  connectedCallback() {
    this.getPageLayout();
  }
}
