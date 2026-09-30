import { Injectable, Inject, InjectionToken } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

@Injectable({
  providedIn: 'root'
})
export class IncidentService {

  constructor(
    private http: HttpClient,
    @Inject(API_BASE_URL) private apiBaseUrl: string
  ) { }

  createIncident(incidentData: any): Observable<any> {
    return this.http.post(`${this.apiBaseUrl}/incidents`, incidentData);
  }

  getMyIncidents(): Observable<any> {
    return this.http.get(`${this.apiBaseUrl}/my-incidents`);
  }

  getIncidentDetail(incidentId: string): Observable<any> {
    return this.http.get(`${this.apiBaseUrl}/incidents/${incidentId}`);
  }

  getIncidentHistory(incidentId: string): Observable<any> {
    return this.http.get(`${this.apiBaseUrl}/incidents/${incidentId}/history`);
  }

  getIncidentPhoto(incidentId: string): Observable<any> {
    return this.http.get(`${this.apiBaseUrl}/incidents/${incidentId}/photo`);
  }

  getIncidentCategories(): Observable<any> {
    return this.http.get(`${this.apiBaseUrl}/incident-categories`);
  }

  getRooms(): Observable<any> {
    return this.http.get(`${this.apiBaseUrl}/rooms`);
  }
}
