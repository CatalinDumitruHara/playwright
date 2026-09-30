import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { B2bSidebarItemComponent } from '@mapfre-tech/b2b-components';
import { AuthenticationService } from '../../core/auth/authentication.service';
import { CurrentUser, RoleCode, ROLE_LABELS } from '../../core/auth/session.model';
import { NAV_ITEMS, NavItem } from '../../core/navigation/navigation.model';
import { NavMenuComponent } from './nav-menu.component';

const TEST_ITEMS: NavItem[] = [
  { label: 'Inicio', path: '/inicio', roles: ['ROL-001', 'ROL-002', 'ROL-003'], shortcut: false },
  { label: 'Bandeja', path: '/bandeja', roles: ['ROL-002'], shortcut: false },
];

function user(roleCode: RoleCode): CurrentUser {
  return {
    userId: 'u-1',
    fullName: 'Ana Pérez',
    email: 'ana@example.com',
    roleCode,
    roleLabel: ROLE_LABELS[roleCode],
    mustChangePassword: false,
  };
}

describe('NavMenuComponent', () => {
  let fixture: ComponentFixture<NavMenuComponent>;
  let currentUser: WritableSignal<CurrentUser | null>;

  function setup(initial: CurrentUser | null): void {
    currentUser = signal<CurrentUser | null>(initial);
    TestBed.configureTestingModule({
      imports: [NavMenuComponent],
      providers: [
        provideRouter([]),
        { provide: NAV_ITEMS, useValue: TEST_ITEMS },
        { provide: AuthenticationService, useValue: { currentUser, logout: jest.fn() } },
      ],
    });
    fixture = TestBed.createComponent(NavMenuComponent);
    fixture.detectChanges();
  }

  function items(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('b2b-sidebar-item'));
  }

  function titles(): string[] {
    return fixture.debugElement
      .queryAll(By.directive(B2bSidebarItemComponent))
      .map((d) => (d.componentInstance as B2bSidebarItemComponent).title);
  }

  it('AC-PERM-04: usuario ROL-001 solo ve Inicio', () => {
    setup(user('ROL-001'));
    const els = items();
    expect(els).toHaveLength(1);
    expect(titles()).toEqual(['Inicio']);
    expect(els[0].getAttribute('data-testid')).toBe('nav-/inicio');
  });

  it('usuario ROL-002 ve Inicio y Bandeja', () => {
    setup(user('ROL-002'));
    const els = items();
    expect(els).toHaveLength(2);
    expect(els.map((e) => e.getAttribute('data-testid'))).toEqual(['nav-/inicio', 'nav-/bandeja']);
    expect(titles()).toEqual(['Inicio', 'Bandeja']);
  });

  it('sin usuario no pinta entradas', () => {
    setup(null);
    expect(items()).toHaveLength(0);
  });

  it('recalcula el menú si cambia el usuario', () => {
    setup(null);
    currentUser.set(user('ROL-002'));
    fixture.detectChanges();
    expect(items()).toHaveLength(2);
  });

  it('al emitir clicked navega con navigateByUrl al path', () => {
    setup(user('ROL-002'));
    const router = TestBed.inject(Router);
    const spy = jest.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const des = fixture.debugElement.queryAll(By.directive(B2bSidebarItemComponent));
    const bandeja = des.find((d) => d.nativeElement.getAttribute('data-testid') === 'nav-/bandeja');
    expect(bandeja).toBeDefined();
    (bandeja!.componentInstance as B2bSidebarItemComponent).clicked.emit();
    expect(spy).toHaveBeenCalledWith('/bandeja');
  });

  it('al hacer click en la entrada navega con navigateByUrl al path', () => {
    setup(user('ROL-001'));
    const router = TestBed.inject(Router);
    const spy = jest.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const container = fixture.nativeElement.querySelector(
      '[data-testid="nav-/inicio"] .b2b-sidebar-item__container'
    ) as HTMLElement;
    expect(container).not.toBeNull();
    container.click();
    expect(spy).toHaveBeenCalledWith('/inicio');
  });
});
