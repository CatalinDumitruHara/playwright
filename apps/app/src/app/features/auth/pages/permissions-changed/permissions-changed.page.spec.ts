import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { PermissionsChangedPage } from './permissions-changed.page';
import { AuthenticationService } from '../../../../core/auth/authentication.service';
import { CurrentUser } from '../../../../core/auth/session.model';

function setup(user: Partial<CurrentUser> | null): {
  fixture: ComponentFixture<PermissionsChangedPage>;
  navigate: jest.SpyInstance;
  getSessionContext: jest.Mock;
} {
  const getSessionContext = jest.fn().mockReturnValue(of(user));
  TestBed.configureTestingModule({
    imports: [PermissionsChangedPage],
    providers: [
      provideRouter([]),
      {
        provide: AuthenticationService,
        useValue: { currentUser: signal(user).asReadonly(), getSessionContext },
      },
    ],
  });
  const router = TestBed.inject(Router);
  const navigate = jest.spyOn(router, 'navigate').mockResolvedValue(true);
  const fixture = TestBed.createComponent(PermissionsChangedPage);
  fixture.detectChanges();
  return { fixture, navigate, getSessionContext };
}

function q(fixture: ComponentFixture<PermissionsChangedPage>, sel: string): HTMLElement | null {
  return (fixture.nativeElement as HTMLElement).querySelector(sel);
}

describe('PermissionsChangedPage', () => {
  it('pinta el rol actual del usuario', () => {
    const { fixture } = setup({ roleCode: 'ROL-003', roleLabel: 'Administrador' });
    expect(q(fixture, '[data-testid="current-role"]')?.textContent).toContain(
      'Tu rol actual es: Administrador'
    );
  });

  it('reloadMenu re-resuelve la sesión (EP-003) y navega a /inicio', () => {
    const { fixture, navigate, getSessionContext } = setup({
      roleCode: 'ROL-003',
      roleLabel: 'Administrador',
    });
    q(fixture, '[data-testid="reload-button"]')?.click();
    expect(getSessionContext).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(['/inicio']);
    expect(fixture.componentInstance.reloading()).toBe(false);
  });
});
