import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { map } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import { CurrentUser, isInternalPath } from './session.model';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthenticationService);
  const router = inject(Router);

  const decide = (user: CurrentUser): true | UrlTree =>
    user.mustChangePassword
      ? router.createUrlTree(['/acceso/cambio-obligatorio-contrasena'])
      : true;

  const current = auth.sessionContext();
  if (auth.isAuthenticated() && current !== null) {
    return decide(current);
  }

  const loginTree = router.createUrlTree(['/acceso'], {
    queryParams:
      isInternalPath(state.url) && state.url !== '/'
        ? { returnUrl: state.url }
        : {},
  });

  return auth
    .getSessionContext()
    .pipe(map((user) => (user ? decide(user) : loginTree)));
};
