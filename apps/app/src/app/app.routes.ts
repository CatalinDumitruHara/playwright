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
        path: 'incidents',
        loadComponent: () =>
          import('./pages/welcome/welcome.page').then((p) => p.WelcomePage), // Placeholder
        canActivate: [roleGuard],
        data: { roles: ['ROL-002'] },
      },
      // TSK-010 · Portal de Gestión de Vacaciones — rutas de T.5/B.7 (ARC-029..ARC-052)
      {
        path: 'solicitudes',
        canActivate: [roleGuard],
        data: { roles: ['ROL-001', 'ROL-002'] },
        loadComponent: () =>
          import('./features/vacations/pages/my-vacation-requests/my-vacation-requests.page').then((p) => p.MyVacationRequestsPage),
      },
      {
        path: 'solicitudes/nueva',
        canActivate: [roleGuard],
        data: { roles: ['ROL-001', 'ROL-002'] },
        loadComponent: () =>
          import('./features/vacations/pages/vacation-request-new/vacation-request-new.page').then((p) => p.VacationRequestNewPage),
      },
      {
        path: 'solicitudes/nueva/confirmacion',
        canActivate: [roleGuard],
        data: { roles: ['ROL-001', 'ROL-002'] },
        loadComponent: () =>
          import('./features/vacations/pages/vacation-request-confirmation/vacation-request-confirmation.page').then((p) => p.VacationRequestConfirmationPage),
      },
      {
        path: 'solicitudes/:id',
        canActivate: [roleGuard],
        data: { roles: ['ROL-001', 'ROL-002'] },
        loadComponent: () =>
          import('./features/vacations/pages/vacation-request-detail/vacation-request-detail.page').then((p) => p.VacationRequestDetailPage),
      },
      {
        path: 'solicitudes/:id/cancelar',
        canActivate: [roleGuard],
        data: { roles: ['ROL-001', 'ROL-002'] },
        loadComponent: () =>
          import('./features/vacations/pages/vacation-request-cancel/vacation-request-cancel.page').then((p) => p.VacationRequestCancelPage),
      },
      {
        path: 'equipo/solicitudes',
        canActivate: [roleGuard],
        data: { roles: ['ROL-002'] },
        loadComponent: () =>
          import('./features/team/pages/team-vacation-requests/team-vacation-requests.page').then((p) => p.TeamVacationRequestsPage),
      },
      {
        path: 'equipo/solicitudes/gestion-confirmada',
        canActivate: [roleGuard],
        data: { roles: ['ROL-002'] },
        loadComponent: () =>
          import('./features/team/pages/team-request-managed/team-request-managed.page').then((p) => p.TeamRequestManagedPage),
      },
      {
        path: 'equipo/solicitudes/:id',
        canActivate: [roleGuard],
        data: { roles: ['ROL-002'] },
        loadComponent: () =>
          import('./features/team/pages/team-vacation-request-detail/team-vacation-request-detail.page').then((p) => p.TeamVacationRequestDetailPage),
      },
      {
        path: 'equipo/solicitudes/:id/rechazar',
        canActivate: [roleGuard],
        data: { roles: ['ROL-002'] },
        loadComponent: () =>
          import('./features/team/pages/team-vacation-request-reject/team-vacation-request-reject.page').then((p) => p.TeamVacationRequestRejectPage),
      },
      {
        path: 'informes/exportar',
        canActivate: [roleGuard],
        data: { roles: ['ROL-002'] },
        loadComponent: () =>
          import('./features/team/pages/monthly-report-export/monthly-report-export.page').then((p) => p.MonthlyReportExportPage),
      },
      {
        path: 'informes',
        canActivate: [roleGuard],
        data: { roles: ['ROL-002'] },
        loadComponent: () =>
          import('./features/team/pages/export-history/export-history.page').then((p) => p.ExportHistoryPage),
      },
      {
        path: 'profile',
        canActivate: [roleGuard],
        data: { roles: ['ROL-001', 'ROL-002'] },
        loadComponent: () =>
          import('./features/profile/pages/user-profile/user-profile.page').then((p) => p.UserProfilePage),
      },
      {
        path: 'my-team',
        canActivate: [roleGuard],
        data: { roles: ['ROL-002'] },
        loadComponent: () =>
          import('./features/team/pages/my-team/my-team.page').then((p) => p.MyTeamPage),
      },
      {
        path: 'admin/users',
        canActivate: [roleGuard],
        data: { roles: ['ROL-003'] },
        loadComponent: () =>
          import('./features/admin/pages/admin-users/admin-users.page').then((p) => p.AdminUsersPage),
      },
      {
        path: 'admin/users/new',
        canActivate: [roleGuard],
        data: { roles: ['ROL-003'] },
        loadComponent: () =>
          import('./features/admin/pages/admin-user-new/admin-user-new.page').then((p) => p.AdminUserNewPage),
      },
      {
        path: 'admin/users/:userId/edit',
        canActivate: [roleGuard],
        data: { roles: ['ROL-003'] },
        loadComponent: () =>
          import('./features/admin/pages/admin-user-edit/admin-user-edit.page').then((p) => p.AdminUserEditPage),
      },
      {
        path: 'admin/users/:userId/deactivate',
        canActivate: [roleGuard],
        data: { roles: ['ROL-003'] },
        loadComponent: () =>
          import('./features/admin/pages/admin-user-deactivate/admin-user-deactivate.page').then((p) => p.AdminUserDeactivatePage),
      },
      {
        path: 'admin/users/:userId/reactivate',
        canActivate: [roleGuard],
        data: { roles: ['ROL-003'] },
        loadComponent: () =>
          import('./features/admin/pages/admin-user-reactivate/admin-user-reactivate.page').then((p) => p.AdminUserReactivatePage),
      },
      {
        path: 'admin/users/:userId/assign-manager',
        canActivate: [roleGuard],
        data: { roles: ['ROL-003'] },
        loadComponent: () =>
          import('./features/admin/pages/admin-assign-manager/admin-assign-manager.page').then((p) => p.AdminAssignManagerPage),
      },
      {
        path: 'admin/users/:userId/change-manager',
        canActivate: [roleGuard],
        data: { roles: ['ROL-003'] },
        loadComponent: () =>
          import('./features/admin/pages/admin-change-manager/admin-change-manager.page').then((p) => p.AdminChangeManagerPage),
      },
      {
        path: 'admin/users/:userId/change-manager/confirm',
        canActivate: [roleGuard],
        data: { roles: ['ROL-003'] },
        loadComponent: () =>
          import('./features/admin/pages/admin-change-manager-confirm/admin-change-manager-confirm.page').then((p) => p.AdminChangeManagerConfirmPage),
      },
      {
        path: 'admin/users/:userId/unassign-manager',
        canActivate: [roleGuard],
        data: { roles: ['ROL-003'] },
        loadComponent: () =>
          import('./features/admin/pages/admin-unassign-manager/admin-unassign-manager.page').then((p) => p.AdminUnassignManagerPage),
      },
      {
        path: 'admin/organization/structure',
        canActivate: [roleGuard],
        data: { roles: ['ROL-003'] },
        loadComponent: () =>
          import('./features/admin/pages/admin-hierarchy/admin-hierarchy.page').then((p) => p.AdminHierarchyPage),
      },
      {
        path: 'admin',
        redirectTo: 'admin/users',
        pathMatch: 'full',
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
