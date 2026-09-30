import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { formatDate } from '@angular/common';
import { By } from '@angular/platform-browser';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { SessionDetail } from '@api-types';
import { AuthenticationService } from '../../../../core/auth/authentication.service';
import { MyProfilePage } from './my-profile.page';

const SESSION: SessionDetail = {
  token: 'tkn',
  user: {
    name: 'Ana García López',
    email: 'ana.garcia@empresa.com',
    role: 'Gestor',
    status: 'Activa',
    password_last_updated: '2026-03-15T10:30:00',
  },
};

describe('MyProfilePage', () => {
  let fixture: ComponentFixture<MyProfilePage>;
  let component: MyProfilePage;
  let authMock: { getSession: jest.Mock; getSessionContext: jest.Mock };
  let router: Router;

  const text = (id: string): string =>
    (fixture.debugElement.query(By.css(`[data-testid="${id}"]`))?.nativeElement.textContent ?? '').trim();

  async function setup(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [MyProfilePage],
      providers: [provideRouter([]), { provide: AuthenticationService, useValue: authMock }],
    }).compileComponents();
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(MyProfilePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    authMock = { getSession: jest.fn(), getSessionContext: jest.fn() };
  });

  it('crea el componente', async () => {
    authMock.getSession.mockReturnValue(SESSION);
    await setup();
    expect(component).toBeTruthy();
  });

  it('AC: con sesión en memoria pinta nombre, correo, rol, estado y última actualización de contraseña', async () => {
    authMock.getSession.mockReturnValue(SESSION);
    await setup();
    expect(text('profile-name')).toBe('Ana García López');
    expect(text('profile-email')).toBe('ana.garcia@empresa.com');
    expect(text('profile-role')).toBe('Gestor');
    expect(text('profile-status')).toContain('Activa');
    expect(text('profile-password-updated')).toBe(
      formatDate(SESSION.user.password_last_updated, 'dd/MM/yyyy HH:mm', 'en-US'),
    );
    expect(authMock.getSessionContext).not.toHaveBeenCalled();
  });

  it('AC: sin sesión en memoria recupera el contexto (EP-003) y pinta los datos', async () => {
    authMock.getSession.mockReturnValueOnce(null).mockReturnValue(SESSION);
    authMock.getSessionContext.mockReturnValue(of(SESSION));
    await setup();
    fixture.detectChanges();
    expect(authMock.getSessionContext).toHaveBeenCalledTimes(1);
    expect(text('profile-name')).toBe('Ana García López');
  });

  it('Error: si EP-003 falla muestra aviso de error y no pinta datos', async () => {
    authMock.getSession.mockReturnValue(null);
    authMock.getSessionContext.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 401, error: {} })),
    );
    await setup();
    fixture.detectChanges();
    const err = fixture.debugElement.query(By.css('[data-testid="profile-error"]'));
    expect(err).toBeTruthy();
    expect(err.componentInstance.title).toBe('No ha sido posible cargar tus datos');
    expect(fixture.debugElement.query(By.css('[data-testid="profile-name"]'))).toBeNull();
  });

  it('AC: el botón "Cambiar contraseña" navega a /mi-perfil/contrasena', async () => {
    authMock.getSession.mockReturnValue(SESSION);
    await setup();
    const btn = fixture.debugElement.query(By.css('[data-testid="go-change-password"]'));
    expect(btn.nativeElement.textContent).toContain('Cambiar contraseña');
    btn.nativeElement.click();
    expect(router.navigate).toHaveBeenCalledWith(['/mi-perfil/contrasena']);
  });
});
