import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AccountLockedPage } from './account-locked.page';
import { AuthenticationService } from '../../../../core/auth/authentication.service';

const NOW = new Date('2026-10-01T10:00:00');
const LOCKED_UNTIL = '2026-10-01T10:15:00';

describe('AccountLockedPage', () => {
  let fixture: ComponentFixture<AccountLockedPage>;
  let component: AccountLockedPage;
  let router: Router;
  let authService: { login: jest.Mock };

  const httpError = (status: number, error: unknown = null) =>
    throwError(() => new HttpErrorResponse({ status, error }));

  async function setup(state: Record<string, unknown> | null): Promise<void> {
    history.replaceState(state, '');
    authService = { login: jest.fn() };
    await TestBed.configureTestingModule({
      imports: [AccountLockedPage],
      providers: [provideRouter([]), { provide: AuthenticationService, useValue: authService }],
    }).compileComponents();
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(AccountLockedPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  /** Bloqueo ya vencido: el formulario queda habilitado y relleno. */
  async function setupUnlocked(): Promise<void> {
    await setup({ lockedUntil: '2026-10-01T09:00:00', username: 'ana@mapfre.com' });
    component.form.controls['password'].setValue('Clave1');
  }

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
  });

  afterEach(() => {
    fixture?.destroy();
    jest.useRealTimers();
    history.replaceState(null, '');
  });

  it('crea el componente', async () => {
    await setup(null);
    expect(component).toBeTruthy();
  });

  it('[AC] muestra el aviso de cuenta bloqueada temporalmente y la fecha/hora de fin de bloqueo del state', async () => {
    await setup({ lockedUntil: LOCKED_UNTIL, username: 'ana@mapfre.com' });
    expect(component.lockedUntil).toBe(LOCKED_UNTIL);
    const notice = fixture.debugElement.query(By.css('[data-testid="lock-notice"]'));
    expect(notice).toBeTruthy();
    expect(notice.componentInstance.title).toBe('Cuenta bloqueada temporalmente');
    const lockEnd = fixture.nativeElement.querySelector('[data-testid="lock-end"]') as HTMLElement;
    expect(lockEnd).toBeTruthy();
    expect(lockEnd.textContent).toContain('Fin del bloqueo temporal');
    expect(lockEnd.textContent).toContain('01/10/2026 10:15');
  });

  it('[AC] con el bloqueo vigente no permite reintentar (formulario deshabilitado, sin llamada a login)', async () => {
    await setup({ lockedUntil: LOCKED_UNTIL, username: 'ana@mapfre.com' });
    expect(component.isLocked).toBe(true);
    expect(component.form.disabled).toBe(true);
    component.onSubmit();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('[AC][EP-001] vencido el bloqueo (contador) se rehabilita y el reintento llama a authService.login', async () => {
    await setup({ lockedUntil: LOCKED_UNTIL, username: '  ana@mapfre.com  ' });
    expect(component.form.disabled).toBe(true);

    jest.advanceTimersByTime(15 * 60 * 1000 + 1000);
    expect(component.isLocked).toBe(false);
    expect(component.form.enabled).toBe(true);

    authService.login.mockReturnValue(of({ must_change_password: false }));
    component.form.controls['password'].setValue('Clave1');
    component.onSubmit();
    expect(authService.login).toHaveBeenCalledWith({ username: 'ana@mapfre.com', password: 'Clave1' });
    expect(router.navigate).toHaveBeenCalledWith(['/inicio']);
  });

  it('[EP-001] éxito con must_change_password navega al cambio obligatorio de contraseña', async () => {
    await setupUnlocked();
    authService.login.mockReturnValue(of({ must_change_password: true }));
    component.onSubmit();
    expect(router.navigate).toHaveBeenCalledWith(['/acceso/cambio-obligatorio-contrasena']);
  });

  it('[ERR] formulario vacío, 400, 401 y error genérico muestran el mensaje correspondiente', async () => {
    await setup({ lockedUntil: null });
    component.onSubmit();
    expect(authService.login).not.toHaveBeenCalled();
    expect(component.errorMessage).toBe('Introduce usuario y contraseña');

    component.form.setValue({ username: 'ana@mapfre.com', password: 'Clave1' });
    const cases: Array<[number, string]> = [
      [400, 'Introduce usuario y contraseña'],
      [401, 'Usuario o contraseña incorrectos'],
      [500, 'No ha sido posible iniciar sesión, inténtelo de nuevo'],
    ];
    for (const [status, msg] of cases) {
      authService.login.mockReturnValue(httpError(status));
      component.onSubmit();
      expect(component.errorMessage).toBe(msg);
      expect(component.submitting).toBe(false);
    }
  });

  it('[ERR] 423 vuelve a bloquear con el nuevo locked_until y 410 navega a credencial caducada', async () => {
    await setupUnlocked();
    authService.login.mockReturnValue(httpError(423, { locked_until: '2026-10-01T10:30:00' }));
    component.onSubmit();
    expect(component.lockedUntil).toBe('2026-10-01T10:30:00');
    expect(component.isLocked).toBe(true);
    expect(component.form.disabled).toBe(true);
    expect(component.form.getRawValue().password).toBe('');

    jest.advanceTimersByTime(30 * 60 * 1000 + 1000);
    expect(component.form.enabled).toBe(true);
    component.form.controls['password'].setValue('Clave1');
    authService.login.mockReturnValue(httpError(410, { expires_at: '2026-09-30T08:00:00' }));
    component.onSubmit();
    expect(router.navigate).toHaveBeenCalledWith(['/acceso/credencial-caducada'], {
      state: { expirationDate: '2026-09-30T08:00:00' },
    });
  });
});
