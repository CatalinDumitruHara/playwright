import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from '@mapfre-tech/ngx-multienvironment/core';
import {
  IncidentCategoryList,
  IncidentCreateRequest,
  IncidentDetail,
  IncidentHistoryPage,
  IncidentListPage,
  IncidentPhotoContent,
  RoomList,
} from '@api-types';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class IncidentsService {
  private readonly http = inject(HttpClient);
  private readonly envConfig = inject<EnvironmentConfig>(ENVIRONMENT_CONFIG);
  private readonly apiUrl = this.envConfig['apiBaseUrl'];

  createIncident(data: IncidentCreateRequest): Observable<IncidentDetail> {
    return this.http.post<IncidentDetail>(`${this.apiUrl}/incidents`, data);
  }

  getMyIncidents(): Observable<IncidentListPage> {
    return this.http.get<IncidentListPage>(`${this.apiUrl}/my-incidents`);
  }

  getIncidentDetail(incidentId: string): Observable<IncidentDetail> {
    return this.http.get<IncidentDetail>(`${this.apiUrl}/incidents/${incidentId}`);
  }

  getIncidentHistory(incidentId: string): Observable<IncidentHistoryPage> {
    return this.http.get<IncidentHistoryPage>(`${this.apiUrl}/incidents/${incidentId}/history`);
  }

  getIncidentPhoto(incidentId: string): Observable<IncidentPhotoContent> {
    return this.http.get<IncidentPhotoContent>(`${this.apiUrl}/incidents/${incidentId}/photo`);
  }

  getIncidentCategories(): Observable<IncidentCategoryList> {
    return this.http.get<IncidentCategoryList>(`${this.apiUrl}/incident-categories`);
  }

  getRooms(): Observable<RoomList> {
    return this.http.get<RoomList>(`${this.apiUrl}/rooms`);
  }
}
