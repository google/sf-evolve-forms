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
/* eslint-disable @lwc/lwc/no-async-operation */
import { wire, api, track } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { loadStyle } from "lightning/platformResourceLoader";
import { refreshApex } from "@salesforce/apex";
import { displayToast, reduceErrors } from "c/dynamicFormsUtils";
import userId from "@salesforce/user/Id";
import DynamicFormsCSS from "@salesforce/resourceUrl/DynamicFormsCSS";
import getFieldInfo from "@salesforce/apex/DynamicFormsController.getFieldInfo";
import DynamicFormsElement from "c/dynamicFormsElement";
import fetchUserRecordAccess from "@salesforce/apex/DynamicFormsController.fetchUserRecordAccess";

const PENDING_EDIT_CLASS = "pendingEditClass";
const DATA_FIELD_API_NAME = "data-field-api-name";

export default class DynamicFormsFieldSection extends DynamicFormsElement {
  @api objectApiName;
  @api recordId = null;
  @api fieldApiNames;
  @api sectionLabel;
  @api hideSectionLabelOnView = false;
  @api hideSectionLabelOnEdit = false;
  @api hideEditHighlighting = false;
  @api readOnlyMode = false;
  @api startInEditMode = false;
  @api columns = "1";
  @api boundary = false;
  @api labelOverrides = {};
  @api helpTextOverrides = {};
  @api groupOverride = null;

  @track error;
  @track sectionElements;
  @track editMode = false;
  @track showSpinner = false;
  @track currentlyHoveringOver = "";
  @track userId = userId;

  fieldInfo;
  lookupFieldsToQuery;
  requestedOverrides = false;
  _wiredFieldInfoResult; // Stored for refreshApex to work

  @wire(getFieldInfo, {
    sObjectType: "$objectApiName",
    fieldDefinitions: "$fieldApiNames",
    recordId: "$recordId"
  })
  wireFieldInfo(result) {
    if (result.data) {
      this._wiredFieldInfoResult = result;
      this.sectionElements = result.data.map((field) => ({
        ...field,
        ariaLabel: "Edit " + field.fieldLabel,
        editButtonClassName: "inactive",
        isLookupFieldInFocus: false,
        isCompactLayoutInFocus: false,
        showLookupCompactLayout: false,
        labelVariant: Object.prototype.hasOwnProperty.call(
          this.labelOverrides,
          field.fieldApiName
        )
          ? "label-hidden"
          : "label-stacked",
        labelOverride: this.labelOverrides[field.fieldApiName],
        helpText: this.helpTextOverrides[field.fieldApiName] ?? field.helpText,
        readOnlyValue: field.readOnlyValue || ""
      }));
      if (!this.requestedOverrides) {
        this.requestedOverrides = true;
        this.broadcast(this.EVENT_TYPE.CHECK_OVERRIDES);
        this.broadcastRequiredFields();
      }
    } else if (result.error) {
      this.handleError(result.error);
    }
  }

  get hideSectionTitle() {
    return (
      (this.hideSectionLabelOnEdit && this.editMode) ||
      (this.hideSectionLabelOnView && !this.editMode)
    );
  }

  get renderPencilIcon() {
    if (this.readOnlyMode === true) {
      return "slds-hide";
    }
    return "slds-show";
  }

  get boundaryTheme() {
    return this.boundary ? "slds-box slds-theme_default" : "slds-theme_default";
  }

  get columnSize() {
    return this.columns && this.columns === "2" ? "6" : "12";
  }

  handlePencilKeyPress(event) {
    if (this.enterOrSpaceWasPressed(event)) {
      this.setEditMode();
      this.focusOnInputElement(
        event.currentTarget.getAttribute(DATA_FIELD_API_NAME)
      );
    }
  }

  focusOnInputElement(fieldApiName) {
    // call setTimeout to allow canvas to be redrawn before focus is applied
    setTimeout(() => {
      let element = this.template.querySelector(
        `lightning-input-field[data-field-api-name="${fieldApiName}"]`
      );
      setTimeout(() => {
        element.focus();
      });
    });
  }

  handleLookupKeyPress(event) {
    if (this.enterOrSpaceWasPressed(event)) {
      this.navigateToReference(event);
    }
  }

  enterOrSpaceWasPressed(event) {
    return ["Enter", "Space", " "].includes(event?.key);
  }

  addPendingEditClass(fieldApiName) {
    if (!this.hideEditHighlighting) {
      let selector = `lightning-layout-item[data-id="${fieldApiName}"]`;
      this.template.querySelector(selector)?.classList?.add(PENDING_EDIT_CLASS);
    }
  }

  removePendingEdits() {
    this.template.querySelectorAll(".pendingEditClass").forEach((element) => {
      element.classList.remove(PENDING_EDIT_CLASS);
    });
    this.sectionElements?.forEach((element) => {
      element.value = undefined;
    });
  }

  handleFieldChange(event) {
    let newValue = event.target.value;
    let fieldApiName = event.currentTarget.getAttribute(DATA_FIELD_API_NAME);
    this.broadcast(this.EVENT_TYPE.UPDATE, {
      newValue: newValue,
      fieldApiName: fieldApiName
    });
  }

  handleFocusIn(event) {
    let viewPortPosition = event.currentTarget.getBoundingClientRect();
    this.broadcast(this.EVENT_TYPE.FOCUS_IN, {
      fieldApiName: event.currentTarget.getAttribute(DATA_FIELD_API_NAME), //field which got focus
      position: {
        //Field's current position on the viewport
        top: viewPortPosition.top,
        width: viewPortPosition.width,
        offsetLeft: event.currentTarget.offsetLeft
      }
    });
  }

  handleFocusOut(event) {
    this.broadcast(this.EVENT_TYPE.FOCUS_OUT, {
      fieldApiName: event.currentTarget.getAttribute(DATA_FIELD_API_NAME) //field which lost focus
    });
  }

  hoverOverField(event) {
    this.currentlyHoveringOver =
      event.currentTarget.getAttribute(DATA_FIELD_API_NAME);
    this.handleHoverChange();
  }

  hoverOffField() {
    this.currentlyHoveringOver = "";
    this.handleHoverChange();
  }

  handleHoverChange() {
    this.sectionElements.forEach((element) => {
      element.editButtonClassName =
        this.currentlyHoveringOver === element.fieldApiName ? "" : "inactive";
    });
  }

  setFlagsForCompactLayout(
    event,
    isLookupFieldInFocus,
    isCompactLayoutInFocus
  ) {
    let currentlyHoveringOverLookupField =
      event.currentTarget.getAttribute(DATA_FIELD_API_NAME);
    this.sectionElements
      .filter(
        (element) =>
          element.fieldApiName === currentlyHoveringOverLookupField &&
          element.isReference
      )
      .forEach((field) => {
        field.isLookupFieldInFocus = isLookupFieldInFocus;
        if (isCompactLayoutInFocus !== undefined) {
          field.isCompactLayoutInFocus = isCompactLayoutInFocus;
        }
        field.showLookupCompactLayout =
          field.isLookupFieldInFocus || field.isCompactLayoutInFocus;
        if (isLookupFieldInFocus !== undefined && !isLookupFieldInFocus) {
          setTimeout(() => {
            if (isLookupFieldInFocus !== undefined) {
              field.isLookupFieldInFocus = isLookupFieldInFocus;
            }
            field.showLookupCompactLayout =
              field.isLookupFieldInFocus || field.isCompactLayoutInFocus;
          }, 200);
        }
      });
  }

  hoverOverLookupField(event) {
    this.setFlagsForCompactLayout(event, true, undefined);
  }

  hoverOffLookupField(event) {
    this.setFlagsForCompactLayout(event, false, undefined);
  }

  hoverOverCompactLayout(event) {
    this.setFlagsForCompactLayout(event, undefined, true);
  }

  hoverOffCompactLayout(event) {
    this.setFlagsForCompactLayout(event, undefined, false);
  }

  navigateToReference(event) {
    let recordId = event.target.getAttribute("data-record-id");
    if (recordId) {
      this.navigateToRecord(recordId);
    }
  }

  setEditMode() {
    this.broadcast(this.EVENT_TYPE.EDIT);
  }

  handleError(event) {
    this.showSpinner = false;
    this.dispatchEvent(
      new ShowToastEvent({
        title: "Error",
        message: event?.detail?.detail,
        variant: "error"
      })
    );
  }

  checkAccess() {
    fetchUserRecordAccess({
      userId: this.userId,
      recordId: this.recordId
    })
      .then((result) => {
        if (result) {
          /* An edit event is broadcasted from dynamicFormsCreate component and readOnlyMode flag is checked based on
             that edit flag will be updated to true or false. */
          let userHasEditAccess = false;
          userHasEditAccess = result.HasEditAccess;
          if (userHasEditAccess === false) {
            this.readOnlyMode = true;
            this.editMode = false;
          }
        }
      })
      .catch((error) => {
        displayToast(
          this,
          "Error",
          this.generateUserAccessErrorMessage(error),
          "error"
        );
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

  handleMessage(message) {
    if (message.eventType === this.EVENT_TYPE.EDIT) {
      if (this.readOnlyMode === false) {
        this.editMode = true;
      } else if (this.startInEditMode) {
        this.editMode = true;
      }
    } else if (message.eventType === this.EVENT_TYPE.CANCEL) {
      this.editMode = false;
      this.removePendingEdits();
    } else if (message.eventType === this.EVENT_TYPE.SAVE_START) {
      this.showSpinner = true;
    } else if (message.eventType === this.EVENT_TYPE.SAVE_END) {
      refreshApex(this._wiredFieldInfoResult);
      this.showSpinner = false;
      this.removePendingEdits();
    } else if (message.eventType === this.EVENT_TYPE.UPDATE) {
      this.propagateUpdate(message.fieldApiName, message.newValue);
      this.addPendingEditClass(message.fieldApiName);
    } else if (message.eventType === this.EVENT_TYPE.RESET) {
      this.sectionElements?.forEach((element) => {
        element.value = null;
      });
    }
  }

  propagateUpdate(fieldApiName, value) {
    this.sectionElements
      ?.filter((element) => element.fieldApiName === fieldApiName)
      ?.forEach((element) => {
        element.value = value;
      });
  }

  connectedCallback() {
    this.checkAccess();
    this.editMode = this.startInEditMode;
    this.labelOverrides = this.tryToParseJSON(this.labelOverrides);
    this.helpTextOverrides = this.tryToParseJSON(this.helpTextOverrides);
    if (this.groupOverride) {
      this.group = this.groupOverride;
    }
    loadStyle(this, DynamicFormsCSS);
    this.subscribeToMessageChannel();
    this.broadcast(this.EVENT_TYPE.CHECK_EDIT);
    if (this.startInEditMode) {
      this.broadcastRequiredFields();
    }
  }

  disconnectedCallback() {
    this.unsubscribeToMessageChannel();
  }

  renderedCallback() {
    if (this.editMode === true) {
      this.broadcastRequiredFields();
    }
  }

  broadcastRequiredFields() {
    this.sectionElements
      ?.filter((element) => element.required)
      ?.forEach((element) => {
        this.broadcast(this.EVENT_TYPE.REQUIRED_FIELD, {
          fieldApiName: element.fieldApiName
        });
      });
  }

  // Only render sections that contain at least one non-space element
  get shouldRenderSection() {
    return (
      this.sectionElements?.find((element) => !element.isSpace) !== undefined
    );
  }
}
