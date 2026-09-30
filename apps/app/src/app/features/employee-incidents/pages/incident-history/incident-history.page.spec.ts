import { fakeAsync, tick } from '@angular/core/testing';
import { convertToParamMap, ParamMap } from '@angular/router';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { BehaviorSubject, of } from 'rxjs';
import { IncidentsService } from '../../services/incidents.service';
import { IncidentHistoryPage } from './incident-history.page';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

describe('IncidentHistoryPage', () => {
  let spectator: Spectator<IncidentHistoryPage>;
  let incidentsService: IncidentsService;
  let location: Location;
  let route: ActivatedRoute;
  let paramMap: BehaviorSubject<ParamMap>;

  const createComponent = createComponentFactory({
    component: IncidentHistoryPage,
    providers: [
      mockProvider(IncidentsService, {
        getIncidentHistory: () => of({ items: [] }),
      }),
      mockProvider(Location),
      {
        provide: ActivatedRoute,
        useValue: {
          paramMap: new BehaviorSubject(convertToParamMap({ id: 'initial-id' })),
        },
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    incidentsService = spectator.inject(IncidentsService);
    location = spectator.inject(Location);
    route = spectator.inject(ActivatedRoute);
    paramMap = route.paramMap as BehaviorSubject<ParamMap>;
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  it('should call incidentsService.getIncidentHistory with the id from the route', fakeAsync(() => {
    const incidentId = '123';
    paramMap.next(convertToParamMap({ id: incidentId }));
    spectator.detectChanges();
    tick();
    expect(incidentsService.getIncidentHistory).toHaveBeenCalledWith(incidentId);
  }));

  it('should show history table when service returns data', fakeAsync(() => {
    const incidentId = '123';
    const history = { items: [{ id: '1', date: new Date(), description: 'test' }] };
    jest.spyOn(incidentsService, 'getIncidentHistory').mockReturnValue(of(history));

    paramMap.next(convertToParamMap({ id: incidentId }));
    spectator.detectChanges();
    tick();
    spectator.detectChanges();

    expect(spectator.query('b2b-table-container')).toBeTruthy();
  }));

  it('should not call the service if there is no id in the route', fakeAsync(() => {
    const getIncidentHistorySpy = jest.spyOn(incidentsService, 'getIncidentHistory').mockClear();
    paramMap.next(convertToParamMap({}));
    spectator.detectChanges();
    tick();
    expect(getIncidentHistorySpy).not.toHaveBeenCalled();
  }));

  it('should call location.back() when the back button is clicked', () => {
    const backButton = spectator.query('b2b-button');
    if (backButton) {
      spectator.click(backButton);
      expect(location.back).toHaveBeenCalled();
    } else {
      fail('Back button not found');
    }
  });
});
