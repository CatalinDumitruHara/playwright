import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthenticationService } from '../../core/auth/authentication.service';
import { CurrentUser, ROLE_LABELS } from '../../core/auth/session.model';
import { MainLayoutComponent } from './main-layout.component';

@Component({ selector: 'app-dummy', template: '', standalone: true })
class DummyComponent {}

const USER: CurrentUser = {
  userId: 'u-1',
  fullName: 'Ana Pérez García',
  email: 'ana@example.com',
  roleCode: 'ROL-002',
  roleLabel: ROLE_LABELS['ROL-002'],
  mustChangePassword: false,
};

describe('MainLayoutComponent', () => {
  let fixture: ComponentFixture<MainLayoutComponent>;
  let el: HTMLElement;
  let currentUser: WritableSignal<CurrentUser | null>;
  let auth: { currentUser: WritableSignal<CurrentUser | null>; logout: jest.Mock };
  let navigateSpy: jest.SpyInstance;

  beforeEach(() => {
    currentUser = signal<CurrentUser | null>(USER);
    auth = { currentUser, logout: jest.fn() };
    TestBed.configureTestingModule({
      imports: [MainLayoutComponent],
      providers: [
        provideRouter([{ path: 'acceso/sesion-finalizada', component: DummyComponent }]),
        { provide: AuthenticationService, useValue: auth },
      ],
    });
    navigateSpy = jest.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(MainLayoutComponent);
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  const q = (id: string) => el.querySelector(`[data-testid="${id}"]`) as HTMLElement | null;

  it('pinta el nombre completo y la etiqueta de rol del usuario', () => {
    expect(q('header-user-name')?.textContent?.trim()).toBe('Ana Pérez García');
    expect(q('header-user-role')?.textContent?.trim()).toBe('Técnico de mantenimiento');
  });

  it('sin usuario no pinta nombre ni rol', () => {
    currentUser.set(null);
    fixture.detectChanges();
    expect(q('header-user-name')).toBeNull();
    expect(q('header-user-role')).toBeNull();
  });

  it('muestra el botón Cerrar sesión', () => {
    expect(q('logout-button')?.textContent?.trim()).toBe('Cerrar sesión');
  });

  it('al cerrar sesión con éxito llama a logout y navega a sesion-finalizada con reason logout', () => {
    auth.logout.mockReturnValue(of(undefined));
    q('logout-button')!.click();
    fixture.detectChanges();

    expect(auth.logout).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledWith(
      ['/acceso/sesion-finalizada'],
      expect.objectContaining({ state: expect.objectContaining({ reason: 'logout' }) })
    );
    expect(q('logout-error')).toBeNull();
  });

  it('si logout falla (500) muestra el error y no navega', () => {
    auth.logout.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    q('logout-button')!.click();
    fixture.detectChanges();

    expect(auth.logout).toHaveBeenCalledTimes(1);
    expect(q('logout-error')).not.toBeNull();
    expect(navigateSpy).not.toHaveBeenCalled();
    expect((q('logout-button') as HTMLButtonElement).disabled).toBe(false);
  });

  it('contiene app-nav-menu y router-outlet', () => {
    expect(el.querySelector('app-nav-menu')).not.toBeNull();
    expect(el.querySelector('router-outlet')).not.toBeNull();
  });
});
