import { Route } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { authGuard } from './core/auth/auth.guard';
import { roleGuardChild } from './core/auth/role.guard';
import { ALL_ROLES } from './core/auth/session.model';

export const appRoutes: Route[] = [
  {
    path: 'acceso',
    loadComponent: () =>
      import('./features/auth/pages/login/login.page').then(
        (p) => p.LoginPage
      ),
  },
  {
    path: 'acceso/cambio-obligatorio-contrasena',
    loadComponent: () =>
      import(
        './features/auth/pages/change-password-forced/change-password-forced.page'
      ).then((p) => p.ChangePasswordForcedPage),
  },
  {
    path: 'acceso/credencial-caducada',
    loadComponent: () =>
      import(
        './features/auth/pages/expired-credential/expired-credential.page'
      ).then((p) => p.ExpiredCredentialPage),
  },
  {
    path: 'acceso/cuenta-bloqueada',
    loadComponent: () =>
      import('./features/auth/pages/account-locked/account-locked.page').then(
        (p) => p.AccountLockedPage
      ),
  },
  {
    path: 'acceso/sesion-finalizada',
    loadComponent: () =>
      import('./features/auth/pages/session-ended/session-ended.page').then(
        (p) => p.SessionEndedPage
      ),
  },
  {
    path: 'avisos/permisos-actualizados',
    loadComponent: () =>
      import(
        './features/auth/pages/permissions-changed/permissions-changed.page'
      ).then((p) => p.PermissionsChangedPage),
  },
  {
    path: 'avisos/version-no-soportada',
    loadComponent: () =>
      import(
        './features/auth/pages/unsupported-version/unsupported-version.page'
      ).then((p) => p.UnsupportedVersionPage),
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    canActivateChild: [roleGuardChild],
    children: [
      {
        path: 'inicio',
        data: { roles: ALL_ROLES },
        loadComponent: () =>
          import('./features/auth/pages/home/home.page').then(
            (c) => c.HomePage
          ),
      },
      {
        path: 'mi-perfil',
        data: { roles: ALL_ROLES },
        loadComponent: () =>
          import('./features/profile/pages/my-profile/my-profile.page').then(
            (p) => p.MyProfilePage
          ),
      },
      {
        path: 'mi-perfil/contrasena',
        data: { roles: ALL_ROLES },
        loadComponent: () =>
          import(
            './features/profile/pages/change-password/change-password.page'
          ).then((p) => p.ChangePasswordPage),
      },
      {
        path: 'mi-perfil/contrasena/confirmacion',
        data: { roles: ALL_ROLES },
        loadComponent: () =>
          import(
            './features/profile/pages/change-password-confirmation/change-password-confirmation.page'
          ).then((p) => p.ChangePasswordConfirmationPage),
      },
      {
        path: 'acceso-no-autorizado',
        data: { roles: ALL_ROLES },
        loadComponent: () =>
          import('./pages/unauthorized-access/unauthorized-access.page').then(
            (p) => p.UnauthorizedAccessPage
          ),
      },
      {
        path: '',
        redirectTo: 'inicio',
        pathMatch: 'full',
      },
    ],
  },
  { path: '**', redirectTo: 'inicio' },
];
