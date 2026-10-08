import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  UserCreateRequest,
  UserDetail,
  UserList,
  UserStatusUpdateRequest,
  UserUpdateRequest,
} from '@api-types';
import { ENVIRONMENT_CONFIG } from '@mapfre-tech/ngx-multienvironment/core';

@Injectable({
  providedIn: 'root',
})
export class AdminUsersApiService {
  private http = inject(HttpClient);
  private environment = inject(ENVIRONMENT_CONFIG);
  private apiBaseUrl = this.environment['apiBaseUrl'] as string;

  /** EP-001 GET /admin/users */
  list(page = 1, size = 20): Observable<UserList> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<UserList>(`${this.apiBaseUrl}/admin/users`, {
      params,
    });
  }

  /** EP-002 POST /admin/users */
  create(body: UserCreateRequest): Observable<UserDetail> {
    return this.http.post<UserDetail>(`${this.apiBaseUrl}/admin/users`, body);
  }

  /** EP-003 GET /admin/users/{userId} */
  getById(userId: string): Observable<UserDetail> {
    return this.http.get<UserDetail>(
      `${this.apiBaseUrl}/admin/users/${encodeURIComponent(userId)}`
    );
  }

  /** EP-004 PUT /admin/users/{userId} */
  update(userId: string, body: UserUpdateRequest): Observable<UserDetail> {
    return this.http.put<UserDetail>(
      `${this.apiBaseUrl}/admin/users/${encodeURIComponent(userId)}`,
      body
    );
  }

  /** EP-005 PATCH /admin/users/{userId}/status */
  updateStatus(
    userId: string,
    body: UserStatusUpdateRequest
  ): Observable<UserDetail> {
    return this.http.patch<UserDetail>(
      `${this.apiBaseUrl}/admin/users/${encodeURIComponent(userId)}/status`,
      body
    );
  }
}
