import { createRoutingFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { AuthenticationService, SessionContext } from '../../../../core/auth/authentication.service';
import { MyProfilePage } from './my-profile.page';

const MOCK_SESSION_CONTEXT: SessionContext = {
  user: {
    name: 'John',
    surnames: 'Doe',
    email: 'john.doe@example.com',
    phone: '123456789',
  },
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

  beforeEach(() => (spectator = createComponent()));

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  it('should not display user data if session is not available', () => {
    spectator.component.user_data = undefined;
    spectator.detectChanges();
    expect(spectator.query('[data-testid="user-name"]')).toBeFalsy();
    expect(spectator.query('[data-testid="user-email"]')).toBeFalsy();
    expect(spectator.query('[data-testid="user-phone"]')).toBeFalsy();
  });

  it('should display user data from session context', () => {
    spectator.detectChanges();

    const nameElement = spectator.query('[data-testid="user-name"]');
    const emailElement = spectator.query('[data-testid="user-email"]');
    const phoneElement = spectator.query('[data-testid="user-phone"]');

    expect(nameElement).toHaveText(`${MOCK_SESSION_CONTEXT.user.name} ${MOCK_SESSION_CONTEXT.user.surnames}`);
    expect(emailElement).toHaveText(MOCK_SESSION_CONTEXT.user.email);
    expect(phoneElement).toHaveText(MOCK_SESSION_CONTEXT.user.phone);
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

