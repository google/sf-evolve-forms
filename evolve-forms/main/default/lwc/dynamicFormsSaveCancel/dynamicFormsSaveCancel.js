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

/* eslint-disable guard-for-in */
/* eslint-disable no-new-func */
/* eslint-disable @lwc/lwc/no-async-operation */
import { wire, api, track } from "lwc";
import { updateRecord, getRecord } from "lightning/uiRecordApi";
import { getObjectInfo } from "lightning/uiObjectInfoApi";
import { loadStyle } from "lightning/platformResourceLoader";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { refreshApex } from "@salesforce/apex";
import { reduceErrors, invokeUtilityBarApi } from "c/dynamicFormsUtils";
import DynamicFormsCSS from "@salesforce/resourceUrl/DynamicFormsCSS";
import getWarnings from "@salesforce/apex/DynamicFormsController.getWarnings";
import DynamicFormsElement from "c/dynamicFormsElement";
import evaluateConditionalWarning from "@salesforce/apex/DynamicformsController.evaluateConditionalWarning";

const LMD = "LastModifiedDate";
const NAME = "name";
const VALUE = "value";

export default class DynamicFormsSaveCancel extends DynamicFormsElement {
  @api recordId;
  @api objectApiName;
  @api groupOverride = null;
  @api detach = false;

  @track allFieldApiNames;
  @track editMode = false;
  @track initialRecordState = {};
  @track initialStateIsRendered = false;
  @track pendingUpdates = {};
  @track requiredFieldApiNames = new Set();
  @track conflictingFieldsTabData = [];
  @track saveIsDisabled = false;
  @track currentWarnings;
  @track saveButtonIconName = "";

  showModal = false;
  showConflictModal = false;
  _currentDatabaseState;
  _initialRecordStateHasBeenSet = false;
  _getRecordResult;
  utilityBarIsDisplayed = false;
  fieldInfo;
  blockSaveContinue = false;

  @wire(getWarnings, { sObjectApiName: "$objectApiName" })
  configuredWarnings;

  /**
   * @description - Fetch all fields for the given sObject
   */
  @wire(getObjectInfo, { objectApiName: "$objectApiName" })
  wireObjectInfo(result) {
    if (result.data) {
      let fieldApiNames = [];
      if (result.data.fields) {
        for (const [key] of Object.entries(result.data.fields)) {
          fieldApiNames.push(this.objectApiName + "." + key);
        }
        this.fieldInfo = result.data.fields;
        this.allFieldApiNames = fieldApiNames;
      }
    } else if (result.error) {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Error Fetching Fields",
          message: this.generateErrorMessage(result.error),
          variant: "error"
        })
      );
    }
  }

  /**
   * @description - Fetch all field values for the given record
   */
  @wire(getRecord, {
    recordId: "$recordId",
    optionalFields: "$allFieldApiNames"
  })
  wireRecordInfo(result) {
    if (result.error) {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Error Getting Record Values",
          message: this.generateErrorMessage(result.error),
          variant: "error"
        })
      );
      return;
    }
    if (!this.allFieldApiNames) {
      return;
    }
    this._getRecordResult = result;
    this._currentDatabaseState = {};
    for (const [key, value] of Object.entries(result.data.fields)) {
      this._currentDatabaseState[key] = value.value;
    }
    if (!this._initialRecordStateHasBeenSet) {
      this.initialRecordState = this._currentDatabaseState;
      this._initialRecordStateHasBeenSet = true;
    }
  }

  /**
   * @description - Constructs the current state of the record. Current state
   * is the initial state plus any pending updates.
   */
  @api
  get currentState() {
    let result = {};
    for (let key in this.initialRecordState) {
      result[key] = this.initialRecordState[key];
    }
    for (let key in this.pendingUpdates) {
      result[key] = this.pendingUpdates[key];
    }
    return result;
  }

  get conditionalWarnings() {
    let result = [];
    if (this.configuredWarnings && this.configuredWarnings.data) {
      for (let warningMetadata of this.configuredWarnings.data) {
        result.push({
          apiName: warningMetadata.MasterLabel,
          flowApiName: warningMetadata.Flow_API_Name__c
        });
      }
    }
    return result;
  }

  get footerClass() {
    let classes = ["slds-theme_default", "slds-align_absolute-center"];
    if (!this.detach) {
      classes.push("slds-docked-form-footer");
      classes.push("pinnedFooter");
      classes.push("slds-box");
      if (this.utilityBarIsDisplayed === true) {
        classes.push("utilityBarPadding");
      }
    }
    return classes.join(" ");
  }

  cancel() {
    this.pendingUpdates = {};
    this.requiredFieldApiNames.clear();
    this.dismissedWarnings = [];
    this.showModal = false;
    this._initialRecordStateHasBeenSet = false;
    this.broadcast(this.EVENT_TYPE.CANCEL);
  }

  save() {
    this.showModal = false;
    let fields = this.pendingUpdates;
    fields.Id = this.recordId;
    const recordInput = { fields };
    this.broadcast(this.EVENT_TYPE.SAVE_START);
    updateRecord(recordInput)
      .then(() => {
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Success",
            message: "Record updated",
            variant: "success"
          })
        );
        this.cancel();
      })
      .catch((error) => {
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Error Updating Record",
            message: this.generateErrorMessage(error),
            variant: "error"
          })
        );
      })
      .then(() => {
        this.broadcast(this.EVENT_TYPE.SAVE_END);
      });
  }

  handleMessage(message) {
    if (message.eventType === this.EVENT_TYPE.EDIT) {
      this.editMode = true;
      this.saveIsDisabled = this.getSaveIsDisabled();
    } else if (message.eventType === this.EVENT_TYPE.CANCEL) {
      this.editMode = false;
    } else if (message.eventType === this.EVENT_TYPE.UPDATE) {
      this.pendingUpdates.Id = this.recordId;
      this.pendingUpdates[message.fieldApiName] = message.newValue;
      this.saveIsDisabled = this.getSaveIsDisabled();
    } else if (message.eventType === this.EVENT_TYPE.CHECK_EDIT) {
      if (this.editMode) {
        this.broadcast(this.EVENT_TYPE.EDIT);
      }
    } else if (message.eventType === this.EVENT_TYPE.REQUIRED_FIELD) {
      this.requiredFieldApiNames.add(message.fieldApiName);
      this.saveIsDisabled = this.getSaveIsDisabled();
    } else if (message.eventType === this.EVENT_TYPE.NO_LONGER_REQUIRED_FIELD) {
      if (this.requiredFieldApiNames.has(message.fieldApiName)) {
        this.requiredFieldApiNames.delete(message.fieldApiName);
        this.saveIsDisabled = this.getSaveIsDisabled();
      }
    }
  }

  closeModal() {
    this.showModal = false;
  }

  handleSavePress() {
    this.getCurrentWarnings();
  }

  continueSave() {
    this.checkRecordUpdatedByOthers();
    if (
      (this.currentWarnings && this.currentWarnings.length > 0) ||
      (this.conflictingFieldsTabData &&
        this.conflictingFieldsTabData.length > 0)
    ) {
      this.showModal = true;
      // call setTimeout to allow canvas to be redrawn before focus is applied
      setTimeout(() =>
        this.template
          .querySelector('[data-id="confirmation-modal-heading"]')
          .focus()
      );
    }
  }

  /**
   * @description - This method checks if record is updated by any other user or process
   * Last Modified Date is compared for initialRecordState and _currentDataBaseState to check conflicting updates
   */
  checkRecordUpdatedByOthers() {
    var skipConflictModal = false;
    this.conflictingFieldsTabData = [];
    refreshApex(this._getRecordResult).then(() => {
      if (this._currentDatabaseState[LMD] !== this.initialRecordState[LMD]) {
        for (let key in this.pendingUpdates) {
          if (
            this.pendingUpdates[key] !== this._currentDatabaseState[key] &&
            this.initialRecordState[key] !== this.pendingUpdates[key] &&
            this.initialRecordState[key] !== this._currentDatabaseState[key]
          ) {
            this.conflictingFieldsTabData.push({
              field: key,
              yourValue: this.pendingUpdates[key],
              savedValue: this._currentDatabaseState[key],
              label: this.fieldInfo[key].label
            });
          } else if (
            (this.initialRecordState[key] !== this.pendingUpdates[key] &&
              this.pendingUpdates[key] === this._currentDatabaseState[key]) ||
            (this.initialRecordState[key] !== this.pendingUpdates[key] &&
              this.initialRecordState[key] === this._currentDatabaseState[key])
          ) {
            skipConflictModal = true;
          }
        }
        if (this.conflictingFieldsTabData.length > 0) {
          this.showModal = true;
        } else if (
          (!this.conflictingFieldsTabData.length > 0 && skipConflictModal) ||
          Object.keys(this.pendingUpdates).length === 0
        ) {
          this.checkWarningsAndSave();
        }
      } else {
        this.checkWarningsAndSave();
      }
    });
  }

  /**
   * @description - If record do not have any save conflicts this checks if there are any warnings on the record
   * If warnings are present on the records, save() is called manually by clicking save button on Modal. Else this
   * will auto save the record.
   */
  checkWarningsAndSave() {
    if (!(this.currentWarnings && this.currentWarnings.length > 0)) {
      this.save();
    }
  }

  /**
   * @description - This method manipulates "pendingUpdates" based on the values selected by user  for conflicting fields
   */
  handleConflictOptionChange(event) {
    var field = event.target.getAttribute(NAME);
    var value = event.target.getAttribute(VALUE);
    var selected = event.target.checked;
    if (selected) {
      this.pendingUpdates[field] = value;
    }
  }

  /**
   * @description - Gets all of the configured warnings and evaluates their
   * criteria function. If the flow returns a value for `errorMessage`, then
   * the message will be  added to the currentWarnings
   */
  getCurrentWarnings() {
    this.saveButtonIconName = "";
    this.currentWarnings = [];
    this.blockSaveContinue = false;
    const record = this.currentState;
    let promiseList = [];
    for (let warning of this.conditionalWarnings) {
      promiseList.push(
        evaluateConditionalWarning({
          record: record,
          flowApiName: warning.flowApiName
        })
          .then((result) => {
            if (result) {
              this.currentWarnings.push(result);
            }
          })
          .catch((error) => {
            this.blockSaveContinue = true;
            this.dispatchEvent(
              new ShowToastEvent({
                title: "Error Evaluating Conditional Warning",
                message: this.generateErrorMessage(error),
                variant: "error"
              })
            );
          })
      );
    }
    Promise.allSettled(promiseList).finally(() => {
      if (this.blockSaveContinue === false) {
        this.continueSave();
      }
    });
  }

  /**
   * @description - Determines if the save button should be disabled or not
   * based on the current state of the record.
   */
  getSaveIsDisabled() {
    for (let field of this.requiredFieldApiNames) {
      if (!this.currentState[field]) {
        return true;
      }
    }
    return false;
  }

  /**
   * @description - Generates a generic error to be rendered in a toast message
   */
  generateErrorMessage(error) {
    const errorMessages = reduceErrors(error);
    if (!errorMessages) {
      return error.body.message;
    }
    let message = "The following errors occurred:";
    for (const errorMessage of errorMessages) {
      message += `\n\t* ${errorMessage}`;
    }
    return message;
  }

  determineIfUtilityBarIsDisplayed() {
    invokeUtilityBarApi(this, "getAllUtilityInfo").then((response) => {
      if (response && Array.isArray(response) && response.length > 0) {
        this.utilityBarIsDisplayed = true;
      }
    });
  }

  checkIfEditMode() {
    if (this.currentPageReference?.state?.c__startInEditMode === true) {
      this.broadcast(this.EVENT_TYPE.EDIT);
      this.hideParametersFromUrl();
    }
  }

  hideParametersFromUrl() {
    window.history.replaceState(null, "", window.location.pathname);
  }

  connectedCallback() {
    if (this.groupOverride) {
      this.group = this.groupOverride;
    }
    loadStyle(this, DynamicFormsCSS);
    this.subscribeToMessageChannel();
    this.determineIfUtilityBarIsDisplayed();
    this.checkIfEditMode();
  }

  disconnectedCallback() {
    this.unsubscribeToMessageChannel();
  }
}
