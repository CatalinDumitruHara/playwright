
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { IncidentDetailPage } from './incident-detail.page';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { IonicModule } from '@ionic/angular';
import { IncidentsService } from '../../services/incidents.service';

describe('IncidentDetailPage', () => {
  let spectator: Spectator<IncidentDetailPage>;
  const createComponent = createComponentFactory({
    component: IncidentDetailPage,
    imports: [IonicModule.forRoot()],
    providers: [
      mockProvider(ActivatedRoute, {
        snapshot: {
          paramMap: {
            get: () => '123',
          },
        },
      }),
      mockProvider(IncidentsService, {
        getIncidentDetail: () => of(null),
      })
    ],
  });

  beforeEach(() => (spectator = createComponent()));

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  it('should get incident id from route', () => {
    const route = spectator.inject(ActivatedRoute);
    spectator.component.ngOnInit();
    expect(route.snapshot.paramMap.get).toHaveBeenCalledWith('incidentId');
  });
});
