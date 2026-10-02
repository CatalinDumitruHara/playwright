import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  AssignmentReleaseRequest,
  IncidentDetail,
  IncidentHistoryPage,
  IncidentListPage,
} from '@api-types';
import { API_BASE_URL } from '../../core/config/api-base-url.token';
import {
  ASSIGNMENT_FILTERS,
  DEFAULT_TRAY_PAGE_SIZE,
  DEFAULT_TRAY_SORT_BY,
  DEFAULT_TRAY_SORT_DIR,
  ReassignBody,
  SEARCH_TEXT_MAX,
  SEARCH_TEXT_MIN,
  TRAY_PAGE_SIZES,
  TRAY_SORT_BY,
  TRAY_SORT_DIRS,
  TransitionBody,
  TrayHistoryEntry,
  TrayIncidentDetail,
  TrayPage,
  TrayQuery,
  mapTrayDetail,
  mapTrayHistory,
  mapTrayPage,
} from './incident-tray.models';

@Injectable({
  providedIn: 'root',
})
export class IncidentTrayService {
  private http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private incidentUrl(id: string): string {
    return `${this.apiBaseUrl}/incidents/${encodeURIComponent(id)}`;
  }

  /** EP-026 */
  list(q: TrayQuery): Observable<TrayPage> {
    const page = q.page && q.page >= 1 ? Math.floor(q.page) : 1;
    const pageSize = (TRAY_PAGE_SIZES as readonly number[]).includes(q.page_size ?? -1)
      ? (q.page_size as number)
      : DEFAULT_TRAY_PAGE_SIZE;
    const sortBy =
      q.sort_by && (TRAY_SORT_BY as readonly string[]).includes(q.sort_by)
        ? q.sort_by
        : DEFAULT_TRAY_SORT_BY;
    const sortDir =
      q.sort_dir && (TRAY_SORT_DIRS as readonly string[]).includes(q.sort_dir)
        ? q.sort_dir
        : DEFAULT_TRAY_SORT_DIR;

    let params = new HttpParams();
    const addList = (key: string, values?: string[]) => {
      for (const v of values ?? []) {
        if (v !== undefined && v !== null && String(v).trim() !== '') {
          params = params.append(key, String(v).trim());
        }
      }
    };
    const addOne = (key: string, value?: string | number | null) => {
      if (value === undefined || value === null) return;
      const s = String(value).trim();
      if (s !== '') params = params.set(key, s);
    };

    addList('room_id', q.room_id);
    addOne('office_id', q.office_id);
    addList('category_code', q.category_code);
    addList('status', q.status);
    if (
      q.assignment_filter &&
      ASSIGNMENT_FILTERS.some((f) => f.code === q.assignment_filter)
    ) {
      addOne('assignment_filter', q.assignment_filter);
    }
    addOne('assigned_technician_id', q.assigned_technician_id);
    addOne('created_from', q.created_from);
    addOne('created_to', q.created_to);
    const search = (q.search_text ?? '').trim();
    if (search.length >= SEARCH_TEXT_MIN && search.length <= SEARCH_TEXT_MAX) {
      params = params.set('search_text', search);
    }
    params = params
      .set('sort_by', sortBy)
      .set('sort_dir', sortDir)
      .set('page', String(page))
      .set('page_size', String(pageSize));

    return this.http
      .get<IncidentListPage>(`${this.apiBaseUrl}/incidents`, { params })
      .pipe(map((body) => mapTrayPage(body, page, pageSize)));
  }

  /** EP-028 */
  detail(id: string): Observable<TrayIncidentDetail> {
    return this.http
      .get<IncidentDetail>(this.incidentUrl(id))
      .pipe(map((body) => mapTrayDetail(body)));
  }

  /** EP-029 */
  history(id: string): Observable<TrayHistoryEntry[]> {
    return this.http
      .get<IncidentHistoryPage>(`${this.incidentUrl(id)}/history`)
      .pipe(map((body) => mapTrayHistory(body)));
  }

  /** EP-031: autoasignación; el responsable lo fija el servidor desde la sesión. */
  selfAssign(id: string): Observable<unknown> {
    return this.http.post<unknown>(`${this.incidentUrl(id)}/assignment`, {});
  }

  /** EP-032: reasignación a otro técnico. */
  reassign(id: string, assignedTechnicianId: number): Observable<unknown> {
    const body: ReassignBody = { assigned_technician_id: assignedTechnicianId };
    return this.http.put<unknown>(`${this.incidentUrl(id)}/assignment`, body);
  }

  /** EP-033: liberación con motivo. */
  release(id: string, reason: string): Observable<unknown> {
    const body: AssignmentReleaseRequest = { reason };
    return this.http.request<unknown>('DELETE', `${this.incidentUrl(id)}/assignment`, {
      body,
    });
  }

  /** EP-034: transición de estado. */
  transition(id: string, toStatus: string, comment?: string): Observable<TrayIncidentDetail> {
    const body: TransitionBody = { to_status: toStatus };
    const c = comment?.trim();
    if (c) body.comment = c;
    return this.http
      .post<IncidentDetail>(`${this.incidentUrl(id)}/transitions`, body)
      .pipe(map((res) => mapTrayDetail(res)));
  }
}
