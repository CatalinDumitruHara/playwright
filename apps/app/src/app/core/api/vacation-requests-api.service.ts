import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  VacationRequestCreate,
  VacationRequestDetail,
  VacationRequestList,
} from '@api-types';
import { ENVIRONMENT_CONFIG } from '@mapfre-tech/ngx-multienvironment/core';

@Injectable({
  providedIn: 'root',
})
export class VacationRequestsApiService {
  private http = inject(HttpClient);
  private environment = inject(ENVIRONMENT_CONFIG);
  private apiBaseUrl = this.environment['apiBaseUrl'] as string;

  /** EP-012 POST /vacation-requests */
  create(body: VacationRequestCreate): Observable<VacationRequestDetail> {
    return this.http.post<VacationRequestDetail>(
      `${this.apiBaseUrl}/vacation-requests`,
      body
    );
  }

  /** EP-013 GET /vacation-requests/my-requests */
  getMyRequests(page = 1, size = 20): Observable<VacationRequestList> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<VacationRequestList>(
      `${this.apiBaseUrl}/vacation-requests/my-requests`,
      { params }
    );
  }

  /** EP-014 GET /vacation-requests/{requestId} */
  getById(requestId: string): Observable<VacationRequestDetail> {
    return this.http.get<VacationRequestDetail>(
      `${this.apiBaseUrl}/vacation-requests/${encodeURIComponent(requestId)}`
    );
  }

  /** EP-015 POST /vacation-requests/{requestId}/cancel */
  cancel(requestId: string): Observable<VacationRequestDetail> {
    return this.http.post<VacationRequestDetail>(
      `${this.apiBaseUrl}/vacation-requests/${encodeURIComponent(requestId)}/cancel`,
      {}
    );
  }

  /** EP-016 GET /vacation-requests/{requestId}/proof-document (PDF) */
  downloadProof(requestId: string): Observable<Blob> {
    return this.http.get(
      `${this.apiBaseUrl}/vacation-requests/${encodeURIComponent(requestId)}/proof-document`,
      { responseType: 'blob' }
    );
  }
}
