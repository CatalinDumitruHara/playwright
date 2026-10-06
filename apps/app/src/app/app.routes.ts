import { Route } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { authGuard } from './core/auth/auth.guard';
import { roleGuardChild } from './core/auth/role.guard';
import { ALL_ROLES, RoleCode } from './core/auth/session.model';

const INCIDENT_ROLES: readonly RoleCode[] = ['ROL-001', 'ROL-002'];
const TECH_ROLES: readonly RoleCode[] = ['ROL-002'];

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
        path: 'incidencias/:id/cerrar',
        data: { roles: TECH_ROLES },
        loadComponent: () =>
          import(
            './features/incident-tray/pages/close-incident/close-incident.page'
          ).then((p) => p.CloseIncidentPage),
      },
      {
        path: 'incidencias/:id/cierres-similares',
        data: { roles: TECH_ROLES },
        loadComponent: () =>
          import(
            './features/incident-tray/pages/similar-closures/similar-closures.page'
          ).then((p) => p.SimilarClosuresPage),
      },
      {
        // ARC-038: el bloque de resolución lo consultan reportante y técnico (REQ-115).
        path: 'incidencias/:id/resolucion',
        data: { roles: INCIDENT_ROLES },
        loadComponent: () =>
          import(
            './features/incident-tray/pages/incident-resolution/incident-resolution.page'
          ).then((p) => p.IncidentResolutionPage),
      },
      {
        path: 'incidencias/:id/reclasificar',
        data: { roles: TECH_ROLES },
        loadComponent: () =>
          import(
            './features/incident-tray/pages/reclassify-incident/reclassify-incident.page'
          ).then((p) => p.ReclassifyIncidentPage),
      },
      {
        path: 'incidencias/:id/historial/reclasificaciones',
        data: { roles: TECH_ROLES },
        loadComponent: () =>
          import(
            './features/incident-tray/pages/reclassification-trace/reclassification-trace.page'
          ).then((p) => p.ReclassificationTracePage),
      },
      {
        // ARC-056: historial consolidado, mismo alcance que el detalle (REQ-127/151).
        path: 'incidencias/cerradas/:id/historial',
        data: { roles: INCIDENT_ROLES },
        loadComponent: () =>
          import(
            './features/incident-tray/pages/incident-timeline/incident-timeline.page'
          ).then((p) => p.IncidentTimelinePage),
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
