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
 * Allows Lightning Console API to be invoked from LWC
 * @param String apiName
 * @param String methodName
 * @param {} methodArgs
 * @return Promise lightningConsoleApi Promise
 * Source - https://developer.salesforce.com/docs/atlas.en-us.232.0.api_console.meta/api_console/sforce_api_console_lex_getting_started.htm
 */
const lightningConsoleApi = (component, apiName, methodName, methodArgs) => {
  return new Promise((resolve, reject) => {
    const apiEvent = new CustomEvent("internalapievent", {
      bubbles: true,
      composed: true,
      cancelable: false,
      detail: {
        category: apiName,
        methodName: methodName,
        methodArgs: methodArgs,
        callback: (err, response) => {
          if (err) {
            return reject(err);
          }
          return resolve(response);
        }
      }
    });

    component.dispatchEvent(apiEvent);
  });
};

export const invokeUtilityBarApi = (component, methodName, methodArgs) => {
  return lightningConsoleApi(
    component,
    "utilityBarAPI",
    methodName,
    methodArgs
  );
};

export const invokeWorkspaceApi = (component, methodName, methodArgs) => {
  return lightningConsoleApi(component, "workspaceAPI", methodName, methodArgs);
};
