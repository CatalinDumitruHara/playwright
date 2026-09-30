# TSK-003 · Implementación del middleware de autorización y permisos por rol

- Componente dueño: `ARC-012`
- Arquetipo del repo: `api` — respeta sus convenciones; NUNCA te salgas de él (ver «Contrato de salida del arquetipo»).
- Zonas de código de ESTA tarea (trabajo principal): `sources/apps/permissions/`, `sources/config/settings.py`. Fuera de ellas NO amplíes alcance de negocio — **EXCEPTO** el composition root y el manifiesto del host necesarios para montar lo entregado (sección Composition root).

## Definition of Done
Middleware Django/FastAPI implementado que intercepta todas las peticiones. Resuelve el rol del usuario desde la sesión (BD) e ignora parámetros del cliente. Deniega con 403 por defecto si el par rol/operación no está en la matriz de permisos. Las pruebas de integración verifican los casos de AC-PERM-01, AC-PERM-02, AC-PERM-03. Middleware montado en el composition root del framework. Asume que el esquema T.5 (`permiso_rol_operacion`) ya está aplicado.

## Oráculos de verificación (dod-oracles) — OBLIGATORIO

El DoD se evalúa por **comportamiento**, no porque exista un fichero o un string «implementado». Lo siguiente es **Blocker** si lo usas como entrega de producto (los dobles solo valen en tests):

- **Email / notificación:** cliente real o puerto inyectable (`aiosmtplib`, SES, SendGrid, …) + test que verifica que se invocó el envío. **`log.info` / `print` / «Simula el envío» ≠ email.**
- **Auth / rol (p. ej. ADMINISTRADOR):** dependency o middleware que devuelve 401/403 sin credencial/rol; tests con y sin permiso. **Un CRUD abierto no cumple «solo admin».**
- **Evento / AsyncAPI:** productor que publica al canal declarado; test que captura el publish. **Loguear el payload ≠ publicar el evento.**
- **Persistencia:** driver del stack del arquetipo (Motor/SQLAlchemy/…) contra el motor de prueba o Testcontainers. **`dict` / `db_*` in-memory en el módulo de producto ≠ base de datos.**

Si el entorno de prueba no levanta el servicio necesario: escribe el código de producto real + tests, declara Warning `entorno-de-prueba`, y **NO** sustituyas el DoD con un fake en el código entregado.

## Composition root (composition-root) — OBLIGATORIO

Un módulo con router/controller que **no está montado** en el composition root del proceso NO cuenta como entregado.

Raíces reales del arquetipo `api`: `sources/`. El composition root y el código nuevo viven BAJO esas raíces; no abras un segundo árbol (`src/` junto a `sources/`, `backend/` junto a `apps/`).

En ESTA misma tarea (aunque `zone_paths` no lo liste):
1. Localiza el composition root (`src/main.py`, `app/main.py`, `*Application.java` + scan, `Program.cs`, …).
2. Si no existe (repo vacío / BYO), créalo siguiendo el arquetipo y monta ahí tu router — no dejes el módulo huérfano.
3. Registra el router/controller nuevo (`include_router`, bean MVC, route config…). Si defines `public_router` (o equivalente público), **móntalo también**.
4. Prefijos/paths alineados con `openapi.yaml` del repo (o `.mind`).
5. Smoke: import/arranque del composition root no falla por tu cambio (p. ej. `from src.main import app` / `./mvnw -q compile`).

**Excepción a zone_paths:** el composition root y el manifiesto de deps del host (`requirements.txt` / `pom.xml` / …) SÍ se tocan para cablear lo entregado. No refactores módulos ajenos ni amplíes alcance de negocio.

## Lo entregado tiene que ARRANCAR (boot-gate) — OBLIGATORIO

Compilar no es arrancar. Antes de entregar, arranca el proceso y golpea un endpoint: es lo que separa «el módulo compila» de «el producto funciona», y no lo ve ningún compilador.

1. **Configuración por entorno.** Toda conexión a un sistema externo (base de datos, cola, API) parametrizada con valor por defecto (`${VAR:default}`). Nada de hosts fijos en el fuente.
2. **Nada a medio cablear.** Si escribes una consulta, un repositorio o un cliente, INVÓCALO desde el camino real. El trabajo hecho y sin cablear es la firma de una feature entregada a medias.
3. **Despliegue coherente.** Si tocas `docker-compose.yml`: el motor de la imagen, la URL de conexión y el driver declarado en el manifiesto son UN SOLO hecho. `depends_on` sobre un servicio con estado lleva `condition: service_healthy`. Imágenes base multiarch, y no referencies contextos ni Dockerfile que no existan.

**Un `TODO`, un `not implemented` o un retorno vacío como cuerpo ÚNICO de una función es un bloqueante de entrega, no una nota.** Un endpoint que responde `200 OK` con algo que no depende de ninguna entrada ni de ninguna consulta no es una feature: es una fachada.

## Imports de tests (test-imports) — OBLIGATORIO

Los tests y el `conftest` deben usar **el mismo composition root y el mismo prefijo de paquete** que el código productivo. Un árbol inventado (`src.app.main` cuando el app está en `src/main.py`) no es entrega.

1. Localiza el composition root real (`src/main.py`, `app/main.py`, …) — el mismo composition root.
2. Importa la app **solo** desde ese módulo (p. ej. si existe `src/main.py` y NO `src/app/main.py` → `from src.main import app`). **PROHIBIDO** `from src.app.main import app`.
3. Elige UN prefijo de paquete alineado con el código productivo (`from src.app.<mod>…` **o** `from app.<mod>…` con `PYTHONPATH`/`pytest.ini` coherente). No mezcles ambos en la misma suite.
4. Declara la política en `pytest.ini` / `pyproject.toml` (`pythonpath`) si aún no existe.
5. Importa solo símbolos que **existen** en el fuente (lee el fichero): no inventes `get_page_service` en `service.py` si vive en `router.py`; no inventes clases (`Class` vs `ClassModel`).
6. Smoke: `python -c "from src.main import app"` (o el import canónico) y, si hay pytest, una recolección sin `ModuleNotFoundError`.

## Los tests tienen que EJECUTARSE (suite-exec) — OBLIGATORIO

Un fichero de test que ningún runner recoge es PEOR que no tenerlo: da una señal de cobertura falsa. Antes de entregar:

1. **Cuenta.** Los tests que has escrito y los que el runner ejecuta tienen que ser los mismos. Ejecuta la suite y comprueba el número.
2. **Corre en un clon limpio.** Sin variables de entorno de la plataforma. Todo `process.env.X` con valor por defecto, y toda dependencia externa de test declarada y levantada por el propio repo.
3. **No parchees la aplicación desde el test.** Si el contexto no levanta, el arreglo va en la configuración productiva. Un `@ComponentScan`/`@EntityScan`/`@EnableJpaRepositories` en una clase de test pone el test en verde y deja el producto roto.
4. **Surefire vs failsafe.** Surefire recoge `*Test`/`Test*`/`*Tests`. Para `*IT` hace falta `maven-failsafe-plugin` **con sus ejecuciones declaradas** (`integration-test` + `verify`): sin él, un `AlgoIT.java` se compila, se commitea y no se ejecuta jamás.
   - **Comprueba primero si el `pom.xml` ya lo trae**, que es lo normal en el esqueleto del arquetipo. Si no está, **configúralo**: el `pom.xml` del host es una EXCEPCIÓN explícita a `zone_paths` (ver composition-root), así que tocarlo para cablear lo que entregas es parte del encargo, no salirse de alcance.
   - Y ojo al comando: `mvn test` ejecuta SOLO los unitarios y sale en verde aunque el IT no haya corrido. El que valida la entrega es **`mvn verify`**. Si cuentas los tests ejecutados con `mvn test`, vas a contar de menos.
5. **Datasource de test propio.** Aislado y efímero (Testcontainers con la imagen real; H2 en modo Oracle como mínimo). Sin él los tests heredan el datasource de producción y salen a buscar la base de datos real.

## Imports canónicos (canonical-imports) — OBLIGATORIO

Usa **solo** módulos que existen en el repo o que sembró el scaffolding PR #0.

- Entrypoint típico: `src/backend/app/main.py` con paquete `app` (PYTHONPATH = `src/backend/`).
- DB / email / deps: `app.database`, `app.email` — **NO** inventar `app.core.database`, `app.core.email` ni `app.dependencies` si no hay fichero.
- Tests y producto: **el mismo prefijo** (`from app.modules…`, no mezclar con `app.core…` fantasma).
- Si importas un paquete de terceros (`sqlalchemy`, `motor`, …), decláralo pineado en `requirements.txt` / `pyproject.toml` del host.

## Dependencias pineadas (dependency-pins) — OBLIGATORIO

Un manifiesto sin versiones (o incompleto frente a los imports) NO es entrega válida.

1. **Python:** en `requirements.txt` / deps de `pyproject.toml` cada paquete lleva pin (`==` preferido, o rango acotado `>=x,<y`). **PROHIBIDO** listar solo el nombre (`fastapi`, `uvicorn`, `pydantic`).
2. **Completitud:** toda librería de terceros que importes (`sqlalchemy`, `pydantic`, `motor`, …) debe figurar en el manifiesto.
3. **API ↔ major:** el código debe ser compatible con el major pineado. Si usas `__modify_schema__` / `@validator` / `from_orm` (Pydantic v1), pinea `pydantic>=1.10,<2` (o equivalente). Si pegas Pydantic 2, usa APIs v2 (`field_validator`, `model_validate`). NUNCA código v1 + install latest.
4. **Node:** versiones en `package.json` + `package-lock.json` cuando toques deps; no dejes dependencias sin versión.
5. Actualiza el manifiesto del host en ESTA tarea (misma excepción de zona que el composition root).

## Extiende la zona, no la reimplementes (zone-extend) — OBLIGATORIO

Tus zonas (`sources/apps/permissions/`, `sources/config/settings.py`) pueden ya contener código de una TSK predecesora mergeada (o del esqueleto). Antes de crear tipos nuevos:

1. **Lista y lee** los ficheros bajo la zona (`ls` / abre `service.py`, `router.py`, …).
2. **EDIT/EXTIENDE** clases, funciones y exports existentes. **PROHIBIDO** una segunda `class`/`def`/export con el **mismo nombre** en el mismo fichero (en Python gana la última y el resto es basura).
3. Si esta tarea es «API pública» / «consulta» sobre el mismo dominio que un CRUD previo, **reutiliza** servicios y modelos; añade solo el router/handlers públicos (montados en el composition root).
4. Un módulo = un dueño semántico de cada símbolo top-level. Si hace falta otro tipo, **nómbralo distinto** o factoriza — no pegues un duplicado al EOF.

El runtime puede anexar la lista real de ficheros presentes en la zona al arrancar la sesión.

## Contrato API congelado (api-contract) — LEY

El `openapi.yaml` del repo (PR #0 / C.2) es el contrato de esta API. Esta tarea no es dueña de ningún endpoint: la tabla va como CONTEXTO — no montes rutas nuevas, y si tocas las que hay, respétalas al pie de la letra.

| EP | Método | Path | Request | Response | Status | Public | Roles |
|----|--------|------|---------|----------|--------|--------|-------|
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

Disciplina (api-contract):
1. Path y verbo **literales** del contrato (`/membership-plans`, no `/plans/`; `PUT`, no `PATCH` si el contrato dice PUT).
2. La base pública de la API es **`servers[0].url` del `openapi.yaml`** (p. ej. `/api`): monta los routers de forma que la URL pública sea `base + path` EXACTAMENTE. No inventes otra base ni añadas versiones (`/v1`) que el contrato no traiga: el cliente concatena `base + path` y cualquier otro prefijo le devuelve 404.
3. Status HTTP de la columna Status (POST→201, DELETE→204, resto→200) salvo que `openapi.yaml` declare otro.
4. Prefijos de montaje (`include_router`) deben hacer que la URL pública coincida con `base + path` del contrato.
5. Los schemas CON campos (tabla de arriba) son LEY: mismos nombres, tipos y obligatoriedad en tus DTO. Los que aún no tienen campos son gérmenes: rellénalos con el modelo real; **no** reescribas `openapi.yaml` para legitimar un path inventado.
6. Si el DoD te pide un comportamiento que ningún endpoint de la tabla cubre (desarchivar, restaurar, desmarcar…), NO lo resuelvas inventando una ruta: entrégalo con el endpoint que más se le parezca y **repórtalo como health check `Warning` con `check: api-contract`** para que arquitectura lo añada. Una ruta inventada es invisible para el cliente.
7. Si el repo trae `.mind/contract-pending.json` (PR #0), **quita de `pending` los EP que implementas en este mismo PR**: el test de contrato del repo (`tests/contract/`) deja de exonerarlos y pasa a exigirlos, y el runtime comprueba que no dejas los tuyos pendientes. No quites los de otras tareas.
7. Monta el guard con los códigos de la columna Roles. No inventes roles. Si Public=N y Roles=`deny-all`, NO expongas la ruta: avísalo en el PR.

## Contrato de salida del arquetipo

> El repo se genera desde el arquetipo `api` (ArqRef MAPFRE). Produce EXACTAMENTE ficheros con la estructura, rutas y HERRAMIENTA de este arquetipo, imitando el esqueleto/ejemplos de abajo. NO improvises otra herramienta ni otra disposición (p.ej. si el arquetipo usa Liquibase, NO uses Flyway). Extiende el esqueleto; no lo reinventes.

**Raíz del proyecto**: el código va bajo `sources/`, `local/`, `apps/`, `libs/`, `src/` — donde el arquetipo pone el suyo. Si el repo está vacío y tienes que andamiarlo, respeta esa raíz en vez de elegir una nueva: el resto del aprovisionamiento (pipelines del arquetipo, verificación de build, empaquetado) espera encontrarlo ahí.

### Estructura del proyecto (del arquetipo)
```
├── .gitignore
├── .github
│   ├── workflows
│   │   ├── merge-commit.yml          # Workflow para gestión de merges
│
├── README.md                        # Documentación del repositorio
├── CHANGELOG.md                     # Registro de cambios
├── CONTRIBUTING.md                   # Guía para contribuir al proyecto
│
├── sources                           # Definiciones de APIs y contratos
│   ├── polizas.yaml                   # Contrato de la API de pólizas
│
├── tests                             # Casos de prueba
│   ├── hooks.js                      # Hooks de testeo
│   ├── polizas.yml                   # Tests YAML para validación de contratos
|   ├── polizas.json                  # Proyecto Postman para pruebas de integración
│
├── documentation                     # Documentación funcional del API Gateway
│   ├── polizas.md                    # Descripción de la API de pólizas
```

---

### Esqueleto y ejemplos (imítalos exactamente)
#### `sources/README.md`
```md
Se dejaran las definiciones de las APIs y contratos en la carpeta `sources/` y se seguirán las convenciones de nombres y estructura para facilitar su identificación y uso.
```

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

### Matriz de compatibilidad de tipos
- `datetime (naive, UTC)` en `oracle`: **OK** — TIPO CANONICO del proyecto para toda marca temporal. mapped_column(DateTime(timezone=False)) -> TIMESTAMP(6). Se sella con utc_now() en el servidor y se formatea a Europe/Madrid solo en presentacion.
- `datetime (aware, con tzinfo)` en `oracle`: **PROHIBIDO** — Oracle lo soporta como TIMESTAMP WITH TIME ZONE, pero su uso esta PROHIBIDO en este proyecto: mezclar naive y aware en el mismo modelo provoca TypeError al restar fechas (calculo de days_in_current_status, time_to_resolution) y desfases en los filtros de rango inclusivo.
- `int (identificador de PK)` en `oracle`: **OK** — mapped_column(Integer, Identity(always=True), primary_key=True) -> NUMBER GENERATED ALWAYS AS IDENTITY. Es la unica forma admitida de generar PKs; no se usan secuencias manuales ni triggers.
- `str corto/medio (<= 4000)` en `oracle`: **OK** — mapped_column(String(n)) -> VARCHAR2(n CHAR). Declarar SIEMPRE la longitud explicita en caracteres, no en bytes (el parametro de sesion NLS_LENGTH_SEMANTICS no debe darse por supuesto). Ej.: description String(500), reference_code String(20), corporate_email String(254).
- `str largo (texto ilimitado) CLOB` en `oracle`: **OK** — mapped_column(CLOB) para resolution_comment y para el cuerpo del correo (body_text/body_html). No se puede indexar ni usar en DISTINCT/GROUP BY directamente; si hace falta buscar en el, usar Oracle Text o una columna VARCHAR2 derivada.
- `bytes BLOB` en `oracle`: **PROHIBIDO** — Tecnicamente soportado por Oracle, pero PROHIBIDO en este proyecto por ADR-005: la foto adjunta se guarda en el volumen persistente del contenedor (ARC-015) con clave opaca, y en Oracle solo viven los metadatos y el checksum SHA-256. Persistir binarios como BLOB cargaria la base y encareceria la copia.
- `cualquier tipo` en `h2`: **PROHIBIDO** — H2 NO es un motor de este proyecto y no puede usarse como sustituto de Oracle en los tests: no reproduce IDENTITY always, OFFSET..FETCH, SYS_EXTRACT_UTC ni la semantica de VARCHAR2(n CHAR). Los tests de integracion usan Testcontainers con Oracle 23ai Free.
- `cualquier tipo` en `sqlite`: **PROHIBIDO** — SQLite NO es un motor de este proyecto. Se declara explicitamente para bloquear el atajo de 'un sqlite en memoria para los tests': su tipado dinamico, su AUTOINCREMENT y su datetime('now') no tienen equivalencia con Oracle y ocultarian errores de DDL hasta el despliegue.

## Modelo de datos a respetar (diseñado en arquitectura — T.5, schema-names)

> Nombres FÍSICOS canónicos. Úsalos en modelos, DTOs, queries y contratos. **PROHIBIDO** traducir (`titulo`→`title`, `contenido`→`content`, `estado` `publicada|borrador`→`published|draft`). La migración ya (o va a) crear estas entidades — no improvises un esquema paralelo.

**Inventario T.5 (21):** `cat_rol`, `cat_operacion`, `permiso_rol_operacion`, `cat_oficina`, `cat_sala`, `cat_categoria_incidencia`, `cat_estado_incidencia`, `cat_transicion_incidencia`, `cat_motivo_desactivacion`, `configuracion_smtp`, `usuario`, `usuario_password_historico`, `sesion_usuario`, `incidencia`, `incidencia_adjunto`, `aviso_correo`, `usuario_historico`, `auditoria_acceso`, `incidencia_historico`, `aviso_correo_intento`, `resolucion_destinatario_log`

**Catálogos (`data_kind = catalog`): `cat_rol`, `cat_operacion`, `permiso_rol_operacion`, `cat_oficina`, `cat_sala`, `cat_categoria_incidencia`, `cat_estado_incidencia`, `cat_transicion_incidencia`, `cat_motivo_desactivacion`, `configuracion_smtp`.** Los siembra la migración: LÉELOS de la base de datos (no hardcodees sus valores en enums ni en el front) y, si al arrancar están vacíos, es un defecto de la tarea de datos — repórtalo como health check `Warning` con `check: seeds`, no lo tapes con valores por defecto.

- **Motor de datos del proyecto: Oracle no fijada en MAR2** (capa `db` del stack, aprobada en T.2/T.3). TODO el DDL y el DML que escribas debe ser válido EN ESE MOTOR y en su dialecto. Nada de tipos ni sintaxis de otros motores: si un tipo o construcción no existe en Oracle, usa su equivalente nativo. Y no te fíes de tu criterio: APLICA el changelog contra el motor real del entorno de prueba antes de entregar (ver «Entorno de prueba de esta sesión»).

### ARC-100 · `cat_rol` (table) · **catalog**
Catálogo cerrado de roles funcionales del sistema.
**Columnas:**
- `role_code` VARCHAR2(32) [PK, NOT NULL] — PK; valores cerrados: EMPLEADO, TECNICO_MANTENIMIENTO, ADMINISTRADOR
- `role_name` VARCHAR2(60) [NOT NULL] — Etiqueta legible en español; única
- `role_description` VARCHAR2(200) — Resumen de permisos del rol mostrado en la ficha de usuario
- `display_order` NUMBER [NOT NULL] — Único; orden de presentación en desplegables
- `is_active` CHAR(1) [NOT NULL] — Y/N, por defecto Y; baja lógica, sin borrado físico

### ARC-101 · `cat_operacion` (table) · **catalog**
Catálogo de operaciones funcionales autorizables de la API.
**Columnas:**
- `operation_code` VARCHAR2(50) [PK, NOT NULL] — PK; enum: INCIDENT_CREATE|INCIDENT_LIST_OWN|INCIDENT_LIST_ALL|INCIDENT_VIEW|INCIDENT_HISTORY_VIEW|INCIDENT_ASSIGN_SELF|INCIDENT_STATUS_CHANGE|INCIDENT_CLOSE_WITH_COMMENT|USER_MANAGE
- `operation_name` VARCHAR2(100) [NOT NULL] — Etiqueta legible en español
- `is_active` CHAR(1) [NOT NULL] — Y/N, por defecto Y

### ARC-102 · `permiso_rol_operacion` (table) · **catalog**
Matriz única rol x operación con el alcance de datos aplicable; fuente de verdad de la autorización.
**Columnas:**
- `permiso_id` NUMBER [PK, NOT NULL] — PK autogenerada
- `role_code` VARCHAR2(32) [NOT NULL, FK→cat_rol] — Único junto a operation_code (una sola entrada por par)
- `operation_code` VARCHAR2(50) [NOT NULL, FK→cat_operacion] — Único junto a role_code
- `data_scope` VARCHAR2(10) [NOT NULL] — enum: OWN|ALL; ausencia de fila = denegado (deny by default)

### ARC-103 · `cat_oficina` (table) · **catalog**
Catálogo de las oficinas de la organización a las que pertenecen las salas.
**Columnas:**
- `office_id` NUMBER [PK, NOT NULL] — PK autogenerada
- `office_code` VARCHAR2(10) [NOT NULL] — Único
- `office_name` VARCHAR2(80) [NOT NULL] — Máx. 80 caracteres
- `city` VARCHAR2(60) — Opcional; máx. 60 caracteres
- `is_active` CHAR(1) [NOT NULL] — Y/N, por defecto Y; no desactivable con salas activas; siempre >=1 oficina activa

### ARC-104 · `cat_sala` (table) · **catalog**
Catálogo de salas de reuniones sobre las que se reportan incidencias.
**Columnas:**
- `room_id` NUMBER [PK, NOT NULL] — PK autogenerada
- `room_code` VARCHAR2(20) [NOT NULL] — Único global; inmutable tras el alta
- `room_name` VARCHAR2(80) [NOT NULL] — 2-80 caracteres; único dentro de la misma oficina
- `office_id` NUMBER [NOT NULL, FK→cat_oficina] — Exactamente una oficina, existente y activa en el alta
- `is_active` CHAR(1) [NOT NULL] — Y/N, por defecto Y; baja lógica, sin borrado físico
- `created_at` TIMESTAMP [NOT NULL] — Fijada por el servidor
- `created_by` NUMBER [NOT NULL, FK→usuario] — Administrador que da de alta la sala
- `updated_at` TIMESTAMP — Solo tras una modificación
- `updated_by` NUMBER [FK→usuario] — Administrador que modifica la sala

### ARC-105 · `cat_categoria_incidencia` (table) · **catalog**
Catálogo cerrado de categorías de clasificación de la incidencia.
**Columnas:**
- `category_id` NUMBER [PK, NOT NULL] — PK autogenerada
- `category_code` VARCHAR2(20) [NOT NULL] — Único e inmutable; enum: MOBILIARIO|CLIMATIZACION|AUDIOVISUAL|LIMPIEZA|OTROS
- `category_name` VARCHAR2(60) [NOT NULL] — 3-60 caracteres; único sin distinguir mayúsculas; en español
- `display_order` NUMBER [NOT NULL] — Único dentro del catálogo
- `is_active` CHAR(1) [NOT NULL] — Y/N, por defecto Y; debe quedar siempre >=1 categoría activa
- `updated_at` TIMESTAMP — Trazabilidad del último cambio
- `updated_by` NUMBER [FK→usuario] — Administrador que modifica el catálogo

### ARC-106 · `cat_estado_incidencia` (table) · **catalog**
Catálogo cerrado de estados del ciclo de vida de la incidencia.
**Columnas:**
- `status_code` VARCHAR2(20) [PK, NOT NULL] — PK; enum: ABIERTA|EN_CURSO|RESUELTA|CERRADA
- `status_name` VARCHAR2(40) [NOT NULL] — Etiqueta de presentación en español
- `sort_order` NUMBER [NOT NULL] — Único; secuencia del ciclo de vida usada para ordenar
- `is_terminal` CHAR(1) [NOT NULL] — Y/N; Y solo para CERRADA
- `is_active` CHAR(1) [NOT NULL] — Y/N; no desactivable si hay incidencias vivas en ese estado

### ARC-107 · `cat_transicion_incidencia` (table) · **catalog**
Grafo de transiciones permitidas entre estados de incidencia y sus precondiciones.
**Columnas:**
- `transition_id` NUMBER [PK, NOT NULL] — PK autogenerada
- `from_status` VARCHAR2(20) [NOT NULL, FK→cat_estado_incidencia] — Único junto a to_status; distinto de to_status
- `to_status` VARCHAR2(20) [NOT NULL, FK→cat_estado_incidencia] — Único junto a from_status
- `allowed_role` VARCHAR2(32) [NOT NULL, FK→cat_rol] — Rol autorizado a ejecutar la transición
- `requires_assignee` CHAR(1) [NOT NULL] — Y/N; Y en ABIERTA->EN_CURSO
- `requires_comment` CHAR(1) [NOT NULL] — Y/N; Y en RESUELTA->CERRADA
- `is_active` CHAR(1) [NOT NULL] — Y/N, por defecto Y; par no declarado = transición denegada

### ARC-108 · `cat_motivo_desactivacion` (table) · **catalog**
Catálogo de motivos de desactivación de una cuenta de usuario.
**Columnas:**
- `reason_code` VARCHAR2(30) [PK, NOT NULL] — PK; valor obligatorio en toda desactivación
- `reason_name` VARCHAR2(120) [NOT NULL] — Etiqueta en español mostrada en el desplegable de baja
- `is_active` CHAR(1) [NOT NULL] — Y/N, por defecto Y

### ARC-109 · `configuracion_smtp` (table) · **catalog**
Parámetros del servidor de correo y del remitente usados para los avisos.
**Columnas:**
- `config_id` NUMBER [PK, NOT NULL] — PK autogenerada
- `smtp_host` VARCHAR2(255) [NOT NULL] — Sin host no se admite activar el canal
- `smtp_port` NUMBER [NOT NULL] — Entero entre 1 y 65535
- `use_tls` CHAR(1) [NOT NULL] — Y/N
- `smtp_username` VARCHAR2(255) — Solo si el servidor exige autenticación
- `smtp_password_encrypted` VARCHAR2(512) — Cifrada; write-only, nunca devuelta por la API ni escrita en logs
- `sender_address` VARCHAR2(254) [NOT NULL] — Formato de correo válido
- `sender_display_name` VARCHAR2(100) [NOT NULL] — Nombre del remitente mostrado en el correo
- `facilities_fallback_email` VARCHAR2(254) — Buzón de respaldo si no hay técnicos activos notificables
- `max_attempts` NUMBER [NOT NULL] — Máximo de reintentos de entrega; por defecto 3
- `is_active` CHAR(1) [NOT NULL] — Y/N; como máximo una configuración activa
- `updated_at` TIMESTAMP [NOT NULL] — Auditoría del cambio de configuración
- `updated_by` NUMBER [NOT NULL, FK→usuario] — Administrador que modifica la configuración

### ARC-110 · `usuario` (table) · **transactional**
Censo de personas del sistema con su rol vigente, su credencial y su estado de cuenta.
**Columnas:**
- `user_id` NUMBER [PK, NOT NULL] — PK autogenerada
- `full_name` VARCHAR2(120) [NOT NULL] — 2-120 caracteres; espacios normalizados
- `corporate_email` VARCHAR2(150) [NOT NULL] — Único global en minúsculas y sin espacios; formato email; actúa como usuario de acceso
- `role_code` VARCHAR2(32) [NOT NULL, FK→cat_rol] — Exactamente un rol vigente del catálogo cerrado
- `status` VARCHAR2(10) [NOT NULL] — enum: ACTIVO|INACTIVO; valor inicial ACTIVO
- `password_hash` VARCHAR2(255) [NOT NULL] — Hash irreversible con salt; nunca expuesto por la API ni en logs
- `password_salt` VARCHAR2(64) — Obligatorio solo si el algoritmo no lo embebe
- `password_algorithm` VARCHAR2(30) [NOT NULL] — Algoritmo adaptativo (argon2id/bcrypt) para permitir rehash
- `password_updated_at` TIMESTAMP — Referencia para revocar credenciales anteriores
- `must_change_password` CHAR(1) [NOT NULL] — Y/N; Y al alta y tras restablecimiento
- `password_expires_at` TIMESTAMP — Caducidad de la credencial temporal (48 h)
- `failed_login_attempts` NUMBER [NOT NULL] — >=0, por defecto 0; por cuenta, no por navegador
- `last_failed_login_at` TIMESTAMP — Nunca acompañado de la contraseña introducida
- `locked_until` TIMESTAMP — Bloqueo temporal vigente si es futura; no altera status
- `last_login_at` TIMESTAMP — Solo se actualiza tras un acceso correcto
- `role_changed_at` TIMESTAMP — Instante del último cambio de rol
- `role_changed_by` NUMBER [FK→usuario] — Administrador que ejecutó el último cambio de rol
- `deactivated_at` TIMESTAMP — Vacío mientras la cuenta está ACTIVO; se limpia al reactivar
- `deactivated_by` NUMBER [FK→usuario] — Administrador ejecutor; distinto de user_id
- `deactivation_reason_code` VARCHAR2(30) [FK→cat_motivo_desactivacion] — Obligatorio al desactivar
- `deactivation_note` VARCHAR2(500) — Máx. 500 caracteres
- `retention_until` DATE — Derivado = deactivated_at + 2 años; solo lectura; posterior a deactivated_at
- `created_at` TIMESTAMP [NOT NULL] — Automático, no editable
- `created_by` NUMBER [FK→usuario] — Administrador autor del alta; distinto del usuario creado; nulo solo en la cuenta semilla
- `updated_at` TIMESTAMP — Nulo si nunca se modificó
- `updated_by` NUMBER [FK→usuario] — Administrador de la última modificación

### ARC-111 · `usuario_password_historico` (table) · **event_log**
Histórico de hashes de contraseña para impedir la reutilización.
**Columnas:**
- `password_history_id` NUMBER [PK, NOT NULL] — PK autogenerada
- `user_id` NUMBER [NOT NULL, FK→usuario] — Se conservan como máximo las 3 últimas por usuario
- `password_hash` VARCHAR2(255) [NOT NULL] — Hash con salt; nunca en claro
- `created_at` TIMESTAMP [NOT NULL] — Instante en que la contraseña dejó de ser vigente

### ARC-112 · `sesion_usuario` (table) · **transactional**
Sesiones emitidas tras la autenticación, con su vigencia y su revocación.
**Columnas:**
- `session_id` VARCHAR2(36) [PK, NOT NULL] — PK (uuid); nunca viaja en la URL
- `user_id` NUMBER [NOT NULL, FK→usuario] — Una sesión pertenece a un único usuario
- `role_code` VARCHAR2(32) [NOT NULL, FK→cat_rol] — Rol vigente en el instante de la emisión
- `issued_at` TIMESTAMP [NOT NULL] — Instante de emisión
- `expires_at` TIMESTAMP [NOT NULL] — Siempre posterior a issued_at (vencimiento absoluto)
- `last_activity_at` TIMESTAMP [NOT NULL] — Se actualiza en cada petición aceptada
- `permissions_refreshed_at` TIMESTAMP — Última recarga de rol y capacidades tras un cambio de rol
- `revoked_at` TIMESTAMP — Si está informado la sesión es inválida y no se prolonga
- `revocation_reason` VARCHAR2(30) — enum: LOGOUT|EXPIRED|ADMIN|PASSWORD_CHANGE|ACCOUNT_DEACTIVATED

### ARC-113 · `incidencia` (table) · **transactional**
Aviso de problema en una sala con su clasificación, su estado y su responsable.
**Columnas:**
- `incident_id` NUMBER [PK, NOT NULL] — PK autogenerada
- `reference_code` VARCHAR2(20) [NOT NULL] — Único; formato INC-AAAA-NNNNNN
- `room_id` NUMBER [NOT NULL, FK→cat_sala] — NOT NULL; sala activa en el alta; sin borrado en cascada
- `category_id` NUMBER [NOT NULL, FK→cat_categoria_incidencia] — NOT NULL; categoría activa en el alta; sin borrado en cascada
- `room_name_snapshot` VARCHAR2(120) [NOT NULL] — Denominación de la sala vigente en el alta; inmutable
- `office_name_snapshot` VARCHAR2(120) [NOT NULL] — Denominación de la oficina vigente en el alta; inmutable
- `category_name_snapshot` VARCHAR2(60) [NOT NULL] — Denominación de la categoría vigente en el alta; inmutable
- `description` VARCHAR2(500) [NOT NULL] — 10-500 caracteres; no solo espacios; saneada de HTML
- `status_code` VARCHAR2(20) [NOT NULL, FK→cat_estado_incidencia] — Valor inicial ABIERTA fijado por el servidor
- `reported_by_user_id` NUMBER [NOT NULL, FK→usuario] — Tomado de la sesión; nunca del payload; no anulable por desactivación
- `assigned_technician_id` NUMBER [FK→usuario] — Nulo mientras no hay responsable; como máximo un técnico a la vez
- `assigned_at` TIMESTAMP — Obligatorio cuando hay técnico asignado
- `released_at` TIMESTAMP — Instante de la última liberación de responsable
- `released_by` NUMBER [FK→usuario] — Técnico responsable o administrador que libera
- `release_reason` VARCHAR2(500) — 10-500 caracteres; valor fijo TECNICO_DESACTIVADO en la liberación automática
- `resolution_comment` CLOB — Obligatorio y no vacío cuando status_code = CERRADA; inmutable tras el cierre
- `closed_by_user_id` NUMBER [FK→usuario] — Obligatorio cuando status_code = CERRADA
- `closed_at` TIMESTAMP — Obligatorio cuando status_code = CERRADA; resolved_at <= closed_at
- `created_at` TIMESTAMP [NOT NULL] — Sello de servidor; hito de apertura
- `in_progress_at` TIMESTAMP — Se sella una sola vez; created_at <= in_progress_at
- `resolved_at` TIMESTAMP — Se sella una sola vez; in_progress_at <= resolved_at
- `status_changed_at` TIMESTAMP [NOT NULL] — Fecha del último cambio de estado; base del tiempo en estado
- `status_changed_by` NUMBER [FK→usuario] — Usuario de la sesión que ejecutó la última transición
- `version` NUMBER [NOT NULL] — Concurrencia optimista; se incrementa en cada transición aceptada
- `retention_expires_at` DATE [NOT NULL] — Derivado = created_at + 24 meses; solo lectura, no editable por API
- `updated_at` TIMESTAMP [NOT NULL] — Fecha de la última modificación de la incidencia

### ARC-114 · `incidencia_adjunto` (table) · **transactional**
Metadatos de la foto opcional de una incidencia, cuyo binario reside en el almacén de ficheros.
**Columnas:**
- `attachment_id` NUMBER [PK, NOT NULL] — PK autogenerada
- `incident_id` NUMBER [NOT NULL, FK→incidencia] — Único: como máximo un adjunto por incidencia
- `file_name` VARCHAR2(255) [NOT NULL] — Saneado; máx. 255 caracteres
- `mime_type` VARCHAR2(50) [NOT NULL] — enum: image/jpeg|image/png; debe coincidir con el mime real
- `file_size_bytes` NUMBER [NOT NULL] — Máximo 5 MB
- `file_checksum` VARCHAR2(64) [NOT NULL] — SHA-256; se verifica en cada descarga
- `storage_key` VARCHAR2(255) [NOT NULL] — Única y opaca; no adivinable ni expuesta en ruta pública
- `uploaded_by_user_id` NUMBER [NOT NULL, FK→usuario] — Coincide con el reportante de la incidencia
- `stored_at` TIMESTAMP [NOT NULL] — Sello de servidor

### ARC-115 · `aviso_correo` (table) · **transactional**
Solicitud de aviso por correo con su contenido congelado y su estado de entrega.
**Columnas:**
- `notification_id` VARCHAR2(36) [PK, NOT NULL] — PK (uuid)
- `notification_key` VARCHAR2(120) [NOT NULL] — Única; idempotencia por tipo + incidencia + entrada de historial
- `notification_type` VARCHAR2(40) [NOT NULL] — enum: NEW_INCIDENT_ALERT|STATUS_CHANGE_ALERT|CREDENTIAL_ISSUED|PASSWORD_RESET
- `incident_id` NUMBER [FK→incidencia] — Informado en los avisos de incidencia
- `history_entry_id` NUMBER [FK→incidencia_historico] — Informado en los avisos de cambio de estado; un aviso por entrada
- `recipient_user_id` NUMBER [FK→usuario] — Reportante en avisos individuales; vacío en avisos a colectivo
- `recipient_email` VARCHAR2(254) — Formato RFC 5322; nulo solo si el aviso está suprimido
- `subject` VARCHAR2(255) [NOT NULL] — Máx. 255 caracteres; en español
- `body_text` CLOB [NOT NULL] — En español; sin marcadores de plantilla sin resolver; inmutable tras componerse
- `body_html` CLOB — Opcional; mismo contenido escapado
- `status_code` VARCHAR2(20) [NOT NULL] — enum: PENDIENTE|ENVIANDO|ENVIADO|FALLIDO|DESCARTADO|SUPRIMIDO; ENVIADO es final
- `suppression_reason_code` VARCHAR2(30) — enum: USUARIO_DESACTIVADO|SIN_CORREO|DESTINATARIO_NO_RESOLUBLE|NO_RECIPIENTS|COMPOSICION_INCOMPLETA
- `attempt_count` NUMBER [NOT NULL] — >=0, por defecto 0; nunca supera max_attempts
- `next_attempt_at` TIMESTAMP — Siempre futura; vacía si no procede reintento
- `last_error_code` VARCHAR2(50) — Código del último fallo de entrega
- `last_error_message` VARCHAR2(500) — Máx. 500 caracteres; nunca contiene credenciales SMTP
- `locked_by` VARCHAR2(60) — Informado solo mientras el estado es ENVIANDO
- `locked_at` TIMESTAMP — Base de la ventana de recuperación de solicitudes atascadas
- `message_id` VARCHAR2(255) — Obligatorio cuando el estado es ENVIADO
- `sent_at` TIMESTAMP — Obligatorio cuando el estado es ENVIADO
- `resent_by_user_id` NUMBER [FK→usuario] — Administrador que ordena el reenvío manual
- `resent_at` TIMESTAMP — Instante del reenvío manual
- `created_at` TIMESTAMP [NOT NULL] — Orden FIFO de procesamiento

### ARC-116 · `usuario_historico` (table) · **event_log**
Traza inmutable de los cambios de rol y de estado de cuenta de cada usuario.
**Columnas:**
- `history_id` NUMBER [PK, NOT NULL] — PK autogenerada; entrada inmutable, sin borrado físico
- `user_id` NUMBER [NOT NULL, FK→usuario] — Usuario al que pertenece la entrada
- `event_type` VARCHAR2(20) [NOT NULL] — enum: ROL|ESTADO
- `previous_value` VARCHAR2(32) — Rol o estado anterior; vacío solo en la entrada de alta; distinto de new_value
- `new_value` VARCHAR2(32) [NOT NULL] — Rol de cat_rol o estado ACTIVO|INACTIVO
- `reason_code` VARCHAR2(30) [FK→cat_motivo_desactivacion] — Obligatorio en desactivación; vacío en reactivación y en cambios de rol
- `note` VARCHAR2(500) — Máx. 500 caracteres
- `valid_to` TIMESTAMP — Cierre de la asignación de rol anterior; nunca dos vigentes a la vez
- `changed_by` NUMBER [NOT NULL, FK→usuario] — Usuario de la sesión; nunca valor del cliente
- `changed_at` TIMESTAMP [NOT NULL] — Sello de servidor; orden cronológico descendente; retención 2 años

### ARC-117 · `auditoria_acceso` (table) · **event_log**
Registro inmutable de eventos de acceso y de operaciones sensibles sobre credenciales.
**Columnas:**
- `audit_id` VARCHAR2(36) [PK, NOT NULL] — PK (uuid); entrada inmutable, sin edición ni borrado
- `user_id` NUMBER [FK→usuario] — Nulo solo en intentos fallidos sobre usuario inexistente
- `username_attempted` VARCHAR2(150) — Nunca acompañado de la contraseña introducida
- `event_type` VARCHAR2(30) [NOT NULL] — enum: LOGIN_OK|LOGIN_FAILED|ACCOUNT_LOCKED|ACCOUNT_UNLOCKED|LOGOUT|PERMISSION_DENIED|PASSWORD_CHANGED|PASSWORD_RESET
- `operation` VARCHAR2(100) — Operación o ruta denegada
- `outcome` VARCHAR2(20) [NOT NULL] — enum: OK|DENIED_401|DENIED_403
- `occurred_at` TIMESTAMP [NOT NULL] — Fijado por el servidor, nunca por el cliente
- `ip_address` VARCHAR2(45) — Opcional
- `user_agent` VARCHAR2(255) — Opcional
- `session_id` VARCHAR2(36) [FK→sesion_usuario] — Nulo en eventos previos a la emisión de sesión; nunca la credencial
- `retention_until` DATE [NOT NULL] — occurred_at + 2 años

### ARC-118 · `incidencia_historico` (table) · **event_log**
Traza append-only de alta, cambios de estado, asignaciones y reclasificaciones de la incidencia.
**Columnas:**
- `history_id` NUMBER [PK, NOT NULL] — PK autogenerada; desempate del orden cronológico; append-only
- `incident_id` NUMBER [NOT NULL, FK→incidencia] — Índice por (incident_id, changed_at)
- `entry_type` VARCHAR2(30) [NOT NULL] — enum: CREACION|CAMBIO_ESTADO|ASIGNACION|RECLASIFICACION|COMENTARIO_RESOLUCION; una sola entrada CREACION por incidencia
- `from_status` VARCHAR2(20) [FK→cat_estado_incidencia] — Nulo solo en CREACION; coincide con el estado real previo
- `to_status` VARCHAR2(20) [FK→cat_estado_incidencia] — ABIERTA en CREACION; igual a from_status en ASIGNACION
- `value_before` VARCHAR2(200) — Máx. 200; valor anterior en reclasificaciones
- `value_after` VARCHAR2(200) — Máx. 200; valor nuevo en reclasificaciones
- `previous_technician_id` NUMBER [FK→usuario] — Informado en reasignaciones y liberaciones
- `assigned_technician_id` NUMBER [FK→usuario] — Obligatorio en entradas de tipo ASIGNACION
- `entry_comment` VARCHAR2(500) — Máx. 500; nota de avance o motivo de liberación
- `resolution_comment_ref` NUMBER [FK→incidencia] — Informado solo en la transición RESUELTA->CERRADA
- `actor_user_id` NUMBER [NOT NULL, FK→usuario] — Usuario de la sesión; nunca del payload; no anulable por desactivación
- `actor_display_name` VARCHAR2(150) [NOT NULL] — Snapshot del nombre para conservar la atribución tras una baja
- `changed_at` TIMESTAMP [NOT NULL] — Sello de servidor en UTC; inmutable; retención 2 años
- `entry_hash` VARCHAR2(64) — SHA-256 encadenado con el hash de la entrada anterior de la misma incidencia

### ARC-119 · `aviso_correo_intento` (table) · **event_log**
Traza inmutable de cada intento de entrega de un aviso por correo y su resultado.
**Columnas:**
- `attempt_id` VARCHAR2(36) [PK, NOT NULL] — PK (uuid); fila append-only, sin update ni delete
- `notification_id` VARCHAR2(36) [NOT NULL, FK→aviso_correo] — Aviso al que pertenece el intento
- `attempt_number` NUMBER [NOT NULL] — >=1; correlativo y único por notification_id
- `attempted_at` TIMESTAMP [NOT NULL] — Sello de servidor; retención 2 años
- `result_code` VARCHAR2(30) [NOT NULL] — enum: SENT|TRANSIENT_ERROR|PERMANENT_ERROR|NO_RECIPIENTS|COMPOSE_ERROR|CONFIG_ERROR
- `smtp_response_code` VARCHAR2(3) — Código numérico devuelto por el servidor SMTP
- `error_code` VARCHAR2(50) — Informado cuando result_code distinto de SENT
- `error_message` VARCHAR2(500) — Máx. 500; nunca contiene credenciales SMTP
- `recipients_snapshot` CLOB — Destinatarios vigentes en el intento; solo nombre y correo corporativo
- `recipient_count` NUMBER [NOT NULL] — >=0; 0 exige result_code NO_RECIPIENTS
- `message_id` VARCHAR2(255) — Obligatorio cuando result_code = SENT

### ARC-120 · `resolucion_destinatario_log` (table) · **event_log**
Registro inmutable de cada resolución de destinatarios del directorio, individual o de colectivo.
**Columnas:**
- `resolution_id` NUMBER [PK, NOT NULL] — PK autogenerada; fila inmutable, sin borrado físico
- `request_type` VARCHAR2(20) [NOT NULL] — enum: INDIVIDUAL|COLECTIVO
- `requested_by_module` VARCHAR2(50) [NOT NULL] — Módulo consumidor de la resolución
- `subject_user_id` NUMBER [FK→usuario] — Informado solo cuando request_type = INDIVIDUAL
- `resolved_user_ids` VARCHAR2(4000) [NOT NULL] — Lista de identificadores; nunca correos en claro
- `recipient_count` NUMBER [NOT NULL] — >=0; coincide con la cardinalidad de resolved_user_ids
- `is_fallback_used` CHAR(1) [NOT NULL] — Y/N; Y solo si se usó el buzón de respaldo de facilities
- `outcome` VARCHAR2(30) [NOT NULL] — enum: OK|SIN_DESTINATARIOS|NO_ENCONTRADO|NO_NOTIFICABLE|ERROR_TECNICO; SIN_DESTINATARIOS exige recipient_count = 0
- `resolved_at` TIMESTAMP [NOT NULL] — Sello de servidor; retención 2 años
- `resolved_by_user_id` NUMBER [FK→usuario] — Informado solo cuando la consulta la lanza un administrador

## Requisitos que materializa esta tarea

### REQ-002 — El usuario autenticado debe tener exactamente un rol vigente para poder operar
El usuario autenticado debe tener exactamente un rol vigente de `cat_roles` para poder operar; un usuario sin rol vigente no puede ejecutar ninguna operación funcional (HTTP 403). Dependencia: ROL-01.
**Reglas de negocio:**
1. Un usuario sin rol vigente en `cat_roles` no tiene acceso a ninguna operación funcional del sistema
2. Un usuario autenticado tiene exactamente un rol vigente en cada instante
**Criterios de aceptación:**
1. AC-PERM-06: Dado un usuario autenticado sin rol vigente en base de datos, cuando invoca cualquier operación funcional del sistema, entonces recibe 403 y ninguna operación se ejecuta.
**Escenarios de error:**
1. El usuario autenticado no tiene un rol vigente asignado y no puede ejecutar operaciones funcionales

### REQ-009 — Resolución y aplicación en backend de los permisos efectivos del rol vigente en cada petición
La API REST resuelve y aplica en cada petición los permisos efectivos del usuario a partir de su rol vigente. Reglas: la autorización se evalúa siempre en backend, con independencia de lo que muestre la SPA; EMPLEADO puede crear incidencias y consultar solo las propias; TECNICO_MANTENIMIENTO puede ver el listado completo, autoasignarse, cambiar estado y cerrar cualquier incidencia; solo ADMINISTRADOR gestiona usuarios y roles. Cualquier operación no contemplada para el rol se deniega por defecto (deny by default). Flujo: petición autenticada → se recupera `role_code` vigente de BD → se evalúa la operación contra la matriz de permisos (§5) → se ejecuta o se deniega. Datos: `user_id`, `role_code`, `resource`, `action`, `data_scope` (enum: OWN / ALL). Validaciones: usuario activo con rol vigente (PRE-02); `role_code` ∈ `cat_roles`. Errores: 401 "Sesión no válida o expirada"; 403 "No tiene permisos para realizar esta acción" (mensaje uniforme, sin revelar existencia del recurso). CA: Given un usuario con rol empleado, when solicita el listado completo de incidencias, then recibe 403 y solo puede obtener las propias. Given un usuario con rol técnico, when solicita cualquier incidencia, then accede correctamente. Given un empleado o técnico, when invoca el endpoint de cambio de rol, then recibe 403. Seguridad: núcleo de autorización del sistema; alcance de datos por rol como arriba; sin doble factor. Dependencias: ROL-01, PRE-01. Prioridad: Must [inferido].
**Reglas de negocio:**
1. El resultado de toda decisión de autorización es el que dicta la API REST, con independencia de lo que muestre la SPA
2. Toda operación no contemplada explícitamente para el rol vigente del solicitante queda denegada (deny by default)
3. El alcance de datos de un usuario con rol EMPLEADO sobre incidencias es OWN; el de TECNICO_MANTENIMIENTO es ALL
4. El rol usado para resolver permisos es el rol vigente en base de datos en el momento de la petición
5. El mensaje de denegación es uniforme y no revela la existencia ni el estado del recurso solicitado
**Criterios de aceptación:**
1. AC-PERM-01: Dado un usuario autenticado con rol `EMPLEADO`, cuando solicita el listado completo de incidencias o el detalle de una incidencia que no reportó, entonces recibe 403 «No tiene permisos para realizar esta acción»; y cuando solicita el listado de sus incidencias, entonces recibe 200 con un conjunto de resultados donde el 100 % de los registros tiene `reported_by_user_id` igual a su propio identificador.
2. AC-PERM-02: Dado un usuario autenticado con rol `TECNICO_MANTENIMIENTO`, cuando consulta el listado completo con filtros por sala, categoría y estado, se autoasigna una incidencia ajena y cambia su estado, entonces todas las operaciones devuelven 2xx y quedan persistidas con su identificador como autor.
3. AC-PERM-03: Dado un atacante autenticado con rol `EMPLEADO` que invoca directamente los endpoints de la API omitiendo la SPA (curl/Postman), cuando recorre la totalidad del catálogo de endpoints documentado y no documentado, entonces toda operación no contemplada para su rol se deniega por defecto con 403 y no se detecta ninguna operación autorizada únicamente por ocultamiento en el frontend.
**Validaciones:**
1. La petición debe portar un identificador de sesión/credencial válido y no expirado; en caso contrario 401
2. El `role_code` vigente recuperado para el usuario debe pertenecer a `cat_roles`; un valor no reconocido invalida la resolución de permisos
3. La petición debe identificar de forma completa `resource` y `action` evaluables contra la matriz de permisos; una operación no contemplada se deniega por defecto
**Escenarios de error:**
1. Sesión no válida o expirada
2. La operación solicitada no está permitida para el rol vigente del usuario
**Campos de datos:**
- `user_id` (uuid, obligatorio) — Debe estar activo y con rol vigente
- `role_code` (enum, obligatorio) — ∈ `cat_roles`; nunca se toma de un token no revalidado
- `resource` (string, obligatorio) — Recurso solicitado que se evalúa contra la matriz de permisos
- `action` (string, obligatorio) — Deny by default si no está contemplada para el rol
- `data_scope` (enum, obligatorio) — Valores: OWN, ALL

### REQ-011 — Resolución de permisos con el rol nuevo en la siguiente petición tras un cambio de rol
Tras un cambio de rol, los permisos efectivos del usuario se resuelven con el rol nuevo en su siguiente petición. Reglas: el cambio de rol (ROL-02) invalida las capacidades cacheadas de la sesión activa del usuario afectado; la resolución de permisos usa el rol vigente en BD, nunca un rol embebido y no revalidado en el token; no se requiere que el usuario vuelva a iniciar sesión, pero sí que su siguiente petición se evalúe con el rol nuevo. Flujo: ADMINISTRADOR cambia el rol → el sistema marca la sesión del usuario como "permisos obsoletos" → en la siguiente petición se recargan rol y capacidades → la SPA refresca menú y rutas. Datos: `session_id`, `user_id`, `role_code`, `permissions_refreshed_at` (timestamp). Validaciones: la sesión debe seguir siendo válida; si el rol vigente no existe, se deniega (PRE-02). Errores: 403 "Sus permisos han cambiado; la acción solicitada ya no está autorizada"; 401 si la sesión dejó de ser válida. CA: Given un usuario con sesión abierta cuyo rol acaba de cambiar, when realiza su siguiente petición, then sus permisos se resuelven según el rol nuevo y no según el anterior. Given un empleado promovido a técnico con sesión abierta, when refresca el listado, then pasa a ver el listado completo sin cerrar sesión. Seguridad: evita ventanas de privilegio residual tras una degradación de rol. Eventos de dominio: consume `RoleChanged` [inferido]. Dependencias: ROL-02, PERM-01. Prioridad: Must [inferido].
**Reglas de negocio:**
1. Un cambio de rol invalida las capacidades cacheadas de las sesiones activas del usuario afectado
2. La primera petición posterior a un cambio de rol se evalúa con el rol nuevo y nunca con el anterior
3. Un cambio de rol no invalida la sesión del usuario afectado: no se exige un nuevo inicio de sesión
**Criterios de aceptación:**
1. AC-PERM-05: Dado un usuario con sesión abierta cuyo rol acaba de ser cambiado por el ADMINISTRADOR, cuando realiza su siguiente petición a la API sin cerrar ni reabrir sesión, entonces los permisos se resuelven con el `role_code` vigente en base de datos: un empleado promovido a técnico obtiene 200 en el listado completo y un técnico degradado a empleado obtiene 403 en la misma petición que antes le devolvía 200.
**Validaciones:**
1. `session_id` debe corresponder a una sesión existente y todavía válida; si dejó de serlo, 401
2. El `role_code` vigente en base de datos debe existir al recargar las capacidades; si no existe, la petición se deniega
3. `permissions_refreshed_at` debe ser un timestamp válido generado por el sistema en el momento de la recarga
**Escenarios de error:**
1. Los permisos del usuario han cambiado y la acción solicitada ya no está autorizada
2. La sesión ha dejado de ser válida al reevaluar los permisos
**Campos de datos:**
- `session_id` (uuid, obligatorio) — La sesión debe seguir siendo válida (401 si no)
- `user_id` (uuid, obligatorio) — Usuario cuyo rol ha cambiado
- `role_code` (enum, obligatorio) — ∈ `cat_roles`; si no hay rol vigente se deniega
- `permissions_refreshed_at` (datetime, obligatorio) — Momento de la última recarga de rol y capacidades

### REQ-013 — Toda decisión de autorización es vinculante en la API REST, nunca en la SPA
Toda decisión de autorización es vinculante en la API REST; la interfaz (SPA Angular) solo refleja el resultado y nunca constituye control de acceso. Aplica a: PERM, incidencias, gestión de usuarios.
**Reglas de negocio:**
1. Toda decisión de autorización es vinculante únicamente en la API REST; la SPA nunca constituye control de acceso
**Criterios de aceptación:**
1. AC-USR-02: Dado el conjunto de operaciones del sistema, cuando se ejecuta la matriz completa rol×operación (`EMPLEADO`, `TECNICO_DE_MANTENIMIENTO`, `ADMINISTRADOR`), entonces cada celda coincide con la matriz acordada —el empleado solo reporta y consulta lo propio, el técnico ve/asigna/resuelve cualquier incidencia, el administrador gestiona usuarios y no tiene alcance sobre incidencias— y la autorización se evalúa en la API REST en el 100 % de los casos, nunca solo en la SPA.

### REQ-018 — Resolución del rol efectivo desde base de datos, ignorando el rol enviado por el cliente
El sistema resuelve el rol efectivo de cada petición leyéndolo de la base de datos para el usuario de la sesión, ignorando cualquier rol enviado por el cliente. Reglas: (1) en cada petición autenticada el backend obtiene role_code desde la tabla de usuarios a partir del session_user_id; (2) si la petición trae rol, alcance o identificador de usuario en body, query o cabecera, se descarta silenciosamente y nunca participa en la decisión; (3) si el usuario no tiene rol o está inactivo se deniega (PRE-02). Flujo: petición → validación de sesión → lectura de role_code → construcción del contexto de autorización (session_user_id, role_code) → evaluación del permiso → ejecución. Datos: session_user_id (uuid, obligatorio), role_code (varchar, obligatorio, valor de cat_roles), is_active (boolean, obligatorio). Catálogos: cat_roles con EMPLEADO y TECNICO_MANTENIMIENTO. Validaciones: role_code debe pertenecer a cat_roles; valor desconocido deniega en vez de degradar a permisos amplios (fail-closed). Errores: sin sesión → 401 «Debes iniciar sesión para continuar»; rol ausente/desconocido/usuario inactivo → 403 «Tu usuario no tiene permisos para realizar esta acción». Aceptación: un EMPLEADO que envía role=TECNICO_MANTENIMIENTO recibe el alcance de EMPLEADO; un usuario con is_active = false recibe 403 sin efectos. Seguridad: la decisión reside en el backend Python (API REST), nunca en la SPA Angular. Dependencias: PRE-01, PRE-02.
**Reglas de negocio:**
1. El rol efectivo de una petición es únicamente el role_code almacenado en base de datos para el usuario de la sesión
2. Un rol, alcance o identificador de usuario suministrado por el cliente no participa en ninguna decisión de autorización
3. Un role_code que no pertenece a cat_roles no concede ningún permiso (fail-closed)
4. Los roles funcionales del catálogo cat_roles son exclusivamente EMPLEADO y TECNICO_MANTENIMIENTO
**Criterios de aceptación:**
1. AC-G-04: Dado el conjunto completo de operaciones funcionales del sistema (`INCIDENT_CREATE`, `INCIDENT_LIST_OWN`, `INCIDENT_LIST_ALL`, `INCIDENT_VIEW`, `INCIDENT_HISTORY_VIEW`, `INCIDENT_ASSIGN_SELF`, `INCIDENT_STATUS_CHANGE`, `INCIDENT_CLOSE_WITH_COMMENT`, `USER_MANAGE`), cuando se invoca cada operación con una sesión de rol `EMPLEADO` y con una sesión de rol `TECNICO_MANTENIMIENTO`, entonces el resultado (autorizado / `403` / alcance `OWN` o `ALL`) coincide al 100 % con la matriz rol × operación acordada, sin ninguna desviación y sin efecto lateral en las denegaciones.
2. AC-ROL-01: Dado un usuario con `role_code = EMPLEADO` en base de datos, cuando envía una petición al listado de incidencias incluyendo `role=TECNICO_MANTENIMIENTO` (o `data_scope=ALL`, o un `session_user_id` ajeno) en body, query o cabecera, entonces el sistema resuelve el rol leyéndolo de base de datos, descarta el valor recibido del cliente y devuelve exclusivamente las incidencias propias del usuario de la sesión.
3. AC-ROL-02: Dado un usuario cuya fila tiene `is_active = false`, o sin `role_code` asignado, o con un `role_code` que no pertenece a `cat_roles`, cuando invoca cualquier endpoint funcional, entonces el sistema responde `403` con el mensaje «Tu usuario no tiene permisos para realizar esta acción», no ejecuta ningún efecto y no degrada a un permiso más amplio (comportamiento fail-closed verificado en los tres casos).
**Validaciones:**
1. `session_user_id` es obligatorio y debe tener formato uuid
2. `role_code` es obligatorio y debe pertenecer al catálogo `cat_roles` (`EMPLEADO`, `TECNICO_MANTENIMIENTO`); un valor desconocido no se acepta (fail-closed)
3. Los campos `rol`, `alcance` o identificador de usuario recibidos en body, query o cabecera se descartan silenciosamente y no se admiten como entrada de la decisión
**Escenarios de error:**
1. Solicitud sin sesión válida al resolver el contexto de autorización
2. Rol del usuario de la sesión ausente o no reconocido; se deniega por defecto
3. Usuario de la sesión inactivo al evaluar la operación
**Campos de datos:**
- `session_user_id` (uuid, obligatorio) — Se obtiene de la sesión; nunca de body/query/cabecera
- `role_code` (enum, obligatorio) — Valor de `cat_roles`: EMPLEADO | TECNICO_MANTENIMIENTO; valor desconocido → deniega (fail-closed)
- `is_active` (boolean, obligatorio) — `false` → 403 sin efecto

### REQ-021 — Matriz única rol × operación en base de datos con denegación por defecto
El sistema decide cada operación de la API contra una matriz única rol × operación almacenada en base de datos, denegando por defecto lo que no esté explícitamente permitido. Reglas: (1) toda operación funcional declara un operation_code; (2) la autorización consulta la matriz role_code × operation_code; (3) fail-closed: operación sin entrada en la matriz → denegada; (4) la matriz es la fuente única de verdad, ninguna comprobación de rol se codifica dispersa en los endpoints; (5) el alcance de datos asociado (OWN / ALL) se resuelve en la misma evaluación y se aplica al repositorio, no al resultado ya cargado. Flujo: petición → contexto de autorización (ROL-01) → búsqueda del par rol/operación → permitido: se ejecuta con el data_scope resuelto; denegado: 403 sin efecto lateral. Datos: operation_code (varchar, obligatorio, valor de cat_operaciones), role_code, data_scope (OWN | ALL). Catálogos: cat_operaciones con INCIDENT_CREATE, INCIDENT_LIST_OWN, INCIDENT_LIST_ALL, INCIDENT_VIEW, INCIDENT_HISTORY_VIEW, INCIDENT_ASSIGN_SELF, INCIDENT_STATUS_CHANGE, INCIDENT_CLOSE_WITH_COMMENT, USER_MANAGE. Gap: el RFP no enumera las operaciones ni la matriz; la lista debe validarla facilities. Validaciones: no se admiten dos entradas contradictorias para el mismo par rol/operación. Errores: operación no permitida → 403; operación inexistente → 404 uniforme. Aceptación: par sin entrada → 403 sin modificar datos; TECNICO_MANTENIMIENTO con INCIDENT_LIST_ALL se autoriza con data_scope = ALL. Seguridad: el mantenimiento de la matriz es operación de ADMINISTRADOR [inferido]. Dependencias: ROL-01; operaciones de incidencia en MOD-002.
**Reglas de negocio:**
1. Toda operación funcional de la API tiene un operation_code perteneciente a cat_operaciones
2. Un par role_code × operation_code sin entrada explícita en la matriz de permisos está denegado
3. Existe como máximo una entrada en la matriz de permisos por par role_code × operation_code
4. La matriz rol × operación es la única fuente de verdad de la autorización: ninguna otra comprobación de rol coexiste con ella
**Criterios de aceptación:**
1. AC-G-02: Dado un usuario con rol `TECNICO_MANTENIMIENTO` y una incidencia en estado `ABIERTA`, cuando consulta el listado completo, se autoasigna la incidencia y ejecuta las transiciones `ABIERTA → EN_CURSO → RESUELTA → CERRADA` añadiendo comentario de resolución en el cierre, entonces las cuatro transiciones se completan sin error, `assignee_user_id` queda fijado a su usuario y el estado final persistido es `CERRADA` con `resolution_comment` no nulo.
2. AC-G-04: Dado el conjunto completo de operaciones funcionales del sistema (`INCIDENT_CREATE`, `INCIDENT_LIST_OWN`, `INCIDENT_LIST_ALL`, `INCIDENT_VIEW`, `INCIDENT_HISTORY_VIEW`, `INCIDENT_ASSIGN_SELF`, `INCIDENT_STATUS_CHANGE`, `INCIDENT_CLOSE_WITH_COMMENT`, `USER_MANAGE`), cuando se invoca cada operación con una sesión de rol `EMPLEADO` y con una sesión de rol `TECNICO_MANTENIMIENTO`, entonces el resultado (autorizado / `403` / alcance `OWN` o `ALL`) coincide al 100 % con la matriz rol × operación acordada, sin ninguna desviación y sin efecto lateral en las denegaciones.
3. AC-PERM-01: Dado un `operation_code` sin entrada explícita para el rol de la sesión en la matriz rol × operación almacenada en base de datos, cuando se invoca esa operación, entonces el sistema responde `403`, no modifica ningún dato y la decisión procede de la matriz única (ninguna comprobación de rol codificada dispersa en los endpoints, verificado por revisión de código y por ausencia de entradas contradictorias para un mismo par rol/operación).
**Validaciones:**
1. `operation_code` es obligatorio en toda operación funcional y debe pertenecer al catálogo `cat_operaciones`
2. `data_scope` asociado a una entrada de la matriz solo admite los valores `OWN` o `ALL`
3. Al dar de alta una entrada de la matriz de permisos, el par `role_code` × `operation_code` debe ser único: no se admiten dos entradas contradictorias para el mismo par
**Escenarios de error:**
1. La operación solicitada no está permitida para el rol del usuario de la sesión
2. La operación solicitada no existe o no está disponible
3. Existe una definición de permiso contradictoria para el mismo par rol/operación
4. El servicio de autorización no está disponible temporalmente y la petición se deniega sin efecto
**Campos de datos:**
- `operation_code` (enum, obligatorio) — Valor de `cat_operaciones` (INCIDENT_CREATE, INCIDENT_LIST_OWN, INCIDENT_LIST_ALL, INCIDENT_VIEW, INCIDENT_HISTORY_VIEW, INCIDENT_ASSIGN_SELF, INCIDENT_STATUS_CHANGE, INCIDENT_CLOSE_WITH_COMMENT, USER_MANAGE)
- `role_code` (enum, obligatorio) — Valor de `cat_roles`; par inexistente → denegado (fail-closed)
- `data_scope` (enum, obligatorio) — OWN | ALL; sin entradas contradictorias para el mismo par rol/operación

### REQ-031 — Denegación sin efectos laterales ni revelación del recurso protegido
Una denegación por falta de permiso o de alcance no produce efecto lateral alguno (ni cambio de estado, ni entrada de historial, ni correo) y no revela la existencia ni el contenido del recurso protegido. Aplica a: ROL, PERM, ALC y notificaciones por correo (MOD-001/MOD-002).
**Reglas de negocio:**
1. Una denegación por falta de permiso o de alcance no produce efecto lateral alguno ni revela la existencia o el contenido del recurso protegido
**Criterios de aceptación:**
1. AC-PERM-02: Dado un usuario con rol `EMPLEADO` y una incidencia en estado `ABIERTA` reportada por él mismo, cuando invoca por API `INCIDENT_ASSIGN_SELF`, `INCIDENT_STATUS_CHANGE` o `INCIDENT_CLOSE_WITH_COMMENT`, entonces recibe `403`, la incidencia permanece en `ABIERTA`, `assignee_user_id` sigue nulo, `resolution_comment` sigue nulo, el historial no registra ninguna entrada y no se envía ningún correo.
2. AC-PERM-04: Dado un atacante autenticado con rol `EMPLEADO`, cuando enumera identificadores de incidencia, de historial y de adjunto durante una sesión de pruebas dirigida, entonces no consigue distinguir un recurso ajeno existente de uno inexistente por código de estado, cuerpo, cabeceras ni tiempo de respuesta, ni obtiene ningún dato personal (nombre o correo corporativo) de terceros.

### REQ-032 — Las comprobaciones de permiso residen en el backend, no en la SPA
Las comprobaciones de permiso residen en el backend (API REST en Python); los controles de la SPA Angular son de usabilidad y nunca la única barrera. Aplica a: ROL-03, PERM, ALC.
**Reglas de negocio:**
1. La decisión de autorización reside en el backend; los controles de la SPA Angular nunca son la única barrera de permiso
**Criterios de aceptación:**
1. AC-USR-02: Dado el conjunto de operaciones del sistema, cuando se ejecuta la matriz completa rol×operación (`EMPLEADO`, `TECNICO_DE_MANTENIMIENTO`, `ADMINISTRADOR`), entonces cada celda coincide con la matriz acordada —el empleado solo reporta y consulta lo propio, el técnico ve/asigna/resuelve cualquier incidencia, el administrador gestiona usuarios y no tiene alcance sobre incidencias— y la autorización se evalúa en la API REST en el 100 % de los casos, nunca solo en la SPA.
**Escenarios de error:**
1. Acción invocada directamente contra la API pese a estar oculta en la interfaz; el backend la deniega

### REQ-060 — Autorización por rol de la sesión y acotación del alcance de datos
El sistema aplica en cada petición autenticada el rol de la sesión para autorizar o denegar la operación y para acotar el alcance de datos accesible. Reglas: EMPLEADO solo puede crear incidencias y consultar aquellas cuyo `reported_by_user_id` coincide con el suyo; TECNICO-DE-MANTENIMIENTO puede consultar cualquier incidencia, autoasignársela, cambiar su estado y registrar el comentario de resolución; ADMINISTRADOR gestiona usuarios y roles; un rol no hereda los permisos de otro salvo declaración explícita [ambigüedad: el RFP enumera dos roles pero el ADMINISTRADOR aparece como tercer actor sin permisos funcionales detallados sobre incidencias]; la autorización se resuelve en el servidor, sobre `role_code` de la sesión (SES-01), nunca sobre parámetros de la petición; el filtrado por propietario se aplica en la consulta a base de datos, no en la respuesta ya construida. Flujo: petición con sesión válida (SES-03) → resolución de `role_code` → comprobación del permiso requerido por la operación → si procede, aplicación del filtro de alcance de datos → ejecución. Datos: `role_code` (string, obligatorio, de `cat_roles`), `user_id` (uuid, propietario efectivo de la petición), `required_permission` (string, declarado por cada operación). Validaciones: toda operación declara su permiso requerido; una operación sin declaración se deniega por defecto. Errores: 403 "No tienes permisos para realizar esta acción" cuando hay sesión válida pero rol insuficiente; 404 uniforme cuando el recurso existe pero está fuera del alcance de datos del rol. Criterios: Given un EMPLEADO con sesión When solicita el listado completo de incidencias Then 403; Given un EMPLEADO When consulta una incidencia de otro empleado Then no accede a ella; Given un TECNICO-DE-MANTENIMIENTO When consulta cualquier incidencia Then accede correctamente; Given una operación sin permiso declarado When se invoca Then se deniega. Seguridad: materializa el criterio de aceptación 4 del RFP; toda denegación queda registrada (TRZ-01). Dependencias: SES-01, SES-04, módulo de gestión de usuarios y roles, MOD-002 gestión de incidencias. Prioridad: Must.
**Reglas de negocio:**
1. La autorización se resuelve sobre el `role_code` de la sesión y nunca sobre parámetros de la petición.
2. Un EMPLEADO solo tiene acceso a las incidencias cuyo `reported_by_user_id` coincide con su propio identificador.
3. Un TECNICO-DE-MANTENIMIENTO tiene acceso a cualquier incidencia, con independencia de quién la haya reportado.
4. Un rol no dispone de los permisos de otro rol salvo declaración explícita.
5. Una operación sin permiso requerido declarado está denegada para todos los roles.
6. Un recurso existente pero fuera del alcance de datos del rol es indistinguible, desde la respuesta, de un recurso inexistente.
**Criterios de aceptación:**
1. AC-PERM-01: Dado un EMPLEADO con sesión válida, cuando solicita el listado completo de incidencias o cualquier operación de gestión (autoasignación, cambio de estado, comentario de resolución), entonces el sistema responde 403 y la denegación queda registrada en la auditoría.
2. AC-PERM-02: Dado un EMPLEADO con sesión válida y una incidencia cuyo `reported_by_user_id` es de otro empleado, cuando solicita su detalle por identificador directo, entonces el sistema responde 404 uniforme sin revelar su existencia, y el filtrado por propietario se aplica en la consulta a base de datos (no sobre la respuesta ya construida).
3. AC-PERM-03: Dado un TECNICO-DE-MANTENIMIENTO con sesión válida, cuando consulta cualquier incidencia, se la autoasigna, cambia su estado y registra el comentario de resolución, entonces todas las operaciones se ejecutan correctamente sobre incidencias de cualquier empleado y de cualquiera de las tres oficinas.
4. AC-PERM-04: Dada una operación de la API que no declara su `required_permission`, cuando se invoca con una sesión válida de cualquier rol, entonces el sistema la deniega por defecto con 403; y cuando la petición incluye un rol o permiso en su cuerpo o parámetros, entonces el sistema lo ignora y autoriza exclusivamente con el `role_code` de la sesión.
5. AC-TRZ-03: Dado un ADMINISTRADOR con sesión válida, cuando consulta la auditoría de accesos filtrando por usuario y por rango de fechas, entonces obtiene los eventos correspondientes a ese filtro; y dado un EMPLEADO o un TECNICO-DE-MANTENIMIENTO, cuando intenta la misma consulta, entonces obtiene 403.
**Validaciones:**
1. Toda operación debe declarar su `required_permission`; si la declaración falta, la invocación se deniega por defecto
2. El `role_code` evaluado se toma de la sesión; se ignora cualquier rol o permiso enviado como parámetro de la petición
3. El `user_id` usado como propietario efectivo para acotar el alcance de datos procede de la sesión, no del cuerpo ni de la query de la petición
**Escenarios de error:**
1. Hay sesión válida pero el rol no dispone del permiso requerido por la operación
2. El recurso solicitado queda fuera del alcance de datos del rol: se responde de forma uniforme sin revelar su existencia
3. La operación invocada no declara el permiso que requiere y se deniega por defecto
**Campos de datos:**
- `role_code` (enum, obligatorio) — Procede de cat_roles y de la sesión, nunca de parámetros de la petición
- `user_id` (uuid, obligatorio) — El filtrado por propietario se aplica en la consulta a base de datos
- `required_permission` (string, obligatorio) — Toda operación debe declararlo; sin declaración se deniega por defecto

### REQ-064 — La identidad de atribución procede siempre del usuario de la sesión
La identidad usada para atribuir cualquier dato o acción (reportante de una incidencia, autor de un cambio de estado, destinatario de una notificación) es siempre la del usuario de la sesión, nunca un identificador enviado por el cliente. Aplica a: AUT, SES, TRZ, gestión de incidencias, notificaciones por correo.
**Reglas de negocio:**
1. La identidad que atribuye cualquier dato o acción —reportante de incidencia, autor de cambio de estado, destinatario de notificación— es la del usuario de la sesión y nunca un identificador enviado por el cliente.
**Criterios de aceptación:**
1. AC-TRZ-01: Dada una sesión iniciada, cuando el usuario ejecuta una acción registrable (reportar una incidencia, cambiar su estado, registrar comentario de resolución) enviando en el cuerpo un `user_id` distinto al de su sesión, entonces el sistema ignora el valor recibido, atribuye la acción al usuario identificado en la sesión y el dato persistido coincide con `user_id` de la sesión en el 100 % de los casos probados.

### REQ-078 — Control de acceso por rol en base de datos con denegación uniforme 403
El control de acceso se resuelve exclusivamente por el rol almacenado en base de datos (EMPLEADO, TECNICO_DE_MANTENIMIENTO, ADMINISTRADOR). La denegación es uniforme (403) y no revela la existencia ni el contenido del recurso; un usuario sin rol suficiente nunca ve datos de otros usuarios. Aplica a: todos los dominios del proyecto: credenciales, incidencias, listados y gestión de usuarios. auth_type: SESSION. data_scope: own_only.
**Reglas de negocio:**
1. El control de acceso se resuelve exclusivamente por el `role_code` almacenado en base de datos
2. Una denegación de acceso es uniforme (403) y no revela la existencia ni el contenido del recurso
3. Un usuario sin rol suficiente nunca accede a datos de otros usuarios
**Criterios de aceptación:**
1. AC-USR-03: **Dada** la matriz de permisos de los dos roles del RFP, **cuando** se ejecuta la batería completa de operaciones del sistema con cada rol, **entonces** cada operación se permite o se deniega **exactamente** según la matriz, con denegación uniforme y sin fuga de datos ajenos, en el **100 %** de los casos.
**Escenarios de error:**
1. El rol de la cuenta no autoriza la operación solicitada; la denegación es uniforme y no revela la existencia ni el contenido del recurso
**Campos de datos:**
- `role_code` (enum, obligatorio) — Único criterio de autorización: EMPLEADO, TECNICO_DE_MANTENIMIENTO, ADMINISTRADOR

### REQ-155 — La gestión del ciclo de vida de una incidencia asignada exige ser su técnico responsable
Reglas de negocio: las operaciones de avance de estado (REQ-119 abierta→en curso, REQ-120 en curso→resuelta, REQ-111 resuelta→cerrada) y la reclasificación de sala/categoría (REQ-101) sobre una incidencia con responsable solo las ejecuta ese responsable — pertenecer al rol TECNICO_DE_MANTENIMIENTO es necesario pero no suficiente; una incidencia sin responsable no puede pasar a «en curso»: el sistema exige autoasignación previa (ASG-01); la comprobación de titularidad reside en el backend, sobre el assigned_technician_id almacenado, nunca sobre dato enviado por el cliente (REQ-013, REQ-032, REQ-018); la SPA no ofrece las acciones de ciclo de vida sobre incidencias ajenas, pero la decisión vinculante es siempre del backend. Flujo: al resolver las acciones disponibles de una incidencia (REQ-121), el backend evalúa rol + estado + titularidad y devuelve el conjunto de transiciones permitidas para ese usuario concreto. Datos: assigned_technician_id (number, comparado con el id de sesión), status_code (varchar, de cat_estados_incidencia). Validaciones: existencia de responsable cuando la transición lo requiere; identidad responsable = actor. Errores: 409 «Debes asignarte la incidencia antes de ponerla en curso.»; 403 «Esta incidencia la atiende {nombre del técnico responsable}; no puedes modificar su estado.»; 403 uniforme para EMPLEADO y ADMINISTRADOR (REQ-022, REQ-031). Criterios de aceptación: Given una incidencia «abierta» sin responsable, When un técnico intenta pasarla a «en curso», Then se rechaza indicando que debe autoasignársela primero; Given una incidencia asignada al técnico A, When el técnico B intenta marcarla como resuelta, Then 403 y el estado no cambia; Given una incidencia asignada al técnico A, When A la marca como resuelta, Then la transición se acepta y se registra en el historial; Given una incidencia asignada, When la SPA pinta su detalle para un técnico que no es el responsable, Then no se le ofrecen acciones de cambio de estado. Seguridad: control de titularidad a nivel de recurso, adicional al control por rol de REQ-078; sin doble factor. Eventos de dominio: ninguno. Dependencias: ASG-01, REQ-119, REQ-120, REQ-111, REQ-121, REQ-101, REQ-117. Marcas: [inferido] el RFP dice que el técnico «puede ver, asignarse y resolver cualquier incidencia» (§2.2); se restringe por coherencia con el valor de negocio de la épica; [gap: no se define si un segundo técnico puede resolver o cerrar una incidencia asignada a otro, ni si existe figura de supervisor]. Integración: —. Prioridad: Must. Fase: —.
**Reglas de negocio:**
1. Las transiciones de estado y la reclasificación de sala o categoría de una incidencia con responsable solo son ejecutables por ese responsable
2. Pertenecer al rol `TECNICO_DE_MANTENIMIENTO` es condición necesaria pero no suficiente para gestionar el ciclo de vida de una incidencia con responsable
3. Una incidencia sin técnico responsable no puede encontrarse en estado `EN_CURSO`
4. La titularidad vinculante es la almacenada en `assigned_technician_id`, nunca un identificador aportado por el cliente
5. El conjunto de acciones de ciclo de vida disponibles sobre una incidencia para un usuario es función de su rol, del estado de la incidencia y de su titularidad
**Criterios de aceptación:**
1. AC-ASG-05: **Dado** una incidencia con técnico responsable asignado, **cuando** un técnico distinto del responsable intenta avanzar su estado (`EN_CURSO`, `RESUELTA`, `CERRADA`) o reclasificar sala/categoría, **entonces** el backend responde 403 y el estado no cambia; y **dado** una incidencia sin responsable, **cuando** un técnico intenta pasarla a «en curso», **entonces** recibe 409 indicando que debe autoasignársela primero. La comprobación se valida invocando la API directamente, sin pasar por la SPA.
**Validaciones:**
1. Si la incidencia tiene responsable, el actor de la sesión debe ser ese responsable para ejecutar el cambio de estado o la reclasificación de sala/categoría
2. El `status_code` destino enviado debe pertenecer al catálogo `cat_estados_incidencia` y ser una transición contemplada por el grafo de estados
3. El identificador de técnico no se acepta del cliente: la titularidad se comprueba contra el `assigned_technician_id` almacenado y el id de la sesión
4. La incidencia debe tener responsable informado cuando la transición solicitada lo requiere (p. ej. paso a «en curso»)
**Escenarios de error:**
1. No hay una sesión válida para realizar la operación
2. No tienes permiso para realizar esta acción
3. Esta incidencia la atiende otro técnico responsable; no puedes modificar su estado
4. La incidencia solicitada no existe
5. Debes asignarte la incidencia antes de ponerla en curso
**Campos de datos:**
- `assigned_technician_id` (integer, opcional) — FK usuario; si es NULL se bloquea el paso a EN_CURSO
- `status_code` (enum, obligatorio) — Valores de cat_estados_incidencia

## Entorno de prueba de esta sesión

NO se levanta ningún servicio de respaldo para esta tarea: verifica con tests unitarios y dobles en memoria. No intentes arrancar contenedores por tu cuenta ni asumas que hay una BBDD disponible.

**dod-oracles:** «dobles en memoria» aplica a **tests**, no al entregable. Si el DoD pide email/BBDD/evento, implementa el puerto/cliente real aunque no haya contenedor en esta sesión (Warning `entorno-de-prueba`).