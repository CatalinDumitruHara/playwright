import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthenticationService } from './authentication.service';
import { catchError, map, of } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthenticationService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    const session = authService.getSession();
    if (session?.must_change_password) {
      router.navigate(['/acceso/cambio-obligatorio-contrasena']);
      return false;
    }
    return true;
  }

  return authService.getSessionContext().pipe(
    map(sessionContext => {
      if (sessionContext) {
        const session = authService.getSession();
        if (session?.must_change_password) {
          router.navigate(['/acceso/cambio-obligatorio-contrasena']);
          return false;
        }
        return true;
      }
      router.navigate(['/acceso']);
      return false;
    }),
    // Sin sesión en servidor (401) o API caída: al formulario de acceso, nunca una pantalla en blanco.
    catchError(() => of(router.createUrlTree(['/acceso'])))
  );
};
