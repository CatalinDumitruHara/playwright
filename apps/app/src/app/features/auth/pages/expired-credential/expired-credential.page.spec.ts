import { createRoutingFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { ExpiredCredentialPage } from './expired-credential.page';
import { Router } from '@angular/router';
import { B2bButtonComponent, B2bNotificationInlineComponent } from '@mapfre-tech/b2b-components';
import { By } from '@angular/platform-browser';

describe('ExpiredCredentialPage', () => {
  let spectator: Spectator<ExpiredCredentialPage>;
  const createComponent = createRoutingFactory({
    component: ExpiredCredentialPage,
    imports: [B2bButtonComponent, B2bNotificationInlineComponent],
    providers: [
      mockProvider(Router, {
        getCurrentNavigation: () => ({
          extras: {
            state: {
              expirationDate: '2023-10-26T12:00:00Z',
            },
          },
        }),
      } as any),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  it('should display the correct title', () => {
    const title = spectator.query('h1');
    expect(title).toHaveText('Credencial temporal caducada');
  });

  describe('[AC-PWD-08] Expired Credential Message', () => {
    it('should display the generic error message when no expiration date is provided', () => {
      spectator.component.expirationDate = null;
      spectator.detectChanges();
      const notificationEl = spectator.debugElement.query(By.css('b2b-notification-inline'));
      expect(notificationEl.nativeElement.textContent).toContain('Su credencial temporal ha caducado');
      expect(notificationEl.nativeElement.textContent).not.toContain('el');
    });

    it('should display the expiration date when provided', () => {
      spectator.component.expirationDate = '2023-10-26T12:00:00Z';
      spectator.detectChanges();
      const notificationEl = spectator.debugElement.query(By.css('b2b-notification-inline'));
      expect(notificationEl.nativeElement.textContent).toContain(
        'Su credencial temporal ha caducado el 26/10/2023'
      );
    });
  });


  it('should navigate to the login page when the button is clicked', () => {
    const router = spectator.inject(Router);
    const button = spectator.query('button');
    spectator.click(button as Element);
    expect(router.navigate).toHaveBeenCalledWith(['/acceso']);
  });
});
