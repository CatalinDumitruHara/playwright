import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  B2bButtonComponent,
  B2bInputComponent,
  B2bLabelComponent,
  B2bNotificationInlineComponent,
} from '@mapfre-tech/b2b-components';

@Component({
  selector: 'app-change-password-forced',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    B2bInputComponent,
    B2bButtonComponent,
    B2bLabelComponent,
    B2bNotificationInlineComponent,
  ],
  templateUrl: './change-password-forced.page.html',
  styleUrl: './change-password-forced.page.scss',
})
export class ChangePasswordForcedPage {
  private fb = inject(FormBuilder);

  form: FormGroup = this.fb.group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(10)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: this.passwordsMatch }
  );

  passwordsMatch(group: FormGroup) {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { mismatch: true };
  }

  changePassword() {
    if (this.form.valid) {
      console.log(this.form.value);
    }
  }
}
