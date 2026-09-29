import { createRoutingFactory, SpectatorRouting } from '@ngneat/spectator/jest';
import { SessionEndedPage } from './session-ended.page';
import { Router } from '@angular/router';

describe('SessionEndedPage', () => {
  let spectator: SpectatorRouting<SessionEndedPage>;
  const createComponent = createRoutingFactory({
    component: SessionEndedPage,
    stubsEnabled: false,
    mocks: [Router],
  });

  beforeEach(() => (spectator = createComponent()));

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  it('should display the reason for the session ending', () => {
    const reason = 'Session expired';
    const router = spectator.inject(Router);
    (router as any).getCurrentNavigation = jest.fn().mockReturnValue({
      extras: {
        state: {
          reason,
        },
      },
    });
    spectator.component.ngOnInit();
    spectator.detectChanges();
    const reasonElement = spectator.query('[data-testid="reason"]');
    expect(reasonElement).toHaveText(reason);
  });

  it('should display the date and time of the session ending', () => {
    const now = new Date();
    spectator.detectChanges();
    const dateElement = spectator.query('[data-testid="datetime"]');
    expect(dateElement).toHaveText(now.toLocaleString());
  });

  it('should navigate to the login page when the "Volver" button is clicked', () => {
    const router = spectator.inject(Router);
    const button = spectator.query('[data-testid="back-button"]');
    spectator.click(button as Element);
    expect(router.navigate).toHaveBeenCalledWith(['/acceso']);
  });
});
