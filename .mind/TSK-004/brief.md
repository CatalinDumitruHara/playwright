# TSK-004 · Ciclo de Vida de Solicitudes de Vacaciones (Empleado)

- Componente dueño: `ARC-015`
- Arquetipo del repo: `container-java` — respeta sus convenciones; NUNCA te salgas de él (ver «Contrato de salida del arquetipo»).
- Zonas de código de ESTA tarea (trabajo principal): `sources/src/main/java/com/mapfre/product/microservice/requests/`, `sources/src/main/java/com/mapfre/product/microservice/Application.java`. Fuera de ellas NO amplíes alcance de negocio — **EXCEPTO** el composition root y el manifiesto del host necesarios para montar lo entregado (sección Composition root).

## Definition of Done
Implementa la lógica para crear, consultar, detallar y cancelar solicitudes propias (own_only). Los DTOs y la persistencia usan los nombres físicos del esquema T.5 (`vacation_requests`, `request_status`). El `SolicitudVacacionesController` está montado en `Application.java`. Tests de integración verifican la creación (POST 201), consulta con filtros (GET 200) y cancelación (POST 200), validando las reglas de negocio (fechas, estado 'Pendiente'). Se asume que el esquema T.5 ya está aplicado.

## Oráculos de verificación (dod-oracles) — OBLIGATORIO

El DoD se evalúa por **comportamiento**, no porque exista un fichero o un string «implementado». Lo siguiente es **Blocker** si lo usas como entrega de producto (los dobles solo valen en tests):

- **Auth / rol (p. ej. ADMINISTRADOR):** dependency o middleware que devuelve 401/403 sin credencial/rol; tests con y sin permiso. **Un CRUD abierto no cumple «solo admin».**
- **Persistencia:** driver del stack del arquetipo (Motor/SQLAlchemy/…) contra el motor de prueba o Testcontainers. **`dict` / `db_*` in-memory en el módulo de producto ≠ base de datos.**

Si el entorno de prueba no levanta el servicio necesario: escribe el código de producto real + tests, declara Warning `entorno-de-prueba`, y **NO** sustituyas el DoD con un fake en el código entregado.

## Composition root (composition-root) — OBLIGATORIO

Un módulo con router/controller que **no está montado** en el composition root del proceso NO cuenta como entregado.

Raíces reales del arquetipo `container-java`: `docker/`, `sources/`. El composition root y el código nuevo viven BAJO esas raíces; no abras un segundo árbol (`src/` junto a `sources/`, `backend/` junto a `apps/`).

En ESTA misma tarea (aunque `zone_paths` no lo liste):
1. Localiza el composition root (`src/main.py`, `app/main.py`, `*Application.java` + scan, `Program.cs`, …).
2. Si no existe (repo vacío / BYO), créalo siguiendo el arquetipo y monta ahí tu router — no dejes el módulo huérfano.
3. Registra el router/controller nuevo (`include_router`, bean MVC, route config…). Si defines `public_router` (o equivalente público), **móntalo también**.
4. Prefijos/paths alineados con `openapi.yaml` del repo (o `.mind`).
5. Smoke: import/arranque del composition root no falla por tu cambio (p. ej. `from src.main import app` / `./mvnw -q compile`).

**Excepción a zone_paths:** el composition root y el manifiesto de deps del host (`requirements.txt` / `pom.xml` / …) SÍ se tocan para cablear lo entregado. No refactores módulos ajenos ni amplíes alcance de negocio.

## Lo entregado tiene que ARRANCAR (boot-gate) — OBLIGATORIO

Compilar no es arrancar. Un `@SpringBootApplication` en el paquete equivocado compila perfectamente y levanta el servidor con CERO endpoints registrados. Antes de entregar, comprueba estas cinco:

1. **Component scan.** La clase de arranque vive en el paquete raíz COMÚN de todo el código productivo. Si el arquetipo dejó un `com.example.*` y tu código está en otro árbol, MUEVE la clase de arranque — no añadas `scanBasePackages` para tapar el síntoma.
2. **Nada de beans homónimos.** Antes de crear una clase, busca su nombre simple en el repo: Spring nombra el bean por el nombre simple, así que dos clases homónimas en paquetes distintos son `ConflictingBeanDefinitionException` al arrancar. Reutiliza la que hay o sustitúyela; no las dejes coexistir. Aplica a los `@Mapper` de MapStruct (su `…Impl` generado lleva `@Component`).
3. **Configuración completa.** Con JPA en el classpath: `spring.datasource` parametrizado por entorno (`${SPRING_DATASOURCE_URL:...}`), dialecto, y `spring.liquibase.change-log` apuntando al ÚNICO maestro.
4. **Esquema coherente.** El DDL soporta las entidades tal como Hibernate las mapea. Compruébalo con `spring.jpa.hibernate.ddl-auto=validate` contra el esquema que produce el changelog: son diez segundos y cierran toda esta clase de defecto.
5. **Despliegue coherente.** Si tocas `docker-compose.yml`: el motor de la imagen, el esquema de la URL JDBC, el driver del `pom.xml` y el dialecto de Hibernate son UN SOLO hecho. `depends_on` sobre la base de datos lleva `condition: service_healthy` (Oracle tarda minutos). Imágenes base multiarch. Y no referencies contextos ni Dockerfile que no existan.

**Un `TODO`, un `not implemented` o un `return Collections.emptyList()` como cuerpo ÚNICO de un método es un bloqueante de entrega, no una nota.** Un endpoint que responde `200 OK` con algo que no depende de ninguna entrada ni de ninguna consulta no es una feature: es una fachada. Si dejas el repositorio escrito y sin invocar, la tarea NO está entregada.

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

## Pruebas que debes implementar (TEST_SUITES)
La fase TEST_SUITES ya definió estas pruebas para los requisitos/historias/casos de uso que esta tarea cubre. Impleméntalas como código de test EJECUTABLE con el framework real del arquetipo (ver «Política de imports en tests» y «Ejecución de la suite» arriba) — no basta con que la lógica pase, tiene que existir el test que lo demuestre.

### IT-005 — Dado un empleado cuando crea una solicitud con fecha de fin anterior a la de inicio entonces la operación falla
**Capa:** api · **Prioridad:** high · **Categoría:** error_handling
**Componente objetivo:** Servicio de creación de solicitudes de vacaciones
Verifica la regla de negocio que impide crear solicitudes con fechas incoherentes a nivel de API y servicio.
**Resultado esperado:** La API responde con HTTP 400 Bad Request y no se crea ninguna solicitud en la base de datos.
**Precondiciones:**
- Un usuario 'Empleado' está autenticado.
**Datos de prueba:**
- Un usuario 'Empleado' autenticado.
- Datos de una solicitud donde 'end_date' es anterior a 'start_date'.
**Herramientas sugeridas:** RestAssured
```gherkin
Scenario: Intentar crear una solicitud de vacaciones con fechas inválidas
  Given un empleado está autenticado en el sistema
  When el empleado intenta crear una solicitud donde la fecha de fin es anterior a la fecha de inicio
  Then la base de datos no debe contener ninguna nueva solicitud de este empleado
  And la respuesta debe tener el estado HTTP 400 Bad Request
```

### IT-008 — Dado una solicitud pendiente cuando su creador la cancela entonces el estado cambia a Cancelada
**Capa:** backend · **Prioridad:** high · **Categoría:** happy_path
**Componente objetivo:** Servicio de cancelación de solicitudes
Verifica que un empleado puede cancelar una solicitud que aún no ha sido procesada, y que el cambio de estado se refleja correctamente.
**Resultado esperado:** La API responde con 200 OK. El estado de la solicitud en la base de datos se actualiza a 'Cancelada'.
**Precondiciones:**
- Un usuario 'Empleado' está autenticado.
**Datos de prueba:**
- Una solicitud de vacaciones en estado 'Pendiente' creada por el empleado autenticado.
**Herramientas sugeridas:** JUnit 5, Testcontainers
```gherkin
Scenario: Un empleado cancela su propia solicitud de vacaciones pendiente
  Given un empleado ha creado una solicitud de vacaciones que está en estado 'Pendiente'
  When el mismo empleado cancela dicha solicitud
  Then el estado de la solicitud en la base de datos debe cambiar a 'Cancelada'
```

### IT-011 — Dado un empleado cuando intenta ver el detalle de una solicitud de otro empleado entonces la operación es denegada
**Capa:** api · **Prioridad:** high · **Categoría:** authorization
**Componente objetivo:** Servicio de consulta del detalle de una solicitud
Verifica que un empleado no puede acceder a los datos de solicitudes que no le pertenecen, protegiendo la privacidad de los datos.
**Resultado esperado:** La API responde con un error HTTP 403 Forbidden o 404 Not Found.
**Precondiciones:**
- Dos usuarios 'Empleado' existen en el sistema.
**Datos de prueba:**
- Empleado A, que está autenticado.
- Una solicitud creada por el Empleado B.
**Herramientas sugeridas:** RestAssured
```gherkin
Scenario: Un empleado intenta acceder a una solicitud ajena
  Given el Empleado A está autenticado
  And existe una solicitud de vacaciones creada por el Empleado B
  When el Empleado A intenta consultar el detalle de la solicitud del Empleado B
  Then la respuesta debe tener el estado HTTP 404 Not Found
```

### PT-002 — Dado un alto volumen de usuarios EMPLEADO cuando consultan su historial de solicitudes entonces el sistema responde rápidamente
**Capa:** api · **Prioridad:** high · **Categoría:** performance_threshold
**Componente objetivo:** Servicio de consulta de historial de solicitudes (800 usuarios concurrentes)
Prueba de carga (load) sobre el endpoint de consulta del historial de solicitudes del empleado. Simula una de las operaciones de lectura más frecuentes. Valida NFR-001, NFR-003, NFR-007.
**Resultado esperado:** Latencia p95 < 500ms para la respuesta del listado. Tasa de errores < 0.1%.
**Precondiciones:**
- Existen al menos 1000 usuarios con rol EMPLEADO.
**Datos de prueba:**
- 1000 usuarios EMPLEADO, cada uno con un historial de entre 10 y 50 solicitudes de vacaciones en diferentes estados.
**Herramientas sugeridas:** k6

### PT-004 — Dado un pico de demanda cuando se crean solicitudes de vacaciones simultáneamente entonces se mantiene el throughput objetivo
**Capa:** api · **Prioridad:** high · **Categoría:** performance_threshold
**Componente objetivo:** Servicio de creación de solicitudes de vacaciones (50 transacciones por segundo)
Prueba de estrés (stress) para medir el rendimiento de la creación de solicitudes de vacaciones bajo una carga de transacciones elevada. Valida NFR-008.
**Resultado esperado:** Throughput sostenido de al menos 50 tps durante 5 minutos. Tasa de errores < 1%.
**Precondiciones:**
- Existen suficientes cuentas de empleado para generar la carga.
**Datos de prueba:**
- Un pool de al menos 500 usuarios EMPLEADO para generar las peticiones.
**Herramientas sugeridas:** k6

### RT-005 — Dado un empleado, cuando intenta ver solicitudes de otro empleado, entonces el sistema se lo impide
**Capa:** api · **Prioridad:** high · **Categoría:** authorization
**Componente objetivo:** Control de Acceso a Solicitudes
Verifica la regla de negocio de aislamiento de datos, asegurando que un empleado no puede acceder a información de solicitudes que no le pertenecen.
**Resultado esperado:** El sistema devuelve un error 403 Forbidden o 404 Not Found al intentar acceder al detalle de la solicitud.
**Precondiciones:**
- Existen dos empleados, 'Empleado A' y 'Empleado B'.
- 'Empleado A' ha creado una solicitud.
**Datos de prueba:**
- ID de una solicitud creada por 'Empleado A'.
- Credenciales de 'Empleado B'.
**Herramientas sugeridas:** REST Assured, Postman
```gherkin
@regression
Scenario: Un empleado no puede acceder a las solicitudes de otro
  Given 'Empleado A' ha creado una solicitud de vacaciones
  When 'Empleado B' intenta consultar los detalles de dicha solicitud
  Then el sistema debe denegar el acceso
```

### ST-001 — Dado un usuario no autenticado cuando intenta consultar el detalle de una solicitud entonces se le deniega el acceso
**Capa:** api · **Prioridad:** critical · **Categoría:** authorization
**Componente objetivo:** Servicio de consulta de detalle de solicitud de vacaciones
Verifica que el endpoint de detalle de solicitud de vacaciones está protegido y requiere autenticación. Un acceso anónimo debe resultar en un error HTTP 401.
**Resultado esperado:** El sistema responde con un código de estado HTTP 401 Unauthorized.
**Precondiciones:**
- Existe al menos una solicitud de vacaciones en el sistema.
**Datos de prueba:**
- ID de una solicitud de vacaciones existente.
**Herramientas sugeridas:** Burp Suite, Postman

### ST-002 — Dado un EMPLEADO autenticado cuando intenta consultar el detalle de una solicitud de otro EMPLEADO entonces se le deniega el acceso
**Capa:** api · **Prioridad:** critical · **Categoría:** authorization
**Componente objetivo:** Servicio de consulta de detalle de solicitud de vacaciones
Verifica que un empleado no puede acceder a los datos de solicitudes que no le pertenecen (IDOR - Insecure Direct Object Reference). El sistema debe responder con 403 Forbidden o 404 Not Found.
**Resultado esperado:** El sistema responde con un código de estado HTTP 403 Forbidden o 404 Not Found.
**Precondiciones:**
- Existen dos usuarios con rol EMPLEADO (Empleado A y Empleado B).
- El Empleado B ha creado una solicitud de vacaciones.
**Datos de prueba:**
- Token de sesión del Empleado A.
- ID de la solicitud de vacaciones del Empleado B.
**Herramientas sugeridas:** Burp Suite, Postman

### ST-007 — Dado un usuario cuando intenta inyectar SQL en el campo 'motivo' de una solicitud entonces la entrada es sanitizada
**Capa:** backend · **Prioridad:** critical · **Categoría:** security_check
**Componente objetivo:** Servicio de creación de solicitudes de vacaciones
Verifica la protección contra ataques de inyección SQL (SQLi) en los campos de texto libre. El sistema no debe ejecutar el código malicioso y debe tratar la entrada como texto literal o rechazarla.
**Resultado esperado:** La solicitud se crea correctamente con el texto de inyección como motivo literal, o la petición es rechazada con un error HTTP 400. La base de datos no sufre ningún daño.
**Precondiciones:**
- Existe un usuario con rol EMPLEADO.
**Datos de prueba:**
- Token de sesión de un EMPLEADO.
- Payload de creación de solicitud con una cadena de inyección SQL en el campo 'motivo' (ej. 'motivo; DROP TABLE users;--').
**Herramientas sugeridas:** OWASP ZAP, Burp Suite

### UT-001 — Dado que un empleado envía datos válidos, cuando se crea una solicitud de vacaciones, entonces se crea con estado 'Pendiente'
**Capa:** backend · **Prioridad:** critical · **Categoría:** happy_path
**Componente objetivo:** Servicio de creación de solicitudes de vacaciones
Verifica el 'happy path' del servicio de creación de solicitudes: una solicitud con datos correctos (fechas futuras, fin >= inicio) se persiste con el estado inicial correcto.
**Resultado esperado:** El servicio invoca al repositorio para guardar una nueva solicitud con estado 'Pendiente' y los datos proporcionados.
**Datos de prueba:**
- Datos de solicitud con fecha de inicio y fin futuras, y fecha de fin posterior a la de inicio.
**Herramientas sugeridas:** Jest

### UT-002 — Dado que se intenta crear una solicitud, cuando la fecha de fin es anterior a la de inicio, entonces el servicio lanza un error de validación
**Capa:** backend · **Prioridad:** high · **Categoría:** error_handling
**Componente objetivo:** Servicio de creación de solicitudes de vacaciones
Verifica que la lógica de negocio impide crear solicitudes con un rango de fechas incoherente.
**Resultado esperado:** El servicio lanza una excepción de tipo 'ValidacionError' y no invoca al repositorio.
**Datos de prueba:**
- Datos de solicitud donde end_date < start_date.
**Herramientas sugeridas:** Jest

### UT-003 — Dado que se intenta crear una solicitud, cuando las fechas son del pasado, entonces el servicio lanza un error de validación
**Capa:** backend · **Prioridad:** high · **Categoría:** error_handling
**Componente objetivo:** Servicio de creación de solicitudes de vacaciones
Verifica que la lógica de negocio impide crear solicitudes con fechas que ya han pasado.
**Resultado esperado:** El servicio lanza una excepción de tipo 'ValidacionError' y no invoca al repositorio.
**Datos de prueba:**
- Datos de solicitud con start_date o end_date en el pasado.
**Herramientas sugeridas:** Jest

### UT-004 — Dado que se intenta crear una solicitud, cuando el motivo excede los 500 caracteres, entonces el servicio lanza un error de validación
**Capa:** backend · **Prioridad:** medium · **Categoría:** boundary
**Componente objetivo:** Servicio de creación de solicitudes de vacaciones
Prueba de límites para el campo 'motivo' de la solicitud.
**Resultado esperado:** El servicio lanza una excepción de tipo 'ValidacionError' y no invoca al repositorio.
**Datos de prueba:**
- Datos de solicitud con un 'motivo' de 501 caracteres.
**Herramientas sugeridas:** Jest

### UT-008 — Dado que un empleado cancela su solicitud 'Pendiente', cuando el servicio procesa la acción, entonces el estado cambia a 'Cancelada'
**Capa:** backend · **Prioridad:** high · **Categoría:** happy_path
**Componente objetivo:** Servicio de cancelación de solicitudes de vacaciones
Verifica el 'happy path' de la cancelación de una solicitud por parte del empleado.
**Resultado esperado:** El servicio actualiza el estado de la solicitud a 'Cancelada'.
**Datos de prueba:**
- Mock de una solicitud en estado 'Pendiente' que pertenece al empleado.
**Herramientas sugeridas:** Jest

### UT-009 — Dado que un empleado intenta cancelar una solicitud 'Aprobada', cuando el servicio procesa la acción, entonces lanza un error de estado inválido
**Capa:** backend · **Prioridad:** high · **Categoría:** error_handling
**Componente objetivo:** Servicio de cancelación de solicitudes de vacaciones
Verifica que la regla de negocio que solo permite cancelar solicitudes pendientes se cumple.
**Resultado esperado:** El servicio lanza una excepción de tipo 'EstadoInvalidoError' y no modifica la solicitud.
**Datos de prueba:**
- Mock de una solicitud en estado 'Aprobada'.
**Herramientas sugeridas:** Jest

### UT-019 — Dado un DTO de creación de solicitud, cuando los datos son inválidos, entonces el validador de API devuelve errores
**Capa:** api · **Prioridad:** high · **Categoría:** data_integrity
**Componente objetivo:** Validador de DTO de Creación de Solicitud
Verifica las reglas de validación a nivel de controlador/API para los datos de entrada de una nueva solicitud.
**Resultado esperado:** El validador identifica los errores y devuelve una respuesta estructurada con los fallos de validación.
**Datos de prueba:**
- Payload JSON con fecha de fin anterior a la de inicio.
- Payload JSON con motivo de más de 500 caracteres.
- Payload JSON con fechas en el pasado.
**Herramientas sugeridas:** Jest

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

Tus zonas (`sources/src/main/java/com/mapfre/product/microservice/requests/`, `sources/src/main/java/com/mapfre/product/microservice/Application.java`) pueden ya contener código de una TSK predecesora mergeada (o del esqueleto). Antes de crear tipos nuevos:

1. **Lista y lee** los ficheros bajo la zona (`ls` / abre `service.py`, `router.py`, …).
2. **EDIT/EXTIENDE** clases, funciones y exports existentes. **PROHIBIDO** una segunda `class`/`def`/export con el **mismo nombre** en el mismo fichero (en Python gana la última y el resto es basura).
3. Si esta tarea es «API pública» / «consulta» sobre el mismo dominio que un CRUD previo, **reutiliza** servicios y modelos; añade solo el router/handlers públicos (montados en el composition root).
4. Un módulo = un dueño semántico de cada símbolo top-level. Si hace falta otro tipo, **nómbralo distinto** o factoriza — no pegues un duplicado al EOF.

El runtime puede anexar la lista real de ficheros presentes en la zona al arrancar la sesión.

## Contrato API congelado (api-contract) — LEY

El `openapi.yaml` del repo (PR #0 / C.2) es el contrato de esta API. Implementa **exactamente** estos endpoints — no inventes paths, verbos ni status distintos.

| EP | Método | Path | Request | Response | Status | Public | Roles |
|----|--------|------|---------|----------|--------|--------|-------|
| `EP-012` | **POST** | `/vacation-requests` | `VacationRequestCreate` | `VacationRequestDetail` | 201 | N | `ROL-001`, `ROL-002` |
| | | _Crea una nueva solicitud de vacaciones para el empleado autenticado._ | | | | | |
| `EP-013` | **GET** | `/vacation-requests/my-requests` | `—` | `VacationRequestList` | 200 | N | `ROL-001`, `ROL-002` |
| | | _Obtiene el listado de las solicitudes de vacaciones del empleado autenticado._ | | | | | |
| `EP-014` | **GET** | `/vacation-requests/{requestId}` | `—` | `VacationRequestDetail` | 200 | N | `ROL-001`, `ROL-002` |
| | | _Obtiene el detalle de una solicitud de vacaciones del propio empleado._ | | | | | |
| `EP-015` | **POST** | `/vacation-requests/{requestId}/cancel` | `—` | `VacationRequestDetail` | 201 | N | `ROL-001`, `ROL-002` |
| | | _Cancela una solicitud de vacaciones propia que esté en estado 'Pendiente'._ | | | | | |

### Campos de los schemas de tus endpoints (LEY)

Los nombres, tipos y obligatoriedad de estos campos son el contrato de DATOS: el front tipa su JSON con ellos (`libs/api-types`). Un campo renombrado (`argumentario_content` por `argumentario_venta`, `size` por `page_size`) rompe la operación aunque el path acierte — 17 en el ciclo anterior.

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


Disciplina (api-contract):
1. Path y verbo **literales** del contrato (`/membership-plans`, no `/plans/`; `PUT`, no `PATCH` si el contrato dice PUT).
2. La base pública de la API es **`servers[0].url` del `openapi.yaml`** (p. ej. `/api`): monta los routers de forma que la URL pública sea `base + path` EXACTAMENTE. No inventes otra base ni añadas versiones (`/v1`) que el contrato no traiga: el cliente concatena `base + path` y cualquier otro prefijo le devuelve 404.
3. Status HTTP de la columna Status (POST→201, DELETE→204, resto→200) salvo que `openapi.yaml` declare otro.
4. Prefijos de montaje (`include_router`) deben hacer que la URL pública coincida con `base + path` del contrato.
5. Los schemas CON campos (tabla de arriba) son LEY: mismos nombres, tipos y obligatoriedad en tus DTO. Los que aún no tienen campos son gérmenes: rellénalos con el modelo real; **no** reescribas `openapi.yaml` para legitimar un path inventado.
6. Si el DoD te pide un comportamiento que ningún endpoint de la tabla cubre (desarchivar, restaurar, desmarcar…), NO lo resuelvas inventando una ruta: entrégalo con el endpoint que más se le parezca y **repórtalo como health check `Warning` con `check: api-contract`** para que arquitectura lo añada. Una ruta inventada es invisible para el cliente.
7. Si el repo trae `.mind/contract-pending.json` (PR #0), **quita de `pending` los EP que implementas en este mismo PR**: el test de contrato del repo (`tests/contract/`) deja de exonerarlos y pasa a exigirlos, y el runtime comprueba que no dejas los tuyos pendientes. No quites los de otras tareas.
7. Monta el guard con los códigos de la columna Roles. No inventes roles. Si Public=N y Roles=`deny-all`, NO expongas la ruta: avísalo en el PR.

_(Resto del contrato del proyecto, que NO materializa esta tarea: `EP-001` GET /admin/users, `EP-002` POST /admin/users, `EP-003` GET /admin/users/{userId}, `EP-004` PUT /admin/users/{userId}, `EP-005` PATCH /admin/users/{userId}/status, `EP-006` GET /admin/hierarchy, `EP-007` POST /admin/employees/{employeeId}/manager, `EP-008` PUT /admin/employees/{employeeId}/manager, `EP-009` DELETE /admin/employees/{employeeId}/manager, `EP-010` GET /profile/me, `EP-011` GET /profile/my-team, `EP-016` GET /vacation-requests/{requestId}/proof-document, `EP-017` GET /team/vacation-requests, `EP-018` GET /team/vacation-requests/{requestId}, `EP-019` POST /team/vacation-requests/{requestId}/approve, `EP-020` POST /team/vacation-requests/{requestId}/reject, `EP-021` POST /reports/monthly-requests/export-jobs, `EP-022` GET /reports/export-jobs/{jobId}. Está aquí para que no dupliques ni pises lo de otra tarea.)_

## Contrato de salida del arquetipo

> El repo se genera desde el arquetipo `container-java` (ArqRef MAPFRE). Produce EXACTAMENTE ficheros con la estructura, rutas y HERRAMIENTA de este arquetipo, imitando el esqueleto/ejemplos de abajo. NO improvises otra herramienta ni otra disposición (p.ej. si el arquetipo usa Liquibase, NO uses Flyway). Extiende el esqueleto; no lo reinventes.

**Raíz del proyecto**: el código va bajo `sources/`, `local/`, `apps/`, `libs/`, `src/` — donde el arquetipo pone el suyo. Si el repo está vacío y tienes que andamiarlo, respeta esa raíz en vez de elegir una nueva: el resto del aprovisionamiento (pipelines del arquetipo, verificación de build, empaquetado) espera encontrarlo ahí.

### Estructura del proyecto (del arquetipo)
```sh
├── .gitignore
|── .github/workflows
|── security-metadata.toml
├── README.md
├── docker
│        ├── .dockerignore
│        ├── Dockerfile
│        └── docker-compose.yml
└── sources

```

A continuación se enumeran cada uno de los elementos de esta estructura:

- `.gitignore`: fichero con la configuración por defecto de carpetas y ficheros a ignorar por `git`.
- `.github/workflows`: carpeta con los ficheros de configuración de `Github Actions` para la ejecución de `CI/CD` en la plataforma de Github.

A continuación se explican los ficheros que se encuentran en la carpeta `.github/workflows`:

- `pull-request.yml`: workflow destinado a ejecutarse en cada pull request que se abra en el repositorio de código fuente desde ramas `feature` o `hotfix`.
- `merge-commit.yml`: workflow para realizar las tareas típicas de publicación de artefactos y despliegue en entornos de desarrollo.
- `README.md`: fichero con detalle de la arquitectura de aplicación de contenedores.
- `docker/Dockerfile`: fichero base para construir la imagen de la aplicación.
- `docker/docker-compose.yml`: `docker compose` para desplegar la aplicación junto con las dependencias que necesite.
- `docker/.dockerignore`: archivo para ignorar ficheros y directorios durante el proceso de construcción de la imagen, con el objetivo de evitar que estos se copien a la imagen del contenedor por error.
- `maven/settings.xml`: fichero de configuración para maven, preconfigurado para utilizar el repositorio de `Azure Artifacts`. A este fichero es necesita configurar el `PAT` asociado al usuario.
- `sources`: carpeta donde se aloja el código fuente de la aplicación. Por defecto se genera una aplicación spring boot con la configuración indicada en el wizard de Marketplace durante el proceso de creación.


La estructura de la aplicación base, en caso de no requerir crear módulos adicionales,  sería la que se puede ver a continuación dentro de la carpeta `sources`:


```sh
├── README.md
├── docker
│   ├── Dockerfile
│   └── docker-compose.yml
├── maven
│   └── settings.xml
├── security-metadata.toml
└── sources
    ├── lombok.config
    ├── mvnw
    ├── mvnw.cmd
    ├── pom.xml
    └── src
        ├── main
        │   ├── java
        │   │   └── com
        │   │       └── mapfre
        │   │           └── product
        │   │               └── microservice
        │   │                   ├── Application.java
        │   │                   └── ApplicationStartupTraces.java
        │   └── resources
        │       ├── api
        │       ├── application.yml
        │       └── logback-spring.xml
        └── test
            └── java
                └── com
                    └── mapfre
                        └── product
                            └── microservice
                                └── MicroserviceApplicationTests.java
```

### Esqueleto y ejemplos (imítalos exactamente)
#### `sources/src/main/java/com/mapfre/test/acme/Application.java`
```java
package com.mapfre.test.acme;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.core.env.Environment;

@SpringBootApplication
public class Application {

	private static final Logger log = LoggerFactory.getLogger(Application.class);

	public static void main(String[] args) {
		Environment env = SpringApplication.run(Application.class, args).getEnvironment();

		if (log.isInfoEnabled()) {
			log.info(ApplicationStartupTraces.of(env));
		}
	}

}

```
#### `sources/pom.xml`
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.5.10</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>

    <groupId>com.mapfre.test</groupId>
    <artifactId>acme</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <name>container-java-mock</name>
    <description>Mock container Java Spring Boot</description>

    <url/>

    <licenses>
        <license/>
    </licenses>

    <developers>
        <developer/>
    </developers>

    <scm>
        <connection/>
        <developerConnection/>
        <tag/>
        <url/>
    </scm>

    <distributionManagement>

        <repository>
            <id>releases</id>
            <url>${releases.repo.url}</url>
        </repository>

        <snapshotRepository>
            <id>snapshots</id>
            <url>${snapshots.repo.url}</url>
            <uniqueVersion>true</uniqueVersion>
        </snapshotRepository>

    </distributionManagement>

    <properties>
        <java.version>21</java.version>
        <spring.profiles.active>dev</spring.profiles.active>
        <spring.doc.version>2.8.5</spring.doc.version>
        <archetype.version>1.4.0</archetype.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <scope>provided</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>jakarta.annotation</groupId>
            <artifactId>jakarta.annotation-api</artifactId>
        </dependency>


    </dependencies>

    <build>
        <defaultGoal>spring-boot:run</defaultGoal>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <configuration>
                    <annotationProcessorPaths>
                        <path>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                            <version>1.18.44</version>
                        </path>
                    </annotationProcessorPaths>
                </configuration>
            </plugin>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>

```
#### `sources/documentation/assertions.md`
```md
# ✅ Aserciones (Assertions)

La clase `Assert` contiene utilidades para realizar validaciones básicas de entrada de datos.

**📍 Ubicación:** `src/main/java/shared/error/domain/com.mapfre.test.acme/util/Assert.java`

Estas aserciones se ejecutan en tiempo de ejecución y lanzan una excepción si la condición no se cumple. Considerando el ciclo de retroalimentación lento, **recomendamos priorizar el uso de tipos específicos para validaciones de entrada** (obteniendo validaciones en tiempo de compilación).

## 🤔 Cuándo usar Assert

- ✅ **Para validaciones técnicas básicas**: Verificar que los parámetros no son nulos, están dentro de rangos válidos, etc.
- 🎯 **En el Domain Model**: Para garantizar la integridad de los datos de dominio
- ❌ **NO para validaciones de negocio complejas**: Para eso deberías crear tus propias excepciones y mecanismos de validación dedicados a las reglas de negocio

## 💡 Formas de uso

### 1. Validaciones simples

```java
Assert.notNull("field", value);
```

El primer parámetro es el nombre del campo (se usa en el mensaje de excepción) y el segundo es el valor a verificar.

**Ejemplo real del proyecto:**

```java
// En UserId.java
public UserId(UUID id) {
  Assert.notNull("id", id);
  this.id = id;
}
```

### 2. Validaciones encadenadas (Fluent API)

```java
Assert.field("name", name)
  .notBlank()
  .maxLength(150);
```

Este enfoque permite validar múltiples condiciones sobre el mismo campo de manera legible.

**Ejemplos reales del proyecto:**

#### Validación de Username
```java
// En Username.java
public Username(String username) {
  Assert.field("username", username).notBlank().maxLength(100);
  this.username = username;
}
```

#### Validación de Email
```java
// En Email.java
public Email(String email) {
  Assert.field("email", email).notBlank().maxLength(255);
  this.email = email;
}
```

#### Validación de Firstname
```java
// En Firstname.java
public Firstname(String firstname) {
  Assert.field("firstname", firstname).notBlank().maxLength(255);
  this.firstname = firstname;
}
```

#### Validación de Lastname
```java
// En Lastname.java  
public Lastname(String lastname) {
  Assert.field("lastname", lastname).notBlank().maxLength(255);
  this.lastname = lastname;
}
```

## Métodos disponibles

### Validaciones básicas
- `notNull(String field, Object value)`: Verifica que el valor no sea null
- `notBlank()`: Verifica que la cadena no esté vacía o solo contenga espacios en blanco
- `notEmpty()`: Verifica que la colección, array o mapa no estén vacíos

### Validaciones de tamaño
- `minLength(int min)`: Verifica que la cadena tenga al menos `min` caracteres
- `maxLength(int max)`: Verifica que la cadena no supere `max` caracteres
- `min(T min)`: Verifica que el número sea mayor o igual a `min`
- `max(T max)`: Verifica que el número sea menor o igual a `max`

### Validaciones de tiempo
- `notBefore(Instant reference)`: Verifica que el tiempo no sea anterior a la referencia
- `notAfter(Instant reference)`: Verifica que el tiempo no sea posterior a la referencia

### Validaciones de colecciones
- `noNullElement()`: Verifica que no haya elementos nulos en la colección
- `maxSize(int max)`: Verifica que la colección no supere el tamaño máximo

## Excepciones lanzadas

Las aserciones lanzan excepciones específicas del dominio ubicadas en `com.mapfre.archetype.hexa.shared.error.domain`:

- `MissingMandatoryValueException`: Cuando falta un valor obligatorio
- `StringTooShortException`: Cuando una cadena es demasiado corta
- `StringTooLongException`: Cuando una cadena es demasiado larga
- `NumberValueTooLowException`: Cuando un número es demasiado pequeño
- `NumberValueTooHighException`: Cuando un número es demasiado grande
- `NotBeforeTimeException`: Cuando un tiempo es anterior al permitido
- `NotAfterTimeException`: Cuando un tiempo es posterior al permitido
- `NullElementInCollectionException`: Cuando hay elementos nulos en una colección
- `TooManyElementsException`: Cuando hay demasiados elementos

## Beneficios

1. **Código más limpio**: Las validaciones son expresivas y fáciles de leer
2. **Mensajes de error claros**: Los nombres de campo se incluyen en las excepciones
3. **Validación temprana**: Fallar rápido ante datos inválidos
4. **Reutilizable**: Las validaciones están centralizadas
5. **Testeable**: Las excepciones de dominio pueden ser capturadas y verificadas en tests


```
#### `sources/documentation/dev-tools.md`
```md
# 🛠️ Spring Boot DevTools

Spring DevTools es una herramienta que proporciona características de desarrollo para mejorar la experiencia de desarrollo.

## ⚙️ Configuración en este proyecto

DevTools está habilitado en el perfil `local`.

**📍 Ubicación:** Ya está incluido en el `pom.xml`:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-devtools</artifactId>
    <scope>runtime</scope>
    <optional>true</optional>
</dependency>
```

## Cómo usarlo

Ejecuta la aplicación con el perfil `local`:

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

O configura el perfil en tu IDE (IntelliJ IDEA, Eclipse, VS Code).

## Características principales

### 1. Reinicio automático (Auto-restart)

Cuando cambias archivos del classpath, la aplicación se reinicia automáticamente.

**Qué reinicia:**
- Cambios en clases Java
- Cambios en archivos de recursos
- Cambios en properties

**Qué NO reinicia:**
- Cambios en dependencias del `pom.xml` (requiere rebuild completo)
- Cambios en archivos estáticos (por LiveReload)

### 2. LiveReload

Actualiza automáticamente el navegador cuando cambias archivos estáticos.

**Archivos soportados:**
- HTML
- CSS
- JavaScript
- Imágenes

**Instalar extensión del navegador:**
- Chrome: [LiveReload Extension](https://chrome.google.com/webstore/detail/livereload/jnihajbhpnppcggbcgedagnkighmdlei)
- Firefox: [LiveReload Add-on](https://addons.mozilla.org/firefox/addon/livereload-web-extension/)

### 3. Configuraciones de desarrollo

DevTools desactiva automáticamente el caché de templates:

```yaml
spring:
  thymeleaf:
    cache: false  # Desactivado automáticamente con DevTools
  freemarker:
    cache: false
  groovy:
    template:
      cache: false
```

### 4. Propiedades adicionales

DevTools establece propiedades de desarrollo por defecto:

```yaml
spring:
  devtools:
    restart:
      enabled: true
      additional-paths: src/main/java
      exclude: static/**,public/**
    livereload:
      enabled: true
      port: 35729
```

## Configuración personalizada

### Excluir archivos del reinicio

```yaml
spring:
  devtools:
    restart:
      exclude: static/**,public/**,templates/**
```

### Cambiar el puerto de LiveReload

```yaml
spring:
  devtools:
    livereload:
      port: 35730
```

### Desactivar DevTools en producción

DevTools se desactiva automáticamente cuando ejecutas un JAR empaquetado:

```bash
java -jar target/hexa-0.0.1-SNAPSHOT.jar
# DevTools está desactivado automáticamente
```

## Uso en IntelliJ IDEA

1. **Habilitar Build automático:**
   - Settings → Build, Execution, Deployment → Compiler
   - ✅ Build project automatically

2. **Configurar Run Configuration:**
   - Run → Edit Configurations
   - Añadir VM option: `-Dspring-boot.run.profiles=local`

3. **Compilación automática:**
   - Build → Build Project (Ctrl+F9)
   - O usa "Build on save" feature

## Uso en VS Code

1. **Instalar extensiones:**
   - Spring Boot Extension Pack
   - Java Extension Pack

2. **Configurar launch.json:**

```json
{
  "configurations": [
    {
      "type": "java",
      "name": "Spring Boot-Application",
      "request": "launch",
      "mainClass": "com.mapfre.archetype.hexa.Application",
      "projectName": "hexa",
      "args": "--spring.profiles.active=local",
      "vmArgs": "-Dspring-boot.run.profiles=local"
    }
  ]
}
```

## Mejores prácticas

1. **Solo para desarrollo:** No uses DevTools en producción
2. **Perfil local:** Activa DevTools solo con perfil `local`
3. **Reinicio selectivo:** Excluye directorios que no necesitan reinicio
4. **LiveReload:** Útil para desarrollo de frontend
5. **Hot Swap:** Complementa con DCEVM para cambios en caliente más avanzados

## Documentación oficial

[Spring Boot DevTools Documentation](https://docs.spring.io/spring-boot/docs/current/reference/html/using.html#using.devtools)

Esta herramienta mejora significativamente la productividad durante el desarrollo al reducir los ciclos de feedback.


```
#### `sources/documentation/package-types.md`
```md
# 📦 Tipos de Paquetes

Esta aplicación utiliza dos anotaciones a nivel de paquete para organizar y definir las responsabilidades del código:

## 🏷️ Anotaciones disponibles

### 🔄 `@SharedKernel`
Se utiliza para marcar paquetes que contienen clases compartidas entre múltiples contextos de negocio. Estas clases representan funcionalidades transversales que pueden ser utilizadas por diferentes bounded contexts.

**Características:**
- ✅ Contiene código reutilizable entre contextos
- 🔓 Debe ser independiente de lógica de negocio específica
- 📚 Ejemplos: utilidades, validaciones comunes, tipos de datos compartidos

### 🏢 `@BusinessContext`
Se utiliza para marcar paquetes que contienen clases específicas para resolver una necesidad de negocio concreta. Las clases dentro de este paquete **no pueden ser utilizadas en otro paquete**, garantizando el aislamiento entre contextos.

**Características:**
- 🎯 Contiene lógica de negocio específica
- 📦 Encapsula un bounded context completo
- 🔒 Debe ser autónomo e independiente de otros contextos

## 🔧 Cómo marcar un paquete

Para marcar un paquete, debes añadir un archivo `package-info.java` en la raíz del paquete:

### Ejemplo de SharedKernel en este proyecto:

```java
@com.mapfre.archetype.hexa.SharedKernel
package com.mapfre.archetype.hexa.shared.authentication;
```

**Ubicación real:** `src/main/java/com/mapfre/archetype/hexa/shared/authentication/package-info.java`

Este paquete contiene clases de autenticación que son utilizadas por múltiples contextos del sistema, como:
- `AuthenticatedUser`: Representa al usuario autenticado
- `Username`: Tipo de dato para nombres de usuario
- `Roles`: Gestión de roles del sistema

### Ejemplo de BusinessContext en este proyecto:

```java
@com.mapfre.archetype.hexa.BusinessContext
package com.mapfre.archetype.hexa.account;
```

**Ubicación real:** `src/main/java/com/mapfre/archetype/hexa/account/package-info.java`

Este paquete contiene el contexto de negocio de **Cuentas (Accounts)**, que gestiona la información de las cuentas de usuario conectadas al sistema.

Otro ejemplo:

```java
@com.mapfre.archetype.hexa.BusinessContext
package com.mapfre.archetype.hexa.user;
```

**Ubicación real:** `src/main/java/com/mapfre/archetype/hexa/user/package-info.java`

Este paquete contiene el contexto de negocio de **Usuarios (Users)**, que gestiona el CRUD y la lógica de negocio relacionada con usuarios del sistema.

## Estructura de contextos en este proyecto

### Bounded Contexts (BusinessContext):
- **account**: Gestión de cuentas OAuth2 y autenticación
- **user**: Gestión de usuarios del sistema

### Shared Kernels (SharedKernel):
- **shared.authentication**: Autenticación y autorización compartida
- **shared.error**: Manejo de errores y aserciones
- **shared.kipe**: Framework de autorización
- **shared.pagination**: Paginación de resultados
- **shared.collection**: Utilidades para colecciones
- **shared.enumeration**: Utilidades para enumeraciones
- **shared.useridentity**: Tipos compartidos para identidad de usuario

## Beneficios de esta organización

1. **Aislamiento**: Los contextos de negocio están aislados entre sí
2. **Cohesión**: El código relacionado está agrupado
3. **Reutilización controlada**: Solo el SharedKernel puede ser compartido
4. **Testabilidad**: Cada contexto puede ser testeado de forma independiente
5. **Escalabilidad**: Facilita la evolución y el crecimiento del sistema


```
#### `sources/src/main/java/com/mapfre/test/acme/config/.gitkeep`
```text

```
#### `sources/src/main/java/com/mapfre/test/acme/controller/.gitkeep`
```text

```
#### `sources/src/main/java/com/mapfre/test/acme/domain/.gitkeep`
```text

```
#### `sources/src/main/java/com/mapfre/test/acme/events/.gitkeep`
```text

```
#### `sources/src/main/java/com/mapfre/test/acme/model/.gitkeep`
```text

```
#### `sources/src/main/java/com/mapfre/test/acme/repos/.gitkeep`
```text

```
#### `sources/src/main/java/com/mapfre/test/acme/service/.gitkeep`
```text

```
> (Se omitieron ficheros del arquetipo por tamaño; respeta las convenciones mostradas en los ejemplos anteriores para el resto.)

## Guía del programador del proyecto (convenciones — T.7, aprobada)

**Precedencia (handbook-filter):** si esta guía choca con el **contrato ArqRef** o el **DoD de ESTA tarea**, ganan ArqRef y el DoD. Solo se incluyen convenciones del stack de esta TSK; se omiten slices de otros lenguajes/frameworks (p. ej. Angular HttpClient en una TSK React, FastAPI en un SPA).

### Librerías del handbook (pines — dependency-pins)
Usa estas coordenadas/versiones en el manifiesto del host; no improvises latest sin pin.
- **Spring Boot Starter Web** `3.3.x` [backend] · `org.springframework.boot:spring-boot-starter-web`
- **Spring Boot Starter Data JPA** `3.3.x` [backend] · `org.springframework.boot:spring-boot-starter-data-jpa`
- **Oracle JDBC Driver (OJDBC)** `21.x` [backend] · `com.oracle.database.jdbc:ojdbc11`
- **Spring Boot Starter Security + OAuth2 Resource Server** `3.3.x` [backend] · `org.springframework.boot:spring-boot-starter-oauth2-resource-server`
- **Spring Boot Starter AMQP (RabbitMQ)** `3.3.x` [backend] · `org.springframework.boot:spring-boot-starter-amqp`
- **Spring Boot Starter Validation** `3.3.x` [backend] · `org.springframework.boot:spring-boot-starter-validation`
- **Flyway Core** `10.x` [backend] · `org.flywaydb:flyway-core`
- **Lombok** `1.18.32` [backend] · `org.projectlombok:lombok`
- **MapStruct** `1.5.5.Final` [backend] · `org.mapstruct:mapstruct`
- **springdoc-openapi** `>= 2.6.0` [backend] · `org.springdoc:springdoc-openapi-starter-webmvc-ui`
- **OpenPDF** `1.3.30` [backend] · `com.github.librepdf:openpdf`
- **Apache Commons CSV** `1.10.0` [backend] · `org.apache.commons:commons-csv`
- **Logstash Logback Encoder** `7.4` [backend] · `net.logstash.logback:logstash-logback-encoder`
- **Testcontainers (Oracle XE, RabbitMQ)** `1.19.x` [tests] · `org.testcontainers:junit-jupiter`
- **AssertJ Core** `3.25.x` [tests] · `org.assertj:assertj-core`
- **Tailwind CSS** `3.x` [frontend] · `tailwindcss`
- **vitest** `1.x` [frontend] · `vitest`

### Convenciones
- **Backend: Estructura de paquetes por funcionalidad (feature).** — Organizar el código por dominios de negocio (ej. `com.empresa.vacaciones.solicitudes`, `...usuarios`) en lugar de por capas técnicas (ej. `...controllers`, `...services`) mejora la cohesión y facilita la navegación y el mantenimiento a medida que la aplicación crece.
  - Ejemplo correcto: `com/empresa/vacaciones/
  solicitudes/
    SolicitudController.java
    SolicitudService.java
    SolicitudRepository.java
    Solicitud.java
    dto/
      SolicitudResponse.java`
  - Ejemplo incorrecto (evítalo): `com/empresa/vacaciones/
  controllers/
    SolicitudController.java
    UsuarioController.java
  services/
    SolicitudService.java
    UsuarioService.java`
- **Backend: Uso de OffsetDateTime para todos los campos de fecha/hora.** — La base de datos es Oracle, que soporta `TIMESTAMP WITH TIME ZONE`. `OffsetDateTime` es el tipo de dato Java que se mapea correctamente a este tipo, almacenando la fecha, hora y el desfase horario (timezone offset). Esto evita errores de ambigüedad de zona horaria. `LocalDateTime` está prohibido.
  - Ejemplo correcto: `import java.time.OffsetDateTime;

@Column(name = "CREATION_DATE")
private OffsetDateTime creationDate;`
  - Ejemplo incorrecto (evítalo): `import java.time.LocalDateTime;

@Column(name = "CREATION_DATE")
private LocalDateTime creationDate; // ERROR: Pierde información de zona horaria.`
- **Backend: Las respuestas de API para listados paginados deben usar la estructura `Page<T>` de Spring.** — Devolver una estructura estandarizada que incluya el contenido (`content`) y los metadatos de paginación (`totalElements`, `totalPages`, `size`, `number`) es crucial para que los clientes de frontend puedan construir controles de paginación robustos. Devolver un array plano (`List<T>`) es un antipatrón.
  - Ejemplo correcto: `GET /api/solicitudes ->
{
  "content": [ { ... } ],
  "totalElements": 1,
  "totalPages": 1,
  "last": true,
  "size": 20,
  "number": 0
}`
  - Ejemplo incorrecto (evítalo): `GET /api/solicitudes ->
[
  { ... }
]`
- **Backend: Gestión de errores centralizada con `@ControllerAdvice` y un DTO `ErrorResponse`.** — Centralizar el manejo de excepciones en una clase `GlobalExceptionHandler` asegura que todas las respuestas de error de la API sean consistentes en su formato, incluyendo un código de error único, un mensaje legible y el estado HTTP apropiado.
  - Ejemplo correcto: `@ExceptionHandler(EntityNotFoundException.class)
public ResponseEntity<ErrorResponse> handleNotFound(Exception ex) {
  ErrorResponse error = new ErrorResponse("SOL-404", "Solicitud no encontrada");
  return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
}`
  - Ejemplo incorrecto (evítalo): `@GetMapping("/{id}")
public Solicitud getById(@PathVariable Long id) {
  try {
    return service.findById(id);
  } catch (Exception e) {
    // Devolver un error 500 genérico sin estructura.
    throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR);
  }
}`
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
- Usar `LocalDateTime` o `Date` en entidades JPA con una base de datos Oracle. → usa: Usar siempre `java.time.OffsetDateTime`. `LocalDateTime` no almacena información de zona horaria, lo que lleva a errores sutiles y difíciles de depurar al interactuar con el tipo `TIMESTAMP WITH TIME ZONE` de Oracle.
- Usar la estrategia de generación de PK `GenerationType.IDENTITY` con Oracle. → usa: Usar `GenerationType.SEQUENCE` con un `@SequenceGenerator` explícito. `IDENTITY` fuerza a Hibernate a hacer un `SELECT` adicional después de cada `INSERT` para recuperar el ID, mientras que `SEQUENCE` puede obtener los IDs en batch, siendo mucho más performante.
- Configurar el dialecto de Hibernate con `spring.jpa.properties.hibernate.dialect`. → usa: Usar la propiedad `spring.jpa.database-platform`. Spring Boot deduce el dialecto automáticamente a partir de esta propiedad y del driver JDBC. Sobrescribir `hibernate.dialect` puede causar conflictos.
- Devolver directamente `List<T>` o `T[]` desde un endpoint de API que representa una colección de recursos. → usa: Envolver siempre la lista en un objeto JSON, como la estructura `Page<T>` de Spring (`{ "content": [...] }`). Esto permite añadir metadatos (como el total de elementos) en el futuro sin romper la compatibilidad con los clientes.
- Implementar lógica de negocio compleja dentro de los Controladores o Repositorios. → usa: La lógica de negocio, las validaciones y la orquestación de operaciones deben residir exclusivamente en la capa de Servicio. Los Controladores solo deben manejar la capa HTTP y los Repositorios solo el acceso a datos.
- Escribir consultas SQL o JPQL concatenando strings. → usa: Utilizar siempre parámetros con nombre (`:param`) o posicionales (`?1`) en las consultas JPQL o Criteria API. La concatenación de strings abre una vulnerabilidad grave de inyección de SQL.
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

### Plantillas canónicas del arquetipo
#### `controller-java`
```

```
#### `service-java`
```

```
#### `entity-java`
```

```
#### `repository-java`
```

```
#### `test-integration-java`
```

```

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

## Requisitos que materializa esta tarea

### REQ-002 — Enviar una nueva solicitud de vacaciones
Al enviar el formulario, la solicitud se crea con estado 'Pendiente'. La fecha de fin no puede ser anterior a la de inicio, y ambas deben ser futuras. La solicitud se asocia unívocamente al EMPLEADO.
**Reglas de negocio:**
1. Una nueva solicitud de vacaciones se crea con el estado inicial 'Pendiente'.
2. La fecha de fin de una solicitud no puede ser anterior a su fecha de inicio.
3. Tanto la fecha de inicio como la de fin de una solicitud deben ser futuras a la fecha de creación.
4. El motivo de una solicitud tiene una longitud máxima de 500 caracteres.
5. Cada solicitud de vacaciones está asociada unívocamente al empleado que la crea.
**Criterios de aceptación:**
1. AC-SOL-01: **Creación de una solicitud válida:**<br>**Dado** un `EMPLEADO` autenticado en el sistema.<br>**Cuando** navega al formulario de nueva solicitud y completa las fechas (inicio, fin) y el motivo, y pulsa "Enviar".<br>**Entonces** el sistema valida los datos (fechas futuras, fin >= inicio) y crea una nueva solicitud con estado `Pendiente`, asociándola al empleado.
**Validaciones:**
1. Los campos fecha de inicio (`start_date`) y fecha de fin (`end_date`) son obligatorios y deben tener un formato de fecha válido.
2. Las fechas de inicio y fin deben ser posteriores a la fecha actual.
3. La fecha de fin (`end_date`) no puede ser anterior a la fecha de inicio (`start_date`).
4. El campo motivo (`reason`) no puede exceder los 500 caracteres.
**Escenarios de error:**
1. El formato de la fecha de inicio o fin es inválido.
2. Faltan campos obligatorios como la fecha de inicio o la fecha de fin.
3. El motivo de la solicitud excede el límite de caracteres permitido.
4. El usuario no está autenticado.
5. El usuario autenticado no tiene permisos para crear una solicitud.
6. La fecha de fin de la solicitud es anterior a la fecha de inicio.
7. La fecha de inicio o fin de la solicitud no es una fecha futura.
8. Se ha producido un error al intentar guardar la solicitud.
**Campos de datos:**
- `start_date` (date, obligatorio) — Debe ser una fecha futura a la fecha actual.
- `end_date` (date, obligatorio) — Debe ser futura y posterior o igual a la fecha de inicio.
- `reason` (string, opcional) — Longitud máxima de 500 caracteres.
- `status` (enum, obligatorio) — Se crea con el valor inicial 'Pendiente'.

### REQ-003 — Mostrar listado de solicitudes de vacaciones propias
El EMPLEADO puede acceder a un listado paginado que muestra únicamente las solicitudes de vacaciones que ha creado, ordenadas por fecha de creación descendente.
**Reglas de negocio:**
1. Un empleado solo puede consultar el listado de las solicitudes que él mismo ha creado.
**Criterios de aceptación:**
1. AC-SOL-02: **Visualización de solicitudes existentes:**<br>**Dado** un `EMPLEADO` que ha creado previamente varias solicitudes.<br>**Cuando** accede a la sección "Mis Solicitudes".<br>**Entonces** el sistema muestra un listado paginado con únicamente sus solicitudes, ordenadas por fecha de creación, mostrando su estado actual.
**Escenarios de error:**
1. El usuario no está autenticado para ver sus solicitudes.
2. El usuario autenticado no tiene permisos para ver la lista de solicitudes.
3. Los parámetros de paginación o filtro son inválidos.
**Campos de datos:**
- `solicitud_id` (string, obligatorio) — Identificador único de la solicitud a mostrar en el listado.
- `start_date` (date, obligatorio) — Fecha de inicio de la solicitud a mostrar en el listado.
- `end_date` (date, obligatorio) — Fecha de fin de la solicitud a mostrar en el listado.
- `status` (enum, obligatorio) — Valores posibles: 'Pendiente', 'Aprobada', 'Rechazada', 'Cancelada'.

### REQ-004 — Ver el detalle de una solicitud de vacaciones
Desde el listado, el EMPLEADO puede hacer clic en una solicitud para ver todos sus detalles, como fechas, motivo, estado y metadatos de creación. Solo puede ver el detalle de sus propias solicitudes.
**Reglas de negocio:**
1. Un empleado solo puede consultar el detalle de las solicitudes que él mismo ha creado.
**Criterios de aceptación:**
1. AC-SOL-02: **Visualización de solicitudes existentes:**<br>**Dado** un `EMPLEADO` que ha creado previamente varias solicitudes.<br>**Cuando** accede a la sección "Mis Solicitudes".<br>**Entonces** el sistema muestra un listado paginado con únicamente sus solicitudes, ordenadas por fecha de creación, mostrando su estado actual.
**Escenarios de error:**
1. El identificador de la solicitud proporcionado tiene un formato no válido.
2. El usuario no está autenticado.
3. El usuario no tiene permiso para acceder a la solicitud especificada.
4. La solicitud con el identificador proporcionado no existe.
**Campos de datos:**
- `start_date` (date, obligatorio) — Fecha de inicio de la solicitud a mostrar en el detalle.
- `end_date` (date, obligatorio) — Fecha de fin de la solicitud a mostrar en el detalle.
- `reason` (string, opcional) — Motivo de la solicitud a mostrar en el detalle.
- `status` (enum, obligatorio) — Estado actual de la solicitud a mostrar en el detalle.
- `creation_date` (datetime, obligatorio) — Fecha de creación de la solicitud a mostrar en el detalle.

### REQ-005 — Cancelar una solicitud de vacaciones pendiente
El EMPLEADO puede cancelar una de sus propias solicitudes si está en estado 'Pendiente'. Al confirmar, el estado cambia a 'Cancelada' y la solicitud ya no puede ser procesada.
**Reglas de negocio:**
1. Una solicitud de vacaciones solo puede ser cancelada si su estado es 'Pendiente'.
2. La cancelación de una solicitud transiciona su estado a 'Cancelada'.
3. Una solicitud en estado 'Cancelada' es un estado terminal y no puede ser modificada ni procesada.
4. Un empleado solo puede cancelar sus propias solicitudes de vacaciones.
**Criterios de aceptación:**
1. AC-SOL-03: **Cancelación de una solicitud pendiente:**<br>**Dado** un `EMPLEADO` visualizando una de sus solicitudes en estado `Pendiente`.<br>**Cuando** pulsa el botón "Cancelar" y confirma la acción.<br>**Entonces** el estado de la solicitud cambia a `Cancelada` y las acciones de gestión (aprobar/rechazar) ya no están disponibles para el mánager.
**Escenarios de error:**
1. El identificador de la solicitud proporcionado tiene un formato no válido.
2. El usuario no está autenticado.
3. El usuario no tiene permiso para cancelar la solicitud especificada.
4. La solicitud con el identificador proporcionado no existe.
5. La solicitud no puede ser cancelada porque no se encuentra en estado 'Pendiente'.
**Campos de datos:**
- `status` (enum, obligatorio) — La operación solo es posible si el valor es 'Pendiente' y lo actualiza a 'Cancelada'.

### REQ-012 — El empleado podrá consultar un listado histórico de todas sus solicitudes de vacaciones.
**Reglas de negocio:**<br>- El sistema debe mostrar todas las solicitudes creadas por el empleado que ha iniciado sesión, tanto pasadas como pendientes.<br>- Por defecto, el listado se ordenará por fecha de creación (`created_at`) de forma descendente (la más reciente primero).<br>- Solo se deben mostrar las solicitudes del propio usuario; el acceso a solicitudes de otros empleados debe ser denegado.<br>**Flujo de usuario:**<br>1. El `EMPLEADO` accede a la sección "Mis Solicitudes".<br>2. El sistema presenta una tabla o lista con un resumen de cada solicitud.<br>**Datos mostrados en lista:**<br>- `start_date` (date): Fecha de inicio.<br>- `end_date` (date): Fecha de fin.<br>- `status` (string): Estado actual de la solicitud.<br>- `created_at` (datetime): Fecha de creación.<br>**Seguridad:**<br>- **Actor:** `EMPLEADO`.<br>- **Alcance:** El `EMPLEADO` solo puede ver las solicitudes asociadas a su `employee_id`.<br>**Criterios de aceptación:**<br>- **Given** un `EMPLEADO` ha iniciado sesión y ha creado previamente solicitudes,<br>- **When** navega a la página de su historial de solicitudes,<br>- **Then** ve una lista de todas sus solicitudes, ordenadas de la más reciente a la más antigua.
**Reglas de negocio:**
1. Una solicitud de vacaciones solo es visible por el empleado que la creó.
2. El historial de solicitudes de un empleado contiene todas las solicitudes creadas por él, independientemente de su estado.
**Criterios de aceptación:**
1. AC-SOL-02: **Dado** un `EMPLEADO` que ha creado solicitudes previamente, **cuando** accede a la sección "Mis Solicitudes", **entonces** ve un listado de todas sus solicitudes, ordenadas por fecha de creación descendente.
**Escenarios de error:**
1. El usuario no está autenticado para acceder a sus solicitudes
**Campos de datos:**
- `start_date` (date, obligatorio) — Fecha de inicio de las vacaciones solicitadas.
- `end_date` (date, obligatorio) — Fecha de fin de las vacaciones solicitadas.
- `status` (string, obligatorio) — Enum: 'Pendiente', 'Aprobada', 'Rechazada'
- `created_at` (datetime, obligatorio) — Fecha y hora en que se creó la solicitud.

### REQ-013 — El empleado podrá ver el detalle completo de una solicitud específica de su historial.
**Reglas de negocio:**<br>- Al seleccionar una solicitud del listado, se mostrará toda la información asociada a ella.<br>- Si la solicitud está en estado 'Aprobada', se debe mostrar un enlace para descargar el comprobante PDF (la generación del PDF en sí corresponde a otra épica, pero el enlace se muestra aquí).<br>**Flujo de usuario:**<br>1. El `EMPLEADO` está en la vista de listado (SOL-01).<br>2. Hace clic en una solicitud específica.<br>3. El sistema navega a una vista de detalle.<br>**Datos mostrados en detalle:**<br>- `start_date` (date, obligatorio).<br>- `end_date` (date, obligatorio).<br>- `reason` (text): Motivo completo de la solicitud.<br>- `status` (string, de `cat_request_status`).<br>- `created_at` (datetime).<br>- `updated_at` (datetime): Fecha de la última actualización (aprobación/rechazo).<br>- `manager_notes` (text, opcional): Comentarios del manager si la solicitud fue rechazada.<br>**Escenarios de error:**<br>- Si el `EMPLEADO` intenta acceder a una URL de detalle de una solicitud que no le pertenece, el sistema debe devolver un error 403 Prohibido o 404 No Encontrado.<br>**Seguridad:**<br>- **Actor:** `EMPLEADO`.<br>- **Alcance:** Solo puede ver el detalle de sus propias solicitudes.<br>**Criterios de aceptación:**<br>- **Given** un `EMPLEADO` está en su historial,<br>- **When** hace clic en una solicitud,<br>- **Then** se le muestra una página con todos los detalles de esa solicitud.
**Reglas de negocio:**
1. Un comprobante de vacaciones solo está disponible para su descarga si la solicitud tiene el estado 'Aprobada'.
**Criterios de aceptación:**
1. AC-SOL-03: **Dado** un `EMPLEADO` en la vista de su historial de solicitudes, **cuando** hace clic en una solicitud, **entonces** se le muestra una vista con todos los detalles de esa solicitud.
**Escenarios de error:**
1. El identificador de la solicitud tiene un formato inválido
2. La solicitud especificada no existe o no pertenece al usuario
**Campos de datos:**
- `start_date` (date, obligatorio) — Fecha de inicio de las vacaciones solicitadas.
- `end_date` (date, obligatorio) — Fecha de fin de las vacaciones solicitadas.
- `reason` (string, obligatorio) — Motivo completo o justificación de la solicitud.
- `status` (string, obligatorio) — Enum: 'Pendiente', 'Aprobada', 'Rechazada'
- `created_at` (datetime, obligatorio) — Fecha y hora en que se creó la solicitud.
- `updated_at` (datetime, obligatorio) — Fecha y hora de la última actualización de estado (aprobación/rechazo).
- `manager_notes` (string, opcional) — Comentarios del manager, especialmente en caso de rechazo.

### REQ-014 — El empleado podrá filtrar sus solicitudes por estado.
**Reglas de negocio:**<br>- La interfaz debe permitir al usuario filtrar el listado de solicitudes (SOL-01) por su estado.<br>- Los estados de filtrado deben corresponder a los valores definidos en el catálogo de estados.<br>**Flujo de usuario:**<br>1. El `EMPLEADO` está en la vista de listado (SOL-01).<br>2. Utiliza un control de filtro (ej. desplegable, pestañas) para seleccionar un estado (p. ej. 'Aprobada').<br>3. El listado se actualiza mostrando únicamente las solicitudes que coinciden con ese estado.<br>**Datos:**<br>- Campo de filtro basado en `status`.<br>- **Catálogos:** `cat_request_status` con valores: 'Pendiente', 'Aprobada', 'Rechazada'. **[gap: Confirmar si existen otros estados como 'Cancelada']**.<br>**Seguridad:**<br>- **Actor:** `EMPLEADO`.<br>**Criterios de aceptación:**<br>- **Given** un `EMPLEADO` tiene solicitudes en diferentes estados,<br>- **When** selecciona el filtro 'Pendiente',<br>- **Then** el listado solo muestra sus solicitudes pendientes.
**Reglas de negocio:**
1. El estado de una solicitud de vacaciones debe corresponder a uno de los valores definidos en el catálogo de estados de solicitud.
**Criterios de aceptación:**
1. AC-SOL-04: **Dado** un `EMPLEADO` en su historial con solicitudes en varios estados, **cuando** utiliza el filtro para seleccionar un estado (p. ej. 'Aprobada'), **entonces** el listado se actualiza para mostrar únicamente las solicitudes en dicho estado.
**Validaciones:**
1. El estado seleccionado para el filtro debe corresponder a un valor válido del catálogo de estados ('Pendiente', 'Aprobada', 'Rechazada').
**Escenarios de error:**
1. El valor proporcionado para el filtro de estado no es válido
**Campos de datos:**
- `status` (string, obligatorio) — Enum: 'Pendiente', 'Aprobada', 'Rechazada'

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

Antes de arrancar tu sesión, la plataforma levanta los servicios de abajo como contenedores efímeros y deja sus datos de conexión en `.mind/TSK-004/env.sh` (y en `env.json`). Contrato de uso:

- **Haz `source .mind/TSK-004/env.sh` antes de cada build/test** que necesite el entorno; si el fichero no existe, el entorno NO se pudo levantar (ver el final de esta sección).
- Los tests **leen la conexión de esas variables** (o de Testcontainers, ver abajo). NUNCA hardcodees host, puerto ni credenciales, y NUNCA toques la configuración `local/` del arquetipo para apuntarla a este entorno.
- Son servicios de PRUEBA y efímeros: se destruyen al terminar la sesión. No guardes nada que deba sobrevivir ni los uses como almacén de resultados.

### `oracle` — gvenzl/oracle-free:23-slim (capa `db`)
Por qué está: arrancar la aplicación y ejecutar sus tests de integración.
Variables: `MIND_ENV_ORACLE_HOST`, `MIND_ENV_ORACLE_PORT`, `MIND_ENV_ORACLE_URL`, `MIND_ENV_ORACLE_USER`, `MIND_ENV_ORACLE_PASSWORD`.

**Tests de integración contra `oracle` — reglas de obligado cumplimiento:**
1. El motor del test tiene que ser **el mismo del proyecto**: `gvenzl/oracle-free:23-slim`, vía `org.testcontainers:oracle-free`. NO uses otro motor (ni `PostgreSQLContainer`, ni H2, ni una BBDD embebida) aunque el test 'pase': verificarías contra un dialecto que no es el de producción, que es exactamente cómo se cuelan los defectos de esquema. Esta regla PREVALECE sobre cualquier plantilla o ejemplo de este brief —incluidas las «Plantillas canónicas» del handbook—: si alguna usa otro motor, la plantilla está mal; sigue esta regla y repórtalo como Warning.
2. Fija Testcontainers en **1.21.3 o superior**. El daemon de esta sesión exige API ≥1.40; las versiones anteriores de Testcontainers negocian v1.32 y el daemon las rechaza — el error que verías es `Could not find a valid Docker environment`, que no apunta a la causa. Añadir la dependencia en scope de test está autorizado: es convención del proyecto, no desviación del arquetipo.
   ⚠️ **Ojo con el BOM**: si el proyecto hereda de un padre que gestiona versiones (`spring-boot-starter-parent` y similares), añadir la dependencia SIN `<version>` te dará la versión que pinee el BOM —hoy 1.19.x, justo la incompatible—, no la que necesitas. Sobrescribe la propiedad del BOM en `<properties>` (`<testcontainers.version>1.21.3</testcontainers.version>`), que es el mecanismo previsto para esto; añadir `<version>` suelto en cada dependencia también vale, pero es fácil dejarse una y que convivan dos versiones.
3. El daemon ya está configurado en tu entorno (`DOCKER_HOST`, `DOCKER_API_VERSION`, `TESTCONTAINERS_HOST_OVERRIDE`): NO los toques ni montes el socket. Basta declarar el contenedor en el test.
4. **Si el test no llega a funcionar, NO lo desactives** —ni renombrando el fichero, ni borrándolo, ni comentándolo—: eso quita cobertura de forma invisible para el revisor y para el CI. Déjalo en el entregable, márcalo como que requiere Docker de la forma que el proyecto ya use para eso (etiqueta/anotación condicional) y repórtalo como health check **Warning** con el error EXACTO que te dio. Un test desactivado en silencio es peor que un test que falla.

### Si el entorno no está disponible
Comprueba `.mind/TSK-004/env.json`: si su `status` es `unavailable` o `degraded`, la plataforma no pudo darte (todo) el entorno. En ese caso ESCRIBE igualmente los tests de integración y déjalos en el entregable, y repórtalo como health check **Warning** con `check: entorno-de-prueba` — NO como Blocker: no es un defecto de tu tarea, y la verificación queda diferida al CI. Reserva el Blocker para cuando el entorno SÍ estaba y los tests fallan por el código o por el brief.