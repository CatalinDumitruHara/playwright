import { createRoutingFactory, Spectator } from '@ngneat/spectator/jest';
import { SessionEndedPage } from './session-ended.page';

describe('SessionEndedPage', () => {
  let spectator: Spectator<SessionEndedPage>;
  const createComponent = createRoutingFactory({
    component: SessionEndedPage,
  });

  beforeEach(() => spectator = createComponent());

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });
});
