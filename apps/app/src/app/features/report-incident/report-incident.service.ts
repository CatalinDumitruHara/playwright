import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  IncidentCategoryList,
  IncidentDetail,
  RoomList,
} from '@api-types';
import { API_BASE_URL } from '../../core/config/api-base-url.token';
import {
  CategoryOption,
  CreatedIncident,
  ReportIncidentInput,
  RoomOption,
  mapCategories,
  mapCreatedIncident,
  mapRooms,
  toIncidentCreateBody,
  toIncidentCreateRequest,
} from './report-incident.models';

const LAST_ROOM_KEY = 'last_room_id';

@Injectable({
  providedIn: 'root',
})
export class ReportIncidentService {
  private http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  /** EP-040 */
  loadCategories(): Observable<CategoryOption[]> {
    return this.http
      .get<IncidentCategoryList>(`${this.apiBaseUrl}/incident-categories`)
      .pipe(map((body) => mapCategories(body)));
  }

  /** EP-042 */
  loadRooms(): Observable<RoomOption[]> {
    return this.http
      .get<RoomList>(`${this.apiBaseUrl}/rooms`)
      .pipe(map((body) => mapRooms(body)));
  }

  /** EP-025 */
  create(input: ReportIncidentInput): Observable<CreatedIncident> {
    return this.http
      .post<IncidentDetail>(
        `${this.apiBaseUrl}/incidents`,
        toIncidentCreateBody(toIncidentCreateRequest(input))
      )
      .pipe(map((body) => mapCreatedIncident(body)));
  }

  getLastRoomId(): number | null {
    const raw = localStorage.getItem(LAST_ROOM_KEY);
    if (raw === null || raw.trim() === '') return null;
    const id = Number(raw);
    return Number.isFinite(id) ? id : null;
  }

  setLastRoomId(id: number | null): void {
    if (id === null) {
      localStorage.removeItem(LAST_ROOM_KEY);
    } else {
      localStorage.setItem(LAST_ROOM_KEY, String(id));
    }
  }
}
