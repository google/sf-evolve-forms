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

import { LightningElement, api, wire } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import { CurrentPageReference } from "lightning/navigation";
import {
  publish,
  subscribe,
  unsubscribe,
  MessageContext,
  APPLICATION_SCOPE
} from "lightning/messageService";
import DynamicFormsMessageChannel from "@salesforce/messageChannel/DynamicForms__c";

// Base class for shared functionality between all DynamicForm LWC components.
export default class DynamicFormsElement extends NavigationMixin(
  LightningElement
) {
  @api objectApiName;
  @api recordId = null;
  @api group = null;

  currentPageReference = null;
  subscription = null;

  @wire(MessageContext) messageContext;

  // Event types that should be used with broadcast() and handleMessage().
  EVENT_TYPE = {
    // Broadcast that the form should cancel the current form modifications
    CANCEL: "Cancel",
    // Check if the form is currently in edit mode
    CHECK_EDIT: "CheckEdit",
    // Check if any form values should be overridden by a pre-populated value
    CHECK_OVERRIDES: "CheckOverrides",
    // Broadcast that the form should switch to edit mode
    EDIT: "Edit",
    // Broadcast that an input element got focus
    FOCUS_IN: "FocusIn",
    // Broadcast that an input element focused out
    FOCUS_OUT: "FocusOut",
    // Broadcast to remove required field which is no longer required
    NO_LONGER_REQUIRED_FIELD: "NoLongerRequiredField",
    // Broadcast that this element contains a required field
    REQUIRED_FIELD: "RequiredField",
    // Broadcast to reset current form fields
    RESET: "Reset",
    // Broadcast that the form has finished saving (successful or not)
    SAVE_END: "SaveEnd",
    // Broadcast that the form has begun to save
    SAVE_START: "SaveStart",
    // Broadcast that a field value is updated
    UPDATE: "Update"
  };

  // Default group to either be the recordId of the record page or apiName of the app page.
  @wire(CurrentPageReference)
  handleParameters(pageRef) {
    this.currentPageReference = pageRef;
    if (this.group === null) {
      this.group =
        pageRef?.attributes?.recordId ??
        pageRef?.attributes?.apiName ??
        `${pageRef?.attributes?.objectApiName}.${pageRef?.attributes?.actionName}`;
    }
  }

  // Subscribe to the DynamicFormsMessageChannel channel that all DynamicFormsElements communicate
  // through. Call during connectedCallback(). Implement handleMessage() in child class.
  subscribeToMessageChannel() {
    if (!this.subscription) {
      this.subscription = subscribe(
        this.messageContext,
        DynamicFormsMessageChannel,
        (message) => this.verifyAndHandleMessage(message),
        { scope: APPLICATION_SCOPE }
      );
    }
  }

  // Verify that a message is sent to this form group, then designate handleMessage() logic to the
  // child component.
  verifyAndHandleMessage(message) {
    if (message && message.eventType && message.group === this.group) {
      this.handleMessage(message);
    }
  }

  // Stub method. Called when a message is broadcast via DynamicFormsMessageChannel.
  handleMessage(message) {
    // Implement custom behavior in the child component.
  }

  // Broadcast a message on the DynamicFormsMessageChannel to all DynamicFormsElements.
  // eventType is a String that must be provided.
  // additionalData is an optional object containing additional values to broadcast.
  broadcast(eventType, additionalData) {
    if (this.messageContext) {
      /* Sometimes the messageContext can be invalid and publishing with invalid messageContext
      throws an error. Falsy check on messageContext doesn't help because messageContext
      still has a truthy value. Added try catch block to catch these errors and discard. */
      try {
        publish(this.messageContext, DynamicFormsMessageChannel, {
          eventType: eventType,
          group: this.group,
          ...additionalData
        });
      } catch (error) {
        console.error(error);
      }
    }
  }

  // Unsubscribe to the channel when the element is disconnected.
  // Call during disconnectedCallback().
  unsubscribeToMessageChannel() {
    unsubscribe(this.subscription);
    this.subscription = null;
  }

  // Helper method to try to convert a JSON string to a JSON object without breaking the LWC.
  // Used for converting properties passed into the LWC from app builder.
  tryToParseJSON(jsonVariable) {
    if (typeof jsonVariable === "string") {
      try {
        return JSON.parse(jsonVariable?.replace(/\r?\n|\r/g, ""));
      } catch (e) {
        /* Fall through to bottom return statement */
      }
    } else if (typeof jsonVariable === "object") {
      return jsonVariable;
    }
    return {};
  }

  // Helper method to navigate to another record.
  navigateToRecord(recordId) {
    this[NavigationMixin.Navigate]({
      type: "standard__recordPage",
      attributes: {
        recordId: recordId?.substring(0, 15),
        actionName: "view"
      }
    });
  }
}
