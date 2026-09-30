// GENERADO por MIND desde openapi.yaml (contrato T.3, PR #0). NO editar a mano:
// los nombres y tipos de estos campos son el contrato que el backend implementa.
// Un schema sin campos en T.3 se emite como `Record<string, unknown>` y debe
// completarse en el contrato, no aquí.

export interface AssignmentReleaseRequest {
  reason: string; // Motivo por el cual el técnico libera la incidencia.
}

export interface CategoryCatalogResponse {
  categories: unknown[]; // Array de objetos que representan las categorías. Campos: category_code (string), category_name (string).
}

export interface ClassificationUpdateRequest {
  room_id?: number; // Nuevo identificador de la sala afectada.
  category_code?: string; // Nuevo código de la categoría. Valores: MOBILIARIO, CLIMATIZACION, AUDIOVISUAL, LIMPIEZA, OTROS.
  reason?: string; // Motivo opcional para la reclasificación.
}

export type FileStream = Record<string, unknown>; // x-mind-placeholder

export interface IncidentClosureRequest {
  resolution_comment: string; // Comentario obligatorio explicando la resolución de la incidencia.
}

export interface IncidentCreateRequest {
  room_id: number; // Identificador de la sala afectada.
  category_code: string; // Código de la categoría de la incidencia. Valores: MOBILIARIO, CLIMATIZACION, AUDIOVISUAL, LIMPIEZA, OTROS.
  description: string; // Descripción breve del problema.
  photo?: Blob; // Fichero de imagen opcional adjunto a la incidencia (multipart/form-data).
}

export interface IncidentDetailResponse {
  incident_id: string; // Identificador único de la incidencia.
  reference_code: string; // Código de referencia legible para el usuario.
  room_name: string; // Nombre de la sala afectada.
  office_name: string; // Nombre de la oficina a la que pertenece la sala.
  category_name: string; // Nombre de la categoría de la incidencia.
  description: string; // Descripción completa del problema.
  status: string; // Estado actual de la incidencia. Valores: ABIERTA, EN_CURSO, RESUELTA, CERRADA.
  reporter_name: string; // Nombre del empleado que reportó la incidencia.
  assigned_technician_name?: string; // Nombre del técnico asignado. Nulo si no está asignada.
  has_photo: boolean; // Indica si la incidencia tiene una foto adjunta.
  created_at: string; // Fecha y hora de creación de la incidencia.
  in_progress_at?: string; // Fecha y hora en que se pasó a estado 'en curso'.
  resolved_at?: string; // Fecha y hora en que se pasó a estado 'resuelta'.
  closed_at?: string; // Fecha y hora en que se pasó a estado 'cerrada'.
  resolution_comment?: string; // Comentario del técnico al cerrar la incidencia.
}

export interface IncidentHistoryResponse {
  entries: unknown[]; // Array de entradas de historial, ordenadas cronológicamente. Campos: changed_at (datetime), actor_name (string), from_status (string), to_status (string), assigned_technician (string), comment (string).
}

export interface IncidentListResponse {
  items: unknown[]; // Array de objetos que representan un resumen de incidencia. Campos: incident_id (uuid), reference_code (string), room_name (string), category_name (string), status (enum), created_at (datetime), reporter_name (string), assigned_technician_name (string).
  total: number; // Número total de incidencias en el resultado completo.
  page: number; // Número de la página actual.
  size: number; // Número de elementos por página.
}

export interface LoginRequest {
  username: string; // Nombre de usuario, que se corresponde con el correo corporativo.
  password: string; // Contraseña del usuario.
}

export interface OfficeCatalogResponse {
  offices: unknown[]; // Array de objetos que representan las oficinas. Campos: office_id (integer), office_name (string).
}

export interface PageResponse {
  items: unknown[]; // Array con los elementos de la página actual.
  total: number; // Número total de elementos disponibles en la colección completa.
  page: number; // Número de la página actual (base 1).
  size: number; // Número de elementos por página solicitados.
}

export interface PasswordChangeRequest {
  current_password: string; // Contraseña actual del usuario.
  new_password: string; // Nueva contraseña que cumple la política de seguridad.
  new_password_confirmation: string; // Confirmación de la nueva contraseña, debe ser idéntica.
}

export interface RoomCatalogResponse {
  rooms: unknown[]; // Array de objetos que representan las salas. Campos: room_id (integer), room_name (string), office_id (integer), office_name (string).
}

export interface SessionResponse {
  access_token: string; // Token de sesión para autorizar peticiones posteriores.
  token_type: string; // Tipo de token, habitualmente 'Bearer'.
  expires_in: number; // Duración del token en segundos.
}

export interface StateTransitionRequest {
  to_status: string; // Estado destino de la transición. Valores: EN_CURSO, RESUELTA.
  comment?: string; // Comentario opcional asociado a la transición.
}

export interface StatusCatalogResponse {
  statuses: unknown[]; // Array de objetos que representan los estados. Campos: status_code (string), status_name (string).
}

export interface UserCreateRequest {
  full_name: string; // Nombre completo del nuevo usuario.
  corporate_email: string; // Correo corporativo del nuevo usuario, debe ser único.
  role_code: string; // Rol a asignar al nuevo usuario. Valores: EMPLEADO, TECNICO_MANTENIMIENTO, ADMINISTRADOR.
}

export interface UserDetailResponse {
  user_id: string; // Identificador único del usuario.
  full_name: string; // Nombre completo del usuario.
  corporate_email: string; // Correo corporativo del usuario.
  role_code: string; // Rol del usuario. Valores: EMPLEADO, TECNICO_MANTENIMIENTO, ADMINISTRADOR.
  status: string; // Estado de la cuenta. Valores: ACTIVO, INACTIVO.
  created_at: string; // Fecha y hora de creación de la cuenta.
  updated_at?: string; // Fecha y hora de la última modificación de la cuenta.
  last_login_at?: string; // Fecha y hora del último inicio de sesión.
}

export interface UserListResponse {
  items: unknown[]; // Array de objetos que representan un resumen de usuario. Campos: user_id (uuid), full_name (string), corporate_email (email), role_code (enum), status (enum).
  total: number; // Número total de usuarios en el resultado completo.
  page: number; // Número de la página actual.
  size: number; // Número de elementos por página.
}

export interface UserProfileResponse {
  user_id: string; // Identificador único del usuario.
  full_name: string; // Nombre completo del usuario.
  corporate_email: string; // Correo corporativo del usuario.
  role_code: string; // Rol del usuario. Valores: EMPLEADO, TECNICO_MANTENIMIENTO, ADMINISTRADOR.
}

export interface UserUpdateRequest {
  full_name?: string; // Nuevo nombre completo del usuario.
  corporate_email?: string; // Nuevo correo corporativo del usuario. Debe ser único.
  role_code?: string; // Nuevo rol del usuario. Valores: EMPLEADO, TECNICO_MANTENIMIENTO, ADMINISTRADOR.
}
