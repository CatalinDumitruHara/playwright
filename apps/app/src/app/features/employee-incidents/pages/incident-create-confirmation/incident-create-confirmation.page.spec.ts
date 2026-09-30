import { createRoutingFactory, Spectator } from '@ngneat/spectator/jest';
import { IncidentCreateConfirmationPage } from './incident-create-confirmation.page';

describe('IncidentCreateConfirmationPage', () => {
  let spectator: Spectator<IncidentCreateConfirmationPage>;
  const createComponent = createRoutingFactory({
    component: IncidentCreateConfirmationPage,
    imports: [],
    providers: [],
  });

  beforeEach(() => (spectator = createComponent()));

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });
});
