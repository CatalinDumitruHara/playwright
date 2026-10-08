import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  HierarchyList,
  HierarchyNodeDetail,
  ManagerAssignmentRequest,
} from '@api-types';
import { ENVIRONMENT_CONFIG } from '@mapfre-tech/ngx-multienvironment/core';

@Injectable({
  providedIn: 'root',
})
export class AdminHierarchyApiService {
  private http = inject(HttpClient);
  private environment = inject(ENVIRONMENT_CONFIG);
  private apiBaseUrl = this.environment['apiBaseUrl'] as string;

  /** EP-006 GET /admin/hierarchy */
  list(page = 1, size = 20): Observable<HierarchyList> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<HierarchyList>(`${this.apiBaseUrl}/admin/hierarchy`, {
      params,
    });
  }

  /** EP-007 POST /admin/employees/{employeeId}/manager */
  assignManager(
    employeeId: string,
    body: ManagerAssignmentRequest
  ): Observable<HierarchyNodeDetail> {
    return this.http.post<HierarchyNodeDetail>(
      `${this.apiBaseUrl}/admin/employees/${encodeURIComponent(employeeId)}/manager`,
      body
    );
  }

  /** EP-008 PUT /admin/employees/{employeeId}/manager */
  changeManager(
    employeeId: string,
    body: ManagerAssignmentRequest
  ): Observable<HierarchyNodeDetail> {
    return this.http.put<HierarchyNodeDetail>(
      `${this.apiBaseUrl}/admin/employees/${encodeURIComponent(employeeId)}/manager`,
      body
    );
  }

  /** EP-009 DELETE /admin/employees/{employeeId}/manager (204) */
  removeManager(employeeId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiBaseUrl}/admin/employees/${encodeURIComponent(employeeId)}/manager`
    );
  }
}
