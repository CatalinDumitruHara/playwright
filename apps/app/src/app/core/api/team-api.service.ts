import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  RejectionRequest,
  TeamMemberList,
  VacationRequestDetail,
  VacationRequestList,
} from '@api-types';
import { ENVIRONMENT_CONFIG } from '@mapfre-tech/ngx-multienvironment/core';

@Injectable({
  providedIn: 'root',
})
export class TeamApiService {
  private http = inject(HttpClient);
  private environment = inject(ENVIRONMENT_CONFIG);
  private apiBaseUrl = this.environment['apiBaseUrl'] as string;

  /** EP-011 GET /profile/my-team */
  getMyTeam(): Observable<TeamMemberList> {
    return this.http.get<TeamMemberList>(`${this.apiBaseUrl}/profile/my-team`);
  }

  /** EP-017 GET /team/vacation-requests */
  getTeamRequests(page = 1, size = 20): Observable<VacationRequestList> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<VacationRequestList>(
      `${this.apiBaseUrl}/team/vacation-requests`,
      { params }
    );
  }

  /** EP-018 GET /team/vacation-requests/{requestId} */
  getTeamRequest(requestId: string): Observable<VacationRequestDetail> {
    return this.http.get<VacationRequestDetail>(
      `${this.apiBaseUrl}/team/vacation-requests/${encodeURIComponent(requestId)}`
    );
  }

  /** EP-019 POST /team/vacation-requests/{requestId}/approve */
  approve(requestId: string): Observable<VacationRequestDetail> {
    return this.http.post<VacationRequestDetail>(
      `${this.apiBaseUrl}/team/vacation-requests/${encodeURIComponent(requestId)}/approve`,
      {}
    );
  }

  /** EP-020 POST /team/vacation-requests/{requestId}/reject */
  reject(
    requestId: string,
    body: RejectionRequest
  ): Observable<VacationRequestDetail> {
    return this.http.post<VacationRequestDetail>(
      `${this.apiBaseUrl}/team/vacation-requests/${encodeURIComponent(requestId)}/reject`,
      body
    );
  }
}
