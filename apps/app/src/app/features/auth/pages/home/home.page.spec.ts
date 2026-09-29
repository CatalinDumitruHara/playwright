import { createRoutingFactory, Spectator } from '@ngneat/spectator/jest';
import { HomePage } from './home.page';
import { AuthenticationService } from '../../../../core/auth/authentication.service';
import { Router } from '@angular/router';
import { signal } from '@angular/core';

interface User {
  name?: string;
  role: string;
  email: string;
}

describe('HomePage', () => {
  let spectator: Spectator<HomePage>;
  const createComponent = createRoutingFactory({
    component: HomePage,
    mocks: [AuthService, Router],
  });

  beforeEach(() => {
    spectator = createComponent();
    const authService = spectator.inject(AuthService);
    // The mocked authService needs to have the `currentUser` signal property.
    (authService as any).currentUser = signal<User | null>(null);
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  describe('AC1: Muestra el nombre del usuario logado', () => {
    it('should display the user name when the user is logged in', () => {
      const authService = spectator.inject(AuthService);
      (authService as any).currentUser.set({ name: 'John Doe', role: 'user', email: 'john.doe@example.com' });
      spectator.detectChanges();
      const userNameElement = spectator.query('.user-name') as HTMLElement;
      expect(userNameElement.textContent).toContain('John Doe');
    });

    it('should display "Usuario" when the user has no name', () => {
      const authService = spectator.inject(AuthenticationService);
      (authService as any).currentUser.set({ role: 'user', email: 'john.doe@example.com' });
      spectator.detectChanges();
      const userNameElement = spectator.query('.user-name') as HTMLElement;
      expect(userNameElement.textContent).toContain('Usuario');
    });
  });

  describe('AC2: Muestra opciones de menú según el rol', () => {
    it('should show "Opción 1" for user role', () => {
      const authService = spectator.inject(AuthenticationService);
      (authService as any).currentUser.set({ name: 'Test User', role: 'user', email: 'test@user.com' });
      spectator.detectChanges();
      const menuItems = spectator.queryAll('b2b-sidebar-item');
      expect(menuItems.length).toBe(1);
      expect(menuItems[0].textContent).toContain('Opción 1');
    });

    it('should show "Opción 1" and "Opción 2" for admin role', () => {
      const authService = spectator.inject(AuthenticationService);
      (authService as any).currentUser.set({ name: 'Admin User', role: 'admin', email: 'admin@user.com' });
      spectator.detectChanges();
      const menuItems = spectator.queryAll('b2b-sidebar-item');
      expect(menuItems.length).toBe(2);
      expect(menuItems[0].textContent).toContain('Opción 1');
      expect(menuItems[1].textContent).toContain('Opción 2');
    });

    it('should show no items for an unknown role', () => {
      const authService = spectator.inject(AuthenticationService);
      (authService as any).currentUser.set({ name: 'Guest User', role: 'guest', email: 'guest@user.com' });
      spectator.detectChanges();
      const menuItems = spectator.queryAll('b2b-sidebar-item');
      expect(menuItems.length).toBe(0);
    });
  });

  describe('AC3: El botón de logout cierra sesión y redirige', () => {
    it('should call logout and navigate on successful logout', async () => {
      const authService = spectator.inject(AuthenticationService);
      const router = spectator.inject(Router);
      const logoutSpy = jest.spyOn(authService, 'logout').and.returnValue(Promise.resolve());
      const navigateSpy = jest.spyOn(router, 'navigate');

      await spectator.component.logout();

      expect(logoutSpy).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/acceso/sesion-finalizada']);
    });

    it('should log an error and not navigate on failed logout', async () => {
      const authService = spectator.inject(AuthenticationService);
      const router = spectator.inject(Router);
      const error = new Error('Logout failed');
      const logoutSpy = jest.spyOn(authService, 'logout').and.returnValue(Promise.reject(error));
      const navigateSpy = jest.spyOn(router, 'navigate');
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await spectator.component.logout();

      expect(logoutSpy).toHaveBeenCalled();
      expect(navigateSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error al cerrar sesión:', error);

      consoleErrorSpy.mockRestore();
    });
  });
});
