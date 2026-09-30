import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import {
  B2bButtonComponent,
  B2bContainerComponent,
  B2bInputComponent,
  B2bLabelComponent,
  B2bNotificationInlineComponent,
  B2bPasswordFieldComponent,
  B2bReadDataComponent,
} from '@mapfre-tech/b2b-components';
import { SessionDetail } from '@api-types';
import { AuthenticationService } from '../../../../core/auth/authentication.service';

const MSG_REQUIRED = 'Introduce usuario y contraseña';
const MSG_INVALID_CREDENTIALS = 'Usuario o contraseña incorrectos';
const MSG_GENERIC = 'No ha sido posible iniciar sesión, inténtelo de nuevo';

interface AccountLockedNavigationState {
  lockedUntil?: string | null;
  username?: string | null;
}

@Component({
  selector: 'app-account-locked',
  templateUrl: './account-locked.page.html',
  styleUrls: ['./account-locked.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    B2bButtonComponent,
    B2bContainerComponent,
    B2bInputComponent,
    B2bLabelComponent,
    B2bNotificationInlineComponent,
    B2bPasswordFieldComponent,
    B2bReadDataComponent,
  ],
})
export class AccountLockedPage implements OnDestroy {
  lockedUntil: string | null = null;
  username = '';
  form: FormGroup;
  errorMessage: string | null = null;
  submitting = false;

  private unlockTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthenticationService,
    private router: Router
  ) {
    const navState = this.router.getCurrentNavigation()?.extras.state as AccountLockedNavigationState | undefined;
    const historyState =
      typeof history !== 'undefined' ? (history.state as AccountLockedNavigationState | null) : null;
    const state: AccountLockedNavigationState = navState ?? historyState ?? {};

    this.lockedUntil = state.lockedUntil ?? null;
    this.username = state.username ?? '';

    this.form = this.fb.group({
      username: [this.username, [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      password: ['', Validators.required],
    });

    this.syncLockState();
  }

  get isLocked(): boolean {
    if (!this.lockedUntil) {
      return false;
    }
    const end = new Date(this.lockedUntil).getTime();
    return !Number.isNaN(end) && end > Date.now();
  }

  ngOnDestroy(): void {
    this.clearUnlockTimer();
  }

  onSubmit(): void {
    if (this.submitting || this.isLocked) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = MSG_REQUIRED;
      return;
    }

    const username = String(this.form.value.username ?? '').trim();
    const password = this.form.value.password as string;

    this.errorMessage = null;
    this.submitting = true;

    this.authService.login({ username, password }).subscribe({
      next: (session: SessionDetail) => {
        this.submitting = false;
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
            this.lockedUntil = error.error?.locked_until ?? this.lockedUntil;
            this.form.patchValue({ password: '' });
            this.syncLockState();
            break;
          case 410:
            this.router.navigate(['/acceso/credencial-caducada'], {
              state: { expirationDate: error.error?.expires_at ?? null },
            });
            break;
          default:
            this.errorMessage = MSG_GENERIC;
        }
      },
    });
  }

  /** Deshabilita el formulario mientras dure el bloqueo y lo rehabilita al vencer. */
  private syncLockState(): void {
    this.clearUnlockTimer();
    if (this.isLocked) {
      this.form.disable({ emitEvent: false });
      const remaining = new Date(this.lockedUntil as string).getTime() - Date.now();
      this.unlockTimer = setTimeout(() => this.syncLockState(), remaining + 500);
    } else {
      this.form.enable({ emitEvent: false });
    }
  }

  private clearUnlockTimer(): void {
    if (this.unlockTimer) {
      clearTimeout(this.unlockTimer);
      this.unlockTimer = null;
    }
  }
}
