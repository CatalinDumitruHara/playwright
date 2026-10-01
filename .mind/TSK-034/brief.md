# TSK-034 · Gestión de Incidencias para Empleados: Alta y Seguimiento

- Componente dueño: `ARC-011`
- Arquetipo del repo: `frontend-application-spa` — respeta sus convenciones; NUNCA te salgas de él (ver «Contrato de salida del arquetipo»).
- Zonas de código de ESTA tarea (trabajo principal): `apps/app/src/app/features/my-incidents/`, `apps/app/src/app/features/report-incident/`, `apps/app/src/app/app.routes.ts`. Fuera de ellas NO amplíes alcance de negocio — **EXCEPTO** el composition root y el manifiesto del host necesarios para montar lo entregado (sección Composition root).

## Definition of Done
Formulario de alta de incidencia consume EP-025, con carga previa de catálogos (EP-040, EP-042). Listado "Mis Incidencias" consume EP-027 con filtros propios del empleado. Detalle de incidencia (EP-028) muestra historial y permite descargar adjunto (EP-030). Rutas registradas en el host; `start`/`build` verdes.

## Oráculos de verificación (dod-oracles) — OBLIGATORIO

El DoD se evalúa por **comportamiento**, no porque exista un fichero o un string «implementado». Lo siguiente es **Blocker** si lo usas como entrega de producto (los dobles solo valen en tests):

- **Email / notificación:** cliente real o puerto inyectable (`aiosmtplib`, SES, SendGrid, …) + test que verifica que se invocó el envío. **`log.info` / `print` / «Simula el envío» ≠ email.**
- **Auth / rol (p. ej. ADMINISTRADOR):** dependency o middleware que devuelve 401/403 sin credencial/rol; tests con y sin permiso. **Un CRUD abierto no cumple «solo admin».**
- **Evento / AsyncAPI:** productor que publica al canal declarado; test que captura el publish. **Loguear el payload ≠ publicar el evento.**
- **Persistencia:** driver del stack del arquetipo (Motor/SQLAlchemy/…) contra el motor de prueba o Testcontainers. **`dict` / `db_*` in-memory en el módulo de producto ≠ base de datos.**

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

Tus zonas (`apps/app/src/app/features/my-incidents/`, `apps/app/src/app/features/report-incident/`, `apps/app/src/app/app.routes.ts`) pueden ya contener código de una TSK predecesora mergeada (o del esqueleto). Antes de crear tipos nuevos:

1. **Lista y lee** los ficheros bajo la zona (`ls` / abre `service.py`, `router.py`, …).
2. **EDIT/EXTIENDE** clases, funciones y exports existentes. **PROHIBIDO** una segunda `class`/`def`/export con el **mismo nombre** en el mismo fichero (en Python gana la última y el resto es basura).
3. Si esta tarea es «API pública» / «consulta» sobre el mismo dominio que un CRUD previo, **reutiliza** servicios y modelos; añade solo el router/handlers públicos (montados en el composition root).
4. Un módulo = un dueño semántico de cada símbolo top-level. Si hace falta otro tipo, **nómbralo distinto** o factoriza — no pegues un duplicado al EOF.

El runtime puede anexar la lista real de ficheros presentes en la zona al arrancar la sesión.

## Contrato API congelado (api-contract) — LEY

Estos son los endpoints que publica el backend de este producto (`openapi.yaml`, PR #0 / C.2). Son los ÚNICOS que puedes llamar: no inventes paths, verbos ni parámetros, y si la pantalla necesita algo que no está en la tabla, SEÑÁLALO en el PR en vez de fabricarlo.

| EP | Método | Path | Request | Response | Status | Public | Roles |
|----|--------|------|---------|----------|--------|--------|-------|
| `EP-025` | **POST** | `/incidents` | `IncidentCreateRequest` | `IncidentDetail` | 201 | N | `ROL-001`, `ROL-002` |
| | | _Da de alta una incidencia de sala con categoría, descripción y foto opcional_ | | | | | |
| `EP-027` | **GET** | `/my-incidents` | `—` | `IncidentListPage` | 200 | N | `ROL-001`, `ROL-002` |
| | | _Consulta el listado de las incidencias reportadas por el propio empleado_ | | | | | |
| `EP-028` | **GET** | `/incidents/{incidentId}` | `—` | `IncidentDetail` | 200 | N | `ROL-001`, `ROL-002` |
| | | _Consulta el detalle de una incidencia con su estado, responsable y transiciones disponibles_ | | | | | |
| `EP-030` | **GET** | `/incidents/{incidentId}/photo` | `—` | `IncidentPhotoContent` | 200 | N | `ROL-001`, `ROL-002` |
| | | _Descarga la foto adjunta de una incidencia previa verificación de integridad_ | | | | | |
| `EP-040` | **GET** | `/incident-categories` | `—` | `IncidentCategoryList` | 200 | N | `ROL-001`, `ROL-002`, `ROL-003` |
| | | _Consulta el catálogo cerrado de categorías de incidencia_ | | | | | |
| `EP-042` | **GET** | `/rooms` | `—` | `RoomList` | 200 | N | `ROL-001`, `ROL-002`, `ROL-003` |
| | | _Consulta el catálogo de salas agrupadas por oficina con búsqueda_ | | | | | |
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
| `EP-026` | **GET** | `/incidents` | `—` | `IncidentListPage` | 200 | N | `ROL-002` |
| | | _Consulta la bandeja completa de incidencias con filtros, búsqueda, orden y paginación_ | | | | | |
| `EP-029` | **GET** | `/incidents/{incidentId}/history` | `—` | `IncidentHistoryPage` | 200 | N | `ROL-001`, `ROL-002` |
| | | _Consulta el historial cronológico de cambios de una incidencia con autor y fecha_ | | | | | |
| `EP-031` | **POST** | `/incidents/{incidentId}/assignment` | `SelfAssignmentRequest` | `IncidentAssignmentDetail` | 201 | N | `ROL-002` |
| | | _Permite a un técnico autoasignarse una incidencia sin responsable_ | | | | | |
| `EP-032` | **PUT** | `/incidents/{incidentId}/assignment` | `AssignmentChangeRequest` | `IncidentAssignmentDetail` | 200 | N | `ROL-002` |
| | | _Reasigna una incidencia no cerrada a otro técnico de mantenimiento activo_ | | | | | |
| `EP-033` | **DELETE** | `/incidents/{incidentId}/assignment` | `AssignmentReleaseRequest` | `IncidentAssignmentDetail` | 204 | N | `ROL-002` |
| | | _Libera la incidencia asignada indicando el motivo y la devuelve a tomable_ | | | | | |
| `EP-034` | **POST** | `/incidents/{incidentId}/transitions` | `StatusTransitionRequest` | `IncidentDetail` | 201 | N | `ROL-002` |
| | | _Ejecuta una transición de estado válida del ciclo de vida de la incidencia_ | | | | | |
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
| `EP-041` | **PUT** | `/incident-categories/{categoryCode}` | `IncidentCategoryUpdateRequest` | `IncidentCategoryDetail` | 200 | N | `ROL-003` |
| | | _Renombra, reordena o activa/desactiva una categoría del catálogo cerrado_ | | | | | |
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

> 7 pantalla(s) de esta tarea. TRANSCRIBE el detalle: no inventes pantallas, rutas, etiquetas ni navegación. Cuando una pantalla trae «Detalle de UI (B.7)», ESA es la fuente autoritativa — sus `label` son el texto a pintar y su `widget` el control a usar, ya decididos y aprobados. Los bloques de la fase FLOWS son contexto: sus textos son términos de dominio (glosario), NO etiquetas de UI. Respeta el design system del arquetipo.

### ARC-023 · Alta de incidencia de sala
El empleado reporta una incidencia indicando sala, categoría, descripción y foto opcional en una única pantalla
- **API**: esta pantalla no trae cableado pantalla→endpoint de T.5. NO lo interpretes como «no llama a la API»: elige los endpoints que necesita de la tabla del contrato congelado (sección api-contract), con su path y su verbo literales, y **repórtalo como health check `Warning` con `check: api-contract`** indicando cuáles has usado.
- **Detalle de UI (B.7) · `UIS-017`** — FUENTE AUTORITATIVA: los `label` son el texto a pintar y el `widget` el control a usar.
  - Propósito: Spec mínima B.7 (stub Playwright) para ARC-023: Alta de incidencia de sala.
  - Disposición: **formulario** (`form`) — respétala; no rediseñes la pantalla.
  - Navegación: sección de menú «incidents» (orden 0).
- Flujo `FLOW-001` · pantalla `SCR-001`
  - **Rutas:** `/incidencias/nueva`
  - **Componentes de UI:** Selector de sala afectada con catálogo precargado; Selector de categoría de incidencia; Campo de descripción breve con contador de caracteres; Componente de adjunto de foto opcional con previsualización; Panel de mensajes de validación inline; Botón Crear incidencia; Botón Cancelar
  - **Datos que muestra:** Sala afectada; Oficina a la que pertenece la sala; Categoría de la incidencia; Descripción breve de la incidencia; Foto adjunta de la incidencia; Empleado reportante
  - **Acciones del usuario:** Seleccionar la sala afectada del catálogo; Seleccionar la categoría de la incidencia; Escribir la descripción breve de la incidencia; Adjuntar la foto de la incidencia; Quitar la foto adjunta; Enviar el alta de la incidencia; Cancelar el alta y salir del formulario
  - **Navegación:**
    - Pulsar Registrar incidencia → «Confirmación del alta» si Si la sala, la categoría y la descripción breve son válidas [submit]

### ARC-024 · Confirmación del alta
El empleado obtiene el código de referencia de la incidencia creada y el enlace a su detalle
- **API**: esta pantalla no trae cableado pantalla→endpoint de T.5. NO lo interpretes como «no llama a la API»: elige los endpoints que necesita de la tabla del contrato congelado (sección api-contract), con su path y su verbo literales, y **repórtalo como health check `Warning` con `check: api-contract`** indicando cuáles has usado.
- **Detalle de UI (B.7) · `UIS-018`** — FUENTE AUTORITATIVA: los `label` son el texto a pintar y el `widget` el control a usar.
  - Propósito: Spec mínima B.7 (stub Playwright) para ARC-024: Confirmación del alta.
  - Disposición: **formulario** (`form`) — respétala; no rediseñes la pantalla.
  - Navegación: sección de menú «incidents» (orden 0).
- Flujo `FLOW-001` · pantalla `SCR-002`
  - **Rutas:** `/incidencias/nueva/confirmacion`
  - **Componentes de UI:** Panel de confirmación con el código de referencia de la incidencia; Acción de copiar el código de referencia; Enlace al detalle de la incidencia; Botón Crear otra incidencia
  - **Datos que muestra:** Código de referencia de la incidencia; Estado inicial de la incidencia; Fecha de alta de la incidencia; Enlace al detalle de la incidencia
  - **Acciones del usuario:** Copiar el código de referencia de la incidencia; Abrir el detalle de la incidencia creada; Dar de alta otra incidencia
  - **Navegación:**
    - Registrar otra incidencia → «Alta de incidencia de sala» [navigate]
- Flujo `FLOW-017` · pantalla `SCR-003`
  - **Rutas:** `/usuarios/{id}/alta/confirmacion`
  - **Componentes de UI:** Tarjeta resumen del usuario creado con su rol; Mensaje de aviso de credencial inicial enviada al correo corporativo; Botón Ir a la ficha del usuario; Botón Volver al listado de usuarios
  - **Datos que muestra:** Nombre y apellidos del usuario creado; Correo corporativo del usuario creado; Rol asignado; Estado de entrega de la credencial inicial
  - **Acciones del usuario:** Abrir la ficha del usuario creado; Dar de alta otro usuario; Volver al censo de usuarios
  - **Navegación:**
    - Avisar de credencial no entregada → «Aviso de credencial no entregada» si Si el servidor SMTP estándar no acepta el envío de la credencial inicial [navigate]
    - Volver al censo de usuarios → «Usuarios» [navigate]

### ARC-025 · Mis incidencias
El empleado consulta, filtra y busca las incidencias que él mismo ha reportado con su estado actual
- **API**: esta pantalla no trae cableado pantalla→endpoint de T.5. NO lo interpretes como «no llama a la API»: elige los endpoints que necesita de la tabla del contrato congelado (sección api-contract), con su path y su verbo literales, y **repórtalo como health check `Warning` con `check: api-contract`** indicando cuáles has usado.
- **Detalle de UI (B.7) · `UIS-019`** — FUENTE AUTORITATIVA: los `label` son el texto a pintar y el `widget` el control a usar.
  - Propósito: Spec mínima B.7 (stub Playwright) para ARC-025: Mis incidencias.
  - Disposición: **formulario** (`form`) — respétala; no rediseñes la pantalla.
  - Navegación: sección de menú «incidents» (orden 0).
- Flujo `FLOW-002` · pantalla `SCR-001`
  - **Rutas:** `/mis-incidencias`
  - **Componentes de UI:** Buscador por texto libre; Panel de filtros por estado, categoría, sala, oficina y rango de fechas; Selector de criterio de ordenación; Listado de mis incidencias con etiqueta de estado; Paginador de resultados; Bloque de estado vacío sin incidencias
  - **Datos que muestra:** Código de referencia de la incidencia; Sala afectada; Oficina a la que pertenece la sala; Categoría de la incidencia; Estado actual de la incidencia; Fecha de alta de la incidencia; Técnico de mantenimiento asignado; Rango de fechas de alta como criterio de filtrado; Número total de incidencias propias del resultado
  - **Acciones del usuario:** Filtrar mis incidencias por estado; Filtrar mis incidencias por categoría, sala u oficina; Filtrar mis incidencias por rango de fechas; Buscar incidencias por texto; Ordenar el listado de mis incidencias; Limpiar los filtros aplicados; Abrir el detalle de una incidencia propia
  - **Navegación:**
    - Ver detalle de la incidencia → «Detalle de la incidencia» si Si la incidencia seleccionada fue reportada por el empleado [navigate]
- Flujo `FLOW-029` · pantalla `SCR-001`
  - **Rutas:** `/incidencias/mias`
  - **Componentes de UI:** Tabla de incidencias reportadas por el empleado autenticado; Filtros por categoría y por estado; Enlace al detalle de la incidencia; Controles de paginación del listado; Mensaje de listado vacío
  - **Datos que muestra:** Sala de la incidencia; Categoría de la incidencia; Descripción de la incidencia; Estado de la incidencia; Fecha de reporte de la incidencia
  - **Acciones del usuario:** Filtrar mis incidencias por estado; Navegar entre las páginas del listado; Abrir el detalle de la incidencia
  - **Navegación:**
    - Abrir el detalle de la incidencia → «Detalle de la incidencia» si Si la incidencia pertenece al alcance del empleado autenticado [navigate]
    - Abrir el detalle de la incidencia → «Incidencia no encontrada» si Si la incidencia no existe o queda fuera del alcance del usuario [navigate]

### ARC-026 · Detalle de la incidencia (mis incidencias)
El empleado reportante revisa la clasificación, la descripción, la foto, el estado y el técnico asignado de su incidencia
- **API**: esta pantalla no trae cableado pantalla→endpoint de T.5. NO lo interpretes como «no llama a la API»: elige los endpoints que necesita de la tabla del contrato congelado (sección api-contract), con su path y su verbo literales, y **repórtalo como health check `Warning` con `check: api-contract`** indicando cuáles has usado.
- **Detalle de UI (B.7) · `UIS-020`** — FUENTE AUTORITATIVA: los `label` son el texto a pintar y el `widget` el control a usar.
  - Propósito: Spec mínima B.7 (stub Playwright) para ARC-026: Detalle de la incidencia (mis incidencias).
  - Disposición: **formulario** (`form`) — respétala; no rediseñes la pantalla.
  - Navegación: sección de menú «incidents» (orden 0).

### ARC-027 · Historial de cambios de estado
El usuario revisa la línea temporal de transiciones con estado origen, estado destino, autor, fecha y tiempo de permanencia
- **API**: esta pantalla no trae cableado pantalla→endpoint de T.5. NO lo interpretes como «no llama a la API»: elige los endpoints que necesita de la tabla del contrato congelado (sección api-contract), con su path y su verbo literales, y **repórtalo como health check `Warning` con `check: api-contract`** indicando cuáles has usado.
- **Detalle de UI (B.7) · `UIS-021`** — FUENTE AUTORITATIVA: los `label` son el texto a pintar y el `widget` el control a usar.
  - Propósito: Spec mínima B.7 (stub Playwright) para ARC-027: Historial de cambios de estado.
  - Disposición: **formulario** (`form`) — respétala; no rediseñes la pantalla.
  - Navegación: sección de menú «incidents» (orden 0).
- Flujo `FLOW-002` · pantalla `SCR-003`
  - **Rutas:** `/mis-incidencias/{id}/historial`
  - **Componentes de UI:** Línea temporal de cambios de estado; Entrada de historial con estado origen, estado destino, autor y fecha-hora; Indicador de tiempo de permanencia en cada estado; Bloque de estado vacío sin cambios registrados
  - **Datos que muestra:** Estado origen de la transición; Estado destino de la transición; Autor del cambio de estado; Fecha y hora del cambio de estado; Tiempo de permanencia en cada estado
  - **Acciones del usuario:** Filtrar las entradas del historial por estado destino; Volver al detalle de la incidencia
  - **Navegación:**
    - Volver al detalle de la incidencia → «Detalle de la incidencia» [back]
- Flujo `FLOW-029` · pantalla `SCR-004`
  - **Rutas:** `/incidencias/{id}/historial-estados`
  - **Componentes de UI:** Línea de tiempo de transiciones con estado anterior, estado nuevo, autor y fecha; Botón Volver al detalle de la incidencia
  - **Datos que muestra:** Estado anterior de la incidencia; Estado nuevo de la incidencia; Autor del cambio de estado; Fecha del cambio de estado
  - **Acciones del usuario:** Volver al detalle de la incidencia
  - **Navegación:**
    - Volver al detalle de la incidencia → «Detalle de la incidencia» [back]

### ARC-094 · Foto adjunta de la incidencia
El usuario con alcance visualiza y descarga la foto adjunta de una incidencia
- **API**: esta pantalla no trae cableado pantalla→endpoint de T.5. NO lo interpretes como «no llama a la API»: elige los endpoints que necesita de la tabla del contrato congelado (sección api-contract), con su path y su verbo literales, y **repórtalo como health check `Warning` con `check: api-contract`** indicando cuáles has usado.
- **Detalle de UI (B.7) · `UIS-022`** — FUENTE AUTORITATIVA: los `label` son el texto a pintar y el `widget` el control a usar.
  - Propósito: Spec mínima B.7 (stub Playwright) para ARC-094: Foto adjunta de la incidencia.
  - Disposición: **formulario** (`form`) — respétala; no rediseñes la pantalla.
  - Navegación: sección de menú «incidents» (orden 0).
- Flujo `FLOW-029` · pantalla `SCR-005`
  - **Rutas:** `/incidencias/{id}/foto`
  - **Componentes de UI:** Visor de la foto adjunta de la incidencia; Mensaje de ausencia de foto adjunta; Botón Volver al detalle de la incidencia
  - **Datos que muestra:** Foto adjunta de la incidencia; Identificador de la incidencia asociada a la foto
  - **Acciones del usuario:** Descargar la foto adjunta; Cerrar la foto y volver al detalle de la incidencia
  - **Navegación:**
    - Volver al detalle de la incidencia → «Detalle de la incidencia» [back]

### ARC-095 · Incidencia no encontrada
El usuario recibe la respuesta uniforme de incidencia inexistente o fuera de su alcance de datos
- **API**: esta pantalla no trae cableado pantalla→endpoint de T.5. NO lo interpretes como «no llama a la API»: elige los endpoints que necesita de la tabla del contrato congelado (sección api-contract), con su path y su verbo literales, y **repórtalo como health check `Warning` con `check: api-contract`** indicando cuáles has usado.
- **Detalle de UI (B.7) · `UIS-006`** — FUENTE AUTORITATIVA: los `label` son el texto a pintar y el `widget` el control a usar.
  - Propósito: El usuario recibe un aviso uniforme de que la incidencia solicitada no está disponible y vuelve a su listado de incidencias.
  - Disposición: **genérico** (`generic`) — respétala; no rediseñes la pantalla.
  - **Datos que muestra:**
    - «No hemos encontrado esa incidencia» (widget `empty_state`, opcional)
    - «Incidencia solicitada» (widget `label`, tipo `string`, opcional)
  - **Acciones:**
    - «Volver a todas las incidencias» (widget `secondary_button`, opcional, navega)
    - «Volver a mis incidencias» (widget `primary_button`, opcional, navega)
- Flujo `FLOW-029` · pantalla `SCR-006`
  - **Rutas:** `/incidencias/no-encontrada`
  - **Componentes de UI:** Mensaje uniforme de incidencia no encontrada; Botón Volver al listado de incidencias
  - **Datos que muestra:** Mensaje uniforme de incidencia no encontrada; Identificador de la incidencia solicitada
  - **Acciones del usuario:** Volver al listado de incidencias
  - **Navegación:**
    - Volver a «Mis incidencias» → «Mis incidencias» [back]
    - Volver al listado completo de incidencias → «Listado completo de incidencias» [back]

## Requisitos que materializa esta tarea

### REQ-024 — Listado de incidencias del empleado acotado a las propias en la consulta a BD
El sistema acota el listado de incidencias del rol empleado a las que él ha reportado, aplicando el filtro de propiedad en la consulta a base de datos. Reglas: (1) con data_scope = OWN la consulta incorpora obligatoriamente reporter_user_id = session_user_id; (2) el filtro no es opcional ni sobrescribible por parámetros de la petición; (3) los criterios de ordenación y paginación no pueden ampliar el conjunto; (4) el total de resultados y los contadores se calculan sobre el conjunto ya acotado, sin revelar el volumen global. Flujo: empleado abre «Mis incidencias» → API resuelve alcance OWN → consulta filtrada → lista con status y fecha de última actualización. Datos devueltos: incident_id (uuid), room_id (varchar), category_code (varchar), status (varchar), created_at (timestamp), updated_at (timestamp). Catálogos: cat_estados_incidencia, cat_categorias_incidencia (mobiliario, climatización, audiovisual, limpieza, otros), cat_salas [gap: el RFP no aporta el listado de salas de las tres oficinas]. Validaciones: si la petición incluye reporter_user_id distinto del de la sesión, el parámetro se ignora sin error. Errores: sin sesión → 401; rol sin permiso de listado → 403. Aceptación: EMPLEADO con 3 incidencias propias en una base con 40 recibe exactamente 3 y el total declarado es 3; enviando reporter_user_id ajeno sigue recibiendo solo las suyas. Dependencias: PERM-01; endpoint de listado en MOD-002.
**Reglas de negocio:**
1. El conjunto de incidencias alcanzable por un rol con data_scope OWN es exactamente el de las incidencias cuyo reporter_user_id es el usuario de la sesión
2. Ningún parámetro de ordenación, paginación o filtrado de la petición amplía el conjunto acotado por el alcance
3. Los totales y contadores devueltos se calculan sobre el conjunto ya acotado por el alcance
**Criterios de aceptación:**
1. AC-INC-04: Dado un empleado autenticado, cuando consulta «Mis incidencias», entonces ve únicamente las incidencias que él ha reportado con su estado actual, y ninguna incidencia de otro empleado aparece en el listado ni es accesible por identificador directo.
**Validaciones:**
1. Un `reporter_user_id` recibido en la petición que no coincida con el de la sesión se ignora silenciosamente (no genera error de validación)
2. Los parámetros de ordenación y paginación deben validarse contra campos permitidos y no pueden alterar el filtro de propiedad aplicado
**Escenarios de error:**
1. Consulta del listado propio sin sesión iniciada
2. El rol del usuario no tiene permitido el listado solicitado
3. Parámetros de ordenación o paginación no válidos
**Campos de datos:**
- `incident_id` (uuid, obligatorio) — Identificador de cada incidencia del listado propio
- `reporter_user_id` (uuid, obligatorio) — Forzado a `= session_user_id`; si llega por petición con otro valor, se ignora
- `room_id` (string, obligatorio) — Valor de `cat_salas` (catálogo de salas no aportado por el RFP)
- `category_code` (enum, obligatorio) — Valores de `cat_categorias_incidencia`: mobiliario, climatización, audiovisual, limpieza, otros
- `status` (enum, obligatorio) — Valores de `cat_estados_incidencia`
- `created_at` (datetime, obligatorio) — Fecha de alta de la incidencia
- `updated_at` (datetime, obligatorio) — Fecha de última actualización mostrada en el listado

### REQ-026 — Mismo alcance por rol en el detalle y el historial de cambios de estado
El sistema aplica el mismo alcance por rol a la consulta del detalle y del historial de cambios de estado de una incidencia. Reglas: (1) acceden el reportante de la incidencia (reporter_user_id = session_user_id) o cualquier TECNICO_MANTENIMIENTO; (2) el historial se devuelve completo y en orden cronológico para quien está autorizado, pudiendo el reportante ver en todo momento el estado actual y el historial de cambios; (3) el alcance del historial se hereda del de su incidencia: no existe acceso al historial sin acceso al detalle. Flujo: usuario abre una incidencia → se comprueba alcance (PERM-03) → detalle + lista de transiciones. Datos del historial: history_id (uuid), incident_id (uuid), status_from (varchar, nulo en el alta), status_to (varchar, obligatorio), changed_by_user_id (uuid, obligatorio), changed_at (timestamp, obligatorio), resolution_comment (text, presente solo en la transición a CERRADA). Validaciones: el historial es de solo lectura para ambos roles; ninguna operación de la API permite editarlo ni borrarlo. Errores: incidencia ajena o inexistente → respuesta uniforme de PERM-03. Aceptación: EMPLEADO reportante ve estado actual y todas las transiciones con autor y fecha; EMPLEADO no reportante no recibe ninguna transición. Seguridad: EMPLEADO alcance OWN, TECNICO_MANTENIMIENTO alcance ALL; el historial identifica al autor del cambio (dato personal). Dependencias: PERM-03; historial escrito por MOD-002.
**Reglas de negocio:**
1. El alcance del historial de cambios de estado de una incidencia es idéntico al alcance de su detalle
2. El historial de cambios de estado es inmutable: ninguna operación de la API lo modifica ni lo elimina
3. Cada entrada del historial identifica el estado destino, el autor del cambio y su fecha
4. Un resolution_comment solo acompaña a la transición a CERRADA
**Criterios de aceptación:**
1. AC-G-05: Dado una incidencia que ha recorrido todas sus transiciones de estado, cuando el empleado reportante o cualquier técnico consultan su detalle, entonces se muestra el estado actual y el historial completo en orden cronológico con `status_from`, `status_to`, autor del cambio y fecha para cada transición, y ninguna operación de la API permite editar ni borrar entradas del historial.
2. AC-ALC-04: Dado una incidencia con varias transiciones registradas, cuando la consultan (a) su empleado reportante, (b) un técnico de mantenimiento y (c) un empleado no reportante, entonces (a) y (b) reciben el detalle y el historial completo en orden cronológico con autor y fecha de cada transición, y (c) recibe la respuesta uniforme de recurso inexistente sin ninguna transición; en ningún caso existe acceso al historial sin acceso al detalle.
**Validaciones:**
1. En cada entrada de historial, `status_to`, `changed_by_user_id` y `changed_at` son obligatorios
2. `status_from` solo puede ser nulo en la entrada correspondiente al alta de la incidencia
3. `resolution_comment` solo puede venir informado en la transición a `CERRADA`
4. El historial no admite peticiones de escritura: cualquier intento de edición o borrado se rechaza en el punto de entrada
**Escenarios de error:**
1. Consulta del detalle o del historial de una incidencia fuera del alcance del usuario o inexistente
**Campos de datos:**
- `history_id` (uuid, obligatorio) — Identificador de cada entrada del historial de cambios de estado
- `incident_id` (uuid, obligatorio) — El alcance del historial se hereda del de la incidencia
- `status_from` (enum, opcional) — Nulo en el alta; valores de `cat_estados_incidencia`
- `status_to` (enum, obligatorio) — Valores de `cat_estados_incidencia`
- `changed_by_user_id` (uuid, obligatorio) — Dato personal; solo lectura
- `changed_at` (datetime, obligatorio) — Historial devuelto en orden cronológico
- `resolution_comment` (string, opcional) — Presente solo en la transición a CERRADA

### REQ-090 — Alta de incidencia de sala por empleado autenticado con sala, categoría, descripción y foto opcional
El sistema permite a un empleado autenticado dar de alta una incidencia de una sala indicando sala afectada, categoría, descripción breve y, opcionalmente, una foto. Reglas: la incidencia nace siempre en estado ABIERTA; el reportante y el sello temporal los fija el servidor desde la sesión, nunca desde el payload (REQ-064); assigned_to_user_id nace nulo; al persistir se crea el asiento inicial del historial (from_status null → to_status ABIERTA), inmutable y retenido 2 años (REQ-015, REQ-047); no hay borrado físico. Flujo: abrir formulario → seleccionar sala (CAT-02) → seleccionar categoría (CAT-01) → escribir descripción → adjuntar foto opcional (INC-02) → enviar → el sistema valida, persiste y devuelve el identificador. Ramas: error de validación vuelve al formulario conservando lo introducido sin crear nada; fallo al guardar la foto conserva la incidencia. Datos: room_id (number, obligatorio, existente e is_active en cat_rooms), category_code (varchar, obligatorio, vigente en cat_incident_categories), description (varchar, obligatorio, 10–500 caracteres [gap: el RFP dice «descripción breve» sin longitudes]), photo_attachment_id (number, opcional, nullable), status (varchar, lo fija el servidor, FK cat_incident_statuses, inicial ABIERTA), reported_by_user_id (number, del contexto de sesión), created_at (timestamp, servidor), reference_code (varchar, único, formato INC-AAAA-NNNNNN [inferido]). Catálogos: cat_rooms, cat_incident_categories, cat_incident_statuses. Validaciones: obligatoriedad de sala/categoría/descripción; descripción no compuesta solo de espacios; saneamiento de HTML en description; sala existente y activa; categoría vigente. Errores: 400 «Debes indicar la sala afectada» / «Selecciona una categoría» / «Describe brevemente la incidencia»; 401 sin sesión con redirección al acceso (REQ-058); 422 «La sala seleccionada ya no está disponible»; 500 «No hemos podido registrar la incidencia, inténtalo de nuevo». Criterios de aceptación: Given un EMPLEADO autenticado con sala, categoría y descripción When envía el formulario Then se crea la incidencia en estado ABIERTA y se muestra su identificador; Given falta sala, categoría o descripción Then no se crea ninguna incidencia y se indica qué campo obligatorio falta; Given un usuario no autenticado When invoca el endpoint de alta Then 401 y ninguna incidencia creada; Given una incidencia recién creada When se consulta su registro Then constan el empleado reportante y la fecha y hora de creación. Seguridad: ejecutan EMPLEADO y TECNICO_DE_MANTENIMIENTO autenticados (cualquier usuario activo); el alta se atribuye siempre al usuario de la sesión, sin reportar «en nombre de» otro; el reportante solo verá después sus propias incidencias (REQ-024, REQ-029); sin doble factor; autorización vinculante en la API REST, no en la SPA (REQ-013, REQ-032). Eventos de dominio: IncidentReported al completarse el alta, consumido por el módulo de notificaciones para el aviso por correo al equipo de mantenimiento [inferido: el RFP no nombra el evento]. Dependencias: CAT-01, CAT-02, REQ-033, REQ-059, REQ-064. Integración: dispara evento consumido por el envío SMTP, fuera de esta épica. Prioridad: Must.
**Reglas de negocio:**
1. Toda incidencia nace en estado `ABIERTA` y ese estado inicial no es fijable desde el payload del alta
2. El reportante de una incidencia es siempre el usuario de la sesión que la creó; no existe reporte «en nombre de» otro usuario
3. La fecha y hora de creación de una incidencia las fija el servidor, nunca el cliente
4. Una incidencia recién creada no tiene técnico asignado
5. Toda incidencia tiene exactamente un asiento inicial de historial con `from_status` nulo y `to_status` = `ABIERTA`
6. Los asientos del historial de una incidencia son inmutables y se conservan 2 años
7. Una incidencia no puede eliminarse físicamente del sistema
8. Toda incidencia tiene exactamente una sala afectada, exactamente una categoría y una descripción no vacía
9. La descripción de una incidencia tiene entre 10 y 500 caracteres y no puede componerse únicamente de espacios
10. El `reference_code` es único en todo el sistema y corresponde a una sola incidencia
11. Una incidencia solo puede referenciar una sala activa y una categoría vigente en el instante de su alta
12. Un usuario sin sesión válida no origina ninguna incidencia
13. Un intento de alta que no supera las validaciones no deja ninguna incidencia creada
**Criterios de aceptación:**
1. AC-INC-01: Dado un empleado autenticado que ha seleccionado una sala activa, una categoría vigente y escrito una descripción válida, cuando envía el formulario de alta, entonces se crea exactamente una incidencia en estado `ABIERTA`, con `reference_code` único, y la pantalla de confirmación muestra ese identificador y el enlace a su detalle.
2. AC-INC-02: Dado un formulario de alta al que le falta la sala, la categoría o la descripción (o cuya descripción solo contiene espacios o queda fuera del rango 10–500 caracteres), cuando el empleado intenta enviarlo, entonces la API responde `400` indicando qué campo obligatorio falta, no se crea ninguna incidencia y el formulario conserva los datos ya introducidos.
3. AC-INC-03: Dado un cliente sin sesión válida o con sesión caducada, cuando invoca el endpoint de alta de incidencia, entonces la API responde `401`, no se crea ninguna incidencia y la SPA redirige al acceso conservando el aviso de sesión caducada.
4. AC-INC-04: Dado un alta enviada con `reported_by_user_id` o `created_at` manipulados en el payload, cuando el servidor la procesa, entonces el reportante y el sello temporal se fijan desde la sesión del servidor ignorando el payload, y `assigned_to_user_id` y `status` quedan en `null` y `ABIERTA` respectivamente.
5. AC-INC-07: Dado un empleado que no adjunta foto, cuando envía sala, categoría y descripción, entonces el alta se completa sin error ni advertencia; y dado un fallo del almacenamiento posterior a la persistencia de la incidencia, entonces la incidencia se conserva y se informa de que la foto no pudo guardarse.
6. AC-INC-09: Dado el botón de envío del formulario de alta, cuando el usuario lo pulsa dos veces seguidas antes de recibir respuesta, entonces se crea exactamente una incidencia y el botón permanece deshabilitado mientras el POST está en vuelo.
7. AC-INC-10: Dado una incidencia recién creada, cuando se consulta su historial, entonces existe un asiento inicial con `from_status = null` y `to_status = ABIERTA`, con autor y fecha de creación, y ese asiento no admite modificación ni borrado por ninguna operación expuesta.
8. AC-CAT-02: Dado un POST de alta con un `category_code` inexistente, inactivo o fuera del catálogo cerrado, cuando el servidor lo valida, entonces responde `422` «La categoría seleccionada no es válida» y no se crea ninguna incidencia, con independencia de lo que haya validado la SPA.
9. AC-NOT-01: Dado una incidencia con reportante identificado, cuando su estado cambia, entonces se entrega al relay SMTP un correo al reportante en menos de 5 minutos, en español, identificando la incidencia por `reference_code` y su nuevo estado. [pendiente mapping 1.4]
10. AC-NOT-02: Dado el alta de una incidencia nueva, cuando se completa la creación, entonces el evento `IncidentReported` provoca la entrega al relay SMTP de un aviso al buzón/lista del equipo de mantenimiento, sin usar ningún otro canal (ni SMS ni push). [pendiente mapping 1.4]
11. AC-NOT-03: Dado un relay SMTP no disponible, cuando se produce un alta o un cambio de estado, entonces la operación de negocio se persiste igualmente, el fallo de entrega queda registrado con su causa y se reintenta según la política acordada, sin pérdida silenciosa de la notificación. [pendiente mapping 1.4]
**Validaciones:**
1. La sala afectada (`room_id`) es obligatoria: no se acepta el alta sin valor
2. La categoría (`category_code`) es obligatoria: no se acepta el alta sin valor
3. La descripción (`description`) es obligatoria: no se acepta el alta sin valor
4. La descripción no puede estar compuesta únicamente por espacios en blanco
5. La descripción debe tener entre 10 y 500 caracteres
6. La descripción se sanea de HTML antes de aceptarse (no se admite marcado inyectado)
7. El `room_id` recibido debe existir en `cat_rooms` y tener `is_active = 1` en el instante del alta
8. El `category_code` recibido debe existir en `cat_incident_categories` y estar vigente en el instante del alta
9. El `reference_code` generado debe cumplir el formato `INC-AAAA-NNNNNN` y ser único
10. Los campos `reported_by_user_id`, `created_at` y `status` no se aceptan desde el payload: se ignoran y los fija el servidor desde la sesión
**Escenarios de error:**
1. No se ha indicado la sala afectada
2. No se ha seleccionado una categoría
3. No se ha informado la descripción de la incidencia
4. La descripción está compuesta solo por espacios o no respeta la longitud admitida
5. Se intenta dar de alta la incidencia sin sesión válida
6. Se intenta atribuir el alta a un usuario distinto del de la sesión
7. La sala seleccionada ya no está disponible
8. La categoría seleccionada no es válida o ya no está vigente
9. No ha sido posible registrar la incidencia; se puede reintentar el envío
**Campos de datos:**
- `room_id` (integer, obligatorio) — Debe existir en `cat_rooms` y estar activa (`is_active = 1`) en el instante del alta
- `category_code` (enum, obligatorio) — Valor vigente del catálogo cerrado: MOBILIARIO, CLIMATIZACION, AUDIOVISUAL, LIMPIEZA, OTROS
- `description` (string, obligatorio) — 10–500 caracteres [gap: longitud no declarada en el RFP]; no solo espacios; saneado de HTML
- `photo_attachment_id` (integer, opcional) — Nullable; como máximo un adjunto por incidencia
- `status` (enum, obligatorio) — Lo fija el servidor; valor inicial `ABIERTA`; valores: ABIERTA, EN_CURSO, RESUELTA, CERRADA
- `reported_by_user_id` (integer, obligatorio) — Lo fija el servidor desde la sesión, nunca desde el payload
- `created_at` (datetime, obligatorio) — Sello temporal de servidor
- `reference_code` (string, obligatorio) — Único; formato `INC-AAAA-NNNNNN` [inferido]

### REQ-091 — Adjuntar opcionalmente una foto a la incidencia en el alta y vincularla de forma recuperable desde el detalle
El sistema permite adjuntar opcionalmente una foto a la incidencia en el momento del alta y la vincula de forma recuperable desde su detalle. Reglas: el adjunto es opcional y el alta sin foto debe completarse sin error; una sola foto por incidencia [inferido: el RFP habla de «una foto adjunta» en singular]; el binario nunca se expone en una ruta pública adivinable, se sirve por identificador con control de acceso; el adjunto vive y muere con la incidencia (sin borrado físico, REQ-047). Flujo: el empleado selecciona el archivo → validación de formato y tamaño en cliente y servidor → almacenamiento con clave opaca → vinculación a la incidencia creada. Rama: si el almacenamiento falla después de persistir la incidencia, la incidencia se conserva y se informa «La incidencia se ha creado pero no hemos podido guardar la foto» [inferido]. Datos: attachment_id (number, PK), incident_id (number, FK obligatorio), file_name (varchar 255, saneado), mime_type (varchar, whitelist image/jpeg, image/png), file_size_bytes (number, máx 5 MB [gap: el RFP no declara formatos ni tamaño máximo]), storage_key (varchar, opaco), uploaded_by_user_id (number), uploaded_at (timestamp). Validaciones: extensión y mime-type real coincidentes (no basta la extensión); tamaño dentro del límite; un único archivo por alta. Errores: 413 «La foto supera el tamaño máximo permitido (5 MB)»; 415 «Formato de imagen no admitido, usa JPG o PNG»; 404 uniforme al solicitar un adjunto fuera del alcance del solicitante (REQ-031). Criterios de aceptación: Given un EMPLEADO que adjunta una foto When envía la incidencia Then la foto queda almacenada y es recuperable desde el detalle de esa incidencia; Given un EMPLEADO que no adjunta foto When envía sala, categoría y descripción Then el alta se completa sin error; Given un archivo de 8 MB When intenta enviarlo Then se rechaza el adjunto y no se almacena ningún binario. Seguridad: sube el EMPLEADO reportante durante su propio alta; la descarga posterior hereda el alcance del detalle y ya está cubierta por REQ-027; ningún acceso anónimo al binario. Dependencias: INC-01, REQ-027. Integración: almacenamiento propio del backend. Prioridad: Must.
**Reglas de negocio:**
1. Una incidencia tiene como máximo una foto adjunta
2. Todo adjunto pertenece exactamente a una incidencia
3. Solo son admisibles adjuntos de tipo `image/jpeg` o `image/png`, con coincidencia entre extensión y mime-type real
4. Un adjunto de más de 5 MB no llega a almacenarse
5. Una incidencia sin foto es válida y completa
6. El binario de un adjunto no es accesible de forma anónima ni por una ruta pública adivinable
7. Un adjunto solicitado fuera del alcance de datos del solicitante es indistinguible de uno inexistente
8. El adjunto persiste mientras persista su incidencia y no admite borrado físico
9. Un fallo al almacenar la foto no invalida la incidencia ya creada
**Criterios de aceptación:**
1. AC-INC-05: Dado un empleado que adjunta una foto JPG o PNG de hasta 5 MB durante el alta, cuando envía el formulario, entonces la foto queda almacenada con clave opaca, vinculada a esa incidencia y recuperable desde su detalle por identificador con control de acceso, sin ruta pública adivinable.
2. AC-INC-06: Dado un archivo que supera los 5 MB o cuyo mime-type real no es `image/jpeg` ni `image/png` (aunque la extensión lo aparente), cuando el empleado intenta adjuntarlo, entonces la API responde `413` o `415` respectivamente, no se almacena ningún binario y el mensaje de error se muestra en español.
3. AC-INC-07: Dado un empleado que no adjunta foto, cuando envía sala, categoría y descripción, entonces el alta se completa sin error ni advertencia; y dado un fallo del almacenamiento posterior a la persistencia de la incidencia, entonces la incidencia se conserva y se informa de que la foto no pudo guardarse.
**Validaciones:**
1. El adjunto es opcional: la ausencia de fichero no debe producir error de validación
2. El `mime_type` del fichero debe pertenecer a la whitelist `image/jpeg` / `image/png`
3. La extensión del fichero y el mime-type real detectado deben coincidir (no basta con la extensión)
4. El tamaño del fichero (`file_size_bytes`) no puede superar 5 MB
5. Solo se admite un único archivo adjunto por alta de incidencia
6. El `file_name` se sanea y no puede exceder 255 caracteres
7. El `incident_id` asociado al adjunto es obligatorio y debe corresponder a una incidencia existente
**Escenarios de error:**
1. Se adjunta más de un archivo en el alta cuando solo se admite una foto
2. La foto supera el tamaño máximo permitido
3. Formato de imagen no admitido; solo se aceptan JPG o PNG
4. El contenido real del archivo no corresponde a una imagen admitida
5. Se solicita un adjunto que no existe o queda fuera del alcance del solicitante
6. La incidencia se ha creado pero no ha sido posible guardar la foto
**Campos de datos:**
- `attachment_id` (integer, obligatorio) — Clave del adjunto; se sirve por identificador con control de acceso
- `incident_id` (integer, obligatorio) — Referencia obligatoria a la incidencia creada
- `file_name` (string, obligatorio) — Máx. 255 caracteres; saneado
- `mime_type` (enum, obligatorio) — Lista blanca: `image/jpeg`, `image/png`; mime real y extensión deben coincidir
- `file_size_bytes` (integer, obligatorio) — Máximo 5 MB [gap: el RFP no declara formatos ni tamaño máximo]
- `storage_key` (string, obligatorio) — No adivinable; nunca expuesta en ruta pública
- `uploaded_by_user_id` (integer, obligatorio) — Coincide con el reportante de la incidencia
- `uploaded_at` (datetime, obligatorio) — Sello temporal de servidor

### REQ-092 — Formulario de alta en una única pantalla con contexto precargado y envío en un solo paso (<60 s)
El formulario de alta se presenta en una única pantalla con contexto precargado y envío en un solo paso, de modo que el reporte se complete en menos de 60 segundos. Reglas: el alta no se trocea en asistente ni pasos intermedios —sala, categoría, descripción y foto conviven en una pantalla; los catálogos (CAT-01, CAT-02) se cargan al abrir la pantalla para que los selectores no esperen a red; se sugiere por defecto la última sala reportada por el propio usuario, siempre editable [inferido: mecanismo no declarado en el RFP, sí el objetivo de «menos de 1 minuto»]; el botón de envío se deshabilita mientras el POST está en vuelo para impedir altas duplicadas por doble pulsación. Flujo: apertura con foco en el selector de sala → relleno → envío único → pantalla de confirmación con reference_code y enlace al detalle. Rama: si los catálogos no cargan, se muestra «No se han podido cargar las salas, reintenta» y el envío queda bloqueado. Datos: reutiliza los de INC-01; en cliente, last_room_id (number, preferencia de usuario, opcional). Validaciones: las de cliente son espejo de las de servidor y nunca las sustituyen (REQ-013, REQ-032); los errores se muestran inline sin perder lo ya escrito. Errores: mensajes de validación en español (REQ-050); expiración de sesión durante el relleno → redirección al acceso conservando el aviso «Tu sesión ha caducado, vuelve a iniciar sesión» (REQ-058). Criterios de aceptación: Given un EMPLEADO que ya conoce la sala y la categoría When ejecuta el flujo completo de alta en una prueba cronometrada Then lo completa en menos de 60 segundos sin abandonar la pantalla ni consultar ayuda externa; Given una doble pulsación del botón de envío Then se crea exactamente una incidencia. Seguridad: pantalla accesible solo con sesión válida; la SPA adapta la navegación al rol vigente (REQ-010) pero la decisión de autorización es del backend (REQ-013). Dependencias: INC-01, CAT-01, CAT-02. Integración: SPA Angular, componente interno. Prioridad: Must.
**Reglas de negocio:**
1. El alta de incidencia se completa en una única pantalla: no existen pasos intermedios ni asistente
2. Un envío del formulario de alta origina exactamente una incidencia, aunque el botón se pulse más de una vez
3. Mientras los catálogos de salas y categorías no estén cargados, el envío del alta no es posible
4. La sala sugerida por defecto es la última reportada por el propio usuario y es siempre editable
5. Toda validación ejecutada en cliente tiene su equivalente vinculante en servidor
6. Un error de validación conserva los datos ya introducidos en el formulario
7. Un empleado que conoce la sala y la categoría completa el alta en menos de 60 segundos sin abandonar la pantalla
8. Todo mensaje de validación y error del alta se presenta en español
**Criterios de aceptación:**
1. AC-INC-02: Dado un formulario de alta al que le falta la sala, la categoría o la descripción (o cuya descripción solo contiene espacios o queda fuera del rango 10–500 caracteres), cuando el empleado intenta enviarlo, entonces la API responde `400` indicando qué campo obligatorio falta, no se crea ninguna incidencia y el formulario conserva los datos ya introducidos.
2. AC-INC-03: Dado un cliente sin sesión válida o con sesión caducada, cuando invoca el endpoint de alta de incidencia, entonces la API responde `401`, no se crea ninguna incidencia y la SPA redirige al acceso conservando el aviso de sesión caducada.
3. AC-INC-08: Dado un empleado que ya conoce la sala y la categoría a reportar, cuando ejecuta el flujo completo de alta en una prueba cronometrada sobre una única pantalla con catálogos precargados, entonces lo completa en menos de 60 segundos sin navegar a otra pantalla ni consultar ayuda externa.
4. AC-INC-09: Dado el botón de envío del formulario de alta, cuando el usuario lo pulsa dos veces seguidas antes de recibir respuesta, entonces se crea exactamente una incidencia y el botón permanece deshabilitado mientras el POST está en vuelo.
5. AC-CAT-05: Dado un fallo en la carga de los catálogos de salas o categorías al abrir el formulario, cuando el empleado intenta enviar el alta, entonces el envío queda bloqueado y se muestra «No se han podido cargar las salas, reintenta» en español, sin crear ninguna incidencia parcial.
**Validaciones:**
1. El formulario valida en cliente los mismos campos obligatorios y formatos que el servidor (validación espejo, que nunca sustituye a la de servidor)
2. El envío queda bloqueado si los catálogos de salas o categorías no se han cargado correctamente
3. El `last_room_id` sugerido por defecto es opcional y editable: debe validarse como cualquier `room_id` antes de enviarse
**Escenarios de error:**
1. La sesión ha caducado mientras se rellenaba el formulario de alta
2. Se recibe un segundo envío del mismo formulario ya registrado
3. No se han podido cargar los catálogos necesarios para completar el formulario
**Campos de datos:**
- `last_room_id` (integer, opcional) — Preferencia de cliente; siempre editable [inferido: mecanismo no declarado en el RFP]

### REQ-158 — Listado de incidencias propias reportadas por el empleado con su estado actual
El empleado autenticado consulta el listado de las incidencias que él mismo ha reportado, con su estado actual. Reglas: devuelve todas y solo las incidencias cuyo reported_by_user_id coincide con el usuario de la sesión, sin excepción por antigüedad o estado; incluye las cerradas dentro de la ventana de retención de 2 años (dep. REQ-147); el alcance se resuelve en la consulta a BD y nunca por filtrado en la SPA (dep. REQ-024, REQ-029); si no hay incidencias, lista vacía con HTTP 200 y mensaje informativo, nunca error; el estado mostrado es siempre el vigente en BD (sin caché de negocio). Flujo: EMPLEADO entra en «Mis incidencias» desde la navegación (dep. REQ-010) → el backend resuelve identidad y rol de la sesión (dep. REQ-059, REQ-018) → consulta paginada acotada a las propias → render de tabla → al seleccionar fila navega al detalle (SEG-03); sin resultados → estado vacío informativo (dep. REQ-109). Datos por fila: incident_id (number, PK, obligatorio), room_name (string, obligatorio, cat_salas, conservando la denominación histórica vigente en el alta — dep. REQ-150), office_name (string, obligatorio, cat_oficinas), category_name (string, obligatorio, cat_categorias_incidencia), created_at (timestamp, obligatorio), status_code (string, obligatorio, cat_estados_incidencia: abierta | en curso | resuelta | cerrada), assigned_technician_name (string, opcional/nullable mientras no haya asignación), updated_at (timestamp, obligatorio, fecha del último cambio de estado). Catálogos: cat_salas, cat_oficinas, cat_categorias_incidencia, cat_estados_incidencia (provistos por REQ-093..REQ-099, REQ-117). Orden y paginación: orden por defecto created_at DESC; paginación con page (int ≥ 1) y page_size (int, defecto 20, máx 100), estable ante inserciones concurrentes (desempate por incident_id DESC) [inferido]. Validaciones: page y page_size enteros dentro de rango; cualquier parámetro de identidad enviado por el cliente se ignora (dep. REQ-064). Errores: sin sesión válida → HTTP 401 + redirección a la pantalla de acceso, mensaje «Tu sesión ha caducado. Vuelve a iniciar sesión» (dep. REQ-058); paginación inválida → HTTP 400 «Parámetros de consulta no válidos»; fallo de BD → HTTP 500 «No se ha podido recuperar tu listado de incidencias. Inténtalo de nuevo» sin detalle técnico. Seguridad: rol EMPLEADO sobre su propio ámbito de datos, alcance «solo las propias» (dep. REQ-014, REQ-029); el listado completo con filtros del TECNICO_DE_MANTENIMIENTO es REQ-025/REQ-105; no requiere doble factor (REQ-049). Eventos de dominio: ninguno (solo lectura). Criterios de aceptación: Given un EMPLEADO con 3 incidencias propias y otras 10 de terceros, when abre «Mis incidencias», then la respuesta contiene exactamente esas 3 y ninguna ajena. Given un EMPLEADO sin incidencias, when abre la vista, then ve listado vacío con mensaje informativo y ningún error. Given una incidencia propia que un técnico acaba de pasar a «en curso», when recarga, then la fila muestra status_code = en curso y el updated_at de esa transición. Given una incidencia propia cerrada hace 6 meses, when abre el listado, then sigue apareciendo. Dependencias: REQ-024, REQ-029, REQ-010, REQ-059, REQ-147, REQ-150, REQ-109. Prioridad: Must [inferido].
**Reglas de negocio:**
1. El listado «Mis incidencias» de un empleado contiene todas y solo las incidencias cuyo reportante es el usuario de la sesión, sin excepción por antigüedad ni por estado
2. Una incidencia en estado `cerrada` sigue siendo visible en el listado de su reportante mientras se encuentre dentro de la ventana de retención de 2 años
3. El alcance de propiedad del listado queda determinado por la consulta a base de datos; ningún resultado ajeno llega al cliente aunque este no lo muestre
4. Un empleado sin incidencias reportadas tiene un listado vacío, y un listado vacío no es una condición de error
5. El estado mostrado para cada incidencia es el vigente en base de datos en el instante de la consulta; no existe estado de negocio cacheado
6. La identidad del reportante proviene exclusivamente de la sesión: ningún identificador de usuario recibido del cliente altera el conjunto de resultados
7. El tamaño de página del listado es como máximo 100 y su valor por defecto es 20; el número de página es un entero mayor o igual que 1
8. El orden del listado es determinista: `created_at` descendente con desempate por `incident_id` descendente, de modo que dos páginas consecutivas nunca repiten ni omiten una incidencia ante inserciones concurrentes
**Criterios de aceptación:**
1. AC-SEG-01: **Dado** un empleado autenticado con 3 incidencias propias en un sistema que contiene además 10 incidencias reportadas por terceros, **cuando** abre la vista «Mis incidencias», **entonces** el listado devuelve **exactamente esas 3 y ninguna ajena**, con sala, oficina, categoría, fecha de creación, estado vigente, técnico asignado (o vacío) y fecha del último cambio, y el acotado se resuelve en la consulta a BD (verificable porque la manipulación de parámetros de identidad no altera el resultado).
2. AC-SEG-02: **Dado** un empleado sin ninguna incidencia reportada y, en otro escenario, un empleado con una incidencia propia `cerrada` hace 6 meses, **cuando** cada uno abre «Mis incidencias», **entonces** el primero recibe HTTP 200 con lista vacía y mensaje informativo (nunca un error) y el segundo sigue viendo su incidencia cerrada dentro de la ventana de retención de 2 años.
3. AC-SEG-05: **Dado** un empleado y un `incident_id` correspondiente a una incidencia reportada por otro usuario, y en otro escenario un `incident_id` inexistente, **cuando** solicita el detalle o el adjunto de cualquiera de ellos, **entonces** recibe en **ambos casos la misma respuesta de denegación uniforme**, sin diferencia observable en código, cuerpo, cabeceras ni tiempo de respuesta que permita inferir la existencia del recurso, y sin exponer dato alguno de la incidencia.
**Validaciones:**
1. `page` debe ser un número entero mayor o igual que 1
2. `page_size` debe ser un número entero dentro del rango permitido (valor por defecto 20, máximo 100)
3. Cualquier parámetro de identidad de usuario (p. ej. `reported_by_user_id`) recibido del cliente se ignora: la identidad se toma siempre de la sesión
4. Si los parámetros de paginación no son válidos, la consulta no se ejecuta y se responde HTTP 400 «Parámetros de consulta no válidos»
**Escenarios de error:**
1. Parámetros de paginación ausentes, no numéricos o fuera del rango permitido
2. La sesión del usuario no es válida o ha caducado y debe iniciar sesión de nuevo
3. El listado de incidencias propias no se ha podido recuperar en este momento; se invita a reintentar
**Campos de datos:**
- `incident_id` (integer, obligatorio) — Clave primaria de la incidencia
- `room_name` (string, obligatorio) — Valor de `cat_salas`; se conserva la denominación histórica vigente en el alta
- `office_name` (string, obligatorio) — Valor de `cat_oficinas`
- `category_name` (string, obligatorio) — Valor de `cat_categorias_incidencia`
- `created_at` (datetime, obligatorio) — Orden por defecto del listado: `created_at` DESC
- `status_code` (enum, obligatorio) — `abierta` | `en curso` | `resuelta` | `cerrada` (`cat_estados_incidencia`)
- `assigned_technician_name` (string, opcional) — Nullable mientras no exista asignación
- `updated_at` (datetime, obligatorio) — Fecha del último cambio de estado de la incidencia
- `page` (integer, opcional) — Entero ≥ 1; fuera de rango → HTTP 400
- `page_size` (integer, opcional) — Entero; defecto 20, máximo 100

### REQ-159 — Filtrado, búsqueda y ordenación dentro del listado de incidencias propias
El empleado filtra, busca y ordena dentro del listado de sus propias incidencias para localizar una concreta. Reglas: todo filtro se aplica sobre el alcance de propiedad y nunca lo amplía, jamás puede devolver una incidencia de otro reportante (dep. REQ-024); los filtros se combinan con AND; los selectores de sala, oficina y categoría se alimentan del catálogo incluyendo valores desactivados con uso histórico en incidencias del propio empleado (dep. REQ-103, REQ-096); el conjunto de filtros es reproducible en la URL y se restaura al volver desde el detalle (dep. REQ-109); un filtrado sin resultados devuelve lista vacía con mensaje informativo y acción «limpiar filtros», nunca error. Flujo: EMPLEADO en «Mis incidencias» → selecciona filtros y/o escribe texto de búsqueda → la consulta se re-ejecuta acotada a sus incidencias → resultado paginado → «limpiar filtros» restablece el listado completo propio. Datos de entrada: status_code (string múltiple, opcional, cat_estados_incidencia), category_id (number múltiple, opcional, cat_categorias_incidencia), room_id (number múltiple, opcional, cat_salas), office_id (number, opcional, cat_oficinas), created_from / created_to (date, opcionales, created_from ≤ created_to), search_text (string, opcional, 2–100 caracteres, búsqueda parcial e insensible a mayúsculas/acentos sobre description e incident_id), sort_by (enum: created_at | updated_at | status_code, defecto created_at), sort_dir (enum asc | desc, defecto desc). Catálogos: cat_estados_incidencia, cat_categorias_incidencia, cat_salas, cat_oficinas. Validaciones: valores de catálogo existentes → HTTP 400 «Filtro no válido» sin ejecutar consulta; rango de fechas coherente → 400 «La fecha de inicio no puede ser posterior a la de fin»; search_text con longitud mínima 2 → 400 «Introduce al menos 2 caracteres para buscar». Errores: sin sesión → 401 y redirección al acceso (dep. REQ-058); intento de forzar por parámetro un reportante distinto → se ignora el parámetro y se responde con el ámbito propio, dejando traza (dep. REQ-064); fallo de BD → 500 con mensaje genérico. Seguridad: rol EMPLEADO, alcance «solo las propias»; los filtros por técnico asignado y el resto de criterios de la bandeja completa quedan reservados al TECNICO_DE_MANTENIMIENTO (REQ-107, REQ-108, REQ-110) y no se exponen. Eventos de dominio: ninguno (solo lectura). Criterios de aceptación: Given un EMPLEADO con incidencias en varios estados, when filtra por status_code = abierta, then solo ve sus incidencias abiertas. Given un filtro por categoría desactivada con uso histórico propio, when lo aplica, then sus incidencias antiguas de esa categoría siguen apareciendo. Given una combinación de filtros sin coincidencias, when se ejecuta, then ve mensaje informativo y opción de limpiar filtros, sin error. Given un empleado que aplica filtros y entra en el detalle, when vuelve atrás, then los filtros y la página siguen aplicados. Given una petición manipulada con otro reported_by_user_id, when se ejecuta, then la respuesta contiene únicamente incidencias propias. Dependencias: SEG-01, REQ-024, REQ-103, REQ-109. [gap: el RFP solo enumera los criterios de filtrado del listado completo del equipo de mantenimiento («por sala, categoría y estado») y no indica qué filtros debe ofrecer el listado propio del empleado]. Prioridad: Should [inferido].
**Reglas de negocio:**
1. Ningún filtro amplía el alcance de propiedad: cualquier resultado filtrado pertenece siempre al reportante de la sesión
2. Los filtros aplicados simultáneamente se combinan con conjunción lógica (AND)
3. Un valor de catálogo desactivado con uso histórico en incidencias del propio empleado sigue siendo seleccionable como filtro
4. El conjunto de filtros, el criterio de orden y la página activa son reproducibles desde la URL y se conservan al regresar desde el detalle
5. Un filtrado sin coincidencias produce una lista vacía con opción de limpiar filtros, nunca un error
6. `created_from` es anterior o igual a `created_to` en todo rango de fechas aceptado
7. El texto de búsqueda tiene entre 2 y 100 caracteres y es insensible a mayúsculas y acentos
8. Los criterios de filtrado propios de la bandeja completa, como el técnico asignado, no están disponibles en el listado del empleado reportante
**Criterios de aceptación:**
1. AC-SEG-03: **Dado** un empleado con incidencias propias en varios estados y categorías, **cuando** aplica filtros por estado, categoría, sala, oficina o rango de fechas, busca por texto y ordena, **entonces** los resultados son siempre un subconjunto de sus propias incidencias (el filtrado nunca amplía el alcance), las categorías desactivadas con uso histórico propio siguen siendo seleccionables, un filtrado sin coincidencias devuelve mensaje informativo con acción «limpiar filtros» sin error, y al volver desde el detalle se restauran filtros y página.
2. AC-SEG-05: **Dado** un empleado y un `incident_id` correspondiente a una incidencia reportada por otro usuario, y en otro escenario un `incident_id` inexistente, **cuando** solicita el detalle o el adjunto de cualquiera de ellos, **entonces** recibe en **ambos casos la misma respuesta de denegación uniforme**, sin diferencia observable en código, cuerpo, cabeceras ni tiempo de respuesta que permita inferir la existencia del recurso, y sin exponer dato alguno de la incidencia.
**Validaciones:**
1. Los valores de `status_code` deben existir en el catálogo `cat_estados_incidencia`; en caso contrario HTTP 400 «Filtro no válido» sin ejecutar la consulta
2. Los valores de `category_id` deben ser numéricos y existir en `cat_categorias_incidencia`
3. Los valores de `room_id` deben ser numéricos y existir en `cat_salas`
4. El valor de `office_id` debe ser numérico y existir en `cat_oficinas`
5. `created_from` y `created_to` deben tener formato de fecha válido y cumplir `created_from` ≤ `created_to`; si no, HTTP 400 «La fecha de inicio no puede ser posterior a la de fin»
6. `search_text` debe tener entre 2 y 100 caracteres; con menos de 2 se responde HTTP 400 «Introduce al menos 2 caracteres para buscar»
7. `sort_by` solo admite los valores enumerados `created_at` | `updated_at` | `status_code` (defecto `created_at`)
8. `sort_dir` solo admite los valores enumerados `asc` | `desc` (defecto `desc`)
9. Un parámetro de reportante distinto enviado por el cliente se descarta en la entrada y no altera el ámbito de la consulta
**Escenarios de error:**
1. Valor de filtro de sala, oficina, categoría o estado no reconocido dentro del catálogo vigente
2. Rango de fechas incoherente: la fecha de inicio es posterior a la fecha de fin
3. Texto de búsqueda con menos de 2 caracteres o por encima del máximo admitido
4. Criterio o sentido de ordenación no admitido
5. La sesión del usuario no es válida o ha caducado y debe iniciar sesión de nuevo
6. El resultado filtrado no se ha podido recuperar en este momento; se invita a reintentar
**Campos de datos:**
- `status_code` (enum, opcional) — Valores de `cat_estados_incidencia`; valor inexistente → HTTP 400
- `category_id` (integer, opcional) — Debe existir en `cat_categorias_incidencia`; admite valores desactivados con uso histórico propio
- `room_id` (integer, opcional) — Debe existir en `cat_salas`; admite valores desactivados con uso histórico propio
- `office_id` (integer, opcional) — Debe existir en `cat_oficinas`
- `created_from` (date, opcional) — `created_from` ≤ `created_to`
- `created_to` (date, opcional) — `created_to` ≥ `created_from`
- `search_text` (string, opcional) — Longitud 2–100; insensible a mayúsculas y acentos
- `sort_by` (enum, opcional) — `created_at` | `updated_at` | `status_code`; defecto `created_at`
- `sort_dir` (enum, opcional) — `asc` | `desc`; defecto `desc`

### REQ-160 — Detalle de incidencia propia con estado, técnico asignado y seguimiento completo
El empleado reportante accede al detalle de una incidencia propia con su estado actual, el técnico asignado y el seguimiento completo. Reglas: el detalle solo es accesible si el reported_by_user_id coincide con el usuario de la sesión; en caso contrario, denegación uniforme que no revela la existencia ni los datos del recurso (dep. REQ-023, REQ-031); el detalle es de solo lectura para el EMPLEADO, sin acciones de ciclo de vida, asignación ni reclasificación (dep. REQ-022, REQ-030); muestra el estado vigente y, si está cerrada, el comentario de resolución íntegro con autor y fecha, reutilizando REQ-115; la línea temporal del historial de cambios de estado se embebe por referencia a REQ-124/REQ-127, sin reimplementarla, con su mismo alcance de datos (dep. REQ-026); la foto adjunta, si existe, se muestra y descarga vía el recurso protegido de REQ-027/REQ-091 con el mismo control de alcance. Flujo: EMPLEADO selecciona una fila de SEG-01/SEG-02 (o navega por incident_id) → el backend comprueba propiedad → devuelve ficha + historial + adjunto → puede volver al listado conservando filtros (SEG-02); incidencia inexistente o ajena → denegación uniforme. Datos mostrados: incident_id (number), room_name + office_name (string, denominación histórica — REQ-150), category_name (string), description (string, íntegra), photo_id (opcional/nullable, con enlace de descarga protegido), status_code (string, cat_estados_incidencia), created_at (timestamp), updated_at (timestamp), assigned_technician_name (string, nullable; vacío mientras no haya asignación), resolution_comment (string, nullable, solo si status_code = cerrada), closed_at (timestamp, nullable), historial: lista de {from_status, to_status, actor_name, changed_at, comment} (dep. REQ-124, REQ-127). Catálogos: cat_estados_incidencia, cat_categorias_incidencia, cat_salas, cat_oficinas. Validaciones: incident_id numérico y existente → si no, denegación uniforme; no se aceptan parámetros de identidad del cliente (dep. REQ-064). Errores: incidencia de otro reportante o inexistente → misma respuesta HTTP 404 «No se ha encontrado la incidencia» (o 403 uniforme según política de REQ-078), sin efectos laterales ni diferencia observable; sin sesión → 401 + redirección (dep. REQ-058); adjunto no recuperable → la ficha se muestra igualmente con aviso «La imagen adjunta no está disponible en este momento» (dep. REQ-149). Seguridad: rol EMPLEADO con alcance «solo las propias» (dep. REQ-014, REQ-026); el TECNICO_DE_MANTENIMIENTO accede al detalle de cualquier incidencia por REQ-026/REQ-030; el control es siempre vinculante en la API REST, nunca en la SPA (dep. REQ-013, REQ-032); acceso a datos personales limitado a nombre y correo corporativo (REQ-049); no requiere doble factor. Eventos de dominio: ninguno (solo lectura). Criterios de aceptación: Given un EMPLEADO y una incidencia propia «en curso» con técnico asignado, when abre el detalle, then ve descripción, foto si la hubiera, categoría, sala, estado actual y nombre del técnico asignado. Given una incidencia reportada por otro usuario, when solicita su detalle por incident_id, then recibe la denegación uniforme y ningún dato. Given una incidencia propia cerrada, when abre el detalle, then ve el comentario de resolución íntegro con autor y fecha de cierre. Given una incidencia propia con tres cambios de estado, when abre el detalle, then ve la línea temporal con estado origen/destino, autor y fecha de cada transición en orden cronológico. Given una incidencia propia sin técnico asignado, when abre el detalle, then el campo de técnico aparece vacío o como «sin asignar», sin error. Dependencias: SEG-01, REQ-023, REQ-026, REQ-027, REQ-091, REQ-115, REQ-124, REQ-127, REQ-149, REQ-150. [gap: el RFP no precisa qué dato del técnico asignado es visible para el reportante (nombre completo, alias o solo el hecho de la asignación)]. Prioridad: Must [inferido].
**Reglas de negocio:**
1. El detalle de una incidencia solo es accesible para el usuario cuyo identificador coincide con el `reported_by_user_id` de esa incidencia
2. Una incidencia inexistente y una incidencia ajena producen respuestas indistinguibles para el empleado, sin diferencia observable en código, cuerpo ni tiempo de respuesta
3. El detalle del reportante es de solo lectura: no existe ninguna acción de ciclo de vida, asignación ni reclasificación disponible para el rol EMPLEADO
4. El comentario de resolución está presente en el detalle si y solo si la incidencia está en estado `cerrada`
5. El historial mostrado al reportante tiene el mismo alcance de datos que el historial general de la incidencia y sus entradas están ordenadas cronológicamente
6. El técnico asignado es un dato ausente mientras la incidencia no tenga asignación, y su ausencia no es una condición de error
7. El adjunto fotográfico de una incidencia está sujeto al mismo alcance de propiedad que su detalle: solo su reportante y el técnico de mantenimiento pueden descargarlo
8. Un adjunto no recuperable no impide la visualización del resto de la ficha
9. La sala y la oficina mostradas en el detalle conservan la denominación vigente en el momento del alta de la incidencia, no la denominación actual del catálogo
10. El control de alcance del detalle es vinculante en la API REST; la ocultación en la SPA no constituye por sí sola una restricción de acceso
**Criterios de aceptación:**
1. AC-SEG-04: **Dado** un empleado y una incidencia propia en estado `en curso` con técnico asignado, **cuando** abre su detalle, **entonces** ve descripción íntegra, sala y oficina con su denominación histórica, categoría, foto adjunta descargable si existe, estado vigente y nombre del técnico asignado; y **dado** que la incidencia está `cerrada`, **cuando** abre el detalle, **entonces** ve además el comentario de resolución íntegro con autor y fecha de cierre, sin que se le ofrezca ninguna acción de ciclo de vida o asignación.
2. AC-SEG-05: **Dado** un empleado y un `incident_id` correspondiente a una incidencia reportada por otro usuario, y en otro escenario un `incident_id` inexistente, **cuando** solicita el detalle o el adjunto de cualquiera de ellos, **entonces** recibe en **ambos casos la misma respuesta de denegación uniforme**, sin diferencia observable en código, cuerpo, cabeceras ni tiempo de respuesta que permita inferir la existencia del recurso, y sin exponer dato alguno de la incidencia.
3. AC-SEG-06: **Dado** una incidencia propia con tres cambios de estado registrados, **cuando** el empleado reportante abre su detalle, **entonces** obtiene la línea temporal embebida con estado origen, estado destino, actor y fecha de cada transición en orden cronológico, con el mismo alcance de datos que el historial canónico, y si el adjunto no es recuperable la ficha se muestra igualmente con el aviso «La imagen adjunta no está disponible en este momento».
**Validaciones:**
1. `incident_id` debe ser numérico y corresponder a una incidencia existente; en caso contrario se responde con la denegación uniforme
2. No se aceptan parámetros de identidad de usuario enviados por el cliente: se ignoran y la identidad se resuelve desde la sesión
**Escenarios de error:**
1. La sesión del usuario no es válida o ha caducado y debe iniciar sesión de nuevo
2. No se ha encontrado la incidencia solicitada (respuesta uniforme tanto si no existe como si no pertenece al usuario, sin revelar dato alguno)
3. Identificador de incidencia con formato no admitido; se responde con la misma denegación uniforme sin revelar existencia
4. La imagen adjunta no está disponible en este momento; la ficha se devuelve completa salvo el adjunto, con aviso al usuario
5. El detalle de la incidencia no se ha podido recuperar en este momento; se invita a reintentar
**Campos de datos:**
- `incident_id` (integer, obligatorio) — Numérico y existente; si no, denegación uniforme
- `room_name` (string, obligatorio) — Valor de `cat_salas`
- `office_name` (string, obligatorio) — Valor de `cat_oficinas`
- `category_name` (string, obligatorio) — Valor de `cat_categorias_incidencia`
- `description` (string, obligatorio) — Se muestra completa, sin truncar
- `photo_id` (string, opcional) — Nullable; descarga vía recurso protegido con el mismo alcance que el detalle
- `status_code` (enum, obligatorio) — `abierta` | `en curso` | `resuelta` | `cerrada` (`cat_estados_incidencia`)
- `created_at` (datetime, obligatorio) — Fecha y hora de alta de la incidencia
- `updated_at` (datetime, obligatorio) — Fecha del último cambio de estado
- `assigned_technician_name` (string, opcional) — Nullable; se muestra vacío o «sin asignar» si no hay asignación
- `resolution_comment` (string, opcional) — Solo presente si `status_code = cerrada`
- `closed_at` (datetime, opcional) — Nullable; informado solo si la incidencia está cerrada
- `historial_from_status` (enum, opcional) — Valores de `cat_estados_incidencia`; vacío en la transición inicial
- `historial_to_status` (enum, obligatorio) — Valores de `cat_estados_incidencia`
- `historial_actor_name` (string, obligatorio) — Dato personal limitado a nombre y correo corporativo
- `historial_changed_at` (datetime, obligatorio) — Listado en orden cronológico
- `historial_comment` (string, opcional) — Nullable

## Entorno de prueba de esta sesión

Antes de arrancar tu sesión, la plataforma levanta los servicios de abajo como contenedores efímeros y deja sus datos de conexión en `.mind/TSK-034/env.sh` (y en `env.json`). Contrato de uso:

- **Haz `source .mind/TSK-034/env.sh` antes de cada build/test** que necesite el entorno; si el fichero no existe, el entorno NO se pudo levantar (ver el final de esta sección).
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
Comprueba `.mind/TSK-034/env.json`: si su `status` es `unavailable` o `degraded`, la plataforma no pudo darte (todo) el entorno. En ese caso ESCRIBE igualmente los tests de integración y déjalos en el entregable, y repórtalo como health check **Warning** con `check: entorno-de-prueba` — NO como Blocker: no es un defecto de tu tarea, y la verificación queda diferida al CI. Reserva el Blocker para cuando el entorno SÍ estaba y los tests fallan por el código o por el brief.

## REWORK — feedback del revisor (atiéndelo TODO)
- (mind-platform) MIND (plataforma): este PR tiene **conflictos de merge** con `dev` (`mergeable_state=dirty`). Suele pasar al mergear otro PR en paralelo que tocó ficheros compartidos (routers, `__init__`, deps…). Haz rebase o merge de `dev` en tu rama, resuelve los conflictos sin cambiar el alcance de la tarea, deja build/tests verdes y vuelve a empujar. Preferible mergear PRs en orden del DAG (uno a uno) para reducir este caso.

## Estado del build al cerrar el intento anterior

El intento anterior dejó el módulo COMPILANDO, pero el artefacto entregado **no arrancaría** (o incumple el contrato que declara). El compilador está en VERDE: **no busques ahí y no pierdas el intento intentando reproducir un fallo de compilación que no existe**. Lo que falla es exactamente lo que dice el informe de abajo, y es lo PRIMERO que tienes que arreglar, antes de añadir nada nuevo.

- Arregla lo que nombra el informe, en el sitio que nombra. No hace falta reproducirlo con el compilador: ya compila.
- Si el defecto viene de la rama BASE y no de tu trabajo, arréglalo igual y decláralo como `health_check` de severidad Warning indicando el fichero y por qué lo tocaste.
- **No borres ni desactives tests para que el informe calle.** Si crees que el informe se equivoca, entrégalo con un `health_check` Blocker explicando por qué; quitar cobertura para tapar una señal es peor que la señal.

### Lo que reportó la verificación (literal)

```
stub-delivery: hay features marcadas como entregadas cuyo cuerpo no hace nada. `TODO`, `not implemented` y un retorno vacío como cuerpo único son bloqueantes de entrega, no notas.
- 1 de 18 rutas registradas que ninguna plantilla enlaza: `/incidencias/mias`. Una pantalla a la que sólo se llega escribiendo la URL no está entregada: móntala en el menú del shell con la `sección de menú` que declara su spec de UI
- servicio(s) de producción que FABRICAN su respuesta en vez de pedirla: `apps/app/src/app/features/my-incidents/pages/my-incidents-list/my-incidents-list.page.ts::loadFilterCatalogs` (Observable/Promise resuelto con un literal), `apps/app/src/app/features/report-incident/report-incident.service.ts::readPhoto` (Observable/Promise resuelto con un literal). Un doble en el árbol de producto es un bloqueante: la pantalla se ve llena y no hay nada detrás — los dobles solo valen en tests
```