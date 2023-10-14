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
 * @group - Controller
 * @description - Controller class for CalculatedFieldSection LWC
 */
public with sharing class CalculatedFieldController {
  public static final String APEX_AND_FLOW_ARE_MUTUALLY_EXCLUSIVE = 'Apex Class Name and Flow API Name are mutually exclusive, please input only one value';
  public static final String APEX_OR_FLOW_REQUIRED = 'Please input Apex Class Name or Flow API Name to render calculated fields section';
  public static final String CALCULATED_FIELDS = 'calculatedFields';
  public static final String CLASS_DOES_NOT_EXIST = 'Class does not exists';
  public static final String CLASS_DOES_NOT_IMPLEMENT_INTERFACE = 'Class does not implement Renderer intereface';
  public static final String FLOW_DOES_NOT_EXIST = 'Flow does not exists';
  public static final String FLOW_DOES_NOT_HAVE_OUTPUT_VARIABLE = 'Flow does not have output variable calculatedFields';
  public static final String RECORD_ID = 'recordId';

  @TestVisible
  private static DynamicFormsController.Interview flowInterview = new DynamicFormsController.Interview();

  /**
   * @description Dynamically calculates field and return a list of CalculatedField wrapper
   * @param recordId - case record Id.
   * @param apexClassName - Apex class used to calculate fields.
   * @param flowApiName - Flow name used to calculate fields.
   * @return - a list of CalculatedFields to be displayed
   */
  @AuraEnabled
  public static List<CalculatedField> getFieldsToRender(
    Id recordId,
    String apexClassName,
    String flowApiName
  ) {
    if (recordId == null) {
      return new List<CalculatedField>();
    }
    validateInput(apexClassName, flowApiName);

    CalculatedFieldController.Renderer fieldRenderer = String.isNotBlank(
        apexClassName
      )
      ? getRendererFromClassName(apexClassName)
      : new FlowRenderer(flowApiName);

    return fieldRenderer.getFields(recordId);
  }

  private static void validateInput(String apexClassName, String flowApiName) {
    if (apexClassName == null && flowApiName == null) {
      throw new IllegalArgumentException(APEX_OR_FLOW_REQUIRED);
    }
    if (apexClassName != null && flowApiName != null) {
      throw new IllegalArgumentException(APEX_AND_FLOW_ARE_MUTUALLY_EXCLUSIVE);
    }
  }

  private static CalculatedFieldController.Renderer getRendererFromClassName(
    String apexClassName
  ) {
    try {
      return (CalculatedFieldController.Renderer) Type.forName(apexClassName)
        .newInstance();
    } catch (System.NullPointerException e) {
      throw new IllegalArgumentException(CLASS_DOES_NOT_EXIST);
    } catch (System.TypeException e) {
      throw new IllegalArgumentException(CLASS_DOES_NOT_IMPLEMENT_INTERFACE);
    }
  }

  /**
   * @description - The interface which must be satisfied to render CalculatedFields
   */
  public interface Renderer {
    /**
     * @description - Specification
     * @param recordId - The current record's Id
     * @return - CalculatedFields to be rendered
     */
    List<CalculatedField> getFields(Id recordId);
  }

  /**
   * @description - Uses a dynamically instantiated Flow to calculate
   * which fields to render
   */
  public class FlowRenderer implements CalculatedFieldController.Renderer {
    @TestVisible
    private String flowApiName = '';
    /**
     * @description - Constructor
     * @param flowApiName - API name of the autolaunched flow to be dynamically
     * instantiated
     */
    public FlowRenderer(String flowApiName) {
      this.flowApiName = flowApiName;
    }

    /**
     * @description - Uses the specified flow to dynamically instantiate an interview
     * and calculate the field values
     * @param recordId - Id of the current record
     * @return - CalculatedFields to be rendered
     */
    public List<CalculatedField> getFields(Id recordId) {
      List<CalculatedField> calcFieldList = new List<CalculatedField>();
      Map<String, Object> inputs = new Map<String, Object>();
      inputs.put(RECORD_ID, recordId);

      try {
        flowInterview.createInterview(flowApiName, inputs);
        flowInterview.start();
      } catch (System.TypeException e) {
        throw new IllegalArgumentException(FLOW_DOES_NOT_EXIST);
      }

      try {
        calcFieldList = (List<CalculatedField>) flowInterview.getVariableValue(
          CALCULATED_FIELDS
        );
      } catch (System.NullPointerException e) {
        throw new IllegalArgumentException(FLOW_DOES_NOT_HAVE_OUTPUT_VARIABLE);
      }
      return calcFieldList;
    }
  }
}
