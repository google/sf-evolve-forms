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
 * @group - Test
 * @description - Tests for DynamicFormsController
 */
@TestVisible
@IsTest(isParallel=true)
private with sharing class DynamicFormsControllerTest {
  private static final String BEHAVIOR = 'behavior';
  private static final String FIELD = 'field';
  private static final String LAYOUT_ITEMS = 'layoutItems';
  private static final String PAGE_LAYOUT_NAME = 'Case-RecordTypeName';
  private static final String SECTION_LABEL = 'label';
  private static final String SOBJECT_CASE = 'Case';
  private static final String SOBJECT_RELATION_CASES = 'Cases';
  private static final String STRATEGY_NEWEST = 'Newest';
  private static final String STRATEGY_NONE = 'None';
  private static final String STRATEGY_OLDEST = 'Oldest';

  private static Metadata.Layout mockedLayout;
  private static SObject mockedObject;
  private static UserRecordAccess mockUserAccess = new UserRecordAccess();

  @IsTest
  private static void sectionLabelShouldBeProperlyMapped() {
    mockLayoutColumn(new List<Object>{});

    DynamicFormsController.FieldSection result = getLayout();

    System.assertEquals(
      SECTION_LABEL,
      result.sectionLabel,
      'Expected Section Label to be mapped from LayoutSection.label.'
    );
  }

  @IsTest
  private static void numberOfColumnsShouldBeProperlyMapped() {
    mockLayoutColumn(
      new List<Object>{
        new Map<String, Object>{ LAYOUT_ITEMS => new List<Object>{} },
        new Map<String, Object>{ LAYOUT_ITEMS => new List<Object>{} }
      }
    );

    DynamicFormsController.FieldSection result = getLayout();

    System.assertEquals(
      '2',
      result.numberOfColumns,
      'Expected columns mapped from LayoutSection.layoutColumns.size().'
    );
  }

  @IsTest
  private static void requiredFieldShouldBeProperlyConstructed() {
    mockLayoutColumn(
      new List<Object>{
        new Map<String, Object>{
          LAYOUT_ITEMS => new List<Object>{
            new Map<String, Object>{ BEHAVIOR => 'REQUIRED', FIELD => 'Field' }
          }
        }
      }
    );

    DynamicFormsController.FieldSection result = getLayout();

    System.assertEquals(
      '*Field',
      result.apiNamesCsv,
      'Expected required field to be properly annotated.'
    );
  }

  @IsTest
  private static void readonlyFieldShouldBeProperlyConstructed() {
    mockLayoutColumn(
      new List<Object>{
        new Map<String, Object>{
          LAYOUT_ITEMS => new List<Object>{
            new Map<String, Object>{ BEHAVIOR => 'READONLY', FIELD => 'Field' }
          }
        }
      }
    );

    DynamicFormsController.FieldSection result = getLayout();

    System.assertEquals(
      'Field*',
      result.apiNamesCsv,
      'Expected readonly field to be properly annotated.'
    );
  }

  @IsTest
  private static void editFieldShouldBeProperlyConstructed() {
    mockLayoutColumn(
      new List<Object>{
        new Map<String, Object>{
          LAYOUT_ITEMS => new List<Object>{
            new Map<String, Object>{ BEHAVIOR => 'EDIT', FIELD => 'Field' }
          }
        }
      }
    );

    DynamicFormsController.FieldSection result = getLayout();

    System.assertEquals(
      'Field',
      result.apiNamesCsv,
      'Expected edit field to be properly annotated.'
    );
  }

  @IsTest
  private static void emptySpaceShouldBeProperlyConstructed() {
    mockLayoutColumn(
      new List<Object>{
        new Map<String, Object>{
          LAYOUT_ITEMS => new List<Object>{
            new Map<String, Object>{ 'emptySpace' => true },
            new Map<String, Object>{ BEHAVIOR => 'EDIT', FIELD => 'Field' }
          }
        }
      }
    );

    DynamicFormsController.FieldSection result = getLayout();

    System.assertEquals(
      ',Field',
      result.apiNamesCsv,
      'Expected empty field to be properly constructed.'
    );
  }

  @IsTest
  private static void multipleColumnsShouldBeProperlyZipped() {
    mockLayoutColumn(
      new List<Object>{
        new Map<String, Object>{
          LAYOUT_ITEMS => new List<Object>{
            new Map<String, Object>{ BEHAVIOR => 'EDIT', FIELD => '1' },
            new Map<String, Object>{ BEHAVIOR => 'EDIT', FIELD => '2' },
            new Map<String, Object>{ BEHAVIOR => 'EDIT', FIELD => '3' },
            new Map<String, Object>{ BEHAVIOR => 'EDIT', FIELD => '4' }
          }
        },
        new Map<String, Object>{
          LAYOUT_ITEMS => new List<Object>{
            new Map<String, Object>{ BEHAVIOR => 'EDIT', FIELD => '5' },
            new Map<String, Object>{ BEHAVIOR => 'EDIT', FIELD => '6' }
          }
        }
      }
    );

    DynamicFormsController.FieldSection result = getLayout();

    System.assertEquals(
      '1,5,2,6,3,4',
      result.apiNamesCsv,
      'Expected fields to be properly zipped to render properly.'
    );
  }

  @IsTest
  private static void getLayoutSectionsShouldReturnEmptyForNonExistingPageLayoutName() {
    mockLayoutColumn(
      new List<Object>{
        new Map<String, Object>{
          LAYOUT_ITEMS => new List<Object>{
            new Map<String, Object>{ BEHAVIOR => 'EDIT', FIELD => 'Field' }
          }
        }
      }
    );

    DynamicFormsController.FieldSection[] result = DynamicFormsController.getLayoutSectionsByPageLayoutName(
      'Case-NonExistentPageLayoutName'
    );

    System.assertEquals(
      true,
      result.isEmpty(),
      'Expected lookup from failed lookup to return empty results.'
    );
  }

  @IsTest
  private static void getLayoutSectionsShouldReturnEmptyForNonExistingPageLayout() {
    DynamicFormsController.FieldSection[] result = DynamicFormsController.getLayoutSectionsByPageLayoutName(
      'Case-NonExistentPageLayoutName'
    );

    System.assertEquals(
      true,
      result.isEmpty(),
      'Expected lookup from failed lookup to return empty results.'
    );
  }

  @IsTest
  private static void getWarningsShouldReturnEmptyListForNoMatchingRows() {
    List<Conditional_Warning__mdt> warnings = DynamicFormsController.getWarnings(
      'BogusSObjectApiName'
    );

    System.assertEquals(
      true,
      warnings.isEmpty(),
      'Expected getWarnings to return empty results.'
    );
  }

  @IsTest
  private static void getParentRecordIdShouldWorkForValidParentId() {
    Case record = new Case(ParentId = '500'.repeat(5));
    mockObjectQueried(record);

    Id result = DynamicFormsController.getParentRecordId(
      'Case',
      'ParentId',
      null // Id is irrelevant since SOQL is mocked
    );

    System.assertEquals(
      record.ParentId,
      result,
      'Expected controller to properly parse record path for the Id'
    );
  }

  @IsTest
  private static void getParentRecordIdShouldWorkForValidPathToParentId() {
    Case record = new Case(Parent = new Case(Id = '500'.repeat(5)));
    mockObjectQueried(record);

    Id result = DynamicFormsController.getParentRecordId(
      SOBJECT_CASE,
      'Parent.Id',
      null // Id is irrelevant since SOQL is mocked
    );

    System.assertEquals(
      record.Parent.Id,
      result,
      'Expected controller to properly parse record path for the Id'
    );
  }

  @IsTest
  private static void getParentRecordIdShouldWorkForValidPathToGrandParentId() {
    Case record = new Case(
      Parent = new Case(Parent = new Case(Id = '500'.repeat(5)))
    );
    mockObjectQueried(record);

    Id result = DynamicFormsController.getParentRecordId(
      SOBJECT_CASE,
      'Parent.Parent.Id',
      null // Id is irrelevant since SOQL is mocked
    );

    System.assertEquals(
      record.Parent.Parent.Id,
      result,
      'Expected controller to properly parse record path for the Id'
    );
  }

  @IsTest
  private static void getChildRecordIdShouldWorkForValidChildRelationship() {
    Case child = new Case(ParentId = '500'.repeat(5));
    Case record = createCaseWithChildren(new List<Case>{ child });
    mockObjectQueried(record);

    Id result = DynamicFormsController.getChildRecordId(
      SOBJECT_CASE,
      SOBJECT_RELATION_CASES,
      null, // Id is irrelevant since SOQL is mocked
      STRATEGY_NONE
    );

    System.assertEquals(
      child.Id,
      result,
      'Expected controller to properly parse record path for the Id'
    );
  }

  @IsTest
  private static void getChildRecordIdShouldReturnFirstRecordForOldestChildStrategy() {
    Case child = new Case(ParentId = '500'.repeat(5));
    Case record = createCaseWithChildren(new List<Case>{ child, new Case() });
    mockObjectQueried(record);

    Id result = DynamicFormsController.getChildRecordId(
      SOBJECT_CASE,
      SOBJECT_RELATION_CASES,
      null, // Id is irrelevant since SOQL is mocked
      STRATEGY_OLDEST
    );

    System.assertEquals(
      child.Id,
      result,
      'Expected controller to properly parse record path for the Id'
    );
  }

  @IsTest
  private static void getChildRecordIdShouldReturnFirstRecordForNewestChildStrategy() {
    Case child = new Case(ParentId = '500'.repeat(5));
    Case record = createCaseWithChildren(new List<Case>{ child, new Case() });
    mockObjectQueried(record);

    Id result = DynamicFormsController.getChildRecordId(
      SOBJECT_CASE,
      SOBJECT_RELATION_CASES,
      null, // Id is irrelevant since SOQL is mocked
      STRATEGY_NEWEST
    );

    System.assertEquals(
      child.Id,
      result,
      'Expected controller to properly parse record path for the Id'
    );
  }

  @IsTest
  private static void getChildRecordIdShouldThrowErrorForNoneChildStrategy() {
    Case child = new Case(ParentId = '500'.repeat(5));
    Case record = createCaseWithChildren(new List<Case>{ child, new Case() });
    mockObjectQueried(record);

    Exception e;

    try {
      DynamicFormsController.getChildRecordId(
        SOBJECT_CASE,
        SOBJECT_RELATION_CASES,
        null, // Id is irrelevant since SOQL is mocked
        STRATEGY_NONE
      );
    } catch (AuraHandledException ae) {
      e = ae;
    }

    System.assertNotEquals(
      null,
      e,
      'Expected controller to throw exception when multiple children were found'
    );
  }

  @IsTest
  private static void getChildRecordIdShouldReturnNullWhenNoChildren() {
    Case record = new Case();
    mockObjectQueried(record);

    Id result = DynamicFormsController.getChildRecordId(
      SOBJECT_CASE,
      SOBJECT_RELATION_CASES,
      null, // Id is irrelevant since SOQL is mocked
      STRATEGY_NONE
    );

    System.assertEquals(null, result, 'Expected controller to return null');
  }

  @IsTest
  private static void getFieldInfoShouldIdentifyRequiredField() {
    DynamicFormsController.Field field = DynamicFormsController.getFieldInfo(
      'Case',
      '*Description',
      null
    )[0];

    System.assertEquals(true, field.required, 'Expected field to be required.');
    System.assertEquals(
      false,
      field.readOnly,
      'Expected field to not be read-only.'
    );
    System.assertEquals(
      false,
      field.isSpace,
      'Expected field to not be space.'
    );
  }

  @IsTest
  private static void getFieldInfoShouldIdentifyReadOnlyField() {
    DynamicFormsController.Field field = DynamicFormsController.getFieldInfo(
      'Case',
      'Description*',
      null
    )[0];

    System.assertEquals(
      false,
      field.required,
      'Expected field to not be required.'
    );
    System.assertEquals(
      true,
      field.readOnly,
      'Expected field to be read-only.'
    );
    System.assertEquals(
      false,
      field.isSpace,
      'Expected field to not be space.'
    );
  }

  @IsTest
  private static void getFieldInfoShouldIdentifySpaceField() {
    DynamicFormsController.Field field = DynamicFormsController.getFieldInfo(
      'Case',
      ' ',
      null
    )[0];

    System.assertEquals(
      false,
      field.required,
      'Expected field to not be required.'
    );
    System.assertEquals(
      false,
      field.readOnly,
      'Expected field to not be read-only.'
    );
    System.assertEquals(true, field.isSpace, 'Expected field to be space.');
  }

  @IsTest
  private static void getFieldInfoShouldIdentifyReferenceField() {
    DynamicFormsController.Field field = DynamicFormsController.getFieldInfo(
      'Case',
      'ContactId',
      null
    )[0];

    System.assertEquals(
      false,
      field.required,
      'Expected field to not be required.'
    );
    System.assertEquals(
      false,
      field.readOnly,
      'Expected field to not be read-only.'
    );
    System.assertEquals(
      false,
      field.isSpace,
      'Expected field to not be space.'
    );
    System.assertEquals(
      true,
      field.isReference,
      'Expected field to be a reference.'
    );
    System.assertEquals(
      false,
      String.isBlank(field.fieldLabel),
      'Expected field label to be populated.'
    );
  }

  @IsTest
  private static void getFieldInfoShouldPopulateReferenceFieldWhenRecordSupplied() {
    Case record = (Case) JSON.deserialize(
      JSON.serialize(
        new Map<String, Object>{
          'ContactId' => '003'.repeat(5),
          'Contact' => new Map<String, Object>{ 'Name' => 'ContactName' }
        }
      ),
      Case.class
    );
    mockObjectQueried(record);

    DynamicFormsController.Field field = DynamicFormsController.getFieldInfo(
      'Case',
      'ContactId',
      '005'.repeat(5)
    )[0];

    System.assertEquals(
      'Contact.Name',
      field.nameReferenceToQuery,
      'Expected name reference to be populated.'
    );
    System.assertEquals(
      'Contact',
      field.referenceObject,
      'Expected reference object to be populated.'
    );
    System.assertEquals(
      record.Contact.Name,
      field.referenceName,
      'Expected reference name to be populated.'
    );
    System.assertEquals(
      record.ContactId,
      field.referenceValue,
      'Expected reference value to be populated.'
    );
  }

  @IsTest
  private static void getFieldInfoShouldPopulateSystemFieldWhenRecordSupplied() {
    Case record = (Case) JSON.deserialize(
      JSON.serialize(
        new Map<String, Object>{
          'CreatedBy' => new Map<String, Object>{ 'Name' => 'Created By Name' },
          'CreatedDate' => System.now()
        }
      ),
      Case.class
    );
    mockObjectQueried(record);

    DynamicFormsController.Field field = DynamicFormsController.getFieldInfo(
      'Case',
      'CreatedById',
      '005'.repeat(5)
    )[0];

    String systemDateTime = System.now().format();

    System.assertEquals(true, field.readOnly, 'Field to be readonly');
    System.assertEquals(true, field.isReference, 'Field to be reference');
    System.assertEquals(
      systemDateTime,
      field.systemDateValue,
      'Expected system date time value to be populated.'
    );
    System.assertEquals(
      'Created By Name, ' + systemDateTime,
      field.readOnlyValue,
      'Expected readonly value to be populated.'
    );
  }

  @IsTest
  private static void fetchUserRecordAccessShouldSucceed() {
    DynamicFormsController.selector = new DynamicFormsControllerTest.Selector();

    UserRecordAccess result = DynamicFormsController.fetchUserRecordAccess(
      '005'.repeat(5),
      '500'.repeat(5)
    );

    System.assertEquals(
      mockUserAccess,
      result,
      'User Record Access should be returned.'
    );
  }

  @IsTest
  private static void fetchUserRecordAccessShouldNotSucceed() {
    UserRecordAccess result = DynamicFormsController.fetchUserRecordAccess(
      '005'.repeat(5),
      '500'.repeat(5)
    );

    System.assertEquals(
      null,
      result,
      'User Record Access should not be returned.'
    );
  }

  @SuppressWarnings('PMD.CatchSpecificExceptionType')
  @IsTest
  private static void noFieldAPINamesShouldBeReturnedFromFieldSetWhichDoesNotExist() {
    String exMessage;

    try {
      DynamicFormsController.getFieldsFromFieldSetAPIName(
        'Case',
        'Not_Found_Field_Set'
      );
    } catch (Exception ex) {
      exMessage = ex.getMessage();
    }

    System.assertNotEquals(
      null,
      exMessage,
      'No Field api names to be returned for fieldset which doesn\'t exists.'
    );
  }

  @IsTest
  private static void evaluateConditionalWarningShouldThrowErrorWithIncompleteInput() {
    String exMessage;

    try {
      DynamicFormsController.evaluateConditionalWarning(null, null);
    } catch (IllegalArgumentException ex) {
      exMessage = ex.getMessage();
    }

    System.assertEquals(
      DynamicFormsController.INVALID_INPUT,
      exMessage,
      'The error which was caught is not what we were expecting.'
    );
  }

  @IsTest
  private static void evaluateConditionalWarningShouldThrowErrorWithImproperFlowApiNameInput() {
    String exMessage;
    DynamicFormsControllerTest.FakeInterview fake = new DynamicFormsControllerTest.FakeInterview(
      null
    );
    fake.throwTypeException = true;
    DynamicFormsController.flowInterview = fake;

    try {
      DynamicFormsController.evaluateConditionalWarning(
        new Account(),
        'Bogus_Flow_API_Name'
      );
    } catch (AuraHandledException ex) {
      exMessage = ex.getMessage();
    }

    System.assertNotEquals(
      null,
      exMessage,
      'We should have encountered an aura enabled error.'
    );
  }

  @IsTest
  private static void evaluateConditionalWarningShouldWorkIfEverythingIsConfiguredProperly() {
    String errorMessage = 'Something is not correct';
    DynamicFormsController.flowInterview = new DynamicFormsControllerTest.FakeInterview(
      new Map<String, Object>{
        DynamicFormsController.ERROR_MESSAGE => errorMessage
      }
    );

    System.assertEquals(
      errorMessage,
      DynamicFormsController.evaluateConditionalWarning(
        new Account(),
        'Bogus_Flow_API_Name'
      ),
      'We should receive the error message we are looking for.'
    );
  }

  private static Case createCaseWithChildren(Case[] children) {
    return (Case) JSON.deserialize(
      JSON.serialize(
        new Map<String, Object>{
          'attributes' => new Map<String, String>{ 'type' => 'Case' },
          'Cases' => new Map<String, Object>{
            'totalSize' => children.size(),
            'done' => true,
            'records' => children
          }
        }
      ),
      SObject.class
    );
  }

  // Construct Metadata.Layout from the passed in JSON defining LayoutColumns.
  private static void mockLayoutColumn(List<Object> layoutColumns) {
    String mockedLayoutJSON = JSON.serialize(
      new Map<String, Object>{
        'layoutSections' => new List<Object>{
          new Map<String, Object>{
            'label' => SECTION_LABEL,
            'layoutColumns' => layoutColumns
          }
        }
      }
    );
    mockedLayout = (Metadata.Layout) JSON.deserialize(
      mockedLayoutJSON,
      Metadata.Layout.class
    );
    DynamicFormsController.selector = new DynamicFormsControllerTest.Selector();
  }

  private static void mockObjectQueried(SObject sObjectToMock) {
    mockedObject = sObjectToMock;
    DynamicFormsController.selector = new DynamicFormsControllerTest.Selector();
  }

  private static DynamicFormsController.FieldSection getLayout() {
    return DynamicFormsController.getLayoutSectionsByPageLayoutName(
      PAGE_LAYOUT_NAME
    )[0];
  }

  /**
   * @description - Enables the mocking of a flow interview.
   */
  @TestVisible
  private class FakeInterview extends DynamicFormsController.Interview {
    public Boolean throwTypeException = false;
    private Map<String, Object> results;

    /**
     * @description - Constructor.
     * @param results - Injected results.
     */
    public FakeInterview(Map<String, Object> results) {
      this.results = results;
    }

    public override void createInterview(
      String flowApiName,
      Map<String, Object> inputs
    ) {
      if (throwTypeException) {
        throw new System.TypeException('Invalid type: ' + flowApiName);
      }
    }

    @SuppressWarnings('PMD.EmptyStatementBlock')
    public override void start() {
      // do nothing because we have no real flow to start
    }

    public override Object getVariableValue(String variableName) {
      return this.results.get(variableName);
    }
  }

  private inherited sharing class Selector extends DynamicFormsController.Selector {
    public override Metadata.Layout getPageLayout(String layoutName) {
      return layoutName == PAGE_LAYOUT_NAME
        ? mockedLayout
        : new Metadata.Layout();
    }

    public override SObject queryFields(
      String queryfields,
      String sObjectType,
      Id recordId
    ) {
      return mockedObject;
    }

    public override List<UserRecordAccess> getUserRecordAccess(
      Id userId,
      Id recordId
    ) {
      return new List<UserRecordAccess>{ mockUserAccess };
    }
  }
}
