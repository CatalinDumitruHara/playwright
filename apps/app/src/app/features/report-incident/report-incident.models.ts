import {
  IncidentCategoryList,
  IncidentCreateRequest,
  IncidentDetail,
  RoomList,
} from '@api-types';

export const DESCRIPTION_MIN = 10;
export const DESCRIPTION_MAX = 500;
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const PHOTO_MIME: ReadonlyArray<PhotoPayload['mimeType']> = [
  'image/jpeg',
  'image/png',
];

export interface CategoryOption {
  code: string;
  name: string;
  active: boolean;
}

export interface RoomOption {
  id: number;
  name: string;
  officeId: number | null;
  officeName: string;
  active: boolean;
}

export interface PhotoPayload {
  fileName: string;
  mimeType: 'image/jpeg' | 'image/png';
  contentBase64: string;
}

export interface ReportIncidentInput {
  roomId: number;
  categoryCode: string;
  description: string;
  photo: PhotoPayload | null;
}

export interface CreatedIncident {
  incidentId: string;
  referenceCode: string;
  status: string;
  createdAt: string | null;
  photoStored: boolean;
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

export function mapCategories(
  body: IncidentCategoryList | null
): CategoryOption[] {
  return readItems(body)
    .map((r) => {
      const code = str(r, 'category_code') ?? '';
      return {
        code,
        name: str(r, 'category_name') ?? str(r, 'name') ?? code,
        active: r['is_active'] !== false,
      };
    })
    .filter((c) => c.code !== '');
}

export function mapRooms(body: RoomList | null): RoomOption[] {
  return readItems(body)
    .map((r) => {
      const id = num(r, 'room_id');
      return {
        id: id ?? NaN,
        name: str(r, 'room_name') ?? str(r, 'name') ?? '',
        officeId: num(r, 'office_id'),
        officeName: str(r, 'office_name') ?? '',
        active: r['is_active'] !== false,
      };
    })
    .filter((room) => Number.isFinite(room.id));
}

export function toIncidentCreateRequest(
  input: ReportIncidentInput
): IncidentCreateRequest {
  const photo = input.photo;
  return {
    room_id: input.roomId,
    category_code: input.categoryCode,
    description: input.description.trim(),
    photo: photo
      ? {
          file_name: photo.fileName,
          mime_type: photo.mimeType,
          content_base64: photo.contentBase64,
        }
      : null,
  };
}

export function mapCreatedIncident(body: IncidentDetail): CreatedIncident {
  const r: Rec = isRecord(body) ? body : {};
  return {
    incidentId: str(r, 'incident_id') ?? '',
    referenceCode: str(r, 'reference_code') ?? '',
    status: str(r, 'status_code') ?? str(r, 'status') ?? '',
    createdAt: str(r, 'created_at'),
    photoStored: r['photo_stored'] !== false,
  };
}
