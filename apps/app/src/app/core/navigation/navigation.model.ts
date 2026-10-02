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
  /** Sección de menú de la spec de UI (p. ej. 'Auth'). Sin valor: menú principal. */
  section?: string;
}

/** Sección de menú de las pantallas de avisos/acceso de la spec de UI. */
export const NAV_SECTION_AUTH = 'Auth';

/** Sección de menú de incidencias (menú principal). */
export const NAV_SECTION_INCIDENTS = 'incidents';

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
  {
    label: 'Bandeja de incidencias',
    path: '/incidencias',
    roles: ['ROL-002'],
    shortcut: true,
    description: 'Consulta y gestiona todas las incidencias de la organización',
    section: NAV_SECTION_INCIDENTS,
  },
  {
    label: 'Mis incidencias',
    path: '/mis-incidencias',
    roles: ['ROL-001', 'ROL-002'],
    shortcut: true,
    description: 'Consulta el estado de las incidencias que has reportado',
    section: NAV_SECTION_INCIDENTS,
  },
  {
    label: 'Nueva incidencia',
    path: '/incidencias/nueva',
    roles: ['ROL-001', 'ROL-002'],
    shortcut: true,
    description: 'Reporta una incidencia de sala',
    section: NAV_SECTION_INCIDENTS,
  },
  {
    label: 'Credencial temporal caducada',
    path: '/acceso/credencial-caducada',
    roles: ALL_ROLES,
    shortcut: false,
    section: NAV_SECTION_AUTH,
  },
  {
    label: 'Aviso de permisos cambiados',
    path: '/avisos/permisos-actualizados',
    roles: ALL_ROLES,
    shortcut: false,
    section: NAV_SECTION_AUTH,
  },
  {
    label: 'Versión no soportada',
    path: '/avisos/version-no-soportada',
    roles: ALL_ROLES,
    shortcut: false,
    section: NAV_SECTION_AUTH,
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
