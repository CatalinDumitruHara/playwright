import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthenticationService } from './authentication.service';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthenticationService);
  const router = inject(Router);
  const expectedRoles = route.data['roles'] as string[];
  const userRole = authService.sessionContext()?.user.role;

  if (userRole && expectedRoles.includes(userRole)) {
    return true;
  }

  router.navigate(['/inicio']); // o a una página de "acceso denegado"
  return false;
};
