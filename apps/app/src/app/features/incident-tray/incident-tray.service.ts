import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  ClassificationUpdateRequest,
  IncidentCategoryList,
  IncidentClosureRequest,
  IncidentDetail,
  IncidentHistoryPage,
  RoomList,
} from '@api-types';
import { API_BASE_URL } from '../../core/config/api-base-url.token';
import { MyIncidentsService } from '../my-incidents/my-incidents.service';
import { IncidentView, mapIncidentDetail } from '../my-incidents/my-incidents.models';
import {
  ReclassificationOption,
  SimilarClosureView,
  TimelineEntry,
  mapCategoryOptions,
  mapRoomOptions,
  mapSimilarClosures,
  mapTimeline,
} from './incident-tray.models';

@Injectable({
  providedIn: 'root',
})
export class IncidentTrayService {
  private http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly myIncidents = inject(MyIncidentsService);

  private incidentUrl(id: string): string {
    return `${this.apiBaseUrl}/incidents/${encodeURIComponent(id)}`;
  }

  /** EP-028 (reutiliza MyIncidentsService) */
  detail(id: string): Observable<IncidentView> {
    return this.myIncidents.detail(id);
  }

  /** EP-035 */
  close(id: string, resolutionComment: string): Observable<IncidentView> {
    const body: IncidentClosureRequest = { resolution_comment: resolutionComment };
    return this.http
      .post<IncidentDetail>(`${this.incidentUrl(id)}/closure`, body)
      .pipe(map((res) => mapIncidentDetail(res)));
  }

  /**
   * EP-036. El schema IncidentReclassificationRequest es placeholder en el
   * contrato; se usa ClassificationUpdateRequest del mismo lib.
   */
  reclassify(id: string, body: ClassificationUpdateRequest): Observable<IncidentView> {
    return this.http
      .put<IncidentDetail>(`${this.incidentUrl(id)}/classification`, body)
      .pipe(map((res) => mapIncidentDetail(res)));
  }

  /** EP-037 (SimilarClosurePage no exportado en @api-types: se tipa como unknown) */
  similarClosures(id: string, page = 1, pageSize = 10): Observable<SimilarClosureView> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('page_size', String(pageSize));
    return this.http
      .get<unknown>(`${this.incidentUrl(id)}/similar-closures`, { params })
      .pipe(map((res) => mapSimilarClosures(res, page, pageSize)));
  }

  /** EP-029 */
  timeline(id: string): Observable<TimelineEntry[]> {
    return this.http
      .get<IncidentHistoryPage>(`${this.incidentUrl(id)}/history`)
      .pipe(map((res) => mapTimeline(res)));
  }

  /** EP-042 */
  rooms(): Observable<ReclassificationOption[]> {
    return this.http
      .get<RoomList>(`${this.apiBaseUrl}/rooms`)
      .pipe(map((res) => mapRoomOptions(res)));
  }

  /** EP-040 */
  categories(): Observable<ReclassificationOption[]> {
    return this.http
      .get<IncidentCategoryList>(`${this.apiBaseUrl}/incident-categories`)
      .pipe(map((res) => mapCategoryOptions(res)));
  }
}
