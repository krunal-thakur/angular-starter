import { FormControl } from '@angular/forms';
import { Component, Input } from '@angular/core';


@Component({
    templateUrl: './form-control-message.component.html',
    selector: 'form-control-message'
})
export class FormControlMessageComponent {

    message: string;

    @Input() control: FormControl;

    constructor(){}

    get errorMessage() {
        // console.log(this.control);
        if(!this.control.pristine && this.control.errors) {            
            for(let property in this.control.errors) {
                return property;
            }
        }        
        return null;
    }

}