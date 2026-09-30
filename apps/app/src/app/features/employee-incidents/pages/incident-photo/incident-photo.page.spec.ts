import { createRoutingFactory, Spectator } from '@ngneat/spectator/jest';
import { IncidentPhotoPage } from './incident-photo.page';
import { IncidentsService } from '../../services/incidents.service';
import { of } from 'rxjs';

describe('IncidentPhotoPage', () => {
  let spectator: Spectator<IncidentPhotoPage>;
  const createComponent = createRoutingFactory({
    component: IncidentPhotoPage,
    providers: [
      {
        provide: IncidentsService,
        useValue: {
          getIncidentPhoto: () => of({ content: new Blob(), mime_type: 'image/png' }),
        },
      },
    ],
  });

  beforeEach(() => (spectator = createComponent()));

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });
});
