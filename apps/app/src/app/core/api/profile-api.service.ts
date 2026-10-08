import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserProfile } from '@api-types';
import { ENVIRONMENT_CONFIG } from '@mapfre-tech/ngx-multienvironment/core';

@Injectable({
  providedIn: 'root',
})
export class ProfileApiService {
  private http = inject(HttpClient);
  private environment = inject(ENVIRONMENT_CONFIG);
  private apiBaseUrl = this.environment['apiBaseUrl'] as string;

  /** EP-010 GET /profile/me */
  getMe(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiBaseUrl}/profile/me`);
  }
}
