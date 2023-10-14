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

@IsTest(isParallel=true)
private class CalculatedFieldControllerTest {
  private static final Id CASE_REC_ID =
    Case.sObjectType.getDescribe().getKeyPrefix() + '000000000001';
  private static final String BOGUS_APEX_CLASS_NAME = 'BogusClass';
  private static final String BOGUS_FLOW_API_NAME = 'Bogus';
  private static final String EXCEPTION_SHOULD_BE_THROWN = 'An exception should be thrown';
  private static final String EXCEPTION_SHOULD_HAVE_THE_CORRECT_MESSAGE = 'The exception should have the correct message';
  private static final String FLOW_API_NAME = 'Flow_Api_Name';
  private static final String LIST_SHOULD_HAVE_CORRECT_OUTPUT = 'The list should have the expected result';
  private static final String TEST_CALCULATED_FIELD = 'CalculatedFieldControllerTest.TestCalculatedFields';

  private static Exception myException;
  private static List<CalculatedField> fields = new List<CalculatedField>();

  static {
    CalculatedField c1 = new CalculatedField();
    lightningFormattedText text = new lightningFormattedText();
    text.isRich = false;
    text.linkify = false;
    text.value = 'Value 1';
    c1.text = text;
    c1.label = 'Field 1';

    CalculatedField c2 = new CalculatedField();
    lightningFormattedName text2 = new lightningFormattedName();
    text2.firstName = 'John';
    text2.middleName = 'Middleton';
    text2.lastName = 'Doe';
    text2.suffix = 'The 3rd';
    text2.salutation = 'Mr.';
    text2.informalName = 'Jo';
    text2.format = 'short';
    c2.name = text2;
    c2.label = 'Field 2';

    CalculatedField c3 = new CalculatedField();
    lightningFormattedText text3 = new lightningFormattedText();
    text3.isRich = false;
    text3.linkify = true;
    text3.value = 'Value 3';
    c3.text = text3;
    c3.label = 'Field 3';

    CalculatedField c4 = new CalculatedField();
    lightningFormattedText text4 = new lightningFormattedText();
    text4.isRich = true;
    text4.linkify = false;
    text4.value = '<h2>Default <s>Value</s></h2>';
    c4.text = text4;
    c4.label = 'Field 4';

    CalculatedField c5 = new CalculatedField();
    lightningFormattedUrl url1 = new lightningFormattedUrl();
    url1.tooltip = 'Use full domain name';
    url1.value = 'www.salesforce.com';
    url1.target = '_blank';
    c5.url = url1;
    c5.label = 'Field 5';

    CalculatedField c6 = new CalculatedField();
    lightningFormattedPhoneNumber phone1 = new lightningFormattedPhoneNumber();
    phone1.value = '8005551212';
    phone1.disabled = false;
    c6.phoneNumber = phone1;
    c6.label = 'Field 6';

    CalculatedField c7 = new CalculatedField();
    lightningFormattedNumber number1 = new lightningFormattedNumber();
    number1.value = 1234.5678;
    number1.formatStyle = 'currency';
    number1.currencyCode = 'INR';
    number1.currencyDisplayAs = '';
    number1.maximumFractionDigits = 2;
    number1.maximumSignificantDigits = 2;
    number1.minimumFractionDigits = 2;
    number1.minimumIntegerDigits = 2;
    number1.minimumSignificantDigits = 2;
    c7.numberValue = number1;
    c7.label = 'Field 7';

    CalculatedField c8 = new CalculatedField();
    lightningFormattedlocation loc1 = new lightningFormattedlocation();
    loc1.latitude = 22;
    loc1.longitude = 122.2222;
    c8.location = loc1;
    c8.label = 'Field 8';

    CalculatedField c9 = new CalculatedField();
    lightningFormattedEmail email1 = new lightningFormattedEmail();
    email1.hideIcon = false;
    email1.label = 'Email Us!';
    email1.value = 'email@example.com';
    c9.email = email1;
    c9.label = 'Field 9';

    CalculatedField c10 = new CalculatedField();
    lightningFormattedDateTime dateTime1 = new lightningFormattedDateTime();
    dateTime1.weekday = 'long';
    dateTime1.day = '2-digit';
    dateTime1.month = 'short';
    dateTime1.year = '2-digit';
    dateTime1.value = '1547250828000';
    dateTime1.era = '';
    dateTime1.hour = '';
    dateTime1.hour12 = false;
    dateTime1.minute = '';
    dateTime1.second = '';
    dateTime1.timeZone = '';
    dateTime1.timeZoneName = '';
    c10.dateTimeValue = dateTime1;
    c10.label = 'Field 10';

    CalculatedField c11 = new CalculatedField();
    lightningFormattedAddress address1 = new lightningFormattedAddress();
    address1.street = '121 Spear St.';
    address1.city = 'San Francisco';
    address1.country = 'US';
    address1.province = 'CA';
    address1.postalCode = '94105';
    address1.showStaticMap = false;
    address1.disabled = false;
    c11.address = address1;
    c11.label = 'Field 11';

    fields.add(c1);
    fields.add(c2);
    fields.add(c3);
    fields.add(c4);
    fields.add(c5);
    fields.add(c6);
    fields.add(c7);
    fields.add(c8);
    fields.add(c9);
    fields.add(c10);
    fields.add(c11);
  }

  @IsTest
  private static void apexClassAndFlowNameInputParamsMissingShouldThrowException() {
    List<CalculatedField> calcFieldList = new List<CalculatedField>();

    try {
      calcFieldList = CalculatedFieldController.getFieldsToRender(
        CASE_REC_ID,
        null,
        null
      );
    } catch (IllegalArgumentException e) {
      myException = e;
    }

    System.Assert.areNotEqual(null, myException, EXCEPTION_SHOULD_BE_THROWN);

    System.Assert.areEqual(
      CalculatedFieldController.APEX_OR_FLOW_REQUIRED,
      myException.getMessage(),
      EXCEPTION_SHOULD_HAVE_THE_CORRECT_MESSAGE
    );
  }

  @IsTest
  private static void apexClassAndFlowNameBothPresentShouldThrowException() {
    List<CalculatedField> calcFieldList = new List<CalculatedField>();

    try {
      calcFieldList = CalculatedFieldController.getFieldsToRender(
        CASE_REC_ID,
        TEST_CALCULATED_FIELD,
        BOGUS_FLOW_API_NAME
      );
    } catch (IllegalArgumentException e) {
      myException = e;
    }

    System.Assert.areNotEqual(null, myException, EXCEPTION_SHOULD_BE_THROWN);

    System.Assert.areEqual(
      CalculatedFieldController.APEX_AND_FLOW_ARE_MUTUALLY_EXCLUSIVE,
      myException.getMessage(),
      EXCEPTION_SHOULD_HAVE_THE_CORRECT_MESSAGE
    );
  }

  @IsTest
  private static void apexClassDoesNotExistsShouldThrowException() {
    List<CalculatedField> calcFieldList = new List<CalculatedField>();

    try {
      calcFieldList = CalculatedFieldController.getFieldsToRender(
        CASE_REC_ID,
        BOGUS_APEX_CLASS_NAME,
        null
      );
    } catch (IllegalArgumentException e) {
      myException = e;
    }

    System.Assert.areNotEqual(null, myException, EXCEPTION_SHOULD_BE_THROWN);

    System.Assert.areEqual(
      CalculatedFieldController.CLASS_DOES_NOT_EXIST,
      myException.getMessage(),
      EXCEPTION_SHOULD_HAVE_THE_CORRECT_MESSAGE
    );
  }

  @IsTest
  private static void validApexClassNameShouldReturnCalculatedFields() {
    System.Assert.areEqual(
      fields,
      CalculatedFieldController.getFieldsToRender(
        CASE_REC_ID,
        TEST_CALCULATED_FIELD,
        null
      ),
      LIST_SHOULD_HAVE_CORRECT_OUTPUT
    );
  }

  @IsTest
  private static void flowDoesNotExistsShouldThrowException() {
    List<CalculatedField> calcFieldList = new List<CalculatedField>();

    try {
      calcFieldList = CalculatedFieldController.getFieldsToRender(
        CASE_REC_ID,
        null,
        BOGUS_FLOW_API_NAME
      );
    } catch (IllegalArgumentException e) {
      myException = e;
    }

    System.Assert.areNotEqual(null, myException, EXCEPTION_SHOULD_BE_THROWN);

    System.Assert.areEqual(
      CalculatedFieldController.FLOW_DOES_NOT_EXIST,
      myException.getMessage(),
      EXCEPTION_SHOULD_HAVE_THE_CORRECT_MESSAGE
    );
  }

  @IsTest
  private static void validFlowShouldReturnCalculatedFields() {
    Map<String, Object> inputs = new Map<String, Object>();
    inputs.put(CalculatedFieldController.CALCULATED_FIELDS, fields);
    DynamicFormsControllerTest.FakeInterview fake = new DynamicFormsControllerTest.FakeInterview(
      inputs
    );
    CalculatedFieldController.flowInterview = fake;

    System.Assert.areEqual(
      fields,
      CalculatedFieldController.getFieldsToRender(
        CASE_REC_ID,
        null,
        FLOW_API_NAME
      ),
      LIST_SHOULD_HAVE_CORRECT_OUTPUT
    );
  }

  public class TestCalculatedFields implements CalculatedFieldController.Renderer {
    public List<CalculatedField> getFields(Id recordId) {
      return fields;
    }
  }
}
