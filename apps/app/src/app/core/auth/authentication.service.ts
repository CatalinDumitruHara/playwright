import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { LoginRequest, PasswordChangeRequest } from '@api-types';
import { API_BASE_URL } from '../config/api-base-url.token';
import {
  CurrentUser,
  RoleCode,
  extractSessionToken,
  toCurrentUser,
} from './session.model';

export const SESSION_TOKEN_STORAGE_KEY = 'sessionToken';

export type InitialPasswordPayload = { new_password: string };

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  private readonly userState = signal<CurrentUser | null>(null);
  readonly currentUser = this.userState.asReadonly();
  readonly isLoggedIn = computed(() => this.userState() !== null);

  /** EP-001 POST /auth/sessions */
  login(req: LoginRequest): Observable<CurrentUser | null> {
    return this.http.post<unknown>(`${this.base}/auth/sessions`, req).pipe(
      tap((body) => {
        const token = extractSessionToken(body);
        if (token) {
          localStorage.setItem(SESSION_TOKEN_STORAGE_KEY, token);
        }
        this.userState.set(toCurrentUser(body));
      }),
      map((body) => toCurrentUser(body))
    );
  }

  /** EP-003 GET /auth/sessions/current */
  getSessionContext(): Observable<CurrentUser | null> {
    return this.http.get<unknown>(`${this.base}/auth/sessions/current`).pipe(
      map((body) => toCurrentUser(body)),
      tap((user) => {
        if (user === null) {
          this.clearSession();
        } else {
          this.userState.set(user);
        }
      }),
      catchError(() => {
        this.clearSession();
        return of(null);
      })
    );
  }

  /** EP-002 DELETE /auth/sessions/current (204). Does not navigate. */
  logout(): Observable<void> {
    return this.http
      .delete<void>(`${this.base}/auth/sessions/current`)
      .pipe(
        map(() => undefined),
        tap(() => this.clearSession()),
        catchError((err: unknown) => {
          if (err instanceof HttpErrorResponse && err.status === 401) {
            // Session no longer exists on the server: idempotent logout.
            this.clearSession();
            return of(undefined);
          }
          return throwError(() => err);
        })
      );
  }

  clearSession(): void {
    localStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
    this.userState.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(SESSION_TOKEN_STORAGE_KEY);
  }

  isAuthenticated(): boolean {
    return this.isLoggedIn();
  }

  sessionContext(): CurrentUser | null {
    return this.userState();
  }

  /** Alias of sessionContext(), kept for compatibility with existing pages. */
  getSession(): CurrentUser | null {
    return this.sessionContext();
  }

  hasRole(role: RoleCode): boolean {
    return this.userState()?.roleCode === role;
  }

  hasAnyRole(roles: readonly RoleCode[]): boolean {
    const user = this.userState();
    return user !== null && roles.includes(user.roleCode);
  }

  /** EP-005 PUT /auth/password */
  changePassword(req: PasswordChangeRequest): Observable<void> {
    return this.http.put<void>(`${this.base}/auth/password`, req);
  }

  /** EP-006 PUT /auth/initial-password */
  changePasswordForced(req: InitialPasswordPayload): Observable<void> {
    return this.http.put<void>(`${this.base}/auth/initial-password`, req);
  }
}
