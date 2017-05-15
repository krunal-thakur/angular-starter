import { CustomValidators } from './validation/custom-validator';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormControlMessageComponent } from "./form-control-message.component/form-control-message.component";

console.log('shared bundle loaded asynchronously');

const declarations = [FormControlMessageComponent];

@NgModule({
  declarations: [
    /**
     * Components / Directives/ Pipes
     */
    ...declarations
  ],
  imports: [
    CommonModule,
    FormsModule    
  ],
  exports: [...declarations]
})
export class SharedModule {
}
