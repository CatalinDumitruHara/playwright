# TSK-010 — contexto común para coder/tester

Repo: workspace Nx Angular 17.3 (standalone components, jest + jest-preset-angular). NO hay node/npm en el contenedor: no intentes instalar ni ejecutar nada de node; escribe código que compile con Angular 17 / TS 5.4 strict.
Zona real: `apps/app/src/app/` (el brief dice `frontend/src/app/`, no existe). Tipos DTO en `libs/api-types/src/index.ts` (alias `@api-types`).
NO toques package.json, angular.json, project.json, ni `sources/` (backend Java).

Convenciones (handbook T.7):
- Estado con Signals (`signal`, `computed`) en servicios/componentes; nada de NgRx.
- SOLO Reactive Forms (FormBuilder), nada de ngModel.
- Toda llamada HTTP en servicios dedicados con HttpClient tipado; NUNCA HttpClient en componentes.
- Base URL: `inject(ENVIRONMENT_CONFIG)['apiBaseUrl'] as string` (de `@mapfre-tech/ngx-multienvironment/core`), como `core/auth/authentication.service.ts`. URL = base + path literal.
- Componentes standalone, `inject()`, `templateUrl` + `styleUrl` (.scss puede ir vacío), atributos `data-testid` en elementos clave. Textos UI en español. CommonModule, RouterModule, ReactiveFormsModule. No uses componentes b2b si no sabes su API: HTML nativo.
- Nombres de campos JSON EXACTOS del contrato (snake_case).

## Contrato (LEY) — base `/api`
EP-001 GET /admin/users → UserList (ROL-003)
EP-002 POST /admin/users UserCreateRequest → UserDetail 201
EP-003 GET /admin/users/{userId} → UserDetail
EP-004 PUT /admin/users/{userId} UserUpdateRequest → UserDetail
EP-005 PATCH /admin/users/{userId}/status UserStatusUpdateRequest → UserDetail
EP-006 GET /admin/hierarchy → HierarchyList
EP-007 POST /admin/employees/{employeeId}/manager ManagerAssignmentRequest → HierarchyNodeDetail 201
EP-008 PUT /admin/employees/{employeeId}/manager ManagerAssignmentRequest → HierarchyNodeDetail
EP-009 DELETE /admin/employees/{employeeId}/manager → 204
EP-010 GET /profile/me → UserProfile (ROL-001, ROL-002)
EP-011 GET /profile/my-team → TeamMemberList (ROL-002)
EP-012 POST /vacation-requests VacationRequestCreate → VacationRequestDetail 201 (ROL-001,002)
EP-013 GET /vacation-requests/my-requests → VacationRequestList
EP-014 GET /vacation-requests/{requestId} → VacationRequestDetail
EP-015 POST /vacation-requests/{requestId}/cancel (sin body) → VacationRequestDetail
EP-016 GET /vacation-requests/{requestId}/proof-document → PDF binario (responseType blob)
EP-017 GET /team/vacation-requests → VacationRequestList (ROL-002)
EP-018 GET /team/vacation-requests/{requestId} → VacationRequestDetail
EP-019 POST /team/vacation-requests/{requestId}/approve (sin body) → VacationRequestDetail
EP-020 POST /team/vacation-requests/{requestId}/reject RejectionRequest → VacationRequestDetail
EP-021 POST /reports/monthly-requests/export-jobs MonthlyReportRequest → ExportJobStatus (ROL-002)
EP-022 GET /reports/export-jobs/{jobId} → ExportJobStatus

Listados paginados aceptan query `page` (base 1) y `size`.

## Schemas
UserSummary {user_id, full_name, email, user_role, status}
UserList {items: UserSummary[], total, page, size}
UserRole = 'EMPLEADO' | 'MANAGER'; UserStatus = 'Activo' | 'Inactivo'
UserCreateRequest {full_name, email, user_role, initial_password?}
UserDetail {user_id, full_name, email, user_role, status, manager_name?}
UserUpdateRequest {full_name, user_role}
UserStatusUpdateRequest {status}
HierarchyItem {employee_id, employee_name, employee_email, manager_id, manager_name}  (manager_* pueden ser null)
HierarchyList {items: HierarchyItem[], total, page, size}
ManagerAssignmentRequest {manager_id}
HierarchyNodeDetail {employee_id, employee_name, manager_id?: string|null, manager_name?: string|null}
UserProfile {user_id, full_name, email, user_role, manager_name?}
TeamMember {employee_id, full_name, email}; TeamMemberList {items: TeamMember[]}
VacationRequestCreate {start_date: 'YYYY-MM-DD', end_date, reason?}
VacationRequestStatus = 'Pendiente' | 'Aprobada' | 'Rechazada' | 'Cancelada'
VacationRequestDetail {request_id, employee_name, start_date, end_date, reason?, status, created_at, resolution_date?, manager_notes?}
VacationRequestSummary {request_id, employee_name, start_date, end_date, status, created_at}
VacationRequestList {items: VacationRequestSummary[], total, page, size}
RejectionRequest {rejection_reason?}
MonthlyReportRequest {report_month: 1-12, report_year}
ExportJobStatusValue = 'PENDING'|'PROCESSING'|'COMPLETED'|'FAILED'
ExportJobStatus {job_id, status, download_url?: string|null}

Roles: ROL-001 empleado, ROL-002 manager, ROL-003 administrador (guard existente `core/auth/role.guard.ts`, `data: { roles: [...] }`).
