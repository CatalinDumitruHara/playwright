import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  B2bButtonComponent,
  B2bPasswordFieldComponent,
  B2bContainerComponent,
  B2bNotificationInlineComponent,
} from '@mapfre-tech/b2b-components';
import { ChangePasswordRequest } from '@api-types';
import { passwordMatchValidator } from '../../../../core/validators/password-match.validator';
import { AuthenticationService } from '../../../../core/auth/authentication.service';

type PasswordChangeBody = ChangePasswordRequest & {
  new_password_confirmation: string;
};

const PASSWORD_POLICY_PATTERN = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

const differentFromCurrentValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const current = control.get('currentPassword')?.value;
  const next = control.get('newPassword')?.value;
  return current && next && current === next ? { sameAsCurrent: true } : null;
};

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    B2bButtonComponent,
    B2bPasswordFieldComponent,
    B2bContainerComponent,
    B2bNotificationInlineComponent,
  ],
  templateUrl: './change-password.page.html',
  styleUrl: './change-password.page.scss',
})
export class ChangePasswordPage {
  changePasswordForm: FormGroup;
  errorMessage: string | null = null;
  errorDetail = '';
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthenticationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.changePasswordForm = this.fb.group(
      {
        currentPassword: ['', Validators.required],
        newPassword: [
          '',
          [
            Validators.required,
            Validators.minLength(10),
            Validators.pattern(PASSWORD_POLICY_PATTERN),
          ],
        ],
        confirmPassword: ['', Validators.required],
      },
      { validators: [passwordMatchValidator, differentFromCurrentValidator] }
    );
  }

  get showMismatch(): boolean {
    const confirm = this.changePasswordForm.get('confirmPassword');
    return (
      !!this.changePasswordForm.errors?.['mismatch'] &&
      !!(confirm?.touched || confirm?.dirty)
    );
  }

  get showSameAsCurrent(): boolean {
    const next = this.changePasswordForm.get('newPassword');
    return (
      !!this.changePasswordForm.errors?.['sameAsCurrent'] &&
      !!(next?.touched || next?.dirty)
    );
  }

  get showPolicyError(): boolean {
    const next = this.changePasswordForm.get('newPassword');
    return !!next && next.invalid && next.touched;
  }

  onSubmit(): void {
    if (this.changePasswordForm.invalid) {
      this.changePasswordForm.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword, confirmPassword } =
      this.changePasswordForm.value;
    const body: PasswordChangeBody = {
      current_password: currentPassword,
      new_password: newPassword,
      new_password_confirmation: confirmPassword,
    };

    this.errorMessage = null;
    this.errorDetail = '';
    this.submitting = true;

    this.authService.changePassword(body).subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigate(['/mi-perfil/contrasena/confirmacion'], {
          state: { changedAt: new Date().toISOString() },
        });
      },
      error: (error: HttpErrorResponse) => {
        this.submitting = false;
        this.handleError(error);
        this.cdr.markForCheck();
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/mi-perfil']);
  }

  private handleError(error: HttpErrorResponse): void {
    const payload = error?.error;
    switch (error?.status) {
      case 400:
        this.errorMessage = 'Las contraseñas no coinciden';
        break;
      case 422: {
        this.errorMessage =
          typeof payload?.message === 'string'
            ? payload.message
            : 'La contraseña actual no es correcta o la nueva no cumple la política de seguridad';
        const details = payload?.violations ?? payload?.errors;
        if (
          Array.isArray(details) &&
          details.every((d: unknown) => typeof d === 'string')
        ) {
          this.errorDetail = details.join(' ');
        }
        break;
      }
      case 423:
      case 429:
        this.errorMessage =
          'Cuenta bloqueada temporalmente por intentos fallidos';
        break;
      default:
        this.errorMessage =
          'No ha sido posible cambiar la contraseña, inténtalo de nuevo';
    }
  }
}
