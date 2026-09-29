import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthenticationService } from './authentication.service';
import { map } from 'rxjs';

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
    })
  );
};
