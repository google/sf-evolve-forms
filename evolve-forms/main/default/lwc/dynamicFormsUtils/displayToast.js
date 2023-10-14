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

import { ShowToastEvent } from "lightning/platformShowToastEvent";

/**
 * Utility function to display a toast event
 * @param component - LWC component - should be passed as "this"
 * @param title - Header of the toast popup
 * @param message - Body of the toast popup
 * @param variant - Variant of the toast popup: [info (default), success, warning, error]
 */
export const displayToast = (component, title, message, variant) => {
  component.dispatchEvent(
    new ShowToastEvent({
      title: title,
      message: message,
      variant: variant
    })
  );
};
