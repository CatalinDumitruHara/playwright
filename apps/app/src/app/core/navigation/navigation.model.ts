import { InjectionToken } from '@angular/core';
import { ALL_ROLES, RoleCode } from '../auth/session.model';

/**
 * Catálogo único de navegación.
 *
 * Cada sección nueva se registra aquí con sus roles y, además, su ruta en
 * app.routes.ts con el mismo `data.roles`. El menú es solo usabilidad: la
 * autorización vinculante la hace la API.
 */
export interface NavItem {
  label: string;
  path: string;
  roles: readonly RoleCode[];
  shortcut: boolean;
  description?: string;
}

export const APP_NAV_ITEMS: readonly NavItem[] = [
  { label: 'Inicio', path: '/inicio', roles: ALL_ROLES, shortcut: false },
  {
    label: 'Mi perfil',
    path: '/mi-perfil',
    roles: ALL_ROLES,
    shortcut: true,
    description: 'Consulta tus datos y tu rol vigente',
  },
  {
    label: 'Cambiar contraseña',
    path: '/mi-perfil/contrasena',
    roles: ALL_ROLES,
    shortcut: true,
    description: 'Actualiza tu contraseña de acceso',
  },
];

export const NAV_ITEMS = new InjectionToken<readonly NavItem[]>('NAV_ITEMS', {
  providedIn: 'root',
  factory: () => APP_NAV_ITEMS,
});

export function navItemsForRole(
  items: readonly NavItem[],
  role: RoleCode | null | undefined
): NavItem[] {
  if (!role) {
    return [];
  }
  return items.filter((item) => item.roles.includes(role));
}
