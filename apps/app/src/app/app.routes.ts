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
        path: 'home',
        loadComponent: () =>
          import('./features/auth/pages/home/home.page').then(
            (c) => c.HomePage
          ),
      },
      {
        path: 'profile/my-profile',
        loadComponent: () =>
          import('./features/profile/pages/my-profile/my-profile.page').then(
            (p) => p.MyProfilePage
          ),
      },
      {
        path: 'profile/change-password',
        loadComponent: () =>
          import(
            './features/profile/pages/change-password/change-password.page'
          ).then((p) => p.ChangePasswordPage),
      },
      {
        path: 'profile/change-password-confirmation',
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
      {
        path: 'admin',
        loadComponent: () =>
          import('./pages/welcome/welcome.page').then((p) => p.WelcomePage), // Placeholder
        canActivate: [roleGuard],
        data: { roles: ['ROL-003'] },
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
      {
        path: 'inicio',
        loadComponent: () =>
          import(
            './features/user/pages/role-initial-page/role-initial-page.page'
          ).then((p) => p.RoleInitialPage),
      },
    ],
  },
  {
    path: 'acceso/login',
    loadComponent: () =>
      import('./features/auth/pages/login/login.page').then(
        (p) => p.LoginPage
      ),
  },
  {
    path: 'acceso/change-password-forced',
    loadComponent: () =>
      import(
        './features/auth/pages/change-password-forced/change-password-forced.page'
      ).then((p) => p.ChangePasswordForcedPage),
  },
  {
    path: 'acceso/expired-credential',
    loadComponent: () =>
      import(
        './features/auth/pages/expired-credential/expired-credential.page'
      ).then((p) => p.ExpiredCredentialPage),
  },
  {
    path: 'acceso/account-locked',
    loadComponent: () =>
      import('./features/auth/pages/account-locked/account-locked.page').then(
        (p) => p.AccountLockedPage
      ),
  },
  {
    path: 'acceso/permissions-changed',
    loadComponent: () =>
      import(
        './features/auth/pages/permissions-changed/permissions-changed.page'
      ).then((p) => p.PermissionsChangedPage),
  },
  {
    path: 'acceso/sesion-finalizada',
    loadComponent: () =>
      import('./features/auth/pages/session-ended/session-ended.page').then(
        (p) => p.SessionEndedPage
      ),
  },
  {
    path: 'acceso-no-autorizado',
    loadComponent: () =>
      import('./pages/unauthorized-access/unauthorized-access.page').then(
        (p) => p.UnauthorizedAccessPage
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
