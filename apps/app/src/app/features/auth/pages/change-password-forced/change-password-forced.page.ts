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
  B2bNotificationInlineComponent,
  B2bPasswordFieldComponent,
} from '@mapfre-tech/b2b-components';
import { AuthenticationService } from '../../../../core/auth/authentication.service';
import { ChangePasswordForcedRequest } from '@api-types';
import { Router } from '@angular/router';
import { passwordMatchValidator } from '../../../../core/validators/password-match.validator';

@Component({
  selector: 'app-change-password-forced',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    B2bButtonComponent,
    B2bNotificationInlineComponent,
    B2bPasswordFieldComponent,
  ],
  templateUrl: './change-password-forced.page.html',
  styleUrl: './change-password-forced.page.scss',
})
export class ChangePasswordForcedPage {
  private fb = inject(FormBuilder);
  private authService = inject(AuthenticationService);
  private router = inject(Router);

  form: FormGroup = this.fb.group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(10)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordMatchValidator }
  );
  
  errorMessage: string | null = null;

  changePassword() {
    if (this.form.valid) {
      this.errorMessage = null;
      const changePasswordForcedRequest: ChangePasswordForcedRequest = {
        new_password: this.form.value.newPassword,
      };
      this.authService
        .changePasswordForced(changePasswordForcedRequest)
        .subscribe({
          next: () => {
            this.router.navigate(['/inicio']);
          },
          error: (error) => {
            this.errorMessage = 'Ha ocurrido un error al cambiar la contraseña. Por favor, inténtelo de nuevo.';
            console.error('Change password failed', error);
          },
        });
    }
  }

  goBack() {
    this.router.navigate(['/acceso']);
  }
}
