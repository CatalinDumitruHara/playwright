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
          import('./pages/welcome/welcome.page').then(p => p.WelcomePage),
      },
      {
        path: 'incidents',
        loadComponent: () =>
          import('./pages/welcome/welcome.page').then(p => p.WelcomePage), // Placeholder
        canActivate: [roleGuard],
        data: { roles: ['ROL-002'] },
      },
      {
        path: 'admin',
        loadComponent: () =>
          import('./pages/welcome/welcome.page').then(p => p.WelcomePage), // Placeholder
        canActivate: [roleGuard],
        data: { roles: ['ROL-003'] },
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/welcome/welcome.page').then(p => p.WelcomePage), // Placeholder for login page
  },
  {
    path: 'acceso-no-autorizado',
    loadComponent: () =>
      import('./pages/unauthorized-access/unauthorized-access.page').then(
        p => p.UnauthorizedAccessPage
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
