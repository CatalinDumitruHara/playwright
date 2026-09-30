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