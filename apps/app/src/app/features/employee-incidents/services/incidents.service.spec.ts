
import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { IncidentsService } from './incidents.service';
import {
  createHttpFactory,
  HttpMethod,
  SpectatorHttp,
} from '@ngneat/spectator/jest';
import {
  IncidentCategoryList,
  IncidentCreateRequest,
  IncidentDetail,
  IncidentHistoryPage,
  IncidentListPage,
  IncidentPhotoContent,
  RoomList,
} from '@api-types';
import { ENVIRONMENT_CONFIG } from '@mapfre-tech/ngx-multienvironment/core';

describe('IncidentsService', () => {
  let spectator: SpectatorHttp<IncidentsService>;
  const createHttp = createHttpFactory({
    service: IncidentsService,
    imports: [HttpClientTestingModule],
    providers: [
      {
        provide: ENVIRONMENT_CONFIG,
        useValue: { apiBaseUrl: '/api' },
      },
    ],
  });

  beforeEach(() => (spectator = createHttp()));

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });

  it('should create an incident', () => {
    const incidentData: IncidentCreateRequest = {
      room_id: 1,
      category_code: 'cat1',
      description: 'test',
    };
    spectator.service.createIncident(incidentData).subscribe();
    const req = spectator.expectOne('/api/incidents', HttpMethod.POST);
    req.flush({});
  });

  it('should get my incidents', () => {
    spectator.service.getMyIncidents().subscribe();
    const req = spectator.expectOne('/api/my-incidents', HttpMethod.GET);
    req.flush({ items: [], total: 0 });
  });

  it('should get incident detail', () => {
    spectator.service.getIncidentDetail('1').subscribe();
    const req = spectator.expectOne('/api/incidents/1', HttpMethod.GET);
    req.flush({});
  });

  it('should get incident history', () => {
    spectator.service.getIncidentHistory('1').subscribe();
    const req = spectator.expectOne('/api/incidents/1/history', HttpMethod.GET);
    req.flush({ items: [] });
  });

  it('should get incident photo', () => {
    spectator.service.getIncidentPhoto('1').subscribe();
    const req = spectator.expectOne('/api/incidents/1/photo', HttpMethod.GET);
    req.flush(new Blob());
  });

  it('should get incident categories', () => {
    spectator.service.getIncidentCategories().subscribe();
    const req = spectator.expectOne('/api/incident-categories', HttpMethod.GET);
    req.flush({ categories: [] });
  });

  it('should get rooms', () => {
    spectator.service.getRooms().subscribe();
    const req = spectator.expectOne('/api/rooms', HttpMethod.GET);
    req.flush({ rooms: [] });
  });
});
