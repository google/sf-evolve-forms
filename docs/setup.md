# Setup

There are a few steps necessary to get started using Evolve Forms on a given
sObject within your org.

## Editing Records

### 1. Replace the Default Edit Button

Evolve Forms uses a custom `Edit` button on the lightning record page, so we need
to modify the page layout to remove the standard `Edit` button and replace it.

##### Create Edit Button for Page Layout

First, navigate to the setup menu, select the sObject you want to use Evolve on,
and create a new Action for that sObject:

![New Action](images/NewAction.png)

Select the `c:dynamicFormsHeadlessEdit` Lightning Web Component and set the
Label as "Edit": ![Edit Action](images/EditAction.png)

Replace the edit button on the assigned page layout:

![ReplaceEditButton](images/ChangeEditButtonOnPageLayout.gif)

##### Override Edit Action

The page layout is not the only place where an edit can be initiated. In order
to handle the record edits initiated outside of the record detail page (such as
a list view or related list) we must override the default "Edit" action for the
sObject.

![Edit Action Setup Menu](images/EditOverride.png)

Select the `c:dynamicFormsOverrideEdit` Lightning Component.

![Edit Override Selection](images/EditOverrideSelection.png)

### 2. Modify Lightning Record Page

We are almost complete with the setup. Now, we need to add the `Dynamic Forms -
Cancel and Save Buttons` component to the Lightning Record Page, and replace the
standard `Record Detail` component with the `Dynamic Forms - Page Layout`
component.

![Page Layout and Override](images/PageLayoutAndOverride.gif)

![Save and Cancel Buttons](images/SaveAndCancelButtons.png)

Voilà! you are now ready to use Evolve Forms on the selected sObject.

## Creating Records

Creating records using Evolve is very similar to editing records. Use the Page Layout and Field Section components however you need to, but instead of using the [`c-dynamic-forms-save-cancel`](/evolve-forms/main/default/lwc/dynamicFormsElement/dynamicFormsSaveCancel.js) component to render the buttons, use the [`c-dynamic-forms-create`](/evolve-forms/main/default/lwc/dynamicFormsElement/dynamicFormsCreate.js) component instead.

![Create Record](images/RecordCreate.gif)

> NOTE: When using Evolve forms to create records, the sObject API name must be passed to the component from page builder or from a containing component. If using the Page Layout component, the layout's API name must also be passed to the component from page builder or from a containing component.
