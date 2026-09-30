import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomePage } from './home.page';
import { AuthenticationService } from '../../../../core/auth/authentication.service';
import { CurrentUser, RoleCode } from '../../../../core/auth/session.model';
import { NAV_ITEMS, NavItem } from '../../../../core/navigation/navigation.model';

const ALL: readonly RoleCode[] = ['ROL-001', 'ROL-002', 'ROL-003'];

const TEST_NAV: readonly NavItem[] = [
  { label: 'Inicio', path: '/inicio', roles: ALL, shortcut: false },
  { label: 'Mi perfil', path: '/mi-perfil', roles: ALL, shortcut: true },
  { label: 'Bandeja', path: '/bandeja', roles: ['ROL-002'], shortcut: true },
];

function user(roleCode: RoleCode, roleLabel: string): CurrentUser {
  return {
    userId: 'u-1',
    fullName: 'Ana García López',
    email: 'ana@example.com',
    roleCode,
    roleLabel,
    mustChangePassword: false,
  };
}

function setup(
  current: CurrentUser | null,
  nav: readonly NavItem[] = TEST_NAV
): ComponentFixture<HomePage> {
  TestBed.configureTestingModule({
    imports: [HomePage],
    providers: [
      provideRouter([]),
      { provide: NAV_ITEMS, useValue: nav },
      {
        provide: AuthenticationService,
        useValue: { currentUser: signal<CurrentUser | null>(current) },
      },
    ],
  });
  const fixture = TestBed.createComponent(HomePage);
  fixture.detectChanges();
  return fixture;
}

function q(fixture: ComponentFixture<HomePage>, sel: string): HTMLElement | null {
  return (fixture.nativeElement as HTMLElement).querySelector(sel);
}

describe('HomePage (ARC-069 /inicio)', () => {
  it('ARC-069: muestra nombre y apellidos y rol vigente del usuario', () => {
    const fixture = setup(user('ROL-001', 'Empleado'));
    expect(q(fixture, '[data-testid="home-user-name"]')?.textContent?.trim()).toBe(
      'Ana García López'
    );
    expect(q(fixture, '[data-testid="home-user-role"]')?.textContent?.trim()).toBe(
      'Empleado'
    );
  });

  it('ARC-069: ROL-001 solo ve el acceso directo /mi-perfil (no /bandeja ni Inicio)', () => {
    const fixture = setup(user('ROL-001', 'Empleado'));
    const perfil = q(fixture, '[data-testid="shortcut-/mi-perfil"]');
    expect(perfil).not.toBeNull();
    expect(perfil?.getAttribute('href')).toBe('/mi-perfil');
    expect(q(fixture, '[data-testid="shortcut-/bandeja"]')).toBeNull();
    expect(q(fixture, '[data-testid="shortcut-/inicio"]')).toBeNull();
    expect(q(fixture, '[data-testid="home-no-shortcuts"]')).toBeNull();
  });

  it('ARC-069: ROL-002 ve los accesos /mi-perfil y /bandeja', () => {
    const fixture = setup(user('ROL-002', 'Técnico de mantenimiento'));
    expect(q(fixture, '[data-testid="shortcut-/mi-perfil"]')).not.toBeNull();
    const bandeja = q(fixture, '[data-testid="shortcut-/bandeja"]');
    expect(bandeja).not.toBeNull();
    expect(bandeja?.getAttribute('href')).toBe('/bandeja');
    expect(q(fixture, '[data-testid="home-no-shortcuts"]')).toBeNull();
  });

  it('ARC-069: sin accesos directos para el rol muestra aviso home-no-shortcuts', () => {
    const onlyTech: readonly NavItem[] = [
      { label: 'Inicio', path: '/inicio', roles: ALL, shortcut: false },
      { label: 'Bandeja', path: '/bandeja', roles: ['ROL-002'], shortcut: true },
    ];
    const fixture = setup(user('ROL-001', 'Empleado'), onlyTech);
    expect(q(fixture, '[data-testid="home-no-shortcuts"]')).not.toBeNull();
    expect(q(fixture, '[data-testid^="shortcut-"]')).toBeNull();
  });
});
