# TSK-010 · Portal SPA — pantallas del Portal de Gestión de Vacaciones

- Componente dueño: `ARC-013`
- Arquetipo del repo: `private_spa` — respeta sus convenciones; NUNCA te salgas de él (ver «Contrato de salida del arquetipo»).
- Zonas de código de ESTA tarea (trabajo principal): `frontend/src/app/`. Fuera de ellas NO amplíes alcance de negocio — **EXCEPTO** el composition root y el manifiesto del host necesarios para montar lo entregado (sección Composition root).

## Definition of Done
Implementar las pantallas Angular del portal (ARC-029..ARC-052) contra la API.

## Composition root (composition-root) — OBLIGATORIO

Un módulo con router/controller que **no está montado** en el composition root del proceso NO cuenta como entregado.

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

Tus zonas (`frontend/src/app/`) pueden ya contener código de una TSK predecesora mergeada (o del esqueleto). Antes de crear tipos nuevos:

1. **Lista y lee** los ficheros bajo la zona (`ls` / abre `service.py`, `router.py`, …).
2. **EDIT/EXTIENDE** clases, funciones y exports existentes. **PROHIBIDO** una segunda `class`/`def`/export con el **mismo nombre** en el mismo fichero (en Python gana la última y el resto es basura).
3. Si esta tarea es «API pública» / «consulta» sobre el mismo dominio que un CRUD previo, **reutiliza** servicios y modelos; añade solo el router/handlers públicos (montados en el composition root).
4. Un módulo = un dueño semántico de cada símbolo top-level. Si hace falta otro tipo, **nómbralo distinto** o factoriza — no pegues un duplicado al EOF.

El runtime puede anexar la lista real de ficheros presentes en la zona al arrancar la sesión.

## Contrato API congelado (api-contract) — LEY

El `openapi.yaml` del repo (PR #0 / C.2) es el contrato de esta API. Implementa **exactamente** estos endpoints — no inventes paths, verbos ni status distintos.

| EP | Método | Path | Request | Response | Status | Public | Roles |
|----|--------|------|---------|----------|--------|--------|-------|
| `EP-001` | **GET** | `/admin/users` | `—` | `UserList` | 200 | N | `ROL-003` |
| | | _Consulta el listado de todos los usuarios del sistema (empleados y managers)._ | | | | | |
| `EP-002` | **POST** | `/admin/users` | `UserCreateRequest` | `UserDetail` | 201 | N | `ROL-003` |
| | | _Crea una nueva cuenta de usuario en el sistema._ | | | | | |
| `EP-003` | **GET** | `/admin/users/{userId}` | `—` | `UserDetail` | 200 | N | `ROL-003` |
| | | _Obtiene el detalle de una cuenta de usuario específica._ | | | | | |
| `EP-004` | **PUT** | `/admin/users/{userId}` | `UserUpdateRequest` | `UserDetail` | 200 | N | `ROL-003` |
| | | _Modifica los datos principales de un usuario (nombre, rol)._ | | | | | |
| `EP-005` | **PATCH** | `/admin/users/{userId}/status` | `UserStatusUpdateRequest` | `UserDetail` | 200 | N | `ROL-003` |
| | | _Activa o desactiva una cuenta de usuario._ | | | | | |
| `EP-006` | **GET** | `/admin/hierarchy` | `—` | `HierarchyList` | 200 | N | `ROL-003` |
| | | _Consulta la estructura jerárquica de la organización._ | | | | | |
| `EP-007` | **POST** | `/admin/employees/{employeeId}/manager` | `ManagerAssignmentRequest` | `HierarchyNodeDetail` | 201 | N | `ROL-003` |
| | | _Asigna un manager a un empleado que no tiene uno._ | | | | | |
| `EP-008` | **PUT** | `/admin/employees/{employeeId}/manager` | `ManagerAssignmentRequest` | `HierarchyNodeDetail` | 200 | N | `ROL-003` |
| | | _Modifica el manager asignado a un empleado._ | | | | | |
| `EP-009` | **DELETE** | `/admin/employees/{employeeId}/manager` | `—` | `—` | 204 | N | `ROL-003` |
| | | _Elimina la asignación de manager de un empleado._ | | | | | |
| `EP-010` | **GET** | `/profile/me` | `—` | `UserProfile` | 200 | N | `ROL-001`, `ROL-002` |
| | | _Obtiene la información del perfil del usuario autenticado._ | | | | | |
| `EP-011` | **GET** | `/profile/my-team` | `—` | `TeamMemberList` | 200 | N | `ROL-002` |
| | | _Obtiene la lista de empleados que reportan al manager autenticado._ | | | | | |
| `EP-012` | **POST** | `/vacation-requests` | `VacationRequestCreate` | `VacationRequestDetail` | 201 | N | `ROL-001`, `ROL-002` |
| | | _Crea una nueva solicitud de vacaciones para el empleado autenticado._ | | | | | |
| `EP-013` | **GET** | `/vacation-requests/my-requests` | `—` | `VacationRequestList` | 200 | N | `ROL-001`, `ROL-002` |
| | | _Obtiene el listado de las solicitudes de vacaciones del empleado autenticado._ | | | | | |
| `EP-014` | **GET** | `/vacation-requests/{requestId}` | `—` | `VacationRequestDetail` | 200 | N | `ROL-001`, `ROL-002` |
| | | _Obtiene el detalle de una solicitud de vacaciones del propio empleado._ | | | | | |
| `EP-015` | **POST** | `/vacation-requests/{requestId}/cancel` | `—` | `VacationRequestDetail` | 201 | N | `ROL-001`, `ROL-002` |
| | | _Cancela una solicitud de vacaciones propia que esté en estado 'Pendiente'._ | | | | | |
| `EP-016` | **GET** | `/vacation-requests/{requestId}/proof-document` | `—` | `FileStream` | 200 | N | `ROL-001`, `ROL-002` |
| | | _Descarga el comprobante en PDF de una solicitud de vacaciones aprobada._ | | | | | |
| `EP-017` | **GET** | `/team/vacation-requests` | `—` | `VacationRequestList` | 200 | N | `ROL-002` |
| | | _Obtiene las solicitudes de vacaciones del equipo del manager autenticado._ | | | | | |
| `EP-018` | **GET** | `/team/vacation-requests/{requestId}` | `—` | `VacationRequestDetail` | 200 | N | `ROL-002` |
| | | _Obtiene el detalle de la solicitud de un miembro del equipo del manager._ | | | | | |
| `EP-019` | **POST** | `/team/vacation-requests/{requestId}/approve` | `—` | `VacationRequestDetail` | 201 | N | `ROL-002` |
| | | _Aprueba una solicitud de vacaciones de un miembro del equipo._ | | | | | |
| `EP-020` | **POST** | `/team/vacation-requests/{requestId}/reject` | `RejectionRequest` | `VacationRequestDetail` | 201 | N | `ROL-002` |
| | | _Rechaza una solicitud de vacaciones de un miembro del equipo._ | | | | | |
| `EP-021` | **POST** | `/reports/monthly-requests/export-jobs` | `MonthlyReportRequest` | `ExportJobStatus` | 201 | N | `ROL-002` |
| | | _Inicia la generación asíncrona de un reporte CSV de solicitudes del equipo._ | | | | | |
| `EP-022` | **GET** | `/reports/export-jobs/{jobId}` | `—` | `ExportJobStatus` | 200 | N | `ROL-002` |
| | | _Consulta el estado de un trabajo de exportación y obtiene el enlace de descarga._ | | | | | |

### Campos de los schemas de tus endpoints (LEY)

Los nombres, tipos y obligatoriedad de estos campos son el contrato de DATOS: el front tipa su JSON con ellos (`libs/api-types`). Un campo renombrado (`argumentario_content` por `argumentario_venta`, `size` por `page_size`) rompe la operación aunque el path acierte — 17 en el ciclo anterior.

- `UserList`:

  | Campo | Tipo | Oblig. | Descripción |
  |---|---|---|---|
  | `items` | array | sí | Array de objetos de usuario resumidos. Cada objeto contiene: user_id, full_name, email, user_role, status. |
  | `total` | integer | sí | Número total de usuarios que coinciden con la consulta. |
  | `page` | integer | sí | Número de la página actual (base 1). |
  | `size` | integer | sí | Número de elementos por página. |

- `UserCreateRequest`:

  | Campo | Tipo | Oblig. | Descripción |
  |---|---|---|---|
  | `full_name` | string | sí | Nombre completo del usuario. |
  | `email` | string | sí | Email del usuario, que servirá como login y debe ser único. |
  | `user_role` | enum | sí | Rol del usuario. Valores admitidos: EMPLEADO, MANAGER. |
  | `initial_password` | string | no | Contraseña inicial. Si no se provee, el sistema podría generar una temporal. |

- `UserDetail`:

  | Campo | Tipo | Oblig. | Descripción |
  |---|---|---|---|
  | `user_id` | uuid | sí | Identificador único del usuario. |
  | `full_name` | string | sí | Nombre completo del usuario. |
  | `email` | string | sí | Email del usuario. |
  | `user_role` | enum | sí | Rol del usuario. Valores: EMPLEADO, MANAGER. |
  | `status` | enum | sí | Estado de la cuenta. Valores: Activo, Inactivo. |
  | `manager_name` | string | no | Nombre del manager directo del usuario, si está asignado. |

- `UserUpdateRequest`:

  | Campo | Tipo | Oblig. | Descripción |
  |---|---|---|---|
  | `full_name` | string | sí | Nuevo nombre completo del usuario. |
  | `user_role` | enum | sí | Nuevo rol del usuario. Valores admitidos: EMPLEADO, MANAGER. |

- `UserStatusUpdateRequest`:

  | Campo | Tipo | Oblig. | Descripción |
  |---|---|---|---|
  | `status` | enum | sí | Nuevo estado de la cuenta. Valores admitidos: Activo, Inactivo. |

- `HierarchyList`:

  | Campo | Tipo | Oblig. | Descripción |
  |---|---|---|---|
  | `items` | array | sí | Array de relaciones jerárquicas. Cada objeto contiene: employee_id, employee_name, employee_email, manager_id, manager_name. |
  | `total` | integer | sí | Número total de relaciones jerárquicas que coinciden con la consulta. |
  | `page` | integer | sí | Número de la página actual (base 1). |
  | `size` | integer | sí | Número de elementos por página. |

- `ManagerAssignmentRequest`:

  | Campo | Tipo | Oblig. | Descripción |
  |---|---|---|---|
  | `manager_id` | uuid | sí | Identificador único del usuario que será asignado como manager. |

- `HierarchyNodeDetail`:

  | Campo | Tipo | Oblig. | Descripción |
  |---|---|---|---|
  | `employee_id` | uuid | sí | ID del empleado. |
  | `employee_name` | string | sí | Nombre del empleado. |
  | `manager_id` | uuid | no | ID del manager asignado. Nulo si no tiene. |
  | `manager_name` | string | no | Nombre del manager asignado. Nulo si no tiene. |

- `UserProfile`:

  | Campo | Tipo | Oblig. | Descripción |
  |---|---|---|---|
  | `user_id` | uuid | sí | Identificador único del usuario. |
  | `full_name` | string | sí | Nombre completo del usuario. |
  | `email` | string | sí | Email del usuario. |
  | `user_role` | enum | sí | Rol del usuario. Valores: EMPLEADO, MANAGER. |
  | `manager_name` | string | no | Nombre del manager directo del usuario. |

- `TeamMemberList`:

  | Campo | Tipo | Oblig. | Descripción |
  |---|---|---|---|
  | `items` | array | sí | Array de objetos de miembro de equipo. Cada objeto contiene: employee_id, full_name, email. |

- `VacationRequestCreate`:

  | Campo | Tipo | Oblig. | Descripción |
  |---|---|---|---|
  | `start_date` | date | sí | Fecha de inicio de las vacaciones (formato YYYY-MM-DD). |
  | `end_date` | date | sí | Fecha de fin de las vacaciones (formato YYYY-MM-DD). |
  | `reason` | string | no | Motivo o comentario para la solicitud. |

- `VacationRequestDetail`:

  | Campo | Tipo | Oblig. | Descripción |
  |---|---|---|---|
  | `request_id` | uuid | sí | Identificador único de la solicitud. |
  | `employee_name` | string | sí | Nombre del empleado que realizó la solicitud. |
  | `start_date` | date | sí | Fecha de inicio de las vacaciones. |
  | `end_date` | date | sí | Fecha de fin de las vacaciones. |
  | `reason` | string | no | Motivo de la solicitud. |
  | `status` | enum | sí | Estado de la solicitud. Valores: Pendiente, Aprobada, Rechazada, Cancelada. |
  | `created_at` | datetime | sí | Fecha de creación de la solicitud. |
  | `resolution_date` | datetime | no | Fecha en que fue aprobada o rechazada. |
  | `manager_notes` | string | no | Comentarios del manager, como el motivo de rechazo. |

- `VacationRequestList`:

  | Campo | Tipo | Oblig. | Descripción |
  |---|---|---|---|
  | `items` | array | sí | Array de solicitudes resumidas. Cada objeto contiene: request_id, employee_name, start_date, end_date, status, created_at. |
  | `total` | integer | sí | Número total de solicitudes que coinciden con la consulta. |
  | `page` | integer | sí | Número de la página actual (base 1). |
  | `size` | integer | sí | Número de elementos por página. |

- `FileStream`: _germen sin campos en T.3 — rellénalo con el modelo real y repórtalo como health check `Warning` con `check: api-contract` para que arquitectura lo fije._
- `RejectionRequest`:

  | Campo | Tipo | Oblig. | Descripción |
  |---|---|---|---|
  | `rejection_reason` | string | no | Motivo opcional por el cual la solicitud es rechazada. |

- `MonthlyReportRequest`:

  | Campo | Tipo | Oblig. | Descripción |
  |---|---|---|---|
  | `report_month` | integer | sí | Mes para el cual se generará el reporte (1-12). |
  | `report_year` | integer | sí | Año para el cual se generará el reporte (formato YYYY). |

- `ExportJobStatus`:

  | Campo | Tipo | Oblig. | Descripción |
  |---|---|---|---|
  | `job_id` | uuid | sí | Identificador único del trabajo de exportación. |
  | `status` | enum | sí | Estado del trabajo. Valores: PENDING, PROCESSING, COMPLETED, FAILED. |
  | `download_url` | string | no | URL para descargar el fichero cuando el estado es COMPLETED. Es nulo en otros estados. |


Disciplina (api-contract):
1. Path y verbo **literales** del contrato (`/membership-plans`, no `/plans/`; `PUT`, no `PATCH` si el contrato dice PUT).
2. La base pública de la API es **`servers[0].url` del `openapi.yaml`** (p. ej. `/api`): monta los routers de forma que la URL pública sea `base + path` EXACTAMENTE. No inventes otra base ni añadas versiones (`/v1`) que el contrato no traiga: el cliente concatena `base + path` y cualquier otro prefijo le devuelve 404.
3. Status HTTP de la columna Status (POST→201, DELETE→204, resto→200) salvo que `openapi.yaml` declare otro.
4. Prefijos de montaje (`include_router`) deben hacer que la URL pública coincida con `base + path` del contrato.
5. Los schemas CON campos (tabla de arriba) son LEY: mismos nombres, tipos y obligatoriedad en tus DTO. Los que aún no tienen campos son gérmenes: rellénalos con el modelo real; **no** reescribas `openapi.yaml` para legitimar un path inventado.
6. Si el DoD te pide un comportamiento que ningún endpoint de la tabla cubre (desarchivar, restaurar, desmarcar…), NO lo resuelvas inventando una ruta: entrégalo con el endpoint que más se le parezca y **repórtalo como health check `Warning` con `check: api-contract`** para que arquitectura lo añada. Una ruta inventada es invisible para el cliente.
7. Si el repo trae `.mind/contract-pending.json` (PR #0), **quita de `pending` los EP que implementas en este mismo PR**: el test de contrato del repo (`tests/contract/`) deja de exonerarlos y pasa a exigirlos, y el runtime comprueba que no dejas los tuyos pendientes. No quites los de otras tareas.
7. Monta el guard con los códigos de la columna Roles. No inventes roles. Si Public=N y Roles=`deny-all`, NO expongas la ruta: avísalo en el PR.

## Arquetipo ArqRef (archetype-gate) — BLOCKER

El código `private_spa` **no existe** en el catálogo ArqRef local. NO improvises toolchain. Health check **Blocker** `arquetipo-desconocido` y para.

## Guía del programador del proyecto (convenciones — T.7, aprobada)

**Precedencia (handbook-filter):** si esta guía choca con el **contrato ArqRef** o el **DoD de ESTA tarea**, ganan ArqRef y el DoD. Solo se incluyen convenciones del stack de esta TSK; se omiten slices de otros lenguajes/frameworks (p. ej. Angular HttpClient en una TSK React, FastAPI en un SPA).

### Librerías del handbook (pines — dependency-pins)
Usa estas coordenadas/versiones en el manifiesto del host; no improvises latest sin pin.
- **Angular Core** `19+` [frontend] · `@angular/core`
- **Tailwind CSS** `3.x` [frontend] · `tailwindcss`
- **vitest** `1.x` [frontend] · `vitest`

### Convenciones
- **Backend: Los identificadores de entidad serán `Long` como PK y `UUID` como clave de negocio externa.** — Se usará un `Long` con una secuencia de Oracle (`@SequenceGenerator`) como clave primaria por rendimiento. Se expondrá un `UUID` (`@Column(unique=true)`) en la API para evitar exponer IDs secuenciales y mejorar la seguridad.
  - Ejemplo correcto: `@Id
@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "solicitud_seq")
@SequenceGenerator(name = "solicitud_seq", sequenceName = "SOLICITUD_SEQ", allocationSize = 1)
private Long id;

@Column(name = "UUID", nullable = false, updatable = false, unique = true)
private UUID uuid = UUID.randomUUID();`
  - Ejemplo incorrecto (evítalo): `@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id; // IDENTITY es menos performante en Oracle que SEQUENCE.`
- **Backend: Nomenclatura de base de datos en `UPPER_SNAKE_CASE`.** — Es la convención estándar y más extendida para Oracle, lo que facilita la lectura y el mantenimiento de los scripts DDL por parte de los DBAs y desarrolladores.
  - Ejemplo correcto: `CREATE TABLE VACATION_REQUESTS (
  ID NUMBER(19,0) NOT NULL PRIMARY KEY,
  START_DATE TIMESTAMP WITH TIME ZONE NOT NULL
);`
  - Ejemplo incorrecto (evítalo): `create table vacationRequests (
  id number,
  startDate timestamp
);`
- **Backend: Usar SLF4J con logging estructurado en JSON.** — El logging estructurado es fundamental para la observabilidad. Permite consultas y alertas eficientes en sistemas centralizados de logs. Se usará `logstash-logback-encoder` para formatear los logs como JSON enviados a la salida estándar.
  - Ejemplo correcto: `import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

// ...
log.info("Solicitud {} aprobada por el manager {}", request.getUuid(), manager.getUuid());`
  - Ejemplo incorrecto (evítalo): `System.out.println("Solicitud aprobada: " + request.getId());`
- **Frontend (Angular): Gestión de estado con Signals nativos y servicios simples.** — Para una aplicación de esta complejidad, la gestión de estado nativa de Angular con Signals es la opción más moderna, simple y performante. Las librerías como NgRx introducen una complejidad innecesaria. El estado global se manejará en servicios inyectables.
  - Ejemplo correcto: `@Injectable({ providedIn: 'root' })
export class SolicitudesService {
  private solicitudes = signal<Solicitud[]>([]);
  public readonly solicitudes$ = this.solicitudes.asReadonly();
}`
  - Ejemplo incorrecto (evítalo): `Uso de NgRx Store/Effects/Reducers para gestionar un simple listado de solicitudes, lo que añade un boilerplate excesivo.`
- **Frontend (Angular): Uso exclusivo de Reactive Forms para todos los formularios.** — Reactive Forms ofrece un modelo más robusto, escalable y explícito para gestionar el estado de los formularios, especialmente cuando hay validaciones dinámicas o complejas. Template-driven forms son menos predecibles y más difíciles de testear.
  - Ejemplo correcto: `this.form = this.fb.group({
  fechaInicio: ['', [Validators.required]],
  motivo: ['', [Validators.maxLength(500)]]
});`
  - Ejemplo incorrecto (evítalo): `<input name="fechaInicio" [(ngModel)]="solicitud.fechaInicio" required>`
- **Frontend (Angular): Comunicación con API a través de servicios dedicados y `HttpClient`.** — Centralizar las llamadas HTTP en servicios por funcionalidad (ej. `solicitudes.service.ts`) promueve la reutilización de código y la separación de responsabilidades. Se usará `HttpClient` con tipos fuertes para las respuestas.
  - Ejemplo correcto: `@Injectable({ providedIn: 'root' })
export class SolicitudesApiService {
  constructor(private http: HttpClient) {}

  getMisSolicitudes(page: number): Observable<Page<Solicitud>> {
    return this.http.get<Page<Solicitud>>('/api/vacation-requests/my-requests', { params: { page } });
  }
}`
  - Ejemplo incorrecto (evítalo): `Realizar una llamada `fetch('/api/...')` directamente desde un componente.`
- **Backend: Todas las transacciones de negocio se gestionan a nivel de método de Servicio con `@Transactional`.** — La capa de servicio es la que define los límites de una transacción de negocio. Aplicar `@Transactional` en esta capa asegura que todas las operaciones dentro de un caso de uso (p. ej. guardar en DB y enviar evento) se completen atómicamente. Se debe usar `readOnly=true` para optimizar las consultas.
  - Ejemplo correcto: `@Service
public class SolicitudService {
  @Transactional
  public void aprobarSolicitud(UUID id) { ... }

  @Transactional(readOnly = true)
  public Page<Solicitud> findByEmployee(UUID employeeId, Pageable pageable) { ... }
}`
  - Ejemplo incorrecto (evítalo): `@Repository
public interface SolicitudRepository extends JpaRepository<Solicitud, Long> {
  @Transactional // Antipatrón: la transacción debe ser manejada por el servicio.
  Solicitud save(Solicitud s);
}`

### Anti-patrones (PROHIBIDOS)
- Usar la estrategia de generación de PK `GenerationType.IDENTITY` con Oracle. → usa: Usar `GenerationType.SEQUENCE` con un `@SequenceGenerator` explícito. `IDENTITY` fuerza a Hibernate a hacer un `SELECT` adicional después de cada `INSERT` para recuperar el ID, mientras que `SEQUENCE` puede obtener los IDs en batch, siendo mucho más performante.
- Implementar lógica de negocio compleja dentro de los Controladores o Repositorios. → usa: La lógica de negocio, las validaciones y la orquestación de operaciones deben residir exclusivamente en la capa de Servicio. Los Controladores solo deben manejar la capa HTTP y los Repositorios solo el acceso a datos.
- Escribir consultas SQL o JPQL concatenando strings. → usa: Utilizar siempre parámetros con nombre (`:param`) o posicionales (`?1`) en las consultas JPQL o Criteria API. La concatenación de strings abre una vulnerabilidad grave de inyección de SQL.
- Realizar llamadas `fetch` o `HttpClient` directamente desde los componentes de Angular. → usa: Abstraer todas las llamadas a la API en servicios dedicados (p. ej., `solicitudes-api.service.ts`). Esto mejora la reutilización, la testeabilidad y la separación de responsabilidades.
- Hardcodear credenciales, claves de API o URLs de entorno en el código o ficheros de propiedades. → usa: Externalizar toda la configuración sensible utilizando un gestor de secretos como AWS Secrets Manager o HashiCorp Vault, e inyectarla en el entorno de ejecución.
- Loggear objetos de request/response completos que puedan contener datos sensibles. → usa: Implementar un mecanismo para enmascarar o filtrar campos sensibles (PII, contraseñas, tokens) antes de escribirlos en los logs. Se puede configurar en el `ObjectMapper` de Jackson o con un filtro de logging personalizado.
- No especificar una política de propagación de transacciones, dejando la por defecto (`REQUIRED`). → usa: Ser explícito con la gestión de transacciones. Usar `@Transactional(readOnly = true)` para todas las operaciones de consulta para optimizar el rendimiento y prevenir modificaciones accidentales. Usar `@Transactional(propagation = Propagation.REQUIRES_NEW)` para operaciones que deban ser atómicas e independientes de la transacción principal (p. ej. auditoría).

### Matriz de compatibilidad de tipos
- `OffsetDateTime` en `oracle`: **OK** — Mapeo canónico a `TIMESTAMP WITH TIME ZONE`. Es la opción recomendada para todas las fechas y horas.
- `LocalDateTime` en `oracle`: **PROHIBIDO** — Mapea a `TIMESTAMP`, perdiendo la información de zona horaria. Causa graves problemas de ambigüedad y errores de conversión.
- `Instant` en `oracle`: **PROHIBIDO** — Aunque técnicamente representa un punto en el tiempo UTC, `OffsetDateTime` es más explícito y flexible al trabajar con Oracle. Se estandariza en `OffsetDateTime` para evitar confusión.
- `LocalDate` en `oracle`: **OK** — Mapea correctamente al tipo `DATE` de Oracle, que almacena solo la fecha sin componente de hora.
- `UUID` en `oracle`: **OK** — Mapear a `VARCHAR2(36)` o `RAW(16)` con un convertidor de atributos JPA. No hay un tipo UUID nativo, pero se puede manejar eficientemente como string. Se usará `VARCHAR2(36)` por simplicidad.
- `BigDecimal` en `oracle`: **OK** — Mapeo estándar y preciso al tipo `NUMBER(precision, scale)` de Oracle. Ideal para valores monetarios o cálculos exactos.
- `String (CLOB)` en `oracle`: **OK** — Usar `@Lob` o `@Column(columnDefinition = "CLOB")` para mapear un String a un tipo `CLOB` para textos largos, como el motivo de una solicitud.
- `byte[] (BLOB)` en `oracle`: **OK** — Usar `@Lob` para mapear un array de bytes a un tipo `BLOB`, adecuado para almacenar datos binarios como ficheros pequeños (aunque para PDFs/CSVs se usará S3).

## Modelo de datos a respetar (diseñado en arquitectura — T.5, schema-names)

> Nombres FÍSICOS canónicos. Úsalos en modelos, DTOs, queries y contratos. **PROHIBIDO** traducir (`titulo`→`title`, `contenido`→`content`, `estado` `publicada|borrador`→`published|draft`). La migración ya (o va a) crear estas entidades — no improvises un esquema paralelo.

**Inventario T.5 (4):** `user_roles`, `request_status`, `users`, `vacation_requests`

**Catálogos (`data_kind = catalog`): `user_roles`, `request_status`.** Los siembra la migración: LÉELOS de la base de datos (no hardcodees sus valores en enums ni en el front) y, si al arrancar están vacíos, es un defecto de la tarea de datos — repórtalo como health check `Warning` con `check: seeds`, no lo tapes con valores por defecto.

- **Motor de datos del proyecto: Oracle** (capa `db` del stack, aprobada en T.2/T.3). TODO el DDL y el DML que escribas debe ser válido EN ESE MOTOR y en su dialecto. Nada de tipos ni sintaxis de otros motores: si un tipo o construcción no existe en Oracle, usa su equivalente nativo. Y no te fíes de tu criterio: APLICA el changelog contra el motor real del entorno de prueba antes de entregar (ver «Entorno de prueba de esta sesión»).

### ARC-025 · `user_roles` (table) · **catalog**
Catálogo de roles de usuario en el sistema.
**Columnas:**
- `id` NUMBER [PK, NOT NULL] — PK
- `role_name` VARCHAR2(50) [NOT NULL] — Valores: 'EMPLEADO', 'MANAGER', 'ADMINISTRADOR'. Único.

### ARC-026 · `request_status` (table) · **catalog**
Catálogo de los posibles estados de una solicitud de vacaciones.
**Columnas:**
- `id` NUMBER [PK, NOT NULL] — PK
- `status_name` VARCHAR2(50) [NOT NULL] — Valores: 'Pendiente', 'Aprobada', 'Rechazada', 'Cancelada'. Único.

### ARC-027 · `users` (table) · **transactional**
Almacena las cuentas de usuario (empleados, managers, administradores) y la estructura jerárquica.
**Columnas:**
- `id` NUMBER [PK, NOT NULL] — PK autogenerada
- `full_name` VARCHAR2(255) [NOT NULL]
- `email` VARCHAR2(255) [NOT NULL] — Debe ser único e inmutable.
- `password_hash` VARCHAR2(255) [NOT NULL] — Hash de la contraseña.
- `role_id` NUMBER [NOT NULL, FK→user_roles] — FK a user_roles.id
- `manager_id` NUMBER [FK→users] — FK a users.id (auto-referencia)
- `is_active` CHAR(1) [NOT NULL] — Y/N. Representa el estado 'Activo' o 'Inactivo'.
- `created_at` TIMESTAMP [NOT NULL]
- `updated_at` TIMESTAMP [NOT NULL]
**Relaciones:**
- → `user_roles`: N:1 tiene un rol
- → `users`: N:1 reporta a un manager

### ARC-028 · `vacation_requests` (table) · **transactional**
Almacena cada solicitud de vacaciones y su ciclo de vida completo.
**Columnas:**
- `id` NUMBER [PK, NOT NULL] — PK autogenerada
- `employee_id` NUMBER [NOT NULL, FK→users] — FK a users.id del empleado que solicita.
- `status_id` NUMBER [NOT NULL, FK→request_status] — FK a request_status.id
- `start_date` DATE [NOT NULL]
- `end_date` DATE [NOT NULL]
- `reason` VARCHAR2(500)
- `manager_id` NUMBER [FK→users] — FK a users.id del manager que resuelve. Nulo si está pendiente.
- `resolution_date` TIMESTAMP — Fecha de aprobación o rechazo.
- `rejection_reason` VARCHAR2(1000) — Notas del manager en caso de rechazo.
- `created_at` TIMESTAMP [NOT NULL]
- `updated_at` TIMESTAMP [NOT NULL] — Fecha del último cambio de estado.
**Relaciones:**
- → `users`: N:1 pertenece a un empleado
- → `request_status`: N:1 tiene un estado
- → `users`: N:1 es resuelta por un manager

## Plantillas corporativas de comunicación (OBLIGATORIO — no inventes HTML)

Usa estas plantillas **tal cual** (asunto + cuerpo + variables). Prohibido generar
HTML, asuntos o cuerpos alternativos. Si implementas un COMMS-*, referencia su
`template_code` y sustituye solo las variables `{{clave}}`.

### `COMMS-DOC-01` → `doc_pdf_generic` (pdf)
- Nombre: Documento PDF generico
- Variables schema: `{"type":"object","required":["titulo","referencia","fecha","cuerpo"],"properties":{"titulo":{"type":"string"},"referencia":{"type":"string"},"fecha":{"type":"string"},"cuerpo":{"type":"string"},"pie_legal":{"type":"string"}}}`

```html
<!DOCTYPE html><html><head><meta charset='utf-8'/><style>@page{size:A4;margin:2cm}body{font-family:Arial,sans-serif;color:#333;font-size:12pt}h1{color:#c8102e;font-size:18pt}.meta{color:#666;font-size:10pt;margin-bottom:24px}.footer{margin-top:40px;font-size:9pt;color:#888;border-top:1px solid #ddd;padding-top:8px}</style></head><body><h1>{{titulo}}</h1><div class="meta">Ref: {{referencia}} · Fecha: {{fecha}}</div><div>{{cuerpo}}</div><div class="footer">{{pie_legal}}</div></body></html>
```

### `COMMS-EXPORT-01` → `export_csv_manifest` (csv)
- Nombre: Manifiesto de columnas CSV
- Variables schema: `{"type":"object","required":["columnas"],"properties":{"columnas":{"type":"string"},"filtro":{"type":"string"},"fecha_generacion":{"type":"string"}}}`

```html
# CSV export manifest
# columnas={{columnas}}
# filtro={{filtro}}
# fecha_generacion={{fecha_generacion}}

```

### `COMMS-NOTIF-01` → `notif_email_status_change` (email)
- Nombre: Notificacion email de cambio de estado
- Subject: `Cambio de estado — {{titulo}}`
- Variables schema: `{"type":"object","required":["nombre","mensaje","titulo"],"properties":{"nombre":{"type":"string"},"mensaje":{"type":"string"},"titulo":{"type":"string"},"enlace":{"type":"string"},"fecha":{"type":"string"},"referencia":{"type":"string"}}}`

```html
<html><body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif"><div style="max-width:600px;margin:30px auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)"><div style="background-color:#c8102e;padding:24px 32px"><h1 style="color:#ffffff;font-size:20px;margin:0">{{titulo}}</h1></div><div style="padding:32px;color:#333333;font-size:15px;line-height:1.6"><p>Hola <strong>{{nombre}}</strong>,</p><p>El estado de <strong>{{referencia}}</strong> ha cambiado.</p><p>{{mensaje}}</p><p>Fecha: {{fecha}}</p><p><a href="{{enlace}}">Ver detalle</a></p><p>Saludos,<br/>El equipo Mapfre</p></div><div style="background-color:#f4f4f4;padding:16px 32px;font-size:12px;color:#888888;text-align:center">&copy; Mapfre. Este correo es generado automaticamente, por favor no responda a este mensaje.</div></div></body></html>
```

### `COMMS-NOTIF-02` → `notif_email_generic` (email)
- Nombre: Notificacion email generica
- Subject: `Notificacion — {{titulo}}`
- Variables schema: `{"type":"object","required":["nombre","mensaje","titulo"],"properties":{"nombre":{"type":"string"},"mensaje":{"type":"string"},"titulo":{"type":"string"},"enlace":{"type":"string"},"fecha":{"type":"string"},"referencia":{"type":"string"}}}`

```html
<html><body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif"><div style="max-width:600px;margin:30px auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)"><div style="background-color:#c8102e;padding:24px 32px"><h1 style="color:#ffffff;font-size:20px;margin:0">{{titulo}}</h1></div><div style="padding:32px;color:#333333;font-size:15px;line-height:1.6"><p>Hola <strong>{{nombre}}</strong>,</p><p>{{mensaje}}</p><p>Si tienes alguna pregunta, contacta con el equipo de soporte.</p><p>Saludos,<br/>El equipo Mapfre</p></div><div style="background-color:#f4f4f4;padding:16px 32px;font-size:12px;color:#888888;text-align:center">&copy; Mapfre. Este correo es generado automaticamente, por favor no responda a este mensaje.</div></div></body></html>
```

### `COMMS-NOTIF-03` → `notif_email_export_ready` (email)
- Nombre: Notificacion email exportacion lista
- Subject: `Exportacion lista — {{titulo}}`
- Variables schema: `{"type":"object","required":["nombre","mensaje","titulo"],"properties":{"nombre":{"type":"string"},"mensaje":{"type":"string"},"titulo":{"type":"string"},"enlace":{"type":"string"},"fecha":{"type":"string"},"referencia":{"type":"string"}}}`

```html
<html><body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif"><div style="max-width:600px;margin:30px auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)"><div style="background-color:#c8102e;padding:24px 32px"><h1 style="color:#ffffff;font-size:20px;margin:0">{{titulo}}</h1></div><div style="padding:32px;color:#333333;font-size:15px;line-height:1.6"><p>Hola <strong>{{nombre}}</strong>,</p><p>Tu exportacion <strong>{{titulo}}</strong> esta lista.</p><p>{{mensaje}}</p><p><a href="{{enlace}}">Descargar</a></p><p>Saludos,<br/>El equipo Mapfre</p></div><div style="background-color:#f4f4f4;padding:16px 32px;font-size:12px;color:#888888;text-align:center">&copy; Mapfre. Este correo es generado automaticamente, por favor no responda a este mensaje.</div></div></body></html>
```

### `COMMS-NOTIF-04` → `notif_email_status_change` (email)
- Nombre: Notificacion email de cambio de estado
- Subject: `Cambio de estado — {{titulo}}`
- Variables schema: `{"type":"object","required":["nombre","mensaje","titulo"],"properties":{"nombre":{"type":"string"},"mensaje":{"type":"string"},"titulo":{"type":"string"},"enlace":{"type":"string"},"fecha":{"type":"string"},"referencia":{"type":"string"}}}`

```html
<html><body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif"><div style="max-width:600px;margin:30px auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)"><div style="background-color:#c8102e;padding:24px 32px"><h1 style="color:#ffffff;font-size:20px;margin:0">{{titulo}}</h1></div><div style="padding:32px;color:#333333;font-size:15px;line-height:1.6"><p>Hola <strong>{{nombre}}</strong>,</p><p>El estado de <strong>{{referencia}}</strong> ha cambiado.</p><p>{{mensaje}}</p><p>Fecha: {{fecha}}</p><p><a href="{{enlace}}">Ver detalle</a></p><p>Saludos,<br/>El equipo Mapfre</p></div><div style="background-color:#f4f4f4;padding:16px 32px;font-size:12px;color:#888888;text-align:center">&copy; Mapfre. Este correo es generado automaticamente, por favor no responda a este mensaje.</div></div></body></html>
```

### `COMMS-NOTIF-05` → `notif_email_export_ready` (email)
- Nombre: Notificacion email exportacion lista
- Subject: `Exportacion lista — {{titulo}}`
- Variables schema: `{"type":"object","required":["nombre","mensaje","titulo"],"properties":{"nombre":{"type":"string"},"mensaje":{"type":"string"},"titulo":{"type":"string"},"enlace":{"type":"string"},"fecha":{"type":"string"},"referencia":{"type":"string"}}}`

```html
<html><body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif"><div style="max-width:600px;margin:30px auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)"><div style="background-color:#c8102e;padding:24px 32px"><h1 style="color:#ffffff;font-size:20px;margin:0">{{titulo}}</h1></div><div style="padding:32px;color:#333333;font-size:15px;line-height:1.6"><p>Hola <strong>{{nombre}}</strong>,</p><p>Tu exportacion <strong>{{titulo}}</strong> esta lista.</p><p>{{mensaje}}</p><p><a href="{{enlace}}">Descargar</a></p><p>Saludos,<br/>El equipo Mapfre</p></div><div style="background-color:#f4f4f4;padding:16px 32px;font-size:12px;color:#888888;text-align:center">&copy; Mapfre. Este correo es generado automaticamente, por favor no responda a este mensaje.</div></div></body></html>
```

## Entorno de prueba de esta sesión

NO se levanta ningún servicio de respaldo para esta tarea: verifica con tests unitarios y dobles en memoria. No intentes arrancar contenedores por tu cuenta ni asumas que hay una BBDD disponible.

## Fallo del intento anterior (OBLIGATORIO corregir)

La sesión previa **no entregó**. Corrige la causa antes de ampliar alcance:

> entrega vacía: no aterrizó ningún cambio de código fuera de `.mind/` (solo brief o sin commits nuevos)

Acciones:
- Reproduce el fallo lo primero. No amplíes alcance de negocio hasta corregirlo. No entregues basura para «pasar» el finalize.