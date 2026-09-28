import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { AuthenticationService } from './authentication.service';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthenticationService);
  const router = inject(Router);

  const allowedRoles = route.data['roles'] as Array<string>;
  const userPermissions = authService.sessionContext()?.permissions ?? [];
  if (allowedRoles.some(role => userPermissions.includes(role))) {
    return true;
  }

  console.log('Redirecting to unauthorized page');
  router.navigate(['/acceso-no-autorizado']);
  return false;
};
