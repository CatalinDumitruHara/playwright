import { InjectionToken, inject } from '@angular/core';
import { ENVIRONMENT_CONFIG } from '@mapfre-tech/ngx-multienvironment/core';

/**
 * Base URL of the API. It is servers[0].url from openapi.yaml, seeded in
 * assets/environments.json as `apiBaseUrl` (e.g. "/api"). Always a relative
 * path, never an absolute host. Trailing slashes are stripped.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => {
    const cfg = inject(ENVIRONMENT_CONFIG, { optional: true });
    const v = cfg?.['apiBaseUrl'];
    return typeof v === 'string' ? v.replace(/\/+$/, '') : '';
  },
});
