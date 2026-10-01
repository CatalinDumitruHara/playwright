import {
  IncidentDetail,
  IncidentHistoryPage,
  IncidentListPage,
  IncidentPhotoContent,
} from '@api-types';

export const SORT_BY_VALUES = ['created_at', 'updated_at', 'status_code'] as const;
export type SortBy = (typeof SORT_BY_VALUES)[number];
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const INCIDENT_STATUSES: ReadonlyArray<{ code: string; label: string }> = [
  { code: 'ABIERTA', label: 'Abierta' },
  { code: 'EN_CURSO', label: 'En curso' },
  { code: 'RESUELTA', label: 'Resuelta' },
  { code: 'CERRADA', label: 'Cerrada' },
];

export function statusLabel(code: string | null | undefined): string {
  if (!code) return '';
  return INCIDENT_STATUSES.find((s) => s.code === code)?.label ?? code;
}

export interface IncidentRow {
  incidentId: string;
  referenceCode: string;
  roomName: string;
  officeName: string;
  categoryName: string;
  description: string;
  statusCode: string;
  createdAt: string | null;
  updatedAt: string | null;
  assignedTechnicianName: string | null;
}

export interface IncidentPage {
  items: IncidentRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface IncidentView extends IncidentRow {
  photoId: string | null;
  resolutionComment: string | null;
  closedAt: string | null;
  closedByName: string | null;
}

export interface HistoryEntry {
  fromStatus: string | null;
  toStatus: string;
  actorName: string;
  changedAt: string;
  comment: string | null;
  dwellMs: number | null;
}

export interface PhotoContent {
  fileName: string;
  mimeType: string;
  contentBase64: string;
}

export interface MyIncidentsQuery {
  status_code?: string[];
  category_id?: string[];
  room_id?: string[];
  office_id?: string;
  created_from?: string;
  created_to?: string;
  search_text?: string;
  sort_by?: SortBy;
  sort_dir?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

type Rec = Record<string, unknown>;

function isRecord(v: unknown): v is Rec {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function readItems(body: unknown): Rec[] {
  const raw = Array.isArray(body)
    ? body
    : isRecord(body) && Array.isArray(body['items'])
      ? (body['items'] as unknown[])
      : [];
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

function mapRow(r: Rec): IncidentRow {
  return {
    incidentId: String(r['incident_id'] ?? ''),
    referenceCode: str(r, 'reference_code') ?? '',
    roomName: str(r, 'room_name') ?? '',
    officeName: str(r, 'office_name') ?? '',
    categoryName: str(r, 'category_name') ?? str(r, 'category_code') ?? '',
    description: str(r, 'description') ?? '',
    statusCode: str(r, 'status_code') ?? str(r, 'status') ?? '',
    createdAt: str(r, 'created_at'),
    updatedAt: str(r, 'updated_at'),
    assignedTechnicianName: str(r, 'assigned_technician_name'),
  };
}

export function mapIncidentPage(
  body: IncidentListPage | null,
  fallbackPage: number,
  fallbackSize: number
): IncidentPage {
  const r: Rec = isRecord(body) ? body : {};
  const items = readItems(body).map(mapRow);
  return {
    items,
    total: num(r, 'total') ?? num(r, 'total_count') ?? items.length,
    page: num(r, 'page') ?? fallbackPage,
    pageSize: num(r, 'page_size') ?? fallbackSize,
  };
}

export function mapIncidentDetail(body: IncidentDetail): IncidentView {
  const r: Rec = isRecord(body) ? body : {};
  return {
    ...mapRow(r),
    photoId: str(r, 'photo_id'),
    resolutionComment: str(r, 'resolution_comment'),
    closedAt: str(r, 'closed_at'),
    closedByName: str(r, 'closed_by_name'),
  };
}

export function mapHistory(body: IncidentHistoryPage | null): HistoryEntry[] {
  const entries = readItems(body)
    .map((r) => ({
      fromStatus: str(r, 'from_status'),
      toStatus: str(r, 'to_status') ?? '',
      actorName: str(r, 'actor_name') ?? '',
      changedAt: str(r, 'changed_at') ?? '',
      comment: str(r, 'comment') ?? str(r, 'resolution_comment'),
      dwellMs: null as number | null,
    }))
    .sort((a, b) => toTime(a.changedAt) - toTime(b.changedAt));
  for (let i = 0; i < entries.length - 1; i++) {
    const from = Date.parse(entries[i].changedAt);
    const to = Date.parse(entries[i + 1].changedAt);
    entries[i].dwellMs =
      Number.isFinite(from) && Number.isFinite(to) ? to - from : null;
  }
  return entries;
}

function toTime(iso: string): number {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

export function mapPhoto(body: IncidentPhotoContent): PhotoContent | null {
  const r: Rec = isRecord(body) ? body : {};
  const content = str(r, 'content_base64');
  if (!content) return null;
  return {
    fileName: str(r, 'file_name') ?? 'foto',
    mimeType: str(r, 'mime_type') ?? 'application/octet-stream',
    contentBase64: content,
  };
}
