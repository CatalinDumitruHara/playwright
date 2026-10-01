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

/** Placeholder del contrato (x-mind-placeholder): object sin campos declarados. */
export type IncidentCreateRequest = Record<string, unknown>;

/** Placeholder del contrato (x-mind-placeholder): object sin campos declarados. */
export type IncidentDetail = Record<string, unknown>;

/** Placeholder del contrato (x-mind-placeholder): object sin campos declarados. */
export type IncidentListPage = Record<string, unknown>;

/** Placeholder del contrato (x-mind-placeholder): object sin campos declarados. */
export type IncidentHistoryPage = Record<string, unknown>;

/** Placeholder del contrato (x-mind-placeholder): object sin campos declarados. */
export type IncidentPhotoContent = Record<string, unknown>;

/** Placeholder del contrato (x-mind-placeholder): object sin campos declarados. */
export type IncidentCategoryList = Record<string, unknown>;

/** Placeholder del contrato (x-mind-placeholder): object sin campos declarados. */
export type RoomList = Record<string, unknown>;
