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
      // TSK-010 · Portal de Gestión de Vacaciones — empleado y manager (ROL-001, ROL-002)
      {
        path: 'solicitudes',
        canActivate: [roleGuard],
        data: { roles: ['ROL-001', 'ROL-002'] },
        children: [
          {
            path: '',
            loadComponent: () =>
              import(
                './features/vacations/pages/my-vacation-requests/my-vacation-requests.page'
              ).then((p) => p.MyVacationRequestsPage),
          },
          {
            path: 'nueva',
            loadComponent: () =>
              import(
                './features/vacations/pages/vacation-request-new/vacation-request-new.page'
              ).then((p) => p.VacationRequestNewPage),
          },
          {
            path: 'nueva/confirmacion',
            loadComponent: () =>
              import(
                './features/vacations/pages/vacation-request-confirmation/vacation-request-confirmation.page'
              ).then((p) => p.VacationRequestConfirmationPage),
          },
          {
            path: ':id',
            loadComponent: () =>
              import(
                './features/vacations/pages/vacation-request-detail/vacation-request-detail.page'
              ).then((p) => p.VacationRequestDetailPage),
          },
          {
            path: ':id/cancelar',
            loadComponent: () =>
              import(
                './features/vacations/pages/vacation-request-cancel/vacation-request-cancel.page'
              ).then((p) => p.VacationRequestCancelPage),
          },
        ],
      },
      // TSK-010 · Gestión de equipo (ROL-002)
      {
        path: 'equipo',
        canActivate: [roleGuard],
        data: { roles: ['ROL-002'] },
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/team/pages/my-team/my-team.page').then(
                (p) => p.MyTeamPage
              ),
          },
          {
            path: 'solicitudes',
            loadComponent: () =>
              import(
                './features/team/pages/team-vacation-requests/team-vacation-requests.page'
              ).then((p) => p.TeamVacationRequestsPage),
          },
          {
            path: 'solicitudes/:id',
            loadComponent: () =>
              import(
                './features/team/pages/team-vacation-request-detail/team-vacation-request-detail.page'
              ).then((p) => p.TeamVacationRequestDetailPage),
          },
          {
            path: 'solicitudes/:id/rechazar',
            loadComponent: () =>
              import(
                './features/team/pages/team-vacation-request-reject/team-vacation-request-reject.page'
              ).then((p) => p.TeamVacationRequestRejectPage),
          },
          {
            path: 'informes',
            loadComponent: () =>
              import(
                './features/team/pages/monthly-report-export/monthly-report-export.page'
              ).then((p) => p.MonthlyReportExportPage),
          },
        ],
      },
      // TSK-010 · Administración (ROL-003)
      {
        path: 'admin',
        canActivate: [roleGuard],
        data: { roles: ['ROL-003'] },
        children: [
          {
            path: '',
            redirectTo: 'usuarios',
            pathMatch: 'full',
          },
          {
            path: 'usuarios',
            loadComponent: () =>
              import('./features/admin/pages/admin-users/admin-users.page').then(
                (p) => p.AdminUsersPage
              ),
          },
          {
            path: 'usuarios/nuevo',
            loadComponent: () =>
              import(
                './features/admin/pages/admin-user-new/admin-user-new.page'
              ).then((p) => p.AdminUserNewPage),
          },
          {
            path: 'usuarios/:id',
            loadComponent: () =>
              import(
                './features/admin/pages/admin-user-detail/admin-user-detail.page'
              ).then((p) => p.AdminUserDetailPage),
          },
          {
            path: 'jerarquia',
            loadComponent: () =>
              import(
                './features/admin/pages/admin-hierarchy/admin-hierarchy.page'
              ).then((p) => p.AdminHierarchyPage),
          },
        ],
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
