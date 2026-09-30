import { createRoutingFactory, Spectator } from '@ngneat/spectator/jest';
import { IncidentHistoryPage } from './incident-history.page';
import { IncidentsService } from '../../services/incidents.service';
import { of } from 'rxjs';

describe('IncidentHistoryPage', () => {
  let spectator: Spectator<IncidentHistoryPage>;
  const createComponent = createRoutingFactory({
    component: IncidentHistoryPage,
    providers: [
      {
        provide: IncidentsService,
        useValue: {
          getIncidentHistory: () => of({ items: [] }),
        },
      },
    ],
  });

  beforeEach(() => (spectator = createComponent()));

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });
});
