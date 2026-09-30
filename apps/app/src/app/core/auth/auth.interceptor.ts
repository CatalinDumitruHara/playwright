import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Params, Router } from '@angular/router';
import { Observable, catchError, throwError } from 'rxjs';
import { API_BASE_URL } from '../config/api-base-url.token';
import { AuthenticationService } from './authentication.service';
import { isInternalPath } from './session.model';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const base = inject(API_BASE_URL);
  const auth = inject(AuthenticationService);
  const router = inject(Router);

  const isApiRequest =
    !req.url.startsWith('/assets/') &&
    (base !== ''
      ? req.url.startsWith(base + '/') || req.url === base
      : req.url.startsWith('/'));

  if (!isApiRequest) {
    return next(req);
  }

  const token = auth.getToken();
  const request = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  const isLoginRequest =
    req.method === 'POST' && req.url === `${base}/auth/sessions`;
  const isSessionContextRequest =
    req.method === 'GET' && req.url === `${base}/auth/sessions/current`;

  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && !isLoginRequest) {
        if (error.status === 401) {
          const hadUser = auth.isAuthenticated();
          auth.clearSession();
          if (!isSessionContextRequest) {
            const returnUrl = router.url;
            const qp: Params =
              isInternalPath(returnUrl) && !returnUrl.startsWith('/acceso')
                ? { returnUrl }
                : {};
            if (hadUser) {
              void router.navigate(['/acceso/sesion-finalizada'], {
                queryParams: qp,
                state: { reason: 'expired', endedAt: new Date().toISOString() },
              });
            } else {
              void router.navigate(['/acceso'], { queryParams: qp });
            }
          }
        } else if (error.status === 403) {
          void router.navigate(['/acceso-no-autorizado'], {
            queryParams: { ruta: router.url },
          });
        }
      }
      return throwError(() => error);
    })
  );
};
