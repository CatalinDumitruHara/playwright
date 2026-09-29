import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  B2bButtonComponent,
  B2bInputComponent,
  B2bPasswordFieldComponent,
  B2bContainerComponent,
} from '@mapfre-tech/b2b-components';
import { passwordMatchValidator } from '../../../../core/validators/password-match.validator';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    B2bButtonComponent,
    B2bInputComponent,
    B2bPasswordFieldComponent,
    B2bContainerComponent,
  ],
  templateUrl: './change-password.page.html',
  styleUrl: './change-password.page.scss',
})
export class ChangePasswordPage {
  changePasswordForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.changePasswordForm = this.fb.group(
      {
        currentPassword: ['', Validators.required],
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: passwordMatchValidator }
    );
  }

  onSubmit() {
    if (this.changePasswordForm.valid) {
      // Lógica para cambiar la contraseña
    }
  }
}
