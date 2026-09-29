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
        RouterTestingModule.withRoutes([]),
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
});
