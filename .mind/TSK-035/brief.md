# TSK-035 · Bandeja y Gestión de Incidencias para Técnicos

- Componente dueño: `ARC-011`
- Arquetipo del repo: `frontend-application-spa` — respeta sus convenciones; NUNCA te salgas de él (ver «Contrato de salida del arquetipo»).
- Zonas de código de ESTA tarea (trabajo principal): `apps/app/src/app/features/incident-tray/`, `apps/app/src/app/app.routes.ts`. Fuera de ellas NO amplíes alcance de negocio — **EXCEPTO** el composition root y el manifiesto del host necesarios para montar lo entregado (sección Composition root).

## Definition of Done
Bandeja completa de incidencias (EP-026) con filtros, búsqueda y paginación. Detalle de cualquier incidencia (EP-028) muestra acciones de ciclo de vida (autoasignar EP-031, liberar EP-033, cambiar estado EP-034) según las `available_transitions` devueltas por la API. Rutas registradas en el host; `start`/`build` verdes.

## Oráculos de verificación (dod-oracles) — OBLIGATORIO

El DoD se evalúa por **comportamiento**, no porque exista un fichero o un string «implementado». Lo siguiente es **Blocker** si lo usas como entrega de producto (los dobles solo valen en tests):

- **Email / notificación:** cliente real o puerto inyectable (`aiosmtplib`, SES, SendGrid, …) + test que verifica que se invocó el envío. **`log.info` / `print` / «Simula el envío» ≠ email.**
- **Auth / rol (p. ej. ADMINISTRADOR):** dependency o middleware que devuelve 401/403 sin credencial/rol; tests con y sin permiso. **Un CRUD abierto no cumple «solo admin».**
- **Evento / AsyncAPI:** productor que publica al canal declarado; test que captura el publish. **Loguear el payload ≠ publicar el evento.**
- **Persistencia:** driver del stack del arquetipo (Motor/SQLAlchemy/…) contra el motor de prueba o Testcontainers. **`dict` / `db_*` in-memory en el módulo de producto ≠ base de datos.**
- **UI que consume API:** `HttpClient`/`fetch` hacia los paths del contrato. **`mocks.js` + `setTimeout` como único camino de producto ≠ integración.** (Mocks solo en unitarios.)

Si el entorno de prueba no levanta el servicio necesario: escribe el código de producto real + tests, declara Warning `entorno-de-prueba`, y **NO** sustituyas el DoD con un fake en el código entregado.

## Composition root (composition-root) — OBLIGATORIO

Una pantalla o componente que no está cableado al **host de la app** (routing, layout, scripts `start`/`build`) NO cuenta como entregado.

Raíces reales del arquetipo `frontend-application-spa`: `apps/`, `libs/`. El composition root y el código nuevo viven BAJO esas raíces; no abras un segundo árbol (`src/` junto a `sources/`, `backend/` junto a `apps/`).

En ESTA misma tarea (aunque `zone_paths` no liste el shell):
1. Localiza o crea el host del arquetipo (`angular.json` / `vite.config` / `src/main.ts` / `AppModule` / equivalente SPA).
2. Registra la ruta o el módulo nuevo en el router del host.
3. Asegura scripts de app en `package.json` (`start`/`build`/`serve`) — NO dejes un `package.json` solo de migraciones/tests si entregas UI.
4. Smoke: el host resuelve la ruta nueva sin error de módulo.

**Excepción a zone_paths:** el shell del host y su manifiesto SÍ se tocan para montar lo entregado. No refactores pantallas ajenas.

## El front tiene que instalar y compilar (workspace-config) — OBLIGATORIO

Antes de dar la tarea por hecha, `npm ci` y el build de **producción** tienen que pasar en un clon limpio. Los cuatro que fallaron:

1. **Dentro del `sourceRoot`.** Los ficheros nuevos van bajo el `sourceRoot` que declara `angular.json` (normalmente `src`). Un fichero fuera de él no lo ve el compilador: si algo lo importa, `TS2307`; si no, es código muerto que parece entregado.
2. **Lockfile.** Toca deps → commitea `package-lock.json`. Y fija al major del framework cualquier librería acoplada a él: un `^` abierto resuelve a un major que pide otro Angular y `npm install` muere en `ERESOLVE`.
3. **Configuración contra el disco.** Si `angular.json` nombra un fichero (`main`, `polyfills`, `fileReplacements`, `karmaConfig`), ese fichero existe. Y ninguna opción retirada del schema de la versión declarada (`extractCss`, `defaultProject`) ni builders inexistentes (`tslint`, `protractor`): el build muere con `Schema validation failed`.
4. **Una sola base de API, desde el entorno.** `environment.ts` (y su `environment.prod.ts`). PROHIBIDO un host absoluto (`http://localhost:8080`) o una base inventada por servicio. Un `TODO` sobre la URL base en una tarea que entregas es un bloqueante, no una nota.

## Imports de tests (test-imports) — OBLIGATORIO

Los tests deben importar **el mismo árbol de módulos** que la app host (mismas rutas relativas / mismos barrels). No inventes paths `src.app.main` ni paquetes que no existan en el repo. Antes de importar un símbolo, ábrelo en el fuente productivo.

## Los tests tienen que EJECUTARSE (suite-exec) — OBLIGATORIO

Un fichero de test que ningún runner recoge es PEOR que no tenerlo: da una señal de cobertura falsa. Antes de entregar:

1. **Cuenta.** Los tests que has escrito y los que el runner ejecuta tienen que ser los mismos. Ejecuta la suite y comprueba el número.
2. **Corre en un clon limpio.** Sin variables de entorno de la plataforma. Todo `process.env.X` con valor por defecto, y toda dependencia externa de test declarada y levantada por el propio repo.
3. **No parchees la aplicación desde el test.** Si el contexto no levanta, el arreglo va en la configuración productiva. Un `@ComponentScan`/`@EntityScan`/`@EnableJpaRepositories` en una clase de test pone el test en verde y deja el producto roto.

## Dependencias pineadas (dependency-pins) — OBLIGATORIO

Un manifiesto sin versiones (o incompleto frente a los imports) NO es entrega válida.

1. **Python:** en `requirements.txt` / deps de `pyproject.toml` cada paquete lleva pin (`==` preferido, o rango acotado `>=x,<y`). **PROHIBIDO** listar solo el nombre (`fastapi`, `uvicorn`, `pydantic`).
2. **Completitud:** toda librería de terceros que importes (`sqlalchemy`, `pydantic`, `motor`, …) debe figurar en el manifiesto.
3. **API ↔ major:** el código debe ser compatible con el major pineado. Si usas `__modify_schema__` / `@validator` / `from_orm` (Pydantic v1), pinea `pydantic>=1.10,<2` (o equivalente). Si pegas Pydantic 2, usa APIs v2 (`field_validator`, `model_validate`). NUNCA código v1 + install latest.
4. **Node:** versiones en `package.json` + `package-lock.json` cuando toques deps; no dejes dependencias sin versión.
5. Actualiza el manifiesto del host en ESTA tarea (misma excepción de zona que el composition root).

## Extiende la zona, no la reimplementes (zone-extend) — OBLIGATORIO

Tus zonas (`apps/app/src/app/features/incident-tray/`, `apps/app/src/app/app.routes.ts`) pueden ya contener código de una TSK predecesora mergeada (o del esqueleto). Antes de crear tipos nuevos:

1. **Lista y lee** los ficheros bajo la zona (`ls` / abre `service.py`, `router.py`, …).
2. **EDIT/EXTIENDE** clases, funciones y exports existentes. **PROHIBIDO** una segunda `class`/`def`/export con el **mismo nombre** en el mismo fichero (en Python gana la última y el resto es basura).
3. Si esta tarea es «API pública» / «consulta» sobre el mismo dominio que un CRUD previo, **reutiliza** servicios y modelos; añade solo el router/handlers públicos (montados en el composition root).
4. Un módulo = un dueño semántico de cada símbolo top-level. Si hace falta otro tipo, **nómbralo distinto** o factoriza — no pegues un duplicado al EOF.

El runtime puede anexar la lista real de ficheros presentes en la zona al arrancar la sesión.

## Contrato API congelado (api-contract) — LEY

Estos son los endpoints que publica el backend de este producto (`openapi.yaml`, PR #0 / C.2). Son los ÚNICOS que puedes llamar: no inventes paths, verbos ni parámetros, y si la pantalla necesita algo que no está en la tabla, SEÑÁLALO en el PR en vez de fabricarlo.

| EP | Método | Path | Request | Response | Status | Public | Roles |
|----|--------|------|---------|----------|--------|--------|-------|
| `EP-026` | **GET** | `/incidents` | `—` | `IncidentListPage` | 200 | N | `ROL-002` |
| | | _Consulta la bandeja completa de incidencias con filtros, búsqueda, orden y paginación_ | | | | | |
| `EP-028` | **GET** | `/incidents/{incidentId}` | `—` | `IncidentDetail` | 200 | N | `ROL-001`, `ROL-002` |
| | | _Consulta el detalle de una incidencia con su estado, responsable y transiciones disponibles_ | | | | | |
| `EP-031` | **POST** | `/incidents/{incidentId}/assignment` | `SelfAssignmentRequest` | `IncidentAssignmentDetail` | 201 | N | `ROL-002` |
| | | _Permite a un técnico autoasignarse una incidencia sin responsable_ | | | | | |
| `EP-033` | **DELETE** | `/incidents/{incidentId}/assignment` | `AssignmentReleaseRequest` | `IncidentAssignmentDetail` | 204 | N | `ROL-002` |
| | | _Libera la incidencia asignada indicando el motivo y la devuelve a tomable_ | | | | | |
| `EP-034` | **POST** | `/incidents/{incidentId}/transitions` | `StatusTransitionRequest` | `IncidentDetail` | 201 | N | `ROL-002` |
| | | _Ejecuta una transición de estado válida del ciclo de vida de la incidencia_ | | | | | |
| `EP-001` | **POST** | `/auth/sessions` | `LoginRequest` | `SessionDetail` | 201 | Y | — |
| | | _Inicia sesión con usuario y contraseña propios y devuelve la sesión con el rol vigente_ | | | | | |
| `EP-002` | **DELETE** | `/auth/sessions/current` | `—` | `—` | 204 | N | `ROL-001`, `ROL-002`, `ROL-003` |
| | | _Cierra la sesión del usuario y la revoca en servidor_ | | | | | |
| `EP-003` | **GET** | `/auth/sessions/current` | `—` | `SessionContext` | 200 | N | `ROL-001`, `ROL-002`, `ROL-003` |
| | | _Devuelve el contexto del usuario autenticado con su identidad y rol vigente_ | | | | | |
| `EP-004` | **GET** | `/auth/permissions` | `—` | `EffectivePermissions` | 200 | N | `ROL-001`, `ROL-002`, `ROL-003` |
| | | _Devuelve las operaciones permitidas y el alcance de datos del rol vigente_ | | | | | |
| `EP-005` | **PUT** | `/auth/password` | `PasswordChangeRequest` | `PasswordChangeResult` | 200 | N | `ROL-001`, `ROL-002`, `ROL-003` |
| | | _Cambia la contraseña del propio usuario aportando la actual_ | | | | | |
| `EP-006` | **PUT** | `/auth/initial-password` | `InitialPasswordRequest` | `PasswordChangeResult` | 200 | N | `ROL-001`, `ROL-002`, `ROL-003` |
| | | _Establece la contraseña definitiva en el primer acceso tras alta o restablecimiento_ | | | | | |
| `EP-007` | **POST** | `/users` | `UserCreateRequest` | `UserDetail` | 201 | N | `ROL-003` |
| | | _Da de alta un usuario con nombre, correo corporativo y rol, y emite su credencial inicial_ | | | | | |
| `EP-008` | **GET** | `/users` | `—` | `UserListPage` | 200 | N | `ROL-003` |
| | | _Lista el censo de usuarios con su rol y estado, con búsqueda, filtros y paginación_ | | | | | |
| `EP-009` | **GET** | `/users/{userId}` | `—` | `UserDetail` | 200 | N | `ROL-003` |
| | | _Consulta la ficha de un usuario con su rol vigente y su trazabilidad_ | | | | | |
| `EP-010` | **PUT** | `/users/{userId}` | `UserUpdateRequest` | `UserDetail` | 200 | N | `ROL-003` |
| | | _Modifica el nombre y el correo corporativo de un usuario activo_ | | | | | |
| `EP-011` | **PUT** | `/users/{userId}/role` | `RoleChangeRequest` | `UserRoleDetail` | 200 | N | `ROL-003` |
| | | _Cambia el rol funcional vigente de un usuario_ | | | | | |
| `EP-012` | **GET** | `/users/{userId}/role-history` | `—` | `RoleHistoryPage` | 200 | N | `ROL-003` |
| | | _Consulta el histórico inmutable de asignaciones y cambios de rol de un usuario_ | | | | | |
| `EP-013` | **GET** | `/users/{userId}/deactivation-impact` | `—` | `DeactivationImpact` | 200 | N | `ROL-003` |
| | | _Devuelve el impacto de dar de baja a un usuario sobre sus incidencias y avisos_ | | | | | |
| `EP-014` | **POST** | `/users/{userId}/deactivation` | `UserDeactivationRequest` | `UserDetail` | 201 | N | `ROL-003` |
| | | _Desactiva lógicamente un usuario con motivo, revocando sus sesiones_ | | | | | |
| `EP-015` | **POST** | `/users/{userId}/reactivation` | `UserReactivationRequest` | `UserDetail` | 201 | N | `ROL-003` |
| | | _Reactiva un usuario inactivo devolviéndole su rol previo_ | | | | | |
| `EP-016` | **GET** | `/users/{userId}/status-history` | `—` | `AccountStatusHistoryPage` | 200 | N | `ROL-003` |
| | | _Consulta el histórico de cambios de estado de cuenta y los datos de baja_ | | | | | |
| `EP-017` | **POST** | `/users/{userId}/password-reset` | `PasswordResetRequest` | `PasswordResetResult` | 201 | N | `ROL-003` |
| | | _Restablece la contraseña de un usuario activo generando una credencial temporal_ | | | | | |
| `EP-018` | **POST** | `/users/{userId}/unlock` | `AccountUnlockRequest` | `AccountLockStatus` | 201 | N | `ROL-003` |
| | | _Desbloquea una cuenta bloqueada por intentos fallidos sin alterar su contraseña_ | | | | | |
| `EP-019` | **GET** | `/users/credential-status` | `—` | `CredentialStatusPage` | 200 | N | `ROL-003` |
| | | _Lista el estado de credencial de los usuarios (cambio pendiente, bloqueo, último acceso)_ | | | | | |
| `EP-020` | **GET** | `/access-audit-events` | `—` | `AccessAuditEventPage` | 200 | N | `ROL-003` |
| | | _Consulta la auditoría inmutable de accesos y operaciones sensibles_ | | | | | |
| `EP-021` | **GET** | `/notification-recipients/{userId}` | `—` | `RecipientDetail` | 200 | N | `ROL-003` |
| | | _Resuelve el destinatario de aviso de un usuario y su notificabilidad_ | | | | | |
| `EP-022` | **GET** | `/notification-groups/maintenance-team` | `—` | `RecipientGroupDetail` | 200 | N | `ROL-003` |
| | | _Resuelve la composición vigente del colectivo equipo de mantenimiento_ | | | | | |
| `EP-023` | **GET** | `/notification-recipients` | `—` | `RecipientVerificationPage` | 200 | N | `ROL-003` |
| | | _Verifica qué usuarios reciben avisos y cuáles quedan excluidos con su motivo_ | | | | | |
| `EP-024` | **GET** | `/recipient-resolutions` | `—` | `RecipientResolutionPage` | 200 | N | `ROL-003` |
| | | _Consulta el registro inmutable de resoluciones de destinatarios del directorio_ | | | | | |
| `EP-025` | **POST** | `/incidents` | `IncidentCreateRequest` | `IncidentDetail` | 201 | N | `ROL-001`, `ROL-002` |
| | | _Da de alta una incidencia de sala con categoría, descripción y foto opcional_ | | | | | |
| `EP-027` | **GET** | `/my-incidents` | `—` | `IncidentListPage` | 200 | N | `ROL-001`, `ROL-002` |
| | | _Consulta el listado de las incidencias reportadas por el propio empleado_ | | | | | |
| `EP-029` | **GET** | `/incidents/{incidentId}/history` | `—` | `IncidentHistoryPage` | 200 | N | `ROL-001`, `ROL-002` |
| | | _Consulta el historial cronológico de cambios de una incidencia con autor y fecha_ | | | | | |
| `EP-030` | **GET** | `/incidents/{incidentId}/photo` | `—` | `IncidentPhotoContent` | 200 | N | `ROL-001`, `ROL-002` |
| | | _Descarga la foto adjunta de una incidencia previa verificación de integridad_ | | | | | |
| `EP-032` | **PUT** | `/incidents/{incidentId}/assignment` | `AssignmentChangeRequest` | `IncidentAssignmentDetail` | 200 | N | `ROL-002` |
| | | _Reasigna una incidencia no cerrada a otro técnico de mantenimiento activo_ | | | | | |
| `EP-035` | **POST** | `/incidents/{incidentId}/closure` | `IncidentClosureRequest` | `IncidentDetail` | 201 | N | `ROL-002` |
| | | _Cierra una incidencia resuelta aportando el comentario de resolución obligatorio_ | | | | | |
| `EP-036` | **PUT** | `/incidents/{incidentId}/classification` | `IncidentReclassificationRequest` | `IncidentDetail` | 200 | N | `ROL-002` |
| | | _Reclasifica la sala o la categoría de una incidencia no cerrada_ | | | | | |
| `EP-037` | **GET** | `/incidents/{incidentId}/similar-closures` | `—` | `SimilarClosurePage` | 200 | N | `ROL-002` |
| | | _Consulta los cierres anteriores de la misma sala y categoría con su resolución_ | | | | | |
| `EP-038` | **GET** | `/incident-activities` | `—` | `IncidentActivityPage` | 200 | N | `ROL-002` |
| | | _Consulta el registro de actividad reciente de todas las incidencias con filtros_ | | | | | |
| `EP-039` | **GET** | `/incident-statistics` | `—` | `IncidentCountSummary` | 200 | N | `ROL-002` |
| | | _Devuelve el recuento agregado de incidencias por oficina, sala o categoría_ | | | | | |
| `EP-040` | **GET** | `/incident-categories` | `—` | `IncidentCategoryList` | 200 | N | `ROL-001`, `ROL-002`, `ROL-003` |
| | | _Consulta el catálogo cerrado de categorías de incidencia_ | | | | | |
| `EP-041` | **PUT** | `/incident-categories/{categoryCode}` | `IncidentCategoryUpdateRequest` | `IncidentCategoryDetail` | 200 | N | `ROL-003` |
| | | _Renombra, reordena o activa/desactiva una categoría del catálogo cerrado_ | | | | | |
| `EP-042` | **GET** | `/rooms` | `—` | `RoomList` | 200 | N | `ROL-001`, `ROL-002`, `ROL-003` |
| | | _Consulta el catálogo de salas agrupadas por oficina con búsqueda_ | | | | | |
| `EP-043` | **POST** | `/rooms` | `RoomCreateRequest` | `RoomDetail` | 201 | N | `ROL-003` |
| | | _Da de alta una sala en una oficina activa del catálogo_ | | | | | |
| `EP-044` | **PUT** | `/rooms/{roomId}` | `RoomUpdateRequest` | `RoomDetail` | 200 | N | `ROL-003` |
| | | _Edita el nombre, la oficina o el estado de activación de una sala_ | | | | | |
| `EP-045` | **GET** | `/offices` | `—` | `OfficeList` | 200 | N | `ROL-001`, `ROL-002`, `ROL-003` |
| | | _Consulta el catálogo de oficinas con su estado y sus salas asociadas_ | | | | | |
| `EP-046` | **PUT** | `/offices/{officeId}` | `OfficeUpdateRequest` | `OfficeDetail` | 200 | N | `ROL-003` |
| | | _Edita el literal o el estado de activación de una oficina_ | | | | | |
| `EP-047` | **GET** | `/notification-dispatches` | `—` | `NotificationDispatchPage` | 200 | N | `ROL-003` |
| | | _Consulta los avisos por correo emitidos con su estado de entrega y filtros_ | | | | | |
| `EP-048` | **GET** | `/notification-dispatches/{dispatchId}` | `—` | `NotificationDispatchDetail` | 200 | N | `ROL-003` |
| | | _Consulta el detalle de un aviso con su traza inmutable de intentos de entrega_ | | | | | |
| `EP-049` | **POST** | `/notification-dispatches/{dispatchId}/resend` | `NotificationResendRequest` | `NotificationDispatchDetail` | 201 | N | `ROL-003` |
| | | _Reenvía manualmente un aviso fallido o descartado sobre la misma solicitud_ | | | | | |
| `EP-050` | **GET** | `/mail-settings` | `—` | `MailSettingsDetail` | 200 | N | `ROL-003` |
| | | _Consulta la configuración vigente del servidor de correo saliente_ | | | | | |
| `EP-051` | **PUT** | `/mail-settings` | `MailSettingsUpdateRequest` | `MailSettingsDetail` | 200 | N | `ROL-003` |
| | | _Actualiza y activa los parámetros del servidor SMTP y del remitente_ | | | | | |
| `EP-052` | **POST** | `/mail-settings/test-messages` | `MailTestRequest` | `MailTestResult` | 201 | N | `ROL-003` |
| | | _Envía un correo de prueba para verificar la conexión con el servidor SMTP_ | | | | | |
| `EP-053` | **GET** | `/incident-retentions` | `—` | `RetentionOverview` | 200 | N | `ROL-003` |
| | | _Consulta el vencimiento de retención de las incidencias y las próximas a vencer_ | | | | | |
| `EP-054` | **POST** | `/integrity-checks` | `IntegrityCheckRequest` | `IntegrityCheckReport` | 201 | N | `ROL-003` |
| | | _Lanza la verificación diagnóstica de integridad del registro histórico_ | | | | | |
| `EP-055` | **GET** | `/integrity-checks` | `—` | `IntegrityCheckPage` | 200 | N | `ROL-003` |
| | | _Lista los informes de verificación de integridad ejecutados_ | | | | | |
| `EP-056` | **GET** | `/integrity-checks/{checkId}` | `—` | `IntegrityCheckReport` | 200 | N | `ROL-003` |
| | | _Consulta un informe de integridad con sus inconsistencias por incidencia y regla_ | | | | | |

Disciplina de consumo (client-contract):
1. **Una sola base de API** para todo el front, inyectada desde la configuración de entorno. Ni una base por servicio, ni un host absoluto, ni el host/puerto del entorno de la sesión (`host.docker.internal`, `MIND_ENV_*`) en el fuente.
2. La base es **`servers[0].url` del `openapi.yaml`** y se lee de `assets/environments.json` (`apiBaseUrl`, sembrado en el PR #0) — nunca del fuente. El `path` de la tabla se concatena **literal** detrás de ella; no le añadas versiones ni prefijos que la tabla no traiga. En `nx serve` el `proxy.conf.json` del PR #0 reenvía esa base al backend.
5. Los tipos de los cuerpos y respuestas se importan de `libs/api-types` (generados desde el contrato en el PR #0): PROHIBIDO declarar a mano una `interface` con el nombre de un schema del contrato — es exactamente cómo el front acabó tipando `page_size` donde el back devolvía `size`.
3. El verbo es el de la columna Método (`PATCH` no es `PUT`), y el identificador de la ruta es el que declara el path (`{tagId}` es el id del recurso, no su nombre).
4. Los nombres de campo del cuerpo y de los parámetros son los del contrato. Los nombres FÍSICOS de la tabla (`note_id`, `note_title`…) son del modelo de datos, **no** del JSON: no los uses para tipar la respuesta de la API.
5. Respeta Public/Roles: no llames un EP deny-all; un EP restringido exige el JWT de uno de esos `ROL-NNN`. No inventes roles.

## Canales en tiempo real (asyncapi.yaml) — LEY

Son los ÚNICOS canales cliente↔servidor del producto: mismo transporte, mismo canal y mismo mensaje en los dos lados. No abras un WebSocket donde el contrato dice SSE ni inventes una ruta de eventos que no esté aquí.

- `EVT-004` **AvisoAltaIncidenciaEntregado** · canal `facilities.avisos.alta-incidencia-entregado.v1` · transporte **webhook** · productor `ARC-005` → consumidor `ARC-003` · payload: código de referencia de la incidencia, sala, oficina, categoría, descripción breve, reportante y fecha de alta
- `EVT-005` **AvisoCambioEstadoEntregado** · canal `facilities.avisos.cambio-estado-entregado.v1` · transporte **webhook** · productor `ARC-005` → consumidor `ARC-002` · payload: código de referencia de la incidencia, sala, estado anterior, estado nuevo, fecha del cambio y comentario de resolución si es el cierre
- `EVT-006` **CredencialInicialEntregada** · canal `facilities.avisos.credencial-entregada.v1` · transporte **webhook** · productor `ARC-005` → consumidor `ARC-004` · payload: id de usuario destino, correo corporativo, tipo de credencial (alta o restablecimiento), resultado de la entrega y fecha

## Contrato de salida del arquetipo

> El repo se genera desde el arquetipo `frontend-application-spa` (ArqRef MAPFRE). Produce EXACTAMENTE ficheros con la estructura, rutas y HERRAMIENTA de este arquetipo, imitando el esqueleto/ejemplos de abajo. NO improvises otra herramienta ni otra disposición (p.ej. si el arquetipo usa Liquibase, NO uses Flyway). Extiende el esqueleto; no lo reinventes.

**Raíz del proyecto**: el código va bajo `sources/`, `local/`, `apps/`, `libs/`, `src/` — donde el arquetipo pone el suyo. Si el repo está vacío y tienes que andamiarlo, respeta esa raíz en vez de elegir una nueva: el resto del aprovisionamiento (pipelines del arquetipo, verificación de build, empaquetado) espera encontrarlo ahí.

### Esqueleto y ejemplos (imítalos exactamente)
#### `apps/app/src/app/app.routes.ts`
```ts
import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/welcome/welcome.page').then(p => p.WelcomePage),
  },
];

```
#### `apps/app/src/app/app.config.ts`
```ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import {
  EnvironmentConfig,
  provideEnvironment,
} from '@mapfre-tech/ngx-multienvironment/core';

export const getAppConfig: (config: {
  env: string;
  envConfig: EnvironmentConfig;
}) => ApplicationConfig = config => ({
  providers: [
    provideRouter(appRoutes),
    provideEnvironment(config.env, config.envConfig),
  ],
});

```
#### `apps/app/src/main.ts`
```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { getAppConfig } from './app/app.config';
import { initMultiEnvironmentApp } from '@mapfre-tech/ngx-multienvironment/core';

async function bootstrapApp() {
  const { env, envConfig } = await initMultiEnvironmentApp();
  bootstrapApplication(AppComponent, getAppConfig({ env, envConfig })).catch(
    err => console.error(err)
  );
}

bootstrapApp();

```
#### `apps/app/project.json`
```json
{
  "name": "app",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "application",
  "prefix": "app",
  "sourceRoot": "apps/app/src",
  "tags": [],
  "targets": {
    "build": {
      "executor": "@mapfre-tech/nx-angular:webpack-browser",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist/apps/app/browser",
        "index": "apps/app/src/index.html",
        "main": "apps/app/src/main.ts",
        "polyfills": ["zone.js"],
        "tsConfig": "apps/app/tsconfig.app.json",
        "inlineStyleLanguage": "scss",
        "assets": [
          {
            "glob": "**/*",
            "input": "apps/app/public",
            "output": "/"
          }
        ],
        "styles": ["apps/app/src/styles.scss"],
        "scripts": [],
        "vendorChunk": true,
        "allowedCommonJsDependencies": []
      },
      "configurations": {
        "production": {
          "outputHashing": "all",
          "sourceMap": {
            "hidden": true
          },
          "budgets": [
            {
              "type": "bundle",
              "name": "vendor",
              "maximumWarning": "500kb",
              "maximumError": "800kb"
            },
            {
              "type": "initial",
              "maximumWarning": "600kb",
              "maximumError": "900kb"
            },
            {
              "type": "anyComponentStyle",
              "maximumWarning": "15kb",
              "maximumError": "20kb"
            }
          ]
        },
        "development": {
          "buildOptimizer": false,
          "optimization": false,
          "extractLicenses": false,
          "sourceMap": true,
          "namedChunks": true
        }
      },
      "defaultConfiguration": "production"
    },
    "serve": {
      "executor": "@mapfre-tech/nx-angular:dev-server",
      "configurations": {
        "production": {
          "buildTarget": "app:build:production"
        },
        "development": {
          "buildTarget": "app:build:development"
        }
      },
      "defaultConfiguration": "development",
      "options": {
        "host": "0.0.0.0"
      }
    },
    "extract-i18n": {
      "executor": "@angular-devkit/build-angular:extract-i18n",
      "options": {
        "buildTarget": "app:build"
      }
    },
    "lint": {
      "executor": "@nx/eslint:lint"
    },
    "test": {
      "executor": "@nx/jest:jest",
      "outputs": ["{workspaceRoot}/coverage/{projectRoot}"],
      "options": {
        "jestConfig": "apps/app/jest.config.ts"
      }
    },
    "serve-static": {
      "executor": "@nx/web:file-server",
      "options": {
        "spa": true
      },
      "configurations": {
        "dev": {
          "buildTarget": "app:build-with-env:dev"
        },
        "pre": {
          "buildTarget": "app:build-with-env:pre"
        },
        "pro": {
          "buildTarget": "app:build-with-env:pro"
        }
      },
      "defaultConfiguration": "dev"
    },
    "optimize-assets": {
      "executor": "nx:run-commands",
      "options": {
        "command": "npx --yes @funboxteam/optimizt apps/app/public"
      }
    },
    "build-with-env": {
      "executor": "@mapfre-tech/nx-angular:build-with-env",
      "options": {
        "buildTarget": "app:build",
        "outputPath": "dist/build-with-env/app"
      },
      "configurations": {
        "dev": {
          "environmentKey": "dev"
        },
        "pre": {
          "environmentKey": "pre"
        },
        "pro": {
          "environmentKey": "pro"
        }
      },
      "defaultConfiguration": "dev"
    },
    "bundle-analyzer": {
      "executor": "nx:run-commands",
      "options": {
        "command": "nx run app:build:production --statsJson && npx --yes webpack-bundle-analyzer dist/apps/app/browser/stats.json"
      }
    },
    "assemble-web": {
      "executor": "@mapfre-tech/nx-angular:assemble-web",
      "options": {
        "buildTarget": "app:build:production",
        "artifactName": "app",
        "excludeSourceMaps": false
      },
      "configurations": {
        "production": {
          "excludeSourceMaps": true
        }
      }
    },
    "package-debug-files-web": {
      "executor": "@mapfre-tech/nx-tools:zip",
      "options": {
        "filePath": "dist/apps/app",
        "zipName": "app-debug-files-web"
      }
    },
    "release-debug-files-web": {
      "executor": "@mapfre-tech/nx-tools:release-debug-files-web",
      "options": {
        "file": "dist/artifacts/app/app-debug-files-web.zip"
      }
    },
    "release-web": {
      "executor": "@mapfre-tech/nx-tools:release-spa",
      "options": {
        "file": "dist/artifacts/app/app.zip"
      }
    }
  }
}

```
#### `apps/app/public/assets/environments.json`
```json
{
  "dev": {},
  "pre": {},
  "pro": {}
}

```
#### `apps/.gitkeep`
```text

```
#### `libs/.gitkeep`
```text

```
#### `apps/app/eslint.config.mjs`
```mjs
import nx from '@nx/eslint-plugin';
import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  ...nx.configs['flat/angular'],
  ...nx.configs['flat/angular-template'],
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    // Override or add rules here
    rules: {},
  },
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/component-class-suffix': [
        'error',
        {
          suffixes: ['Component', 'Container', 'Page'],
        },
      ],
    },
  },
];

```
#### `apps/app/jest.config.ts`
```ts
export default {
  displayName: 'app',
  preset: '../../jest.preset.js',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  coverageDirectory: '../../coverage/apps/app',
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
  snapshotSerializers: [
    'jest-preset-angular/build/serializers/no-ng-attributes',
    'jest-preset-angular/build/serializers/ng-snapshot',
    'jest-preset-angular/build/serializers/html-comment',
  ],
};

```
#### `apps/app/tsconfig.app.json`
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "../../dist/out-tsc",
    "types": []
  },
  "files": ["src/main.ts"],
  "include": ["src/**/*.d.ts"],
  "exclude": ["jest.config.ts", "src/**/*.test.ts", "src/**/*.spec.ts"]
}

```
#### `apps/app/tsconfig.editor.json`
```json
{
  "extends": "./tsconfig.json",
  "include": ["src/**/*.ts"],
  "compilerOptions": {},
  "exclude": ["jest.config.ts", "src/**/*.test.ts", "src/**/*.spec.ts"]
}

```
#### `apps/app/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "es2022",
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "files": [],
  "include": [],
  "references": [
    {
      "path": "./tsconfig.editor.json"
    },
    {
      "path": "./tsconfig.app.json"
    },
    {
      "path": "./tsconfig.spec.json"
    }
  ],
  "extends": "../../tsconfig.base.json",
  "angularCompilerOptions": {
    "enableI18nLegacyMessageIdFormat": false,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "strictTemplates": true
  }
}

```
#### `apps/app/tsconfig.spec.json`
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "../../dist/out-tsc",
    "module": "commonjs",
    "target": "es2016",
    "types": ["jest", "node"]
  },
  "files": ["src/test-setup.ts"],
  "include": [
    "jest.config.ts",
    "src/**/*.test.ts",
    "src/**/*.spec.ts",
    "src/**/*.d.ts"
  ]
}

```
#### `apps/app/src/index.html`
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>app</title>
    <base href="/" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" type="image/x-icon" href="favicon.ico" />
  </head>
  <body>
    <app-root></app-root>
  </body>
</html>

```
#### `apps/app/src/styles.scss`
```scss
/* You can add global styles to this file, and also import other style files */

```
#### `apps/app/src/test-setup.ts`
```ts
import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv({
  errorOnUnknownElements: true,
  errorOnUnknownProperties: true,
});

```
#### `apps/app/src/app/app.component.html`
```html
<router-outlet></router-outlet>

```
#### `apps/app/src/app/app.component.scss`
```scss

```
#### `apps/app/src/app/app.component.ts`
```ts
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  imports: [RouterModule],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {}

```
#### `apps/app/src/app/pages/welcome/welcome.page.html`
```html
<div class="wrapper">
  <div class="container">
    <div
      class="welcome"
      style="
        text-align: center;
        flex-direction: row;
        display: flex;
        align-items: center;
      ">
      <div style="width: 164px">
        <svg
          id="Artwork"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1282 715.5">
          <defs>
            <style>
              .cls-1 {
                fill: none;
              }
              .cls-2 {
                fill: #ff002d;
              }
            </style>
          </defs>
          <path
            class="cls-2"
            d="M323.88,420.05c-25.55,0-45.34,7.77-59.87,23.8-11.77-15.78-29.56-23.8-53.36-23.8-21.29,0-38.33,7.01-49.85,20.54v-17.28h-35.57v125.25h37.57v-81.66c7.26-9.77,20.04-14.78,37.82-14.78,25.8,0,37.83,10.02,37.83,32.06v64.38h37.57v-81.66c7.26-9.77,20.04-14.78,37.82-14.78,25.8,0,37.83,10.02,37.83,32.06v64.38h37.57v-64.63c0-40.08-24.3-63.88-65.38-63.88Z" />
          <path
            class="cls-2"
            d="M540.31,440.59c-13.53-12.78-35.32-20.54-58.12-20.54-43.34,0-74.15,27.3-74.15,65.88s30.81,65.88,74.15,65.88c22.79,0,44.59-7.77,58.12-20.54v17.28h35.57v-125.25h-35.57v17.28ZM538.3,502.46c-10.52,11.27-27.3,17.28-48.35,17.28-27.8,0-44.34-12.77-44.34-33.82s16.53-33.82,44.34-33.82c21.04,0,37.83,6.01,48.35,17.28v33.06Z" />
          <path
            class="cls-2"
            d="M935.34,440.59v-17.28h-35.57v125.25h37.57v-81.66c6.01-10.02,17.53-14.78,36.32-14.78,9.02,0,16.78.75,24.05,2.5l3.01-32.31c-3.26-1.5-9.52-2.25-18.29-2.25-20.04,0-37.82,7.77-47.09,20.54Z" />
          <path
            class="cls-2"
            d="M1144.5,509.97c-14.28,7.26-36.07,11.77-55.61,11.77-32.56,0-47.59-7.77-50.1-25.8h114.73c1-7.01,1.5-11.27,1.5-16.53,0-35.07-29.56-59.37-72.39-59.37-50.1,0-79.41,24.05-79.41,65.63s29.81,66.13,83.42,66.13c29.81,0,57.11-7.51,71.14-18.03l-13.28-23.8ZM1082.63,447.6c23.8,0,37.32,8.27,39.83,24.3h-83.67c2.76-17.03,16.03-24.3,43.84-24.3Z" />
          <path
            class="cls-2"
            d="M787.54,424.56v123.99h37.57v-95.19h55.86v-30.06h-55.86v-2.5c0-16.28,8.77-22.54,31.56-22.54,7.26,0,20.29,1.25,35.07,3.51l2.51-26.55c-12.28-3.51-25.8-5.26-41.33-5.26-43.59,0-65.38,18.04-65.38,54.61Z" />
          <path
            class="cls-2"
            d="M694.61,420.05c-22.8,0-44.59,7.77-58.12,20.54v-17.28h-35.57v166.83h37.57v-58.87c13.03,12.78,34.07,20.54,56.11,20.54,43.34,0,74.15-27.3,74.15-65.88s-30.81-65.88-74.15-65.88ZM686.84,519.74c-21.04,0-37.82-6.01-48.34-17.28v-33.06c10.52-11.27,27.3-17.28,48.34-17.28,27.81,0,44.34,12.77,44.34,33.82s-16.53,33.82-44.34,33.82Z" />
          <path
            class="cls-2"
            d="M698.87,182.23c0-31.56-25.3-56.86-57.11-56.86s-57.36,25.05-57.36,56.86c0,29.56,16.03,58.62,45.09,82.41l-1,.5c-81.41-40.58-116.98-54.36-140.53-54.36-16.78,0-28.56,11.77-28.56,28.31,0,34.57,42.08,68.13,85.42,68.13,73.65,0,154.05-65.38,154.05-125Z" />
          <path
            class="cls-2"
            d="M795.31,210.79c-27.05,0-61.12,16.28-142.28,68.13,38.83,20.54,62.12,28.31,85.17,28.31,43.34,0,85.42-33.57,85.42-68.13,0-16.53-11.77-28.31-28.31-28.31Z" />
          <rect class="cls-1" y=".19" width="1282" height="715.13" />
          <rect class="cls-1" y="1.75" width="1282" height="712" />
        </svg>
      </div>
      <div style="text-align: left; margin-left: 16px">
        <h1>
          Bienvenido app
          <span>Proyecto creado con la arquitectura de referencia MAPFRE</span>
        </h1>
      </div>
    </div>
    <div class="hero rounded">
      <div class="text-container">
        <h2>
          <svg
            fill="none"
            stroke="white"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          <span>Comencemos con el desarrollo</span>
        </h2>
      </div>
    </div>
  </div>
</div>

```
#### `apps/app/src/app/pages/welcome/welcome.page.spec.ts`
```ts
import { WelcomePage } from './welcome.page';
import { createRoutingFactory } from '@ngneat/spectator/jest';

describe('WelcomePage', () => {
  const createComponent = createRoutingFactory({
    component: WelcomePage,
    detectChanges: false,
  });

  it('should create', () => {
    const spectator = createComponent();
    expect(spectator.component).toBeTruthy();
  });
});

```
#### `apps/app/src/app/pages/welcome/welcome.page.ts`
```ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-welcome-page',
  imports: [CommonModule],
  templateUrl: './welcome.page.html',
  styleUrl: './welcome.page.scss',
})
export class WelcomePage {}

```
> (Se omitieron ficheros del arquetipo por tamaño; respeta las convenciones mostradas en los ejemplos anteriores para el resto.)

## Guía del programador del proyecto (convenciones — T.7, aprobada)

**Precedencia (handbook-filter):** si esta guía choca con el **contrato ArqRef** o el **DoD de ESTA tarea**, ganan ArqRef y el DoD. Solo se incluyen convenciones del stack de esta TSK; se omiten slices de otros lenguajes/frameworks (p. ej. Angular HttpClient en una TSK React, FastAPI en un SPA).

### Librerías del handbook (pines — dependency-pins)
Usa estas coordenadas/versiones en el manifiesto del host; no improvises latest sin pin.
- **Alembic** `1.14.x o superior` [bbdd] · `alembic`
- **argon2-cffi (Argon2id)** `23.1.x o superior` [backend] · `argon2-cffi`
- **APScheduler** `3.11.x o superior` [backend] · `APScheduler`
- **Pillow** `11.x o superior` [backend] · `pillow`
- **aiosmtpd** `1.4.6 o superior` [tests] · `aiosmtpd`
- **freezegun** `1.5.x o superior` [tests] · `freezegun`
- **Ruff (linter + formatter)** `0.8.x o superior` [backend] · `ruff`
- **mypy** `1.14.x o superior` [backend] · `mypy`
- **Prettier** `3.4.x` [frontend] · `prettier`
- **GitHub Actions** `runners ubuntu-24.04` [infra]
- **pre-commit** `4.0.x o superior` [infra] · `pre-commit`

### Convenciones
- **BACKEND — Transacciones: el limite transaccional es el METODO DEL SERVICE. El router abre la sesion via dependencia get_db y la cede al service; el service hace with uow(db): ... y el commit ocurre UNA sola vez al final del caso de uso. El repository NUNCA llama a commit(), rollback() ni flush() salvo flush explicito para obtener la PK generada. Las lecturas puras usan sesion en modo solo lectura (no se hace commit). Toda escritura que deba coexistir con su asiento de historico o con su fila de outbox se hace en el MISMO with uow.** — AC-CIE-05, AC-HIST-02, AC-ACC-03 y REQ-132 exigen atomicidad estricta: si falla el historico, no se consolida el cierre; si falla la revocacion de sesiones, no se consolida la desactivacion; la solicitud de aviso se persiste en la misma transaccion que el alta (patron outbox, ADR-006). Un commit dentro del repository rompe esa garantia sin que nadie lo note hasta produccion.
  - Ejemplo correcto: `def cerrar(self, incidencia_id: int, cmd: CerrarCommand, actor: ContextoSesion) -> IncidenciaDetalle:
    with uow(self.db):
        inc = self.repo.get_for_update(incidencia_id)
        ...
        self.repo.add_historico(asiento)
        self.outbox.enqueue(aviso)      # misma transaccion
    return IncidenciaDetalleResponse.model_validate(inc)`
  - Ejemplo incorrecto (evítalo): `class IncidenciaRepository:
    def save(self, inc):
        self.db.add(inc)
        self.db.commit()     # el repositorio decide la transaccion: el historico puede quedar huerfano`
- **BACKEND — Identificadores: la PK interna de toda tabla es un NUMBER GENERATED ALWAYS AS IDENTITY (mapped_column(Integer, Identity(always=True), primary_key=True)). El identificador visible al usuario es un codigo de negocio VARCHAR2 unico y legible, generado en el backend (por ejemplo reference_code 'INC-2026-000123'). Los tokens de sesion y las credenciales temporales se generan con secrets.token_urlsafe(32) y se persisten SOLO como hash. PROHIBIDO exponer la PK numerica interna como identificador publico en correos o pantallas de confirmacion.** — El alcance mezcla uuid y number segun el requisito; hay que cerrar una sola forma. IDENTITY es la construccion nativa de Oracle 12c+ y evita el mantenimiento de secuencias y triggers. Mantener aparte un reference_code legible cumple AC-INC-01 ('muestra su identificador') y AC-BAN-07 (busqueda por codigo) sin filtrar la cardinalidad interna del sistema.
  - Ejemplo correcto: `incidencia_id: Mapped[int] = mapped_column(Integer, Identity(always=True), primary_key=True)
reference_code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
session_token = secrets.token_urlsafe(32)   # se guarda sha256(session_token)`
  - Ejemplo incorrecto (evítalo): `incidencia_id = mapped_column(Integer, autoincrement=True)   # AUTOINCREMENT no existe en Oracle
reference_code = str(uuid4())                                 # ilegible para el empleado
db.session_token = session_token                              # token en claro en la tabla`
- **BACKEND — Alcance de datos: el filtro de propiedad (reported_by_user_id = :session_user_id) se aplica SIEMPRE como predicado en la consulta SQL construida por el repository, nunca como filtro sobre un resultado ya materializado y nunca a partir de un identificador recibido del cliente. El service resuelve el alcance (OWN | ALL) desde el rol vigente leido en base de datos y lo pasa al repository como parametro explicito. Un reporter_user_id presente en la query string se IGNORA en silencio, sin error.** — REQ-024 y AC-PERM-02 son explicitos: 'el filtrado por propietario se aplica en la consulta a base de datos (no sobre la respuesta ya construida)'. Filtrar en memoria implica que el total y los contadores revelan el volumen global (AC-ALC-01) y que una paginacion devuelve paginas incompletas.
  - Ejemplo correcto: `stmt = select(IncidenciaEntity)
if scope is DataScope.OWN:
    stmt = stmt.where(IncidenciaEntity.reported_by_user_id == session_user_id)
total = db.scalar(select(func.count()).select_from(stmt.subquery()))`
  - Ejemplo incorrecto (evítalo): `todas = repo.find_all()
mias = [i for i in todas if i.reported_by_user_id == session_user_id]  # trae todo a memoria,
# el totalCount seria el global y filtra despues de haber leido datos ajenos`
- **BACKEND — Logging: structlog a stdout en JSON, un evento por linea, con los campos fijos trace_id, span_id, session_user_id, role_code, operation_code y outcome. Nivel INFO en pre y prod, DEBUG solo en dev. Se enmascara SIEMPRE y de forma centralizada (processor de structlog): password, current_password, new_password, new_password_confirmation, temporary_password, password_hash, password_salt, session_token, cabecera Cookie/Authorization y corporate_email (se registra el usuario por usuario_id, nunca por correo). PROHIBIDO loggear el cuerpo completo de una peticion.** — REQ-053, REQ-063, REQ-076 y REQ-079 lo exigen literalmente ('la contrasenia no figura en logs ni trazas', 'ningun correo corporativo figura en registros de log'). Centralizar el enmascarado en un processor es la unica forma de que un log anadido a prisa en un hotfix no filtre PII.
  - Ejemplo correcto: `log.info("incidencia_creada", incidencia_id=inc.incidencia_id,
         reference_code=inc.reference_code, session_user_id=actor.user_id,
         operation_code="INCIDENT_CREATE", outcome="OK")`
  - Ejemplo incorrecto (evítalo): `log.info(f"login de {email} con password {password}")
log.debug("request body: %s", await request.json())   # vuelca PII y credenciales`
- **TRANSVERSAL — Autorizacion: cada operacion de la API declara su operation_code del catalogo cat_operacion mediante la dependencia require(operation_code) del router. La dependencia resuelve la sesion, relee el rol VIGENTE en base de datos (nunca el embebido en la sesion), consulta la matriz permiso_rol_operacion y aplica deny-by-default: un par rol x operacion sin fila explicita se deniega. La dependencia devuelve el ContextoSesion con user_id, role_code y data_scope, que el service usa para acotar la consulta. Un endpoint sin require(...) no se despliega: hay un test de contrato que recorre app.routes y falla si alguna ruta no publica lo declara.** — REQ-021, REQ-060 y AC-PERM-01 exigen fuente unica de verdad y denegacion por defecto, con revision de codigo que demuestre que no hay comprobaciones de rol dispersas por los endpoints. REQ-019 exige ademas que el cambio de rol surta efecto en la siguiente peticion, lo que obliga a releer el rol de BBDD en cada llamada.
  - Ejemplo correcto: `@router.get("/incidents")
def listar(q: Annotated[BandejaQuery, Depends()],
           actor: Annotated[ContextoSesion, Depends(require(Op.INCIDENT_LIST_ALL))],
           svc: Annotated[IncidenciaService, Depends(get_incidencia_service)]) -> Page[IncidenciaResumen]:
    return svc.listar_bandeja(q, actor)`
  - Ejemplo incorrecto (evítalo): `@router.get("/incidents")
def listar(actor = Depends(get_current_user)):
    if actor.role_code != "TECNICO_MANTENIMIENTO":   # comprobacion dispersa, fuera de la matriz
        raise HTTPException(403)`

### Anti-patrones (PROHIBIDOS)
- Declarar la PK con autoincrement=True, con un tipo SERIAL, o con AUTOINCREMENT en el DDL. → usa: sa.Column('<entity>_id', sa.Integer(), sa.Identity(always=True), primary_key=True), que Oracle traduce a NUMBER GENERATED ALWAYS AS IDENTITY. AUTOINCREMENT es sintaxis de SQLite y SERIAL de PostgreSQL: ninguna existe en Oracle y el DDL falla en el despliegue, no en el test unitario.
- Codificar las transiciones de estado o la matriz de permisos como cadenas de if/elif en el servicio (if estado == 'ABIERTA' and nuevo == 'EN_CURSO': ...). → usa: Delegar en TransicionRuleService y PermisoRuleService, que leen cat_transicion_incidencia y permiso_rol_operacion con deny-by-default y devuelven la regla aplicada para trazarla. REQ-021 y REQ-117 exigen fuente unica de verdad y 'ninguna comprobacion de rol codificada dispersa en los endpoints', verificable por revision de codigo (AC-PERM-01).
- Comprobar el rol o el alcance dentro del cuerpo del endpoint (if actor.role_code != 'TECNICO_MANTENIMIENTO': raise 403) en lugar de declararlo en la dependencia require(operation_code). → usa: Declarar siempre Depends(require(Op.X)) en la firma del endpoint. Un endpoint sin require(...) y no listado como publico hace fallar el test de contrato de rutas. Esto materializa el 'protegido por defecto' de AC-SES-04 y evita el endpoint nuevo que nadie recordo proteger.
- Loggear el cuerpo completo de la peticion, el correo corporativo del usuario, la contrasenia, la credencial temporal o la cookie de sesion. → usa: Registrar identificadores (session_user_id, incidencia_id, operation_code, outcome) y confiar el enmascarado al processor central de structlog, que elimina password*, temporary_password, password_hash, password_salt, session_token, Cookie, Authorization y corporate_email. REQ-063, REQ-076 y REQ-079 lo prohiben de forma explicita y es auditable.
- Emitir un JWT autocontenido con el rol embebido y considerar la sesion cerrada solo en el navegador. → usa: Sesion opaca server-side en tabla sesion_usuario, cookie HttpOnly+Secure+SameSite=Strict, y relectura del rol vigente en BBDD en cada peticion. REQ-057, REQ-070 y REQ-086 exigen revocacion inmediata en servidor (logout, cambio de contrasenia, desactivacion) y REQ-019 que el cambio de rol surta efecto en la siguiente peticion: un JWT con rol embebido no puede cumplirlo.
- Enviar el correo SMTP dentro de la transaccion del alta o de la transicion de estado, o encolar el aviso en una lista en memoria del proceso. → usa: Patron outbox: la solicitud de aviso se INSERTA en la misma transaccion que el alta o la transicion; el despachador ARC-014 la toma despues en FIFO con bloqueo y la entrega. Un SMTP caido debe dejar la solicitud PENDIENTE y devolver 2xx al usuario (AC-AVI-05), nunca revertir la operacion de negocio ni perder el aviso al reiniciar el contenedor.
- Hacer commit() o rollback() dentro de un repositorio, o guardar la incidencia y su asiento de historico en transacciones separadas. → usa: El unico with uow(db) esta en el metodo del servicio y abarca la escritura de negocio, su asiento de historico y su fila de outbox. AC-CIE-05 exige que un fallo al escribir el historico deje la incidencia en 'resuelta' sin comentario ni asiento; con commits parciales quedan historicos huerfanos imposibles de conciliar (AC-TRZ-03).

## Design system corporativo (design-system) — LEY

La UI se construye con `@mapfre-tech/b2b-components`, la librería de componentes de MAPFRE. No es una recomendación: una pantalla montada con `<div>` y CSS propio, o con una librería pública, es un producto que **no cumple el design system** y hay que rehacerlo.

**Prohibido** pintar la interfaz con `primeng`, `bootstrap`, `@ng-bootstrap/ng-bootstrap`, `ng-zorro-antd` o `@angular/material`. (Matiz: `@angular/material` es peer de `@mapfre-tech/formly-b2b`, así que si hay formularios dinámicos estará en el árbol de dependencias — legítimamente. Lo que no puede es aparecer en el `imports` de un componente tuyo.)

Si algo no se puede instalar, el problema es la credencial del registro privado: repórtalo como health check **Blocker** `registro-privado` y para. NO lo resuelvas quitando la dependencia, ni bajando la versión de Angular, ni sustituyendo la librería por una pública.

### Instalación

El arquetipo ya trae el `.npmrc` del feed privado (Azure Artifacts) y la sesión recibe el token por entorno: `npm ci` funciona tal cual. **No toques el `.npmrc`** y no escribas el token en ningún fichero.

| Angular del arquetipo | `b2b-components` | `formly-b2b` |
|---|---|---|
| Angular 17 – 19 | `3.12.17` | `1.2.0` |
| Angular 21+ | `4.1.8` | `2.0.0` |

Pinea la versión que corresponda a la versión de Angular **que ya declara el arquetipo** — no subas ni bajes Angular para encajar la librería.

### Cableado de estilos y assets

En el `project.json` de la aplicación (rutas verificadas contra el paquete publicado; la documentación que circula por ahí las da mal):

```json
"styles": ["node_modules/@mapfre-tech/b2b-components/src/styles.scss"],
"assets": [
  { "glob": "**/*", "input": "node_modules/@mapfre-tech/b2b-components/src/assets", "output": "/assets/b2b-components" },
]
```

**Una sola salida, `/assets/b2b-components`**: la librería resuelve fuentes e iconos ahí. Tres salidas (`/assets/icons`, `/assets/fonts`, `/assets/img`) compilan igual y dan 404 en runtime — pasó en el ciclo anterior y el compilador no lo ve. El runtime comprueba que la entrada `input` existe en disco y que las `url(/assets/…)` de tus estilos las sirve alguna entrada `assets`.

### Widget de la spec → componente real

La pantalla declara `widget`; esta tabla dice qué importar. **El selector importa tanto como la clase**: media librería son DIRECTIVAS sobre elementos nativos (`button[b2b-button]`, `input[b2b-input]`), y escribir `<b2b-button>` no pinta nada ni da error.

| widget | importar | selector | nota |
|--------|----------|----------|------|
| `amount` | `B2bReadDataComponent` | `b2b-read-data` | NO hay componente de importe: el formato es del pipe |
| `autocomplete` | `B2bSearchAutoCompleteComponent` | `b2b-search-autocomplete` | — |
| `badge` | `B2bTagComponent` | `b2b-tag` | el chip/etiqueta con texto es `b2b-tag`; `B2bBadgeComponent` (`b2b-badge`) es un PUNTO indicador de 8 px, no una etiqueta |
| `banner` | `B2bNotificationInlineComponent` | `b2b-notification-inline` | `[visible]="true"` obligatorio (arranca oculta); `type` ∈ ok|error|alert|info; el toast flotante es `B2bNotificationFloatingComponent` |
| `cancel` | `B2bButtonComponent` | `button[b2b-button]` | misma directiva, variante secundaria |
| `card` | `B2bCardPrimaryComponent` | `[b2b-card-primary]` | variante secundaria: `B2bCardSecondaryComponent` |
| `checkbox` | `B2bCheckBoxComponent` | `input[b2b-checkbox]` | ojo a la mayúscula: `CheckBox`, no `Checkbox` |
| `currency` | `B2bInputComponent` | `input[b2b-input] type="text"` | NO hay componente de importe: formatea con el pipe de moneda de Angular |
| `date` | `B2bDatePickerInputComponent` | `b2b-date-picker-input` | — |
| `date_range` | `B2bDatePickerRangeInputComponent` | `b2b-date-picker-range-input` | — |
| `date_text` | `B2bReadDataComponent` | `b2b-read-data` | — |
| `document_link` | `B2bLinkComponent` | `a[b2b-link]` | — |
| `empty_state` | `B2bNotificationInlineComponent` | `b2b-notification-inline` | NO hay componente de estado vacío: notificación en línea con `[visible]="true"` (arranca oculta) y `type` ∈ ok|error|alert|info |
| `file_upload` | `B2bFileUploaderComponent` | `b2b-file-uploader` | para arrastrar y soltar, `B2bFileDropAreaComponent` |
| `icon_button` | `B2bButtonComponent` | `button[b2b-button]` | el icono dentro, con `B2bIconComponent` (`b2b-icon`) |
| `key_value` | `B2bReadDataComponent` | `b2b-read-data` | — |
| `label` | `B2bLabelComponent` | `label[b2b-label]` | — |
| `link` | `B2bLinkComponent` | `a[b2b-link]` | — |
| `list` | `B2bListComponent` | `[b2b-list]` | cada fila, `B2bListBasicComponent` (`li[b2b-list-basic]`) |
| `menu_item` | `B2bOptionsMenuItemComponent` | `li[b2b-options-menu-item]` | dentro de `B2bOptionsMenuComponent` |
| `multiselect` | `B2bDropDownMultipleSelectComponent` | `b2b-dropdown-multiple-select` | — |
| `number` | `B2bInputComponent` | `input[b2b-input] type="number"` | para un contador con +/− usa `B2bNumberPickerComponent` |
| `password` | `B2bPasswordFieldComponent` | `b2b-password-field` | — |
| `primary_button` | `B2bButtonComponent` | `button[b2b-button]` | es una DIRECTIVA sobre `<button>`; la variante va por atributo |
| `radio_group` | `B2bRadioButtonListComponent` | `ul[b2b-radio-button-list]` | cada opción es un `B2bRadioButtonComponent` (`input[b2b-radio-button]`) |
| `search` | `B2bSearchComponent` | `b2b-search` | — |
| `secondary_button` | `B2bButtonComponent` | `button[b2b-button]` | misma directiva, variante secundaria |
| `select` | `B2bDropDownSelectComponent` | `b2b-dropdown-select` | — |
| `submit` | `B2bButtonComponent` | `button[b2b-button] type="submit"` | — |
| `table` | `B2bTableContainerComponent` | `b2b-table-container` | filtros/búsqueda/acciones van en su slot de CABECERA (`*-header`), no encima; la paginación es `B2bPaginatorComponent`, aparte |
| `text` | `B2bInputComponent` | `input[b2b-input]` | — |
| `text_block` | `B2bReadDataComponent` | `b2b-read-data` | — |
| `textarea` | `B2bTextAreaComponent` | `textarea[b2b-text-area]` | — |
| `toggle` | `B2bToggleSwitchComponent` | `b2b-toggle-switch` | — |

### Reglas verificadas contra el paquete (catálogo `3.12.17`, curated)

Cada una de estas costó un commit humano en el ciclo anterior. El runtime pasa un lint de plantillas (`design-system`) que las comprueba sobre tu HTML/SCSS:

- **Blocker** `notification-visible` — `b2b-notification-inline` arranca con `visible=false`: pon SIEMPRE `[visible]="true"` (o la señal que lo gobierna) o el aviso no se pinta — 0 de 25 avisos visibles en el ciclo 4.
- **Blocker** `notification-type-enum` — `type` de `b2b-notification-inline` es `ok | error | alert | info`. `warning`, `success`, `danger` no existen y dejan el aviso sin estilo.
- Warning `tag-not-badge` — Una etiqueta de estado con texto es `b2b-tag`. `b2b-badge` es un punto de 8 px (indicador de notificación), no un chip.
- Warning `table-header-slot` — Filtros, búsqueda y botones de una tabla van en el slot de cabecera de `b2b-table-container` (`*-header`), no en un bloque separado encima: si no, la tabla sale «partida» (15 en el ciclo 4).
- Warning `header-slots` — `b2b-header-desktop` se rellena por slots: `[b2b-header-logo]` para el logo y `[b2b-header-functions]` para las acciones. Sin ellos la cabecera queda vacía.
- Warning `width-full` — Los controles de formulario llevan la clase `b2b-width-full` para ocupar el ancho del contenedor; sin ella salen con ancho fijo y el layout se desalinea.
- **Blocker** `assets-path` — Los assets del paquete se sirven en `/assets/b2b-components/**` (una sola entrada `assets` con `input: …/src/assets`). `/assets/icons`, `/assets/fonts` o `/assets/img` compilan y dan 404 en fuentes e iconos.
- **Blocker** `title-tokens` — Los tokens tipográficos son `--b2b-titles-NN-font-size` (con sufijo). `var(--b2b-titles-06)` a secas no existe: el título sale con el tamaño del navegador.
- **Blocker** `attribute-directives` — Media librería son DIRECTIVAS sobre elementos nativos: `<button b2b-button>`, `<input b2b-input>`, `<input b2b-checkbox>`, `<a b2b-link>`. Escribir `<b2b-button>` no pinta nada ni da error de compilación.

**Inputs y slots que importan:**

- `B2bNotificationInlineComponent` · input `visible`: boolean — arranca en `false`: sin `[visible]="true"` (o una señal) el aviso NO se pinta
- `B2bNotificationInlineComponent` · input `type`: enum `ok | error | alert | info` (no existe `warning` ni `success`)
- `B2bTableContainerComponent` · slot cabecera (`*-header`): la ZONA DE ACCIONES de la tabla — filtros, búsqueda y botones van proyectados ahí, no en un bloque aparte encima

- clase `b2b-width-full`: controles a ancho completo del contenedor; sin ella los inputs/selects salen con ancho fijo

### Snippets (copia la forma, cambia los datos)

`badge`:
```html
<b2b-tag>{{ estado }}</b2b-tag>
```
`banner`:
```html
<b2b-notification-inline [visible]="true" type="info">Texto del aviso</b2b-notification-inline>
```
`checkbox`:
```html
<input b2b-checkbox type="checkbox" [formControl]="form.controls.acepta" />
```
`empty_state`:
```html
<b2b-notification-inline [visible]="items().length === 0" type="info">No hay resultados</b2b-notification-inline>
```
`link`:
```html
<a b2b-link [routerLink]="['/detalle', id]">Ver detalle</a>
```
`primary_button`:
```html
<button b2b-button type="button" (click)="guardar()">Guardar</button>
```
`secondary_button`:
```html
<button b2b-button variant="secondary" type="button">Cancelar</button>
```
`select`:
```html
<b2b-dropdown-select class="b2b-width-full" [formControl]="form.controls.tipo" [options]="tipos"></b2b-dropdown-select>
```
`table`:
```html
<b2b-table-container>
  <!-- slot de cabecera: filtros, búsqueda y acciones -->
  ...
</b2b-table-container>
```
`text`:
```html
<input b2b-input class="b2b-width-full" [formControl]="form.controls.nombre" />
```
`title`:
```html
<h1 style="font-size: var(--b2b-titles-04-font-size)">Título de la pantalla</h1>
```

### Estructura de la pantalla

| componente | selector | para qué |
|---|---|---|
| `B2bContainerComponent` | `b2b-container` | envoltorio de contenido de la página |
| `B2bGridLayoutComponent` | `b2b-grid-layout` | rejilla |
| `B2bSubheaderComponent` | `b2b-subheader` | cabecera de sección |
| `B2bHeaderDesktopComponent` | `b2b-header-desktop` | cabecera (móvil: `B2bHeaderMobileComponent`) — slots: `[b2b-header-logo]` — el logotipo (`b2b-mapfre-logo`); `[b2b-header-functions]` — acciones de cabecera (usuario, salir…) |
| `B2bSidebarComponent` | `b2b-sidebar` | navegación lateral; cada entrada, `B2bSidebarItemComponent` |
| `B2bBreadcrumbsComponent` | `b2b-breadcrumbs` | migas de pan |
| `B2bTabGroupComponent` | `b2b-tab-group` | pestañas; cada una, `B2bTabComponent` |
| `B2bStepperComponent` | `b2b-stepper` | asistente por pasos |
| `B2bModalComponent` | `b2b-modal` | diálogo |
| `B2bSidepanelComponent` | `b2b-sidepanel` | panel lateral deslizante |
| `B2bSpinnerComponent` | `b2b-spinner` | indicador de carga |
| `B2bPaginatorComponent` | `b2b-paginator` | paginación |
| `B2bFooterComponent` | `b2b-footer` | pie |
| `B2bMapfreLogoComponent` | `b2b-mapfre-logo` | logotipo |

**El MARCO de la aplicación también se monta con esta tabla.** La cabecera, la navegación, el pie y el envoltorio de página son design system igual que un botón: `b2b-header-desktop`, `b2b-sidebar` (+ `B2bSidebarItemComponent` por entrada), `b2b-container`, `b2b-footer`, `b2b-mapfre-logo`. Un `<header><nav><ul><li><a>` a mano es **Blocker** `design-system`: se pinta como una lista con topos y enlaces azules del navegador, y es lo primero que se ve del producto. Pasó exactamente eso en NoteBase — las pantallas usaban la librería y el marco no, porque el marco no es ninguna de las pantallas de la lista de abajo. Si construyes o tocas el shell, va con estos componentes.

### Tipografía

Los widgets de la spec son CONTROLES; el texto no tiene widget. Un `<h1>` a secas se pinta con el tamaño por defecto del navegador aunque la hoja esté cargada. Usa la escala del design system — **con el sufijo `-font-size`**: `var(--b2b-titles-06)` a secas no existe y deja el título con el tamaño del navegador:

| para | variable | tamaño |
|---|---|---|
| título de página | `var(--b2b-titles-04-font-size)` | 2.5rem — uno por pantalla |
| título de sección | `var(--b2b-titles-06-font-size)` | 2rem |
| subtítulo | `var(--b2b-titles-08-font-size)` | 1.5rem |
| encabezado menor | `var(--b2b-titles-10-font-size)` | 1rem |
| texto corrido | `var(--b2b-text-font-size)` | 1rem |
| pie / leyenda | `var(--b2b-text-caption-m-font-size)` | 0.875rem |

### Formularios

Prefiere `@mapfre-tech/formly-b2b` (formularios dirigidos por JSON sobre los mismos componentes B2B) antes que montar el HTML a mano.

**Sus peers de Angular hay que FIJARLOS al major del arquetipo.** Los paquetes corporativos los declaran abiertos por arriba (`>=17.3.9`), así que npm resuelve el último major publicado y la instalación muere con `ERESOLVE` — verificado: sobre Angular 19, `npm i @mapfre-tech/formly-b2b@1.2.0` a secas elige `@angular/material@22` y falla. Instálalos con la versión explícita:

```
npm i @angular/material@~<major-del-arquetipo> @angular/cdk@~<major-del-arquetipo> @angular/material-date-fns-adapter@~<major-del-arquetipo>
```

**Regla de oro:** si un componente no está en las tablas de arriba, compruébalo en el paquete instalado (`node_modules/@mapfre-tech/b2b-components`) antes de usarlo. No inventes nombres ni APIs — un `B2bEmptyStateComponent` que no existe es un `TS2305` en cuanto compilas, y hay nombres que se parecen mucho al que uno espera (`B2bCheckBoxComponent`, no `Checkbox`; `B2bTableContainerComponent`, no `Table`).

## Pantallas a implementar (arquitectura T.5 + detalle de UI de B.7)

> 8 pantalla(s) de esta tarea. TRANSCRIBE el detalle: no inventes pantallas, rutas, etiquetas ni navegación. Cuando una pantalla trae «Detalle de UI (B.7)», ESA es la fuente autoritativa — sus `label` son el texto a pintar y su `widget` el control a usar, ya decididos y aprobados. Los bloques de la fase FLOWS son contexto: sus textos son términos de dominio (glosario), NO etiquetas de UI. Respeta el design system del arquetipo.

### ARC-028 · Bandeja de incidencias
El técnico de mantenimiento consulta todas las incidencias con filtros por sala, oficina, categoría, estado, asignación y fechas
- **API**: esta pantalla no trae cableado pantalla→endpoint de T.5. NO lo interpretes como «no llama a la API»: elige los endpoints que necesita de la tabla del contrato congelado (sección api-contract), con su path y su verbo literales, y **repórtalo como health check `Warning` con `check: api-contract`** indicando cuáles has usado.
- **Detalle de UI (B.7) · `UIS-001`** — FUENTE AUTORITATIVA: los `label` son el texto a pintar y el `widget` el control a usar.
  - Propósito: El técnico de mantenimiento localiza las incidencias de la organización que necesita atender, acotándolas por sala, oficina, categoría, estado, asignación o fechas, y entra en la que quiere trabajar.
  - Disposición: **listado** (`list`) — respétala; no rediseñes la pantalla.
  - Navegación: es PUERTA DE ENTRADA de la aplicación; sección de menú «Incidencias» (orden 0).
  - **Sección «Búsqueda y filtros»** (2 columnas):
    - «Buscar» (widget `secondary_button`, opcional) — si el texto de búsqueda no excede el máximo admitido
    - «Buscar por nombre o correo» (widget `search`, tipo `string`, opcional) — texto libre; se rechaza la consulta si supera la longitud máxima admitida
    - «Rol» (widget `select`, tipo `enum`, opcional) — valores admitidos: Todos, Empleado, Técnico de mantenimiento, Administrador
    - «Aplicar filtros» (widget `secondary_button`, opcional) — si el filtro de rol y el de capacidad de recibir avisos son válidos
    - «Recibe avisos» (widget `select`, tipo `enum`, opcional) — valores admitidos: Todos, Sí, No; cualquier otro valor invalida la consulta
  - **Sección «Resultados»** (1 columna):
    - _(declarada sin elementos asignados.)_
  - **Datos que muestra:**
    - «Destinatarios de avisos» (widget `table`, opcional)
      - Columnas: «Nombre y apellidos» (`label`), «Correo corporativo» (`label`), «Rol vigente» (`badge`), «Recibe avisos» (`badge`)
    - «Ningún destinatario cumple la búsqueda o los filtros» (widget `empty_state`, opcional)
  - **Acciones:**
    - «Abrir la ficha» (widget `link`, opcional)
    - «Ver el equipo de mantenimiento» (widget `secondary_button`, opcional)
    - «Ver los no notificables» (widget `primary_button`, opcional, navega)
- Flujo `FLOW-003` · pantalla `SCR-001`
  - **Rutas:** `/incidencias`
  - **Componentes de UI:** Buscador por texto libre; Panel de filtros por sala, oficina, categoría, estado, asignación y fechas; Selector de criterio de ordenación; Tabla de incidencias de la organización; Indicador de asignación por fila; Contador de resultados encontrados; Paginador de resultados; Bloque de estado vacío sin resultados
  - **Datos que muestra:** Código de referencia de la incidencia; Sala afectada; Oficina a la que pertenece la sala; Categoría de la incidencia; Estado actual de la incidencia; Técnico de mantenimiento asignado; Empleado reportante; Fecha de alta de la incidencia; Número total de incidencias del resultado
  - **Acciones del usuario:** Filtrar la bandeja por sala, oficina o categoría; Filtrar la bandeja por estado de la incidencia; Filtrar la bandeja por asignación del técnico de mantenimiento; Filtrar la bandeja por rango de fechas; Buscar incidencias por texto; Ordenar la bandeja de incidencias; Avanzar a la siguiente página de resultados; Limpiar los filtros aplicados; Abrir el detalle de la incidencia seleccionada
  - **Navegación:**
    - Abrir la incidencia seleccionada → «Detalle de la incidencia» [navigate]

### ARC-029 · Detalle de la incidencia
El técnico consulta la ficha completa de una incidencia y lanza desde ella las acciones de gestión disponibles
- **API**: esta pantalla no trae cableado pantalla→endpoint de T.5. NO lo interpretes como «no llama a la API»: elige los endpoints que necesita de la tabla del contrato congelado (sección api-contract), con su path y su verbo literales, y **repórtalo como health check `Warning` con `check: api-contract`** indicando cuáles has usado.
- **Detalle de UI (B.7) · `UIS-002`** — FUENTE AUTORITATIVA: los `label` son el texto a pintar y el `widget` el control a usar.
  - Propósito: El técnico de mantenimiento consulta todo lo reportado sobre una incidencia concreta y su situación actual para decidir cómo actuar sobre ella.
  - Disposición: **detalle** (`detail`) — respétala; no rediseñes la pantalla.
  - Navegación: sección de menú «Incidencias» (orden 1).
  - **Sección «Clasificación»** (2 columnas):
    - _(declarada sin elementos asignados.)_
  - **Sección «Descripción y foto»** (1 columna):
    - _(declarada sin elementos asignados.)_
  - **Sección «Responsable»** (2 columnas):
    - _(declarada sin elementos asignados.)_
  - **Datos que muestra:**
    - «Usuarios que hoy no reciben avisos» (widget `label`, tipo `integer`, opcional)
    - «Destinatarios excluidos» (widget `table`, opcional)
      - Columnas: «Nombre y apellidos» (`label`), «Correo corporativo» (`label`), «Motivo de la exclusión» (`badge`)
    - «Todos los usuarios pueden recibir avisos» (widget `empty_state`, opcional)
  - **Acciones:**
    - «Abrir la ficha» (widget `link`, opcional)
    - «Volver a la verificación» (widget `secondary_button`, opcional, navega)
- Flujo `FLOW-002` · pantalla `SCR-002`
  - **Rutas:** `/mis-incidencias/{id}`
  - **Componentes de UI:** Cabecera de la incidencia con código y estado actual; Ficha de clasificación con sala, oficina y categoría; Bloque de descripción de la incidencia; Tarjeta del técnico de mantenimiento asignado; Visor de la foto adjunta; Enlace al historial de cambios de estado; Botón de vuelta al listado
  - **Datos que muestra:** Código de referencia de la incidencia; Sala afectada; Oficina a la que pertenece la sala; Categoría de la incidencia; Descripción de la incidencia; Estado actual de la incidencia; Técnico de mantenimiento asignado; Foto adjunta de la incidencia; Fecha de alta de la incidencia
  - **Acciones del usuario:** Ampliar la foto adjunta de la incidencia; Abrir el historial de cambios de estado; Volver al listado de mis incidencias
  - **Navegación:**
    - Volver a Mis incidencias → «Mis incidencias» [back]
    - Ver historial de cambios de estado → «Historial de cambios de estado» [navigate]
- Flujo `FLOW-003` · pantalla `SCR-002`
  - **Rutas:** `/incidencias/{id}`
  - **Componentes de UI:** Cabecera de la incidencia con código y estado actual; Ficha de clasificación con sala, oficina y categoría; Bloque de descripción y foto adjunta; Bloque de responsable de la incidencia; Barra de acciones sobre la incidencia; Enlace de vuelta a la bandeja conservando los filtros
  - **Datos que muestra:** Código de referencia de la incidencia; Sala afectada; Oficina a la que pertenece la sala; Categoría de la incidencia; Descripción de la incidencia; Estado actual de la incidencia; Técnico de mantenimiento asignado; Empleado reportante; Foto adjunta de la incidencia; Fecha de alta de la incidencia
  - **Acciones del usuario:** Volver a la bandeja conservando los filtros aplicados; Abrir el historial de la incidencia
  - **Navegación:**
    - Volver a la bandeja de incidencias → «Bandeja de incidencias» si Conservando los filtros y la paginación aplicados [back]
- Flujo `FLOW-004` · pantalla `SCR-001`
  - **Rutas:** `/incidencias/{id}`
  - **Componentes de UI:** Bloque de responsabilidad con el técnico de mantenimiento asignado; Botón Asignarme la incidencia; Botón Reasignar; Botón Liberar; Banner de resultado o error de la acción
  - **Datos que muestra:** Código de referencia de la incidencia; Técnico de mantenimiento asignado; Fecha de la última asignación; Estado actual de la incidencia; Sala afectada; Categoría de la incidencia
  - **Acciones del usuario:** Asignarme la incidencia; Abrir la reasignación del técnico de mantenimiento; Abrir la liberación de la incidencia; Abrir el historial de la incidencia
  - **Navegación:**
    - Pulsar Reasignar → «Reasignación del técnico de mantenimiento» si Si la incidencia tiene técnico de mantenimiento asignado y no está cerrada [open_modal]
    - Pulsar Liberar incidencia → «Liberación de la incidencia» si Si la incidencia tiene técnico de mantenimiento asignado [open_modal]
    - Ver historial de la incidencia → «Historial de la incidencia» [navigate]
- Flujo `FLOW-005` · pantalla `SCR-001`
  - **Rutas:** `/incidencias/{id}`
  - **Componentes de UI:** Cabecera con el estado actual de la incidencia; Barra de acciones de transición del ciclo de vida; Indicador del motivo de bloqueo de cada transición no disponible; Diagrama o guía visual del ciclo de vida de la incidencia; Banner de error de transición rechazada
  - **Datos que muestra:** Código de referencia de la incidencia; Estado actual de la incidencia; Transiciones disponibles del ciclo de vida; Motivo de bloqueo de la transición; Técnico de mantenimiento asignado
  - **Acciones del usuario:** Iniciar la atención de la incidencia; Marcar la incidencia como resuelta; Mostrar el motivo de bloqueo de una transición no disponible; Actualizar las transiciones disponibles
  - **Navegación:**
    - Pulsar Iniciar atención → «Confirmación de inicio de atención» si Si la incidencia está abierta y la transición está disponible [open_modal]
    - Pulsar Marcar como resuelta → «Marcar la incidencia como resuelta» si Si la incidencia está en curso y la transición está disponible [open_modal]
    - Ver marcas temporales del ciclo de vida → «Marcas temporales del ciclo de vida» [navigate]
- Flujo `FLOW-007` · pantalla `SCR-001`
  - **Rutas:** `/incidencias/{id}`
  - **Componentes de UI:** Cabecera de la incidencia con estado actual; Bloque de clasificación actual de sala y categoría; Botón Reclasificar sala o categoría; Indicador del motivo por el que la reclasificación no está disponible; Enlace a la traza de reclasificaciones
  - **Datos que muestra:** Código de referencia de la incidencia; Sala afectada actual; Oficina a la que pertenece la sala; Categoría de la incidencia actual; Estado actual de la incidencia
  - **Acciones del usuario:** Abrir la reclasificación de sala o categoría; Abrir la traza de reclasificaciones
  - **Navegación:**
    - Pulsar Reclasificar sala o categoría → «Reclasificación de sala y categoría» si Si la incidencia no está cerrada [open_modal]
    - Ver traza de reclasificaciones → «Traza de reclasificaciones» [navigate]
- Flujo `FLOW-008` · pantalla `SCR-002`
  - **Rutas:** `/incidencias/{id}`
  - **Componentes de UI:** Ficha de la incidencia asociada a la entrada de actividad; Marcador de la entrada de actividad seleccionada; Enlace de vuelta a la actividad reciente conservando los filtros
  - **Datos que muestra:** Código de referencia de la incidencia; Sala afectada; Oficina a la que pertenece la sala; Categoría de la incidencia; Estado actual de la incidencia; Técnico de mantenimiento asignado; Entrada de actividad seleccionada
  - **Acciones del usuario:** Volver a la actividad reciente conservando los filtros
  - **Navegación:**
    - Volver a la actividad reciente de incidencias → «Actividad reciente de incidencias» si Conservando los filtros y la página aplicados [back]
- Flujo `FLOW-029` · pantalla `SCR-003`
  - **Rutas:** `/incidencias/{id}`
  - **Componentes de UI:** Tarjeta de cabecera de la incidencia con sala y categoría; Bloque de descripción de la incidencia; Indicador del estado actual de la incidencia; Panel con el reportante y el usuario asignado; Enlaces al historial de cambios de estado y a la foto adjunta
  - **Datos que muestra:** Sala de la incidencia; Categoría de la incidencia; Descripción de la incidencia; Estado actual de la incidencia; Empleado reportante de la incidencia; Técnico de mantenimiento asignado; Fecha de reporte de la incidencia
  - **Acciones del usuario:** Consultar el historial de cambios de estado de la incidencia; Ver la foto adjunta de la incidencia; Volver al listado de incidencias
  - **Navegación:**
    - Ver el historial de cambios de estado → «Historial de cambios de estado» [navigate]
    - Ver la foto adjunta de la incidencia → «Foto adjunta de la incidencia» si Si la incidencia tiene foto adjunta [open_modal]
    - Volver a «Mis incidencias» → «Mis incidencias» [back]
    - Volver al listado completo de incidencias → «Listado completo de incidencias» [back]

### ARC-030 · Reasignación del técnico de mantenimiento
El técnico responsable traspasa la incidencia a otro técnico activo seleccionado del directorio
- **API**: esta pantalla no trae cableado pantalla→endpoint de T.5. NO lo interpretes como «no llama a la API»: elige los endpoints que necesita de la tabla del contrato congelado (sección api-contract), con su path y su verbo literales, y **repórtalo como health check `Warning` con `check: api-contract`** indicando cuáles has usado.
- **Detalle de UI (B.7) · `UIS-023`** — FUENTE AUTORITATIVA: los `label` son el texto a pintar y el `widget` el control a usar.
  - Propósito: Spec mínima B.7 (stub Playwright) para ARC-030: Reasignación del técnico de mantenimiento.
  - Disposición: **formulario** (`form`) — respétala; no rediseñes la pantalla.
  - Navegación: sección de menú «incidents-tech» (orden 0).
- Flujo `FLOW-004` · pantalla `SCR-002`
  - **Rutas:** `/incidencias/{id}/reasignar`
  - **Componentes de UI:** Diálogo modal de reasignación; Buscador y selector del técnico de mantenimiento activo destino; Resumen de la reasignación con responsable actual y destino; Botón Confirmar reasignación; Botón Cancelar
  - **Datos que muestra:** Código de referencia de la incidencia; Técnico de mantenimiento actualmente asignado; Técnico de mantenimiento destino; Estado de actividad del técnico de mantenimiento
  - **Acciones del usuario:** Buscar el técnico de mantenimiento destino; Seleccionar el técnico de mantenimiento activo destino; Confirmar la reasignación; Cancelar la reasignación
  - **Navegación:**
    - Confirmar la reasignación → «Detalle de la incidencia» si Si el técnico de mantenimiento destino está activo [submit]
    - Cancelar la reasignación → «Detalle de la incidencia» [back]

### ARC-031 · Liberación de la incidencia
El técnico responsable deja de hacerse cargo de la incidencia indicando el motivo obligatorio
- **API**: esta pantalla no trae cableado pantalla→endpoint de T.5. NO lo interpretes como «no llama a la API»: elige los endpoints que necesita de la tabla del contrato congelado (sección api-contract), con su path y su verbo literales, y **repórtalo como health check `Warning` con `check: api-contract`** indicando cuáles has usado.
- **Detalle de UI (B.7) · `UIS-003`** — FUENTE AUTORITATIVA: los `label` son el texto a pintar y el `widget` el control a usar.
  - Propósito: El técnico responsable justifica por qué deja de hacerse cargo de la incidencia y confirma que esta vuelva a quedar sin responsable.
  - Disposición: **formulario** (`form`) — respétala; no rediseñes la pantalla.
  - **Sección «Incidencia a liberar»** (1 columna):
    - _(declarada sin elementos asignados.)_
  - **Sección «Motivo de la liberación»** (1 columna):
    - _(declarada sin elementos asignados.)_
  - **Datos que muestra:**
    - «Técnicos que recibirían el aviso» (widget `label`, tipo `integer`, opcional)
    - «Integrantes del equipo» (widget `list`, opcional)
      - Columnas: «Nombre y apellidos» (`label`), «Correo corporativo» (`label`), «Recibe avisos» (`badge`)
    - «Sin técnicos que puedan recibir el aviso: se enviará al buzón de respaldo o no lo recibirá nadie si no está configurado» (widget `banner`, opcional)
  - **Acciones:**
    - «Abrir la ficha» (widget `link`, opcional)
    - «Volver a la verificación» (widget `secondary_button`, opcional, navega)
- Flujo `FLOW-004` · pantalla `SCR-003`
  - **Rutas:** `/incidencias/{id}/liberar`
  - **Componentes de UI:** Diálogo modal de liberación; Campo de texto del motivo de liberación con contador y validación de longitud; Resumen de la incidencia a liberar; Botón Confirmar liberación; Botón Cancelar
  - **Datos que muestra:** Código de referencia de la incidencia; Técnico de mantenimiento asignado; Motivo de liberación
  - **Acciones del usuario:** Escribir el motivo de liberación; Confirmar la liberación de la incidencia; Cancelar la liberación
  - **Navegación:**
    - Confirmar la liberación → «Detalle de la incidencia» si Si el motivo de liberación cumple la longitud exigida [submit]
    - Cancelar la liberación → «Detalle de la incidencia» [back]

### ARC-032 · Historial de la incidencia
El técnico revisa las entradas de asignación, reasignación y liberación con autor, fecha y motivo
- **API**: esta pantalla no trae cableado pantalla→endpoint de T.5. NO lo interpretes como «no llama a la API»: elige los endpoints que necesita de la tabla del contrato congelado (sección api-contract), con su path y su verbo literales, y **repórtalo como health check `Warning` con `check: api-contract`** indicando cuáles has usado.
- **Detalle de UI (B.7) · `UIS-004`** — FUENTE AUTORITATIVA: los `label` son el texto a pintar y el `widget` el control a usar.
  - Propósito: El técnico de mantenimiento revisa quién se hizo cargo de la incidencia en cada momento, con el autor, la fecha y el motivo de cada cambio de responsable.
  - Disposición: **listado** (`list`) — respétala; no rediseñes la pantalla.
  - Navegación: sección de menú «Incidencias» (orden 1).
  - **Sección «Filtros»** (1 columna):
    - _(declarada sin elementos asignados.)_
  - **Sección «Línea temporal»** (1 columna):
    - _(declarada sin elementos asignados.)_
  - **Datos que muestra:**
    - «Nombre y apellidos» (widget `label`, tipo `string`, opcional)
    - «Correo corporativo» (widget `label`, tipo `string`, opcional)
    - «Rol vigente» (widget `badge`, tipo `enum`, opcional)
    - «Estado de la cuenta» (widget `badge`, tipo `enum`, opcional)
  - **Acciones:**
    - «Editar el correo corporativo» (widget `primary_button`, opcional)
    - «Cambiar el rol» (widget `secondary_button`, opcional)
    - «Volver a la verificación» (widget `secondary_button`, opcional, navega)
- Flujo `FLOW-004` · pantalla `SCR-004`
  - **Rutas:** `/incidencias/{id}/historial/asignaciones`
  - **Componentes de UI:** Línea temporal de entradas de asignación, reasignación y liberación; Filtro por tipo de entrada de responsabilidad; Entrada de historial con autor y fecha-hora; Bloque de estado vacío sin entradas
  - **Datos que muestra:** Tipo de entrada de responsabilidad; Técnico de mantenimiento origen; Técnico de mantenimiento destino; Autor de la entrada; Fecha y hora de la entrada; Motivo de liberación
  - **Acciones del usuario:** Filtrar el historial por tipo de entrada de responsabilidad; Volver al detalle de la incidencia
  - **Navegación:**
    - Volver al detalle de la incidencia → «Detalle de la incidencia» [back]

### ARC-033 · Confirmación de inicio de atención
El técnico asignado confirma el paso de la incidencia de abierta a en curso
- **API**: esta pantalla no trae cableado pantalla→endpoint de T.5. NO lo interpretes como «no llama a la API»: elige los endpoints que necesita de la tabla del contrato congelado (sección api-contract), con su path y su verbo literales, y **repórtalo como health check `Warning` con `check: api-contract`** indicando cuáles has usado.
- **Detalle de UI (B.7) · `UIS-024`** — FUENTE AUTORITATIVA: los `label` son el texto a pintar y el `widget` el control a usar.
  - Propósito: Spec mínima B.7 (stub Playwright) para ARC-033: Confirmación de inicio de atención.
  - Disposición: **genérico** (`message`) — respétala; no rediseñes la pantalla.
  - Navegación: sección de menú «incidents-tech» (orden 0).
- Flujo `FLOW-005` · pantalla `SCR-002`
  - **Rutas:** `/incidencias/{id}/iniciar-atencion`
  - **Componentes de UI:** Diálogo de confirmación de inicio de atención; Resumen del cambio de estado de abierta a en curso; Botón Confirmar; Botón Cancelar
  - **Datos que muestra:** Código de referencia de la incidencia; Estado actual de la incidencia; Estado destino de la transición; Técnico de mantenimiento asignado
  - **Acciones del usuario:** Confirmar el inicio de atención; Cancelar y volver al detalle de la incidencia
  - **Navegación:**
    - Confirmar el inicio de atención → «Detalle de la incidencia» [submit]
    - Cancelar el inicio de atención → «Detalle de la incidencia» [back]

### ARC-034 · Marcar la incidencia como resuelta
El técnico responsable confirma el paso de en curso a resuelta con una nota de avance opcional
- **API**: esta pantalla no trae cableado pantalla→endpoint de T.5. NO lo interpretes como «no llama a la API»: elige los endpoints que necesita de la tabla del contrato congelado (sección api-contract), con su path y su verbo literales, y **repórtalo como health check `Warning` con `check: api-contract`** indicando cuáles has usado.
- **Detalle de UI (B.7) · `UIS-025`** — FUENTE AUTORITATIVA: los `label` son el texto a pintar y el `widget` el control a usar.
  - Propósito: Spec mínima B.7 (stub Playwright) para ARC-034: Marcar la incidencia como resuelta.
  - Disposición: **formulario** (`form`) — respétala; no rediseñes la pantalla.
  - Navegación: sección de menú «incidents-tech» (orden 0).
- Flujo `FLOW-005` · pantalla `SCR-003`
  - **Rutas:** `/incidencias/{id}/resolver`
  - **Componentes de UI:** Diálogo de confirmación de resolución; Campo de nota de avance opcional; Resumen del cambio de estado de en curso a resuelta; Botón Confirmar; Botón Cancelar
  - **Datos que muestra:** Código de referencia de la incidencia; Estado actual de la incidencia; Estado destino de la transición; Nota de avance
  - **Acciones del usuario:** Escribir la nota de avance; Confirmar el paso de la incidencia a resuelta; Cancelar la resolución
  - **Navegación:**
    - Confirmar la resolución → «Detalle de la incidencia» [submit]
    - Cancelar la resolución → «Detalle de la incidencia» [back]

### ARC-035 · Marcas temporales del ciclo de vida
El usuario consulta las fechas de apertura, inicio de atención, resolución y cierre y los días en el estado actual
- **API**: esta pantalla no trae cableado pantalla→endpoint de T.5. NO lo interpretes como «no llama a la API»: elige los endpoints que necesita de la tabla del contrato congelado (sección api-contract), con su path y su verbo literales, y **repórtalo como health check `Warning` con `check: api-contract`** indicando cuáles has usado.
- **Detalle de UI (B.7) · `UIS-026`** — FUENTE AUTORITATIVA: los `label` son el texto a pintar y el `widget` el control a usar.
  - Propósito: Spec mínima B.7 (stub Playwright) para ARC-035: Marcas temporales del ciclo de vida.
  - Disposición: **detalle** (`detail`) — respétala; no rediseñes la pantalla.
  - Navegación: sección de menú «incidents-tech» (orden 0).
- Flujo `FLOW-005` · pantalla `SCR-004`
  - **Rutas:** `/incidencias/{id}/ciclo-vida`
  - **Componentes de UI:** Bloque de marcas temporales de apertura, inicio de atención, resolución y cierre; Indicador de días transcurridos en el estado actual; Marcador de marcas temporales aún no alcanzadas
  - **Datos que muestra:** Fecha de apertura de la incidencia; Fecha de inicio de atención; Fecha de resolución; Fecha de cierre; Días en el estado actual
  - **Acciones del usuario:** Desplegar las marcas temporales del ciclo de vida
  - **Navegación:**
    - Volver al detalle de la incidencia → «Detalle de la incidencia» [back]

## Requisitos que materializa esta tarea

### REQ-025 — Listado completo con filtros por sala, categoría y estado exclusivo del técnico
El sistema habilita el listado completo de incidencias con filtros por sala, categoría y estado exclusivamente al rol técnico de mantenimiento. Reglas: (1) INCIDENT_LIST_ALL solo se autoriza con data_scope = ALL; (2) el técnico ve incidencias de cualquier reportante y de las tres oficinas, con los filtros combinables entre sí; (3) un empleado que invoque el recurso recibe denegación, no una versión recortada: la degradación silenciosa está prohibida porque oculta un fallo de permisos. Flujo: técnico abre «Todas las incidencias» → aplica filtros room_id / category_code / status → recibe el conjunto completo que cumple los filtros, con el reportante identificado. Datos: además de los de ALC-01, reporter_user_id y nombre del reportante, assignee_user_id. Catálogos: cat_salas [gap: listado de salas], cat_categorias_incidencia, cat_estados_incidencia. Validaciones: valores de filtro fuera de catálogo → 400 «Filtro no válido»; combinación sin resultados → lista vacía, no error. Errores: EMPLEADO invocando el recurso → 403 «No tienes permisos para consultar todas las incidencias». Aceptación: TECNICO_MANTENIMIENTO sin filtros recibe todas las incidencias; EMPLEADO recibe 403 y ninguna fila. Seguridad: el listado expone nombre y correo corporativo de terceros, por lo que el alcance se verifica en cada página solicitada. Dependencias: PERM-01; listado con filtros en MOD-002.
**Reglas de negocio:**
1. INCIDENT_LIST_ALL solo se autoriza a roles cuyo data_scope es ALL
2. Un rol sin permiso de listado completo obtiene una denegación, nunca una versión recortada del conjunto
3. Un valor de filtro de sala, categoría o estado fuera de su catálogo no es válido
4. Una combinación de filtros sin coincidencias produce un conjunto vacío, no una condición de error
**Criterios de aceptación:**
1. AC-BAN-01: Dado un `TECNICO_DE_MANTENIMIENTO` autenticado, cuando abre «Bandeja de incidencias», entonces ve incidencias de toda la organización con independencia del reportante y cada fila muestra sala, oficina, categoría, estado, fecha de creación, antigüedad en días, reportante e indicador de foto adjunta; y dada una incidencia sin técnico asignado, entonces la celda de técnico muestra el literal «Sin asignar» y nunca queda vacía.
2. AC-BAN-05: Dado un técnico en la bandeja, cuando filtra del 01/03 al 31/03, entonces el resultado incluye las incidencias creadas el 01/03 y el 31/03 (rango inclusivo, día completo en `Europe/Madrid`) y ninguna fuera del rango, combinando en AND con sala, categoría, estado y asignación; y cuando introduce una fecha de inicio posterior a la de fin o un rango superior a 2 años, entonces recibe el mensaje de error correspondiente y el listado previo permanece visible.
**Validaciones:**
1. El filtro `room_id` debe pertenecer al catálogo `cat_salas`; un valor fuera de catálogo devuelve `400` «Filtro no válido»
2. El filtro `category_code` debe pertenecer al catálogo `cat_categorias_incidencia` (mobiliario, climatización, audiovisual, limpieza, otros); valor fuera de catálogo → `400`
3. El filtro `status` debe pertenecer al catálogo `cat_estados_incidencia` (`ABIERTA`, `EN_CURSO`, `RESUELTA`, `CERRADA`); valor fuera de catálogo → `400`
4. Los filtros son opcionales y combinables entre sí; una combinación válida sin resultados devuelve lista vacía y no un error
**Escenarios de error:**
1. Valor de filtro de sala, categoría o estado fuera del catálogo admitido
2. Usuario sin rol de mantenimiento solicitando el listado completo de incidencias
**Campos de datos:**
- `room_id` (string, opcional) — Valor de `cat_salas`; fuera de catálogo → 400
- `category_code` (enum, opcional) — Valor de `cat_categorias_incidencia`; fuera de catálogo → 400
- `status` (enum, opcional) — Valor de `cat_estados_incidencia`; fuera de catálogo → 400
- `reporter_user_id` (uuid, obligatorio) — Visible solo con `data_scope = ALL`
- `reporter_name` (string, obligatorio) — Dato personal; alcance verificado en cada página solicitada
- `assignee_user_id` (uuid, opcional) — Nulo si la incidencia aún no está asignada

### REQ-105 — Composición de la fila y de la respuesta de la bandeja completa de incidencias
Cada fila representa una incidencia y muestra al menos sala, categoría, estado, fecha de creación y técnico asignado cuando lo tenga; si no tiene técnico muestra el literal «Sin asignar», nunca vacío; la fila indica con un distintivo si la incidencia tiene foto adjunta pero no expone la imagen (la descarga se rige por REQ-027); la antigüedad se calcula en backend, no en la SPA. Flujo: técnico autenticado abre «Bandeja de incidencias», el backend resuelve rol y alcance (REQ-060) y devuelve la página de resultados; si el rol no es técnico, corta antes de consultar. Datos: incident_id (number, PK), incident_code (string, obligatorio, único, visible), room_id (number, obligatorio) y room_name (string), office_name (string, derivado de la sala vía REQ-097/REQ-099), category_code + category_name (obligatorio, de cat_categorias_incidencia), status (enum obligatorio de cat_estados_incidencia: ABIERTA | EN_CURSO | RESUELTA | CERRADA), created_at (timestamp, obligatorio), updated_at (timestamp), reporter_name (string), assigned_technician_id (number, nullable), assigned_technician_name (string, nullable), has_photo (boolean), age_days (number, derivado = días naturales desde created_at). Catálogos: cat_categorias_incidencia (REQ-095), cat_salas y cat_oficinas (REQ-097/REQ-099), cat_estados_incidencia — [gap: el RFP enumera los cuatro estados pero no indica si deben persistirse como catálogo mantenible ni sus etiquetas de presentación]. Validaciones: ningún campo derivado se acepta desde el cliente; status fuera del catálogo nunca se devuelve. Errores: 401 «Tu sesión ha caducado, vuelve a iniciar sesión»; 403 uniforme «No tienes permisos para realizar esta acción» sin revelar existencia de datos (REQ-031); 500 «No se ha podido recuperar el listado, inténtalo de nuevo». Aceptación: Dado un TECNICO_DE_MANTENIMIENTO autenticado, cuando abre la bandeja, entonces ve incidencias de toda la organización con independencia del reportante y cada fila incluye sala, oficina, categoría, estado, fecha de creación, antigüedad, reportante e indicador de foto; Dada una incidencia sin técnico, cuando se lista, entonces muestra «Sin asignar». Seguridad: ejecuta TECNICO_DE_MANTENIMIENTO (alcance: todas las incidencias, REQ-029); EMPLEADO denegado (REQ-023); ADMINISTRADOR no tiene alcance sobre incidencias (REQ-014). Sin doble factor (operación de solo lectura, sin datos de categoría especial). Eventos: ninguno (operación de consulta). Dependencias: REQ-025, REQ-029, REQ-078, REQ-097, REQ-103, REQ-027. Prioridad [inferido] (el RFP no declara MoSCoW). Prioridad: Must.
**Reglas de negocio:**
1. Cada fila de la bandeja se corresponde con exactamente una incidencia, y su `incident_code` es único en todo el sistema
2. El estado de una incidencia es siempre uno de los cuatro valores del catálogo `cat_estados_incidencia` (`ABIERTA`, `EN_CURSO`, `RESUELTA`, `CERRADA`); ningún otro valor es observable en la bandeja
3. Una incidencia sin técnico asignado se presenta en la bandeja con el literal «Sin asignar», nunca con la celda vacía
4. La antigüedad de una incidencia (`age_days`) equivale a los días naturales transcurridos desde su `created_at`, y ningún valor de este campo procedente del cliente es válido
5. La bandeja completa solo tiene alcance para el rol TECNICO_DE_MANTENIMIENTO: EMPLEADO y ADMINISTRADOR no obtienen ninguna incidencia ajena por esta vía
6. Una fila indica la existencia de foto adjunta (`has_photo`) pero no expone la imagen: el acceso al fichero es un permiso independiente (REQ-027)
7. Una denegación por rol insuficiente es indistinguible entre «no existe» y «no autorizado»: el mensaje de 403 es uniforme y no revela la existencia de datos
8. El alcance de la bandeja del técnico es la totalidad de las incidencias de la organización, con independencia de quién sea el reportante
**Criterios de aceptación:**
1. AC-BAN-01: Dado un `TECNICO_DE_MANTENIMIENTO` autenticado, cuando abre «Bandeja de incidencias», entonces ve incidencias de toda la organización con independencia del reportante y cada fila muestra sala, oficina, categoría, estado, fecha de creación, antigüedad en días, reportante e indicador de foto adjunta; y dada una incidencia sin técnico asignado, entonces la celda de técnico muestra el literal «Sin asignar» y nunca queda vacía.
2. AC-BAN-08: Dado un usuario con rol `EMPLEADO` o `ADMINISTRADOR`, cuando invoca el endpoint de la bandeja completa, cualquiera de sus filtros o restaura una URL de bandeja compartida, entonces recibe un 403 uniforme sin resultados parciales ni pistas sobre la existencia de incidencias ajenas, y la autorización se reevalúa siempre en la API REST y nunca en la SPA (verificado manipulando la petición al margen del frontend).
3. AC-INC-05: Dada una incidencia con foto adjunta, cuando la descarga el técnico de mantenimiento o el empleado reportante, entonces obtiene el fichero; y cuando la solicita un empleado que no es el reportante, entonces recibe 403 uniforme y la imagen no es accesible por URL directa ni adivinable por enumeración de identificadores.
**Validaciones:**
1. Los campos derivados (`office_name`, `age_days`, `room_name`, `category_name`, `assigned_technician_name`, `has_photo`) no se aceptan desde el cliente: si llegan en la petición se ignoran y se recalculan en backend
2. El valor de `status` de cada fila debe pertenecer al catálogo `cat_estados_incidencia` (`ABIERTA`, `EN_CURSO`, `RESUELTA`, `CERRADA`); cualquier valor fuera del catálogo se rechaza
3. `incident_code` es obligatorio y único, y `room_id`, `category_code`, `status` y `created_at` son obligatorios en la respuesta de cada fila
**Escenarios de error:**
1. La sesión del usuario ha caducado o no se aporta una credencial válida al abrir la bandeja
2. El usuario autenticado no tiene el rol de técnico de mantenimiento y se deniega el acceso a la bandeja completa con un mensaje uniforme, sin revelar si existen incidencias
3. No ha sido posible recuperar el listado de incidencias y se muestra un mensaje genérico de reintento
**Campos de datos:**
- `incident_id` (integer, obligatorio) — Clave primaria; no aceptable desde el cliente
- `incident_code` (string, obligatorio) — Único
- `room_id` (integer, obligatorio) — Debe existir en el catálogo de salas
- `room_name` (string, opcional) — Nombre de la sala para mostrar en la fila
- `office_name` (string, opcional) — Derivado de la sala; no editable
- `category_code` (string, obligatorio) — Valor del catálogo de categorías de incidencia
- `category_name` (string, obligatorio) — Nombre de la categoría para mostrar en la fila
- `status` (enum, obligatorio) — ABIERTA | EN_CURSO | RESUELTA | CERRADA; nunca se devuelve un valor fuera del catálogo
- `created_at` (datetime, obligatorio) — Fecha y hora de creación de la incidencia
- `updated_at` (datetime, opcional) — Fecha y hora de la última modificación
- `reporter_name` (string, opcional) — Nombre del empleado que reportó la incidencia
- `assigned_technician_id` (integer, opcional) — Nulo si la incidencia no está asignada
- `assigned_technician_name` (string, opcional) — Si es nulo, la fila muestra el literal «Sin asignar»
- `has_photo` (boolean, opcional) — Solo indicador; no expone la imagen
- `age_days` (integer, opcional) — Derivado en backend desde created_at; ≥ 0; no aceptable desde el cliente

### REQ-106 — Ordenación configurable y paginación estable del listado
Reglas: orden por defecto created_at descendente (lo más reciente arriba); columnas ordenables: created_at, updated_at, status, room_name, category_name, age_days; status ordena por la secuencia del ciclo de vida (abierta → en curso → resuelta → cerrada), no alfabéticamente; el orden es estable con desempate siempre por incident_id descendente; orden y paginación se resuelven en base de datos (Oracle 23ai, OFFSET … FETCH), nunca troceando en la SPA; el total se calcula sobre el conjunto ya filtrado. Datos: sort_by (string, lista blanca, default created_at), sort_dir (enum ASC|DESC, default DESC), page (int ≥1, default 1), page_size (int, valores permitidos 10/25/50, default 25); respuesta con items[], total_count (int), page, page_size, total_pages. Validaciones: sort_by fuera de la lista blanca → 400 «Criterio de ordenación no válido»; page_size no permitido → 400 «Tamaño de página no válido»; page > total_pages → 200 con items vacío y total_count real (no es error). Errores: 400 con mensaje concreto; 401/403 como BAN-01. Aceptación: Dado un técnico en la bandeja, cuando no elige orden, entonces ve las incidencias más recientes primero; Dado un listado de 60 incidencias, cuando solicita página 2 con tamaño 25, entonces recibe los elementos 26–50, total_count=60 y total_pages=3, sin repetir ni omitir filas entre páginas. Seguridad: TECNICO_DE_MANTENIMIENTO; la paginación no amplía el alcance de datos del rol. Dependencias: BAN-01, REQ-025. [gap: el RFP no fija tamaño de página ni orden por defecto; los valores propuestos se dimensionan para el volumen declarado de 50 incidencias/mes y 50 usuarios concurrentes]. Prioridad [inferido]. Prioridad: Must.
**Reglas de negocio:**
1. En ausencia de criterio explícito, el orden de la bandeja es `created_at` descendente
2. Solo son ordenables las columnas `created_at`, `updated_at`, `status`, `room_name`, `category_name` y `age_days`; cualquier otro criterio es inválido
3. La ordenación por `status` sigue la secuencia del ciclo de vida (abierta → en curso → resuelta → cerrada) y no el orden alfabético de la etiqueta
4. Dos incidencias con igual valor en la columna de ordenación se desempatan siempre por `incident_id` descendente, de modo que el orden es determinista
5. Una misma incidencia no aparece en dos páginas distintas ni se omite entre páginas consecutivas de una misma consulta
6. El `total_count` se calcula sobre el conjunto ya filtrado, no sobre el total de incidencias existentes
7. El tamaño de página válido es exclusivamente 10, 25 o 50, siendo 25 el valor por defecto
8. Una página solicitada por encima de `total_pages` no es una condición de error: el resultado es vacío con `total_count` real
9. La paginación y la ordenación no amplían el conjunto de incidencias accesible por el rol
**Criterios de aceptación:**
1. AC-BAN-02: Dado un listado de 60 incidencias y un técnico que no selecciona criterio de orden, cuando carga la bandeja, entonces ve las incidencias ordenadas por fecha de creación descendente; y cuando solicita página 2 con tamaño 25, entonces recibe exactamente los elementos 26–50, `total_count=60` y `total_pages=3`, sin filas repetidas ni omitidas al recorrer las 3 páginas (desempate estable por `incident_id` descendente).
2. AC-BAN-03: Dado un técnico en la bandeja, cuando ordena por estado, entonces el resultado sigue la secuencia del ciclo de vida `ABIERTA → EN_CURSO → RESUELTA → CERRADA` y no el orden alfabético; y cuando envía un `sort_by` fuera de la lista blanca o un `page_size` distinto de 10/25/50, entonces recibe 400 con mensaje concreto («Criterio de ordenación no válido» / «Tamaño de página no válido»); y cuando pide una página superior a `total_pages`, entonces recibe 200 con `items` vacío y `total_count` real, no un error.
3. AC-BAN-09: Dado el volumen de la ventana de retención (≈1.200 incidencias) y 50 usuarios concurrentes, cuando un técnico ejecuta consultas de bandeja con filtros combinados y búsqueda por texto durante 7 días laborables en producción, entonces el p95 del endpoint de listado es < 2.000 ms y el 100 % de las consultas resuelve orden y paginación en base de datos (`OFFSET … FETCH`), sin troceo en la SPA. [inferido: umbral no declarado en el RFP]
**Validaciones:**
1. `sort_by` debe pertenecer a la lista blanca `created_at`, `updated_at`, `status`, `room_name`, `category_name`, `age_days`; en caso contrario se devuelve 400 «Criterio de ordenación no válido»
2. `sort_dir` debe ser uno de los valores del enum `ASC` o `DESC` (por defecto `DESC`)
3. `page` debe ser un entero mayor o igual que 1 (por defecto 1)
4. `page_size` debe ser un entero perteneciente al conjunto de valores permitidos 10, 25 o 50; en caso contrario se devuelve 400 «Tamaño de página no válido»
5. Una `page` superior a `total_pages` no es un error de validación: se responde 200 con `items` vacío y el `total_count` real
**Escenarios de error:**
1. El criterio de ordenación solicitado no está entre las columnas ordenables admitidas
2. El sentido de ordenación solicitado no es ascendente ni descendente
3. El tamaño de página solicitado no es uno de los valores permitidos
4. El número de página solicitado no es un entero mayor o igual que uno
5. La sesión del usuario ha caducado al solicitar una página u ordenación
6. El usuario autenticado no tiene el rol de técnico de mantenimiento para paginar u ordenar la bandeja completa
**Campos de datos:**
- `sort_by` (string, opcional) — Lista blanca: created_at, updated_at, status, room_name, category_name, age_days; default created_at
- `sort_dir` (enum, opcional) — ASC | DESC; default DESC
- `page` (integer, opcional) — ≥ 1; default 1; page > total_pages devuelve items vacío
- `page_size` (integer, opcional) — Valores permitidos 10, 25, 50; default 25
- `total_count` (integer, obligatorio) — Calculado sobre el resultado filtrado, no sobre el total absoluto
- `total_pages` (integer, obligatorio) — Derivado de total_count y page_size

### REQ-107 — Filtro por estado de asignación y por técnico asignado
Reglas: la bandeja permite acotar por assignment_filter ∈ {TODAS, SIN_ASIGNAR, ASIGNADAS_A_MI, ASIGNADAS_A_OTRO}; SIN_ASIGNAR ≡ assigned_technician_id IS NULL; ASIGNADAS_A_MI resuelve contra la identidad del usuario de la sesión, nunca contra un identificador enviado por el cliente (REQ-064, REQ-018); alternativamente puede filtrarse por un assigned_technician_id concreto; combina en AND con los filtros de sala, categoría y estado de REQ-025; el selector de técnicos se alimenta del colectivo de mantenimiento activo (REQ-082) y excluye cuentas desactivadas (REQ-089), pero un técnico desactivado que figure como asignado histórico sigue mostrándose en las filas. Flujo: técnico abre la bandeja → selecciona «Sin asignar» para localizar trabajo no tomado → combina con estado ABIERTA → obtiene su cola de trabajo priorizable. Datos: assignment_filter (enum, default TODAS), assigned_technician_id (number, nullable; debe existir y tener rol TECNICO_DE_MANTENIMIENTO). Validaciones: técnico inexistente, inactivo o con otro rol → 400 «Técnico no válido»; assignment_filter y assigned_technician_id simultáneos con valores contradictorios → prevalece assigned_technician_id y se informa en la UI [ambigüedad: el RFP no regula la combinación]. Errores: 400 descrito; 401/403 como BAN-01. Aceptación: Dado un técnico, cuando filtra por «Sin asignar» y estado «abierta», entonces el resultado contiene solo incidencias abiertas sin assigned_technician_id; Dado el filtro «Asignadas a mí», cuando se ejecuta, entonces solo aparecen las incidencias cuyo técnico es el usuario de la sesión. Seguridad: exclusivo TECNICO_DE_MANTENIMIENTO; un EMPLEADO que invoque el endpoint recibe 403 uniforme sin filtrado parcial (REQ-023, REQ-031). Dependencias: REQ-025, REQ-082, REQ-089. [inferido: el RFP solo enumera filtros por sala, categoría y estado; el filtro por asignación deriva del objetivo «ver el listado de incidencias abiertas, asignarse una y cambiar su estado hasta cerrarla»]. Prioridad [inferido]. Prioridad: Must.
**Reglas de negocio:**
1. El filtro de asignación toma un único valor del conjunto cerrado {`TODAS`, `SIN_ASIGNAR`, `ASIGNADAS_A_MI`, `ASIGNADAS_A_OTRO`}
2. Una incidencia pertenece a `SIN_ASIGNAR` si y solo si su `assigned_technician_id` es nulo
3. El conjunto «Asignadas a mí» se define por la identidad del usuario de la sesión, y no por ningún identificador aportado por el cliente
4. Un `assigned_technician_id` es válido como filtro solo si corresponde a un usuario existente, activo y con rol TECNICO_DE_MANTENIMIENTO
5. Los filtros de asignación, sala, categoría y estado son acumulativos: el resultado contiene solo las incidencias que cumplen todas las condiciones a la vez
6. El selector de técnicos ofrece únicamente técnicos de mantenimiento activos, mientras que un técnico desactivado sigue siendo visible como asignado histórico en las filas ya existentes
7. Un filtro por técnico concreto y un filtro por estado de asignación no coexisten con valores contradictorios: el técnico concreto prevalece
**Criterios de aceptación:**
1. AC-BAN-04: Dado un técnico en la bandeja, cuando filtra por «Sin asignar» combinado con estado `ABIERTA`, entonces el resultado contiene solo incidencias abiertas con `assigned_technician_id` nulo; y cuando selecciona «Asignadas a mí», entonces solo aparecen las incidencias cuyo técnico es el usuario de la sesión, resuelto contra la identidad de sesión y no contra un identificador enviado por el cliente; y cuando indica un técnico inexistente, inactivo o con otro rol, entonces recibe 400 «Técnico no válido».
2. AC-BAN-08: Dado un usuario con rol `EMPLEADO` o `ADMINISTRADOR`, cuando invoca el endpoint de la bandeja completa, cualquiera de sus filtros o restaura una URL de bandeja compartida, entonces recibe un 403 uniforme sin resultados parciales ni pistas sobre la existencia de incidencias ajenas, y la autorización se reevalúa siempre en la API REST y nunca en la SPA (verificado manipulando la petición al margen del frontend).
3. AC-USR-03: Dado un técnico desactivado, cuando un técnico activo despliega el selector de «técnico asignado» en la bandeja, entonces la cuenta desactivada no aparece como opción seleccionable; y cuando ese técnico desactivado figura como asignado histórico de una incidencia, entonces su nombre sigue mostrándose en la fila correspondiente.
**Validaciones:**
1. `assignment_filter` debe pertenecer al enum `TODAS`, `SIN_ASIGNAR`, `ASIGNADAS_A_MI`, `ASIGNADAS_A_OTRO` (por defecto `TODAS`)
2. `assigned_technician_id` debe corresponder a un usuario existente, activo y con rol TECNICO_DE_MANTENIMIENTO; si no existe, está inactivo o tiene otro rol se devuelve 400 «Técnico no válido»
3. El identificador usado para `ASIGNADAS_A_MI` no se acepta del cliente: se resuelve contra la identidad de la sesión
4. Coherencia entre campos: si se envían `assignment_filter` y `assigned_technician_id` con valores contradictorios, prevalece `assigned_technician_id` y se informa al usuario
**Escenarios de error:**
1. El valor del filtro de asignación no pertenece a las opciones admitidas
2. El técnico indicado en el filtro no existe, está desactivado o no tiene rol de técnico de mantenimiento
3. La sesión del usuario ha caducado al aplicar el filtro por asignación
4. El usuario autenticado no tiene el rol de técnico de mantenimiento para filtrar por asignación
**Campos de datos:**
- `assignment_filter` (enum, opcional) — TODAS | SIN_ASIGNAR | ASIGNADAS_A_MI | ASIGNADAS_A_OTRO; default TODAS; ASIGNADAS_A_MI se resuelve con la identidad de la sesión
- `assigned_technician_id` (integer, opcional) — Debe existir, estar activo y tener rol TECNICO_DE_MANTENIMIENTO; prevalece sobre assignment_filter si hay contradicción

### REQ-108 — Filtro por rango de fechas de creación de la incidencia
Reglas: created_from y created_to son opcionales e inclusivos (día completo en zona Europe/Madrid); created_from ≤ created_to; el rango máximo consultable es de 2 años, coherente con la ventana de retención declarada (REQ-015, REQ-047); combina en AND con sala, categoría, estado (REQ-025) y asignación (BAN-03); se ofrecen atajos «hoy», «últimos 7 días» y «mes en curso» que solo prefijan los dos campos. Datos: created_from (date, ISO-8601, nullable), created_to (date, ISO-8601, nullable). Validaciones: formato no ISO o fecha inexistente → 400 «Rango de fechas no válido»; created_from > created_to → 400 «La fecha de inicio no puede ser posterior a la de fin»; created_to futura → se acota silenciosamente a la fecha actual; rango > 2 años → 400 «El rango máximo consultable es de 2 años». Errores: los anteriores; 401/403 como BAN-01. Aceptación: Dado un técnico, cuando filtra del 01/03 al 31/03, entonces el resultado incluye las incidencias creadas ese 01/03 y ese 31/03 y ninguna fuera del rango; Dada una fecha de inicio posterior a la de fin, cuando aplica el filtro, entonces recibe un mensaje de error y el listado previo permanece visible. Seguridad: TECNICO_DE_MANTENIMIENTO; el filtro temporal no altera el alcance de datos por rol. Dependencias: BAN-01, BAN-02, REQ-025. Prioridad [inferido]. Prioridad: Should.
**Reglas de negocio:**
1. Los límites `created_from` y `created_to` son inclusivos y abarcan el día natural completo en la zona `Europe/Madrid`
2. Un rango de fechas válido cumple `created_from` ≤ `created_to`
3. La amplitud máxima de un rango consultable es de 2 años, coherente con la ventana de retención declarada
4. Ninguna incidencia con `created_at` posterior al instante actual es consultable: un `created_to` futuro equivale a la fecha actual
5. Los atajos temporales («hoy», «últimos 7 días», «mes en curso») son equivalentes a un par concreto de `created_from` y `created_to`, sin semántica de filtrado propia
6. El filtro temporal no altera el conjunto de incidencias accesible por el rol
**Criterios de aceptación:**
1. AC-BAN-05: Dado un técnico en la bandeja, cuando filtra del 01/03 al 31/03, entonces el resultado incluye las incidencias creadas el 01/03 y el 31/03 (rango inclusivo, día completo en `Europe/Madrid`) y ninguna fuera del rango, combinando en AND con sala, categoría, estado y asignación; y cuando introduce una fecha de inicio posterior a la de fin o un rango superior a 2 años, entonces recibe el mensaje de error correspondiente y el listado previo permanece visible.
**Validaciones:**
1. `created_from` y `created_to` son opcionales y, si se informan, deben tener formato de fecha ISO-8601 y corresponder a una fecha existente; en caso contrario se devuelve 400 «Rango de fechas no válido»
2. `created_from` no puede ser posterior a `created_to`; si lo es se devuelve 400 «La fecha de inicio no puede ser posterior a la de fin»
3. Una `created_to` posterior a la fecha actual se acota silenciosamente a la fecha actual
4. La amplitud del rango `created_from`–`created_to` no puede superar 2 años; si se supera se devuelve 400 «El rango máximo consultable es de 2 años»
**Escenarios de error:**
1. Las fechas del rango no tienen formato ISO-8601 o corresponden a una fecha inexistente
2. La fecha de inicio del rango es posterior a la fecha de fin
3. El rango de fechas solicitado supera el máximo consultable de 2 años
4. La sesión del usuario ha caducado al aplicar el filtro temporal
5. El usuario autenticado no tiene el rol de técnico de mantenimiento para filtrar por rango de fechas
**Campos de datos:**
- `created_from` (date, opcional) — ISO-8601; inclusivo (día completo, Europe/Madrid); ≤ created_to; rango máximo 2 años
- `created_to` (date, opcional) — ISO-8601; inclusivo; si es futura se acota a la fecha actual

### REQ-109 — Estado de la vista: filtros reproducibles en URL, restauración al volver y resultado vacío informativo
Reglas: filtros, orden y página se serializan como parámetros de consulta de la SPA Angular, de modo que la URL es compartible entre técnicos y reproduce exactamente la misma vista; al navegar al detalle de una incidencia y volver, se restaura el mismo estado (filtros, orden, página y posición de scroll); el último estado usado se recuerda por user_id durante la sesión y se restaura al reabrir la bandeja; si la consulta no arroja coincidencias, el sistema muestra un resultado vacío con mensaje informativo y mantiene los filtros seleccionados visibles para poder modificarlos (CA de EPIC-011): mensaje «No hay incidencias que cumplan los filtros seleccionados» más acción «Limpiar filtros»; un filtro que apunte a un valor de catálogo desactivado se conserva y se etiqueta «(inactivo)» en lugar de descartarse (REQ-103). Datos: view_state = { room_ids[], category_codes[], statuses[], assignment_filter, assigned_technician_id, created_from, created_to, search_text, sort_by, sort_dir, page, page_size }. Validaciones: parámetros desconocidos se ignoran; un valor fuera de catálogo se descarta con aviso no bloqueante y se aplica el resto [ambigüedad: el RFP no indica si un filtro inválido debe bloquear la consulta o degradarse]. Errores: 401 con redirección al acceso (REQ-058); 403 uniforme al restaurar una URL compartida sin rol suficiente. Aceptación: Dado un técnico con filtros aplicados que no devuelven resultados, cuando se ejecuta la consulta, entonces ve el mensaje informativo y sus filtros siguen seleccionados y editables; Dado un técnico que abre una incidencia y pulsa «volver», entonces recupera la misma página y los mismos filtros; Dado un EMPLEADO que abre una URL de bandeja compartida, entonces recibe 403 y ninguna incidencia ajena. Seguridad: la autorización se reevalúa siempre en la API REST al restaurar el estado, nunca en la SPA (REQ-013, REQ-032); el estado de vista no es un mecanismo de control de acceso. Dependencias: BAN-01, BAN-02, BAN-03, BAN-04, REQ-025, REQ-103. Integración: SPA Angular (front). Prioridad: Should.
**Reglas de negocio:**
1. Dos aperturas de la bandeja con los mismos parámetros de filtro, orden y página producen la misma vista, por lo que la URL es compartible entre técnicos
2. El estado de vista no es un mecanismo de control de acceso: la autorización sobre una URL restaurada o compartida se determina exclusivamente en la API
3. El estado de vista recordado es único por `user_id` y su validez se limita a la sesión activa
4. Un filtro que referencia un valor de catálogo desactivado permanece aplicado y se identifica como «(inactivo)», en lugar de descartarse
5. Una consulta sin coincidencias conserva visibles y editables todos los filtros seleccionados
6. Un parámetro de vista desconocido o fuera de catálogo no invalida la consulta: el resto de filtros sigue siendo aplicable
**Criterios de aceptación:**
1. AC-BAN-06: Dado un técnico con filtros, orden y página aplicados, cuando copia la URL y otro técnico la abre, entonces ambos ven exactamente la misma vista; y cuando abre el detalle de una incidencia y pulsa «volver», entonces recupera los mismos filtros, orden, página y posición de scroll; y cuando la consulta no arroja coincidencias, entonces ve el mensaje «No hay incidencias que cumplan los filtros seleccionados» con la acción «Limpiar filtros» y sus filtros siguen seleccionados y editables.
2. AC-BAN-08: Dado un usuario con rol `EMPLEADO` o `ADMINISTRADOR`, cuando invoca el endpoint de la bandeja completa, cualquiera de sus filtros o restaura una URL de bandeja compartida, entonces recibe un 403 uniforme sin resultados parciales ni pistas sobre la existencia de incidencias ajenas, y la autorización se reevalúa siempre en la API REST y nunca en la SPA (verificado manipulando la petición al margen del frontend).
**Validaciones:**
1. Los parámetros de consulta desconocidos recibidos en la URL se ignoran sin bloquear la petición
2. Un valor de filtro fuera de catálogo (`room_ids[]`, `category_codes[]`, `statuses[]`) se descarta con aviso no bloqueante y se aplica el resto del `view_state`
**Escenarios de error:**
1. La sesión ha caducado al restaurar el estado de la vista y se redirige a la pantalla de acceso
2. Se abre una URL de bandeja compartida sin el rol requerido y se deniega con mensaje uniforme, sin devolver incidencias ajenas
**Campos de datos:**
- `room_ids` (array, opcional) — Valores del catálogo de salas; un valor inactivo se conserva y se etiqueta «(inactivo)»
- `category_codes` (array, opcional) — Valores del catálogo de categorías; inactivos se etiquetan «(inactivo)»
- `statuses` (array, opcional) — Valores del catálogo de estados de incidencia
- `scroll_position` (integer, opcional) — ≥ 0
- `user_id` (integer, opcional) — Recordado durante la sesión; no es mecanismo de control de acceso

### REQ-110 — Búsqueda por texto libre e identificador de incidencia dentro de la bandeja
Reglas: search_text busca simultáneamente en incident_code, description y room_name; la coincidencia es parcial, insensible a mayúsculas y a acentos (comparación acento-insensible en Oracle); se combina en AND con el resto de filtros y respeta el orden y la paginación vigentes; si el texto coincide exactamente con un incident_code, esa incidencia se muestra en primera posición. Datos: search_text (string, 3–100 caracteres, opcional, se aplica trim). Validaciones: longitud < 3 tras trim → el filtro se ignora y se avisa «Introduce al menos 3 caracteres» sin bloquear el listado [ambigüedad: el RFP no define comportamiento de búsqueda]; longitud > 100 → 400; los comodines % y _ se escapan para evitar búsquedas no intencionadas. Errores: 400 descrito; 401/403 como BAN-01; 500 genérico. Aceptación: Dado un técnico, cuando busca «proyector», entonces obtiene las incidencias cuya descripción o sala contienen ese término, con los filtros activos respetados; Dada una búsqueda sin coincidencias, entonces se muestra el estado vacío de BAN-05. Seguridad: exclusivo TECNICO_DE_MANTENIMIENTO sobre el conjunto completo (REQ-029); la búsqueda no habilita a un EMPLEADO a localizar incidencias ajenas (REQ-023, REQ-024). Rendimiento: índice sobre incident_code; con el volumen declarado (≤50 incidencias/mes, ≈1.200 en la ventana de retención) la búsqueda por patrón sobre description es asumible. Dependencias: BAN-01, BAN-02, BAN-05. [inferido: el RFP no pide búsqueda textual; deriva del valor declarado en EPIC-011 de «localizar en segundos las incidencias abiertas de una sala u oficina concreta»]. Prioridad: Could.
**Reglas de negocio:**
1. Un `search_text` es aplicable si y solo si, tras `trim`, tiene entre 3 y 100 caracteres; por debajo de 3 el filtro es inoperante y por encima de 100 es inválido
2. La coincidencia de búsqueda es parcial e insensible a mayúsculas y a acentos sobre `incident_code`, `description` y `room_name`
3. Una incidencia cuyo `incident_code` coincide exactamente con el texto buscado ocupa la primera posición del resultado
4. Los caracteres `%` y `_` del texto buscado son literales y no operan como comodines
5. La búsqueda textual es acumulativa con el resto de filtros y no amplía el alcance de datos del rol: un EMPLEADO no localiza incidencias ajenas por esta vía
**Criterios de aceptación:**
1. AC-BAN-07: Dado un técnico en la bandeja, cuando busca «proyector», entonces obtiene las incidencias cuyo código, descripción o sala contienen el término con coincidencia parcial, insensible a mayúsculas y a acentos, respetando los filtros, el orden y la paginación vigentes; y cuando el texto coincide exactamente con un `incident_code`, entonces esa incidencia aparece en primera posición; y cuando introduce menos de 3 caracteres, entonces el filtro se ignora con el aviso «Introduce al menos 3 caracteres» sin bloquear el listado.
2. AC-BAN-09: Dado el volumen de la ventana de retención (≈1.200 incidencias) y 50 usuarios concurrentes, cuando un técnico ejecuta consultas de bandeja con filtros combinados y búsqueda por texto durante 7 días laborables en producción, entonces el p95 del endpoint de listado es < 2.000 ms y el 100 % de las consultas resuelve orden y paginación en base de datos (`OFFSET … FETCH`), sin troceo en la SPA. [inferido: umbral no declarado en el RFP]
**Validaciones:**
1. `search_text` es opcional y se le aplica `trim` antes de evaluarlo
2. `search_text` con longitud inferior a 3 caracteres tras `trim` no se aplica: se avisa «Introduce al menos 3 caracteres» sin bloquear el listado
3. `search_text` con longitud superior a 100 caracteres se rechaza con 400
4. Los comodines `%` y `_` presentes en `search_text` se escapan antes de construir el patrón de búsqueda
**Escenarios de error:**
1. El texto de búsqueda supera la longitud máxima admitida de 100 caracteres
2. La sesión del usuario ha caducado al ejecutar la búsqueda
3. El usuario autenticado no tiene el rol de técnico de mantenimiento para buscar sobre el conjunto completo de incidencias
4. No ha sido posible completar la búsqueda y se muestra un mensaje genérico de reintento
**Campos de datos:**
- `search_text` (string, opcional) — Longitud 3–100 tras trim; <3 se ignora con aviso; >100 error 400; comodines % y _ escapados; comparación parcial, insensible a mayúsculas y acentos

### REQ-119 — El técnico de mantenimiento pasa una incidencia «abierta» a «en curso»
Un técnico de mantenimiento pasa una incidencia «abierta» a «en curso» para dejar constancia de que ha empezado a atenderla. Reglas: la incidencia debe estar en `abierta`; debe tener técnico asignado (`assignee_user_id` no nulo), precondición declarada en `cat_transiciones_incidencia.requires_assignee` —la asignación en sí la aporta la épica de asignación (dependencia, no se redefine aquí)—; solo el técnico asignado puede iniciar la atención [ambigüedad][inferido] (el RFP dice que «un técnico de mantenimiento puede asignarse una incidencia, cambiar su estado…» pero no aclara si un técnico distinto del asignado puede operar sobre ella); al aceptarse se sella `in_progress_at`. Flujo: el técnico abre el detalle de la incidencia → pulsa «Iniciar atención» → confirma → el sistema aplica la transición vía CVI-02 → el nuevo estado queda reflejado en el detalle y en el listado. Datos: `incidencia.in_progress_at` (timestamp, nullable, se fija una sola vez), `incidencia.assignee_user_id` (FK usuario, obligatorio para esta transición). Validaciones: estado origen = abierta; `assignee_user_id` no nulo y usuario activo; `assignee_user_id` = usuario de la sesión. Errores: 422 «La incidencia debe tener un técnico asignado antes de pasarla a «en curso»»; 422 «Solo el técnico asignado puede iniciar la atención de esta incidencia»; 422 «La incidencia no está en estado «abierta»»; 403 para EMPLEADO. AC: Given una incidencia «abierta» asignada al técnico de la sesión, when la pasa a «en curso», then el sistema acepta la transición, sella `in_progress_at` y el nuevo estado aparece en el listado y en el detalle; Given una incidencia «abierta» sin técnico asignado, when se intenta pasar a «en curso», then se rechaza con 422 y el estado permanece «abierta». Seguridad: ejecuta TECNICO_DE_MANTENIMIENTO sobre el conjunto completo de incidencias (REQ-029); EMPLEADO no ve ni ejecuta la acción (REQ-022); el reportante la observa (solo lectura, REQ-024). Efecto: el empleado reportante recibe aviso por correo del cambio de estado (cita RFP: «Cuando una incidencia cambia de estado, el empleado que la reportó debe recibir una notificación por correo electrónico»), resuelto por el módulo de notificaciones (REQ-079, REQ-089); no se materializa aquí como requisito. Eventos de dominio: `IncidentStatusChanged` (`to_status`=«en curso»). Dependencias: CVI-02, CVI-01, REQ-030. Prioridad Must [inferido].
**Reglas de negocio:**
1. Una incidencia sin técnico asignado no puede alcanzar el estado «en curso»
2. El único estado origen admitido para alcanzar «en curso» es «abierta»
3. El técnico que inicia la atención de una incidencia es el técnico asignado a esa incidencia
4. La marca `in_progress_at` de una incidencia se fija una sola vez y no vuelve a alterarse
5. El técnico asignado a una incidencia es un usuario activo
**Criterios de aceptación:**
1. AC-CVI-01: Dado una incidencia en estado «abierta» asignada al técnico de la sesión, cuando dicho técnico ejecuta la secuencia «Iniciar atención» y después «Marcar como resuelta», entonces la incidencia queda en estado «resuelta», in_progress_at y resolved_at han quedado sellados con la fecha-hora de servidor de cada hito, version se ha incrementado en cada transición y el estado mostrado en listado y detalle coincide con el persistido.
2. AC-CVI-04: Dado una incidencia en estado «abierta» sin técnico asignado, cuando un técnico de mantenimiento abre el detalle e intenta iniciar la atención, entonces la acción «Iniciar atención» se muestra deshabilitada con el motivo devuelto por el backend en blocked_reason, y si la petición se fuerza contra la API esta responde 422 «La incidencia debe tener un técnico asignado antes de pasarla a en curso» sin alterar el estado.
3. AC-CVI-05: Dado una incidencia en estado «en curso» asignada a un técnico A, cuando un técnico B distinto del asignado intenta iniciarla o resolverla, entonces la API responde 422 «Solo el técnico asignado puede…» y el estado y el responsable permanecen sin cambios. [ambigüedad del RFP: no aclara si un técnico distinto del asignado puede operar; criterio derivado de la regla inferida en REQ-119/REQ-120 — requiere confirmación del cliente]
**Validaciones:**
1. El estado actual de la incidencia debe ser «abierta» para admitir la petición de inicio de atención
2. `assignee_user_id` de la incidencia debe ser no nulo y corresponder a un usuario activo
3. `assignee_user_id` de la incidencia debe coincidir con el usuario de la sesión que solicita la transición
**Escenarios de error:**
1. No tiene permisos para iniciar la atención de la incidencia
2. La incidencia debe tener un técnico asignado antes de pasarla a «en curso»
3. Solo el técnico asignado puede iniciar la atención de esta incidencia
4. La incidencia no está en estado «abierta»
**Campos de datos:**
- `in_progress_at` (datetime, opcional) — Se sella una sola vez al pasar a «en curso»; no se sobrescribe
- `assignee_user_id` (string, obligatorio) — No nulo, usuario activo y coincidente con el usuario de la sesión

### REQ-120 — El técnico responsable marca una incidencia «en curso» como «resuelta»
El técnico responsable marca una incidencia «en curso» como «resuelta» cuando ha completado la reparación. Reglas: la incidencia debe estar en `en curso`; solo el técnico asignado (`assignee_user_id` = usuario de la sesión) puede resolverla [inferido], coherente con el AC de la épica «el técnico responsable la marca como resuelta»; al aceptarse se sella `resolved_at` y se conserva `assignee_user_id` como responsable de la resolución; el comentario de resolución exigido por el RFP se sitúa en el cierre, no en la resolución (cita RFP: «añadir un comentario de resolución al cerrarla»), por lo que aquí `transition_comment` es opcional [inferido]; «resuelta» no es terminal: el cierre posterior lo opera la épica de cierre y queda fuera de este alcance. Flujo: el técnico responsable abre el detalle de la incidencia en curso → pulsa «Marcar como resuelta» → opcionalmente escribe una nota de avance → confirma → transición aplicada vía CVI-02 → la incidencia queda pendiente de cierre. Datos: `incidencia.resolved_at` (timestamp, nullable, se fija una sola vez), `transition_comment` (varchar(500), opcional, texto libre sin HTML). Validaciones: estado origen = en curso; responsable = usuario de la sesión; longitud del comentario ≤ 500. Errores: 422 «La incidencia debe estar «en curso» para poder resolverse»; 422 «Solo el técnico asignado puede resolver esta incidencia»; 400 «El comentario supera los 500 caracteres»; 403 para EMPLEADO. AC: Given una incidencia «en curso» asignada al técnico de la sesión, when la marca como «resuelta», then el sistema acepta la transición, registra el nuevo estado y sella `resolved_at`; Given una incidencia «resuelta», when se intenta marcarla de nuevo como «resuelta», then se rechaza con 422 y el estado no varía. Seguridad: ejecuta TECNICO_DE_MANTENIMIENTO responsable; EMPLEADO solo observa el resultado en su incidencia (REQ-024, REQ-026). Efecto: aviso por correo al reportante (módulo de notificaciones, REQ-079). Eventos de dominio: `IncidentStatusChanged` (`to_status`=«resuelta»). Dependencias: CVI-02, CVI-03. Prioridad Must [inferido].
**Reglas de negocio:**
1. El único estado origen admitido para alcanzar «resuelta» es «en curso»
2. El técnico que marca una incidencia como resuelta es el técnico asignado a esa incidencia
3. La marca `resolved_at` de una incidencia se fija una sola vez y no vuelve a alterarse
4. El comentario asociado a una transición no supera los 500 caracteres
5. El comentario de resolución es exigible en el cierre de la incidencia, no en su paso a «resuelta»
**Criterios de aceptación:**
1. AC-CVI-01: Dado una incidencia en estado «abierta» asignada al técnico de la sesión, cuando dicho técnico ejecuta la secuencia «Iniciar atención» y después «Marcar como resuelta», entonces la incidencia queda en estado «resuelta», in_progress_at y resolved_at han quedado sellados con la fecha-hora de servidor de cada hito, version se ha incrementado en cada transición y el estado mostrado en listado y detalle coincide con el persistido.
2. AC-CVI-05: Dado una incidencia en estado «en curso» asignada a un técnico A, cuando un técnico B distinto del asignado intenta iniciarla o resolverla, entonces la API responde 422 «Solo el técnico asignado puede…» y el estado y el responsable permanecen sin cambios. [ambigüedad del RFP: no aclara si un técnico distinto del asignado puede operar; criterio derivado de la regla inferida en REQ-119/REQ-120 — requiere confirmación del cliente]
**Validaciones:**
1. El estado actual de la incidencia debe ser «en curso» para admitir la petición de resolución
2. El `assignee_user_id` (técnico responsable) debe coincidir con el usuario de la sesión que solicita la resolución
3. La longitud de `transition_comment` no supera 500 caracteres; si se excede se responde 400
4. `transition_comment` es texto libre sin marcado HTML (se rechaza o se sanea el contenido con etiquetas)
**Escenarios de error:**
1. El comentario supera los 500 caracteres permitidos
2. No tiene permisos para resolver la incidencia
3. La incidencia debe estar «en curso» para poder resolverse
4. Solo el técnico asignado puede resolver esta incidencia
**Campos de datos:**
- `resolved_at` (datetime, opcional) — Se sella una sola vez al pasar a «resuelta»; no se sobrescribe
- `transition_comment` (string, opcional) — Máx. 500 caracteres; texto libre sin HTML

### REQ-121 — Cálculo en backend de transiciones disponibles y acciones ofrecidas por la SPA
El sistema calcula y expone las transiciones disponibles para el usuario de la sesión, y la SPA ofrece únicamente esas acciones sobre la incidencia. Reglas: las transiciones ofrecidas se calculan en backend cruzando estado actual × rol vigente × condición de asignación (CVI-01); la SPA nunca decide: adapta las acciones visibles al rol y al estado según lo que devuelve la API (REQ-010), y la denegación real siempre la aplica la API (REQ-013, REQ-032); toda acción de transición exige confirmación explícita del usuario antes de enviarse; tras una transición correcta se refrescan detalle y listado para que el nuevo estado quede reflejado inmediatamente. Flujo: el usuario abre el detalle → el backend devuelve estado y transiciones disponibles → la SPA pinta un botón por transición (ninguno para EMPLEADO) → el usuario confirma → llamada a CVI-02 → éxito: refresco y mensaje de confirmación; error: se muestra literalmente el mensaje del backend, en español (REQ-050). Datos: respuesta de GET /api/incidencias/{incident_id} ampliada con `status` (varchar), `status_label` (varchar), `status_changed_at` (timestamp), `assignee_user_id` (FK, nullable) y `available_transitions[]` = {to_status, label, requires_comment (boolean), blocked_reason (varchar, nullable)}. Catálogos: etiquetas tomadas de `cat_estados_incidencia.name`. Validaciones: si una transición está declarada para el rol pero bloqueada por precondición (p. ej. sin técnico asignado), se devuelve con `blocked_reason` y la SPA la muestra deshabilitada con el motivo. Errores: 404 uniforme si la incidencia queda fuera del alcance del rol (REQ-023); si la SPA envía una transición que ya no es válida (estado cambiado por otro técnico), 409/422 de CVI-02 con invitación a recargar. AC: Given un EMPLEADO viendo su incidencia, when carga el detalle, then `available_transitions` llega vacío y no se muestra ninguna acción de cambio de estado; Given un TECNICO_DE_MANTENIMIENTO y una incidencia «abierta» asignada, when carga el detalle, then solo se ofrece «Iniciar atención»; Given una incidencia «abierta» sin asignar, when el técnico carga el detalle, then «Iniciar atención» aparece deshabilitada con el motivo. Seguridad: el cálculo respeta el alcance por rol (REQ-029); ocultar la acción en la SPA es cosmético, la autorización vinculante es la de CVI-02. Integración: Angular SPA (front propio). Dependencias: CVI-01, CVI-02, REQ-010. Prioridad Must [inferido].
**Reglas de negocio:**
1. Las transiciones disponibles de una incidencia son exactamente las declaradas para su estado actual y el rol vigente del usuario de la sesión
2. Un usuario con rol empleado no tiene ninguna transición disponible sobre ninguna incidencia
3. Una transición declarada para el rol pero con una precondición incumplida no es ejecutable y consta con su motivo de bloqueo
4. La visibilidad de una acción en la SPA no autoriza la operación: la decisión vinculante es siempre la de la API
**Criterios de aceptación:**
1. AC-CVI-04: Dado una incidencia en estado «abierta» sin técnico asignado, cuando un técnico de mantenimiento abre el detalle e intenta iniciar la atención, entonces la acción «Iniciar atención» se muestra deshabilitada con el motivo devuelto por el backend en blocked_reason, y si la petición se fuerza contra la API esta responde 422 «La incidencia debe tener un técnico asignado antes de pasarla a en curso» sin alterar el estado.
2. AC-CVI-06: Dado un usuario con rol EMPLEADO consultando una incidencia propia, cuando carga el detalle, entonces available_transitions llega vacío, la SPA no muestra ninguna acción de cambio de estado y, si la petición de transición se emite directamente contra la API, esta responde 403 sin efectos laterales; y dado un técnico con una incidencia «abierta» asignada, cuando carga el detalle, entonces la única transición ofrecida es «Iniciar atención».
**Escenarios de error:**
1. No hay sesión válida para consultar el detalle y las transiciones disponibles
2. La incidencia solicitada no existe o no está disponible para el usuario
3. La transición solicitada ya no es válida porque el estado de la incidencia ha cambiado; recargue el detalle
**Campos de datos:**
- `status` (enum, obligatorio) — Valor del catálogo cerrado de estados
- `status_label` (string, obligatorio) — Tomada de cat_estados_incidencia.name
- `status_changed_at` (datetime, obligatorio) — Fecha y hora del último cambio de estado mostrada en el detalle
- `assignee_user_id` (string, opcional) — Nulo si la incidencia no está asignada
- `available_transitions` (array, obligatorio) — Vacío para el rol EMPLEADO
- `to_status` (enum, obligatorio) — Valor del catálogo de estados
- `label` (string, obligatorio) — p. ej. «Iniciar atención», «Marcar como resuelta»
- `requires_comment` (boolean, obligatorio) — Indica si la transición exige comentario antes de enviarse
- `blocked_reason` (string, opcional) — Nulo si la transición está disponible

### REQ-122 — Marcas temporales del ciclo de vida y tiempo en el estado actual
El sistema registra y expone las marcas temporales del ciclo de vida y el tiempo que la incidencia lleva en su estado actual. Reglas: cada hito del ciclo de vida sella su marca temporal la primera vez que se alcanza y no se sobrescribe; el tiempo en estado se calcula como diferencia entre la fecha actual y `status_changed_at`, no se persiste; el dato sirve para que el equipo de mantenimiento priorice («saber qué está pendiente, qué está en curso y quién lo atiende»); el EMPLEADO ve estas marcas solo en sus propias incidencias. Datos: `incidencia.opened_at` (timestamp, obligatorio, = fecha de alta), `in_progress_at` (timestamp, nullable), `resolved_at` (timestamp, nullable), `closed_at` (timestamp, nullable, lo sella la épica de cierre), `status_changed_at` (timestamp, obligatorio), derivado `days_in_current_status` (number entero ≥ 0). Validaciones: coherencia cronológica `opened_at` ≤ `in_progress_at` ≤ `resolved_at` ≤ `closed_at`; ninguna marca en el futuro. Presentación: las marcas del hito y `days_in_current_status` se muestran en el detalle de la incidencia y como columna ordenable del listado del técnico (dependencia REQ-025, que ya define ese listado y sus filtros). [gap: el RFP no aporta plazos objetivo, SLA ni umbrales de alerta por estado, por lo que no se define semáforo ni escalado]. Errores: incoherencia cronológica detectada → 500 con rollback de la transición y traza interna; no se expone al usuario más que «No se ha podido completar el cambio de estado». AC: Given una incidencia que pasa a «en curso» el día D, when se consulta al día D+3, then `days_in_current_status` = 3 y `in_progress_at` conserva la fecha D; Given una incidencia que vuelve a cambiar de estado, when se consulta, then `status_changed_at` refleja el último cambio y las marcas de hitos anteriores no se alteran. Seguridad: TECNICO_DE_MANTENIMIENTO sobre todas las incidencias, EMPLEADO solo sobre las propias (REQ-024, REQ-029). Dependencias: CVI-02, CVI-03, CVI-04, REQ-025. Prioridad Should [inferido].
**Reglas de negocio:**
1. Las marcas temporales de hito del ciclo de vida son inmutables una vez selladas
2. Para toda incidencia se cumple `opened_at` ≤ `in_progress_at` ≤ `resolved_at` ≤ `closed_at` entre las marcas existentes
3. Ninguna marca temporal del ciclo de vida es posterior a la fecha actual
4. El tiempo en el estado actual es un valor derivado de `status_changed_at` y nunca se persiste
5. Un empleado accede a las marcas temporales únicamente de las incidencias que ha reportado
**Criterios de aceptación:**
1. AC-CVI-07: Dado una incidencia que pasó a «en curso» el día D, cuando se consulta el día D+3, entonces days_in_current_status es 3, in_progress_at conserva la fecha D sin sobrescritura y el listado del técnico permite ordenar por esa columna.
**Validaciones:**
1. Las marcas temporales del ciclo de vida deben guardar coherencia cronológica: `opened_at` ≤ `in_progress_at` ≤ `resolved_at` ≤ `closed_at`
2. Ninguna marca temporal del ciclo de vida (`opened_at`, `in_progress_at`, `resolved_at`, `closed_at`, `status_changed_at`) puede ser una fecha futura
3. `days_in_current_status` es un número entero mayor o igual que 0
**Escenarios de error:**
1. La incidencia solicitada no existe o no está disponible para el usuario
2. No se ha podido completar el cambio de estado; inténtelo de nuevo
**Campos de datos:**
- `opened_at` (datetime, obligatorio) — Coincide con la fecha de alta; no futura
- `in_progress_at` (datetime, opcional) — opened_at ≤ in_progress_at; no futura; no se sobrescribe
- `resolved_at` (datetime, opcional) — in_progress_at ≤ resolved_at; no futura
- `closed_at` (datetime, opcional) — resolved_at ≤ closed_at; no futura
- `status_changed_at` (datetime, obligatorio) — Fecha del último cambio de estado, base del cálculo de permanencia
- `days_in_current_status` (integer, obligatorio) — Derivado, no persistido; entero ≥ 0

### REQ-124 — Consulta del historial cronológico de cambios de estado con actor y fecha
El usuario consulta el historial cronológico de cambios de estado de una incidencia en todo momento, con el actor y la fecha de cada cambio. Reglas: el historial está disponible «en todo momento», incluidas las incidencias resueltas y cerradas (cita RFP: «El empleado que reportó la incidencia debe poder ver en todo momento el estado actual y el historial de cambios de estado»); se presenta en orden cronológico ascendente por `changed_at`, incluyendo como primer hito el alta; el nombre y correo del actor se resuelven con los datos vigentes del directorio (REQ-079, REQ-080) y siguen visibles aunque el actor esté desactivado (REQ-087, REQ-088); sin paginación dada la volumetría declarada (máximo 50 incidencias/mes). Flujo: el usuario abre el detalle de su incidencia → sección «Historial» → lista de entradas «estado origen → estado destino · actor · fecha y hora» con el comentario cuando exista. Datos de salida: GET /api/incidencias/{incident_id}/historial → [{from_status, from_status_label, to_status, to_status_label, changed_by_name, changed_at, comment}]. Catálogos: etiquetas desde `cat_estados_incidencia`, incluidos valores desactivados con uso histórico. Validaciones: `incident_id` existente y dentro del alcance del rol. Errores: 404 uniforme, sin revelar la existencia del recurso, cuando el EMPLEADO pide el historial de una incidencia que no ha reportado (REQ-023, REQ-026, REQ-031); 401 sin sesión válida (REQ-051, REQ-058). AC: Given una incidencia con alta y dos cambios de estado, when el reportante consulta su historial, then recibe tres entradas en orden cronológico con actor y fecha; Given un EMPLEADO, when consulta el historial de una incidencia ajena, then recibe la denegación uniforme y ningún dato; Given un TECNICO_DE_MANTENIMIENTO, when consulta el historial de cualquier incidencia, then lo obtiene completo; Given una incidencia cuyo actor fue desactivado, when se consulta el historial, then el nombre del actor sigue mostrándose. Seguridad: alcance por rol idéntico al del detalle — EMPLEADO solo sus incidencias, TECNICO_DE_MANTENIMIENTO todas (REQ-026, REQ-029); sin doble factor. Dependencias: HIST-01, REQ-026, REQ-079. Nota de solape: el dominio clave «Historial de cambios de estado consultable» podría estar asignado también a otra épica; si aparece allí, consolidar en un único requisito. Prioridad Must [inferido].
**Reglas de negocio:**
1. El historial de una incidencia es consultable en cualquiera de sus estados, incluidas las resueltas y las cerradas
2. Las entradas del historial se presentan en orden cronológico ascendente, siendo el alta de la incidencia la primera entrada
3. El nombre del actor de cada entrada del historial sigue siendo visible aunque el usuario esté desactivado
4. Un empleado consulta el historial únicamente de las incidencias que ha reportado; el técnico de mantenimiento, el de todas
5. Las etiquetas de estado mostradas en el historial incluyen los valores de catálogo desactivados con uso histórico
**Criterios de aceptación:**
1. AC-HIST-03: Dado una incidencia con alta y dos cambios de estado posteriores, cuando el empleado reportante consulta su historial —incluso con la incidencia ya cerrada—, entonces recibe tres entradas en orden cronológico ascendente con estado origen, estado destino, nombre del actor, fecha-hora y comentario cuando exista; y dado que el actor de una entrada fue desactivado, cuando se consulta el historial, entonces su nombre sigue mostrándose.
2. AC-HIST-04: Dado un usuario con rol EMPLEADO, cuando solicita el historial de una incidencia que no ha reportado, entonces recibe la denegación uniforme 404 sin ningún dato de la incidencia; y dado un técnico de mantenimiento, cuando solicita el historial de cualquier incidencia, entonces lo obtiene completo.
**Validaciones:**
1. `incident_id` es obligatorio, debe corresponder a una incidencia existente y estar dentro del alcance del rol del solicitante; en otro caso se devuelve 404 uniforme
**Escenarios de error:**
1. No hay sesión válida para consultar el historial
2. La incidencia solicitada no existe o no está disponible para el usuario
**Campos de datos:**
- `from_status` (enum, opcional) — Nulo en la entrada de alta
- `from_status_label` (string, opcional) — Desde el catálogo, incluidos valores desactivados con uso histórico
- `to_status` (enum, obligatorio) — Valor del catálogo de estados
- `to_status_label` (string, obligatorio) — Desde el catálogo de estados
- `changed_by_name` (string, obligatorio) — Sigue visible aunque el usuario esté desactivado
- `changed_at` (datetime, obligatorio) — Orden cronológico ascendente; sin paginación
- `comment` (string, opcional) — Máx. 500 caracteres

### REQ-153 — Autoasignación exclusiva de una incidencia sin responsable por un técnico de mantenimiento
Un técnico de mantenimiento se autoasigna una incidencia sin responsable y queda registrado como técnico responsable de forma exclusiva. Reglas: solo son autoasignables las incidencias con status_code no terminal (ABIERTA, EN_CURSO) de cat_estados_incidencia y con assigned_technician_id NULL; una incidencia tiene como máximo un técnico responsable en todo momento; el técnico solo puede asignarse a sí mismo, tomando el identificador del responsable del usuario de la sesión y nunca del cuerpo de la petición (REQ-064, REQ-018); la toma es atómica mediante actualización condicional (UPDATE … WHERE incident_id = :id AND assigned_technician_id IS NULL) resuelta por filas afectadas, de modo que ante dos técnicos concurrentes solo uno gana y el otro recibe conflicto; la asignación no modifica status_code. Flujo: el técnico abre la bandeja completa (REQ-025, REQ-105), filtra por «sin asignar» (REQ-107), abre fila o detalle, ejecuta «Asignármela», confirma y la vista se refresca mostrándole como responsable; rama alternativa: otro técnico la tomó entre el pintado y el clic → conflicto informativo y refresco de la fila. Datos: incident_id (number, obligatorio, existente), assigned_technician_id (number, FK usuario, desde la sesión), assigned_at (timestamp, obligatorio al asignar, instante del servidor), assignment_status (derivado: SIN_ASIGNAR / ASIGNADA), updated_by (number), updated_at (timestamp). Catálogos: cat_estados_incidencia, cat_roles. Validaciones: incidencia existente; estado no terminal; assigned_technician_id NULL; actor con rol TECNICO_DE_MANTENIMIENTO y cuenta activa. Errores: 404 «La incidencia solicitada no existe.»; 409 «Esta incidencia ya está asignada a {nombre del técnico responsable}.»; 409 «No se puede asignar una incidencia resuelta o cerrada.» (REQ-112); 403 denegación uniforme «No tienes permiso para realizar esta acción.» (REQ-031, REQ-078). Criterios de aceptación: Given una incidencia «abierta» sin asignar y un TECNICO_DE_MANTENIMIENTO autenticado, When ejecuta la autoasignación, Then queda con él como responsable y con assigned_at informado; Given una incidencia ya asignada a otro técnico, When un segundo técnico intenta autoasignársela, Then 409, se informa de quién es el responsable actual y la asignación original permanece intacta; Given dos técnicos simultáneos sobre la misma incidencia, When ambas peticiones llegan, Then exactamente una persiste y la otra recibe 409; Given un usuario con rol EMPLEADO, When invoca el endpoint, Then recibe 403 y la incidencia permanece sin asignar. Seguridad: ejecuta exclusivamente TECNICO_DE_MANTENIMIENTO (REQ-030, REQ-022); alcance de datos: el técnico opera sobre el conjunto completo de incidencias (REQ-029); EMPLEADO y ADMINISTRADOR denegados; no aplica doble factor. Eventos de dominio: ninguno; el asiento de trazabilidad se escribe en la misma transacción mediante REQ-126. Dependencias: REQ-126, REQ-105, REQ-107, REQ-121, REQ-030, REQ-064. Marcas: [inferido] prioridad Must; [ambigüedad] no se aclara si autoasignarse implica transición automática a «en curso» (REQ-119), se asume independencia; [gap: no se contempla que un despachador o el ADMINISTRADOR asigne a un tercero]. Integración: —. Prioridad: Must. Fase: —.
**Reglas de negocio:**
1. Una incidencia tiene como máximo un técnico responsable en todo momento
2. Solo son autoasignables las incidencias cuyo estado es no terminal (`ABIERTA` o `EN_CURSO`) y que no tienen técnico responsable
3. El técnico responsable resultante de una autoasignación es siempre el usuario autenticado de la sesión, nunca un tercero indicado en la petición
4. Ante dos autoasignaciones concurrentes sobre la misma incidencia, exactamente una prevalece y la otra queda rechazada por conflicto
5. Toda incidencia con técnico responsable tiene informado el instante de asignación (`assigned_at`)
6. El estado (`status_code`) de una incidencia es independiente de su titularidad: asignar un responsable no altera el estado
7. Solo un usuario con rol `TECNICO_DE_MANTENIMIENTO` y cuenta activa puede figurar como técnico responsable de una incidencia
**Criterios de aceptación:**
1. AC-ASG-01: **Dado** una incidencia en estado no terminal (`ABIERTA` o `EN_CURSO`) sin `assigned_technician_id`, **cuando** un usuario con rol `TECNICO_DE_MANTENIMIENTO` activo ejecuta «Asignármela», **entonces** la incidencia queda con él como único técnico responsable, `assigned_at` se informa con el instante del servidor, `status_code` no cambia y el `assignment_status` derivado pasa de `SIN_ASIGNAR` a `ASIGNADA`.
2. AC-ASG-02: **Dado** una misma incidencia sin responsable y dos técnicos que lanzan la autoasignación simultáneamente, **cuando** ambas peticiones alcanzan el backend, **entonces** exactamente una persiste (verificado por filas afectadas del `UPDATE … WHERE assigned_technician_id IS NULL`) y la otra recibe 409 indicando el nombre del técnico responsable actual, sin que la asignación ganadora se altere; se ejecutan 100 pares concurrentes sin ninguna doble asignación.
3. AC-ASG-03: **Dado** una incidencia ya asignada, o una incidencia en estado terminal (`RESUELTA`/`CERRADA`), o un actor con rol `EMPLEADO` o `ADMINISTRADOR`, **cuando** se invoca el endpoint de autoasignación, **entonces** la petición se rechaza con 409 («ya está asignada» / «no se puede asignar una incidencia resuelta o cerrada») o 403 uniforme según el caso, y el `assigned_technician_id` almacenado permanece inalterado.
4. AC-RESP-01: **Dado** una incidencia asignada al técnico A, **cuando** cualquier usuario con acceso a ella abre su detalle, **entonces** el bloque de responsabilidad muestra el nombre del técnico responsable y la fecha de asignación en formato `dd/mm/aaaa hh:mm` y en español; y **dado** una incidencia sin responsable, **cuando** un técnico abre el detalle, **entonces** ve el estado «Pendiente de asignar» junto a la acción de autoasignarse.
**Validaciones:**
1. `incident_id` es obligatorio en la ruta y debe ser un entero positivo
2. `incident_id` debe corresponder a una incidencia existente en el sistema (si no, 404)
3. El cuerpo de la petición no puede aportar `assigned_technician_id`: si llega, se ignora y el identificador se toma siempre del usuario de la sesión
4. El `status_code` de la incidencia debe pertenecer a los estados no terminales de `cat_estados_incidencia` (`ABIERTA`, `EN_CURSO`)
5. El `assigned_technician_id` de la incidencia debe estar a NULL en el momento de la toma (comprobado de forma condicional en la propia actualización)
6. El actor debe tener rol `TECNICO_DE_MANTENIMIENTO` vigente y cuenta activa
**Escenarios de error:**
1. El identificador de la incidencia indicado no tiene un formato válido
2. No hay una sesión válida para realizar la operación
3. No tienes permiso para realizar esta acción
4. La incidencia solicitada no existe
5. Esta incidencia ya está asignada a otro técnico responsable
6. No se puede asignar una incidencia resuelta o cerrada
**Campos de datos:**
- `incident_id` (integer, obligatorio) — Debe existir; se resuelve antes de la actualización condicional
- `status_code` (enum, obligatorio) — Valores de cat_estados_incidencia; solo no terminales (ABIERTA, EN_CURSO)
- `assigned_technician_id` (integer, obligatorio) — FK usuario; debe ser NULL antes de la toma; se toma del usuario de sesión, nunca del cuerpo de la petición
- `assigned_at` (datetime, obligatorio) — Fijado por el servidor; obligatorio al asignar
- `assignment_status` (enum, opcional) — Derivado: SIN_ASIGNAR / ASIGNADA
- `updated_by` (integer, opcional) — FK usuario
- `updated_at` (datetime, opcional) — Instante de la última modificación de la incidencia

### REQ-154 — Liberación de la incidencia por su técnico responsable con motivo obligatorio
El técnico responsable libera la incidencia que tiene asignada, devolviéndola al conjunto de incidencias tomables. Reglas: solo el assigned_technician_id vigente puede liberar; solo se libera si el status_code es no terminal (ABIERTA, EN_CURSO) — una incidencia RESUELTA o CERRADA conserva su responsable de forma permanente (REQ-112, REQ-087); la liberación exige motivo; tras liberar, assigned_technician_id vuelve a NULL y la incidencia es tomable de nuevo por cualquier técnico vía ASG-01; la liberación no retrocede el estado: una incidencia liberada en «en curso» se presenta como «en curso, sin responsable». Flujo: el técnico abre el detalle de una incidencia de la que es responsable → acción «Liberar» → captura de motivo → confirmación → la incidencia queda sin responsable y la acción «Asignármela» vuelve a estar disponible para el resto. Datos: released_at (timestamp), released_by (number, FK usuario), release_reason (varchar, obligatorio, 10–500 caracteres, texto libre en español). Validaciones: actor = responsable vigente; estado no terminal; motivo presente y dentro de longitud. Errores: 403 «Solo el técnico responsable puede liberar esta incidencia.»; 409 «No se puede liberar una incidencia resuelta o cerrada.»; 409 «La incidencia no tiene técnico asignado.»; 422 «Indica el motivo de la liberación (mínimo 10 caracteres).». Criterios de aceptación: Given una incidencia «en curso» asignada al técnico autenticado, When la libera con motivo, Then queda sin responsable, se registra released_at/release_reason y otro técnico puede autoasignársela; Given una incidencia asignada a otro técnico, When un técnico distinto intenta liberarla, Then 403 y la asignación permanece; Given una incidencia cerrada, When su antiguo responsable intenta liberarla, Then 409 y el responsable histórico se conserva. Seguridad: TECNICO_DE_MANTENIMIENTO responsable; EMPLEADO y ADMINISTRADOR denegados (REQ-030). Eventos de dominio: ninguno; el movimiento se registra en el historial mediante REQ-126. Dependencias: ASG-01, REQ-126, REQ-112, REQ-117. Marcas: [inferido] la capacidad se deduce de que REQ-126 ya contempla «asignación o reasignación de técnico», pero el RFP §2.1 solo enuncia la toma; [gap: el RFP no define la política de liberación/reasignación]; [ambigüedad] si una incidencia «en curso» liberada debe volver a «abierta» — el grafo de REQ-117 no contempla retrocesos. Integración: —. Prioridad: Should. Fase: —.
**Reglas de negocio:**
1. Solo el técnico responsable vigente de una incidencia puede liberarla
2. Una incidencia en estado `RESUELTA` o `CERRADA` conserva su técnico responsable de forma permanente
3. Toda liberación tiene asociado un motivo en texto libre de entre 10 y 500 caracteres
4. Una incidencia liberada queda sin técnico responsable y vuelve a ser autoasignable por cualquier técnico
5. La liberación no retrocede el estado: una incidencia liberada en `EN_CURSO` permanece en `EN_CURSO` sin responsable
**Criterios de aceptación:**
1. AC-ASG-04: **Dado** una incidencia en estado no terminal asignada al técnico autenticado, **cuando** éste la libera aportando un motivo de entre 10 y 500 caracteres, **entonces** `assigned_technician_id` vuelve a NULL, se registran `released_at`, `released_by` y `release_reason`, el `status_code` no retrocede y cualquier otro técnico puede autoasignársela acto seguido; **cuando** el motivo falta o es menor de 10 caracteres, la operación se rechaza con 422 y la asignación se conserva.
2. AC-RESP-04: **Dado** una incidencia que ha pasado por asignación y liberación y cuyo técnico fue posteriormente desactivado, **cuando** un técnico consulta su detalle y su línea temporal, **entonces** el bloque de responsabilidad y el historial son coherentes entre sí (cada asignación y liberación mostrada tiene su asiento correspondiente), el nombre mostrado es el vigente del directorio y, si la incidencia está cerrada, se sigue mostrando el nombre histórico del técnico desactivado.
**Validaciones:**
1. `incident_id` es obligatorio, entero positivo y debe corresponder a una incidencia existente
2. `release_reason` es obligatorio y no puede quedar vacío tras normalizar espacios
3. `release_reason` debe tener entre 10 y 500 caracteres (422 si tiene menos de 10)
4. La incidencia debe tener `assigned_technician_id` informado (no NULL) para poder liberarse
5. El actor de la sesión debe coincidir con el `assigned_technician_id` vigente de la incidencia
6. El `status_code` de la incidencia debe ser no terminal (`ABIERTA`, `EN_CURSO`)
**Escenarios de error:**
1. El identificador de la incidencia indicado no tiene un formato válido
2. No hay una sesión válida para realizar la operación
3. Solo el técnico responsable puede liberar esta incidencia
4. La incidencia solicitada no existe
5. No se puede liberar una incidencia resuelta o cerrada
6. La incidencia no tiene técnico asignado
7. Falta el motivo de la liberación o no alcanza la longitud mínima exigida
**Campos de datos:**
- `incident_id` (integer, obligatorio) — Debe existir y tener responsable vigente
- `status_code` (enum, obligatorio) — Solo no terminales (ABIERTA, EN_CURSO)
- `assigned_technician_id` (integer, obligatorio) — FK usuario; debe coincidir con el usuario de la sesión
- `release_reason` (string, obligatorio) — Texto libre en español, 10–500 caracteres
- `released_at` (datetime, obligatorio) — Fijado por el servidor
- `released_by` (integer, obligatorio) — FK usuario

### REQ-157 — El detalle de la incidencia muestra quién la atiende y desde cuándo según el alcance de cada rol
Reglas de negocio: el detalle expone un bloque de responsabilidad con tres estados posibles: SIN_ASIGNAR («Pendiente de que un técnico la tome»), ASIGNADA (nombre del técnico responsable + fecha de asignación) y, para incidencias terminales, el responsable histórico que la resolvió o cerró; al EMPLEADO reportante se le muestra nombre del técnico, nunca su correo corporativo ni otros datos de contacto — minimización coherente con REQ-049; el nombre se resuelve contra el directorio (REQ-079) y refleja el valor vigente (REQ-080); si el técnico fue desactivado y la incidencia ya está cerrada, se sigue mostrando su nombre histórico (REQ-087, REQ-088); el bloque es coherente con el historial: la línea temporal (REQ-127) muestra las asignaciones y liberaciones registradas por REQ-126. Flujo: el usuario abre el detalle de una incidencia a la que tiene acceso → el backend devuelve el bloque de responsabilidad junto al resto del detalle → si es técnico y la incidencia está sin responsable, se le ofrece la acción de ASG-01 (resuelta por REQ-121). Datos: assignment_status (varchar derivado: SIN_ASIGNAR/ASIGNADA), assigned_technician_id (number), assigned_technician_name (varchar, derivado del directorio), assigned_at (timestamp, formato dd/mm/aaaa hh:mm, español), released_at (timestamp, nullable). Validaciones: ninguna de entrada; la respuesta nunca incluye assigned_technician_id ni correo para el rol EMPLEADO. Errores: 404 «La incidencia solicitada no existe.» para una incidencia inexistente o fuera del alcance del EMPLEADO, sin revelar su existencia (REQ-023, REQ-031); 401 si no hay sesión válida (REQ-058). Criterios de aceptación: Given una incidencia asignada al técnico A, When el empleado que la reportó abre su detalle, Then ve «Atendida por A desde {fecha}» y no ve su correo; Given esa misma incidencia, When cualquier técnico abre el detalle, Then ve el nombre del responsable y la fecha de asignación; Given una incidencia sin responsable, When un técnico abre el detalle, Then ve el estado «Pendiente de asignar» y la acción de autoasignarse; Given una incidencia de otro empleado, When un EMPLEADO intenta abrir su detalle, Then recibe la misma respuesta que ante una incidencia inexistente. Seguridad: EMPLEADO solo sus propias incidencias (REQ-024, REQ-026); TECNICO_DE_MANTENIMIENTO el conjunto completo (REQ-029); ADMINISTRADOR no accede al detalle operativo de incidencias (REQ-014). Eventos de dominio: ninguno (operación de solo lectura). Dependencias: ASG-01, ASG-02, REQ-026, REQ-079, REQ-080, REQ-105, REQ-127. Marcas: [inferido] prioridad Must; [inferido] la restricción de no exponer el correo del técnico al empleado se deriva del principio de mínimo dato (§4). Integración: —. Prioridad: Must. Fase: —.
**Reglas de negocio:**
1. Una incidencia presenta exactamente un estado de responsabilidad en cada instante: `SIN_ASIGNAR` o `ASIGNADA`
2. Al empleado reportante se le expone únicamente el nombre del técnico responsable, nunca su correo corporativo ni su identificador
3. El nombre del técnico responsable sigue siendo consultable en incidencias terminales aunque su cuenta esté desactivada
4. Un `EMPLEADO` solo tiene acceso al detalle de las incidencias que él mismo reportó
5. Una incidencia inexistente y una incidencia fuera del alcance de datos del solicitante producen una respuesta indistinguible
6. El rol `ADMINISTRADOR` no tiene acceso al detalle operativo de las incidencias
7. El bloque de responsabilidad mostrado es consistente con las asignaciones y liberaciones registradas en el historial de la incidencia
**Criterios de aceptación:**
1. AC-RESP-01: **Dado** una incidencia asignada al técnico A, **cuando** cualquier usuario con acceso a ella abre su detalle, **entonces** el bloque de responsabilidad muestra el nombre del técnico responsable y la fecha de asignación en formato `dd/mm/aaaa hh:mm` y en español; y **dado** una incidencia sin responsable, **cuando** un técnico abre el detalle, **entonces** ve el estado «Pendiente de asignar» junto a la acción de autoasignarse.
2. AC-RESP-02: **Dado** una incidencia asignada, **cuando** el `EMPLEADO` que la reportó consulta el detalle, **entonces** la respuesta de la API contiene el nombre del técnico responsable pero **no** contiene su correo corporativo ni su `assigned_technician_id` ni ningún otro dato de contacto, verificado por inspección del payload en el 100 % de los casos de prueba.
3. AC-RESP-03: **Dado** una incidencia reportada por otro empleado, **cuando** un `EMPLEADO` intenta abrir su detalle, **entonces** recibe exactamente la misma respuesta 404 que ante una incidencia inexistente, sin diferencia observable en cuerpo, cabeceras ni tiempo de respuesta; **cuando** el actor es `ADMINISTRADOR`, tampoco accede al detalle operativo; **cuando** no hay sesión válida, la respuesta es 401.
4. AC-RESP-04: **Dado** una incidencia que ha pasado por asignación y liberación y cuyo técnico fue posteriormente desactivado, **cuando** un técnico consulta su detalle y su línea temporal, **entonces** el bloque de responsabilidad y el historial son coherentes entre sí (cada asignación y liberación mostrada tiene su asiento correspondiente), el nombre mostrado es el vigente del directorio y, si la incidencia está cerrada, se sigue mostrando el nombre histórico del técnico desactivado.
**Escenarios de error:**
1. El identificador de la incidencia indicado no tiene un formato válido
2. No hay una sesión válida para consultar el detalle
3. No tienes permiso para realizar esta acción
4. La incidencia solicitada no existe
**Campos de datos:**
- `assignment_status` (enum, obligatorio) — Derivado: SIN_ASIGNAR / ASIGNADA
- `assigned_technician_id` (integer, opcional) — FK usuario; nunca se devuelve al rol EMPLEADO
- `assigned_technician_name` (string, opcional) — Derivado del directorio; valor vigente, o histórico si el técnico fue desactivado
- `assigned_at` (datetime, opcional) — Se presenta como dd/mm/aaaa hh:mm en español
- `released_at` (datetime, opcional) — Nullable; vacío si nunca se liberó

## Entorno de prueba de esta sesión

Antes de arrancar tu sesión, la plataforma levanta los servicios de abajo como contenedores efímeros y deja sus datos de conexión en `.mind/TSK-035/env.sh` (y en `env.json`). Contrato de uso:

- **Haz `source .mind/TSK-035/env.sh` antes de cada build/test** que necesite el entorno; si el fichero no existe, el entorno NO se pudo levantar (ver el final de esta sección).
- Los tests **leen la conexión de esas variables** (o de Testcontainers, ver abajo). NUNCA hardcodees host, puerto ni credenciales, y NUNCA toques la configuración `local/` del arquetipo para apuntarla a este entorno.
- Son servicios de PRUEBA y efímeros: se destruyen al terminar la sesión. No guardes nada que deba sobrevivir ni los uses como almacén de resultados.

### `wiremock` — wiremock/wiremock:3.13.1 (capa `api`)
Por qué está: servir el contrato de API del proyecto (56 endpoint(s)) para que las pantallas tengan a quién preguntar, sin levantar el backend.
Variables: `MIND_ENV_WIREMOCK_HOST`, `MIND_ENV_WIREMOCK_PORT`, `MIND_ENV_WIREMOCK_URL`.

**Tests de integración contra `wiremock` — reglas de obligado cumplimiento:**
1. El motor del test tiene que ser **el mismo del proyecto**: `wiremock/wiremock:3.13.1`, vía `wiremock-captain`. NO uses otro motor (ni `PostgreSQLContainer`, ni H2, ni una BBDD embebida) aunque el test 'pase': verificarías contra un dialecto que no es el de producción, que es exactamente cómo se cuelan los defectos de esquema. Esta regla PREVALECE sobre cualquier plantilla o ejemplo de este brief —incluidas las «Plantillas canónicas» del handbook—: si alguna usa otro motor, la plantilla está mal; sigue esta regla y repórtalo como Warning.
2. Fija Testcontainers en **1.21.3 o superior**. El daemon de esta sesión exige API ≥1.40; las versiones anteriores de Testcontainers negocian v1.32 y el daemon las rechaza — el error que verías es `Could not find a valid Docker environment`, que no apunta a la causa. Añadir la dependencia en scope de test está autorizado: es convención del proyecto, no desviación del arquetipo.
3. El daemon ya está configurado en tu entorno (`DOCKER_HOST`, `DOCKER_API_VERSION`, `TESTCONTAINERS_HOST_OVERRIDE`): NO los toques ni montes el socket. Basta declarar el contenedor en el test.
4. **Si el test no llega a funcionar, NO lo desactives** —ni renombrando el fichero, ni borrándolo, ni comentándolo—: eso quita cobertura de forma invisible para el revisor y para el CI. Déjalo en el entregable, márcalo como que requiere Docker de la forma que el proyecto ya use para eso (etiqueta/anotación condicional) y repórtalo como health check **Warning** con el error EXACTO que te dio. Un test desactivado en silencio es peor que un test que falla.

Las rutas del contrato de API del proyecto ya están cargadas: responden 200/201 con **cuerpo vacío**. El contrato guarda el nombre del esquema de respuesta, no su forma, así que la plataforma no inventa payloads — cada stub lleva ese nombre en su `name` para que sepas qué se espera.
Si tu pantalla necesita un cuerpo concreto, añádelo tú por el admin API (`POST http://$MIND_ENV_WIREMOCK_HOST:$MIND_ENV_WIREMOCK_PORT/__admin/mappings`) **desde el propio test**, para que quede declarado en el entregable y no dependa de un estado manual. Y NO levantes el backend: esta tarea se verifica contra el contrato, no contra la implementación de otro equipo — si el back tuviera un bug, tu tarea no debe teñirse de rojo por ello.

**Cómo apuntar la aplicación al stub** — la URL es distinta en cada sesión (puerto efímero), así que se lee de `$MIND_ENV_WIREMOCK_URL` en tiempo de ejecución del test y NO se escribe a mano en ningún fichero:
- Tests unitarios y de componente: no necesitan el stub. Mockea el cliente HTTP (en Angular, `HttpClientTestingModule` / `provideHttpClientTesting`) y no dependas de red.
- Tests que sí hacen HTTP real: inyecta la URL base en el arranque del test desde la variable de entorno (p. ej. `define`/`env` de la configuración de Vitest o Karma leyendo `process.env.MIND_ENV_WIREMOCK_URL`), y que el servicio la reciba por su token de configuración. NUNCA `localhost:puerto` en el código ni en `environment.ts`.
- E2E (Playwright/Cypress): la misma variable como URL base del API en su fichero de configuración.

**Playwright — la plataforma lo EJECUTA** cuando la `PlaywrightTriggerPolicy` detecta impacto UI (templates/CSS/rutas/componentes compartidos ≥2 imports/shell).

- **Automático (plataforma):** navega las **rutas** de cada `screen_code` de esta tarea (smoke in-session + visual post-PR) con bypass del selector de entorno (`dev`). No dependas solo del seed `welcome`.
- **Tu parte:** por cada pantalla del DoD, añade `e2e/<CODE>.*.e2e-spec.ts` con tags `@smoke` (y `@visual` si aplica) **y** `@screen:<CODE>` (p.ej. `@screen:SCR-066`) para asserts de negocio. Extiende; no renombres a `*.spec.ts` (chocan con Jest/Karma).
- Sin baselines pixel en el repo (`toHaveScreenshot` prohibido aquí).

**Navegador para los tests**: el runtime trae Chromium y `CHROME_BIN` ya apunta a él, así que NO lo instales ni lo descargues. Pero corre en un contenedor sin privilegios, así que su sandbox no puede activarse: usa un launcher headless con `--no-sandbox` (en Karma, un `customLaunchers` que extienda `ChromeHeadless`; en Playwright, `args: ['--no-sandbox']`). Sin eso el navegador está pero no arranca, y el síntoma no lo dice.

### Si el entorno no está disponible
Comprueba `.mind/TSK-035/env.json`: si su `status` es `unavailable` o `degraded`, la plataforma no pudo darte (todo) el entorno. En ese caso ESCRIBE igualmente los tests de integración y déjalos en el entregable, y repórtalo como health check **Warning** con `check: entorno-de-prueba` — NO como Blocker: no es un defecto de tu tarea, y la verificación queda diferida al CI. Reserva el Blocker para cuando el entorno SÍ estaba y los tests fallan por el código o por el brief.