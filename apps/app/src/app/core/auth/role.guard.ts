import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthenticationService } from './authentication.service';
import { RoleCode, isInternalPath } from './session.model';

export const roleGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthenticationService);
  const router = inject(Router);

  const deny = () =>
    router.createUrlTree(['/acceso-no-autorizado'], {
      queryParams: { ruta: state.url },
    });

  const roles = route.data?.['roles'] as readonly RoleCode[] | undefined;
  if (!Array.isArray(roles) || roles.length === 0) {
    return deny();
  }

  if (auth.hasAnyRole(roles)) {
    return true;
  }

  if (!auth.isAuthenticated() && isInternalPath(state.url)) {
    return router.createUrlTree(['/acceso'], {
      queryParams: { returnUrl: state.url },
    });
  }

  return deny();
};

export const roleGuardChild: CanActivateChildFn = (route, state) =>
  roleGuard(route, state);
