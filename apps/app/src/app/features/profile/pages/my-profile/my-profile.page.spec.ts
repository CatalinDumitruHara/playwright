import {
  B2bButtonComponent,
  B2bCardPrimaryComponent,
  B2bReadDataComponent,
  B2bTagComponent,
} from '@mapfre-tech/b2b-components';
import { createRoutingFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { AuthenticationService, SessionContext } from '../../../../core/auth/authentication.service';
import { MyProfilePage } from './my-profile.page';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';

const MOCK_SESSION_CONTEXT: SessionContext = {
  session: {
    user: {
      name: 'John Doe',
      role: 'TEST_ROLE',
    },
  },
  token: 'test_token',
};

describe('MyProfilePage', () => {
  let spectator: Spectator<MyProfilePage>;
  const createComponent = createRoutingFactory({
    component: MyProfilePage,
    declarations: [],
    imports: [B2bButtonComponent, B2bCardPrimaryComponent, B2bReadDataComponent, B2bTagComponent],
    providers: [
      mockProvider(AuthenticationService, {
        sessionContext: () => MOCK_SESSION_CONTEXT,
      }),
      DatePipe,
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.component.user_data = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'Administrador',
      password_last_updated: '2024-01-01T00:00:00',
    };
    spectator.detectChanges();
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  it('should not display user data if session is not available', () => {
    spectator.component.user_data = undefined;
    spectator.detectChanges();
    expect(spectator.query('[data-testid="user-name"]')).toBeFalsy();
    expect(spectator.query('[data-testid="user-email"]')).toBeFalsy();
  });

  it('should display user data from session context', () => {
    const nameElement = spectator.query('[data-testid="user-name"]');
    const emailElement = spectator.query('[data-testid="user-email"]');
    const roleElement = spectator.query('[data-testid="user-role"]');
    const statusElement = spectator.query('[data-testid="user-status"]');
    const passwordUpdateElement = spectator.query('[data-testid="user-password-update"]');

    spectator.component.last_password_change = new Date('2024-01-01T00:00:00');
    spectator.detectChanges();

    expect(nameElement).toHaveText('John Doe');
    expect(emailElement).toHaveText('john.doe@example.com');
    expect(roleElement).toHaveText('Administrador');
    expect(statusElement).toHaveText('Activa');
    expect(passwordUpdateElement).toHaveText('01/01/2024');
  });

  it('should navigate to change password page', () => {
    const router = spectator.inject(Router);
    const navigateSpy = jest.spyOn(router, 'navigate');

    const changePasswordButton = spectator.query('button[b2b-button]');
    expect(changePasswordButton).toBeTruthy();
    spectator.click(changePasswordButton as Element);

    expect(navigateSpy).toHaveBeenCalledWith(['/mi-perfil/contrasena']);
  });

  it('should navigate to home page', () => {
    const router = spectator.inject(Router);
    const navigateSpy = jest.spyOn(router, 'navigate');

    const homeButton = spectator.query('a[b2b-button]');
    expect(homeButton).toBeTruthy();
    spectator.click(homeButton as Element);

    expect(navigateSpy).toHaveBeenCalledWith(['/inicio']);
  });
});

