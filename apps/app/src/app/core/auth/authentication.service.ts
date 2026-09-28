
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { SessionContext } from '@api-types';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  private readonly http = inject(HttpClient);
  private readonly sessionState = new BehaviorSubject<SessionContext | null>(
    null
  );

  public readonly sessionState$ = this.sessionState.asObservable();

  public get currentSession(): SessionContext | null {
    return this.sessionState.getValue();
  }

  public getSessionContext(): Observable<SessionContext> {
    return this.http.get<SessionContext>('/auth/sessions/current').pipe(
      tap((session) => {
        this.sessionState.next(session);
      })
    );
  }
}
