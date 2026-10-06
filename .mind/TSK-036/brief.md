# TSK-036 · Cierre, Reclasificación y Consulta Histórica de Incidencias (Técnico)

- Componente dueño: `ARC-011`
- Arquetipo del repo: `frontend-application-spa` — respeta sus convenciones; NUNCA te salgas de él (ver «Contrato de salida del arquetipo»).
- Zonas de código de ESTA tarea (trabajo principal): `apps/app/src/app/features/incident-tray/`, `apps/app/src/app/app.routes.ts`. Fuera de ellas NO amplíes alcance de negocio — **EXCEPTO** el composition root y el manifiesto del host necesarios para montar lo entregado (sección Composition root).

## Definition of Done
Diálogo de cierre de incidencia con comentario obligatorio consume EP-035. Diálogo de reclasificación consume EP-036. Panel de consulta de cierres anteriores consume EP-037. La línea temporal del detalle muestra todos los eventos del historial. Rutas registradas; `start`/`build` verdes. Extiende la zona de TSK-04.

## Oráculos de verificación (dod-oracles) — OBLIGATORIO

El DoD se evalúa por **comportamiento**, no porque exista un fichero o un string «implementado». Lo siguiente es **Blocker** si lo usas como entrega de producto (los dobles solo valen en tests):

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

## Pruebas que debes implementar (TEST_SUITES)
La fase TEST_SUITES ya definió estas pruebas para los requisitos/historias/casos de uso que esta tarea cubre. Impleméntalas como código de test EJECUTABLE con el framework real del arquetipo (ver «Política de imports en tests» y «Ejecución de la suite» arriba) — no basta con que la lógica pase, tiene que existir el test que lo demuestre.

### E2E-007 — Dado un técnico, cuando cierra una incidencia resuelta con comentario, entonces el estado final es 'Cerrada'
**Capa:** full-stack · **Prioridad:** critical · **Categoría:** happy_path
**Componente objetivo:** Diálogo de cierre de incidencia
Verifica el paso final del ciclo de vida de una incidencia: el cierre desde el estado 'resuelta' con la adición de un comentario de resolución obligatorio.
**Resultado esperado:** La incidencia pasa al estado 'Cerrada' y el comentario, autor y fecha del cierre son visibles en el detalle.
**Precondiciones:**
- Usuario con rol 'TECNICO_MANTENIMIENTO' autenticado.
- Existe una incidencia en estado 'RESUELTA' asignada a dicho técnico.
**Datos de prueba:**
- Credenciales de un técnico.
- Una incidencia 'RESUELTA' asignada a él.
- Un texto para el comentario de resolución.
**Herramientas sugeridas:** Playwright
```gherkin
Feature: Ciclo de Vida de Incidencia
  Scenario: Un técnico cierra una incidencia resuelta
    Given un técnico autenticado viendo el detalle de una incidencia resuelta que tiene asignada
    When abre el diálogo de cierre, escribe un comentario de resolución y confirma
    Then la incidencia cambia su estado a 'Cerrada' y el comentario es visible
```

### E2E-008 — Dado un técnico, cuando intenta cerrar una incidencia sin comentario, entonces el sistema lo impide
**Capa:** frontend · **Prioridad:** high · **Categoría:** happy_path
**Componente objetivo:** Diálogo de cierre de incidencia
Verifica la validación del formulario de cierre, que exige un comentario de resolución no vacío.
**Resultado esperado:** El botón de confirmación está deshabilitado o, si se intenta enviar, se muestra un error de validación y la incidencia permanece 'RESUELTA'.
**Precondiciones:**
- Usuario con rol 'TECNICO_MANTENIMIENTO' autenticado.
- Existe una incidencia en estado 'RESUELTA' asignada a él.
**Datos de prueba:**
- Credenciales de un técnico.
- Una incidencia 'RESUELTA' asignada.
**Herramientas sugeridas:** Playwright
```gherkin
Feature: Ciclo de Vida de Incidencia
  Scenario: Intento de cierre de incidencia sin comentario
    Given un técnico autenticado en el diálogo de cierre de una incidencia resuelta
    When intenta confirmar sin escribir un comentario de resolución
    Then el sistema muestra un mensaje de error y la incidencia no se cierra
```

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
| `EP-035` | **POST** | `/incidents/{incidentId}/closure` | `IncidentClosureRequest` | `IncidentDetail` | 201 | N | `ROL-002` |
| | | _Cierra una incidencia resuelta aportando el comentario de resolución obligatorio_ | | | | | |
| `EP-036` | **PUT** | `/incidents/{incidentId}/classification` | `IncidentReclassificationRequest` | `IncidentDetail` | 200 | N | `ROL-002` |
| | | _Reclasifica la sala o la categoría de una incidencia no cerrada_ | | | | | |
| `EP-037` | **GET** | `/incidents/{incidentId}/similar-closures` | `—` | `SimilarClosurePage` | 200 | N | `ROL-002` |
| | | _Consulta los cierres anteriores de la misma sala y categoría con su resolución_ | | | | | |
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
| `EP-026` | **GET** | `/incidents` | `—` | `IncidentListPage` | 200 | N | `ROL-002` |
| | | _Consulta la bandeja completa de incidencias con filtros, búsqueda, orden y paginación_ | | | | | |
| `EP-027` | **GET** | `/my-incidents` | `—` | `IncidentListPage` | 200 | N | `ROL-001`, `ROL-002` |
| | | _Consulta el listado de las incidencias reportadas por el propio empleado_ | | | | | |
| `EP-028` | **GET** | `/incidents/{incidentId}` | `—` | `IncidentDetail` | 200 | N | `ROL-001`, `ROL-002` |
| | | _Consulta el detalle de una incidencia con su estado, responsable y transiciones disponibles_ | | | | | |
| `EP-029` | **GET** | `/incidents/{incidentId}/history` | `—` | `IncidentHistoryPage` | 200 | N | `ROL-001`, `ROL-002` |
| | | _Consulta el historial cronológico de cambios de una incidencia con autor y fecha_ | | | | | |
| `EP-030` | **GET** | `/incidents/{incidentId}/photo` | `—` | `IncidentPhotoContent` | 200 | N | `ROL-001`, `ROL-002` |
| | | _Descarga la foto adjunta de una incidencia previa verificación de integridad_ | | | | | |
| `EP-031` | **POST** | `/incidents/{incidentId}/assignment` | `SelfAssignmentRequest` | `IncidentAssignmentDetail` | 201 | N | `ROL-002` |
| | | _Permite a un técnico autoasignarse una incidencia sin responsable_ | | | | | |
| `EP-032` | **PUT** | `/incidents/{incidentId}/assignment` | `AssignmentChangeRequest` | `IncidentAssignmentDetail` | 200 | N | `ROL-002` |
| | | _Reasigna una incidencia no cerrada a otro técnico de mantenimiento activo_ | | | | | |
| `EP-033` | **DELETE** | `/incidents/{incidentId}/assignment` | `AssignmentReleaseRequest` | `IncidentAssignmentDetail` | 204 | N | `ROL-002` |
| | | _Libera la incidencia asignada indicando el motivo y la devuelve a tomable_ | | | | | |
| `EP-034` | **POST** | `/incidents/{incidentId}/transitions` | `StatusTransitionRequest` | `IncidentDetail` | 201 | N | `ROL-002` |
| | | _Ejecuta una transición de estado válida del ciclo de vida de la incidencia_ | | | | | |
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

> 6 pantalla(s) de esta tarea. TRANSCRIBE el detalle: no inventes pantallas, rutas, etiquetas ni navegación. Cuando una pantalla trae «Detalle de UI (B.7)», ESA es la fuente autoritativa — sus `label` son el texto a pintar y su `widget` el control a usar, ya decididos y aprobados. Los bloques de la fase FLOWS son contexto: sus textos son términos de dominio (glosario), NO etiquetas de UI. Respeta el design system del arquetipo.

### ARC-036 · Cierres anteriores en esta sala y categoría
El técnico consulta los cierres previos de la misma sala y categoría con su comentario de resolución
- **API**: esta pantalla no trae cableado pantalla→endpoint de T.5. NO lo interpretes como «no llama a la API»: elige los endpoints que necesita de la tabla del contrato congelado (sección api-contract), con su path y su verbo literales, y **repórtalo como health check `Warning` con `check: api-contract`** indicando cuáles has usado.
- **Detalle de UI (B.7) · `UIS-027`** — FUENTE AUTORITATIVA: los `label` son el texto a pintar y el `widget` el control a usar.
  - Propósito: Spec mínima B.7 (stub Playwright) para ARC-036: Cierres anteriores en esta sala y categoría.
  - Disposición: **formulario** (`form`) — respétala; no rediseñes la pantalla.
  - Navegación: sección de menú «incidents-tech» (orden 0).
- Flujo `FLOW-006` · pantalla `SCR-002`
  - **Rutas:** `/incidencias/{id}/cierres-similares`
  - **Componentes de UI:** Panel lateral de cierres anteriores en la misma sala y categoría; Tarjeta de cierre previo con comentario de resolución, autor y fecha de cierre; Acción de reutilizar el comentario de resolución; Control de carga de más cierres anteriores; Bloque de estado vacío sin cierres previos
  - **Datos que muestra:** Código de referencia de la incidencia cerrada previamente; Sala afectada; Categoría de la incidencia; Comentario de resolución del cierre previo; Técnico de mantenimiento que cerró la incidencia; Fecha de cierre
  - **Acciones del usuario:** Reutilizar un comentario de resolución anterior en el cierre actual; Abrir la incidencia cerrada de referencia; Avanzar a la siguiente página de cierres anteriores
  - **Navegación:**
    - Volver al detalle de la incidencia resuelta → «Detalle de la incidencia resuelta» [back]
    - Cerrar incidencia desde los cierres anteriores → «Cierre de la incidencia» si Si la incidencia está en estado resuelta [open_modal]

### ARC-037 · Cierre de la incidencia
El técnico cierra la incidencia resuelta aportando el comentario de resolución obligatorio
- **API**: esta pantalla no trae cableado pantalla→endpoint de T.5. NO lo interpretes como «no llama a la API»: elige los endpoints que necesita de la tabla del contrato congelado (sección api-contract), con su path y su verbo literales, y **repórtalo como health check `Warning` con `check: api-contract`** indicando cuáles has usado.
- **Detalle de UI (B.7) · `UIS-028`** — FUENTE AUTORITATIVA: los `label` son el texto a pintar y el `widget` el control a usar.
  - Propósito: Spec mínima B.7 (stub Playwright) para ARC-037: Cierre de la incidencia.
  - Disposición: **formulario** (`form`) — respétala; no rediseñes la pantalla.
  - Navegación: sección de menú «incidents-tech» (orden 0).
- Flujo `FLOW-006` · pantalla `SCR-003`
  - **Rutas:** `/incidencias/{id}/cerrar`
  - **Componentes de UI:** Diálogo modal de cierre de la incidencia; Resumen de la incidencia a cerrar; Campo obligatorio de comentario de resolución con contador y validación; Botón Confirmar cierre; Botón Cancelar
  - **Datos que muestra:** Código de referencia de la incidencia; Sala afectada; Oficina a la que pertenece la sala; Categoría de la incidencia; Descripción de la incidencia; Comentario de resolución
  - **Acciones del usuario:** Escribir el comentario de resolución; Confirmar el cierre de la incidencia; Cancelar el cierre
  - **Navegación:**
    - Confirmar el cierre de la incidencia → «Bloque de resolución de la incidencia» si Si el comentario de resolución está informado [submit]
    - Cancelar el cierre → «Detalle de la incidencia resuelta» [back]

### ARC-038 · Bloque de resolución de la incidencia
El usuario consulta en solo lectura el comentario de resolución íntegro con su autor y su fecha de cierre
- **API**: esta pantalla no trae cableado pantalla→endpoint de T.5. NO lo interpretes como «no llama a la API»: elige los endpoints que necesita de la tabla del contrato congelado (sección api-contract), con su path y su verbo literales, y **repórtalo como health check `Warning` con `check: api-contract`** indicando cuáles has usado.
- **Detalle de UI (B.7) · `UIS-029`** — FUENTE AUTORITATIVA: los `label` son el texto a pintar y el `widget` el control a usar.
  - Propósito: Spec mínima B.7 (stub Playwright) para ARC-038: Bloque de resolución de la incidencia.
  - Disposición: **formulario** (`form`) — respétala; no rediseñes la pantalla.
  - Navegación: sección de menú «incidents-tech» (orden 0).
- Flujo `FLOW-006` · pantalla `SCR-004`
  - **Rutas:** `/incidencias/{id}/resolucion`
  - **Componentes de UI:** Sección de solo lectura del bloque de resolución; Texto íntegro del comentario de resolución; Dato del técnico de mantenimiento que cerró la incidencia; Dato de la fecha de cierre
  - **Datos que muestra:** Comentario de resolución; Técnico de mantenimiento que cerró la incidencia; Fecha de cierre
  - **Acciones del usuario:** Desplegar el comentario de resolución íntegro; Copiar el comentario de resolución
  - **Navegación:**
    - Volver al detalle de la incidencia → «Detalle de la incidencia resuelta» [back]

### ARC-039 · Reclasificación de sala y categoría
El técnico corrige la sala o la categoría de una incidencia no cerrada eligiendo valores activos del catálogo
- **API**: esta pantalla no trae cableado pantalla→endpoint de T.5. NO lo interpretes como «no llama a la API»: elige los endpoints que necesita de la tabla del contrato congelado (sección api-contract), con su path y su verbo literales, y **repórtalo como health check `Warning` con `check: api-contract`** indicando cuáles has usado.
- **Detalle de UI (B.7) · `UIS-030`** — FUENTE AUTORITATIVA: los `label` son el texto a pintar y el `widget` el control a usar.
  - Propósito: Spec mínima B.7 (stub Playwright) para ARC-039: Reclasificación de sala y categoría.
  - Disposición: **listado** (`list`) — respétala; no rediseñes la pantalla.
  - Navegación: sección de menú «incidents-tech» (orden 0).
- Flujo `FLOW-007` · pantalla `SCR-002`
  - **Rutas:** `/incidencias/{id}/reclasificar`
  - **Componentes de UI:** Diálogo modal de reclasificación; Selector de sala del catálogo activo; Selector de categoría del catálogo activo; Campo de motivo opcional de la reclasificación; Resumen comparativo de valores anterior y nuevo; Botón Confirmar reclasificación; Botón Cancelar
  - **Datos que muestra:** Sala afectada actual; Categoría de la incidencia actual; Sala destino del catálogo de salas activas; Categoría destino del catálogo de categorías activas; Motivo de reclasificación
  - **Acciones del usuario:** Seleccionar la nueva sala del catálogo; Seleccionar la nueva categoría del catálogo; Escribir el motivo de la reclasificación; Confirmar la reclasificación; Cancelar la reclasificación
  - **Navegación:**
    - Confirmar la reclasificación → «Detalle de la incidencia» si Si la sala y la categoría seleccionadas están activas en el catálogo [submit]
    - Cancelar la reclasificación → «Detalle de la incidencia» [back]

### ARC-040 · Traza de reclasificaciones
El técnico revisa las reclasificaciones registradas con valor anterior, valor nuevo, autor y fecha
- **API**: esta pantalla no trae cableado pantalla→endpoint de T.5. NO lo interpretes como «no llama a la API»: elige los endpoints que necesita de la tabla del contrato congelado (sección api-contract), con su path y su verbo literales, y **repórtalo como health check `Warning` con `check: api-contract`** indicando cuáles has usado.
- **Detalle de UI (B.7) · `UIS-031`** — FUENTE AUTORITATIVA: los `label` son el texto a pintar y el `widget` el control a usar.
  - Propósito: Spec mínima B.7 (stub Playwright) para ARC-040: Traza de reclasificaciones.
  - Disposición: **detalle** (`detail`) — respétala; no rediseñes la pantalla.
  - Navegación: sección de menú «incidents-tech» (orden 0).
- Flujo `FLOW-007` · pantalla `SCR-003`
  - **Rutas:** `/incidencias/{id}/historial/reclasificaciones`
  - **Componentes de UI:** Sección del historial con la traza de reclasificaciones; Tabla de entradas con valor anterior y nuevo de sala y categoría; Dato de autor y fecha-hora por entrada; Bloque de estado vacío sin reclasificaciones
  - **Datos que muestra:** Sala anterior; Sala nueva; Categoría anterior; Categoría nueva; Autor de la reclasificación; Fecha y hora de la reclasificación
  - **Acciones del usuario:** Desplegar la traza de reclasificaciones; Volver al detalle de la incidencia
  - **Navegación:**
    - Volver al detalle de la incidencia → «Detalle de la incidencia» [back]

### ARC-056 · Historial consolidado de la incidencia
El usuario revisa todos los eventos registrados de la incidencia en orden cronológico con autor y fecha
- **API**: esta pantalla no trae cableado pantalla→endpoint de T.5. NO lo interpretes como «no llama a la API»: elige los endpoints que necesita de la tabla del contrato congelado (sección api-contract), con su path y su verbo literales, y **repórtalo como health check `Warning` con `check: api-contract`** indicando cuáles has usado.
- **Detalle de UI (B.7) · `UIS-032`** — FUENTE AUTORITATIVA: los `label` son el texto a pintar y el `widget` el control a usar.
  - Propósito: Spec mínima B.7 (stub Playwright) para ARC-056: Historial consolidado de la incidencia.
  - Disposición: **detalle** (`detail`) — respétala; no rediseñes la pantalla.
  - Navegación: sección de menú «incidents-tech» (orden 0).
- Flujo `FLOW-014` · pantalla `SCR-003`
  - **Rutas:** `/incidencias/cerradas/{id}/historial`
  - **Componentes de UI:** Lista cronológica de eventos de la incidencia; Filtro por tipo de evento; Entrada de evento con autor y fecha-hora; Acción de exportar o imprimir el historial; Bloque de estado vacío sin eventos para el filtro
  - **Datos que muestra:** Tipo de evento de la incidencia; Fecha y hora del evento; Autor del evento; Detalle del evento registrado; Comentario de resolución
  - **Acciones del usuario:** Filtrar el historial consolidado por tipo de evento; Volver al detalle de la incidencia cerrada
  - **Navegación:**
    - Volver al detalle de la incidencia cerrada → «Detalle de la incidencia cerrada» [back]

## Requisitos que materializa esta tarea

### REQ-101 — Reclasificación de sala o categoría por TECNICO_DE_MANTENIMIENTO con validación de catálogo y traza
La reclasificación aplica las mismas validaciones referenciales que el alta (CLAS-01) y solo es posible mientras la incidencia no esté en estado cerrada. Cada reclasificación genera un registro histórico inmutable con los valores anterior y nuevo (REQ-015). El EMPLEADO reportante no puede reclasificar. La reclasificación no altera el estado del ciclo de vida ni el autor original. Flujo: TECNICO_DE_MANTENIMIENTO abre el detalle de una incidencia, pulsa reclasificar, elige nueva sala y/o nueva categoría del catálogo, confirma, y se persiste el cambio y su traza. Datos: incident_classification_history con history_id (PK), incident_id (FK), previous_room_id, new_room_id, previous_category_id, new_category_id, changed_by (FK usuario), changed_at (timestamp), change_reason (varchar2(255), opcional). Validaciones: al menos uno de los dos valores debe cambiar; valores nuevos existentes y activos; incidencia no cerrada. Errores: 403 'No tiene permisos para realizar esta operación' a EMPLEADO (REQ-022, REQ-030); 409 'No se puede reclasificar una incidencia cerrada'; 422 con los mismos mensajes de catálogo de CLAS-01; 404 uniforme si la incidencia no es visible para el solicitante (REQ-031). Aceptación: un TECNICO_DE_MANTENIMIENTO que cambia la categoría de una incidencia abierta deja la incidencia con la nueva categoría y el historial registra valor anterior, nuevo, autor y fecha; un EMPLEADO que intenta reclasificar una incidencia propia recibe 403 y nada cambia. Seguridad: exclusivo de TECNICO_DE_MANTENIMIENTO sobre el conjunto completo de incidencias (REQ-029, REQ-030); autoría desde la sesión (REQ-064); sin doble factor. Dependencias: CLAS-01, CLAS-03, REQ-030, REQ-015. [inferido: el RFP no menciona explícitamente la corrección de una clasificación errónea; la épica sí contempla 'petición de alta o de actualización']. Prioridad: Should. auth_type: JWT. data_scope: all.
**Reglas de negocio:**
1. Solo el rol `TECNICO_DE_MANTENIMIENTO` puede reclasificar una incidencia; el empleado reportante no puede
2. Una incidencia en estado cerrada no admite reclasificación
3. Una reclasificación cambia al menos uno de los dos valores: sala o categoría
4. Cada reclasificación deja un registro histórico inmutable con el valor anterior, el nuevo, el autor y la fecha
5. Una reclasificación no modifica el estado del ciclo de vida ni el autor original de la incidencia
6. Los valores nuevos de una reclasificación pertenecen al catálogo y están activos
**Criterios de aceptación:**
1. AC-CLAS-02: **Dado** un `TECNICO_DE_MANTENIMIENTO` y una incidencia no cerrada, **cuando** reclasifica su sala y/o su categoría a valores activos del catálogo, **entonces** la incidencia queda con los nuevos valores y el historial registra valor anterior, valor nuevo, autor y fecha-hora; **dado** un `EMPLEADO`, **cuando** intenta reclasificar una incidencia propia, **entonces** recibe 403 y nada cambia; **dada** una incidencia `cerrada`, **cuando** se intenta reclasificar, **entonces** se rechaza con 409.
**Validaciones:**
1. La petición de reclasificación debe modificar al menos uno de los dos valores (sala o categoría); si ambos coinciden con los actuales, se rechaza
2. El nuevo `room_id` y/o el nuevo `category_id` deben existir en su catálogo y estar activos
3. La incidencia referenciada no puede estar en estado `cerrada` para admitir la petición de reclasificación
4. `change_reason` es opcional y, si se informa, no supera 255 caracteres
**Escenarios de error:**
1. El usuario no tiene permisos para reclasificar una incidencia
2. La incidencia indicada no existe o no está disponible para el solicitante
3. No se puede reclasificar una incidencia cerrada
4. Debe modificarse al menos la sala o la categoría
5. La categoría seleccionada no es válida
6. La sala seleccionada no existe o ya no está disponible
7. El motivo del cambio supera la longitud máxima permitida
**Campos de datos:**
- `history_id` (integer, obligatorio) — Clave primaria del historial de clasificación
- `incident_id` (integer, obligatorio) — Debe existir y no estar en estado cerrada
- `previous_room_id` (integer, opcional) — Se informa cuando cambia la sala
- `new_room_id` (integer, opcional) — Debe existir en catálogo y estar activa
- `previous_category_id` (integer, opcional) — Se informa cuando cambia la categoría
- `new_category_id` (integer, opcional) — Debe existir en el catálogo cerrado y estar activa; al menos uno de los dos valores debe cambiar
- `changed_by` (integer, obligatorio) — Tomado de la sesión (REQ-064)
- `changed_at` (datetime, obligatorio) — Registro inmutable (REQ-015)
- `change_reason` (string, opcional) — Máx. 255 caracteres

### REQ-111 — Cierre de incidencia resuelta con comentario de resolución obligatorio
El TECNICO_DE_MANTENIMIENTO cierra una incidencia en estado «resuelta» aportando un comentario de resolución obligatorio, quedando la incidencia en estado «cerrada». Reglas: solo se admite el cierre desde status = 'resuelta' (desde abierta o en_curso se rechaza); exige resolution_comment no vacío tras trim(); el cierre es atómico (estado, comentario, autor y fecha en la misma transacción); «cerrada» es terminal (CIE-02); la identidad del autor se toma SIEMPRE del usuario de la sesión, nunca del payload (REQ-064). Flujo: técnico abre el detalle de una incidencia resuelta → acción «Cerrar incidencia» → introduce el comentario (COM-01) → confirma → sistema valida estado + comentario + permisos → persiste → devuelve el detalle actualizado. Rama alternativa: otro técnico cerró la incidencia entre la carga y el envío → conflicto de concurrencia. Datos: incident_id (id, obligatorio), status (varchar2, valores de cat_estados_incidencia: abierta|en_curso|resuelta|cerrada), resolution_comment (clob/varchar2, obligatorio, no vacío tras trim, longitud mínima 1) [gap: longitud máxima permitida del comentario], closed_by_user_id (id usuario sesión, obligatorio), closed_at (timestamp, obligatorio, informado por el servidor), assigned_to_user_id (id, puede ser null) [ambigüedad: el RFP no aclara si puede cerrar cualquier TECNICO_DE_MANTENIMIENTO o solo el que se ha autoasignado la incidencia], version (number, concurrencia optimista). Catálogos: cat_estados_incidencia; cat_categorias_incidencia y cat_salas inalterados en el cierre (REQ-102). Validaciones: estado origen = resuelta; comentario presente y no blanco; incidencia existente y visible para el actor; version coincidente. Errores: 400 «Debe indicar un comentario de resolución para cerrar la incidencia»; 409 «La incidencia no está en estado resuelta y no puede cerrarse»; 409 «La incidencia ya fue cerrada por otro usuario»; 403 «No tiene permisos para realizar esta operación» (uniforme, REQ-031); 404 «Incidencia no encontrada». Criterios de aceptación: Dado una incidencia en «resuelta», cuando el técnico la cierra con comentario no vacío, entonces pasa a «cerrada» y se almacenan comentario, closed_by_user_id y closed_at. Dado una incidencia en «resuelta», cuando se intenta cerrar sin comentario o con comentario en blanco, entonces se rechaza con 400 y permanece en «resuelta». Dado una incidencia en «abierta», cuando se intenta cerrarla, entonces se rechaza con 409. Seguridad: ejecuta TECNICO_DE_MANTENIMIENTO; EMPLEADO recibe denegación uniforme (REQ-030, REQ-022, REQ-013, REQ-078); alcance de datos según REQ-029. Evento de dominio: emite IncidenciaCerrada (consumido por notificaciones; no se materializa aquí) [inferido]. Dependencias: REQ-090, REQ-030, REQ-048, COM-01, HIS-01. Prioridad: Must.
**Reglas de negocio:**
1. Una incidencia solo alcanza el estado «cerrada» desde el estado «resuelta»; desde «abierta» o «en_curso» el cierre no es válido
2. Toda incidencia en estado «cerrada» tiene un comentario de resolución no vacío tras eliminar espacios
3. Toda incidencia en estado «cerrada» tiene informados exactamente un autor de cierre y una fecha y hora de cierre
4. No existe una incidencia cerrada con alguno de sus datos de cierre (estado, comentario, autor, fecha) ausente: los cuatro coexisten o ninguno
5. El autor del cierre de una incidencia es el usuario de la sesión que ejecuta la operación, nunca un identificador aportado en la petición
6. La fecha y hora de cierre de una incidencia proviene del servidor, no del cliente
7. Una incidencia tiene como máximo un cierre: dos cierres sobre la misma incidencia son mutuamente excluyentes
8. El autor de un cierre es siempre un usuario con rol TECNICO_DE_MANTENIMIENTO
9. La sala y la categoría de una incidencia son las mismas antes y después de su cierre
10. Un cierre solo es válido si la versión de la incidencia enviada coincide con la versión persistida
**Criterios de aceptación:**
1. AC-CIE-01: Dado una incidencia en estado «resuelta» y un usuario TECNICO_DE_MANTENIMIENTO autenticado, cuando ejecuta el cierre aportando un comentario de resolución no vacío tras trim(), entonces la incidencia queda en estado «cerrada» y se persisten resolution_comment, closed_by_user_id (tomado de la sesión, nunca del payload) y closed_at (timestamp de servidor) en la misma transacción.
2. AC-CIE-02: Dado una incidencia en estado «resuelta», cuando se intenta cerrarla con comentario ausente, vacío o compuesto solo de espacios, entonces la respuesta es 400 con el mensaje «Debe indicar un comentario de resolución para cerrar la incidencia» y la incidencia permanece en «resuelta» sin ningún dato de cierre informado.
3. AC-CIE-03: Dado una incidencia en estado «abierta» o «en curso», cuando se intenta cerrarla, entonces la respuesta es 409 con el mensaje «La incidencia no está en estado resuelta y no puede cerrarse» y status no cambia.
4. AC-CIE-04: Dado dos técnicos que cargan simultáneamente el detalle de la misma incidencia «resuelta», cuando ambos confirman el cierre, entonces exactamente uno persiste el cierre y el segundo recibe 409 «La incidencia ya fue cerrada por otro usuario», sin sobrescribir resolution_comment, closed_by_user_id ni closed_at.
5. AC-CIE-05: Dado un fallo en la escritura de la entrada de historial durante el cierre, cuando la transacción se resuelve, entonces nada se consolida: la incidencia sigue en «resuelta», no existe comentario de cierre ni entrada de historial, y el usuario recibe 500 con «No se ha podido completar el cierre; inténtelo de nuevo».
6. AC-CIE-07: Dado un usuario con rol EMPLEADO (reportante o no), cuando invoca directamente la API de cierre o el panel de cierres anteriores de cualquier incidencia, entonces recibe una denegación uniforme (403) que no revela la existencia ni el estado del recurso, y la incidencia no sufre ningún cambio.
7. AC-HIS-01: Dado un cierre ejecutado con éxito, cuando se consulta el historial de la incidencia, entonces la última entrada es la transición from_status = 'resuelta' → to_status = 'cerrada' con changed_by_user_id del usuario de sesión, changed_at de servidor y resolution_comment_ref informado.
8. AC-HIS-02: Dado un intento de cierre rechazado con 400, 403 o 409, cuando se consulta el historial de la incidencia, entonces el número de entradas es idéntico al previo al intento y no existe ninguna entrada nueva.
9. AC-HIS-06: Dado el conjunto de incidencias en estado «cerrada» de la base de datos, cuando se ejecuta la verificación de consistencia, entonces toda incidencia cerrada tiene exactamente una entrada de historial resuelta → cerrada y toda entrada resuelta → cerrada corresponde a una incidencia en estado «cerrada» (cardinalidad 1:1, sin huérfanos en ninguna dirección).
**Validaciones:**
1. `incident_id` es obligatorio y debe corresponder a una incidencia existente y visible para el actor
2. `resolution_comment` es obligatorio: debe estar presente y no quedar vacío tras aplicar `trim()` (longitud mínima 1 carácter)
3. `status` de destino debe ser un valor del catálogo cerrado `cat_estados_incidencia` (`abierta|en_curso|resuelta|cerrada`)
4. El estado origen de la incidencia debe ser `resuelta`; se rechaza la petición si está en `abierta` o `en_curso`
5. `version` es obligatorio en el payload y debe coincidir con la versión persistida de la incidencia (concurrencia optimista)
6. `closed_by_user_id` se toma del usuario de la sesión: cualquier identidad de autor recibida en el payload se ignora y no se acepta como entrada
7. `closed_at` lo informa el servidor: no se admite una marca temporal de cierre procedente del cliente
**Escenarios de error:**
1. Falta el comentario de resolución o solo contiene espacios en blanco
2. Identificador de incidencia ausente o con formato no válido
3. Sesión no válida o expirada al confirmar el cierre
4. El usuario no tiene permiso para cerrar incidencias (denegación uniforme)
5. La incidencia indicada no existe o no está dentro del alcance del usuario
6. La incidencia no está en estado «resuelta» y no puede cerrarse
7. La incidencia ya fue cerrada por otro usuario mientras se editaba (conflicto de concurrencia)
**Campos de datos:**
- `incident_id` (string, obligatorio) — Debe existir y ser visible para el actor
- `status` (enum, obligatorio) — abierta | en_curso | resuelta | cerrada (cat_estados_incidencia); estado origen obligatorio = resuelta
- `resolution_comment` (string, obligatorio) — No vacío tras trim; longitud mínima 1; longitud máxima no definida (gap)
- `closed_by_user_id` (string, obligatorio) — Se toma siempre de la sesión, nunca del payload
- `closed_at` (datetime, obligatorio) — Informada por el servidor
- `assigned_to_user_id` (string, opcional) — Puede ser nulo; ambigüedad sobre si el cierre exige autoasignación
- `version` (integer, obligatorio) — Debe coincidir con la versión persistida; si no, conflicto 409

### REQ-112 — Estado «cerrada» terminal: rechazo de toda modificación posterior
El sistema rechaza toda operación de modificación sobre una incidencia en estado «cerrada», preservando inalterados los datos del cierre. Reglas: «cerrada» es estado terminal: no admite nuevas transiciones de estado, ni autoasignación/reasignación, ni reclasificación de sala o categoría (REQ-101), ni edición o borrado del comentario de resolución, ni sustitución de la foto adjunta (REQ-091). La guarda se aplica en backend en TODOS los endpoints de escritura de incidencia, no solo en el de cierre; la SPA además oculta las acciones, pero esa ocultación no es la decisión vinculante (REQ-013, REQ-032). El rechazo no produce efectos laterales ni entradas de historial (REQ-031). La consulta (detalle, historial, descarga de foto) sigue permitida con el alcance de rol habitual. Flujo: petición de escritura → resolución de la incidencia → si status = 'cerrada' → 409 y fin. Datos: lectura de status, closed_at, closed_by_user_id, resolution_comment; ninguno actualizable una vez informado. Validaciones: comprobación de estado terminal previa a cualquier validación de payload, para no filtrar información del recurso. Errores: 409 «La incidencia está cerrada y no admite modificaciones»; 403 uniforme si además falta el permiso de rol. Criterios de aceptación: Dado una incidencia cerrada, cuando se intenta cambiar su estado, entonces se rechaza con 409 y status sigue siendo «cerrada». Dado una incidencia cerrada, cuando se intenta modificar el comentario de resolución, entonces se rechaza y resolution_comment, closed_by_user_id y closed_at permanecen idénticos. Dado una incidencia cerrada, cuando el reportante consulta su detalle, entonces responde 200 con los datos del cierre. Seguridad: la guarda es independiente del rol; aplica también a TECNICO_DE_MANTENIMIENTO y ADMINISTRADOR. [ambigüedad: el RFP no define si existe reapertura de una incidencia cerrada ni quién podría ejecutarla]. Dependencias: CIE-01, REQ-047, REQ-015. Prioridad: Must.
**Reglas de negocio:**
1. «cerrada» es un estado terminal: una incidencia cerrada no tiene transiciones de estado posteriores
2. El comentario de resolución, el autor del cierre y la fecha de cierre son inmutables una vez informados
3. Una incidencia cerrada no admite asignación ni reasignación de técnico, ni reclasificación de sala o categoría, ni sustitución de su foto adjunta
4. El carácter terminal del estado «cerrada» es independiente del rol del actor, incluidos TECNICO_DE_MANTENIMIENTO y ADMINISTRADOR
5. Una operación de escritura rechazada sobre una incidencia cerrada no produce entradas de historial ni ningún otro efecto lateral
6. La consulta de detalle, historial y foto adjunta de una incidencia cerrada sigue disponible con el alcance de rol habitual
**Criterios de aceptación:**
1. AC-CIE-06: Dado una incidencia en estado «cerrada», cuando se invoca cualquier endpoint de escritura de incidencia (cambio de estado, autoasignación o reasignación, reclasificación de sala o categoría, edición o borrado del comentario, sustitución de la foto adjunta) con rol EMPLEADO, TECNICO_DE_MANTENIMIENTO o ADMINISTRADOR, entonces la respuesta es 409 «La incidencia está cerrada y no admite modificaciones», los campos de cierre permanecen byte a byte idénticos y no se genera ninguna entrada de historial; y cuando se consulta el detalle, historial o foto, entonces la lectura sigue respondiendo 200 dentro del alcance de rol.
2. AC-CIE-07: Dado un usuario con rol EMPLEADO (reportante o no), cuando invoca directamente la API de cierre o el panel de cierres anteriores de cualquier incidencia, entonces recibe una denegación uniforme (403) que no revela la existencia ni el estado del recurso, y la incidencia no sufre ningún cambio.
3. AC-COM-05: Dado una incidencia en estado «cerrada», cuando el EMPLEADO reportante o un TECNICO_DE_MANTENIMIENTO abre su detalle, entonces se muestra el bloque «Resolución» con el comentario íntegro y sin truncar, el nombre del autor del cierre y la fecha/hora en formato local español, todo ello en modo solo lectura; y cuando la incidencia no está cerrada, entonces el bloque no aparece.
4. AC-HIS-03: Dado una entrada de historial existente, cuando se intenta modificarla o eliminarla por cualquier vía expuesta por la aplicación, entonces la operación se rechaza y la entrada permanece idéntica en todos sus campos (from_status, to_status, changed_by_user_id, changed_at, resolution_comment_ref).
**Validaciones:**
1. La comprobación de que `status` no es `cerrada` se ejecuta antes de validar el payload de la petición, para no filtrar información del recurso
**Escenarios de error:**
1. La incidencia está cerrada y no admite modificaciones
2. El usuario no tiene permiso para modificar la incidencia (denegación uniforme)
3. La incidencia indicada no existe o no está dentro del alcance del usuario
4. Sesión no válida o expirada
**Campos de datos:**
- `status` (enum, obligatorio) — Si es «cerrada» se rechaza toda escritura; no actualizable
- `resolution_comment` (string, obligatorio) — No editable ni borrable tras el cierre
- `closed_by_user_id` (string, obligatorio) — No actualizable una vez informado
- `closed_at` (datetime, obligatorio) — No actualizable una vez informada

### REQ-113 — Consulta de cierres anteriores por sala y categoría desde el detalle
El técnico consulta, desde el detalle de la incidencia que va a cerrar, los cierres anteriores de la misma sala y categoría con su comentario de resolución. Reglas: se listan únicamente incidencias en estado «cerrada» con la misma room_id y category_id que la incidencia en curso, ordenadas por closed_at descendente; la consulta se limita a la ventana de retención vigente de 2 años (REQ-015); es una vista de solo lectura: no permite editar ni reabrir nada. Flujo: técnico abre el detalle → panel «Cierres anteriores en esta sala y categoría» → ve las N últimas entradas → puede abrir el detalle completo de cualquiera de ellas. Datos expuestos por entrada: incident_id, closed_at (timestamp), closed_by_user_name (varchar2), resolution_comment (texto, truncado en la lista con acceso al íntegro), category_id → cat_categorias_incidencia, room_id → cat_salas. Validaciones: sala y categoría deben existir en catálogo, incluidos valores desactivados con uso histórico (REQ-103). Errores: 403 uniforme si el actor no es TECNICO_DE_MANTENIMIENTO; lista vacía (no error) cuando no hay cierres previos, con mensaje «Sin cierres anteriores para esta sala y categoría». Criterios de aceptación: Dado dos incidencias cerradas de la sala S y categoría C, cuando el técnico abre una tercera incidencia de S y C, entonces ve ambas con su comentario de resolución y fecha de cierre. Dado un usuario con rol EMPLEADO, cuando solicita este panel, entonces se deniega de forma uniforme. Seguridad: exclusivo de TECNICO_DE_MANTENIMIENTO (alcance completo de incidencias, REQ-029); el EMPLEADO no accede a incidencias ajenas (REQ-023). Dependencias: CIE-01, REQ-102. [inferido: capacidad derivada del valor de negocio de EPIC-014 —registro histórico de causas y soluciones por sala y categoría para detectar incidencias recurrentes—; el RFP no la enuncia literalmente, de ahí la prioridad Could]. Prioridad: Could.
**Reglas de negocio:**
1. Un cierre anterior listado para una incidencia comparte con ella sala y categoría y está en estado «cerrada»
2. Los cierres anteriores de una sala y categoría se presentan ordenados por fecha de cierre descendente
3. El panel de cierres anteriores no expone incidencias cerradas fuera de la ventana de retención vigente de 2 años
4. Una sala o categoría desactivada en catálogo sigue siendo un valor válido para las incidencias que ya la usan
5. La ausencia de cierres previos para una sala y categoría produce una lista vacía, no una condición de error
6. El panel de cierres anteriores es accesible exclusivamente al rol TECNICO_DE_MANTENIMIENTO
**Criterios de aceptación:**
1. AC-CIE-07: Dado un usuario con rol EMPLEADO (reportante o no), cuando invoca directamente la API de cierre o el panel de cierres anteriores de cualquier incidencia, entonces recibe una denegación uniforme (403) que no revela la existencia ni el estado del recurso, y la incidencia no sufre ningún cambio.
2. AC-CIE-08: Dado dos incidencias ya cerradas de la sala S y categoría C dentro de la ventana de retención de 2 años, cuando un TECNICO_DE_MANTENIMIENTO abre el detalle de una tercera incidencia de la misma sala y categoría, entonces el panel «Cierres anteriores en esta sala y categoría» lista ambas ordenadas por closed_at descendente con su comentario de resolución, autor y fecha; y cuando no existen cierres previos, entonces se muestra «Sin cierres anteriores para esta sala y categoría» sin error.
3. AC-COM-08: Dado un comentario de resolución que contiene marcado (<script>, etiquetas HTML) o caracteres de control, cuando se persiste y se renderiza en el detalle o en el panel de cierres anteriores, entonces el texto se almacena tal cual, sin transformar y se renderiza escapado, sin que se ejecute ningún script en el navegador.
4. AC-HIS-05: Dado una incidencia cerrada hace hasta 2 años (límite de la ventana de retención), cuando cualquier actor dentro de su alcance consulta su historial, entonces la entrada de cierre sigue presente y legible, incluyendo el caso de valores de catálogo (sala, categoría) desactivados con uso histórico.
**Validaciones:**
1. `room_id` y `category_id` de la incidencia en curso deben existir en `cat_salas` y `cat_categorias_incidencia`, admitiendo valores desactivados con uso histórico
2. El filtro de estado de la consulta se restringe al valor `cerrada`; no se admiten otros estados como criterio
3. La ventana temporal de la consulta no puede exceder los 2 años de retención vigente
**Escenarios de error:**
1. El usuario no tiene permiso para consultar los cierres anteriores por sala y categoría
2. La incidencia de referencia no existe o no está dentro del alcance del usuario
3. Parámetros de consulta de sala o categoría con formato no válido
**Campos de datos:**
- `incident_id` (string, obligatorio) — Solo incidencias en estado «cerrada»
- `room_id` (string, obligatorio) — Debe existir en cat_salas, incluidos valores desactivados con uso histórico
- `category_id` (string, obligatorio) — Debe existir en cat_categorias_incidencia, incluidos desactivados con uso histórico
- `closed_at` (datetime, obligatorio) — Orden descendente; limitado a la ventana de retención de 2 años
- `closed_by_user_name` (string, obligatorio) — Nombre del técnico que ejecutó el cierre anterior
- `resolution_comment` (string, obligatorio) — Truncado en el listado, con acceso al texto íntegro

### REQ-114 — Diálogo de cierre en la SPA con captura y validación del comentario
La SPA ofrece al técnico un diálogo de cierre que captura y valida el comentario de resolución antes de confirmar la operación. Reglas: la acción «Cerrar incidencia» solo se muestra si status = 'resuelta' y el rol vigente es TECNICO_DE_MANTENIMIENTO (REQ-010); su ocultación es ergonómica, la decisión vinculante es del backend (REQ-013). El botón de confirmación permanece deshabilitado mientras resolution_comment esté vacío o solo con espacios. El cierre se confirma en un único paso, sin pantallas intermedias, coherente con el objetivo de operación rápida del RFP. Envío idempotente: doble pulsación no genera dos cierres (bloqueo del control durante la petición). Flujo: detalle → «Cerrar incidencia» → diálogo con resumen de la incidencia (sala, categoría, descripción) y campo de comentario → validación en vivo → confirmar → éxito: mensaje «Incidencia cerrada correctamente» y detalle refrescado; error: el diálogo permanece abierto conservando el texto escrito. Datos del formulario: resolution_comment (texto multilínea, obligatorio, contador de caracteres visible) [gap: longitud máxima del comentario, necesaria para el contador y la validación de cliente]. Validaciones de cliente: no vacío tras trim; longitud máxima; el texto se envía tal cual, sin transformar, y se escapa al renderizar para evitar inyección de marcado. Errores: 400 del backend → mensaje inline bajo el campo; 409 estado no válido o ya cerrada → «La incidencia ya no está en estado resuelta» y recarga del detalle; 403 → «No tiene permisos para realizar esta operación». Todos los textos en español (REQ-050). Criterios de aceptación: Dado una incidencia resuelta y un técnico autenticado, cuando abre el diálogo de cierre, entonces el botón confirmar está deshabilitado hasta que escriba un comentario no vacío. Dado un usuario EMPLEADO, cuando abre el detalle de su incidencia resuelta, entonces no ve la acción «Cerrar incidencia». Dado un fallo 409 del backend, cuando se muestra el error, entonces el comentario escrito no se pierde. Seguridad: visible solo para TECNICO_DE_MANTENIMIENTO; la validación de cliente nunca sustituye a la de servidor (CIE-01). Dependencias: CIE-01, REQ-020. Integración: Angular SPA (front). Prioridad: Must.
**Reglas de negocio:**
1. La acción «Cerrar incidencia» es visible únicamente cuando la incidencia está en «resuelta» y el actor tiene rol TECNICO_DE_MANTENIMIENTO
2. La confirmación del cierre está inhabilitada mientras el comentario de resolución esté vacío o contenga solo espacios
3. Una misma apertura del diálogo de cierre origina como máximo un cierre, aunque se pulse confirmar varias veces
4. El cierre se confirma en un único paso: no hay pantallas intermedias entre la acción y la confirmación
5. Tras un error devuelto por el backend, el texto del comentario introducido por el técnico permanece disponible en el diálogo
6. Toda validación del cierre aplicada en la SPA tiene equivalente vinculante en el backend; ninguna validación existe solo en cliente
7. El comentario de resolución se transmite sin transformación y se representa escapado al renderizarse
**Criterios de aceptación:**
1. AC-COM-01: Dado un TECNICO_DE_MANTENIMIENTO en el detalle de una incidencia «resuelta», cuando abre el diálogo «Cerrar incidencia», entonces ve el resumen de la incidencia (sala, categoría, descripción), el campo de comentario con contador de caracteres visible, y el botón de confirmación permanece deshabilitado mientras el comentario esté vacío o contenga solo espacios.
2. AC-COM-02: Dado un TECNICO_DE_MANTENIMIENTO con el diálogo de cierre abierto, cuando pulsa confirmar dos veces seguidas antes de recibir respuesta, entonces se emite una sola petición de cierre y se crea una sola entrada de historial.
3. AC-COM-03: Dado un backend que responde 400 o 409 al confirmar el cierre, cuando la SPA muestra el error, entonces el diálogo permanece abierto conservando íntegro el texto escrito, el mensaje se muestra en español (inline bajo el campo para 400, con recarga del detalle para 409) y no se pierde ningún carácter del comentario.
4. AC-COM-04: Dado un usuario con rol EMPLEADO que abre el detalle de una incidencia propia en estado «resuelta», entonces no se renderiza la acción «Cerrar incidencia» en ninguna parte de la interfaz.
5. AC-COM-08: Dado un comentario de resolución que contiene marcado (<script>, etiquetas HTML) o caracteres de control, cuando se persiste y se renderiza en el detalle o en el panel de cierres anteriores, entonces el texto se almacena tal cual, sin transformar y se renderiza escapado, sin que se ejecute ningún script en el navegador.
**Validaciones:**
1. `resolution_comment` no puede estar vacío ni contener solo espacios tras `trim()`; el botón de confirmación permanece deshabilitado mientras no se cumpla
2. `resolution_comment` no puede superar la longitud máxima permitida, reflejada en el contador de caracteres visible
3. El texto del comentario se envía tal cual, sin transformaciones (no se recorta, normaliza ni reformatea el contenido introducido por el técnico)
**Escenarios de error:**
1. El comentario de resolución enviado está vacío o solo contiene espacios
2. La sesión ha expirado y debe iniciarse de nuevo antes de confirmar el cierre
3. El usuario no tiene permiso para realizar esta operación
4. La incidencia ya no está en estado «resuelta» y el diálogo debe recargarse
**Campos de datos:**
- `resolution_comment` (string, obligatorio) — Texto multilínea; no vacío tras trim; contador de caracteres visible; longitud máxima no definida (gap)

### REQ-115 — Detalle de incidencia cerrada con comentario íntegro, autor y fecha de cierre
El detalle de la incidencia cerrada muestra el comentario de resolución íntegro junto con el autor y la fecha y hora del cierre, con el alcance de datos propio de cada rol. Reglas: el bloque «Resolución» aparece únicamente cuando status = 'cerrada'; muestra el comentario completo, sin truncar ni resumir; se identifica al autor por su nombre y se marca la fecha/hora de cierre; la atribución persiste aunque el técnico autor haya sido desactivado (REQ-087): se muestra el nombre conservado, no «usuario desconocido»; el bloque es de solo lectura para todos los roles (CIE-02). Datos expuestos: resolution_comment (texto íntegro), closed_by_user_name (varchar2), closed_at (timestamp, formato local español), status (cerrada). Validaciones: el contenido se renderiza escapado; si resolution_comment estuviera ausente en una incidencia cerrada (dato inconsistente), se muestra un aviso de dato no disponible y se registra el hecho para soporte. Errores: 404 si la incidencia no existe o queda fuera del alcance del actor (respuesta indistinguible, REQ-023); 403 uniforme sin sesión válida (REQ-058). Criterios de aceptación: Dado una incidencia cerrada, cuando el EMPLEADO que la reportó abre su detalle, entonces ve el comentario de resolución íntegro, el autor del cierre y su fecha y hora. Dado una incidencia cerrada de otro empleado, cuando un EMPLEADO intenta abrir su detalle, entonces recibe la denegación uniforme y no ve el comentario. Dado un TECNICO_DE_MANTENIMIENTO, cuando abre cualquier incidencia cerrada, entonces ve el bloque de resolución. Seguridad: EMPLEADO solo sobre sus propias incidencias (REQ-024, REQ-029); TECNICO_DE_MANTENIMIENTO sobre todas; sin doble factor. Mismo alcance que la descarga de la foto adjunta (REQ-027). Dependencias: CIE-01, REQ-026. Prioridad: Must.
**Reglas de negocio:**
1. El bloque «Resolución» del detalle existe si y solo si la incidencia está en estado «cerrada»
2. El comentario de resolución se presenta íntegro en el detalle, sin truncamiento ni resumen
3. La atribución del cierre conserva el nombre del técnico autor aunque su usuario esté desactivado
4. El bloque de resolución es de solo lectura para todos los roles
5. Un EMPLEADO accede al comentario de resolución únicamente de las incidencias que él reportó
6. Una incidencia sin sesión válida o fuera del alcance del actor es indistinguible de una incidencia inexistente
**Criterios de aceptación:**
1. AC-COM-05: Dado una incidencia en estado «cerrada», cuando el EMPLEADO reportante o un TECNICO_DE_MANTENIMIENTO abre su detalle, entonces se muestra el bloque «Resolución» con el comentario íntegro y sin truncar, el nombre del autor del cierre y la fecha/hora en formato local español, todo ello en modo solo lectura; y cuando la incidencia no está cerrada, entonces el bloque no aparece.
2. AC-COM-06: Dado una incidencia cerrada cuyo técnico autor ha sido posteriormente desactivado, cuando se consulta el detalle, entonces se sigue mostrando el nombre conservado del autor y nunca el literal «usuario desconocido».
3. AC-COM-07: Dado un usuario con rol EMPLEADO que no es el reportante, cuando solicita el detalle de una incidencia cerrada ajena, entonces recibe una respuesta indistinguible de «no encontrada» (404) y en ningún caso el comentario de resolución, el autor ni la fecha de cierre aparecen en el cuerpo de la respuesta.
4. AC-COM-08: Dado un comentario de resolución que contiene marcado (<script>, etiquetas HTML) o caracteres de control, cuando se persiste y se renderiza en el detalle o en el panel de cierres anteriores, entonces el texto se almacena tal cual, sin transformar y se renderiza escapado, sin que se ejecute ningún script en el navegador.
**Validaciones:**
1. El contenido de `resolution_comment` se renderiza escapado para impedir la interpretación de marcado inyectado
2. Coherencia de datos: una incidencia con `status = 'cerrada'` debe tener `resolution_comment` informado; si falta, se muestra aviso de dato no disponible y se registra el hecho
**Escenarios de error:**
1. La incidencia no existe o no está dentro del alcance del usuario
2. Sesión no válida o expirada al consultar el detalle del cierre
3. El usuario no tiene permiso para consultar esta incidencia (denegación uniforme)
**Campos de datos:**
- `status` (enum, obligatorio) — El bloque solo se muestra si status = cerrada
- `resolution_comment` (string, obligatorio) — Se muestra íntegro, sin truncar; se renderiza escapado
- `closed_by_user_name` (string, obligatorio) — Se conserva aunque el usuario esté desactivado
- `closed_at` (datetime, obligatorio) — Formato local español

### REQ-127 — Detalle con historial como línea temporal cronológica (estado origen/destino, autor, fecha, comentario)
El detalle de la incidencia presenta el historial como línea temporal cronológica con estado origen/destino, autor, fecha y comentario de resolución. Reglas: la vista consume el contrato de lectura ya existente (REQ-124) y no decide permisos: la autorización es vinculante en backend (REQ-013, REQ-032); orden ascendente por changed_at con desempate por history_id, reflejando la secuencia completa desde el alta hasta el estado actual, sin huecos; la última entrada se destaca como estado actual, coherente con el estado persistido de la incidencia; la entrada de cierre muestra íntegro el resolution_comment con su autor y fecha (REQ-115, REQ-116); la UI no ofrece acciones de editar ni eliminar entradas (inmutabilidad, REQ-015); volumen típico ≤ 10 entradas (ciclo de 4 estados + asignaciones), por lo que no se pagina [inferido]. Flujo: usuario abre el detalle → SPA solicita el historial → render de la línea temporal → si el usuario no tiene alcance, la SPA muestra el error devuelto por backend y no renderiza datos. Datos de presentación: history_id, entry_type, from_status_label, to_status_label (etiquetas desde cat_estados), actor_display_name, actor_role (etiqueta desde cat_roles), changed_at (formato dd/MM/yyyy HH:mm, zona Europe/Madrid [inferido]), resolution_comment (solo en la entrada de cierre), assigned_technician_name (solo en entradas de asignación). Validaciones: ninguna de entrada (vista de lectura); si el historial llega vacío —imposible por HIST-REG-01— se muestra «Sin actividad registrada.». Errores: HTTP 403 → «No tiene permiso para consultar esta incidencia.»; HTTP 404 → «La incidencia no existe.» (misma respuesta uniforme para no revelar el recurso, REQ-031, REQ-023); fallo de red/500 → «No se ha podido cargar el historial.» con acción de reintento y sin bloquear el resto del detalle. CA: Given una incidencia con varios cambios de estado When el reportante abre su detalle Then ve una entrada por cambio con estado origen, estado destino, autor y fecha/hora, ordenadas cronológicamente. Given un técnico de mantenimiento When abre el detalle de cualquier incidencia Then ve su historial completo. Given un empleado When abre el detalle de una incidencia que no reportó Then recibe la denegación uniforme y no ve ninguna entrada. Given una incidencia cerrada When se consulta el historial Then la entrada «resuelta → cerrada» muestra el comentario de resolución completo. Seguridad: EMPLEADO solo sus propias incidencias; TECNICO_DE_MANTENIMIENTO todas; ADMINISTRADOR sin alcance de incidencias (REQ-026, REQ-029, REQ-014); sesión válida obligatoria (REQ-051); sin doble factor. Dependencias: REQ-124, REQ-026, REQ-115, REQ-117, HIST-REG-01. Integración: SPA Angular. Prioridad: Must. Fase: —.
**Reglas de negocio:**
1. El historial de una incidencia se presenta en orden ascendente de `changed_at`, con `history_id` como único desempate, de modo que el orden es determinista
2. La última entrada del historial es coherente con el estado actual persistido de la incidencia
3. Un empleado solo tiene alcance sobre el historial de las incidencias que él mismo reportó
4. Un técnico de mantenimiento tiene alcance sobre el historial de cualquier incidencia
5. Un administrador no tiene alcance sobre el historial de ninguna incidencia
6. El comentario de resolución solo aparece asociado a la entrada de transición «resuelta → cerrada»
7. La interfaz de detalle no expone ninguna acción de edición ni de eliminación de entradas de historial
8. La consulta del historial exige sesión válida y la denegación por falta de alcance es indistinguible de la de recurso inexistente
**Criterios de aceptación:**
1. AC-HIST-CONS-01: Dado una incidencia con varios cambios de estado, cuando el empleado reportante abre su detalle, entonces ve una línea temporal ordenada ascendentemente por fecha (desempate por identificador de entrada) con una fila por entrada que muestra estado origen, estado destino, autor, rol y fecha/hora en formato `dd/MM/yyyy HH:mm` (Europe/Madrid), destacando la última entrada como estado actual.
2. AC-HIST-CONS-02: Dado una incidencia en estado «cerrada», cuando cualquier usuario con alcance consulta su historial, entonces la entrada «resuelta → cerrada» muestra el comentario de resolución íntegro (sin truncar) junto con su autor y su fecha.
3. AC-HIST-CONS-03: Dado un empleado autenticado y una incidencia que no reportó, cuando invoca la consulta de detalle/historial directamente por API con el identificador de esa incidencia, entonces recibe una denegación uniforme (misma respuesta que para una incidencia inexistente), cero entradas de historial en el cuerpo y ningún dato que revele la existencia del recurso; el mismo escenario para el rol `ADMINISTRADOR` sobre el registro de actividad devuelve igualmente denegación.
4. AC-HIST-CONS-04: Dado la vista de detalle de una incidencia en la SPA, cuando un usuario de cualquier rol la inspecciona, entonces no se ofrece ninguna acción de editar ni eliminar entradas de historial y, si el historial no puede cargarse por error de red o HTTP 500, se muestra el mensaje de error con acción de reintento sin bloquear el resto del detalle.
5. AC-HIST-CONS-08: Dado el entorno de producción bajo la carga máxima declarada (50 usuarios concurrentes), cuando se mide la operación de consulta de detalle con historial durante 7 días naturales en horario laboral, entonces el p95 de tiempo de respuesta es < 800 ms y la tasa de consultas de historial fallidas es < 1 %, evidenciando el «consultable en todo momento» del RFP §5.5.
**Escenarios de error:**
1. Sesión no válida o caducada al abrir el detalle con su historial
2. No tiene permiso para consultar esta incidencia
3. La incidencia solicitada no existe
4. El identificador de incidencia solicitado tiene un formato inválido
5. El historial no está disponible temporalmente; puede reintentarse la carga
**Campos de datos:**
- `history_id` (integer, obligatorio) — Usado como desempate del orden cronológico ascendente
- `entry_type` (enum, obligatorio) — Valores: CREACION, CAMBIO_ESTADO, ASIGNACION
- `from_status_label` (string, opcional) — Procede del catálogo de estados; vacía en la entrada de creación
- `to_status_label` (string, obligatorio) — Procede del catálogo de estados
- `actor_display_name` (string, obligatorio) — Nombre del autor mostrado en la entrada
- `actor_role` (string, opcional) — Procede del catálogo de roles
- `changed_at` (datetime, obligatorio) — Formato dd/MM/yyyy HH:mm, zona Europe/Madrid
- `resolution_comment` (string, opcional) — Solo presente en la entrada de cierre (resuelta → cerrada)
- `assigned_technician_name` (string, opcional) — Solo presente en entradas de tipo ASIGNACION

### REQ-151 — Traza cronológica consolidada de la incidencia con alta, asignación, reclasificaciones y comentario de resolución
El sistema ofrece una traza cronológica consolidada de la incidencia que, además de los cambios de estado, recoge el alta, la asignación de técnico, las reclasificaciones y el comentario de resolución. Reglas: la traza amplía el historial de cambios de estado ya existente (REQ-123, REQ-124) con los eventos de negocio que hoy no quedan en una vista única: alta de la incidencia, autoasignación/cambio de técnico, reclasificación de sala o categoría (REQ-101) e incorporación del comentario de resolución; cada entrada es append-only, se escribe en la misma transacción que la operación que la origina y nunca se modifica ni se borra; el orden de presentación es cronológico ascendente por occurred_at y, a igualdad, por history_entry_id; la traza está disponible durante toda la ventana de retención, también para incidencias cerradas; si un evento fue realizado por un usuario desactivado, la atribución se conserva (REQ-087). Flujo: el usuario abre el detalle, pestaña «Historial», obtiene la lista paginada de entradas con tipo de evento, actor, fecha y qué cambió, y puede filtrar por tipo de evento. Datos: history_entry_id (number, PK), incident_id (FK, obligatorio), event_type (varchar, valor de cat_tipos_evento_incidencia: alta, cambio_estado, asignacion, reclasificacion, comentario_resolucion), actor_user_id (FK usuarios, obligatorio), occurred_at (timestamp, obligatorio), value_before (varchar 200, nullable), value_after (varchar 200, nullable). Catálogos: cat_tipos_evento_incidencia, cat_estados_incidencia. Validaciones: event_type dentro de catálogo; cambio_estado exige value_before/value_after no nulos y coherentes con el grafo de transiciones (REQ-117); paginación page_size 1..100. Errores: 400 «Tipo de evento no válido»; 403 uniforme si el EMPLEADO consulta la traza de una incidencia ajena; 404 si la incidencia no existe o está fuera de retención. Criterios de aceptación: Given una incidencia que pasó por abierta → en curso → resuelta → cerrada con una reclasificación de categoría intermedia, When el EMPLEADO reportante consulta su historial, Then ve 6 entradas en orden cronológico (alta, asignación, 3 cambios de estado, reclasificación) con actor y fecha en cada una. Given una incidencia cerrada hace un año, When se consulta su traza, Then se devuelve íntegra. Given un intento de editar o borrar una entrada, When se ejecuta, Then la operación se rechaza y nada cambia. Seguridad: sesión válida (REQ-051); EMPLEADO alcance a sus propias incidencias, TECNICO_DE_MANTENIMIENTO a todas (REQ-026, REQ-029); solo lectura, sin doble factor. Dependencias: REQ-123, REQ-124, REQ-116, REQ-101, REQ-117, RET-01. Prioridad Must [inferido]. Integración: —. Fase: —.
**Reglas de negocio:**
1. Toda operación de alta, cambio de estado, asignación, reclasificación o comentario de resolución tiene una entrada de traza asociada
2. Las entradas de la traza son append-only: una vez escritas no se modifican ni se borran
3. La traza de una incidencia se presenta en orden cronológico ascendente por momento del evento y, a igualdad, por identificador de entrada
4. Cada entrada de la traza tiene actor y fecha informados, y la atribución se conserva aunque el usuario actor esté desactivado
5. El tipo de evento de una entrada de traza es siempre un valor de `cat_tipos_evento_incidencia`
6. Una entrada de tipo «cambio de estado» tiene valor anterior y valor posterior informados y coherentes con el grafo de transiciones declarado
7. La traza completa de una incidencia está disponible durante toda su ventana de retención, también cuando la incidencia está cerrada
**Criterios de aceptación:**
1. AC-HIST-01: **Dado** una incidencia que recorrió `abierta → en curso → resuelta → cerrada` con una reclasificación de categoría intermedia, **cuando** el EMPLEADO reportante consulta su historial, **entonces** obtiene exactamente 6 entradas (alta, asignación, 3 cambios de estado y reclasificación) en orden cronológico ascendente por `occurred_at`, cada una con `event_type`, actor y fecha.
2. AC-HIST-02: **Dado** cualquier entrada existente de la traza, **cuando** se intenta editarla o borrarla por API o por operación de negocio, **entonces** la operación se rechaza y el contenido de la entrada permanece idéntico (comportamiento append-only verificado byte a byte sobre `value_before`, `value_after`, `actor_user_id` y `occurred_at`).
3. AC-HIST-03: **Dado** una incidencia cerrada hace un año y dentro de la ventana de retención, **cuando** un usuario con alcance consulta su traza, **entonces** se devuelve íntegra y paginada (`page_size` 1..100), sin pérdida de entradas respecto a las registradas en el momento de las operaciones.
4. AC-HIST-04: **Dado** un EMPLEADO, **cuando** consulta la traza de una incidencia que no reportó, **entonces** recibe `403` uniforme; y **dado** un TECNICO_DE_MANTENIMIENTO, **cuando** consulta la traza de cualquier incidencia, **entonces** la obtiene completa; y **dado** una incidencia inexistente o fuera de retención, **cuando** se solicita su traza, **entonces** se devuelve `404`.
5. AC-HIST-05: **Dado** una entrada de historial cuyo actor fue posteriormente desactivado como usuario, **cuando** se consulta la traza, **entonces** la atribución (nombre y correo corporativo del actor en el momento del evento) sigue mostrándose y no aparece como anónima ni vacía.
**Validaciones:**
1. `event_type` debe pertenecer al catálogo `cat_tipos_evento_incidencia` (`alta`, `cambio_estado`, `asignacion`, `reclasificacion`, `comentario_resolucion`)
2. En las entradas de tipo `cambio_estado`, `value_before` y `value_after` son obligatorios (no nulos)
3. En las entradas de tipo `cambio_estado`, `value_before` y `value_after` deben ser coherentes con el grafo de transiciones declarado
4. `incident_id`, `actor_user_id` y `occurred_at` son obligatorios en cada entrada de la traza
5. El parámetro de paginación `page_size` debe ser un entero entre 1 y 100
**Escenarios de error:**
1. El tipo de evento indicado en el filtro no es válido
2. El tamaño de página solicitado está fuera del rango admitido (1 a 100)
3. No tiene permisos para consultar el historial de esta incidencia
4. La incidencia no existe o está fuera del periodo de retención
5. Las entradas del historial no admiten modificación ni borrado
6. El cambio de estado registrado no es coherente con las transiciones permitidas del ciclo de vida
**Campos de datos:**
- `history_entry_id` (integer, obligatorio) — Clave primaria; desempata el orden a igualdad de `occurred_at`
- `incident_id` (integer, obligatorio) — Incidencia a la que pertenece la entrada de historial
- `event_type` (enum, obligatorio) — Valores de `cat_tipos_evento_incidencia`: alta, cambio_estado, asignacion, reclasificacion, comentario_resolucion
- `actor_user_id` (integer, obligatorio) — Referencia a usuarios
- `occurred_at` (datetime, obligatorio) — Momento del evento; base del orden cronológico ascendente
- `value_before` (string, opcional) — Longitud máxima 200; obligatorio y coherente con el grafo de transiciones cuando `event_type = 'cambio_estado'`
- `value_after` (string, opcional) — Longitud máxima 200; obligatorio cuando `event_type = 'cambio_estado'`
- `page_size` (integer, opcional) — Rango 1..100

## Entorno de prueba de esta sesión

Antes de arrancar tu sesión, la plataforma levanta los servicios de abajo como contenedores efímeros y deja sus datos de conexión en `.mind/TSK-036/env.sh` (y en `env.json`). Contrato de uso:

- **Haz `source .mind/TSK-036/env.sh` antes de cada build/test** que necesite el entorno; si el fichero no existe, el entorno NO se pudo levantar (ver el final de esta sección).
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
- **Tu parte:** la plataforma ya escribió `e2e/E2E-NNN.e2e-spec.ts` por cada caso e2e de «Pruebas que debes implementar». Sustituye el esqueleto (marca `MIND_CATALOG_SKELETON`) por las acciones del Gherkin y conserva el tag `@E2E-NNN`. No crees un spec paralelo por pantalla. No renombres a `*.spec.ts` (chocan con Jest/Karma).
- Sin baselines pixel en el repo (`toHaveScreenshot` prohibido aquí).

**Navegador para los tests**: el runtime trae Chromium y `CHROME_BIN` ya apunta a él, así que NO lo instales ni lo descargues. Pero corre en un contenedor sin privilegios, así que su sandbox no puede activarse: usa un launcher headless con `--no-sandbox` (en Karma, un `customLaunchers` que extienda `ChromeHeadless`; en Playwright, `args: ['--no-sandbox']`). Sin eso el navegador está pero no arranca, y el síntoma no lo dice.

### Si el entorno no está disponible
Comprueba `.mind/TSK-036/env.json`: si su `status` es `unavailable` o `degraded`, la plataforma no pudo darte (todo) el entorno. En ese caso ESCRIBE igualmente los tests de integración y déjalos en el entregable, y repórtalo como health check **Warning** con `check: entorno-de-prueba` — NO como Blocker: no es un defecto de tu tarea, y la verificación queda diferida al CI. Reserva el Blocker para cuando el entorno SÍ estaba y los tests fallan por el código o por el brief.