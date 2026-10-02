import { IncidentDetail, IncidentHistoryPage, IncidentListPage } from '@api-types';
import { statusLabel } from '../my-incidents/my-incidents.models';

export const TRAY_SORT_BY = [
  'created_at',
  'updated_at',
  'status',
  'room_name',
  'category_name',
  'age_days',
] as const;
export type TraySortBy = (typeof TRAY_SORT_BY)[number];
export const DEFAULT_TRAY_SORT_BY: TraySortBy = 'created_at';

export const TRAY_SORT_DIRS = ['ASC', 'DESC'] as const;
export type TraySortDir = (typeof TRAY_SORT_DIRS)[number];
export const DEFAULT_TRAY_SORT_DIR: TraySortDir = 'DESC';

export const TRAY_PAGE_SIZES = [10, 25, 50] as const;
export type TrayPageSize = (typeof TRAY_PAGE_SIZES)[number];
export const DEFAULT_TRAY_PAGE_SIZE: TrayPageSize = 25;

export const SEARCH_TEXT_MIN = 3;
export const SEARCH_TEXT_MAX = 100;

export const ASSIGNMENT_FILTERS = [
  { code: 'TODAS', label: 'Todas' },
  { code: 'SIN_ASIGNAR', label: 'Sin asignar' },
  { code: 'ASIGNADAS_A_MI', label: 'Asignadas a mí' },
  { code: 'ASIGNADAS_A_OTRO', label: 'Asignadas a otro técnico' },
] as const;
export type AssignmentFilter = (typeof ASSIGNMENT_FILTERS)[number]['code'];

export const UNASSIGNED_LABEL = 'Sin asignar';

export interface TrayQuery {
  room_id?: string[];
  office_id?: string;
  category_code?: string[];
  status?: string[];
  assignment_filter?: AssignmentFilter;
  assigned_technician_id?: string | number;
  created_from?: string;
  created_to?: string;
  search_text?: string;
  sort_by?: TraySortBy;
  sort_dir?: TraySortDir;
  page?: number;
  page_size?: number;
}

export interface TrayRow {
  incidentId: string;
  incidentCode: string;
  roomName: string;
  officeName: string;
  categoryName: string;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
  ageDays: number | null;
  reporterName: string;
  assignedTechnicianName: string | null;
  hasPhoto: boolean;
}

export interface TrayPage {
  items: TrayRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AvailableTransition {
  toStatus: string;
  label: string;
  requiresComment: boolean;
  blockedReason: string | null;
}

export interface TrayIncidentDetail extends TrayRow {
  description: string;
  statusLabel: string;
  statusChangedAt: string | null;
  assignmentStatus: string;
  assignedTechnicianId: string | null;
  assignedAt: string | null;
  releasedAt: string | null;
  openedAt: string | null;
  inProgressAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  daysInCurrentStatus: number | null;
  availableTransitions: AvailableTransition[];
}

export interface TrayHistoryEntry {
  entryType: string;
  fromStatus: string | null;
  toStatus: string | null;
  fromTechnicianName: string | null;
  toTechnicianName: string | null;
  actorName: string;
  changedAt: string;
  reason: string | null;
}

/** Cuerpo EP-032 (reasignación). */
export interface ReassignBody {
  assigned_technician_id: number;
}

/** Cuerpo EP-034 (campos de StateTransitionRequest). */
export interface TransitionBody {
  to_status: string;
  comment?: string;
}

type Rec = Record<string, unknown>;

function isRecord(v: unknown): v is Rec {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function readList(body: unknown, keys: string[]): Rec[] {
  let raw: unknown[] = [];
  if (Array.isArray(body)) {
    raw = body;
  } else if (isRecord(body)) {
    for (const k of keys) {
      if (Array.isArray(body[k])) {
        raw = body[k] as unknown[];
        break;
      }
    }
  }
  return raw.filter(isRecord);
}

function str(r: Rec, key: string): string | null {
  const v = r[key];
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  return null;
}

function num(r: Rec, key: string): number | null {
  const v = r[key];
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) {
    return Number(v);
  }
  return null;
}

function bool(r: Rec, key: string): boolean {
  const v = r[key];
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return v.toLowerCase() === 'true';
  if (typeof v === 'number') return v !== 0;
  return false;
}

function nonEmpty(v: string | null): string | null {
  return v !== null && v.trim() !== '' ? v : null;
}

function mapTrayRow(r: Rec): TrayRow {
  return {
    incidentId: String(r['incident_id'] ?? ''),
    incidentCode: str(r, 'incident_code') ?? str(r, 'reference_code') ?? '',
    roomName: str(r, 'room_name') ?? '',
    officeName: str(r, 'office_name') ?? '',
    categoryName: str(r, 'category_name') ?? str(r, 'category_code') ?? '',
    status: str(r, 'status') ?? str(r, 'status_code') ?? '',
    createdAt: str(r, 'created_at'),
    updatedAt: str(r, 'updated_at'),
    ageDays: num(r, 'age_days'),
    reporterName: str(r, 'reporter_name') ?? '',
    assignedTechnicianName: nonEmpty(str(r, 'assigned_technician_name')),
    hasPhoto: bool(r, 'has_photo'),
  };
}

export function mapTrayPage(
  body: IncidentListPage | null,
  fallbackPage: number,
  fallbackSize: number
): TrayPage {
  const r: Rec = isRecord(body) ? body : {};
  const items = readList(body, ['items']).map(mapTrayRow);
  const totalCount = num(r, 'total_count') ?? num(r, 'total') ?? items.length;
  const pageSize = num(r, 'page_size') ?? num(r, 'size') ?? fallbackSize;
  const totalPages =
    num(r, 'total_pages') ?? (pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0);
  return {
    items,
    totalCount,
    page: num(r, 'page') ?? fallbackPage,
    pageSize,
    totalPages,
  };
}

function mapTransition(r: Rec): AvailableTransition {
  const toStatus = str(r, 'to_status') ?? '';
  return {
    toStatus,
    label: str(r, 'label') ?? statusLabel(toStatus),
    requiresComment: bool(r, 'requires_comment'),
    blockedReason: nonEmpty(str(r, 'blocked_reason')),
  };
}

export function mapTrayDetail(body: IncidentDetail | null): TrayIncidentDetail {
  const r: Rec = isRecord(body) ? body : {};
  const row = mapTrayRow(r);
  const assignedTechnicianId = str(r, 'assigned_technician_id');
  const transitions = Array.isArray(r['available_transitions'])
    ? (r['available_transitions'] as unknown[]).filter(isRecord).map(mapTransition)
    : [];
  return {
    ...row,
    description: str(r, 'description') ?? '',
    statusLabel: str(r, 'status_label') ?? statusLabel(row.status),
    statusChangedAt: str(r, 'status_changed_at'),
    assignmentStatus:
      str(r, 'assignment_status') ??
      (row.assignedTechnicianName || assignedTechnicianId ? 'ASIGNADA' : 'SIN_ASIGNAR'),
    assignedTechnicianId,
    assignedAt: str(r, 'assigned_at'),
    releasedAt: str(r, 'released_at'),
    openedAt: str(r, 'opened_at') ?? str(r, 'created_at'),
    inProgressAt: str(r, 'in_progress_at'),
    resolvedAt: str(r, 'resolved_at'),
    closedAt: str(r, 'closed_at'),
    daysInCurrentStatus: num(r, 'days_in_current_status'),
    availableTransitions: transitions,
  };
}

export function mapTrayHistory(body: IncidentHistoryPage | null): TrayHistoryEntry[] {
  return readList(body, ['items', 'entries'])
    .map((r) => ({
      entryType: str(r, 'entry_type') ?? str(r, 'type') ?? '',
      fromStatus: str(r, 'from_status'),
      toStatus: str(r, 'to_status'),
      fromTechnicianName: str(r, 'from_technician_name'),
      toTechnicianName: str(r, 'to_technician_name'),
      actorName: str(r, 'actor_name') ?? str(r, 'changed_by_name') ?? '',
      changedAt: str(r, 'changed_at') ?? '',
      reason: str(r, 'reason') ?? str(r, 'release_reason') ?? str(r, 'comment'),
    }))
    .sort((a, b) => toTime(a.changedAt) - toTime(b.changedAt));
}

function toTime(iso: string): number {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

export function trayErrorMessage(err: unknown, fallback: string): string {
  const e: Rec = isRecord(err) ? err : {};
  // Cuerpo del backend (HttpErrorResponse.error). No se usa err.message de
  // HttpErrorResponse porque es el texto genérico de Angular, no del servidor.
  const body: Rec = isRecord(e['error']) ? (e['error'] as Rec) : {};
  const nested: Rec = isRecord(body['error']) ? (body['error'] as Rec) : {};
  const candidates = [body['message'], body['detail'], nested['message']];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim() !== '') return c;
  }
  const status = num(e, 'status');
  if (status === 401) return 'Tu sesión ha caducado, vuelve a iniciar sesión';
  if (status === 403) return 'No tienes permisos para realizar esta acción';
  if (status === 404) return 'La incidencia solicitada no existe.';
  return fallback;
}
