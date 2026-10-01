import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthenticationService } from './authentication.service';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthenticationService);
  const router = inject(Router);
  const sessionToken = localStorage.getItem('sessionToken');

  let clonedRequest = req;

  if (authService.isAuthenticated() && sessionToken) {
    clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${sessionToken}`,
      },
    });
  }

  return next(clonedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();
        router.navigate(['/acceso']);
      } else if (error.status === 403) {
        router.navigate(['/acceso-no-autorizado']);
      }
      return throwError(() => error);
    })
  );
};
