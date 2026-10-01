import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import {
  B2bButtonComponent,
  B2bContainerComponent,
  B2bInputComponent,
  B2bLabelComponent,
  B2bNotificationInlineComponent,
  B2bPasswordFieldComponent,
} from '@mapfre-tech/b2b-components';
import { SessionDetail } from '@api-types';
import { AuthenticationService } from '../../../../core/auth/authentication.service';

const MSG_REQUIRED = 'Introduce usuario y contraseña';
const MSG_INVALID_CREDENTIALS = 'Usuario o contraseña incorrectos';
const MSG_GENERIC = 'No ha sido posible iniciar sesión, inténtelo de nuevo';

@Component({
  selector: 'app-login-page',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    B2bButtonComponent,
    B2bContainerComponent,
    B2bInputComponent,
    B2bLabelComponent,
    B2bNotificationInlineComponent,
    B2bPasswordFieldComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  loginForm: FormGroup;
  errorMessage: string | null = null;
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthenticationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      password: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.submitting) {
      return;
    }
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.errorMessage = MSG_REQUIRED;
      this.cdr.markForCheck();
      return;
    }

    const username = String(this.loginForm.value.username ?? '').trim();
    const password = this.loginForm.value.password as string;

    this.errorMessage = null;
    this.submitting = true;
    this.cdr.markForCheck();

    this.authService.login({ username, password }).subscribe({
      next: (session: SessionDetail) => {
        this.submitting = false;
        this.cdr.markForCheck();
        if (session?.must_change_password) {
          this.router.navigate(['/acceso/cambio-obligatorio-contrasena']);
        } else {
          this.router.navigate(['/inicio']);
        }
      },
      error: (error: HttpErrorResponse) => {
        this.submitting = false;
        switch (error?.status) {
          case 400:
            this.errorMessage = MSG_REQUIRED;
            break;
          case 401:
            this.errorMessage = MSG_INVALID_CREDENTIALS;
            break;
          case 423:
            this.router.navigate(['/acceso/cuenta-bloqueada'], {
              state: { lockedUntil: error.error?.locked_until ?? null, username },
            });
            break;
          case 410:
            this.router.navigate(['/acceso/credencial-caducada'], {
              state: { expirationDate: error.error?.expires_at ?? null },
            });
            break;
          default:
            this.errorMessage = MSG_GENERIC;
        }
        this.cdr.markForCheck();
      },
    });
  }
}
