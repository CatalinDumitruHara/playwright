import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ChangePasswordPage } from './change-password.page';
import { AuthenticationService } from '../../../../core/auth/authentication.service';

describe('ChangePasswordPage', () => {
  let component: ChangePasswordPage;
  let fixture: ComponentFixture<ChangePasswordPage>;
  let authService: jest.Mocked<AuthenticationService>;
  let router: jest.Mocked<Router>;

  beforeEach(async () => {
    const authServiceMock = {
      changePassword: jest.fn(),
    };
    const routerMock = {
      navigate: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, ChangePasswordPage],
      providers: [
        { provide: AuthenticationService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChangePasswordPage);
    component = fixture.componentInstance;
    authService = TestBed.inject(
      AuthenticationService
    ) as jest.Mocked<AuthenticationService>;
    router = TestBed.inject(Router) as jest.Mocked<Router>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to confirmation on successful password change', () => {
    authService.changePassword.mockReturnValue(of(undefined));
    component.changePasswordForm.setValue({
      currentPassword: 'oldPassword',
      newPassword: 'newPassword',
      confirmPassword: 'newPassword',
    });
    component.onSubmit();
    expect(router.navigate).toHaveBeenCalledWith([
      '/mi-perfil/contrasena/confirmacion',
    ]);
  });

  it('should not navigate on failed password change', () => {
    authService.changePassword.mockReturnValue(throwError(() => ({ status: 500 })));
    component.changePasswordForm.setValue({
      currentPassword: 'oldPassword',
      newPassword: 'newPassword',
      confirmPassword: 'newPassword',
    });
    component.onSubmit();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
