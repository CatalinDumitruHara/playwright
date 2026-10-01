import { Route } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';

export const appRoutes: Route[] = [
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'inicio',
        loadComponent: () =>
          import('./features/auth/pages/home/home.page').then(
            (c) => c.HomePage
          ),
      },
      {
        path: 'mi-perfil',
        loadComponent: () =>
          import('./features/profile/pages/my-profile/my-profile.page').then(
            (p) => p.MyProfilePage
          ),
      },
      {
        path: 'mi-perfil/contrasena',
        loadComponent: () =>
          import(
            './features/profile/pages/change-password/change-password.page'
          ).then((p) => p.ChangePasswordPage),
      },
      {
        path: 'mi-perfil/contrasena/confirmacion',
        loadComponent: () =>
          import(
            './features/profile/pages/change-password-confirmation/change-password-confirmation.page'
          ).then((p) => p.ChangePasswordConfirmationPage),
      },
      {
        path: 'incidencias/nueva',
        loadComponent: () =>
          import(
            './features/report-incident/pages/report-incident/report-incident.page'
          ).then((p) => p.ReportIncidentPage),
      },
      {
        path: 'incidencias/nueva/confirmacion',
        loadComponent: () =>
          import(
            './features/report-incident/pages/report-incident-confirmation/report-incident-confirmation.page'
          ).then((p) => p.ReportIncidentConfirmationPage),
      },
      {
        path: 'incidencias/no-encontrada',
        loadComponent: () =>
          import(
            './features/my-incidents/pages/incident-not-found/incident-not-found.page'
          ).then((p) => p.IncidentNotFoundPage),
      },
      {
        path: 'incidencias/mias',
        loadComponent: () =>
          import(
            './features/my-incidents/pages/my-incidents-list/my-incidents-list.page'
          ).then((p) => p.MyIncidentsListPage),
      },
      {
        path: 'incidencias/:id/historial-estados',
        loadComponent: () =>
          import(
            './features/my-incidents/pages/incident-history/incident-history.page'
          ).then((p) => p.IncidentHistoryPage),
      },
      {
        path: 'incidencias/:id/foto',
        loadComponent: () =>
          import(
            './features/my-incidents/pages/incident-photo/incident-photo.page'
          ).then((p) => p.IncidentPhotoPage),
      },
      {
        path: 'mis-incidencias',
        loadComponent: () =>
          import(
            './features/my-incidents/pages/my-incidents-list/my-incidents-list.page'
          ).then((p) => p.MyIncidentsListPage),
      },
      {
        path: 'mis-incidencias/:id',
        loadComponent: () =>
          import(
            './features/my-incidents/pages/incident-detail/incident-detail.page'
          ).then((p) => p.IncidentDetailPage),
      },
      {
        path: 'mis-incidencias/:id/historial',
        loadComponent: () =>
          import(
            './features/my-incidents/pages/incident-history/incident-history.page'
          ).then((p) => p.IncidentHistoryPage),
      },
      {
        path: 'incidents',
        loadComponent: () =>
          import('./pages/welcome/welcome.page').then((p) => p.WelcomePage), // Placeholder
        canActivate: [roleGuard],
        data: { roles: ['ROL-002'] },
      },
      {
        path: 'admin',
        loadComponent: () =>
          import('./pages/welcome/welcome.page').then((p) => p.WelcomePage), // Placeholder
        canActivate: [roleGuard],
        data: { roles: ['ROL-003'] },
      },
      {
        path: '',
        redirectTo: 'inicio',
        pathMatch: 'full',
      },
    ],
  },
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
];
