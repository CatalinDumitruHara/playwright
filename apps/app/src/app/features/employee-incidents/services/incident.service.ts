import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Incident } from '../models/incident.model';
import { Room } from '../models/room.model';
import { IncidentCategory } from '../models/incident-category.model';

@Injectable({
  providedIn: 'root',
})
export class IncidentService {
  private apiUrl = '/api';

  constructor(private http: HttpClient) {}

  getMyIncidents(): Observable<Incident[]> {
    return this.http.get<Incident[]>(`${this.apiUrl}/my-incidents`);
  }

  getIncidentById(id: string): Observable<Incident> {
    return this.http.get<Incident>(`${this.apiUrl}/incidents/${id}`);
  }

  createIncident(incident: Partial<Incident>): Observable<Incident> {
    return this.http.post<Incident>(`${this.apiUrl}/incidents`, incident);
  }

  getRooms(): Observable<Room[]> {
    return this.http.get<Room[]>(`${this.apiUrl}/rooms`);
  }

  getIncidentCategories(): Observable<IncidentCategory[]> {
    return this.http.get<IncidentCategory[]>(`${this.apiUrl}/incident-categories`);
  }
}
