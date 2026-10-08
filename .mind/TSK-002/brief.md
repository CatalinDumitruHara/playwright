# TSK-002 · Gestión de Jerarquía Organizativa (Asignación de Managers)

- Componente dueño: `ARC-015`
- Arquetipo del repo: `container-java` — respeta sus convenciones; NUNCA te salgas de él (ver «Contrato de salida del arquetipo»).
- Zonas de código de ESTA tarea (trabajo principal): `sources/src/main/java/com/mapfre/product/microservice/users/`, `sources/src/main/java/com/mapfre/product/microservice/Application.java`. Fuera de ellas NO amplíes alcance de negocio — **EXCEPTO** el composition root y el manifiesto del host necesarios para montar lo entregado (sección Composition root).

## Definition of Done
Extiende la lógica en `UsuarioService` y `UsuarioController` para gestionar las relaciones de manager. Reutiliza los modelos de TSK-01; no redeclara clases. Implementa la asignación, modificación y eliminación de la relación `manager` en la entidad `users`. Tests de integración verifican las reglas de negocio (e.g., un usuario no puede ser su propio manager). Controller montado y probado. Se asume que el esquema T.5 ya está aplicado.

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

### IT-003 — Dado un empleado cuando se intenta asignar a sí mismo como manager entonces la operación falla
**Capa:** backend · **Prioridad:** high · **Categoría:** error_handling
**Componente objetivo:** Servicio de asignación de manager
Valida la regla de negocio que impide que un empleado sea su propio manager, asegurando que el servicio y la base de datos rechazan esta operación.
**Resultado esperado:** La API responde con un error HTTP 400 Bad Request y no se realiza ninguna modificación en la base de datos.
**Precondiciones:**
- Un usuario administrador está autenticado.
**Datos de prueba:**
- Un usuario 'Empleado'.
**Herramientas sugeridas:** JUnit 5, Testcontainers
```gherkin
Scenario: Evitar la auto-asignación de un empleado como su propio manager
  Given existe un usuario Empleado con ID 'emp-123'
  When un administrador intenta asignar al usuario 'emp-123' como manager de sí mismo
  Then la base de datos no debe modificar el registro del empleado 'emp-123'
  And la respuesta debe tener el estado HTTP 400 Bad Request
```

### PT-009 — Dado un administrador cuando consulta la jerarquía completa de la organización entonces la respuesta es rápida
**Capa:** api · **Prioridad:** medium · **Categoría:** performance_threshold
**Componente objetivo:** Servicio de consulta de jerarquía organizacional (10.000 usuarios)
Prueba de carga (load) sobre el endpoint de consulta de la estructura jerárquica, que puede ser una consulta pesada en organizaciones grandes. Valida NFR-001.
**Resultado esperado:** Latencia p95 < 800ms para la respuesta de la primera página del listado. Tasa de errores < 0.1%.
**Precondiciones:**
- El entorno de pruebas está poblado con una estructura de usuarios y managers compleja.
**Datos de prueba:**
- Una base de datos con al menos 10.000 usuarios con relaciones jerárquicas definidas.
**Herramientas sugeridas:** k6

### RT-004 — Dado un empleado con una solicitud pendiente, cuando cambia de manager, entonces la solicitud es visible para el nuevo manager
**Capa:** backend · **Prioridad:** critical · **Categoría:** regression_guard
**Componente objetivo:** Integración entre Gestión de Jerarquía y Gestión de Solicitudes
Prueba de integración crítica que asegura que los cambios en la estructura jerárquica se reflejan correctamente en el flujo de aprobación de solicitudes en curso.
**Resultado esperado:** La solicitud pendiente desaparece del panel de 'Manager A' y aparece en el panel de 'Manager B'.
**Precondiciones:**
- Un empleado tiene una solicitud 'Pendiente' y reporta a 'Manager A'.
- Existe otro 'Manager B'.
**Datos de prueba:**
- Credenciales de un Administrador.
- ID de un empleado con una solicitud pendiente.
- ID de 'Manager A' (actual) y 'Manager B' (nuevo).
**Herramientas sugeridas:** JUnit 5
```gherkin
@regression
Scenario: El cambio de manager reasigna las solicitudes pendientes
  Given un empleado con una solicitud pendiente reporta a 'Manager A'
  When un administrador cambia el manager del empleado a 'Manager B'
  Then la solicitud pendiente ya no es visible para 'Manager A'
  And la solicitud pendiente es ahora visible para 'Manager B'
```

### UT-014 — Dado que un administrador intenta asignar un mánager a un empleado, cuando el empleado es el mismo que el mánager, entonces lanza un error
**Capa:** backend · **Prioridad:** high · **Categoría:** error_handling
**Componente objetivo:** Servicio de asignación de mánager
Verifica la regla de negocio que previene la auto-asignación jerárquica.
**Resultado esperado:** El servicio lanza una excepción de tipo 'AutoAsignacionError' y no realiza cambios.
**Datos de prueba:**
- ID de empleado y ID de mánager que son idénticos.
**Herramientas sugeridas:** Jest

### UT-015 — Dado que un administrador intenta asignar un mánager a un empleado, cuando el empleado ya tiene un mánager, entonces lanza un error de conflicto
**Capa:** backend · **Prioridad:** medium · **Categoría:** error_handling
**Componente objetivo:** Servicio de asignación de mánager
Verifica que no se puede usar el servicio de asignación inicial si ya existe una asignación. Se debe usar el de modificación.
**Resultado esperado:** El servicio lanza una excepción de tipo 'ConflictoAsignacionError' y no realiza cambios.
**Datos de prueba:**
- Mock de un empleado que ya tiene un manager_id asignado.
**Herramientas sugeridas:** Jest

### UT-016 — Dado un administrador, cuando modifica un mánager asignado y el nuevo es igual al anterior, entonces el servicio lanza un error
**Capa:** backend · **Prioridad:** medium · **Categoría:** error_handling
**Componente objetivo:** Servicio de modificación de mánager de un empleado
Verifica que la lógica de modificación de mánager no permite 'cambiar' un mánager por sí mismo.
**Resultado esperado:** El servicio lanza una excepción de validación y no realiza cambios.
**Datos de prueba:**
- Mock de un empleado con un manager_id = X.
- ID del nuevo mánager que también es X.
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

Tus zonas (`sources/src/main/java/com/mapfre/product/microservice/users/`, `sources/src/main/java/com/mapfre/product/microservice/Application.java`) pueden ya contener código de una TSK predecesora mergeada (o del esqueleto). Antes de crear tipos nuevos:

1. **Lista y lee** los ficheros bajo la zona (`ls` / abre `service.py`, `router.py`, …).
2. **EDIT/EXTIENDE** clases, funciones y exports existentes. **PROHIBIDO** una segunda `class`/`def`/export con el **mismo nombre** en el mismo fichero (en Python gana la última y el resto es basura).
3. Si esta tarea es «API pública» / «consulta» sobre el mismo dominio que un CRUD previo, **reutiliza** servicios y modelos; añade solo el router/handlers públicos (montados en el composition root).
4. Un módulo = un dueño semántico de cada símbolo top-level. Si hace falta otro tipo, **nómbralo distinto** o factoriza — no pegues un duplicado al EOF.

El runtime puede anexar la lista real de ficheros presentes en la zona al arrancar la sesión.

## Contrato API congelado (api-contract) — LEY

El `openapi.yaml` del repo (PR #0 / C.2) es el contrato de esta API. Implementa **exactamente** estos endpoints — no inventes paths, verbos ni status distintos.

| EP | Método | Path | Request | Response | Status | Public | Roles |
|----|--------|------|---------|----------|--------|--------|-------|
| `EP-006` | **GET** | `/admin/hierarchy` | `—` | `HierarchyList` | 200 | N | `ROL-003` |
| | | _Consulta la estructura jerárquica de la organización._ | | | | | |
| `EP-007` | **POST** | `/admin/employees/{employeeId}/manager` | `ManagerAssignmentRequest` | `HierarchyNodeDetail` | 201 | N | `ROL-003` |
| | | _Asigna un manager a un empleado que no tiene uno._ | | | | | |
| `EP-008` | **PUT** | `/admin/employees/{employeeId}/manager` | `ManagerAssignmentRequest` | `HierarchyNodeDetail` | 200 | N | `ROL-003` |
| | | _Modifica el manager asignado a un empleado._ | | | | | |
| `EP-009` | **DELETE** | `/admin/employees/{employeeId}/manager` | `—` | `—` | 204 | N | `ROL-003` |
| | | _Elimina la asignación de manager de un empleado._ | | | | | |

### Campos de los schemas de tus endpoints (LEY)

Los nombres, tipos y obligatoriedad de estos campos son el contrato de DATOS: el front tipa su JSON con ellos (`libs/api-types`). Un campo renombrado (`argumentario_content` por `argumentario_venta`, `size` por `page_size`) rompe la operación aunque el path acierte — 17 en el ciclo anterior.

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


Disciplina (api-contract):
1. Path y verbo **literales** del contrato (`/membership-plans`, no `/plans/`; `PUT`, no `PATCH` si el contrato dice PUT).
2. La base pública de la API es **`servers[0].url` del `openapi.yaml`** (p. ej. `/api`): monta los routers de forma que la URL pública sea `base + path` EXACTAMENTE. No inventes otra base ni añadas versiones (`/v1`) que el contrato no traiga: el cliente concatena `base + path` y cualquier otro prefijo le devuelve 404.
3. Status HTTP de la columna Status (POST→201, DELETE→204, resto→200) salvo que `openapi.yaml` declare otro.
4. Prefijos de montaje (`include_router`) deben hacer que la URL pública coincida con `base + path` del contrato.
5. Los schemas CON campos (tabla de arriba) son LEY: mismos nombres, tipos y obligatoriedad en tus DTO. Los que aún no tienen campos son gérmenes: rellénalos con el modelo real; **no** reescribas `openapi.yaml` para legitimar un path inventado.
6. Si el DoD te pide un comportamiento que ningún endpoint de la tabla cubre (desarchivar, restaurar, desmarcar…), NO lo resuelvas inventando una ruta: entrégalo con el endpoint que más se le parezca y **repórtalo como health check `Warning` con `check: api-contract`** para que arquitectura lo añada. Una ruta inventada es invisible para el cliente.
7. Si el repo trae `.mind/contract-pending.json` (PR #0), **quita de `pending` los EP que implementas en este mismo PR**: el test de contrato del repo (`tests/contract/`) deja de exonerarlos y pasa a exigirlos, y el runtime comprueba que no dejas los tuyos pendientes. No quites los de otras tareas.
7. Monta el guard con los códigos de la columna Roles. No inventes roles. Si Public=N y Roles=`deny-all`, NO expongas la ruta: avísalo en el PR.

_(Resto del contrato del proyecto, que NO materializa esta tarea: `EP-001` GET /admin/users, `EP-002` POST /admin/users, `EP-003` GET /admin/users/{userId}, `EP-004` PUT /admin/users/{userId}, `EP-005` PATCH /admin/users/{userId}/status, `EP-010` GET /profile/me, `EP-011` GET /profile/my-team, `EP-012` POST /vacation-requests, `EP-013` GET /vacation-requests/my-requests, `EP-014` GET /vacation-requests/{requestId}, `EP-015` POST /vacation-requests/{requestId}/cancel, `EP-016` GET /vacation-requests/{requestId}/proof-document, `EP-017` GET /team/vacation-requests, `EP-018` GET /team/vacation-requests/{requestId}, `EP-019` POST /team/vacation-requests/{requestId}/approve, `EP-020` POST /team/vacation-requests/{requestId}/reject, `EP-021` POST /reports/monthly-requests/export-jobs, `EP-022` GET /reports/export-jobs/{jobId}. Está aquí para que no dupliques ni pises lo de otra tarea.)_

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

### REQ-006 — Asignar un manager a un empleado
Un administrador puede establecer la relación de dependencia directa, asignando un manager a un empleado que no tenga uno asignado. <br/><br/>**Actor:** `ADMINISTRADOR` [inferido de la épica] <br/>**Datos:** `employee_id` (obligatorio, de la lista de usuarios), `manager_id` (obligatorio, de la lista de usuarios con rol `MANAGER`). <br/>**Reglas de negocio:**<br/>- Un empleado solo puede tener un manager directo a la vez. <br/>- Un usuario no puede ser su propio manager. <br/>- La asignación solo puede ser realizada por un `ADMINISTRADOR`. <br/>**Flujo:**<br/>1. El `ADMINISTRADOR` accede a la sección de gestión de jerarquía. <br/>2. Selecciona un empleado de la lista. <br/>3. El sistema muestra los detalles del empleado, indicando si tiene un manager asignado. <br/>4. El `ADMINISTRADOR` selecciona un manager de un desplegable/buscador filtrado por usuarios con rol `MANAGER`. <br/>5. El `ADMINISTRADOR` confirma la asignación. <br/>**Criterios de aceptación:**<br/>- **Given** un `ADMINISTRADOR` en la pantalla de gestión de jerarquía <br/>- **And** ha seleccionado un empleado sin manager asignado <br/>- **When** selecciona un manager válido y guarda los cambios <br/>- **Then** el sistema almacena la relación `empleado -> manager` y la muestra en la interfaz. <br/>**Errores:**<br/>- Si se intenta asignar un manager a un empleado que ya tiene uno, el sistema debe bloquear la operación y sugerir la modificación (ver `ORG-02`). <br/>- Si el `employee_id` o `manager_id` no existen, devolver un error.
**Reglas de negocio:**
1. Un empleado solo puede tener un manager directo en un momento dado.
2. Un empleado no puede ser su propio manager.
**Criterios de aceptación:**
1. AC-ORG-01: **Gestión de la línea de reporte**<br/>**Dado** un Administrador en la sección de gestión de jerarquía,<br/>**Cuando** asigna un nuevo manager a un empleado o modifica el existente,<br/>**Entonces** el sistema actualiza la estructura jerárquca de forma inmediata y consistente.
**Validaciones:**
1. El `employee_id` es obligatorio.
2. El `manager_id` es obligatorio.
3. El `employee_id` debe corresponder a un usuario existente.
4. El `manager_id` debe corresponder a un usuario existente con el rol 'MANAGER'.
5. El valor de `employee_id` no puede ser igual al de `manager_id`.
**Escenarios de error:**
1. El usuario no tiene permisos para asignar managers.
2. El ID del empleado o del manager tiene un formato inválido.
3. El empleado especificado no existe.
4. El manager especificado no existe.
5. El empleado ya tiene un manager asignado.
6. Un empleado no puede ser asignado como su propio manager.
7. El usuario seleccionado como manager no tiene el rol apropiado.
**Campos de datos:**
- `employee_id` (string, obligatorio) — Debe corresponder a un usuario existente.
- `manager_id` (string, obligatorio) — Debe ser un usuario con rol 'MANAGER' y no puede ser el mismo que el empleado.

### REQ-007 — Modificar el manager asignado a un empleado
Un administrador puede cambiar el manager asignado a un empleado por otro distinto. <br/><br/>**Actor:** `ADMINISTRADOR` [inferido de la épica] <br/>**Datos:** `employee_id` (obligatorio, de la lista de usuarios), `new_manager_id` (obligatorio, de la lista de usuarios con rol `MANAGER`). <br/>**Reglas de negocio:**<br/>- Aplican las mismas reglas que en `ORG-01`.<br/>- La modificación sobrescribe la asignación anterior. No se mantiene un histórico de managers en esta funcionalidad. <br/>**Flujo:**<br/>1. El `ADMINISTRADOR` selecciona un empleado que ya tiene un manager. <br/>2. Pulsa la opción de 'Cambiar manager'. <br/>3. Selecciona un nuevo manager del desplegable/buscador. <br/>4. Confirma el cambio. El sistema debe solicitar confirmación explícita. <br/>**Criterios de aceptación:**<br/>- **Given** un `ADMINISTRADOR` en la pantalla de gestión de jerarquía <br/>- **And** ha seleccionado un empleado con un manager asignado <br/>- **When** selecciona un nuevo manager y confirma el cambio <br/>- **Then** el sistema actualiza la relación, reemplazando al manager anterior por el nuevo. <br/>**Errores:**<br/>- Si se intenta asignar como nuevo manager al mismo que ya está asignado, el sistema muestra un aviso y no realiza cambios.
**Reglas de negocio:**
1. El nuevo manager asignado a un empleado debe ser diferente al manager asignado actualmente.
2. Un empleado no puede ser asignado como su propio manager.
3. La modificación del manager de un empleado reemplaza la asignación previa, sin conservar un historial de managers.
**Criterios de aceptación:**
1. AC-ORG-01: **Gestión de la línea de reporte**<br/>**Dado** un Administrador en la sección de gestión de jerarquía,<br/>**Cuando** asigna un nuevo manager a un empleado o modifica el existente,<br/>**Entonces** el sistema actualiza la estructura jerárquca de forma inmediata y consistente.
**Validaciones:**
1. El `employee_id` es obligatorio.
2. El `new_manager_id` es obligatorio.
3. El `employee_id` debe corresponder a un usuario existente.
4. El `new_manager_id` debe corresponder a un usuario existente con el rol 'MANAGER'.
5. El valor de `employee_id` no puede ser igual al de `new_manager_id`.
**Escenarios de error:**
1. El usuario no tiene permisos para modificar asignaciones.
2. El ID del empleado o del nuevo manager tiene un formato inválido.
3. El empleado especificado no existe.
4. El nuevo manager especificado no existe.
5. El empleado no tiene un manager asignado para poder modificarlo.
6. El nuevo manager es el mismo que el actualmente asignado.
7. Un empleado no puede ser asignado como su propio manager.
8. El usuario seleccionado como nuevo manager no tiene el rol apropiado.
**Campos de datos:**
- `employee_id` (string, obligatorio) — Debe corresponder a un usuario existente.
- `new_manager_id` (string, obligatorio) — Debe ser un usuario con rol 'MANAGER' y no puede ser el mismo que el manager actual.

### REQ-008 — Eliminar la asignación de manager de un empleado
Un administrador puede desvincular a un empleado de su manager directo, dejándolo sin asignación. <br/><br/>**Actor:** `ADMINISTRADOR` [inferido de la épica] <br/>**Flujo:**<br/>1. El `ADMINISTRADOR` selecciona un empleado con un manager asignado. <br/>2. Pulsa la opción 'Eliminar asignación'. <br/>3. El sistema solicita confirmación explícita para evitar acciones accidentales. <br/>4. Tras confirmar, el empleado queda sin manager directo. <br/>**Reglas de negocio:**<br/>- Un empleado sin manager no puede solicitar vacaciones hasta que se le asigne uno. [inferido, a validar con el cliente] <br/>**Criterios de aceptación:**<br/>- **Given** un `ADMINISTRADOR` en la pantalla de gestión de jerarquía <br/>- **And** ha seleccionado un empleado con un manager asignado <br/>- **When** elige la opción de eliminar la asignación y confirma <br/>- **Then** el sistema elimina la relación y el empleado aparece sin manager.
**Reglas de negocio:**
1. Un empleado debe tener un manager asignado para poder solicitar vacaciones.
**Criterios de aceptación:**
1. AC-GEE-02: **Dado** un `ADMINISTRADOR` gestionando la jerarquía,<br/>**cuando** selecciona un empleado y le asigna, cambia o elimina su manager directo,<br/>**entonces** el sistema refleja el cambio correctamente para el enrutamiento de futuras solicitudes.
**Validaciones:**
1. El `employee_id` del empleado cuya asignación se va a eliminar es obligatorio.
2. El `employee_id` proporcionado debe corresponder a un usuario existente.
**Escenarios de error:**
1. El usuario no tiene permisos para eliminar asignaciones.
2. El ID del empleado tiene un formato inválido.
3. El empleado especificado no existe.
4. El empleado no tiene un manager asignado que pueda ser eliminado.
**Campos de datos:**
- `employee_id` (string, obligatorio) — Debe corresponder a un usuario existente que tenga un manager asignado.

### REQ-009 — Consultar la estructura jerárquica
Un administrador debe poder visualizar las relaciones de dependencia existentes para facilitar su gestión. <br/><br/>**Actor:** `ADMINISTRADOR` [inferido de la épica] <br/>**Detalle:** El sistema presentará una lista o vista que muestre a cada empleado y el manager que tiene asignado. Debe incluir funcionalidades de búsqueda y filtrado para ser operativa. <br/>**Datos a mostrar por fila:** `employee_name`, `employee_email`, `assigned_manager_name`. <br/>**Filtros:**<br/>- `filter_by_manager`: para ver todos los empleados que reportan a un manager concreto. <br/>- `filter_by_unassigned`: para ver todos los empleados sin manager. <br/>**Criterios de aceptación:**<br/>- **Given** un `ADMINISTRADOR` en la pantalla de gestión de jerarquía <br/>- **When** la pantalla carga <br/>- **Then** se muestra una lista paginada de todos los empleados con su manager asignado (o 'No asignado').
**Reglas de negocio:**
1. Un empleado solo puede tener un manager asignado a la vez.
2. Un empleado puede no tener un manager asignado.
**Criterios de aceptación:**
1. AC-ORG-02: **Consulta de la estructura jerárquica**<br/>**Dado** un Administrador en la sección de gestión de jerarquía,<br/>**Cuando** aplica filtros para ver empleados sin manager o los que reportan a un manager específico,<br/>**Entonces** la vista se actualiza mostrando únicamente los registros que cumplen con el criterio de filtrado.
**Validaciones:**
1. Si se utiliza el filtro `filter_by_manager`, el valor proporcionado debe corresponder a un ID de un manager existente.
**Escenarios de error:**
1. El usuario no tiene permisos para consultar la jerarquía.
2. El valor proporcionado para un filtro de búsqueda no es válido.
**Campos de datos:**
- `employee_name` (string, obligatorio) — Nombre completo del empleado a mostrar en la lista.
- `employee_email` (email, obligatorio) — Correo electrónico del empleado a mostrar en la lista.
- `assigned_manager_name` (string, opcional) — Puede estar vacío si el empleado no tiene manager asignado.
- `filter_by_manager` (string, opcional) — Recibe el identificador de un manager.
- `filter_by_unassigned` (boolean, opcional) — Filtro para ver todos los empleados sin manager asignado.

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

Antes de arrancar tu sesión, la plataforma levanta los servicios de abajo como contenedores efímeros y deja sus datos de conexión en `.mind/TSK-002/env.sh` (y en `env.json`). Contrato de uso:

- **Haz `source .mind/TSK-002/env.sh` antes de cada build/test** que necesite el entorno; si el fichero no existe, el entorno NO se pudo levantar (ver el final de esta sección).
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
Comprueba `.mind/TSK-002/env.json`: si su `status` es `unavailable` o `degraded`, la plataforma no pudo darte (todo) el entorno. En ese caso ESCRIBE igualmente los tests de integración y déjalos en el entregable, y repórtalo como health check **Warning** con `check: entorno-de-prueba` — NO como Blocker: no es un defecto de tu tarea, y la verificación queda diferida al CI. Reserva el Blocker para cuando el entorno SÍ estaba y los tests fallan por el código o por el brief.

## Estado del build al cerrar el intento anterior

El intento anterior dejó el módulo COMPILANDO, pero el artefacto entregado **no arrancaría** (o incumple el contrato que declara). El compilador está en VERDE: **no busques ahí y no pierdas el intento intentando reproducir un fallo de compilación que no existe**. Lo que falla es exactamente lo que dice el informe de abajo, y es lo PRIMERO que tienes que arreglar, antes de añadir nada nuevo.

- Arregla lo que nombra el informe, en el sitio que nombra. No hace falta reproducirlo con el compilador: ya compila.
- Si el defecto viene de la rama BASE y no de tu trabajo, arréglalo igual y decláralo como `health_check` de severidad Warning indicando el fichero y por qué lo tocaste.
- **No borres ni desactives tests para que el informe calle.** Si crees que el informe se equivoca, entrégalo con un `health_check` Blocker explicando por qué; quitar cobertura para tapar una señal es peor que la señal.

### Lo que reportó la verificación (literal)

```
api-contract: rutas del componente no alineadas con el contrato de esta tarea (EP del brief / `arch_api_endpoint`).
Rutas inventadas en la zona de la tarea (no están en el contrato del componente): `GET /admin/users`, `POST /admin/users`, `GET /admin/users/{userId}`, `PUT /admin/users/{userId}`, `PATCH /admin/users/{userId}/status`. Usa el path/verbo literales del OpenAPI.
```