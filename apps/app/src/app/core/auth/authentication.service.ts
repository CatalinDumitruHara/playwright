import { computed, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SessionContext } from '@api-types';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  private _sessionContext = signal<SessionContext | null>(null);
  public sessionContext = this._sessionContext.asReadonly();

  constructor(private router: Router) {
    // Simulate a logged-in user for development
    if (this.isAuthenticated()) {
      this._sessionContext.set({
        user: { name: 'John Doe', email: 'john.doe@example.com' },
        permissions: ['ROL-001', 'ROL-002'],
      });
    }
  }

  logout(): void {
    // Remove the session token from local storage
    localStorage.removeItem('sessionToken');
    this._sessionContext.set(null);
    // Redirect to the login page
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    // Check if the session token exists in local storage
    return !!localStorage.getItem('sessionToken');
  }
}
