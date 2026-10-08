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

export type UserRole = 'EMPLEADO' | 'MANAGER';
export type UserStatus = 'Activo' | 'Inactivo';

export interface UserSummary {
  user_id: string;
  full_name: string;
  email: string;
  user_role: UserRole;
  status: UserStatus;
}

export interface UserList {
  items: UserSummary[];
  total: number;
  page: number;
  size: number;
}

export interface UserCreateRequest {
  full_name: string;
  email: string;
  user_role: UserRole;
  initial_password?: string;
}

export interface UserDetail {
  user_id: string;
  full_name: string;
  email: string;
  user_role: UserRole;
  status: UserStatus;
  manager_name?: string | null;
}

export interface UserUpdateRequest {
  full_name: string;
  user_role: UserRole;
}

export interface UserStatusUpdateRequest {
  status: UserStatus;
}

export interface HierarchyItem {
  employee_id: string;
  employee_name: string;
  employee_email: string;
  manager_id: string | null;
  manager_name: string | null;
}

export interface HierarchyList {
  items: HierarchyItem[];
  total: number;
  page: number;
  size: number;
}

export interface ManagerAssignmentRequest {
  manager_id: string;
}

export interface HierarchyNodeDetail {
  employee_id: string;
  employee_name: string;
  manager_id?: string | null;
  manager_name?: string | null;
}

export interface UserProfile {
  user_id: string;
  full_name: string;
  email: string;
  user_role: UserRole;
  manager_name?: string | null;
}

export interface TeamMember {
  employee_id: string;
  full_name: string;
  email: string;
}

export interface TeamMemberList {
  items: TeamMember[];
}

export interface VacationRequestCreate {
  /** Formato YYYY-MM-DD */
  start_date: string;
  /** Formato YYYY-MM-DD */
  end_date: string;
  reason?: string;
}

export type VacationRequestStatus =
  | 'Pendiente'
  | 'Aprobada'
  | 'Rechazada'
  | 'Cancelada';

export interface VacationRequestDetail {
  request_id: string;
  employee_name: string;
  start_date: string;
  end_date: string;
  reason?: string | null;
  status: VacationRequestStatus;
  created_at: string;
  resolution_date?: string | null;
  manager_notes?: string | null;
}

export interface VacationRequestSummary {
  request_id: string;
  employee_name: string;
  start_date: string;
  end_date: string;
  status: VacationRequestStatus;
  created_at: string;
}

export interface VacationRequestList {
  items: VacationRequestSummary[];
  total: number;
  page: number;
  size: number;
}

export interface RejectionRequest {
  rejection_reason?: string;
}

export interface MonthlyReportRequest {
  /** 1-12 */
  report_month: number;
  report_year: number;
}

export type ExportJobStatusValue =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED';

export interface ExportJobStatus {
  job_id: string;
  status: ExportJobStatusValue;
  download_url?: string | null;
}