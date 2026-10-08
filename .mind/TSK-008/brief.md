# TSK-008 · Implementación del servicio de generación de comprobantes PDF

- Componente dueño: `ARC-016`
- Arquetipo del repo: `batch` — respeta sus convenciones; NUNCA te salgas de él (ver «Contrato de salida del arquetipo»).
- Zonas de código de ESTA tarea (trabajo principal): `sources/src/main/java/com/mapfre/product/batch/documents/pdf/`, `sources/src/main/java/com/mapfre/product/batch/documents/DocumentoService.java`. Fuera de ellas NO amplíes alcance de negocio — **EXCEPTO** el composition root y el manifiesto del host necesarios para montar lo entregado (sección Composition root).

## Definition of Done
Se crea un servicio (p. ej. `DocumentoService`) capaz de generar un stream de datos PDF. Un test unitario invoca el servicio con datos de prueba y verifica que el PDF generado contiene los datos obligatorios de REQ-027 (nombre de empleado, fechas de inicio/fin, fecha de aprobación, nombre de empresa). La implementación respeta la convención de nombrado de fichero de REQ-026.

## Composition root (composition-root) — OBLIGATORIO

Un módulo con router/controller que **no está montado** en el composition root del proceso NO cuenta como entregado.

Raíces reales del arquetipo `batch`: `docker/`, `sources/`. El composition root y el código nuevo viven BAJO esas raíces; no abras un segundo árbol (`src/` junto a `sources/`, `backend/` junto a `apps/`).

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

Tus zonas (`sources/src/main/java/com/mapfre/product/batch/documents/pdf/`, `sources/src/main/java/com/mapfre/product/batch/documents/DocumentoService.java`) pueden ya contener código de una TSK predecesora mergeada (o del esqueleto). Antes de crear tipos nuevos:

1. **Lista y lee** los ficheros bajo la zona (`ls` / abre `service.py`, `router.py`, …).
2. **EDIT/EXTIENDE** clases, funciones y exports existentes. **PROHIBIDO** una segunda `class`/`def`/export con el **mismo nombre** en el mismo fichero (en Python gana la última y el resto es basura).
3. Si esta tarea es «API pública» / «consulta» sobre el mismo dominio que un CRUD previo, **reutiliza** servicios y modelos; añade solo el router/handlers públicos (montados en el composition root).
4. Un módulo = un dueño semántico de cada símbolo top-level. Si hace falta otro tipo, **nómbralo distinto** o factoriza — no pegues un duplicado al EOF.

El runtime puede anexar la lista real de ficheros presentes en la zona al arrancar la sesión.

## Contrato API congelado (api-contract) — LEY

El `openapi.yaml` del repo (PR #0 / C.2) es el contrato de esta API. Esta tarea no es dueña de ningún endpoint: la tabla va como CONTEXTO — no montes rutas nuevas, y si tocas las que hay, respétalas al pie de la letra.

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

> El repo se genera desde el arquetipo `batch` (ArqRef MAPFRE). Produce EXACTAMENTE ficheros con la estructura, rutas y HERRAMIENTA de este arquetipo, imitando el esqueleto/ejemplos de abajo. NO improvises otra herramienta ni otra disposición (p.ej. si el arquetipo usa Liquibase, NO uses Flyway). Extiende el esqueleto; no lo reinventes.

**Raíz del proyecto**: el código va bajo `sources/`, `local/`, `apps/`, `libs/`, `src/` — donde el arquetipo pone el suyo. Si el repo está vacío y tienes que andamiarlo, respeta esa raíz en vez de elegir una nueva: el resto del aprovisionamiento (pipelines del arquetipo, verificación de build, empaquetado) espera encontrarlo ahí.

### Estructura del proyecto (del arquetipo)
La estructura básica del repositorio destinado a desarrollar una aplicación batch es la siguiente:

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
- `docker/docker-compose.yaml`: `docker compose` para desplegar la aplicación junto con las dependencias que necesite.
- `docker/dockerignore`: archivo para ignorar ficheros y directorios durante el proceso de construcción de la imagen, con el objetivo de evitar que estos se copien a la imagen del contenedor por error.
- `maven/settings.xml`: fichero de configuración para maven, preconfigurado para utilizar el repositorio de `Azure Artifacts`. A este fichero es necesita configurar el `PAT` asociado al usuario.
- `sources`: carpeta donde se aloja el código fuente de la aplicación. Por defecto se genera una aplicación spring boot con la configuración indicada en el wizard de Marketplace durante el proceso de creación.


La estructura de la aplicación base, en caso de no requerir crear módulos adicionales,  sería la que se puede ver a continuación dentro de la carpeta `sources`:


```sh
├── README.md
├── docker
│   ├── Dockerfile
│   └── docker-compose.yml
├── maven
│   └── settings.xml
├── security-metadata.toml
└── sources
    ├── lombok.config
    ├── mvnw
    ├── mvnw.cmd
    ├── pom.xml
    └── src
        ├── main
        │   ├── java
        │   │   └── com
        │   │       └── mapfre
        │   │           └── product
        │   │               └── batch
        │   │                   ├── Application.java
        │   │                   ├── BatchConfig.java
        │   │                   ├── listener
        │   │                   │   └── JobCompletionNotificationListener.java
        │   │                   ├── model
        │   │                   │   └── Mock.java
        │   │                   ├── processor
        │   │                   │   └── SampleDataProcessor.java
        │   │                   ├── reader
        │   │                   │   └── MockReader.java
        │   │                   └── writer
        │   │                       └── MockWriter.java
        │   └── resources
        │       ├── application.yml
        │       └── logback-spring.xml
        └── test
            └── java
                └── com
                    └── mapfre
                        └── product
                            └── microservice
                                └── ApplicationTests.java
```

Al crear el arquetipo se crea una aplicación de ejemplo que se puede ejecutar y probar. Esta aplicación de ejemplo está destinada a ser un punto de partida para el desarrollo de la aplicación real. La aplicación de ejemplo incluye un `Job` que lee datos de un `MockReader`, los procesa con un `SampleDataProcessor` y los escribe en un `MockWriter`. El `Job` se ejecuta al iniciar la aplicación.
El `Job` se configura en la clase `BatchConfig`, que es la encargada de definir el flujo de trabajo del `Job`. La clase `Application` es la encargada de iniciar la aplicación y ejecutar el `Job`.
La clase `Mock` es un modelo de datos de ejemplo que se utiliza para simular la lectura y escritura de datos. El `MockReader` es un lector de datos que simula la lectura de datos desde una fuente externa, en este caso, un array de objetos `Mock`. El `SampleDataProcessor` es un procesador de datos que simula el procesamiento de los datos leídos, en este caso, simplemente convierte los datos a mayúsculas. El `MockWriter` es un escritor de datos que simula la escritura de los datos procesados en una salida externa, en este caso, simplemente imprime los datos en la consola.
El `Job` se configura para que se ejecute al iniciar la aplicación, y se puede personalizar para adaptarse a las necesidades específicas de la aplicación real. La configuración del `Job` se realiza en la clase `BatchConfig`, donde se definen los pasos del `Job`, los lectores, procesadores y escritores de datos.

La clase `ApplicationTests` es una clase de prueba que se utiliza para probar la aplicación. Esta clase utiliza el framework de pruebas de Spring Boot para realizar pruebas unitarias y de integración en la aplicación. La clase `ApplicationTests` incluye un método de prueba que verifica que el `Job` se ejecuta correctamente y que los datos se procesan y escriben correctamente.

### Esqueleto y ejemplos (imítalos exactamente)
#### `sources/src/main/java/com/mapfre/test/acme/batch/Application.java`
```java
package com.mapfre.test.acme.batch;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Application {

	public static void main(String[] args) {
		SpringApplication.run(Application.class, args);
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
        <version>3.5.4</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>
    
    <groupId>com.mapfre.test</groupId>
    <artifactId>acme</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    
    <name>batch</name>
    <description>Arquetipo para el desarrollo de procesos batch robustos basados en Spring Boot, diseñado para la ejecución eficiente de tareas programadas de alto rendimiento y completamente integrado con la Arquitectura de Referencia de MAPFRE</description>
    
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
    </properties>
    
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-batch</artifactId>
        </dependency>
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
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
                            <version>1.18.36</version>
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
#### `sources/src/main/resources/application.yml`
```yml
logging:
  appender: ${LOGGING_APPENDER:CONSOLE}
  level.com.mapfre.product.batch.*: ${LOG_LEVEL:info}

spring:
  main.banner-mode: "off"
  application:
    name: batch
  batch:
    jdbc:
      initialize-schema: "always"

```
#### `sources/src/main/resources/logback-spring.xml`
```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration>
<configuration scan="true">
  <statusListener class="ch.qos.logback.core.status.NopStatusListener" />
  <springProperty scope="context" name="loggingAppender" source="logging.appender"/>
  <include resource="org/springframework/boot/logging/logback/defaults.xml" />
  <include resource="org/springframework/boot/logging/logback/console-appender.xml" />

  <appender name="JSON" class="ch.qos.logback.core.ConsoleAppender">
    <encoder class="ch.qos.logback.classic.encoder.JsonEncoder"/>
  </appender>

  <root level="info">
    <appender-ref ref="${loggingAppender}" />
  </root>

  <contextListener class="ch.qos.logback.classic.jul.LevelChangePropagator">
    <resetJUL>true</resetJUL>
  </contextListener>
</configuration>

```
#### `sources/src/main/java/com/mapfre/test/acme/batch/BatchConfig.java`
```java
package com.mapfre.test.acme.batch;

import com.mapfre.test.acme.batch.listener.JobCompletionNotificationListener;
import com.mapfre.test.acme.batch.model.Mock;
import com.mapfre.test.acme.batch.processor.SampleDataProcessor;
import com.mapfre.test.acme.batch.reader.MockReader;
import com.mapfre.test.acme.batch.writer.MockWriter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;

@Slf4j
@Configuration
public class BatchConfig {

    @Bean
    Step transformData(JobRepository jobRepository, DataSourceTransactionManager transactionManager,
                       MockReader reader, MockWriter mockWriter, SampleDataProcessor processor) {
        return new StepBuilder("step1", jobRepository)
                .<Mock, Mock>chunk(3, transactionManager)
                .reader(reader)
                .processor(processor)
                .writer(mockWriter)
                .build();
    }

    @Bean
    Job importSampleData(JobRepository jobRepository, Step transformData, JobCompletionNotificationListener listener) {
        return new JobBuilder("importUserJob", jobRepository)
                .start(transformData)
                .listener(listener)
                .build();
    }
}

```
#### `sources/src/test/java/com/mapfre/test/acme/batch/ApplicationTests.java`
```java
package com.mapfre.test.acme.batch;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class ApplicationTests {

	@Test
	void contextLoads() {
	}

}

```
#### `sources/src/test/java/com/mapfre/test/acme/batch/BatchConfigTest.java`
```java
package com.mapfre.test.acme.batch;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.mock;

import com.mapfre.test.acme.batch.listener.JobCompletionNotificationListener;
import com.mapfre.test.acme.batch.processor.SampleDataProcessor;
import com.mapfre.test.acme.batch.reader.MockReader;
import com.mapfre.test.acme.batch.writer.MockWriter;
import org.junit.jupiter.api.Test;

import org.springframework.batch.core.Job;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;

@SpringBootTest
class BatchConfigTest {

    /**
     * Tests for the transformData method in the BatchConfig class.
     * The method configures a Step in a Spring Batch Job for processing Mock data entities.
     */

    @Test
    void testTransformDataCreation() {
        // Arrange
        JobRepository jobRepository = mock(JobRepository.class);
        DataSourceTransactionManager transactionManager = mock(DataSourceTransactionManager.class);
        MockReader reader = mock(MockReader.class);
        MockWriter writer = mock(MockWriter.class);
        SampleDataProcessor processor = mock(SampleDataProcessor.class);

        BatchConfig batchConfig = new BatchConfig();

        // Act
        Step step = batchConfig.transformData(jobRepository, transactionManager, reader, writer, processor);

        // Assert
        assertNotNull(step, "The transformData Step should be successfully created");
    }

    @Test
    void testJobCreation() {
        // Arrange
        JobRepository jobRepository = mock(JobRepository.class);
        Step step = mock(Step.class);
        JobCompletionNotificationListener listener = mock(JobCompletionNotificationListener.class);

        BatchConfig batchConfig = new BatchConfig();

        // Act
        Job job = batchConfig.importSampleData(jobRepository, step, listener);

        // Assert
        assertNotNull(job, "The Job with transformData Step should be successfully created");
    }
}
```
#### `sources/src/main/java/com/mapfre/test/acme/batch/listener/JobCompletionNotificationListener.java`
```java
package com.mapfre.test.acme.batch.listener;

import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.core.BatchStatus;
import org.springframework.batch.core.JobExecution;
import org.springframework.batch.core.JobExecutionListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class JobCompletionNotificationListener implements JobExecutionListener {

    @Override
    public void afterJob(JobExecution jobExecution) {
        if (jobExecution.getStatus() == BatchStatus.COMPLETED) {
            log.info("Job Finished! Now you can verify the results");
        }
    }
}

```
#### `sources/src/main/java/com/mapfre/test/acme/batch/model/Mock.java`
```java
package com.mapfre.test.acme.batch.model;

public record Mock (String data) {
}
```
#### `sources/src/main/java/com/mapfre/test/acme/batch/processor/SampleDataProcessor.java`
```java
package com.mapfre.test.acme.batch.processor;

import com.mapfre.test.acme.batch.model.Mock;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.item.ItemProcessor;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class SampleDataProcessor implements ItemProcessor<Mock, Mock> {

    @Override
    public Mock process(final Mock sample) {
        final String data = sample.data().toUpperCase();
        final Mock transformedSample = new Mock(data);
        log.info("Converting ({}) into ({})", sample, transformedSample);
        return transformedSample;
    }
}

```
#### `sources/src/main/java/com/mapfre/test/acme/batch/reader/MockReader.java`
```java
package com.mapfre.test.acme.batch.reader;

import com.mapfre.test.acme.batch.model.Mock;
import org.springframework.batch.item.ItemReader;
import org.springframework.stereotype.Component;

@Component
public class MockReader implements ItemReader<Mock> {

    private int count = 0;
    private static final int MAX_COUNT = 10;

    @Override
    public Mock read() {
        if (count < MAX_COUNT) {
            count++;
            return new Mock("sample" + count);
        } else {
            return null; // Indicate end of data
        }
    }

}

```
#### `sources/src/main/java/com/mapfre/test/acme/batch/writer/MockWriter.java`
```java
package com.mapfre.test.acme.batch.writer;

import com.mapfre.test.acme.batch.model.Mock;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.item.Chunk;
import org.springframework.batch.item.ItemWriter;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class MockWriter implements ItemWriter<Mock> {
    @Override
    public void write(Chunk<? extends Mock> chunk) throws Exception {
        for (Mock sample : chunk.getItems()) {
            log.info("Writing sample: {}", sample);
        }
    }
}

```
#### `sources/src/test/java/com/mapfre/test/acme/batch/listener/JobCompletionNotificationListenerTest.java`
```java
package com.mapfre.test.acme.batch.listener;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;

import org.springframework.batch.core.BatchStatus;
import org.springframework.batch.core.JobExecution;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
public class JobCompletionNotificationListenerTest {

    @Test
    void testAfterJobWithCompletedStatus() {
        // Arrange
        JobExecution jobExecution = mock(JobExecution.class);
        when(jobExecution.getStatus()).thenReturn(BatchStatus.COMPLETED);

        JobCompletionNotificationListener listener = new JobCompletionNotificationListener();

        // Act
        listener.afterJob(jobExecution);

        // Assert
        verify(jobExecution, times(1)).getStatus();
    }

    @Test
    void testAfterJobWithNonCompletedStatus() {
        // Arrange
        JobExecution jobExecution = mock(JobExecution.class);
        when(jobExecution.getStatus()).thenReturn(BatchStatus.FAILED);

        JobCompletionNotificationListener listener = new JobCompletionNotificationListener();

        // Act
        listener.afterJob(jobExecution);

        // Assert
        verify(jobExecution, times(1)).getStatus();
    }
}
```
#### `sources/src/test/java/com/mapfre/test/acme/batch/processor/SampleDataProcessorTest.java`
```java
package com.mapfre.test.acme.batch.processor;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.mapfre.test.acme.batch.model.Mock;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;

import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class SampleDataProcessorTest {

    @InjectMocks
    private SampleDataProcessor sampleDataProcessor;

    @Test
    void testProcess_withValidData_transformsDataToUpperCase() {
        // Arrange
        Mock inputMock = new Mock("testdata");

        // Act
        Mock result = sampleDataProcessor.process(inputMock);

        // Assert
        assertEquals("TESTDATA", result.data());
    }

    @Test
    void testProcess_withEmptyData_transformsToEmptyString() {
        // Arrange
        Mock inputMock = new Mock("");

        // Act
        Mock result = sampleDataProcessor.process(inputMock);

        // Assert
        assertEquals("", result.data());
    }

    @Test
    void testProcess_withNullData_throwsNullPointerException() {
        // Arrange
        Mock inputMock = new Mock(null);

        // Act and Assert
        try {
            sampleDataProcessor.process(inputMock);
        } catch (NullPointerException e) {
            assertEquals("Cannot invoke \"String.toUpperCase()\" because the return value of \"com.mapfre.test.acme.batch.model.Mock.data()\" is null", e.getMessage());
        }
    }
}
```
#### `sources/src/test/java/com/mapfre/test/acme/batch/reader/MockReaderTest.java`
```java
package com.mapfre.test.acme.batch.reader;

import static org.assertj.core.api.Assertions.assertThat;

import com.mapfre.test.acme.batch.model.Mock;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class MockReaderTest {

    @Autowired
    private MockReader mockReader;

    @Test
    void read_ShouldReturnMockObjectsWithIncrementingValues() throws Exception {
        // Act & Assert
        Mock mock = mockReader.read();
        assertThat(mock).isNull();

    }

    @Test
    void read_ShouldReturnNullAfterMaxCount() throws Exception {
        // Create a new instance to avoid dependency on other tests
        MockReader localReader = new MockReader();

        // Read all items
        for (int i = 0; i < 10; i++) {
            localReader.read();
        }

        // Verify it returns null when we reach MAX_COUNT
        assertThat(localReader.read()).isNull();

        // Verify subsequent calls also return null
        assertThat(localReader.read()).isNull();
    }
}
```
> (Se omitieron ficheros del arquetipo por tamaño; respeta las convenciones mostradas en los ejemplos anteriores para el resto.)

## Guía del programador del proyecto (convenciones — T.7, aprobada)

**Precedencia (handbook-filter):** si esta guía choca con el **contrato ArqRef** o el **DoD de ESTA tarea**, ganan ArqRef y el DoD. Solo se incluyen convenciones del stack de esta TSK; se omiten slices de otros lenguajes/frameworks (p. ej. Angular HttpClient en una TSK React, FastAPI en un SPA).

### Librerías del handbook (pines — dependency-pins)
Usa estas coordenadas/versiones en el manifiesto del host; no improvises latest sin pin.
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

## Requisitos que materializa esta tarea

### COMMS-DOC-01 — Generar comprobante PDF de vacaciones aprobadas
Genera un documento PDF que sirve como comprobante para el EMPLEADO una vez que su solicitud de vacaciones ha sido aprobada.
**Reglas de negocio:**
1. La generación y descarga se habilitan únicamente cuando la solicitud tiene el estado 'APROBADA'.
2. El `EMPLEADO` titular de la solicitud y su `MANAGER` pueden descargarlo desde la vista de detalle de la solicitud.
3. El fichero permanece disponible para descarga mientras la solicitud exista en el sistema.
4. Convención de nombre del fichero: `comprobante_vacaciones_<ID_solicitud>.pdf`.
5. El canal de entrega es la descarga directa desde el portal web.
**Criterios de aceptación:**
1. Given una solicitud de vacaciones está en estado 'APROBADA' When el `EMPLEADO` o su `MANAGER` acceden a la vista de detalle de la misma Then el sistema muestra una opción (botón o enlace) para "Descargar Comprobante PDF".
2. Given el usuario descarga el comprobante When lo abre Then el fichero PDF contiene la información correcta y completa de la solicitud aprobada.
**Validaciones:**
1. La solicitud debe estar en estado 'APROBADA' para permitir la generación.
2. Todos los datos obligatorios (empleado, fechas, manager) deben estar presentes en la solicitud antes de generar el documento.
**Escenarios de error:**
1. Faltan datos obligatorios para generar el documento -> La generación falla y se muestra un error informativo al usuario
2. Error en el servicio de generación de PDF -> El sistema realiza un reintento automático; si persiste, se registra una alerta para el equipo de soporte técnico
**Campos de datos:**
- `titulo` (string, obligatorio) — 'Comprobante de Vacaciones Aprobadas'
- `referencia` (string, obligatorio) — -
- `fecha` (date, obligatorio) — Formato YYYY-MM-DD
- `cuerpo` (object, obligatorio) — Debe incluir: Datos del empleado, fechas de inicio/fin de las vacaciones y nombre del manager que aprueba.
- `pie_legal` (string, opcional) — -

### REQ-026 — El empleado puede descargar el comprobante PDF de una solicitud aprobada.
**Reglas de negocio:**
- Al hacer clic en la opción de descarga, el sistema debe iniciar la descarga de un fichero en formato PDF.
- El nombre del fichero debe seguir un formato estandarizado, p. ej. `Comprobante_Vacaciones_[nombre_empleado]_[fecha_inicio].pdf`.
**Flujo de usuario:**
1. El `EMPLEADO` hace clic en el botón "Descargar comprobante PDF".
2. El sistema invoca el servicio de generación de documentos (ver dependencia `COMMS-DOC-01`).
3. El navegador del usuario inicia la descarga del archivo PDF generado.
**Escenarios de error:**
- Si el servicio de generación de PDF falla, mostrar un mensaje al usuario: "Error al generar el comprobante. Por favor, inténtelo de nuevo más tarde." (HTTP 503).
**Criterios de aceptación:**
- **Given** un `EMPLEADO` está en el detalle de una solicitud 'Aprobada', **When** hace clic en "Descargar comprobante PDF", **Then** el navegador inicia la descarga de un fichero con extensión `.pdf`.
**Seguridad:**
- **Actor:** `EMPLEADO`.
- **Dependencias:** La implementación de este requisito depende de la capacidad de generación de PDF definida en `COMMS-DOC-01`.
**Reglas de negocio:**
1. El nombre del fichero del comprobante descargado sigue el formato 'Comprobante_Vacaciones_[nombre_empleado]_[fecha_inicio].pdf'.
**Criterios de aceptación:**
1. AC-SOL-01: **Dado** un `EMPLEADO` con una solicitud 'Aprobada', **cuando** navega al detalle de la misma, **entonces** visualiza un botón para descargar el comprobante y, al pulsarlo, se descarga un fichero PDF con el nombre del empleado y las fechas de la solicitud.
**Escenarios de error:**
1. La solicitud de vacaciones para la que se solicita el comprobante no existe.
2. El usuario no tiene permiso para descargar el comprobante de esta solicitud.
3. El comprobante solo puede descargarse para solicitudes en estado 'Aprobada'.
4. El servicio de generación de documentos no está disponible en este momento.
**Campos de datos:**
- `employee_full_name` (string, obligatorio) — Nombre completo del empleado, usado para generar el nombre del fichero PDF.
- `request_start_date` (date, obligatorio) — Fecha de inicio de las vacaciones, usada para generar el nombre del fichero PDF.

### REQ-027 — El comprobante PDF debe contener la información esencial de la solicitud aprobada.
**Reglas de negocio:**
- El contenido del PDF es normativo y debe incluir obligatoriamente los datos especificados.
**Datos:**
El documento PDF debe mostrar de forma clara y legible:
- `employee_full_name` (string, obligatorio): Nombre completo del empleado.
- `request_start_date` (date, obligatorio): Fecha de inicio de las vacaciones.
- `request_end_date` (date, obligatorio): Fecha de fin de las vacaciones.
- `approval_date` (date, obligatorio): Fecha en la que el manager aprobó la solicitud. [inferido]
- `company_name` (string, obligatorio): Nombre de la empresa. [gap: El nombre de la empresa no se proporciona en el RFP].
**Criterios de aceptación:**
- **Given** se descarga un comprobante PDF, **When** se abre el fichero, **Then** el contenido muestra correctamente el nombre del empleado y las fechas de inicio y fin de las vacaciones aprobadas.
**Seguridad:**
- El PDF no debe contener información personal sensible más allá de la estrictamente necesaria para su propósito.
**Reglas de negocio:**
1. El comprobante de vacaciones en PDF contiene obligatoriamente el nombre completo del empleado, las fechas de inicio y fin de la solicitud, la fecha de aprobación y el nombre de la empresa.
**Criterios de aceptación:**
1. AC-SOL-01: **Dado** un `EMPLEADO` con una solicitud 'Aprobada', **cuando** navega al detalle de la misma, **entonces** visualiza un botón para descargar el comprobante y, al pulsarlo, se descarga un fichero PDF con el nombre del empleado y las fechas de la solicitud.
**Campos de datos:**
- `employee_full_name` (string, obligatorio) — Nombre completo del empleado a incluir en el contenido del comprobante.
- `request_start_date` (date, obligatorio) — Fecha de inicio de las vacaciones a incluir en el contenido del comprobante.
- `request_end_date` (date, obligatorio) — Fecha de fin de las vacaciones a incluir en el contenido del comprobante.
- `approval_date` (date, obligatorio) — Fecha de aprobación de la solicitud a incluir en el contenido del comprobante.
- `company_name` (string, obligatorio) — Nombre de la empresa a incluir en el contenido del comprobante.

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

## Entorno de prueba de esta sesión

Antes de arrancar tu sesión, la plataforma levanta los servicios de abajo como contenedores efímeros y deja sus datos de conexión en `.mind/TSK-008/env.sh` (y en `env.json`). Contrato de uso:

- **Haz `source .mind/TSK-008/env.sh` antes de cada build/test** que necesite el entorno; si el fichero no existe, el entorno NO se pudo levantar (ver el final de esta sección).
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
Comprueba `.mind/TSK-008/env.json`: si su `status` es `unavailable` o `degraded`, la plataforma no pudo darte (todo) el entorno. En ese caso ESCRIBE igualmente los tests de integración y déjalos en el entregable, y repórtalo como health check **Warning** con `check: entorno-de-prueba` — NO como Blocker: no es un defecto de tu tarea, y la verificación queda diferida al CI. Reserva el Blocker para cuando el entorno SÍ estaba y los tests fallan por el código o por el brief.

## Fallo del intento anterior (OBLIGATORIO corregir)

La sesión previa **no entregó**. Corrige la causa antes de ampliar alcance:

> delivery-gate: la verificaciÃ³n bloqueÃ³ la entrega.
toolchain no disponible en el runtime: npm

Acciones:
- Reproduce el fallo lo primero. No amplíes alcance de negocio hasta corregirlo. No entregues basura para «pasar» el finalize.