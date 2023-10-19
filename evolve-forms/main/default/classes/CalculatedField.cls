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
 * @description - Metadata about a calculated field in a format that can be utilized by CalculatedFieldController
 */
@SuppressWarnings('PMD.ExcessivePublicCount, PMD.ApexDoc')
public class CalculatedField {
  @AuraEnabled
  public LightningFormattedAddress address { get; set; }

  @AuraEnabled
  public LightningFormattedDateTime dateTimeValue { get; set; }

  @AuraEnabled
  public LightningFormattedEmail email { get; set; }

  @AuraEnabled
  public LightningFormattedLocation location { get; set; }

  @AuraEnabled
  public LightningFormattedName name { get; set; }

  @AuraEnabled
  public LightningFormattedNumber numberValue { get; set; }

  @AuraEnabled
  public LightningFormattedPhoneNumber phoneNumber { get; set; }

  @AuraEnabled
  public LightningFormattedText text { get; set; }

  @AuraEnabled
  public LightningFormattedTime timeValue { get; set; }

  @AuraEnabled
  public LightningFormattedUrl url { get; set; }

  @AuraEnabled
  public Boolean booleanValue { get; set; }

  @AuraEnabled
  public Boolean isBoolean {
    public get {
      return this.booleanValue != null;
    }
    private set;
  }

  @AuraEnabled
  public String helpText { get; set; }

  @AuraEnabled
  public String label { get; set; }
}
