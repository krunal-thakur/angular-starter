import { CustomValidators } from './custom-validator';
import { ValidatorFn, FormControl } from '@angular/forms';
import { FormGroup } from '@angular/forms';
import { Validators, AbstractControl, ValidationErrors } from '@angular/forms';
export class CustomValidators extends Validators {

    static applyValidators(form: AbstractControl, validatorMetaData: ValidatorMetaData): void {
        for (let key in validatorMetaData) {
            CustomValidators.composeValidators(form.get(key), validatorMetaData[key]);
        }
    }

    static composeValidators(control: AbstractControl, configurations: ValidatorConfig[]): void {
        let controlValidators = configurations.reduce((validators, validatorConfig) => {
            if (CustomValidators[validatorConfig.name]) {
                validators.push(CustomValidators.createValidator(control, validatorConfig));
            }
            return validators;
        }, []);
        //control.root.get('control2').setValidators(Validators.compose(controlValidators));
        control.setValidators(Validators.compose(controlValidators));
    }

    static createValidator(control: AbstractControl, validatorConfig: ValidatorConfig): ValidatorFn {
        if (validatorConfig.config) {
            return CustomValidators[validatorConfig.name](validatorConfig.config);
        } else {
            return CustomValidators[validatorConfig.name];
        }
    }

    static isEmptyInputValue(value: any): boolean {
        // we don't check for string here so it also works with arrays
        return value == null || value.length === 0;
    }


    static len(configParams: LengthValidatorConfigParams): ValidatorFn {
        let validators = [];
        if (configParams.minLength) {
            validators.push(Validators.minLength(configParams.minLength));
        }

        if (configParams.maxLength) {
            validators.push(Validators.maxLength(configParams.maxLength));
        }

        if (validators.length) {
            return Validators.compose(validators);
        }
        return null;
    }

    static doesNotMatch(configParams: GroupValidatorConfigParams): ValidatorFn {
        let subscriptionCreated: boolean = false;
        return (control: AbstractControl): ValidationErrors | null => {

            let subscriberControl: AbstractControl = undefined;
            let controlValue = undefined;
            let group: AbstractControl = control;

            if(configParams.subscriber) {
                subscriberControl = control.get(configParams.subscriber);               
            }

            if(!subscriberControl) {
                subscriberControl = control;
                group = control.parent;
            }

            controlValue = subscriberControl.value;            

            if (CustomValidators.isEmptyInputValue(controlValue)) {
                return null;  // don't validate empty values to allow optional controls
            }

            let duplicates = configParams.source.filter(controlName => {
                let currentControl = group.get(controlName);
                
                if (currentControl && control.value == currentControl.value) {
                    return true;
                }
                return false;
            });

            let error = duplicates && duplicates.length ? { 'doesNotMatch': { 'value': control.value, 'match': duplicates } } : null;

            subscriberControl.setErrors(error);

            return error;
        };
    }

    static subscribeValueChanges(form: AbstractControl, control: AbstractControl, source: string[]) {
        console.log(source);
        source.forEach(controlName => {
            let currentControl = form.get(controlName);

            if (currentControl) {
                console.log(currentControl.validator.name);
                currentControl.valueChanges.subscribe(value => {
                    if (!control.pristine) {
                        control.updateValueAndValidity({ onlySelf: true, emitEvent: false })
                    }
                });
            }
        });
    }
}