import { Route } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { authGuard } from './core/auth/auth.guard';
import { roleGuardChild } from './core/auth/role.guard';
import { ALL_ROLES, RoleCode } from './core/auth/session.model';

const INCIDENT_ROLES: readonly RoleCode[] = ['ROL-001', 'ROL-002'];
const TECHNICIAN_ROLES: readonly RoleCode[] = ['ROL-002'];

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
        path: 'incidencias/nueva',
        data: { roles: INCIDENT_ROLES },
        loadComponent: () =>
          import(
            './features/report-incident/pages/report-incident/report-incident.page'
          ).then((p) => p.ReportIncidentPage),
      },
      {
        path: 'incidencias/nueva/confirmacion',
        data: { roles: INCIDENT_ROLES },
        loadComponent: () =>
          import(
            './features/report-incident/pages/report-incident-confirmation/report-incident-confirmation.page'
          ).then((p) => p.ReportIncidentConfirmationPage),
      },
      {
        path: 'incidencias/no-encontrada',
        data: { roles: INCIDENT_ROLES },
        loadComponent: () =>
          import(
            './features/my-incidents/pages/incident-not-found/incident-not-found.page'
          ).then((p) => p.IncidentNotFoundPage),
      },
      {
        path: 'incidencias/mias',
        data: { roles: INCIDENT_ROLES },
        loadComponent: () =>
          import(
            './features/my-incidents/pages/my-incidents-list/my-incidents-list.page'
          ).then((p) => p.MyIncidentsListPage),
      },
      {
        path: 'incidencias/:id/historial-estados',
        data: { roles: INCIDENT_ROLES },
        loadComponent: () =>
          import(
            './features/my-incidents/pages/incident-history/incident-history.page'
          ).then((p) => p.IncidentHistoryPage),
      },
      {
        path: 'incidencias/:id/foto',
        data: { roles: INCIDENT_ROLES },
        loadComponent: () =>
          import(
            './features/my-incidents/pages/incident-photo/incident-photo.page'
          ).then((p) => p.IncidentPhotoPage),
      },
      {
        path: 'incidencias',
        data: { roles: TECHNICIAN_ROLES },
        loadComponent: () =>
          import(
            './features/incident-tray/pages/incident-tray/incident-tray.page'
          ).then((p) => p.IncidentTrayPage),
      },
      {
        path: 'incidencias/:id/reasignar',
        data: { roles: TECHNICIAN_ROLES },
        loadComponent: () =>
          import(
            './features/incident-tray/pages/reassign/reassign.page'
          ).then((p) => p.ReassignIncidentPage),
      },
      {
        path: 'incidencias/:id/liberar',
        data: { roles: TECHNICIAN_ROLES },
        loadComponent: () =>
          import(
            './features/incident-tray/pages/release/release.page'
          ).then((p) => p.ReleaseIncidentPage),
      },
      {
        path: 'incidencias/:id/historial/asignaciones',
        data: { roles: TECHNICIAN_ROLES },
        loadComponent: () =>
          import(
            './features/incident-tray/pages/assignment-history/assignment-history.page'
          ).then((p) => p.AssignmentHistoryPage),
      },
      {
        path: 'incidencias/:id/iniciar-atencion',
        data: { roles: TECHNICIAN_ROLES },
        loadComponent: () =>
          import(
            './features/incident-tray/pages/start-attention/start-attention.page'
          ).then((p) => p.StartAttentionPage),
      },
      {
        path: 'incidencias/:id/resolver',
        data: { roles: TECHNICIAN_ROLES },
        loadComponent: () =>
          import(
            './features/incident-tray/pages/resolve/resolve.page'
          ).then((p) => p.ResolveIncidentPage),
      },
      {
        path: 'incidencias/:id/ciclo-vida',
        data: { roles: TECHNICIAN_ROLES },
        loadComponent: () =>
          import(
            './features/incident-tray/pages/lifecycle/lifecycle.page'
          ).then((p) => p.LifecyclePage),
      },
      {
        path: 'incidencias/:id',
        data: { roles: TECHNICIAN_ROLES },
        loadComponent: () =>
          import(
            './features/incident-tray/pages/tray-incident-detail/tray-incident-detail.page'
          ).then((p) => p.TrayIncidentDetailPage),
      },
      {
        path: 'mis-incidencias',
        data: { roles: INCIDENT_ROLES },
        loadComponent: () =>
          import(
            './features/my-incidents/pages/my-incidents-list/my-incidents-list.page'
          ).then((p) => p.MyIncidentsListPage),
      },
      {
        path: 'mis-incidencias/:id',
        data: { roles: INCIDENT_ROLES },
        loadComponent: () =>
          import(
            './features/my-incidents/pages/incident-detail/incident-detail.page'
          ).then((p) => p.IncidentDetailPage),
      },
      {
        path: 'mis-incidencias/:id/historial',
        data: { roles: INCIDENT_ROLES },
        loadComponent: () =>
          import(
            './features/my-incidents/pages/incident-history/incident-history.page'
          ).then((p) => p.IncidentHistoryPage),
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
