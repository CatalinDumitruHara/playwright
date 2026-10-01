import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  IncidentCategoryList,
  IncidentDetail,
  RoomList,
} from '@api-types';
import { ENVIRONMENT_CONFIG } from '@mapfre-tech/ngx-multienvironment/core';
import {
  CategoryOption,
  CreatedIncident,
  PhotoPayload,
  ReportIncidentInput,
  RoomOption,
  mapCategories,
  mapCreatedIncident,
  mapRooms,
  toIncidentCreateRequest,
} from './report-incident.models';

const LAST_ROOM_KEY = 'last_room_id';

@Injectable({
  providedIn: 'root',
})
export class ReportIncidentService {
  private http = inject(HttpClient);
  private environment = inject(ENVIRONMENT_CONFIG);
  private apiBaseUrl = this.environment['apiBaseUrl'] as string;

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
        toIncidentCreateRequest(input)
      )
      .pipe(map((body) => mapCreatedIncident(body)));
  }

  readPhoto(file: File): Observable<PhotoPayload> {
    return new Observable<PhotoPayload>((subscriber) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        const comma = result.indexOf(',');
        subscriber.next({
          fileName: file.name,
          mimeType: file.type === 'image/png' ? 'image/png' : 'image/jpeg',
          contentBase64: comma >= 0 ? result.slice(comma + 1) : result,
        });
        subscriber.complete();
      };
      reader.onerror = () =>
        subscriber.error(reader.error ?? new Error('No se pudo leer la foto'));
      reader.readAsDataURL(file);
      return () => {
        if (reader.readyState === FileReader.LOADING) reader.abort();
      };
    });
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
