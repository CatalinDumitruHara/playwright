import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ChangePasswordPage } from './change-password.page';
import { AuthenticationService } from '../../../../core/auth/authentication.service';

describe('ChangePasswordPage (REQ-068)', () => {
  let component: ChangePasswordPage;
  let fixture: ComponentFixture<ChangePasswordPage>;
  let authMock: { changePassword: jest.Mock };
  let router: Router;

  const fill = (current: string, next: string, confirm: string) =>
    component.changePasswordForm.setValue({
      currentPassword: current,
      newPassword: next,
      confirmPassword: confirm,
    });

  const byTestId = (id: string) =>
    fixture.debugElement.query(By.css(`[data-testid="${id}"]`));

  beforeEach(async () => {
    authMock = { changePassword: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [ChangePasswordPage],
      providers: [
        provideRouter([]),
        { provide: AuthenticationService, useValue: authMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChangePasswordPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
  });

  it('REQ-068: crea el componente y muestra el panel de requisitos de la política', () => {
    expect(component).toBeTruthy();
    const policy = byTestId('password-policy');
    expect(policy).toBeTruthy();
    expect(policy.componentInstance.title).toBe('Requisitos de la contraseña');
  });

  it('REQ-068: con campos vacíos no llama a authService.changePassword', () => {
    component.onSubmit();
    expect(authMock.changePassword).not.toHaveBeenCalled();
    expect(component.changePasswordForm.touched).toBe(true);
  });

  it('REQ-068: nueva y confirmación distintas -> no llama y muestra error de coincidencia', () => {
    fill('Actual2025X', 'NuevaClave2026', 'OtraClave2026');
    component.onSubmit();
    fixture.detectChanges();

    expect(authMock.changePassword).not.toHaveBeenCalled();
    expect(component.changePasswordForm.errors?.['mismatch']).toBe(true);
    expect(component.showMismatch).toBe(true);
  });

  it('REQ-068: nueva igual a la actual -> no llama y muestra error', () => {
    fill('NuevaClave2026', 'NuevaClave2026', 'NuevaClave2026');
    component.onSubmit();
    fixture.detectChanges();

    expect(authMock.changePassword).not.toHaveBeenCalled();
    expect(component.changePasswordForm.errors?.['sameAsCurrent']).toBe(true);
    expect(component.showSameAsCurrent).toBe(true);
  });

  it('REQ-068: nueva que incumple la política -> no llama y muestra error de política', () => {
    fill('Actual2025X', 'sinmayusculas123', 'sinmayusculas123');
    component.onSubmit();
    fixture.detectChanges();

    expect(authMock.changePassword).not.toHaveBeenCalled();
    expect(
      component.changePasswordForm.get('newPassword')?.errors?.['pattern']
    ).toBeTruthy();
    expect(component.showPolicyError).toBe(true);
  });

  it('REQ-068 / EP-005: datos válidos -> llama changePassword con cuerpo snake_case y navega a confirmación', () => {
    authMock.changePassword.mockReturnValue(of(undefined));
    fill('Actual2025X', 'NuevaClave2026', 'NuevaClave2026');
    component.onSubmit();

    expect(authMock.changePassword).toHaveBeenCalledTimes(1);
    expect(authMock.changePassword).toHaveBeenCalledWith({
      current_password: 'Actual2025X',
      new_password: 'NuevaClave2026',
      new_password_confirmation: 'NuevaClave2026',
    });
    expect(router.navigate).toHaveBeenCalledWith(
      ['/mi-perfil/contrasena/confirmacion'],
      expect.objectContaining({
        state: expect.objectContaining({ changedAt: expect.any(String) }),
      })
    );
  });

  it('REQ-068: error 422 (contraseña actual incorrecta) -> muestra el mensaje y no navega', () => {
    authMock.changePassword.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 422, error: {} }))
    );
    fill('Actual2025X', 'NuevaClave2026', 'NuevaClave2026');
    component.onSubmit();
    fixture.detectChanges();

    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.errorMessage).toContain(
      'La contraseña actual no es correcta'
    );
  });

  it('REQ-068: error 423 -> muestra mensaje de cuenta bloqueada', () => {
    authMock.changePassword.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 423, error: {} }))
    );
    fill('Actual2025X', 'NuevaClave2026', 'NuevaClave2026');
    component.onSubmit();
    fixture.detectChanges();

    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.errorMessage).toBe(
      'Cuenta bloqueada temporalmente por intentos fallidos'
    );
    expect(component.submitting).toBe(false);
  });

  it('REQ-068: Cancelar navega a /mi-perfil', () => {
    byTestId('cancel-button').nativeElement.click();
    expect(router.navigate).toHaveBeenCalledWith(['/mi-perfil']);
    expect(authMock.changePassword).not.toHaveBeenCalled();
  });
});
