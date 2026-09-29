import { createRoutingFactory, Spectator } from '@ngneat/spectator/jest';
import { ChangePasswordForcedPage } from './change-password-forced.page';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../../../core/auth/authentication.service';
import { of, throwError } from 'rxjs';
import {
  B2bButtonComponent,
  B2bNotificationInlineComponent,
  B2bPasswordFieldComponent,
} from '@mapfre-tech/b2b-components';

import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('ChangePasswordForcedPage', () => {
  let spectator: Spectator<ChangePasswordForcedPage>;
  let authService: AuthenticationService;
  let router: Router;

  const createComponent = createRoutingFactory({
    component: ChangePasswordForcedPage,
    imports: [
      HttpClientTestingModule,
      ReactiveFormsModule,
      B2bButtonComponent,
      B2bNotificationInlineComponent,
      B2bPasswordFieldComponent,
    ],
    mocks: [AuthenticationService, Router],
    schemas: [NO_ERRORS_SCHEMA],
  });

  beforeEach(() => {
    spectator = createComponent();
    authService = spectator.inject(AuthenticationService);
    router = spectator.inject(Router);
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  it('should invalidate the form if passwords do not match', () => {
    spectator.component.form.setValue({
      newPassword: 'password123',
      confirmPassword: 'password456',
    });
    spectator.detectChanges();
    expect(spectator.component.form.invalid).toBe(true);
    expect(spectator.component.form.hasError('passwordMismatch')).toBe(true);
  });

  it('should invalidate the form if new password is less than 10 characters', () => {
    spectator.component.form.setValue({
      newPassword: '123',
      confirmPassword: '123',
    });
    expect(spectator.component.form.invalid).toBe(true);
    expect(spectator.component.form.get('newPassword')?.hasError('minlength')).toBe(true);
  });

  it('should call authService.changePasswordForced when form is valid and submitted', () => {
    const newPassword = 'newPassword123';
    spectator.component.form.setValue({
      newPassword: newPassword,
      confirmPassword: newPassword,
    });
    (authService.changePasswordForced as jest.Mock).mockReturnValue(of(undefined));
    spectator.component.changePassword();
    expect(authService.changePasswordForced).toHaveBeenCalledWith({
      new_password: newPassword,
    });
  });

  it('should navigate to /inicio on successful password change', () => {
    spectator.component.form.setValue({
      newPassword: 'newPassword123',
      confirmPassword: 'newPassword123',
    });
    (authService.changePasswordForced as jest.Mock).mockReturnValue(of(undefined));
    spectator.component.changePassword();
    expect(router.navigate).toHaveBeenCalledWith(['/inicio']);
  });

  it('should show an error message on failed password change', () => {
    spectator.component.form.setValue({
      newPassword: 'newPassword123',
      confirmPassword: 'newPassword123',
    });
    (authService.changePasswordForced as jest.Mock).mockReturnValue(throwError(() => new Error('Error')));
    spectator.component.changePassword();
    expect(spectator.component.errorMessage).not.toBeNull();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should validate the form if passwords match and have correct length', () => {
    spectator.component.form.setValue({
      newPassword: 'newPassword123',
      confirmPassword: 'newPassword123',
    });
    expect(spectator.component.form.valid).toBe(true);
  });

  it('should navigate to /acceso when goBack is called', () => {
    spectator.component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/acceso']);
  });
});
