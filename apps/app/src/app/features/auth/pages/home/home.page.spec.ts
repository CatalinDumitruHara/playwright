import { createRoutingFactory, Spectator } from '@ngneat/spectator/jest';
import { HomePage } from './home.page';
import { AuthenticationService, SessionContext } from '../../../../core/auth/authentication.service';
import { Router } from '@angular/router';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('HomePage', () => {
  let spectator: Spectator<HomePage>;
  const sessionContext$ = new BehaviorSubject<SessionContext | null>(null);
  let authService: AuthenticationService;
  let router: Router;

  const createComponent = createRoutingFactory({
    component: HomePage,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    providers: [
      {
        provide: AuthenticationService,
        useValue: {
          logout: jest.fn().mockReturnValue(of(undefined)),
          getSessionContext: () => sessionContext$,
        },
      },
      {
        provide: Router,
        useValue: {
          navigate: jest.fn(),
        },
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    authService = spectator.inject(AuthenticationService);
    router = spectator.inject(Router);
    sessionContext$.next(null); // Reset subject before each test
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  describe('AC1: Muestra el nombre del usuario logado', () => {
    it('should display the user name when the user is logged in', () => {
      sessionContext$.next({ user: { name: 'John Doe', email: 'john.doe@example.com', role_code: 'user' }, permissions: [], permissions: [] });
      spectator.detectChanges();
      const userNameElement = spectator.query('h2') as HTMLElement;
      expect(userNameElement.textContent).toContain('John Doe');
    });

    it('should display the user role when the user is logged in', () => {
      sessionContext$.next({ user: { name: 'John Doe', email: 'john.doe@example.com', role_code: 'admin' }, permissions: [], permissions: [] });
      spectator.detectChanges();
      const userRoleElement = spectator.query('p') as HTMLElement;
      expect(userRoleElement.textContent).toContain('admin');
    });

    it('should display "Usuario" when the user has no name', () => {
      sessionContext$.next({ user: { name: '', email: 'john.doe@example.com', role_code: 'user' }, permissions: [], permissions: [] });
      spectator.detectChanges();
      const userNameElement = spectator.query('h2') as HTMLElement;
      expect(userNameElement.textContent).toContain('Usuario');
    });
  });

  describe('AC2: Muestra opciones de menú según el rol', () => {
    it('should show "Opción 1" for user role', () => {
      sessionContext$.next({ user: { name: 'Test User', role: 'user' }, permissions: [] });
      spectator.detectChanges();
      const menuItems = spectator.queryAll('b2b-sidebar-item');
      expect(menuItems.length).toBe(1);
      expect(menuItems[0].textContent).toContain('Opción 1');
    });

    it('should show "Opción 1" and "Opción 2" for admin role', () => {
      sessionContext$.next({ user: { name: 'Admin User', role: 'admin' }, permissions: [] });
      spectator.detectChanges();
      const menuItems = spectator.queryAll('b2b-sidebar-item');
      expect(menuItems.length).toBe(2);
      expect(menuItems[0].textContent).toContain('Opción 1');
      expect(menuItems[1].textContent).toContain('Opción 2');
    });

    it('should show no items for an unknown role', () => {
      sessionContext$.next({ user: { name: 'Guest User', role: 'guest' }, permissions: [] });
      spectator.detectChanges();
      const menuItems = spectator.queryAll('b2b-sidebar-item');
      expect(menuItems.length).toBe(0);
    });
  });

  describe('AC3: El botón de logout cierra sesión y redirige', () => {
    it('should call logout method when "Cerrar sesión" button is clicked', () => {
      const logoutSpy = jest.spyOn(spectator.component, 'logout');
      spectator.click('ion-button');
      expect(logoutSpy).toHaveBeenCalled();
    });

    it('should call logout and navigate on successful logout', async () => {
      const logoutSpy = authService.logout as jest.Mock;
      const navigateSpy = router.navigate as jest.Mock;

      await spectator.component.logout();

      expect(logoutSpy).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/acceso/sesion-finalizada']);
    });

    it('should log an error and not navigate on failed logout', async () => {
      const error = new Error('Logout failed');
      const logoutSpy = (authService.logout as jest.Mock).mockReturnValue(throwError(() => error));
      const navigateSpy = router.navigate as jest.Mock;
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await spectator.component.logout();

      expect(logoutSpy).toHaveBeenCalled();
      expect(navigateSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error al cerrar sesión', error);

      consoleErrorSpy.mockRestore();
    });
  });
});
