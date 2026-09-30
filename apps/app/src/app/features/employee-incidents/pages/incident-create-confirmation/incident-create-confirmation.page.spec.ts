import { IncidentCreateConfirmationPage } from './incident-create-confirmation.page';
import { createRoutingFactory, SpectatorRouting } from '@ngneat/spectator/jest';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { B2bReadDataComponent } from '@mapfre-tech/b2b-components';

describe('IncidentCreateConfirmationPage', () => {
  let spectator: SpectatorRouting<IncidentCreateConfirmationPage>;
  const createComponent = createRoutingFactory({
    component: IncidentCreateConfirmationPage,
    imports: [B2bReadDataComponent],
    mocks: [Router, Location],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should create', () => {
    const location = spectator.inject(Location);
    jest.spyOn(location, 'getState').mockReturnValue({ incidentId: 'INC-123' });
    spectator.detectChanges();
    expect(spectator.component).toBeTruthy();
  });

  it('should get incidentId from state', () => {
    const location = spectator.inject(Location);
    jest.spyOn(location, 'getState').mockReturnValue({ incidentId: 'INC-123' });
    spectator.component['location'] = location; // Workaround to re-inject mock
    spectator.component.constructor();
    spectator.detectChanges();
    expect(spectator.component.incidentId()).toBe('INC-123');
  });

  it('should navigate to not-found if incidentId is not in state', () => {
    const location = spectator.inject(Location);
    const router = spectator.inject(Router);
    jest.spyOn(location, 'getState').mockReturnValue({});
    spectator.component['location'] = location; // Workaround
    spectator.component.constructor();
    spectator.component.ngOnInit();
    expect(router.navigate).toHaveBeenCalledWith(['/incidents/not-found']);
  });
});
