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
 * @description - Wrapper for displaying a name field in a formatted manner.
 */
@SuppressWarnings('PMD.ApexDoc')
public class LightningFormattedName {
  @AuraEnabled
  public String firstName { get; set; }

  @AuraEnabled
  public String format { get; set; }

  @AuraEnabled
  public String informalName { get; set; }

  @AuraEnabled
  public String lastName { get; set; }

  @AuraEnabled
  public String middleName { get; set; }

  @AuraEnabled
  public String salutation { get; set; }

  @AuraEnabled
  public String suffix { get; set; }
}
