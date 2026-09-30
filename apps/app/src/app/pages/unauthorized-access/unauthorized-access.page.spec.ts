import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { UnauthorizedAccessPage } from './unauthorized-access.page';
import { AuthenticationService } from '../../core/auth/authentication.service';
import { CurrentUser } from '../../core/auth/session.model';

const EMPLOYEE: CurrentUser = {
  userId: 'u-1',
  fullName: 'Ana García López',
  email: 'ana@example.com',
  roleCode: 'ROL-001',
  roleLabel: 'Empleado',
  mustChangePassword: false,
};

function setup(query: Record<string, string> = {}): {
  fixture: ComponentFixture<UnauthorizedAccessPage>;
  navigate: jest.SpyInstance;
} {
  TestBed.configureTestingModule({
    imports: [UnauthorizedAccessPage],
    providers: [
      provideRouter([]),
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { queryParamMap: convertToParamMap(query) } },
      },
      {
        provide: AuthenticationService,
        useValue: { currentUser: signal<CurrentUser | null>(EMPLOYEE) },
      },
    ],
  });
  const navigate = jest.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  const fixture = TestBed.createComponent(UnauthorizedAccessPage);
  fixture.detectChanges();
  return { fixture, navigate };
}

function q(fixture: ComponentFixture<UnauthorizedAccessPage>, sel: string): HTMLElement | null {
  return (fixture.nativeElement as HTMLElement).querySelector(sel);
}

describe('UnauthorizedAccessPage (ARC-092)', () => {
  it('ARC-092: muestra el mensaje de acceso no autorizado', () => {
    const { fixture } = setup({ ruta: '/admin' });
    expect(q(fixture, '[data-testid="unauthorized-message"]')).not.toBeNull();
  });

  it('ARC-092: muestra la ruta solicitada interna (/admin)', () => {
    const { fixture } = setup({ ruta: '/admin' });
    expect(q(fixture, '[data-testid="requested-path"]')?.textContent?.trim()).toBe('/admin');
  });

  it('ARC-092 (error): ruta externa se sustituye por "—"', () => {
    const { fixture } = setup({ ruta: '//evil.com' });
    expect(q(fixture, '[data-testid="requested-path"]')?.textContent?.trim()).toBe('—');
  });

  it('ARC-092: muestra el rol vigente del usuario', () => {
    const { fixture } = setup({ ruta: '/admin' });
    expect(q(fixture, '[data-testid="current-role"]')?.textContent?.trim()).toBe('Empleado');
  });

  it('ARC-092: el botón volver navega a /inicio', () => {
    const { fixture, navigate } = setup({ ruta: '/admin' });
    q(fixture, '[data-testid="back-home"]')?.click();
    expect(navigate).toHaveBeenCalledWith(['/inicio']);
  });
});
