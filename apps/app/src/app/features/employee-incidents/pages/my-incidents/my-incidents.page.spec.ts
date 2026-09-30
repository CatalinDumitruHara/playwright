
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { MyIncidentsPage } from './my-incidents.page';
import { IncidentsService } from '../../services/incidents.service';
import { of } from 'rxjs';
import { IonicModule } from '@ionic/angular';

describe('MyIncidentsPage', () => {
  let spectator: Spectator<MyIncidentsPage>;
  const createComponent = createComponentFactory({
    component: MyIncidentsPage,
    imports: [IonicModule.forRoot()],
    providers: [
      mockProvider(IncidentsService, {
        getMyIncidents: () => of([]),
      }),
    ],
  });

  beforeEach(() => (spectator = createComponent()));

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  it('should call getMyIncidents on ngOnInit', () => {
    const incidentsService = spectator.inject(IncidentsService);
    spectator.component.ngOnInit();
    expect(incidentsService.getMyIncidents).toHaveBeenCalled();
  });
});
