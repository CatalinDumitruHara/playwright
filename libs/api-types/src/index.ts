export interface SessionContext {
  user: {
    name: string;
    role: string;
  };
}

export interface SessionDetail {
  token: string;
  must_change_password?: boolean;
  user: {
    name: string;
    email: string;
    role: string;
    status: string;
    password_last_updated: string;
  };
}

export interface LoginRequest {
  username?: string;
  password?: string;
}

export interface ChangePasswordForcedRequest {
  new_password?: string;
}

export interface ChangePasswordRequest {
  current_password?: string;
  new_password?: string;
}

export interface IncidentSummary {
  id: string;
  reference_code: string;
  room: string;
  category: string;
  status: string;
  created_at: string;
  assigned_to?: string;
}

export interface IncidentListPage {
  items: IncidentSummary[];
  total: number;
}

export interface IncidentCategory {
  code: string;
  name: string;
}

export interface IncidentCategoryList {
  categories: IncidentCategory[];
}

export interface Room {
  id: number;
  name: string;
  office: string;
}

export interface RoomList {
  rooms: Room[];
}

export interface IncidentCreateRequest {
  room_id: number;
  category_code: string;
  description: string;
  photo?: File;
}

export interface UserSummary {
  id: string;
  full_name: string;
}

export interface IncidentDetail {
  id: string;
  reference_code: string;
  room: Room;
  category: IncidentCategory;
  description: string;
  status: string;
  created_at: string;
  reported_by: UserSummary;
  assigned_to?: UserSummary;
  photo_url?: string;
}

export interface HistoryEntry {
  status_from?: string;
  status_to: string;
  changed_at: string;
  changed_by: UserSummary;
  comment?: string;
}

export interface IncidentHistoryPage {
  items: HistoryEntry[];
}

export interface IncidentPhotoContent {
  content: Blob;
  mime_type: string;
}
