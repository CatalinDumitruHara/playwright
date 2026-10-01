import {
  extractSessionToken,
  isInternalPath,
  normalizeRoleCode,
  toCurrentUser,
} from './session.model';

describe('session.model', () => {
  describe('normalizeRoleCode', () => {
    it.each(['ROL-001', 'ROL-002', 'ROL-003'])('keeps canonical code %s', (code) => {
      expect(normalizeRoleCode(code)).toBe(code);
    });

    it.each([
      ['EMPLEADO', 'ROL-001'],
      ['TECNICO_MANTENIMIENTO', 'ROL-002'],
      ['TECNICO-DE-MANTENIMIENTO', 'ROL-002'],
      [' administrador ', 'ROL-003'],
    ])('maps alias %p to %s', (raw, expected) => {
      expect(normalizeRoleCode(raw)).toBe(expected);
    });

    it.each([['OTRO'], [undefined], [5]])('returns null for %p', (raw) => {
      expect(normalizeRoleCode(raw)).toBeNull();
    });
  });

  describe('toCurrentUser', () => {
    it('maps a flat body with role_code EMPLEADO', () => {
      expect(
        toCurrentUser({
          user_id: 'u1',
          full_name: 'Ana Pérez',
          email: 'ana@mapfre.com',
          role_code: 'EMPLEADO',
        })
      ).toEqual({
        userId: 'u1',
        fullName: 'Ana Pérez',
        email: 'ana@mapfre.com',
        roleCode: 'ROL-001',
        roleLabel: 'Empleado',
        mustChangePassword: false,
      });
    });

    it('returns null without role_code (invalid session, REQ-010)', () => {
      expect(toCurrentUser({ user_id: 'u1', full_name: 'Ana', email: 'a@b.c' })).toBeNull();
    });

    it.each([[null], [undefined], ['texto'], [42], [[]]])('returns null for non-object %p', (raw) => {
      expect(toCurrentUser(raw)).toBeNull();
    });

    it('resolves a user nested in session_context', () => {
      const user = toCurrentUser({
        token: 't',
        session_context: { user_id: 'u2', full_name: 'Luis', email: 'l@m.com', role_code: 'ROL-003' },
      });
      expect(user).toEqual(
        expect.objectContaining({ userId: 'u2', fullName: 'Luis', roleCode: 'ROL-003', roleLabel: 'Administrador' })
      );
    });

    it('uses corporate_email as email fallback', () => {
      const user = toCurrentUser({ user_id: 'u3', role_code: 'ROL-002', corporate_email: 'c@mapfre.com' });
      expect(user?.email).toBe('c@mapfre.com');
      expect(user?.roleLabel).toBe('Técnico de mantenimiento');
    });

    it('maps must_change_password true', () => {
      expect(toCurrentUser({ role_code: 'ROL-001', must_change_password: true })?.mustChangePassword).toBe(true);
    });
  });

  describe('extractSessionToken', () => {
    it('reads token', () => {
      expect(extractSessionToken({ token: 't1' })).toBe('t1');
    });
    it('reads access_token', () => {
      expect(extractSessionToken({ access_token: 't2' })).toBe('t2');
    });
    it('returns null when no token is present', () => {
      expect(extractSessionToken({ role_code: 'ROL-001' })).toBeNull();
      expect(extractSessionToken(null)).toBeNull();
    });
  });

  describe('isInternalPath', () => {
    it('accepts /inicio', () => {
      expect(isInternalPath('/inicio')).toBe(true);
    });
    it.each([['//evil.com'], ['http://x'], ['inicio'], [null]])('rejects %p', (p) => {
      expect(isInternalPath(p)).toBe(false);
    });
  });
});
