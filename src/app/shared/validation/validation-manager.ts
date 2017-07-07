import { ValidatorFn, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { CustomValidators } from './custom-validator';
import { ValidatorMetaData, ValidatorConfig, GroupValidatorConfigParams } from './../../playground/interfaces';
import { FormGroup } from '@angular/forms';
import { AbstractControl } from '@angular/forms';

export class ValidationManager {

  public static VALIDATOR_NAME_CONDITIONAL = 'requiredIf';

  /**
   * Dynamically apply validators
   */
  static applyValidators(form: AbstractControl, validatorMetaData: ValidatorMetaData = {}) {
    if (form) {
      // Apply requested Validator
      this.applyFormValidators(form, validatorMetaData);

      // Process any conditional validators
      this.applySubscriptionForGroupValidators(form, validatorMetaData);
    }
  }

  /**
   * Dynamically clear any validators present on given control.
   */
  static clearValidators(control: AbstractControl) {
    if (control) {
      // Clear Validators.
      control.clearValidators();

      // Since we are clearing validator clear any error / value that control is holding
      if (control.invalid || !control.pristine) {
        control.reset(undefined, {emitEvent: false});
      }

      // If control is FormGroup then loop through all controls and clear respective validators.
      if (control instanceof FormGroup) {
        let formGroup: FormGroup = control;
        Object.keys(formGroup.controls).forEach(ctrl => {
          this.clearValidators(formGroup.get(ctrl));
        });
      }
    }
  }

  /**
   * When form is submitted mark form controls dirty to invoke respective validators
   */
  static invokeValidators(form: FormGroup) {
    if (form) {
      Object.keys(form.controls).forEach(controlName => {
        let control = form.get(controlName);
        if (control instanceof FormGroup) {
          this.invokeValidators(control);
        } else {
          control.markAsDirty();
          // control.markAsTouched();
          control.updateValueAndValidity({emitEvent: false});
        }
      });
    }
  }

  static applyFormValidators(form: AbstractControl, validatorMetaData: ValidatorMetaData) : void {
    if (form && validatorMetaData) {
      Object.keys(validatorMetaData).filter(property => form.get(property))
        .forEach(property => {
          this.applyControlValidators(property, form, validatorMetaData);
        });
    }
  }

  static applyControlValidators(controlName: string, form: AbstractControl, validatorMetaData: ValidatorMetaData) {
    if (validatorMetaData && controlName && form) {
      let control = form.get(controlName);
      if (control) {
        this.composeValidators(control, validatorMetaData[controlName]);
      }

      // If control is group the apply validator to children
      if (control instanceof FormGroup) {
        this.applyFormValidators(control, validatorMetaData);
      }
    }
  }

  private static composeValidators(control: AbstractControl, configurations: ValidatorConfig[]) : void {
    if (control) {
      let asyncControlValidators: AsyncValidatorFn[] = [];
      let controlValidators = configurations.reduce((validators, validatorConfig) => {
        if (CustomValidators[validatorConfig.name]) {
          if(validatorConfig.isAsync) {
            asyncControlValidators.push(this.createValidator(validatorConfig));
          } else {
            validators.push(this.createValidator(validatorConfig));
          }          
        }
        return validators;
      }, []);
      control.setValidators(CustomValidators.compose(controlValidators));
      control.setAsyncValidators(CustomValidators.compose(asyncControlValidators));
    }
  }

  private static createValidator(validatorConfig: ValidatorConfig) : ValidatorFn {
    if (validatorConfig.config) {
      return CustomValidators[validatorConfig.name](validatorConfig.config);
    } else {
      return CustomValidators[validatorConfig.name];
    }
  }

  public static createAsyncValidator(validatorName: string, validationFunction: Function) : void {
    CustomValidators[validatorName] = (control: AbstractControl) : ValidationErrors | null  => {
      return new Promise( resolve => {
        let asyncFunction : Promise<boolean> = validationFunction(control.value);
        asyncFunction.then(isValid => {
          console.log(isValid);
          if(isValid) {
            resolve(null);
          } else {

            resolve({validatorName: true});
          }
        });
      });
    };
  }

  /**
   * Apply subscription to form controls in order to update their validation status when any value changes on form
   *
   * @param {AbstractControl} form
   * @param {ValidatorMetaData} validatorMetaData
   *
   */
  private static applySubscriptionForGroupValidators(form: AbstractControl, validatorMetaData: ValidatorMetaData) {
    // Find controls who require subscription
    let controls = this.findControlsRequiringSubscription(validatorMetaData);
    // Subscribe to changes and toggle optional validations
    form.valueChanges.subscribe(() => {
      controls.forEach(controlName => {
        let control = form.get(controlName);
        if (control) {
          control.updateValueAndValidity({ onlySelf: true, emitEvent: false });

          // This will ensure that validation would not be triggered if control was empty / valid
          if (control.valid) {
            control.markAsPristine();
          }
        }
      });
    });
  }

  /**
   * Find controls which are part of group validation and require subscription
   *
   * @param {ValidatorMetaData} validatorMetaData
   * @returns {Set<string>}
   */
  private static findControlsRequiringSubscription(validatorMetaData: ValidatorMetaData) : Set<string> {
    // Find all properties who needs subscription
    return Object.keys(validatorMetaData).reduce((controls, property) => {
      validatorMetaData[property].forEach(validatorConfig => {
        let groupConfigParams = validatorConfig.config as GroupValidatorConfigParams;
        if (groupConfigParams) {
          // If current config has subscriber specified then add it to list. This is the control who needs subscription.
          if (groupConfigParams.subscriber) {
            controls.add(groupConfigParams.subscriber);
          }

          // If current control requires subscription
          if (groupConfigParams.subscribe) {
            controls.add(property);
          }
        }
      });
      return controls;
    }, new Set<string>());
  }

  constructor() { }
}
