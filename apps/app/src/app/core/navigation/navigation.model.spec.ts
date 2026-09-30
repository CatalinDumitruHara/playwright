import { ALL_ROLES } from '../auth/session.model';
import { APP_NAV_ITEMS, NavItem, navItemsForRole } from './navigation.model';

describe('navigation.model', () => {
  const catalog: NavItem[] = [
    { label: 'A', path: '/a', roles: ['ROL-001'], shortcut: false },
    { label: 'B', path: '/b', roles: ['ROL-002', 'ROL-003'], shortcut: false },
  ];

  describe('navItemsForRole', () => {
    it('devuelve [] si el rol es null', () => {
      expect(navItemsForRole(catalog, null)).toEqual([]);
    });

    it('devuelve [] si el rol es undefined', () => {
      expect(navItemsForRole(catalog, undefined)).toEqual([]);
    });

    it('AC-PERM-04: ROL-001 solo ve /a', () => {
      expect(navItemsForRole(catalog, 'ROL-001').map((i) => i.path)).toEqual(['/a']);
    });

    it('AC-PERM-04: ROL-003 solo ve /b', () => {
      expect(navItemsForRole(catalog, 'ROL-003').map((i) => i.path)).toEqual(['/b']);
    });

    it('AC-PERM-04: ROL-002 solo ve /b', () => {
      expect(navItemsForRole(catalog, 'ROL-002').map((i) => i.path)).toEqual(['/b']);
    });
  });

  describe('APP_NAV_ITEMS', () => {
    it.each(ALL_ROLES)('incluye /inicio para %s', (role) => {
      expect(navItemsForRole(APP_NAV_ITEMS, role).map((i) => i.path)).toContain('/inicio');
    });

    it.each(ALL_ROLES)('incluye las tres pantallas de la sección Auth para %s', (role) => {
      const paths = navItemsForRole(APP_NAV_ITEMS, role).map((i) => i.path);
      expect(paths).toEqual(
        expect.arrayContaining([
          '/acceso/credencial-caducada',
          '/avisos/permisos-actualizados',
          '/avisos/version-no-soportada',
        ])
      );
    });
  });
});
