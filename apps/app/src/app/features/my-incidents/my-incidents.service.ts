import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  IncidentDetail,
  IncidentHistoryPage,
  IncidentListPage,
  IncidentPhotoContent,
} from '@api-types';
import { API_BASE_URL } from '../../core/config/api-base-url.token';
import {
  DEFAULT_PAGE_SIZE,
  HistoryEntry,
  IncidentPage,
  IncidentView,
  MAX_PAGE_SIZE,
  MyIncidentsQuery,
  PhotoContent,
  mapHistory,
  mapIncidentDetail,
  mapIncidentPage,
  mapPhoto,
} from './my-incidents.models';

export function photoToBlob(p: PhotoContent): Blob {
  const binary = atob(p.contentBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: p.mimeType });
}

@Injectable({
  providedIn: 'root',
})
export class MyIncidentsService {
  private http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  /** EP-027 */
  list(q: MyIncidentsQuery): Observable<IncidentPage> {
    const page = q.page && q.page > 0 ? Math.floor(q.page) : 1;
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      q.page_size && q.page_size > 0 ? Math.floor(q.page_size) : DEFAULT_PAGE_SIZE
    );

    let params = new HttpParams();
    const addList = (key: string, values?: string[]) => {
      for (const v of values ?? []) {
        if (v !== undefined && v !== null && String(v).trim() !== '') {
          params = params.append(key, String(v));
        }
      }
    };
    const addOne = (key: string, value?: string) => {
      if (value !== undefined && value !== null && value.trim() !== '') {
        params = params.set(key, value.trim());
      }
    };

    addList('status_code', q.status_code);
    addList('category_id', q.category_id);
    addList('room_id', q.room_id);
    addOne('office_id', q.office_id);
    addOne('created_from', q.created_from);
    addOne('created_to', q.created_to);
    addOne('search_text', q.search_text);
    addOne('sort_by', q.sort_by);
    addOne('sort_dir', q.sort_dir);
    params = params.set('page', String(page)).set('page_size', String(pageSize));

    return this.http
      .get<IncidentListPage>(`${this.apiBaseUrl}/my-incidents`, { params })
      .pipe(map((body) => mapIncidentPage(body, page, pageSize)));
  }

  /** EP-028 */
  detail(id: string): Observable<IncidentView> {
    return this.http
      .get<IncidentDetail>(`${this.apiBaseUrl}/incidents/${encodeURIComponent(id)}`)
      .pipe(map((body) => mapIncidentDetail(body)));
  }

  /** EP-029 */
  history(id: string): Observable<HistoryEntry[]> {
    return this.http
      .get<IncidentHistoryPage>(
        `${this.apiBaseUrl}/incidents/${encodeURIComponent(id)}/history`
      )
      .pipe(map((body) => mapHistory(body)));
  }

  /** EP-030 */
  photo(id: string): Observable<PhotoContent | null> {
    return this.http
      .get<IncidentPhotoContent>(
        `${this.apiBaseUrl}/incidents/${encodeURIComponent(id)}/photo`
      )
      .pipe(map((body) => mapPhoto(body)));
  }
}
