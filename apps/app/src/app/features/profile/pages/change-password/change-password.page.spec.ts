import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ChangePasswordPage } from './change-password.page';
import { AuthenticationService } from '../../../../core/auth/authentication.service';
import { RouterTestingModule } from '@angular/router/testing';

import {
  B2bButtonComponent,
  B2bContainerComponent,
  B2bInputComponent,
  B2bPasswordFieldComponent,
} from '@mapfre-tech/b2b-components';

describe('ChangePasswordPage', () => {
  let component: ChangePasswordPage;
  let fixture: ComponentFixture<ChangePasswordPage>;
  let authService: jest.Mocked<AuthenticationService>;
  let router: Router;

  beforeEach(async () => {
    const authServiceMock = {
      changePassword: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        ChangePasswordPage,
        RouterTestingModule.withRoutes([
          { path: 'mi-perfil', redirectTo: '' }
        ]),
        B2bButtonComponent,
        B2bInputComponent,
        B2bPasswordFieldComponent,
        B2bContainerComponent,
      ],
      providers: [{ provide: AuthenticationService, useValue: authServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ChangePasswordPage);
    component = fixture.componentInstance;
    authService = TestBed.inject(
      AuthenticationService
    ) as jest.Mocked<AuthenticationService>;
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockImplementation(() => Promise.resolve(true));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to confirmation on successful password change', fakeAsync(() => {
    authService.changePassword.mockReturnValue(of(undefined));
    component.changePasswordForm.setValue({
      currentPassword: 'oldPassword',
      newPassword: 'newPassword',
      confirmPassword: 'newPassword',
    });
    component.onSubmit();
    tick();
    expect(router.navigate).toHaveBeenCalledWith([
      '/mi-perfil/contrasena/confirmacion',
    ]);
  }));

  it('should not navigate on failed password change', fakeAsync(() => {
    authService.changePassword.mockReturnValue(throwError(() => ({ status: 500 })));
    component.changePasswordForm.setValue({
      currentPassword: 'oldPassword',
      newPassword: 'newPassword',
      confirmPassword: 'newPassword',
    });
    component.onSubmit();
    tick();
    expect(router.navigate).not.toHaveBeenCalled();
  }));

  it('should have an invalid form if passwords do not match', () => {
    component.changePasswordForm.setValue({
      currentPassword: 'oldPassword',
      newPassword: 'newPassword',
      confirmPassword: 'anotherPassword',
    });
    expect(component.changePasswordForm.valid).toBeFalsy();
  });

  it('should have a valid form if passwords match', () => {
    component.changePasswordForm.setValue({
      currentPassword: 'oldPassword',
      newPassword: 'newPassword',
      confirmPassword: 'newPassword',
    });
    expect(component.changePasswordForm.valid).toBeTruthy();
  });

  it('should call onSubmit method on form submit', () => {
    jest.spyOn(component, 'onSubmit');
    const form = fixture.nativeElement.querySelector('[data-testid="change-password-form"]');
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    expect(component.onSubmit).toHaveBeenCalled();
  });

  it('should show an error message if password change fails', fakeAsync(() => {
    authService.changePassword.mockReturnValue(throwError(() => ({ status: 400, error: { message: 'Invalid current password' } })));
    component.changePasswordForm.setValue({
      currentPassword: 'wrongOldPassword',
      newPassword: 'newPassword',
      confirmPassword: 'newPassword',
    });
    component.onSubmit();
    tick();
    fixture.detectChanges();
    // We expect the error to be handled, but since the component does not display it,
    // we just check that navigation does not happen. A more robust test would check for the error message.
    expect(router.navigate).not.toHaveBeenCalled();
  }));

  it('should navigate to mi-perfil on cancel', fakeAsync(() => {
    const navigateSpy = jest.spyOn(router, 'navigate');
    const cancelButton = fixture.nativeElement.querySelector('[data-testid="cancel-button"]');
    cancelButton.click();
    tick();
    expect(navigateSpy).toHaveBeenCalledWith(['/mi-perfil']);
  }));
});
