
/**
 * Longitud máxima del comentario de resolución.
 * Gap REQ-111: el contrato (IncidentClosureRequest) no fija máximo; se aplica
 * este límite en cliente hasta que el contrato lo defina.
 */
export const RESOLUTION_COMMENT_MAX_LENGTH = 2000;

export interface SimilarClosure {
  incidentId: string;
  referenceCode: string;
  roomName: string;
  categoryName: string;
  resolutionComment: string;
  closedByName: string;
  closedAt: string | null;
}

export interface SimilarClosureView {
  items: SimilarClosure[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export type TimelineEventType =
  | 'alta'
  | 'cambio_estado'
  | 'asignacion'
  | 'reclasificacion'
  | 'comentario_resolucion';

export const TIMELINE_EVENT_TYPES: ReadonlyArray<{
  code: TimelineEventType;
  label: string;
}> = [
  { code: 'alta', label: 'Alta' },
  { code: 'cambio_estado', label: 'Cambio de estado' },
  { code: 'asignacion', label: 'Asignación' },
  { code: 'reclasificacion', label: 'Reclasificación' },
  { code: 'comentario_resolucion', label: 'Comentario de resolución' },
];

export function timelineEventLabel(t: TimelineEventType): string {
  return TIMELINE_EVENT_TYPES.find((e) => e.code === t)?.label ?? t;
}

export interface TimelineEntry {
  id: string;
  eventType: TimelineEventType;
  actorName: string;
  actorRole: string | null;
  occurredAt: string;
  fromValue: string | null;
  toValue: string | null;
  resolutionComment: string | null;
  assignedTechnicianName: string | null;
  previousRoomName: string | null;
  newRoomName: string | null;
  previousCategoryName: string | null;
  newCategoryName: string | null;
}

export interface ReclassificationOption {
  value: string;
  label: string;
}

type Rec = Record<string, unknown>;

function isRecord(v: unknown): v is Rec {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function readItems(body: unknown, ...keys: string[]): Rec[] {
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

function isInactive(r: Rec): boolean {
  return r['active'] === false || r['is_active'] === false;
}

export function mapSimilarClosures(
  body: unknown,
  page: number,
  pageSize: number
): SimilarClosureView {
  const r: Rec = isRecord(body) ? body : {};
  const items: SimilarClosure[] = readItems(body, 'items').map((i) => ({
    incidentId: str(i, 'incident_id') ?? '',
    referenceCode: str(i, 'reference_code') ?? '',
    roomName: str(i, 'room_name') ?? '',
    categoryName: str(i, 'category_name') ?? str(i, 'category_code') ?? '',
    resolutionComment: str(i, 'resolution_comment') ?? '',
    closedByName: str(i, 'closed_by_user_name') ?? str(i, 'closed_by_name') ?? '',
    closedAt: str(i, 'closed_at'),
  }));
  const total = num(r, 'total') ?? num(r, 'total_count') ?? items.length;
  return {
    items,
    page,
    pageSize,
    total,
    hasMore: page * pageSize < total,
  };
}

const EVENT_TYPE_MAP: Record<string, TimelineEventType> = {
  CREACION: 'alta',
  ALTA: 'alta',
  CAMBIO_ESTADO: 'cambio_estado',
  ASIGNACION: 'asignacion',
  RECLASIFICACION: 'reclasificacion',
  COMENTARIO_RESOLUCION: 'comentario_resolucion',
};

function normalizeEventType(r: Rec): TimelineEventType {
  const raw = str(r, 'event_type') ?? str(r, 'entry_type');
  if (raw) {
    const mapped = EVENT_TYPE_MAP[raw.trim().toUpperCase()];
    if (mapped) return mapped;
  }
  const hasFrom = 'from_status' in r;
  const hasTo = 'to_status' in r;
  if (hasFrom || hasTo) {
    return str(r, 'from_status') === null ? 'alta' : 'cambio_estado';
  }
  return 'cambio_estado';
}

function toTime(iso: string): number {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

function idOrder(a: string, b: string): number {
  const na = Number(a);
  const nb = Number(b);
  if (Number.isFinite(na) && Number.isFinite(nb) && a !== '' && b !== '') {
    return na - nb;
  }
  return a < b ? -1 : a > b ? 1 : 0;
}

/** EP-029: IncidentHistoryPage (placeholder en el contrato). */
export function mapTimeline(body: unknown): TimelineEntry[] {
  return readItems(body, 'items')
    .map(
      (r): TimelineEntry => ({
        id: str(r, 'history_entry_id') ?? str(r, 'history_id') ?? '',
        eventType: normalizeEventType(r),
        actorName: str(r, 'actor_display_name') ?? str(r, 'actor_name') ?? '',
        actorRole: str(r, 'actor_role'),
        occurredAt: str(r, 'occurred_at') ?? str(r, 'changed_at') ?? '',
        fromValue: str(r, 'value_before') ?? str(r, 'from_status'),
        toValue: str(r, 'value_after') ?? str(r, 'to_status'),
        resolutionComment: str(r, 'resolution_comment') ?? str(r, 'comment'),
        assignedTechnicianName: str(r, 'assigned_technician_name'),
        previousRoomName: str(r, 'previous_room_name'),
        newRoomName: str(r, 'new_room_name'),
        previousCategoryName: str(r, 'previous_category_name'),
        newCategoryName: str(r, 'new_category_name'),
      })
    )
    .sort(
      (a, b) => toTime(a.occurredAt) - toTime(b.occurredAt) || idOrder(a.id, b.id)
    );
}

/** EP-042: RoomList (placeholder). Admite lista plana o agrupada por oficina. */
export function mapRoomOptions(body: unknown): ReclassificationOption[] {
  const out: ReclassificationOption[] = [];
  const pushRoom = (r: Rec, groupOffice: string | null) => {
    if (isInactive(r)) return;
    const id = str(r, 'room_id');
    if (id === null) return;
    const name = str(r, 'room_name') ?? id;
    const office = str(r, 'office_name') ?? groupOffice;
    out.push({ value: id, label: office ? `${name} · ${office}` : name });
  };
  for (const item of readItems(body, 'items', 'rooms')) {
    if (Array.isArray(item['rooms'])) {
      if (isInactive(item)) continue;
      const office = str(item, 'office_name');
      for (const room of (item['rooms'] as unknown[]).filter(isRecord)) {
        pushRoom(room, office);
      }
    } else {
      pushRoom(item, null);
    }
  }
  return out;
}

/** EP-040: IncidentCategoryList (placeholder). */
export function mapCategoryOptions(
  body: unknown
): ReclassificationOption[] {
  return readItems(body, 'items', 'categories')
    .filter((r) => !isInactive(r))
    .map((r) => {
      const code = str(r, 'category_code');
      return code === null
        ? null
        : { value: code, label: str(r, 'category_name') ?? code };
    })
    .filter((o): o is ReclassificationOption => o !== null);
}

export function isClosureEntry(e: TimelineEntry): boolean {
  if (e.eventType === 'comentario_resolucion') return true;
  return (
    e.eventType === 'cambio_estado' &&
    (e.fromValue ?? '').toUpperCase() === 'RESUELTA' &&
    (e.toValue ?? '').toUpperCase() === 'CERRADA'
  );
}
