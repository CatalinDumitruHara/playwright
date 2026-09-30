import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangePasswordForcedPage } from './change-password-forced.page';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthenticationService } from '../../../../core/auth/authentication.service';
import { CommonModule } from '@angular/common';
import {
  B2bButtonComponent,
  B2bNotificationInlineComponent,
  B2bPasswordFieldComponent,
} from '@mapfre-tech/b2b-components';

describe('ChangePasswordForcedPage', () => {
  let component: ChangePasswordForcedPage;
  let fixture: ComponentFixture<ChangePasswordForcedPage>;
  let authService: AuthenticationService;
  let router: Router;

  const authServiceMock = {
    changePasswordForced: jest.fn(),
  };

  const routerMock = {
    navigate: jest.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        ReactiveFormsModule,
        B2bButtonComponent,
        B2bNotificationInlineComponent,
        B2bPasswordFieldComponent,
        ChangePasswordForcedPage,
      ],
      providers: [
        { provide: AuthenticationService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChangePasswordForcedPage);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthenticationService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have an invalid form if passwords do not match', () => {
    component.form.setValue({
      newPassword: 'password123',
      confirmPassword: 'password456',
    });
    expect(component.form.valid).toBeFalsy();
  });

  it('should have a valid form if passwords match', () => {
    component.form.setValue({
      newPassword: 'password123',
      confirmPassword: 'password123',
    });
    expect(component.form.valid).toBeTruthy();
  });

  it('should call changePassword method on submit', () => {
    authServiceMock.changePasswordForced.mockReturnValue(of({}));
    jest.spyOn(component, 'changePassword');
    component.form.setValue({
      newPassword: 'password123',
      confirmPassword: 'password123',
    });
    component.changePassword();
    expect(component.changePassword).toHaveBeenCalled();
  });

  it('should navigate to home page on successful password change', () => {
    authServiceMock.changePasswordForced.mockReturnValue(of({}));
    component.form.setValue({
      newPassword: 'password123',
      confirmPassword: 'password123',
    });
    component.changePassword();
    expect(router.navigate).toHaveBeenCalledWith(['/inicio']);
  });

  it('should show an error message on failed password change', () => {
    authServiceMock.changePasswordForced.mockReturnValue(
      throwError(() => new Error('error'))
    );
    component.form.setValue({
      newPassword: 'password123',
      confirmPassword: 'password123',
    });
    component.changePassword();
    expect(component.errorMessage).not.toBeNull();
  });
});
