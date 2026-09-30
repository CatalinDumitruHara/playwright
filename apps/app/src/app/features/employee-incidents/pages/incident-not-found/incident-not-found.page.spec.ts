import { createRoutingFactory, Spectator } from '@ngneat/spectator/jest';
import { IncidentNotFoundPage } from './incident-not-found.page';

describe('IncidentNotFoundPage', () => {
  let spectator: Spectator<IncidentNotFoundPage>;
  const createComponent = createRoutingFactory({
    component: IncidentNotFoundPage,
  });

  beforeEach(() => (spectator = createComponent()));

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });
});
