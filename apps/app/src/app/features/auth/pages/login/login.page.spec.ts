import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginPage } from './login.page';
import { AuthenticationService } from '../../../../core/auth/authentication.service';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let authService: { login: jest.Mock };
  let router: Router;
  let navigateSpy: jest.SpyInstance;

  const fillValid = () => {
    component.loginForm.controls['username'].setValue('  ana@mapfre.com  ');
    component.loginForm.controls['password'].setValue(' Clave1 ');
  };

  const submit = () => {
    component.onSubmit();
    fixture.detectChanges();
  };

  const httpError = (status: number, error: unknown = null) =>
    throwError(() => new HttpErrorResponse({ status, error }));

  beforeEach(async () => {
    authService = { login: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [provideRouter([]), { provide: AuthenticationService, useValue: authService }],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
  });

  it('CA1: crea el componente', () => {
    expect(component).toBeTruthy();
  });

  it('CA1/CA2: renderiza el formulario y el aviso de error dentro de b2b-container', () => {
    submit();
    const form = fixture.debugElement.query(By.css('[data-testid="login-form"]'));
    const notification = fixture.debugElement.query(By.css('[data-testid="login-error"]'));
    expect(form).not.toBeNull();
    expect(notification).not.toBeNull();
    expect(notification.componentInstance.title).toBe('Introduce usuario y contraseña');
  });

  it('CA2: formulario vacío no llama a login y muestra "Introduce usuario y contraseña"', () => {
    submit();
    expect(authService.login).not.toHaveBeenCalled();
    expect(component.errorMessage).toBe('Introduce usuario y contraseña');
  });

  it('CA3: envío válido llama a login con username recortado y password sin recortar', () => {
    authService.login.mockReturnValue(of({ must_change_password: false }));
    fillValid();
    submit();
    expect(authService.login).toHaveBeenCalledWith({ username: 'ana@mapfre.com', password: ' Clave1 ' });
  });

  it('CA4: éxito sin must_change_password navega a /inicio', () => {
    authService.login.mockReturnValue(of({ must_change_password: false }));
    fillValid();
    submit();
    expect(navigateSpy).toHaveBeenCalledWith(['/inicio']);
  });

  it('CA4: éxito con must_change_password navega a cambio obligatorio de contraseña', () => {
    authService.login.mockReturnValue(of({ must_change_password: true }));
    fillValid();
    submit();
    expect(navigateSpy).toHaveBeenCalledWith(['/acceso/cambio-obligatorio-contrasena']);
  });

  it('CA5: error 401 muestra "Usuario o contraseña incorrectos"', () => {
    authService.login.mockReturnValue(httpError(401));
    fillValid();
    submit();
    expect(component.errorMessage).toBe('Usuario o contraseña incorrectos');
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('CA5: error 500 muestra mensaje genérico', () => {
    authService.login.mockReturnValue(httpError(500));
    fillValid();
    submit();
    expect(component.errorMessage).toBe('No ha sido posible iniciar sesión, inténtelo de nuevo');
  });

  it('CA6: error 423 navega a cuenta bloqueada y 410 a credencial caducada', () => {
    authService.login.mockReturnValue(httpError(423, { locked_until: '2026-10-01T10:00:00Z' }));
    fillValid();
    submit();
    expect(navigateSpy).toHaveBeenCalledWith(['/acceso/cuenta-bloqueada'], {
      state: { lockedUntil: '2026-10-01T10:00:00Z', username: 'ana@mapfre.com' },
    });

    authService.login.mockReturnValue(httpError(410, { expires_at: '2026-09-01' }));
    submit();
    expect(navigateSpy).toHaveBeenCalledWith(['/acceso/credencial-caducada'], {
      state: { expirationDate: '2026-09-01' },
    });
  });
});
