import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  B2bButtonComponent,
  B2bContainerComponent,
  B2bNotificationInlineComponent,
  B2bPasswordFieldComponent,
} from '@mapfre-tech/b2b-components';
import { AuthenticationService } from '../../../../core/auth/authentication.service';
import { ChangePasswordForcedRequest } from '@api-types';
import { Router } from '@angular/router';
import { passwordMatchValidator } from '../../../../core/validators/password-match.validator';

const PASSWORD_POLICY_PATTERN = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

@Component({
  selector: 'app-change-password-forced',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    B2bButtonComponent,
    B2bContainerComponent,
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
    { validators: passwordMatchValidator }
  );

  errorMessage: string | null = null;
  errorDetail: string | null = null;

  get showMismatch(): boolean {
    return !!(
      this.form.hasError('mismatch') && this.form.get('confirmPassword')?.touched
    );
  }

  changePassword(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage = null;
    this.errorDetail = null;
    const request: ChangePasswordForcedRequest = {
      new_password: this.form.value.newPassword,
    };

    this.authService.changePasswordForced(request).subscribe({
      next: () => {
        const s = this.authService.getSession();
        if (s) s.must_change_password = false;
        this.router.navigate(['/inicio']);
      },
      error: (error: HttpErrorResponse) => this.handleError(error),
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/acceso']),
      error: () => this.router.navigate(['/acceso']),
    });
  }

  private handleError(error: HttpErrorResponse): void {
    switch (error?.status) {
      case 422: {
        this.errorMessage =
          'La nueva contraseña no cumple la política de seguridad';
        const details = error.error?.violations ?? error.error?.errors;
        if (
          Array.isArray(details) &&
          details.length > 0 &&
          details.every((d: unknown) => typeof d === 'string')
        ) {
          this.errorDetail = details.join('. ');
        }
        break;
      }
      case 400:
        this.errorMessage = 'Las contraseñas no coinciden';
        break;
      case 410:
        this.router.navigate(['/acceso/credencial-caducada'], {
          state: { expirationDate: error.error?.expires_at ?? null },
        });
        break;
      case 401:
        this.router.navigate(['/acceso']);
        break;
      default:
        this.errorMessage =
          'No ha sido posible establecer la contraseña, inténtalo de nuevo';
    }
  }
}
