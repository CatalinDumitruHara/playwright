import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Clone the request and add the authorization header
  const authToken = 'dummy-auth-token'; // Replace with actual token retrieval logic
  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  // Pass the cloned request to the next handler
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Redirect to the login page
        console.log('Redirecting to login page...');
        // In a real app, you would use the Router to navigate
        // this.router.navigate(['/login']);
      } else if (error.status === 403) {
        // Redirect to the unauthorized page
        console.log('Redirecting to unauthorized page...');
        // In a real app, you would use the Router to navigate
        // this.router.navigate(['/unauthorized']);
      }
      return throwError(() => error);
    })
  );
};
