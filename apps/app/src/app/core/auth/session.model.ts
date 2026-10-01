/**
 * Session model mapped from raw API bodies.
 *
 * The openapi contract declares SessionContext/SessionDetail as placeholders
 * without fields and libs/api-types does not export them, so raw bodies are
 * treated as `unknown` and mapped here (fields from REQ-059, snake_case).
 */

export type RoleCode = 'ROL-001' | 'ROL-002' | 'ROL-003';

export const ALL_ROLES: readonly RoleCode[] = ['ROL-001', 'ROL-002', 'ROL-003'];

export const ROLE_LABELS: Record<RoleCode, string> = {
  'ROL-001': 'Empleado',
  'ROL-002': 'Técnico de mantenimiento',
  'ROL-003': 'Administrador',
};

const ROLE_ALIASES: Record<string, RoleCode> = {
  'ROL-001': 'ROL-001',
  'ROL-002': 'ROL-002',
  'ROL-003': 'ROL-003',
  EMPLEADO: 'ROL-001',
  TECNICO_MANTENIMIENTO: 'ROL-002',
  'TECNICO-DE-MANTENIMIENTO': 'ROL-002',
  TECNICO_DE_MANTENIMIENTO: 'ROL-002',
  ADMINISTRADOR: 'ROL-003',
};

export function normalizeRoleCode(raw: unknown): RoleCode | null {
  if (typeof raw !== 'string') {
    return null;
  }
  const key = raw.trim().toUpperCase();
  return Object.prototype.hasOwnProperty.call(ROLE_ALIASES, key)
    ? ROLE_ALIASES[key]
    : null;
}

export interface CurrentUser {
  userId: string;
  fullName: string;
  email: string;
  roleCode: RoleCode;
  roleLabel: string;
  mustChangePassword: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asText(value: unknown): string {
  return value === undefined || value === null ? '' : String(value);
}

function pickUserRecord(raw: Record<string, unknown>): Record<string, unknown> {
  if (raw['role_code'] !== undefined) {
    return raw;
  }
  for (const key of ['session_context', 'user']) {
    const nested = raw[key];
    if (isRecord(nested) && nested['role_code'] !== undefined) {
      return nested;
    }
  }
  return raw;
}

export function toCurrentUser(raw: unknown): CurrentUser | null {
  if (!isRecord(raw)) {
    return null;
  }
  const src = pickUserRecord(raw);
  // REQ-010: a session without a valid role is invalid.
  const roleCode = normalizeRoleCode(src['role_code']);
  if (roleCode === null) {
    return null;
  }
  const email =
    src['email'] !== undefined && src['email'] !== null
      ? src['email']
      : src['corporate_email'];
  return {
    userId: asText(src['user_id']),
    fullName: asText(src['full_name']),
    email: asText(email),
    roleCode,
    roleLabel: ROLE_LABELS[roleCode],
    mustChangePassword: src['must_change_password'] === true,
  };
}

export function extractSessionToken(raw: unknown): string | null {
  if (!isRecord(raw)) {
    return null;
  }
  for (const key of ['token', 'access_token', 'session_token']) {
    const value = raw[key];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }
  return null;
}

export function isInternalPath(path: unknown): path is string {
  return (
    typeof path === 'string' &&
    path.startsWith('/') &&
    !path.startsWith('//') &&
    !path.includes('://')
  );
}
