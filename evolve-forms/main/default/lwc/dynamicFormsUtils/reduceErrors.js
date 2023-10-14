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

/**
 * Reduces one or more LDS errors into a string[] of error messages.
 * @param {FetchResponse|FetchResponse[]} errors
 * @return {String[]} Error messages
 * Source - http://shortn/_c5tgNH8l7z
 */
const STRING = "string";
const reduceErrors = (errors) => {
  if (!Array.isArray(errors)) {
    errors = [errors];
  }

  return (
    errors
      // Remove null/undefined items
      .filter((error) => !!error)
      // Extract an error message
      .map((error) => {
        // UI API read errors
        if (Array.isArray(error.body)) {
          return error.body.map((e) => e.message);
        }
        // FIELD VALIDATION, FIELD, and trigger.addError
        else if (
          error.body &&
          error.body.enhancedErrorType &&
          error.body.enhancedErrorType.toLowerCase() === "recorderror" &&
          error.body.output
        ) {
          let firstError = "";
          if (
            error.body.output.errors.length &&
            error.body.output.errors[0].errorCode.includes("_") // one of the many salesforce errors with underscores
          ) {
            firstError = error.body.output.errors[0].message;
          }
          if (
            !error.body.output.errors.length &&
            error.body.output.fieldErrors
          ) {
            // It's in a really weird format...
            firstError =
              error.body.output.fieldErrors[
                Object.keys(error.body.output.fieldErrors)[0]
              ][0].message;
          }
          return firstError;
        }
        // UI API DML, Apex and network errors
        else if (error.body && typeof error.body.message === STRING) {
          let errorMessage = error.body.message;
          if (typeof error.body.stackTrace === STRING) {
            errorMessage += `\n${error.body.stackTrace}`;
          }
          return errorMessage;
        }
        // PAGE ERRORS
        else if (
          error.body &&
          error.body.pageErrors &&
          error.body.pageErrors.length
        ) {
          return error.body.pageErrors[0].message;
        }
        // JS errors
        else if (typeof error.message === STRING) {
          return error.message;
        }
        // Unknown error shape so try HTTP status text
        return error.statusText;
      })
      // Flatten
      .reduce((prev, curr) => prev.concat(curr), [])
      // Remove empty strings
      .filter((message) => !!message)
  );
};

export { reduceErrors };
