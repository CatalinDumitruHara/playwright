import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
import { Router } from '@angular/router';
import {
  SessionContext,
  LoginRequest,
  SessionDetail,
  ChangePasswordForcedRequest,
  ChangePasswordRequest,
} from '@api-types';
import { ENVIRONMENT_CONFIG } from '@mapfre-tech/ngx-multienvironment/core';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private environment = inject(ENVIRONMENT_CONFIG);
  private apiBaseUrl = this.environment['apiBaseUrl'] as string;
  private session: SessionDetail | null = null;

  login(loginRequest: LoginRequest): Observable<SessionDetail> {
    return this.http
      .post<SessionDetail>(`${this.apiBaseUrl}/auth/sessions`, loginRequest)
      .pipe(
        tap((sessionDetail: SessionDetail) => {
          this.session = sessionDetail;
          localStorage.setItem('sessionToken', sessionDetail.token);
        })
      );
  }

  changePasswordForced(
    changePasswordForcedRequest: ChangePasswordForcedRequest
  ): Observable<void> {
    return this.http.put<void>(
      `${this.apiBaseUrl}/auth/initial-password`,
      changePasswordForcedRequest
    );
  }

  changePassword(
    changePasswordRequest: ChangePasswordRequest
  ): Observable<void> {
    return this.http.put<void>(
      `${this.apiBaseUrl}/auth/password`,
      changePasswordRequest
    );
  }

  logout(): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/auth/sessions/current`).pipe(
      tap(() => {
        localStorage.removeItem('sessionToken');
        this.session = null;
        this.router.navigate(['/login']);
      })
    );
  }

  getSession(): SessionDetail | null {
    return this.session;
  }

  isAuthenticated(): boolean {
    return !!this.session;
  }

  getSessionContext(): Observable<SessionContext | null> {
    return this.http.get<SessionDetail>(`${this.apiBaseUrl}/auth/sessions/current`).pipe(
      tap(sessionDetail => {
        this.session = sessionDetail;
        localStorage.setItem('sessionToken', sessionDetail.token);
      }),
      map(sessionDetail => sessionDetail as unknown as SessionContext)
    );
  }

  sessionContext(): SessionContext | null {
    return this.session as unknown as SessionContext;
  }

  hasRole(role: string): boolean {
    if (!this.session) {
      return false;
    }
    return (this.session as unknown as SessionContext).user.role === role;
  }
}
