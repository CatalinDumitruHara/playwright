import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, map } from 'rxjs';
import { Router } from '@angular/router';
// import { SessionContext } from '@api-types';

export interface SessionContext {
  user: { name: string; email: string; role_code: string; };
  permissions: string[];
}

// TODO: Move to a shared library
export interface LoginRequest {
  username: string;
  password?: string;
  temporal_password?: string;
}

export interface SessionDetail {
  token: string;
  must_change_password?: boolean;
  session_context: SessionContext;
}

export interface ChangePasswordForcedRequest {
  new_password: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private session: any | null = null;

  login(loginRequest: LoginRequest): Observable<SessionDetail> {
    return this.http
      .post<SessionDetail>(`/auth/sessions`, loginRequest)
      .pipe(
        tap((sessionDetail: SessionDetail) => {
          this.session = sessionDetail;
          localStorage.setItem('sessionToken', sessionDetail.token);
        })
      );
  }

  changePasswordForced(
    changePasswordForcedRequest: any
  ): Observable<void> {
    return this.http.put<void>(
      `/auth/initial-password`,
      changePasswordForcedRequest
    );
  }

  changePassword(
    changePasswordRequest: ChangePasswordRequest
  ): Observable<void> {
    return this.http.put<void>(
      `/auth/password`,
      changePasswordRequest
    );
  }

  logout(): Observable<void> {
    localStorage.removeItem('sessionToken');
    this.session = null;
    this.router.navigate(['/login']);
    return of(undefined);
  }

  getSession(): any | null {
    return this.session;
  }

  isAuthenticated(): boolean {
    return !!this.session;
  }

  getSessionContext(): Observable<SessionContext | null> {
    return this.http.get<SessionDetail>('/auth/sessions/current').pipe(
      tap(sessionDetail => {
        this.session = sessionDetail;
        localStorage.setItem('sessionToken', sessionDetail.token);
      }),
      map(sessionDetail => sessionDetail.session_context)
    );
  }
  
  sessionContext(): SessionContext | null {
    return this.session?.session_context || null;
  }

  hasRole(role: string): boolean {
    return this.session?.session_context.permissions.includes(role);
  }
}
