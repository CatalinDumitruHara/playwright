# TSK-045 · Shell de la aplicación SPA: Layout, navegación, autenticación y servicios core

- Componente dueño: `ARC-011`
- Arquetipo del repo: `frontend-application-spa` — respeta sus convenciones; NUNCA te salgas de él (ver «Contrato de salida del arquetipo»).
- Zonas de código de ESTA tarea (trabajo principal): `apps/app/src/app/core/`, `apps/app/src/app/layout/`, `apps/app/src/app/app.config.ts`, `apps/app/src/app/app.routes.ts`. Fuera de ellas NO amplíes alcance de negocio — **EXCEPTO** el composition root y el manifiesto del host necesarios para montar lo entregado (sección Composition root).

## Definition of Done
Layout principal de la SPA con menú de navegación dinámico según rol consumiendo EP-003. Interceptor HTTP que adjunta token y gestiona 401/403. Guardias de ruta protegen el acceso a rutas no autorizadas. Scripts `start`/`build` del app shell funcionales. Establece el esqueleto para el resto de features.

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

Tus zonas (`apps/app/src/app/core/`, `apps/app/src/app/layout/`, `apps/app/src/app/app.config.ts`, `apps/app/src/app/app.routes.ts`) pueden ya contener código de una TSK predecesora mergeada (o del esqueleto). Antes de crear tipos nuevos:

1. **Lista y lee** los ficheros bajo la zona (`ls` / abre `service.py`, `router.py`, …).
2. **EDIT/EXTIENDE** clases, funciones y exports existentes. **PROHIBIDO** una segunda `class`/`def`/export con el **mismo nombre** en el mismo fichero (en Python gana la última y el resto es basura).
3. Si esta tarea es «API pública» / «consulta» sobre el mismo dominio que un CRUD previo, **reutiliza** servicios y modelos; añade solo el router/handlers públicos (montados en el composition root).
4. Un módulo = un dueño semántico de cada símbolo top-level. Si hace falta otro tipo, **nómbralo distinto** o factoriza — no pegues un duplicado al EOF.

El runtime puede anexar la lista real de ficheros presentes en la zona al arrancar la sesión.

## Contrato API congelado (api-contract) — LEY

Estos son los endpoints que publica el backend de este producto (`openapi.yaml`, PR #0 / C.2). Son los ÚNICOS que puedes llamar: no inventes paths, verbos ni parámetros, y si la pantalla necesita algo que no está en la tabla, SEÑÁLALO en el PR en vez de fabricarlo.

| EP | Método | Path | Request | Response | Status | Public | Roles |
|----|--------|------|---------|----------|--------|--------|-------|
| `EP-003` | **GET** | `/auth/sessions/current` | `—` | `SessionContext` | 200 | N | `ROL-001`, `ROL-002`, `ROL-003` |
| | | _Devuelve el contexto del usuario autenticado con su identidad y rol vigente_ | | | | | |
| `EP-001` | **POST** | `/auth/sessions` | `LoginRequest` | `SessionDetail` | 201 | Y | — |
| | | _Inicia sesión con usuario y contraseña propios y devuelve la sesión con el rol vigente_ | | | | | |
| `EP-002` | **DELETE** | `/auth/sessions/current` | `—` | `—` | 204 | N | `ROL-001`, `ROL-002`, `ROL-003` |
| | | _Cierra la sesión del usuario y la revoca en servidor_ | | | | | |
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
| `EP-039` | **GET** | `/incident-statistics` | `—` | `IncidentCountSummary` | 200 | N | `ROL-002`, `ROL-003` |
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

## Contrato de salida del arquetipo

> El repo se genera desde el arquetipo `frontend-application-spa` (ArqRef MAPFRE). Produce EXACTAMENTE ficheros con la estructura, rutas y HERRAMIENTA de este arquetipo, imitando el esqueleto/ejemplos de abajo. NO improvises otra herramienta ni otra disposición (p.ej. si el arquetipo usa Liquibase, NO uses Flyway). Extiende el esqueleto; no lo reinventes.

**Raíz del proyecto**: el código va bajo `sources/`, `local/`, `apps/`, `libs/`, `src/` — donde el arquetipo pone el suyo. Si el repo está vacío y tienes que andamiarlo, respeta esa raíz en vez de elegir una nueva: el resto del aprovisionamiento (pipelines del arquetipo, verificación de build, empaquetado) espera encontrarlo ahí.

### Esqueleto y ejemplos (imítalos exactamente)
#### `apps\app\src\app\app.routes.ts`
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
#### `apps\app\src\app\app.config.ts`
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
#### `apps\app\src\main.ts`
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
#### `apps\app\project.json`
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
#### `apps\app\public\assets\environments.json`
```json
{
  "dev": {},
  "pre": {},
  "pro": {}
}

```
#### `apps\.gitkeep`
```text

```
#### `libs\.gitkeep`
```text

```
#### `apps\app\eslint.config.mjs`
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
#### `apps\app\jest.config.ts`
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
#### `apps\app\tsconfig.app.json`
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
#### `apps\app\tsconfig.editor.json`
```json
{
  "extends": "./tsconfig.json",
  "include": ["src/**/*.ts"],
  "compilerOptions": {},
  "exclude": ["jest.config.ts", "src/**/*.test.ts", "src/**/*.spec.ts"]
}

```
#### `apps\app\tsconfig.json`
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
#### `apps\app\tsconfig.spec.json`
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
#### `apps\app\src\index.html`
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
#### `apps\app\src\styles.scss`
```scss
/* You can add global styles to this file, and also import other style files */

```
#### `apps\app\src\test-setup.ts`
```ts
import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv({
  errorOnUnknownElements: true,
  errorOnUnknownProperties: true,
});

```
#### `apps\app\src\app\app.component.html`
```html
<router-outlet></router-outlet>

```
#### `apps\app\src\app\app.component.scss`
```scss

```
#### `apps\app\src\app\app.component.ts`
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
#### `apps\app\src\app\pages\welcome\welcome.page.html`
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
#### `apps\app\src\app\pages\welcome\welcome.page.spec.ts`
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
#### `apps\app\src\app\pages\welcome\welcome.page.ts`
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

**Este repo NO trae el `.npmrc` del arquetipo**, así que `npm ci` no basta por sí solo para traer `@mapfre-tech/b2b-components`: no hay nada en el repo que enrute el scope al feed privado.

Lo que SÍ hay: el runtime de MIND enruta `@mapfre-tech` a Azure Artifacts y lleva la credencial en el entorno. Así que la librería está disponible — **instálala explícitamente** con su versión pineada:

```
npm i @mapfre-tech/b2b-components@3.12.17
```

### El `.npmrc` es ENTREGABLE (no lo omitas)

Que a ti te funcione `npm i` no basta: **el enrutado del runtime es de la plataforma, no del producto**. Sin `.npmrc` en el repo, un `npm ci` en CI o en la máquina de cualquiera muere con `E401` — el lockfile resuelve estos paquetes contra el feed privado y no hay credencial que los alcance. Pasó: en la 3ª evaluación de NoteBase el entregable solo se podía construir dentro de MIND.

Crea `.npmrc` en la raíz del repo con EXACTAMENTE esto:

```
@mapfre-tech:registry=https://pkgs.dev.azure.com/devopsmapfre/devopsmapfre/_packaging/releases/npm/registry/
//pkgs.dev.azure.com/devopsmapfre/devopsmapfre/_packaging/releases/npm/registry/:username=devopsmapfre
//pkgs.dev.azure.com/devopsmapfre/devopsmapfre/_packaging/releases/npm/registry/:_password=${BASE64_ENCODED_PERSONAL_ACCESS_TOKEN}
//pkgs.dev.azure.com/devopsmapfre/devopsmapfre/_packaging/releases/npm/registry/:email=mind@mapfre.com
```

`${BASE64_ENCODED_PERSONAL_ACCESS_TOKEN}` va **literal**: npm lo expande del entorno en cada invocación, así que el fichero no lleva secreto y quien construya (CI, otro equipo) aporta el token. **NUNCA escribas el token real** en `.npmrc` ni en ningún otro fichero. Si la instalación falla aun con esto, es la credencial del runtime: health check **Blocker** `registro-privado` y para.

| Angular del arquetipo | `b2b-components` | `formly-b2b` |
|---|---|---|
| Angular 17 – 19 | `3.12.17` | `1.2.0` |
| Angular 21+ | `4.1.8` | `2.0.0` |

Pinea la versión que corresponda a la versión de Angular **que ya declara el arquetipo** — no subas ni bajes Angular para encajar la librería.

Y si tienes que montar el esqueleto tú (repo vacío), la versión pineada (`3.12.17`) fija la banda: quédate en **Angular 17–19**, no arranques en 21+ ni por debajo de 17.3, o la librería no resuelve sus peers.

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

> 1 pantalla(s) de esta tarea. TRANSCRIBE el detalle: no inventes pantallas, rutas, etiquetas ni navegación. Cuando una pantalla trae «Detalle de UI (B.7)», ESA es la fuente autoritativa — sus `label` son el texto a pintar y su `widget` el control a usar, ya decididos y aprobados. Los bloques de la fase FLOWS son contexto: sus textos son términos de dominio (glosario), NO etiquetas de UI. Respeta el design system del arquetipo.

### ARC-092 · Acceso no autorizado
El usuario recibe el aviso uniforme de operación no permitida para su rol vigente
- **API**: esta pantalla no trae cableado pantalla→endpoint de T.5. NO lo interpretes como «no llama a la API»: elige los endpoints que necesita de la tabla del contrato congelado (sección api-contract), con su path y su verbo literales, y **repórtalo como health check `Warning` con `check: api-contract`** indicando cuáles has usado.
- **Detalle de UI (B.7) · `UIS-SHELL-045`** — FUENTE AUTORITATIVA: los `label` son el texto a pintar y el `widget` el control a usar.
  - Propósito: Shell de la SPA: layout, navegación y servicios core. Spec mínima para gate C.3 (Playwright).
  - Disposición: **genérico** (`shell`) — respétala; no rediseñes la pantalla.
  - Navegación: es PUERTA DE ENTRADA de la aplicación; sección de menú «App» (orden 0).
- Flujo `FLOW-028` · pantalla `SCR-003`
  - **Rutas:** `/acceso-no-autorizado`
  - **Componentes de UI:** Mensaje de acceso no autorizado; Botón Volver a la pantalla inicial del rol
  - **Datos que muestra:** Mensaje de acceso no autorizado; Operación o ruta solicitada; Rol vigente del usuario autenticado
  - **Acciones del usuario:** Volver a la pantalla inicial del rol
  - **Navegación:**
    - Volver a la pantalla inicial del rol → «Pantalla inicial del rol» [back]

## Requisitos que materializa esta tarea

### REQ-001 — Autenticación obligatoria con credenciales propias, sin acceso anónimo ni SSO
Toda operación del sistema exige un usuario autenticado con credenciales propias de la aplicación ("usuario y contraseña propios de la aplicación, con roles almacenados en base de datos"); no existe acceso anónimo ni SSO. Dependencia: requisito de autenticación (dominio de autenticación, otra épica).
**Reglas de negocio:**
1. Ninguna operación del sistema es accesible sin un usuario autenticado con credenciales propias de la aplicación: no existe acceso anónimo ni autenticación federada (SSO)
2. Los roles de un usuario residen en la base de datos de la aplicación y no en un proveedor de identidad externo
**Criterios de aceptación:**
1. AC-PERM-07: Dado una petición sin credenciales, con credenciales inválidas o con sesión expirada, cuando alcanza cualquier endpoint de la API, entonces recibe 401 «Sesión no válida o expirada» y no se devuelve ningún dato de negocio; no existe ningún endpoint funcional accesible de forma anónima.
**Escenarios de error:**
1. Petición recibida sin credenciales de aplicación válidas o con sesión expirada

### REQ-010 — La SPA adapta navegación y acciones visibles al rol vigente del usuario autenticado
La SPA adapta la navegación y las acciones visibles al rol vigente del usuario autenticado. Reglas: el front oculta o deshabilita las opciones no permitidas (listado completo y filtros de mantenimiento, autoasignación, cambio de estado, administración de usuarios) según `role_code`; el ocultamiento es usabilidad, no seguridad: la decisión vinculante es la de PERM-01. Idioma único español. Flujo: login → la respuesta de sesión incluye `role_code` y capacidades → guards de ruta y directivas de visibilidad filtran menú y botones → una ruta no permitida redirige a una pantalla "Acceso no autorizado". Datos: `role_code`, `capabilities[]` (lista de acciones permitidas devuelta por la API). Validaciones: si la respuesta no trae rol, la sesión se considera inválida y se fuerza re-login. Errores: pantalla "No tiene permisos para acceder a esta sección" ante 403 de la API; mensaje de sesión expirada ante 401. CA: Given un usuario con rol empleado, when inicia sesión, then no ve las opciones de listado completo ni de administración de usuarios. Given un usuario con rol técnico, when inicia sesión, then ve el listado completo con filtros por sala, categoría y estado. Seguridad: no se confía ninguna decisión de autorización al cliente. Integración: Angular SPA (front). Dependencias: PERM-01. Prioridad: Must [inferido].
**Reglas de negocio:**
1. Las opciones de navegación y acciones visibles en la SPA son un subconjunto de las capacidades devueltas por la API para el rol vigente
2. Una sesión cuya respuesta no incluye rol se considera inválida
3. La interfaz se presenta en un único idioma, español
**Criterios de aceptación:**
1. AC-PERM-04: Dado un usuario con rol `EMPLEADO`, cuando inicia sesión en la SPA, entonces el menú no muestra las opciones de listado completo, autoasignación, cambio de estado ni administración de usuarios, y la navegación directa por URL a cualquiera de esas rutas redirige a la pantalla «Acceso no autorizado»; dado un usuario con rol `TECNICO_MANTENIMIENTO`, cuando inicia sesión, entonces ve el listado completo con los tres filtros (sala, categoría, estado).
**Validaciones:**
1. La respuesta de sesión debe incluir `role_code` y `capabilities[]`; si no trae rol, la sesión se considera inválida y se fuerza re-login
**Escenarios de error:**
1. La respuesta de sesión no incluye rol vigente: la sesión se considera no válida y se solicita nuevo inicio de sesión
2. El usuario intenta acceder a una sección no permitida para su rol
**Campos de datos:**
- `role_code` (enum, obligatorio) — ∈ `cat_roles`; si falta, la sesión se considera inválida
- `capabilities` (array, obligatorio) — Uso de usabilidad, no vinculante para autorización

### REQ-013 — Toda decisión de autorización es vinculante en la API REST, nunca en la SPA
Toda decisión de autorización es vinculante en la API REST; la interfaz (SPA Angular) solo refleja el resultado y nunca constituye control de acceso. Aplica a: PERM, incidencias, gestión de usuarios.
**Reglas de negocio:**
1. Toda decisión de autorización es vinculante únicamente en la API REST; la SPA nunca constituye control de acceso
**Criterios de aceptación:**
1. AC-USR-02: Dado el conjunto de operaciones del sistema, cuando se ejecuta la matriz completa rol×operación (`EMPLEADO`, `TECNICO_DE_MANTENIMIENTO`, `ADMINISTRADOR`), entonces cada celda coincide con la matriz acordada —el empleado solo reporta y consulta lo propio, el técnico ve/asigna/resuelve cualquier incidencia, el administrador gestiona usuarios y no tiene alcance sobre incidencias— y la autorización se evalúa en la API REST en el 100 % de los casos, nunca solo en la SPA.

### REQ-032 — Las comprobaciones de permiso residen en el backend, no en la SPA
Las comprobaciones de permiso residen en el backend (API REST en Python); los controles de la SPA Angular son de usabilidad y nunca la única barrera. Aplica a: ROL-03, PERM, ALC.
**Reglas de negocio:**
1. La decisión de autorización reside en el backend; los controles de la SPA Angular nunca son la única barrera de permiso
**Criterios de aceptación:**
1. AC-USR-02: Dado el conjunto de operaciones del sistema, cuando se ejecuta la matriz completa rol×operación (`EMPLEADO`, `TECNICO_DE_MANTENIMIENTO`, `ADMINISTRADOR`), entonces cada celda coincide con la matriz acordada —el empleado solo reporta y consulta lo propio, el técnico ve/asigna/resuelve cualquier incidencia, el administrador gestiona usuarios y no tiene alcance sobre incidencias— y la autorización se evalúa en la API REST en el 100 % de los casos, nunca solo en la SPA.
**Escenarios de error:**
1. Acción invocada directamente contra la API pese a estar oculta en la interfaz; el backend la deniega

### REQ-050 — Interfaz, errores y correos en un único idioma: español
Toda la interfaz, los mensajes de error y los contenidos de correo se emiten en un único idioma, español; no hay mecanismo de selección de idioma. Aplica a: todos los dominios. auth_type: NONE. data_scope: .
**Reglas de negocio:**
1. Todo texto de interfaz, mensaje de error y contenido de correo existe únicamente en español
2. No existe ningún mecanismo de selección de idioma para el usuario

### REQ-051 — Sesión válida obligatoria para toda funcionalidad salvo el inicio de sesión
Toda funcionalidad del sistema, salvo el propio inicio de sesión, exige una sesión válida del usuario; sin ella la petición se deniega y el usuario es redirigido al inicio de sesión. Dependencia: SES-03.
**Reglas de negocio:**
1. Ninguna funcionalidad del sistema distinta del propio inicio de sesión es accesible sin una sesión válida.
**Criterios de aceptación:**
1. AC-SES-04: Dada cualquier funcionalidad del sistema distinta del propio formulario de inicio de sesión, cuando se invoca sin credencial de sesión, con credencial manipulada, revocada o caducada, entonces responde 401 con mensaje uniforme, no devuelve datos ni revela si el recurso existe; y dado un endpoint nuevo sin configuración explícita en la lista de rutas públicas, cuando se invoca sin sesión, entonces también responde 401 (protegido por defecto).
**Escenarios de error:**
1. Se solicita una funcionalidad del sistema sin una sesión válida: se deniega el acceso y se conduce al inicio de sesión

### REQ-056 — Emisión y mantenimiento de la sesión tras autenticación correcta
Tras una autenticación correcta el sistema emite una sesión que se mantiene mientras el usuario opera, sin pedirle de nuevo sus credenciales. Reglas: la sesión se materializa como credencial de sesión emitida por el backend y enviada por la SPA Angular en cada petición; tiene vencimiento por inactividad y vencimiento absoluto; mientras el usuario opera dentro de la ventana de inactividad la sesión se prolonga de forma transparente; expirada la sesión, la siguiente petición se deniega y el front lleva al inicio de sesión sin perder el contexto de la ruta solicitada; una sesión revocada (SES-02) nunca se prolonga. [inferido: el RFP solo exige que la sesión "se mantiene sin requerirle volver a introducir credenciales"]. Flujo: login correcto (AUT-01) → creación de la sesión con `user_id` y `role_code` → cada petición la valida → renovación por actividad → expiración o cierre explícito. Datos: `session_id` (uuid, PK), `user_id` (fk usuario, obligatorio), `role_code` (string, obligatorio, tomado del usuario en el momento de la emisión), `issued_at`, `expires_at`, `last_activity_at`, `revoked_at` (nullable). Validaciones: `expires_at` siempre futuro en la emisión; sesión con `revoked_at` informado se considera inválida; la credencial de sesión no viaja en la URL. Errores: 401 "Tu sesión ha caducado, vuelve a identificarte" al expirar; 401 genérico si la credencial es ilegible o manipulada. Criterios: Given una sesión activa When el usuario navega y opera Then no se le solicitan credenciales; Given una sesión sin actividad durante el periodo de inactividad When realiza una petición Then 401 y redirección al inicio de sesión; Given una sesión válida When alcanza su vencimiento absoluto Then deja de ser aceptada aunque haya habido actividad. Seguridad: aplica a EMPLEADO, TECNICO-DE-MANTENIMIENTO y ADMINISTRADOR; cada sesión solo da acceso a los datos del alcance de su rol (PERM-01). Eventos: `UserSessionStarted`. Dependencias: AUT-01. [gap: duración de la sesión por inactividad y vencimiento absoluto no especificados] [ambigüedad: "horario laboral" no concreta franja, días ni calendario]. Prioridad: Must.
**Reglas de negocio:**
1. Una sesión pertenece a un único usuario y fija el `role_code` vigente en el instante de su emisión.
2. En el momento de la emisión, `expires_at` de una sesión es posterior a `issued_at`.
3. Una sesión con `revoked_at` informado es inválida y no admite prolongación por actividad.
4. Una sesión alcanzado su vencimiento absoluto es inválida aunque haya habido actividad continuada.
5. La credencial de sesión no viaja en la URL de las peticiones.
**Criterios de aceptación:**
1. AC-SES-01: Dado un usuario con sesión activa, cuando navega y opera dentro de la ventana de inactividad configurada, entonces ninguna petición le solicita de nuevo sus credenciales y `last_activity_at` se actualiza en cada petición aceptada. [gap: duración de la sesión por inactividad no especificada en el RFP]
2. AC-SES-02: Dada una sesión que ha superado su periodo de inactividad o su vencimiento absoluto, cuando el usuario realiza cualquier petición, entonces el backend responde 401, el front limpia el estado de usuario y lo lleva al inicio de sesión conservando la ruta pretendida, y tras identificarse aterriza en esa misma ruta. [gap: vencimiento absoluto no especificado]
**Validaciones:**
1. `expires_at` debe ser un timestamp posterior al instante de emisión de la sesión
2. `user_id` y `role_code` son obligatorios en la emisión de la sesión y `role_code` se toma del usuario, no de la petición
3. La credencial de sesión debe viajar en la cabecera de la petición y nunca en la URL; se rechaza la recibida por query string
4. Una credencial de sesión con `revoked_at` informado se rechaza como entrada inválida
5. La credencial de sesión debe ser legible y no manipulada; si no puede decodificarse o su firma no valida, se rechaza
**Escenarios de error:**
1. La sesión ha caducado por inactividad o por vencimiento absoluto y debe volver a identificarse
2. La credencial de sesión presentada es ilegible o ha sido alterada
**Campos de datos:**
- `session_id` (uuid, obligatorio) — Clave primaria de la sesión; no viaja en la URL
- `user_id` (uuid, obligatorio) — Referencia al usuario autenticado
- `role_code` (enum, obligatorio) — Valores EMPLEADO, TECNICO-DE-MANTENIMIENTO, ADMINISTRADOR
- `issued_at` (datetime, obligatorio) — Momento de emisión de la sesión
- `expires_at` (datetime, obligatorio) — Debe ser siempre futuro en el momento de la emisión
- `last_activity_at` (datetime, obligatorio) — Se actualiza mientras la sesión no esté revocada
- `revoked_at` (datetime, opcional) — Nullable; si está informado la sesión se considera inválida y no se prolonga

### REQ-057 — Cierre explícito de sesión con revocación en servidor
El usuario cierra su sesión de forma explícita y sus peticiones posteriores dejan de ser aceptadas. Reglas: el cierre invalida la sesión en servidor (`revoked_at`) y no solo en el navegador; tras cerrar sesión, cualquier petición con la credencial anterior se rechaza aunque no haya vencido; el cierre de sesión es idempotente; el front borra el estado de usuario en memoria y devuelve al formulario de acceso. Flujo: el usuario pulsa "Cerrar sesión" → `POST /api/auth/logout` → revocación → redirección a la pantalla de acceso. Datos: `session_id`, `revoked_at` (timestamp), `revocation_reason` (string, valores `logout`, `expired`, `admin`). Validaciones: solo puede revocarse la sesión propia del solicitante; el ADMINISTRADOR puede revocar sesiones de otros usuarios cuando desactiva una cuenta (dependencia del módulo de usuarios). Errores: 401 "Debes iniciar sesión" si se invoca sin sesión válida; 500 "No ha sido posible cerrar la sesión". Criterios: Given un usuario con sesión iniciada When cierra sesión Then sus peticiones posteriores son rechazadas hasta que vuelva a identificarse; Given una sesión ya cerrada When se reutiliza su credencial Then 401; Given un usuario que cierra sesión When vuelve a identificarse con credenciales correctas Then obtiene una sesión nueva y distinta. Seguridad: disponible para todos los roles; el evento queda auditado (TRZ-01). Eventos: `UserSessionClosed`. Dependencias: SES-01. Prioridad: Must.
**Reglas de negocio:**
1. Una sesión revocada nunca vuelve a ser válida; una nueva identificación produce una sesión distinta de la anterior.
2. `revocation_reason` toma un valor del conjunto cerrado `logout`, `expired`, `admin`.
3. Un usuario solo puede revocar su propia sesión; únicamente el ADMINISTRADOR puede revocar sesiones ajenas, y solo al desactivar la cuenta correspondiente.
4. El cierre de sesión es idempotente: cerrar una sesión ya cerrada produce el mismo resultado observable para el usuario que cerrarla la primera vez.
**Criterios de aceptación:**
1. AC-SES-03: Dado un usuario con sesión iniciada, cuando pulsa "Cerrar sesión", entonces `revoked_at` queda informado en servidor con `revocation_reason = logout`, cualquier petición posterior con la credencial anterior responde 401 aunque no haya vencido, repetir el cierre no produce error al usuario y un nuevo inicio de sesión correcto emite un `session_id` distinto del anterior.
**Validaciones:**
1. La petición de cierre de sesión debe incluir una credencial de sesión válida
2. La sesión indicada para revocar debe coincidir con la sesión del solicitante, salvo que quien la invoca sea ADMINISTRADOR
3. `revocation_reason` debe pertenecer al conjunto cerrado `logout`, `expired`, `admin`
**Escenarios de error:**
1. Se solicita el cierre de sesión sin una sesión válida
2. Se reutiliza la credencial de una sesión ya cerrada o revocada
3. Se intenta cerrar la sesión de otro usuario sin autorización para hacerlo
4. No ha sido posible cerrar la sesión
**Campos de datos:**
- `session_id` (uuid, obligatorio) — Solo puede revocarse la sesión propia del solicitante
- `revoked_at` (datetime, obligatorio) — El cierre es idempotente sobre una sesión ya revocada
- `revocation_reason` (enum, obligatorio) — Valores logout, expired, admin

### REQ-058 — Denegación de toda petición sin sesión válida y redirección al acceso
El sistema deniega toda petición a cualquier funcionalidad realizada sin una sesión válida y conduce al usuario al inicio de sesión. Reglas: el control se aplica en el backend (todos los endpoints salvo `login` y los recursos estáticos de la SPA) y, de forma complementaria, en el enrutado del front; ninguna respuesta de un recurso protegido devuelve datos a un peticionario sin sesión; la denegación no revela si el recurso solicitado existe; la SPA conserva la ruta pretendida para retomarla tras identificarse. Flujo: petición → validación de la credencial de sesión (SES-01) → si es inválida, ausente, revocada o caducada, respuesta 401 → el interceptor del front limpia el estado y navega a la pantalla de acceso. Datos: cabecera de autorización de la petición, `session_id` resuelto, `requested_path` (string, conservado en el front para el retorno). Validaciones: lista explícita de rutas públicas (solo `login`); cualquier ruta nueva es protegida por defecto. Errores: 401 "Debes iniciar sesión para continuar" uniforme para ausencia, caducidad o revocación de sesión. Criterios: Given una petición a cualquier funcionalidad sin sesión válida When se procesa Then el sistema la deniega y redirige al inicio de sesión; Given un usuario sin sesión When escribe directamente la URL de una vista interna Then aterriza en el acceso y, tras identificarse, en la vista pretendida; Given un endpoint nuevo sin configuración explícita When se invoca sin sesión Then responde 401. Seguridad: cubre por igual las funcionalidades de EMPLEADO, TECNICO-DE-MANTENIMIENTO y ADMINISTRADOR; es la aplicación técnica de PRE-01. Integración: Angular front (interceptor y guardas de ruta). Dependencias: SES-01, PRE-01. Prioridad: Must.
**Reglas de negocio:**
1. El inicio de sesión es la única ruta pública del backend; cualquier ruta no declarada explícitamente como pública es protegida.
2. La respuesta a una petición sin sesión válida es idéntica exista o no el recurso solicitado.
3. La respuesta a una petición sin sesión válida es idéntica para ausencia, caducidad o revocación de la sesión.
**Criterios de aceptación:**
1. AC-USR-04: Dado un usuario con sesión caducada, cuando invoca cualquier operación, entonces recibe 401 «Tu sesión ha caducado, vuelve a iniciar sesión» y la SPA le redirige a la pantalla de acceso conservando la intención de navegación; y cuando se revisa el almacenamiento, entonces las contraseñas están cifradas con hash de un solo sentido y los roles residen en base de datos, sin SSO ni directorio corporativo. [pendiente mapping 1.4] (REQ-058 referenciado)
**Validaciones:**
1. Toda petición a un recurso protegido debe incluir la cabecera de autorización con la credencial de sesión; su ausencia se rechaza
2. La ruta solicitada solo se admite sin sesión si figura en la lista explícita de rutas públicas (`login` y estáticos de la SPA); cualquier otra se trata como protegida por defecto
3. `requested_path` conservado por el front para el retorno debe ser una ruta interna de la aplicación
**Escenarios de error:**
1. Petición a un recurso protegido sin sesión válida, caducada o revocada: se deniega de forma uniforme sin revelar si el recurso existe
**Campos de datos:**
- `authorization_header` (string, obligatorio) — Ausente, ilegible o manipulada produce 401 uniforme
- `session_id` (uuid, opcional) — Nullable cuando la credencial es inválida, revocada o caducada
- `requested_path` (string, opcional) — Solo se conserva en el front; la denegación no revela si el recurso existe

### REQ-059 — Resolución y exposición del contexto del usuario autenticado (identidad y rol)
La aplicación resuelve y expone el contexto del usuario autenticado (identidad y rol) para adaptar la navegación y las opciones visibles. Reglas: el contexto se obtiene siempre del servidor a partir de la sesión activa, nunca de datos enviados por el cliente; incluye nombre, correo corporativo y rol vigente; si el ADMINISTRADOR cambia el rol de un usuario con sesión abierta, el contexto refleja el rol de la sesión hasta su renovación o cierre [ambigüedad: el RFP no indica si el cambio de rol debe invalidar las sesiones activas]; ocultar una opción en el front nunca sustituye al control de acceso del servidor (PERM-01). Flujo: arranque de la SPA con sesión válida → `GET /api/auth/me` → el front pinta el menú según el rol → en cada recarga se repite la resolución. Datos: `user_id` (uuid), `full_name` (string), `email` (string, correo corporativo), `role_code` (string, obligatorio, procedente de `cat_roles`: EMPLEADO, TECNICO-DE-MANTENIMIENTO, ADMINISTRADOR), `is_active` (boolean). Validaciones: nunca se devuelven `password_hash` ni `password_salt` (AUT-02); si el usuario ha sido desactivado, la petición se rechaza como sesión inválida. Errores: 401 "Debes iniciar sesión para continuar" sin sesión válida. Criterios: Given un EMPLEADO con sesión When entra en la aplicación Then ve solo las opciones de reportar y consultar sus incidencias; Given un TECNICO-DE-MANTENIMIENTO con sesión When entra Then ve además el listado completo de incidencias; Given una respuesta de contexto When se inspecciona Then no contiene ningún dato de credencial. Seguridad: cada usuario solo obtiene su propio contexto; no permite consultar el de terceros. Integración: Angular front. Dependencias: SES-01, módulo de gestión de usuarios y roles. Prioridad: Must.
**Reglas de negocio:**
1. El contexto de identidad y rol procede siempre de la sesión activa y nunca de datos aportados por el cliente.
2. Un usuario solo obtiene su propio contexto; el contexto de terceros no es consultable.
3. `role_code` pertenece al catálogo cerrado `cat_roles`: EMPLEADO, TECNICO-DE-MANTENIMIENTO, ADMINISTRADOR.
4. Un usuario desactivado no tiene sesión válida, con independencia de que su sesión no haya vencido.
5. El rol expuesto en el contexto es el fijado en la sesión hasta su renovación o cierre, aunque el rol del usuario haya cambiado entretanto.
**Criterios de aceptación:**
1. AC-SES-05: Dado un usuario con sesión válida, cuando arranca la SPA y se resuelve `GET /api/auth/me`, entonces obtiene su nombre, correo corporativo y `role_code` procedentes del servidor (no del cliente), el menú muestra solo las opciones de su rol —EMPLEADO: reportar y consultar sus incidencias; TECNICO-DE-MANTENIMIENTO: además el listado completo— y la respuesta no contiene ningún dato de credencial ni el contexto de terceros.
**Validaciones:**
1. La respuesta de contexto no puede contener los campos `password_hash` ni `password_salt`
2. El contexto se resuelve a partir del `user_id` de la sesión; se ignora cualquier identificador de usuario recibido en la petición
3. `role_code` es obligatorio y debe pertenecer al catálogo `cat_roles` (EMPLEADO, TECNICO-DE-MANTENIMIENTO, ADMINISTRADOR)
**Escenarios de error:**
1. Se solicita el contexto de usuario sin una sesión válida, o la cuenta asociada ha dejado de estar activa
2. Se solicita el contexto de un usuario distinto al de la sesión
**Campos de datos:**
- `user_id` (uuid, obligatorio) — Se obtiene del servidor, nunca de datos enviados por el cliente
- `full_name` (string, obligatorio) — Dato personal limitado a nombre y correo corporativo
- `email` (email, obligatorio) — Formato de correo corporativo
- `role_code` (enum, obligatorio) — Valores del catálogo cat_roles: EMPLEADO, TECNICO-DE-MANTENIMIENTO, ADMINISTRADOR
- `is_active` (boolean, obligatorio) — Si el usuario ha sido desactivado la petición se rechaza como sesión inválida

### REQ-067 — Sesión autenticada vigente exigida salvo login y reposición de acceso
Salvo el inicio de sesión y la reposición de acceso, toda operación exige sesión autenticada vigente; sin sesión válida el sistema responde 401 y redirige al login. Dependencia: inicio de sesión (épica de autenticación, fuera de este alcance). auth_type: SESSION. data_scope: own_only.
**Reglas de negocio:**
1. Toda operación distinta del inicio de sesión y de la reposición de acceso exige una sesión autenticada vigente
**Criterios de aceptación:**
1. AC-XFN-01: Dado una petición sin sesión autenticada vigente a cualquier operación distinta del inicio de sesión, cuando se ejecuta, entonces el sistema responde 401 y el frontend redirige al login sin exponer datos de la operación.
**Escenarios de error:**
1. La petición no aporta una sesión autenticada vigente y se redirige al inicio de sesión
2. La sesión ha caducado o ha sido revocada y ya no es válida

## Entorno de prueba de esta sesión

Antes de arrancar tu sesión, la plataforma levanta los servicios de abajo como contenedores efímeros y deja sus datos de conexión en `.mind/TSK-045/env.sh` (y en `env.json`). Contrato de uso:

- **Haz `source .mind/TSK-045/env.sh` antes de cada build/test** que necesite el entorno; si el fichero no existe, el entorno NO se pudo levantar (ver el final de esta sección).
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

**Playwright — la plataforma lo EJECUTA** cuando la `PlaywrightTriggerPolicy` detecta impacto UI (templates/CSS/rutas/componentes compartidos ≥2 imports/shell). In-session: tags `@smoke`/`@functional` en `e2e/*.e2e-spec.ts`. Post-PR: `@visual` con capturas efímeras (sin baselines en el repo). Extiende esas specs; no las renombres a `*.spec.ts` (chocan con Jest/Karma).

**Navegador para los tests**: el runtime trae Chromium y `CHROME_BIN` ya apunta a él, así que NO lo instales ni lo descargues. Pero corre en un contenedor sin privilegios, así que su sandbox no puede activarse: usa un launcher headless con `--no-sandbox` (en Karma, un `customLaunchers` que extienda `ChromeHeadless`; en Playwright, `args: ['--no-sandbox']`). Sin eso el navegador está pero no arranca, y el síntoma no lo dice.

### Si el entorno no está disponible
Comprueba `.mind/TSK-045/env.json`: si su `status` es `unavailable` o `degraded`, la plataforma no pudo darte (todo) el entorno. En ese caso ESCRIBE igualmente los tests de integración y déjalos en el entregable, y repórtalo como health check **Warning** con `check: entorno-de-prueba` — NO como Blocker: no es un defecto de tu tarea, y la verificación queda diferida al CI. Reserva el Blocker para cuando el entorno SÍ estaba y los tests fallan por el código o por el brief.

## Fallo del intento anterior (OBLIGATORIO corregir)

La sesión previa **no entregó**. Corrige la causa antes de ampliar alcance:

> delivery-gate/build: la verificación bloqueó la entrega.
npm error code ERESOLVE
npm error ERESOLVE could not resolve
npm error
npm error While resolving: @mapfre-tech/formly-b2b@1.2.0
npm error Found: @angular/forms@17.3.12
npm error node_modules/@angular/forms
npm error   @angular/forms@"~17.3.0" from the root project
npm error   peer @angular/forms@"^17.0.0 || ^18.0.0" from @angular/material@17.3.10
npm error   node_modules/@angular/material
npm error     @angular/material@"~17.3.0" from the root project
npm error     peer @angular/material@"17.3.10" from @angular/material-date-fns-adapter@17.3.10
npm error     node_modules/@angular/material-date-fns-adapter
npm error       @angular/material-date-fns-adapter@"~17.3.0" from the root project
npm error       1 more (@mapfre-tech/formly-b2b)
npm error     1 more (@mapfre-tech/formly-b2b)
npm error   2 more (@mapfre-tech/b2b-components, @mapfre-tech/formly-b2b)
npm error
npm error Could not resolve dependency:
npm error peer @ngx-formly/core@">=6.3.5" from @mapfre-tech/formly-b2b@1.2.0
npm error node_modules/@mapfre-tech/formly-b2b
npm error   @mapfre-tech/formly-b2b@"1.2.0" from the root project
npm error
npm error Conflicting peer dependency: @angular/forms@21.2.24
npm error node_modules/@angular/forms
npm error   peer @angular/forms@">=19.0.0" from @ngx-formly/core@8.0.0
npm error   node_modules/@ngx-formly/core
npm error     peer @ngx-formly/core@">=6.3.5" from @mapfre-tech/formly-b2b@1.2.0
npm error     node_modules/@mapfre-tech/formly-b2b
npm error       @mapfre-tech/formly-b2b@"1.2.0" from the root project
npm error
npm error Fix the upstream dependency conflict, or retry
npm error this command with --force or --legacy-peer-deps
npm error to accept an incorrect (and potentially broken) dependency resolution.
npm error
npm error
npm error For a full report see:
npm error /home/agent/.npm/_logs/2026-09-28T13_59_29_585Z-eresolve-report.txt
npm error A complete log of this run can be found in: /home/agent/.npm/_log

Acciones:
- NO stages ni commits de `node_modules/`, `dist/`, `.angular/`, caches ni blobs concatenados; solo código de producto bajo las zonas / composition root.
- Si instalaste deps en el workspace, deja `node_modules` fuera de git (`.gitignore`). Reescribe el path canónico con `write_file` (pisa, no concatenes).
- El runtime hace el push: no inventes `git add -A` de basura para «arreglar» el finalize.