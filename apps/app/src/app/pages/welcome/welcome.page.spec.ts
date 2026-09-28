import { WelcomePage } from './welcome.page';
import { createRoutingFactory } from '@ngneat/spectator/jest';

describe('WelcomePage', () => {
  const createComponent = createRoutingFactory({
    component: WelcomePage,
    detectChanges: false,
  });

  it('should create', () => {
    const spectator = createComponent();
    expect(spectator.component).toBeTruthy();
  });
});
