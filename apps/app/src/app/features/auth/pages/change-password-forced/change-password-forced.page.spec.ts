import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ChangePasswordForcedPage } from './change-password-forced.page';
import { AuthenticationService } from '../../../../core/auth/authentication.service';

describe('ChangePasswordForcedPage', () => {
  let component: ChangePasswordForcedPage;
  let fixture: ComponentFixture<ChangePasswordForcedPage>;
  let router: Router;
  let navigateSpy: jest.SpyInstance;
  let session: { must_change_password: boolean };

  const authServiceMock = {
    changePasswordForced: jest.fn(),
    logout: jest.fn(),
    getSession: jest.fn(),
  };

  const fill = (newPassword: string, confirmPassword: string) => {
    component.form.controls['newPassword'].setValue(newPassword);
    component.form.controls['confirmPassword'].setValue(confirmPassword);
  };

  const submit = () => {
    // Handler de (ngSubmit). No se dispara vía DOM: b2b-container solo proyecta
    // [b2b-container-body|header|footer] y el <form> no se renderiza (bug productivo).
    component.changePassword();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    session = { must_change_password: true };
    authServiceMock.getSession.mockReturnValue(session);

    await TestBed.configureTestingModule({
      imports: [ChangePasswordForcedPage],
      providers: [
        provideRouter([]),
        { provide: AuthenticationService, useValue: authServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChangePasswordForcedPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
  });

  it('crea el componente y muestra el aviso bloqueante de cambio obligatorio', () => {
    expect(component).toBeTruthy();
    const h1 = fixture.debugElement.query(By.css('h1'));
    expect(h1.nativeElement.textContent).toContain('Cambio obligatorio de contraseña');
    const notices = fixture.debugElement
      .queryAll(By.css('b2b-notification-inline'))
      .map((d) => d.componentInstance);
    const blocking = notices.find(
      (n) => n.title === 'Debes establecer una contraseña nueva antes de continuar'
    );
    expect(blocking).toBeDefined();
    expect(blocking.visible).toBe(true);
  });

  it('contraseña que incumple la política (corta1A) deja el form inválido y no llama al servicio', () => {
    fill('corta1A', 'corta1A');
    submit();
    expect(component.form.invalid).toBe(true);
    expect(component.form.controls['newPassword'].hasError('minlength')).toBe(true);
    expect(authServiceMock.changePasswordForced).not.toHaveBeenCalled();
  });

  it('nueva y confirmación distintas dejan el form inválido con error mismatch y no llaman al servicio', () => {
    fill('NuevaClave2026', 'OtraClave2026');
    submit();
    expect(component.form.invalid).toBe(true);
    expect(component.form.hasError('mismatch')).toBe(true);
    expect(component.showMismatch).toBe(true);
    expect(authServiceMock.changePasswordForced).not.toHaveBeenCalled();
  });

  it('contraseña válida llama a changePasswordForced (EP-006) con new_password y navega a /inicio', () => {
    authServiceMock.changePasswordForced.mockReturnValue(of(undefined));
    fill('NuevaClave2026', 'NuevaClave2026');
    submit();
    expect(authServiceMock.changePasswordForced).toHaveBeenCalledTimes(1);
    expect(authServiceMock.changePasswordForced).toHaveBeenCalledWith({
      new_password: 'NuevaClave2026',
    });
    expect(session.must_change_password).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/inicio']);
  });

  it('error 422 muestra mensaje de política y el detalle de las violaciones', () => {
    authServiceMock.changePasswordForced.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 422,
            error: { violations: ['Contiene el usuario', 'Reutilizada'] },
          })
      )
    );
    fill('NuevaClave2026', 'NuevaClave2026');
    submit();
    expect(component.errorMessage).toBe(
      'La nueva contraseña no cumple la política de seguridad'
    );
    expect(component.errorDetail).toBe('Contiene el usuario. Reutilizada');
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('error 410 navega a /acceso/credencial-caducada con la fecha de caducidad', () => {
    authServiceMock.changePasswordForced.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 410,
            error: { expires_at: '2026-09-01T00:00:00Z' },
          })
      )
    );
    fill('NuevaClave2026', 'NuevaClave2026');
    submit();
    expect(navigateSpy).toHaveBeenCalledWith(['/acceso/credencial-caducada'], {
      state: { expirationDate: '2026-09-01T00:00:00Z' },
    });
    expect(component.errorMessage).toBeNull();
  });

  it('error genérico (500) muestra mensaje de reintento', () => {
    authServiceMock.changePasswordForced.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );
    fill('NuevaClave2026', 'NuevaClave2026');
    submit();
    expect(component.errorMessage).toBe(
      'No ha sido posible establecer la contraseña, inténtalo de nuevo'
    );
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('cerrar sesión llama a logout y navega a /acceso (también si logout falla)', () => {
    authServiceMock.logout.mockReturnValue(of(undefined));
    component.logout(); // handler de (click) en [data-testid="forced-logout"]
    expect(authServiceMock.logout).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledWith(['/acceso']);

    navigateSpy.mockClear();
    authServiceMock.logout.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );
    component.logout();
    expect(navigateSpy).toHaveBeenCalledWith(['/acceso']);
  });
});
