import { createRoutingFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { AuthenticationService, SessionContext } from '../../../../core/auth/authentication.service';
import { MyProfilePage } from './my-profile.page';
import { Router } from '@angular/router';

const MOCK_SESSION_CONTEXT: SessionContext = {
  user: {
    name: 'John Doe',
    email: 'john.doe@example.com',
    role_code: 'TEST_ROLE',
  },
  permissions: [],
};

describe('MyProfilePage', () => {
  let spectator: Spectator<MyProfilePage>;
  const createComponent = createRoutingFactory({
    component: MyProfilePage,
    providers: [
      mockProvider(AuthenticationService, {
        getSessionContext: () => of(MOCK_SESSION_CONTEXT),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.detectChanges();
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  it('should not display user data if session is not available', () => {
    spectator.component.user_data = undefined;

    expect(spectator.query('[data-testid="user-name"]')).toBeFalsy();
    expect(spectator.query('[data-testid="user-email"]')).toBeFalsy();
  });

  it('should display user data from session context', () => {


    const nameElement = spectator.query('[data-testid="user-name"]');
    const emailElement = spectator.query('[data-testid="user-email"]');
    const roleElement = spectator.query('[data-testid="user-role"]');
    const statusElement = spectator.query('[data-testid="user-status"]');
    const passwordUpdateElement = spectator.query('[data-testid="user-password-update"]');

    expect(nameElement).toHaveText(MOCK_SESSION_CONTEXT.user.name);
    expect(emailElement).toHaveText(MOCK_SESSION_CONTEXT.user.email);
    expect(roleElement).toHaveText('Administrador');
    expect(statusElement).toHaveText('Activa');
    expect(passwordUpdateElement).toHaveText(new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }));
  });

  it('should navigate to change password page', () => {
    const router = spectator.inject(Router);
    const navigateSpy = jest.spyOn(router, 'navigate');

    spectator.click('[data-testid="change-password-button"]');

    expect(navigateSpy).toHaveBeenCalledWith(['/mi-perfil/contrasena']);
  });

  it('should navigate to home page', () => {
    const router = spectator.inject(Router);
    const navigateSpy = jest.spyOn(router, 'navigate');

    spectator.click('[data-testid="home-button"]');

    expect(navigateSpy).toHaveBeenCalledWith(['/inicio']);
  });
});

