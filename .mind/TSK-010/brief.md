# TSK-010 · Portal SPA — pantallas del Portal de Gestión de Vacaciones

- Componente dueño: `ARC-013`
- Arquetipo del repo: `frontend-application-spa` — respeta sus convenciones; NUNCA te salgas de él (ver «Contrato de salida del arquetipo»).
- Zonas de código de ESTA tarea (trabajo principal): `frontend/src/app/`. Fuera de ellas NO amplíes alcance de negocio — **EXCEPTO** el composition root y el manifiesto del host necesarios para montar lo entregado (sección Composition root).

## Definition of Done
Implementar las pantallas Angular del portal (ARC-029..ARC-052) contra la API.

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

Tus zonas (`frontend/src/app/`) pueden ya contener código de una TSK predecesora mergeada (o del esqueleto). Antes de crear tipos nuevos:

1. **Lista y lee** los ficheros bajo la zona (`ls` / abre `service.py`, `router.py`, …).
2. **EDIT/EXTIENDE** clases, funciones y exports existentes. **PROHIBIDO** una segunda `class`/`def`/export con el **mismo nombre** en el mismo fichero (en Python gana la última y el resto es basura).
3. Si esta tarea es «API pública» / «consulta» sobre el mismo dominio que un CRUD previo, **reutiliza** servicios y modelos; añade solo el router/handlers públicos (montados en el composition root).
4. Un módulo = un dueño semántico de cada símbolo top-level. Si hace falta otro tipo, **nómbralo distinto** o factoriza — no pegues un duplicado al EOF.

El runtime puede anexar la lista real de ficheros presentes en la zona al arrancar la sesión.

## Contrato API congelado (api-contract) — LEY

Estos son los endpoints que publica el backend de este producto (`openapi.yaml`, PR #0 / C.2). Son los ÚNICOS que puedes llamar: no inventes paths, verbos ni parámetros, y si la pantalla necesita algo que no está en la tabla, SEÑÁLALO en el PR en vez de fabricarlo.

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

### Plantillas canónicas del arquetipo
#### `page-component-frontend`
```

```
#### `api-service-frontend`
```

```

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

> 24 pantalla(s) de esta tarea. TRANSCRIBE el detalle: no inventes pantallas, rutas, etiquetas ni navegación. Cuando una pantalla trae «Detalle de UI (B.7)», ESA es la fuente autoritativa — sus `label` son el texto a pintar y su `widget` el control a usar, ya decididos y aprobados. Los bloques de la fase FLOWS son contexto: sus textos son términos de dominio (glosario), NO etiquetas de UI. Respeta el design system del arquetipo.

### ARC-029 · Formulario de Nueva Solicitud
El empleado introduce las fechas y el motivo para crear una nueva solicitud de vacaciones.
- **API** (enviar la nueva solicitud de vacaciones): `POST /vacation-requests` — Crea una nueva solicitud de vacaciones para el empleado autenticado.
- **Campos del contrato de esta pantalla** (tipa el JSON con ESTOS nombres, vía `libs/api-types`): `VacationRequestCreate.start_date` (date), `VacationRequestCreate.end_date` (date), `VacationRequestCreate.reason` (string), `VacationRequestDetail.request_id` (uuid), `VacationRequestDetail.employee_name` (string), `VacationRequestDetail.start_date` (date), `VacationRequestDetail.end_date` (date), `VacationRequestDetail.reason` (string), `VacationRequestDetail.status` (enum), `VacationRequestDetail.created_at` (datetime), `VacationRequestDetail.resolution_date` (datetime), `VacationRequestDetail.manager_notes` (string)
- **Detalle de UI (B.7) · `UIS-001`** — FUENTE AUTORITATIVA: los `label` son el texto a pintar y el `widget` el control a usar.
  - Propósito: El empleado introduce las fechas y el motivo de sus vacaciones para crear una nueva solicitud y enviarla a su manager para aprobación.
  - Disposición: **formulario** (`form`) — respétala; no rediseñes la pantalla.
  - Navegación: sección de menú «Mis Solicitudes» (orden 0).
  - **Sección «Fechas de la solicitud»** (2 columnas):
    - «Fecha de inicio» (widget `date`, tipo `date`, obligatorio, campo `fecha_inicio` ⚠ SIN campo en el contrato de sus endpoints (campo-sin-contrato): NO lo inventes en el JSON — repórtalo como `Warning` `api-contract`) — Debe ser anterior a la Fecha de fin.
    - «Fecha de fin» (widget `date`, tipo `date`, obligatorio, campo `fecha_fin` ⚠ SIN campo en el contrato de sus endpoints (campo-sin-contrato): NO lo inventes en el JSON — repórtalo como `Warning` `api-contract`) — Debe ser posterior a la Fecha de inicio.
  - **Sección «Motivo»** (1 columna):
    - «Motivo» (widget `textarea`, tipo `string`, opcional, campo `motivo` ⚠ SIN campo en el contrato de sus endpoints (campo-sin-contrato): NO lo inventes en el JSON — repórtalo como `Warning` `api-contract`)
  - **Acciones:**
    - «Cancelar» (widget `cancel`, opcional)
    - «Enviar solicitud» (widget `submit`, opcional, navega) — Si el formulario es válido
- Flujo `FLOW-001` · pantalla `SCR-001`
  - **Rutas:** `/solicitudes/nueva`
  - **Componentes de UI:** Formulario de nueva solicitud de vacaciones; Campo de selección de fecha de inicio; Campo de selección de fecha de fin; Campo de texto para motivo de la solicitud; Botón para enviar solicitud
  - **Datos que muestra:** Fecha de inicio de la solicitud; Fecha de fin de la solicitud; Motivo de la solicitud
  - **Acciones del usuario:** Enviar solicitud de vacaciones; Cancelar y volver
  - **Navegación:**
    - Enviar solicitud → «Confirmación de Envío de Solicitud» si Si el formulario es válido [submit]

### ARC-030 · Confirmación de Envío de Solicitud
Muestra al empleado la confirmación de que su solicitud ha sido enviada correctamente.
- **API**: esta pantalla no trae cableado pantalla→endpoint de T.5. NO lo interpretes como «no llama a la API»: elige los endpoints que necesita de la tabla del contrato congelado (sección api-contract), con su path y su verbo literales, y **repórtalo como health check `Warning` con `check: api-contract`** indicando cuáles has usado.
- **Detalle de UI (B.7) · `UIS-002`** — FUENTE AUTORITATIVA: los `label` son el texto a pintar y el `widget` el control a usar.
  - Propósito: Confirma al empleado que su solicitud de vacaciones se ha enviado correctamente y está pendiente de aprobación, y le permite volver a su historial de solicitudes.
  - Disposición: **confirmación** (`confirmation`) — respétala; no rediseñes la pantalla.
  - Navegación: sección de menú «Mis Solicitudes» (orden 1).
  - **Datos que muestra:**
    - «¡Solicitud enviada!» (widget `banner`, opcional) — Tu solicitud de vacaciones ha sido enviada correctamente. Recibirás una notificación cuando sea revisada.
    - «Código de solicitud» (widget `key_value`, tipo `string`, opcional, campo `codigo_solicitud`)
    - «Estado» (widget `badge`, tipo `string`, opcional, campo `estado_solicitud`) — El estado inicial es 'Pendiente'.
  - **Acciones:**
    - «Volver al historial» (widget `secondary_button`, opcional)
    - «Solicitar otras vacaciones» (widget `primary_button`, opcional, navega)
- Flujo `FLOW-001` · pantalla `SCR-002`
  - **Rutas:** `/solicitudes/nueva/confirmacion`
  - **Componentes de UI:** Mensaje de confirmación de envío; Botón para volver al historial
  - **Datos que muestra:** Mensaje de confirmación de envío; Código de la solicitud; Estado de la solicitud
  - **Acciones del usuario:** Volver al historial de solicitudes
  - **Navegación:**
    - Solicitar otras vacaciones → «Formulario de Nueva Solicitud» [navigate]

### ARC-031 · Historial de Solicitudes
El empleado consulta la lista de todas sus solicitudes de vacaciones y su estado.
- **API** (consultar el historial de solicitudes propias): `GET /vacation-requests/my-requests` — Obtiene el listado de las solicitudes de vacaciones del empleado autenticado.
- **Campos del contrato de esta pantalla** (tipa el JSON con ESTOS nombres, vía `libs/api-types`): `VacationRequestList.items` (array), `VacationRequestList.total` (integer), `VacationRequestList.page` (integer), `VacationRequestList.size` (integer)
- **Detalle de UI (B.7) · `UIS-006`** — FUENTE AUTORITATIVA: los `label` son el texto a pintar y el `widget` el control a usar.
  - Propósito: Permite al empleado consultar el historial de todas sus solicitudes de vacaciones, filtrarlas por estado y acceder a los detalles de cada una.
  - Disposición: **listado** (`list`) — respétala; no rediseñes la pantalla.
  - Navegación: es PUERTA DE ENTRADA de la aplicación; sección de menú «Mis Solicitudes» (orden 0).
  - **Sección «Filtros»** (2 columnas):
    - «Estado» (widget `select`, tipo `string`, opcional, campo `estado_solicitud_filtro` ⚠ SIN campo en el contrato de sus endpoints (campo-sin-contrato): NO lo inventes en el JSON — repórtalo como `Warning` `api-contract`) — Valores posibles: Pendiente, Aprobada, Rechazada.
    - «Aplicar filtros» (widget `submit`, opcional)
  - **Sección «Historial de Solicitudes»** (1 columna):
    - «Solicitudes de vacaciones» (widget `table`, opcional, cada fila navega)
      - Columnas: «Código» (`label` ⚠ `codigo_solicitud` sin campo en el contrato), «Fecha de inicio» (`date_text` ⚠ `fecha_inicio` sin campo en el contrato), «Fecha de fin» (`date_text` ⚠ `fecha_fin` sin campo en el contrato), «Estado» (`badge` ⚠ `estado_solicitud` sin campo en el contrato)
    - «Ver detalle» (widget `link`, opcional, navega)
  - **Acciones:**
    - «Nueva solicitud» (widget `primary_button`, opcional)
- Flujo `FLOW-002` · pantalla `SCR-001`
  - **Rutas:** `/solicitudes`
  - **Componentes de UI:** Título de la pantalla: Historial de Solicitudes; Filtro por estado de solicitud; Tabla de historial de solicitudes; Botón para crear nueva solicitud
  - **Datos que muestra:** Lista de solicitudes de vacaciones; Filtro por estado de solicitud
  - **Acciones del usuario:** Filtrar solicitudes por estado; Ver detalle de solicitud; Iniciar nueva solicitud
  - **Navegación:**
    - Ver detalle de solicitud → «Detalle de Solicitud» si Al seleccionar una solicitud de la lista [navigate]

### ARC-032 · Detalle de Solicitud
El empleado consulta la información completa de una de sus solicitudes de vacaciones.
- **API** (cargar el detalle de la solicitud): `GET /vacation-requests/{requestId}` — Obtiene el detalle de una solicitud de vacaciones del propio empleado.
- **API** (descargar el comprobante PDF): `GET /vacation-requests/{requestId}/proof-document` — Descarga el comprobante en PDF de una solicitud de vacaciones aprobada.
- **Campos del contrato de esta pantalla** (tipa el JSON con ESTOS nombres, vía `libs/api-types`): `VacationRequestDetail.request_id` (uuid), `VacationRequestDetail.employee_name` (string), `VacationRequestDetail.start_date` (date), `VacationRequestDetail.end_date` (date), `VacationRequestDetail.reason` (string), `VacationRequestDetail.status` (enum), `VacationRequestDetail.created_at` (datetime), `VacationRequestDetail.resolution_date` (datetime), `VacationRequestDetail.manager_notes` (string)
- **Detalle de UI (B.7) · `UIS-007`** — FUENTE AUTORITATIVA: los `label` son el texto a pintar y el `widget` el control a usar.
  - Propósito: El empleado consulta toda la información de una solicitud de vacaciones concreta, incluyendo las fechas, el motivo y su estado actual.
  - Disposición: **detalle** (`detail`) — respétala; no rediseñes la pantalla.
  - Navegación: sección de menú «Mis Solicitudes» (orden 1).
  - **Sección «Datos de la solicitud»** (2 columnas):
    - «Código de solicitud» (widget `label`, tipo `string`, opcional, campo `codigo_solicitud` ⚠ SIN campo en el contrato de sus endpoints (campo-sin-contrato): NO lo inventes en el JSON — repórtalo como `Warning` `api-contract`)
    - «Solicitante» (widget `label`, tipo `string`, opcional, campo `empleado_solicitante` ⚠ SIN campo en el contrato de sus endpoints (campo-sin-contrato): NO lo inventes en el JSON — repórtalo como `Warning` `api-contract`)
    - «Fecha de solicitud» (widget `date_text`, tipo `date`, opcional, campo `fecha_creacion` ⚠ SIN campo en el contrato de sus endpoints (campo-sin-contrato): NO lo inventes en el JSON — repórtalo como `Warning` `api-contract`)
    - «Estado» (widget `badge`, tipo `string`, opcional, campo `estado_solicitud` ⚠ SIN campo en el contrato de sus endpoints (campo-sin-contrato): NO lo inventes en el JSON — repórtalo como `Warning` `api-contract`)
    - «Fecha de inicio» (widget `date_text`, tipo `date`, opcional, campo `fecha_inicio` ⚠ SIN campo en el contrato de sus endpoints (campo-sin-contrato): NO lo inventes en el JSON — repórtalo como `Warning` `api-contract`)
    - «Fecha de fin» (widget `date_text`, tipo `date`, opcional, campo `fecha_fin` ⚠ SIN campo en el contrato de sus endpoints (campo-sin-contrato): NO lo inventes en el JSON — repórtalo como `Warning` `api-contract`)
    - «Motivo» (widget `text_block`, tipo `string`, opcional, campo `motivo_solicitud` ⚠ SIN campo en el contrato de sus endpoints (campo-sin-contrato): NO lo inventes en el JSON — repórtalo como `Warning` `api-contract`)
  - **Acciones:**
    - «Volver» (widget `secondary_button`, opcional, navega)
- Flujo `FLOW-002` · pantalla `SCR-002`
  - **Rutas:** `/solicitudes/{id}`
  - **Componentes de UI:** Vista de datos de la solicitud; Botón para volver al historial
  - **Datos que muestra:** Código de la solicitud; Empleado solicitante; Fecha de inicio de la solicitud; Fecha de fin de la solicitud; Motivo de la solicitud; Estado de la solicitud; Fecha de creación de la solicitud
  - **Acciones del usuario:** Volver al historial de solicitudes
  - **Navegación:**
    - Volver al historial → «Historial de Solicitudes» [back]

### ARC-033 · Diálogo de Confirmación de Cancelación
El empleado confirma que desea cancelar una solicitud de vacaciones pendiente.
- **API** (confirmar la cancelación de la solicitud): `POST /vacation-requests/{requestId}/cancel` — Cancela una solicitud de vacaciones propia que esté en estado 'Pendiente'.
- **Campos del contrato de esta pantalla** (tipa el JSON con ESTOS nombres, vía `libs/api-types`): `VacationRequestDetail.request_id` (uuid), `VacationRequestDetail.employee_name` (string), `VacationRequestDetail.start_date` (date), `VacationRequestDetail.end_date` (date), `VacationRequestDetail.reason` (string), `VacationRequestDetail.status` (enum), `VacationRequestDetail.created_at` (datetime), `VacationRequestDetail.resolution_date` (datetime), `VacationRequestDetail.manager_notes` (string)
- **Detalle de UI (B.7) · `UIS-004`** — FUENTE AUTORITATIVA: los `label` son el texto a pintar y el `widget` el control a usar.
  - Propósito: El empleado confirma que desea cancelar de forma definitiva su solicitud de vacaciones.
  - Disposición: **genérico** (`generic`) — respétala; no rediseñes la pantalla.
  - **Datos que muestra:**
    - «¿Estás seguro de que quieres cancelar esta solicitud? Esta acción no se puede deshacer.» (widget `text_block`, opcional)
  - **Acciones:**
    - «No cancelar» (widget `cancel`, opcional, navega)
    - «Confirmar cancelación» (widget `submit`, opcional, navega) — La solicitud debe estar en estado 'Pendiente'.
- Flujo `FLOW-003` · pantalla `SCR-002`
  - **Rutas:** `/solicitudes/{id}/cancelar`
  - **Componentes de UI:** Diálogo de confirmación de cancelación; Botón para confirmar cancelación; Botón para cerrar diálogo
  - **Datos que muestra:** Mensaje de confirmación de cancelación
  - **Acciones del usuario:** Confirmar cancelación de la solicitud; No cancelar y volver al detalle
  - **Navegación:**
    - Confirmar cancelación → «Confirmación de Cancelación» [submit]
    - No cancelar (cerrar diálogo) → «Detalle de Solicitud Pendiente» [close_modal]

### ARC-034 · Confirmación de Cancelación
Informa al empleado que su solicitud ha sido cancelada con éxito.
- **API**: esta pantalla no trae cableado pantalla→endpoint de T.5. NO lo interpretes como «no llama a la API»: elige los endpoints que necesita de la tabla del contrato congelado (sección api-contract), con su path y su verbo literales, y **repórtalo como health check `Warning` con `check: api-contract`** indicando cuáles has usado.
- **Detalle de UI (B.7) · `UIS-005`** — FUENTE AUTORITATIVA: los `label` son el texto a pintar y el `widget` el control a usar.
  - Propósito: Informa al empleado del éxito de la cancelación y muestra el estado final de la solicitud.
  - Disposición: **confirmación** (`confirmation`) — respétala; no rediseñes la pantalla.
  - **Sección «Resultado de la operación»** (1 columna):
    - «¡Solicitud cancelada con éxito!» (widget `banner`, opcional)
    - «Código de solicitud» (widget `label`, tipo `string`, opcional, campo `codigo_solicitud`)
    - «Estado» (widget `badge`, tipo `string`, opcional, campo `estado_solicitud`)
  - **Acciones:**
    - «Volver al historial» (widget `primary_button`, opcional)
- Flujo `FLOW-003` · pantalla `SCR-003`
  - **Rutas:** `/solicitudes/{id}`
  - **Componentes de UI:** Notificación de cancelación exitosa; Vista de datos de la solicitud cancelada
  - **Datos que muestra:** Código de la solicitud; Estado de la solicitud; Mensaje de confirmación de cancelación
  - **Acciones del usuario:** Volver al historial de solicitudes

### ARC-035 · Panel de Solicitudes Pendientes del Equipo
El manager visualiza la lista de solicitudes de vacaciones pendientes de su equipo.
- **API** (consultar las solicitudes pendientes del equipo): `GET /team/vacation-requests` — Obtiene las solicitudes de vacaciones del equipo del manager autenticado.
- **Campos del contrato de esta pantalla** (tipa el JSON con ESTOS nombres, vía `libs/api-types`): `VacationRequestList.items` (array), `VacationRequestList.total` (integer), `VacationRequestList.page` (integer), `VacationRequestList.size` (integer)
- **Detalle de UI (B.7) · `UIS-008`** — FUENTE AUTORITATIVA: los `label` son el texto a pintar y el `widget` el control a usar.
  - Propósito: El manager consulta la lista de solicitudes de vacaciones pendientes de su equipo para seleccionar una y decidir si la aprueba o la rechaza.
  - Disposición: **listado** (`list`) — respétala; no rediseñes la pantalla.
  - Navegación: es PUERTA DE ENTRADA de la aplicación; sección de menú «Gestión de Equipo» (orden 0).
  - **Sección «Solicitudes pendientes de revisión»** (1 columna):
    - «Gestionar» (widget `link`, opcional, navega) — Al seleccionar una solicitud del panel
    - «Solicitudes Pendientes» (widget `table`, opcional, cada fila navega)
      - Columnas: «Empleado» (`label` ⚠ `empleado_solicitante` sin campo en el contrato), «Fecha de Inicio» (`date_text` ⚠ `fecha_inicio` sin campo en el contrato), «Fecha de Fin» (`date_text` ⚠ `fecha_fin` sin campo en el contrato), «Estado» (`badge` ⚠ `estado_solicitud` sin campo en el contrato)
- Flujo `FLOW-005` · pantalla `SCR-001`
  - **Rutas:** `/equipo/solicitudes`
  - **Componentes de UI:** Título del panel: Solicitudes Pendientes del Equipo; Lista de solicitudes pendientes de revisión
  - **Datos que muestra:** Lista de solicitudes pendientes del equipo
  - **Acciones del usuario:** Ver detalle de solicitud para gestionar; Filtrar solicitudes pendientes
  - **Navegación:**
    - Revisar solicitud → «Detalle de Solicitud para Gestión» si Al seleccionar una solicitud del panel [navigate]

### ARC-036 · Detalle de Solicitud para Gestión
El manager revisa el detalle de una solicitud de su equipo para aprobarla o rechazarla.
- **API** (cargar el detalle de la solicitud del equipo): `GET /team/vacation-requests/{requestId}` — Obtiene el detalle de la solicitud de un miembro del equipo del manager.
- **API** (aprobar la solicitud): `POST /team/vacation-requests/{requestId}/approve` — Aprueba una solicitud de vacaciones de un miembro del equipo.
- **Campos del contrato de esta pantalla** (tipa el JSON con ESTOS nombres, vía `libs/api-types`): `VacationRequestDetail.request_id` (uuid), `VacationRequestDetail.employee_name` (string), `VacationRequestDetail.start_date` (date), `VacationRequestDetail.end_date` (date), `VacationRequestDetail.reason` (string), `VacationRequestDetail.status` (enum), `VacationRequestDetail.created_at` (datetime), `VacationRequestDetail.resolution_date` (datetime), `VacationRequestDetail.manager_notes` (string)
- **Detalle de UI (B.7) · `UIS-009`** — FUENTE AUTORITATIVA: los `label` son el texto a pintar y el `widget` el control a usar.
  - Propósito: El manager revisa la información completa de una solicitud de vacaciones para tomar una decisión informada sobre su aprobación o rechazo.
  - Disposición: **detalle** (`detail`) — respétala; no rediseñes la pantalla.
  - Navegación: sección de menú «Gestión de Equipo» (orden 1).
  - **Sección «Datos de la solicitud»** (2 columnas):
    - «Código de solicitud» (widget `label`, tipo `string`, opcional, campo `codigo_solicitud` ⚠ SIN campo en el contrato de sus endpoints (campo-sin-contrato): NO lo inventes en el JSON — repórtalo como `Warning` `api-contract`)
    - «Empleado» (widget `label`, tipo `string`, opcional, campo `empleado_solicitante` ⚠ SIN campo en el contrato de sus endpoints (campo-sin-contrato): NO lo inventes en el JSON — repórtalo como `Warning` `api-contract`)
    - «Fecha de inicio» (widget `date_text`, tipo `date`, opcional, campo `fecha_inicio` ⚠ SIN campo en el contrato de sus endpoints (campo-sin-contrato): NO lo inventes en el JSON — repórtalo como `Warning` `api-contract`)
    - «Fecha de fin» (widget `date_text`, tipo `date`, opcional, campo `fecha_fin` ⚠ SIN campo en el contrato de sus endpoints (campo-sin-contrato): NO lo inventes en el JSON — repórtalo como `Warning` `api-contract`)
    - «Motivo» (widget `text_block`, tipo `string`, opcional, campo `motivo_solicitud` ⚠ SIN campo en el contrato de sus endpoints (campo-sin-contrato): NO lo inventes en el JSON — repórtalo como `Warning` `api-contract`)
    - «Estado» (widget `badge`, tipo `string`, opcional, campo `estado_solicitud` ⚠ SIN campo en el contrato de sus endpoints (campo-sin-contrato): NO lo inventes en el JSON — repórtalo como `Warning` `api-contract`)
  - **Acciones:**
    - «Volver al panel» (widget `link`, opcional, navega)
    - «Rechazar» (widget `secondary_button`, opcional, navega)
    - «Aprobar» (widget `primary_button`, opcional, navega)
- Flujo `FLOW-005` · pantalla `SCR-002`
  - **Rutas:** `/equipo/solicitudes/{id}`
  - **Componentes de UI:** Vista de detalle de la solicitud a gestionar; Botón para aprobar solicitud; Botón para rechazar solicitud
  - **Datos que muestra:** Código de la solicitud; Empleado solicitante; Fecha de inicio de la solicitud; Fecha de fin de la solicitud; Motivo de la solicitud; Estado de la solicitud
  - **Acciones del usuario:** Aprobar solicitud; Rechazar solicitud; Volver al panel de solicitudes
  - **Navegación:**
    - Volver al panel → «Panel de Solicitudes Pendientes del Equipo» [back]
    - Aprobar solicitud → «Confirmación de Gestión de Solicitud» [submit]
    - Rechazar solicitud → «Diálogo de Rechazo de Solicitud» [open_modal]

### ARC-037 · Diálogo de Rechazo de Solicitud
El manager introduce el motivo del rechazo de una solicitud de vacaciones.
- **API** (rechazar la solicitud): `POST /team/vacation-requests/{requestId}/reject` — Rechaza una solicitud de vacaciones de un miembro del equipo.
- **Campos del contrato de esta pantalla** (tipa el JSON con ESTOS nombres, vía `libs/api-types`): `RejectionRequest.rejection_reason` (string), `VacationRequestDetail.request_id` (uuid), `VacationRequestDetail.employee_name` (string), `VacationRequestDetail.start_date` (date), `VacationRequestDetail.end_date` (date), `VacationRequestDetail.reason` (string), `VacationRequestDetail.status` (enum), `VacationRequestDetail.created_at` (datetime), `VacationRequestDetail.resolution_date` (datetime), `VacationRequestDetail.manager_notes` (string)
- **Detalle de UI (B.7) · `UIS-010`** — FUENTE AUTORITATIVA: los `label` son el texto a pintar y el `widget` el control a usar.
  - Propósito: El manager introduce el motivo por el cual se rechaza la solicitud de vacaciones antes de confirmar la acción.
  - Disposición: **formulario** (`form`) — respétala; no rediseñes la pantalla.
  - **Sección «Motivo del rechazo»** (1 columna):
    - «Motivo del rechazo (opcional)» (widget `textarea`, tipo `string`, opcional, campo `motivo_rechazo` ⚠ SIN campo en el contrato de sus endpoints (campo-sin-contrato): NO lo inventes en el JSON — repórtalo como `Warning` `api-contract`)
  - **Acciones:**
    - «Cancelar» (widget `cancel`, opcional, navega)
    - «Confirmar rechazo» (widget `submit`, opcional, navega)
- Flujo `FLOW-005` · pantalla `SCR-003`
  - **Rutas:** `/equipo/solicitudes/{id}/rechazar`
  - **Componentes de UI:** Diálogo de rechazo de solicitud; Campo de texto para motivo del rechazo; Botón para confirmar rechazo; Botón para cancelar rechazo
  - **Datos que muestra:** Motivo de rechazo
  - **Acciones del usuario:** Confirmar rechazo con motivo; Confirmar rechazo sin motivo; Cancelar rechazo
  - **Navegación:**
    - Confirmar rechazo → «Confirmación de Gestión de Solicitud» [submit]
    - No rechazar (cerrar diálogo) → «Detalle de Solicitud para Gestión» [close_modal]

### ARC-038 · Confirmación de Gestión de Solicitud
Informa al manager que la solicitud ha sido aprobada o rechazada correctamente.
- **API**: esta pantalla no trae cableado pantalla→endpoint de T.5. NO lo interpretes como «no llama a la API»: elige los endpoints que necesita de la tabla del contrato congelado (sección api-contract), con su path y su verbo literales, y **repórtalo como health check `Warning` con `check: api-contract`** indicando cuáles has usado.
- **Detalle de UI (B.7) · `UIS-011`** — FUENTE AUTORITATIVA: los `label` son el texto a pintar y el `widget` el control a usar.
  - Propósito: Se confirma al manager que la solicitud de vacaciones ha sido aprobada o rechazada correctamente, y se le permite volver al panel principal.
  - Disposición: **confirmación** (`confirmation`) — respétala; no rediseñes la pantalla.
  - **Datos que muestra:**
    - «La solicitud se ha gestionado correctamente.» (widget `banner`, tipo `string`, opcional, campo `mensaje_confirmacion`)
    - «Código de solicitud» (widget `label`, tipo `string`, opcional, campo `codigo_solicitud`)
    - «Nuevo estado» (widget `badge`, tipo `string`, opcional, campo `estado_solicitud`)
  - **Acciones:**
    - «Volver al panel» (widget `primary_button`, opcional, navega)
- Flujo `FLOW-005` · pantalla `SCR-004`
  - **Rutas:** `/equipo/solicitudes/gestion-confirmada`
  - **Componentes de UI:** Notificación de gestión de solicitud; Botón para volver al panel de solicitudes
  - **Datos que muestra:** Mensaje de confirmación de gestión; Código de la solicitud; Nuevo estado de la solicitud
  - **Acciones del usuario:** Volver al panel de solicitudes pendientes
  - **Navegación:**
    - Volver al panel de solicitudes → «Panel de Solicitudes Pendientes del Equipo» [navigate]

### ARC-039 · Configuración de Exportación de Informe
El manager selecciona el periodo para exportar el informe de solicitudes de su equipo.
- **API** (iniciar la exportación del informe mensual): `POST /reports/monthly-requests/export-jobs` — Inicia la generación asíncrona de un reporte CSV de solicitudes del equipo.
- **Campos del contrato de esta pantalla** (tipa el JSON con ESTOS nombres, vía `libs/api-types`): `MonthlyReportRequest.report_month` (integer), `MonthlyReportRequest.report_year` (integer), `ExportJobStatus.job_id` (uuid), `ExportJobStatus.status` (enum), `ExportJobStatus.download_url` (string)
- **Detalle de UI (B.7) · `UIS-013`** — FUENTE AUTORITATIVA: los `label` son el texto a pintar y el `widget` el control a usar.
  - Propósito: El manager selecciona los parámetros, como el mes y el año, para generar un informe en formato CSV con las solicitudes de vacaciones de su equipo.
  - Disposición: **formulario** (`form`) — respétala; no rediseñes la pantalla.
  - Navegación: sección de menú «Gestión de Equipo» (orden 2).
  - **Sección «Parámetros del Informe»** (1 columna):
    - «Mes» (widget `select`, tipo `integer`, obligatorio, campo `mes_informe` ⚠ SIN campo en el contrato de sus endpoints (campo-sin-contrato): NO lo inventes en el JSON — repórtalo como `Warning` `api-contract`) — El mes del informe es obligatorio.
    - «Año» (widget `select`, tipo `integer`, obligatorio, campo `ano_informe` ⚠ SIN campo en el contrato de sus endpoints (campo-sin-contrato): NO lo inventes en el JSON — repórtalo como `Warning` `api-contract`) — El año del informe es obligatorio.
  - **Acciones:**
    - «Ver historial» (widget `link`, opcional, navega)
    - «Generar Informe» (widget `submit`, opcional, navega) — Si los parámetros de exportación son válidos
- Flujo `FLOW-006` · pantalla `SCR-001`
  - **Rutas:** `/informes/exportar`
  - **Componentes de UI:** Formulario de configuración de exportación; Selector de mes para el informe; Selector de año para el informe; Botón para generar informe
  - **Datos que muestra:** Mes del informe; Año del informe
  - **Acciones del usuario:** Generar informe de vacaciones; Ver historial de exportaciones
  - **Navegación:**
    - Generar informe → «Historial de Exportaciones» si Si los parámetros de exportación son válidos [submit]

### ARC-040 · Historial de Exportaciones
El manager consulta el estado de las exportaciones y descarga los informes completados.
- **API** (consultar el estado de un trabajo de exportación): `GET /reports/export-jobs/{jobId}` — Consulta el estado de un trabajo de exportación y obtiene el enlace de descarga.
- **Campos del contrato de esta pantalla** (tipa el JSON con ESTOS nombres, vía `libs/api-types`): `ExportJobStatus.job_id` (uuid), `ExportJobStatus.status` (enum), `ExportJobStatus.download_url` (string)
- **Detalle de UI (B.7) · `UIS-014`** — FUENTE AUTORITATIVA: los `label` son el texto a pintar y el `widget` el control a usar.
  - Propósito: El manager consulta el estado de los informes que ha solicitado y descarga aquellos que ya han sido generados y están disponibles.
  - Disposición: **listado** (`list`) — respétala; no rediseñes la pantalla.
  - Navegación: sección de menú «Gestión de Equipo» (orden 3).
  - **Sección «Informes Generados»** (1 columna):
    - «Historial de Exportaciones» (widget `table`, opcional)
      - Columnas: «Informe» (`label` ⚠ `informe_parametros` sin campo en el contrato), «Fecha de Solicitud» (`date_text` ⚠ `fecha_solicitud_exportacion` sin campo en el contrato), «Estado» (`badge` ⚠ `estado_exportacion` sin campo en el contrato), «Archivo» (`document_link` ⚠ `informe_exportado_csv` sin campo en el contrato)
    - «Descargar» (widget `link`, opcional) — Disponible para informes con estado 'Completado'
    - «No hay informes generados» (widget `empty_state`, opcional) — Aún no has solicitado ninguna exportación. Puedes generar tu primer informe desde la pantalla de configuración.
    - «Actualizar» (widget `secondary_button`, opcional)
  - **Acciones:**
    - «Configurar nueva exportación» (widget `primary_button`, opcional, navega)
- Flujo `FLOW-006` · pantalla `SCR-002`
  - **Rutas:** `/informes`
  - **Componentes de UI:** Tabla de historial de exportaciones; Indicador de estado por cada exportación; Enlace para descargar informes completados
  - **Datos que muestra:** Lista de trabajos de exportación; Informe exportado
  - **Acciones del usuario:** Descargar informe completado; Actualizar estado de exportaciones; Volver a la configuración de informes
  - **Navegación:**
    - Configurar nueva exportación → «Configuración de Exportación de Informe» [navigate]

### ARC-041 · Perfil de Usuario
El usuario consulta su información personal, rol y manager asignado.
- **API** (consultar el perfil del usuario): `GET /profile/me` — Obtiene la información del perfil del usuario autenticado.
- **Campos del contrato de esta pantalla** (tipa el JSON con ESTOS nombres, vía `libs/api-types`): `UserProfile.user_id` (uuid), `UserProfile.full_name` (string), `UserProfile.email` (string), `UserProfile.user_role` (enum), `UserProfile.manager_name` (string)
- **Detalle de UI (B.7) · `UIS-015`** — FUENTE AUTORITATIVA: los `label` son el texto a pintar y el `widget` el control a usar.
  - Propósito: El usuario consulta su información personal, rol y manager asignado, y puede acceder a las acciones para gestionar su cuenta.
  - Disposición: **detalle** (`detail`) — respétala; no rediseñes la pantalla.
  - Navegación: sección de menú «Mi Cuenta» (orden 0).
  - **Sección «Datos Personales»** (2 columnas):
    - «Nombre de usuario» (widget `label`, tipo `string`, opcional, campo `nombre_usuario` ⚠ SIN campo en el contrato de sus endpoints (campo-sin-contrato): NO lo inventes en el JSON — repórtalo como `Warning` `api-contract`)
    - «Email» (widget `label`, tipo `string`, opcional, campo `email_usuario` ⚠ SIN campo en el contrato de sus endpoints (campo-sin-contrato): NO lo inventes en el JSON — repórtalo como `Warning` `api-contract`)
  - **Sección «Rol y Jerarquía»** (2 columnas):
    - «Rol» (widget `badge`, tipo `string`, opcional, campo `rol_usuario` ⚠ SIN campo en el contrato de sus endpoints (campo-sin-contrato): NO lo inventes en el JSON — repórtalo como `Warning` `api-contract`)
    - «Manager asignado» (widget `label`, tipo `string`, opcional, campo `manager_asignado` ⚠ SIN campo en el contrato de sus endpoints (campo-sin-contrato): NO lo inventes en el JSON — repórtalo como `Warning` `api-contract`)
  - **Acciones:**
    - «Cambiar contraseña» (widget `link`, opcional)
    - «Cerrar sesión» (widget `secondary_button`, opcional)
    - «Editar perfil» (widget `primary_button`, opcional)
- Flujo `FLOW-007` · pantalla `SCR-001`
  - **Rutas:** `/profile`
  - **Componentes de UI:** Tarjeta de Perfil de Usuario; Sección de Datos Personales; Sección de Rol y Jerarquía
  - **Datos que muestra:** Nombre de usuario; Email de usuario; Rol de usuario; Manager asignado
  - **Acciones del usuario:** Editar perfil; Cambiar contraseña; Cerrar sesión

### ARC-042 · Listado del Equipo
El manager consulta la lista de empleados que le reportan directamente.
- **API** (consultar los miembros del equipo): `GET /profile/my-team` — Obtiene la lista de empleados que reportan al manager autenticado.
- **Campos del contrato de esta pantalla** (tipa el JSON con ESTOS nombres, vía `libs/api-types`): `TeamMemberList.items` (array)
- **Detalle de UI (B.7) · `UIS-016`** — FUENTE AUTORITATIVA: los `label` son el texto a pintar y el `widget` el control a usar.
  - Propósito: Permite al manager consultar la lista de empleados que forman parte de su equipo directo, con sus datos de contacto principales.
  - Disposición: **listado** (`list`) — respétala; no rediseñes la pantalla.
  - Navegación: sección de menú «Gestión de Equipo» (orden 2).
  - **Sección «Miembros del Equipo»** (1 columna):
    - «Empleados del equipo» (widget `table`, opcional)
      - Columnas: «Nombre» (`label` ⚠ `nombre_empleado` sin campo en el contrato), «Email» (`label` ⚠ `email_empleado` sin campo en el contrato)
    - «Ver detalles» (widget `link`, opcional)
  - **Acciones:**
    - «Volver» (widget `secondary_button`, opcional)
- Flujo `FLOW-008` · pantalla `SCR-001`
  - **Rutas:** `/my-team`
  - **Componentes de UI:** Título de la pantalla: Mi Equipo; Tabla de Empleados del Equipo
  - **Datos que muestra:** Lista de empleados del equipo
  - **Acciones del usuario:** Ver detalles de empleado; Volver al panel principal

### ARC-043 · Formulario de Creación de Usuario
El administrador introduce los datos para crear una nueva cuenta de usuario.
- **API** (crear una nueva cuenta de usuario): `POST /admin/users` — Crea una nueva cuenta de usuario en el sistema.
- **Campos del contrato de esta pantalla** (tipa el JSON con ESTOS nombres, vía `libs/api-types`): `UserCreateRequest.full_name` (string), `UserCreateRequest.email` (string), `UserCreateRequest.user_role` (enum), `UserCreateRequest.initial_password` (string), `UserDetail.user_id` (uuid), `UserDetail.full_name` (string), `UserDetail.email` (string), `UserDetail.user_role` (enum), `UserDetail.status` (enum), `UserDetail.manager_name` (string)
- **Detalle de UI (B.7) · `UIS-017`** — FUENTE AUTORITATIVA: los `label` son el texto a pintar y el `widget` el control a usar.
  - Propósito: El administrador proporciona los datos básicos y el rol de un nuevo usuario para darle de alta en el sistema.
  - Disposición: **formulario** (`form`) — respétala; no rediseñes la pantalla.
  - Navegación: sección de menú «Gestión de Usuarios» (orden 0).
  - **Sección «Datos del usuario»** (2 columnas):
    - «Nombre completo» (widget `text`, tipo `string`, obligatorio, campo `nombre_usuario` ⚠ SIN campo en el contrato de sus endpoints (campo-sin-contrato): NO lo inventes en el JSON — repórtalo como `Warning` `api-contract`)
    - «Email» (widget `text`, tipo `string`, obligatorio, campo `email_usuario` ⚠ SIN campo en el contrato de sus endpoints (campo-sin-contrato): NO lo inventes en el JSON — repórtalo como `Warning` `api-contract`) — Debe ser un formato de email válido y no puede existir previamente en el sistema.
    - «Rol» (widget `select`, tipo `enum`, obligatorio, campo `rol_usuario` ⚠ SIN campo en el contrato de sus endpoints (campo-sin-contrato): NO lo inventes en el JSON — repórtalo como `Warning` `api-contract`)
  - **Acciones:**
    - «Cancelar» (widget `cancel`, opcional)
    - «Crear Usuario» (widget `submit`, opcional) — El formulario debe ser válido y el email no puede estar en uso por otro usuario.
- Flujo `FLOW-009` · pantalla `SCR-001`
  - **Rutas:** `/admin/users/new`
  - **Componentes de UI:** Formulario de Creación de Usuario; Botón Crear Usuario; Botón Cancelar
  - **Datos que muestra:** Nombre de usuario; Email de usuario; Rol de usuario
  - **Acciones del usuario:** Guardar nuevo usuario; Cancelar y volver al listado

### ARC-044 · Listado de Usuarios
El administrador consulta, filtra y gestiona todas las cuentas de usuario del sistema.
- **API** (consultar el listado de usuarios): `GET /admin/users` — Consulta el listado de todos los usuarios del sistema (empleados y managers).
- **API** (activar/desactivar una cuenta de usuario): `PATCH /admin/users/{userId}/status` — Activa o desactiva una cuenta de usuario.
- **Campos del contrato de esta pantalla** (tipa el JSON con ESTOS nombres, vía `libs/api-types`): `UserList.items` (array), `UserList.total` (integer), `UserList.page` (integer), `UserList.size` (integer), `UserStatusUpdateRequest.status` (enum), `UserDetail.user_id` (uuid), `UserDetail.full_name` (string), `UserDetail.email` (string), `UserDetail.user_role` (enum), `UserDetail.status` (enum), `UserDetail.manager_name` (string)
- **Detalle de UI (B.7) · `UIS-018`** — FUENTE AUTORITATIVA: los `label` son el texto a pintar y el `widget` el control a usar.
  - Propósito: Permite al administrador consultar el listado completo de usuarios, aplicar filtros por rol y estado, y acceder a las acciones de gestión para cada usuario.
  - Disposición: **listado** (`list`) — respétala; no rediseñes la pantalla.
  - Navegación: es PUERTA DE ENTRADA de la aplicación; sección de menú «Gestión de Usuarios» (orden 0).
  - **Sección «Filtros de búsqueda»** (1 columna):
    - «Rol» (widget `select`, tipo `enum`, opcional, campo `filter_user_role` ⚠ SIN campo en el contrato de sus endpoints (campo-sin-contrato): NO lo inventes en el JSON — repórtalo como `Warning` `api-contract`) — Filtra por el rol asignado al usuario
    - «Aplicar Filtros» (widget `secondary_button`, opcional)
    - «Estado» (widget `select`, tipo `enum`, opcional, campo `filter_account_status` ⚠ SIN campo en el contrato de sus endpoints (campo-sin-contrato): NO lo inventes en el JSON — repórtalo como `Warning` `api-contract`) — Filtra por el estado de la cuenta del usuario (Activo/Inactivo)
    - «Limpiar Filtros» (widget `link`, opcional)
  - **Sección «Usuarios del sistema»** (1 columna):
    - «Usuarios» (widget `table`, opcional)
      - Columnas: «Nombre» (`label` ⚠ `user_full_name` sin campo en el contrato), «Email» (`label` ⚠ `user_email` sin campo en el contrato), «Rol» (`badge` → EP-005 · `UserDetail.user_role`), «Estado» (`badge` ⚠ `user_status` sin campo en el contrato)
    - «Editar» (widget `icon_button`, opcional) — Acción a nivel de fila de la tabla
    - «Desactivar» (widget `icon_button`, opcional) — Visible si el usuario está activo. Acción a nivel de fila de la tabla.
    - «Reactivar» (widget `icon_button`, opcional) — Visible si el usuario está inactivo. Acción a nivel de fila de la tabla.
    - «Asignar manager» (widget `icon_button`, opcional) — Acción a nivel de fila de la tabla
  - **Acciones:**
    - «Crear Nuevo Usuario» (widget `primary_button`, opcional)
- Flujo `FLOW-010` · pantalla `SCR-001`
  - **Rutas:** `/admin/users`
  - **Componentes de UI:** Título de la pantalla: Gestión de Usuarios; Controles de Filtrado (por rol, por estado); Tabla de Usuarios; Control de Paginación; Botón Crear Nuevo Usuario
  - **Datos que muestra:** Lista de usuarios; Filtro por rol de usuario; Filtro por estado de cuenta
  - **Acciones del usuario:** Crear nuevo usuario; Editar usuario seleccionado; Desactivar usuario seleccionado; Reactivar usuario seleccionado; Asignar manager a usuario; Aplicar filtros; Limpiar filtros

### ARC-045 · Formulario de Edición de Usuario
El administrador modifica la información de una cuenta de usuario existente.
- **API** (cargar los datos del usuario para editar): `GET /admin/users/{userId}` — Obtiene el detalle de una cuenta de usuario específica.
- **API** (guardar los cambios del usuario): `PUT /admin/users/{userId}` — Modifica los datos principales de un usuario (nombre, rol).
- **Campos del contrato de esta pantalla** (tipa el JSON con ESTOS nombres, vía `libs/api-types`): `UserDetail.user_id` (uuid), `UserDetail.full_name` (string), `UserDetail.email` (string), `UserDetail.user_role` (enum), `UserDetail.status` (enum), `UserDetail.manager_name` (string), `UserUpdateRequest.full_name` (string), `UserUpdateRequest.user_role` (enum)
- **Detalle de UI (B.7) · `UIS-019`** — FUENTE AUTORITATIVA: los `label` son el texto a pintar y el `widget` el control a usar.
  - Propósito: Permite a un administrador modificar la información personal y el rol de un usuario existente en el sistema.
  - Disposición: **formulario** (`form`) — respétala; no rediseñes la pantalla.
  - Navegación: sección de menú «Gestión de Usuarios» (orden 1).
  - **Sección «Datos del Usuario»** (2 columnas):
    - «Nombre de usuario» (widget `text`, tipo `string`, obligatorio, campo `nombre_usuario` ⚠ SIN campo en el contrato de sus endpoints (campo-sin-contrato): NO lo inventes en el JSON — repórtalo como `Warning` `api-contract`) — No puede estar vacío.
    - «Email» (widget `text`, tipo `string`, obligatorio, campo `email_usuario` ⚠ SIN campo en el contrato de sus endpoints (campo-sin-contrato): NO lo inventes en el JSON — repórtalo como `Warning` `api-contract`) — Debe ser una dirección de email válida.
    - «Rol» (widget `select`, tipo `enum`, obligatorio, campo `rol_usuario` ⚠ SIN campo en el contrato de sus endpoints (campo-sin-contrato): NO lo inventes en el JSON — repórtalo como `Warning` `api-contract`) — Debe seleccionar un rol para el usuario.
  - **Acciones:**
    - «Cancelar» (widget `cancel`, opcional)
    - «Guardar cambios» (widget `submit`, opcional) — si el formulario es válido
- Flujo `FLOW-011` · pantalla `SCR-001`
  - **Rutas:** `/admin/users/{userId}/edit`
  - **Componentes de UI:** Formulario de Edición de Usuario; Botón Guardar Cambios; Botón Cancelar
  - **Datos que muestra:** Nombre de usuario; Email de usuario; Rol de usuario
  - **Acciones del usuario:** Guardar cambios; Cancelar y volver al listado

### ARC-046 · Diálogo de Confirmación de Desactivación
El administrador confirma la desactivación de una cuenta de usuario.
- **API** (confirmar la desactivación del usuario): `PATCH /admin/users/{userId}/status` — Activa o desactiva una cuenta de usuario.
- **Campos del contrato de esta pantalla** (tipa el JSON con ESTOS nombres, vía `libs/api-types`): `UserStatusUpdateRequest.status` (enum), `UserDetail.user_id` (uuid), `UserDetail.full_name` (string), `UserDetail.email` (string), `UserDetail.user_role` (enum), `UserDetail.status` (enum), `UserDetail.manager_name` (string)
- **Detalle de UI (B.7) · `UIS-020`** — FUENTE AUTORITATIVA: los `label` son el texto a pintar y el `widget` el control a usar.
  - Propósito: El administrador confirma su intención de desactivar la cuenta de un usuario para evitar una revocación de acceso accidental.
  - Disposición: **confirmación** (`confirmation`) — respétala; no rediseñes la pantalla.
  - Navegación: sección de menú «Gestión de Usuarios» (orden 1).
  - **Datos que muestra:**
    - «El usuario perderá todo acceso al sistema. ¿Desea confirmar la desactivación?» (widget `text_block`, opcional)
  - **Acciones:**
    - «Cancelar» (widget `cancel`, opcional)
    - «Desactivar» (widget `primary_button`, opcional)
- Flujo `FLOW-012` · pantalla `SCR-001`
  - **Rutas:** `/admin/users/{userId}/deactivate`
  - **Componentes de UI:** Mensaje de Confirmación de Desactivación; Botón Confirmar Desactivación; Botón Cancelar
  - **Datos que muestra:** Usuario a desactivar; Mensaje de confirmación de desactivación
  - **Acciones del usuario:** Confirmar desactivación; Cancelar

### ARC-047 · Diálogo de Confirmación de Reactivación
El administrador confirma la reactivación de una cuenta de usuario inactiva.
- **API** (confirmar la reactivación del usuario): `PATCH /admin/users/{userId}/status` — Activa o desactiva una cuenta de usuario.
- **Campos del contrato de esta pantalla** (tipa el JSON con ESTOS nombres, vía `libs/api-types`): `UserStatusUpdateRequest.status` (enum), `UserDetail.user_id` (uuid), `UserDetail.full_name` (string), `UserDetail.email` (string), `UserDetail.user_role` (enum), `UserDetail.status` (enum), `UserDetail.manager_name` (string)
- **Detalle de UI (B.7) · `UIS-021`** — FUENTE AUTORITATIVA: los `label` son el texto a pintar y el `widget` el control a usar.
  - Propósito: El administrador confirma la reactivación de una cuenta de usuario que se encontraba inactiva para restaurar su acceso al sistema.
  - Disposición: **formulario** (`form`) — respétala; no rediseñes la pantalla.
  - **Datos que muestra:**
    - «Usuario a reactivar» (widget `label`, tipo `string`, opcional)
    - «¿Estás seguro de que deseas reactivar esta cuenta? Esta acción restaurará el acceso del usuario al sistema.» (widget `text_block`, opcional)
  - **Acciones:**
    - «Cancelar» (widget `cancel`, opcional)
    - «Confirmar Reactivación» (widget `primary_button`, opcional)
- Flujo `FLOW-013` · pantalla `SCR-001`
  - **Rutas:** `/admin/users/{userId}/reactivate`
  - **Componentes de UI:** Mensaje de Confirmación de Reactivación; Botón Confirmar Reactivación; Botón Cancelar
  - **Datos que muestra:** Usuario a reactivar; Mensaje de confirmación de reactivación
  - **Acciones del usuario:** Confirmar reactivación; Cancelar

### ARC-048 · Formulario de Asignación de Manager
El administrador asigna un manager a un empleado que no lo tiene.
- **API** (cargar el catálogo de managers): `GET /admin/users` — Consulta el listado de todos los usuarios del sistema (empleados y managers).
- **API** (asignar manager a empleado): `POST /admin/employees/{employeeId}/manager` — Asigna un manager a un empleado que no tiene uno.
- **Campos del contrato de esta pantalla** (tipa el JSON con ESTOS nombres, vía `libs/api-types`): `UserList.items` (array), `UserList.total` (integer), `UserList.page` (integer), `UserList.size` (integer), `ManagerAssignmentRequest.manager_id` (uuid), `HierarchyNodeDetail.employee_id` (uuid), `HierarchyNodeDetail.employee_name` (string), `HierarchyNodeDetail.manager_id` (uuid), `HierarchyNodeDetail.manager_name` (string)
- **Detalle de UI (B.7) · `UIS-022`** — FUENTE AUTORITATIVA: los `label` son el texto a pintar y el `widget` el control a usar.
  - Propósito: Permite a un administrador seleccionar un manager de una lista y asignárselo a un empleado concreto para establecer la relación jerárquica entre ellos.
  - Disposición: **formulario** (`form`) — respétala; no rediseñes la pantalla.
  - Navegación: sección de menú «Gestión de Usuarios» (orden 4).
  - **Sección «Datos de la Asignación»** (2 columnas):
    - «Empleado» (widget `text_block`, tipo `string`, opcional, campo `employee_name` → contrato EP-007 · `HierarchyNodeDetail.employee_name`)
    - «Manager» (widget `autocomplete`, tipo `string`, obligatorio, campo `manager_id` → contrato EP-007 · `ManagerAssignmentRequest.manager_id`) — Debe seleccionar un manager de la lista. El empleado no puede ser su propio manager.
  - **Acciones:**
    - «Cancelar» (widget `cancel`, opcional)
    - «Asignar» (widget `submit`, opcional) — Se debe seleccionar un manager de la lista para asignar al empleado.
- Flujo `FLOW-014` · pantalla `SCR-001`
  - **Rutas:** `/admin/users/{userId}/assign-manager`
  - **Componentes de UI:** Formulario de Asignación de Manager; Selector de Empleado; Selector de Manager; Botón Asignar; Botón Cancelar
  - **Datos que muestra:** Empleado para asignar manager; Lista de managers disponibles
  - **Acciones del usuario:** Confirmar asignación de manager; Cancelar asignación

### ARC-049 · Formulario de Modificación de Manager
El administrador cambia el manager asignado a un empleado.
- **API** (cargar datos del empleado): `GET /admin/users/{userId}` — Obtiene el detalle de una cuenta de usuario específica.
- **API** (cargar el catálogo de managers): `GET /admin/users` — Consulta el listado de todos los usuarios del sistema (empleados y managers).
- **API** (modificar el manager del empleado): `PUT /admin/employees/{employeeId}/manager` — Modifica el manager asignado a un empleado.
- **Campos del contrato de esta pantalla** (tipa el JSON con ESTOS nombres, vía `libs/api-types`): `UserDetail.user_id` (uuid), `UserDetail.full_name` (string), `UserDetail.email` (string), `UserDetail.user_role` (enum), `UserDetail.status` (enum), `UserDetail.manager_name` (string), `UserList.items` (array), `UserList.total` (integer), `UserList.page` (integer), `UserList.size` (integer), `ManagerAssignmentRequest.manager_id` (uuid), `HierarchyNodeDetail.employee_id` (uuid), `HierarchyNodeDetail.employee_name` (string), `HierarchyNodeDetail.manager_id` (uuid), `HierarchyNodeDetail.manager_name` (string)
- **Detalle de UI (B.7) · `UIS-024`** — FUENTE AUTORITATIVA: los `label` son el texto a pintar y el `widget` el control a usar.
  - Propósito: Permite al administrador reasignar un empleado a un nuevo mánager, mostrando el mánager actual y permitiendo seleccionar uno nuevo de la lista de disponibles.
  - Disposición: **formulario** (`form`) — respétala; no rediseñes la pantalla.
  - Navegación: sección de menú «Gestión de Usuarios» (orden 2).
  - **Sección «Datos de la Asignación»** (2 columnas):
    - «Empleado» (widget `key_value`, tipo `string`, opcional, campo `nombre_empleado` ⚠ SIN campo en el contrato de sus endpoints (campo-sin-contrato): NO lo inventes en el JSON — repórtalo como `Warning` `api-contract`)
    - «Mánager actual» (widget `key_value`, tipo `string`, opcional, campo `nombre_manager_actual` ⚠ SIN campo en el contrato de sus endpoints (campo-sin-contrato): NO lo inventes en el JSON — repórtalo como `Warning` `api-contract`)
  - **Sección «Seleccionar Nuevo Mánager»** (1 columna):
    - «Seleccionar nuevo mánager» (widget `autocomplete`, tipo `string`, obligatorio, campo `nuevo_manager_id` ⚠ SIN campo en el contrato de sus endpoints (campo-sin-contrato): NO lo inventes en el JSON — repórtalo como `Warning` `api-contract`) — Debe ser un mánager distinto al actual. El empleado no puede ser su propio mánager.
  - **Acciones:**
    - «Cancelar» (widget `cancel`, opcional)
    - «Guardar cambios» (widget `submit`, opcional, navega) — Si se ha seleccionado un nuevo manager
- Flujo `FLOW-015` · pantalla `SCR-001`
  - **Rutas:** `/admin/users/{userId}/change-manager`
  - **Componentes de UI:** Formulario de Modificación de Manager; Selector de Nuevo Manager; Botón Guardar Cambio; Botón Cancelar
  - **Datos que muestra:** Empleado; Manager actual; Lista de nuevos managers disponibles
  - **Acciones del usuario:** Continuar para confirmar cambio; Cancelar modificación
  - **Navegación:**
    - Guardar cambios → «Diálogo de Confirmación de Cambio de Manager» si Si se ha seleccionado un nuevo manager [open_modal]

### ARC-050 · Diálogo de Confirmación de Cambio de Manager
El administrador confirma la reasignación de manager para un empleado.
- **API**: esta pantalla no trae cableado pantalla→endpoint de T.5. NO lo interpretes como «no llama a la API»: elige los endpoints que necesita de la tabla del contrato congelado (sección api-contract), con su path y su verbo literales, y **repórtalo como health check `Warning` con `check: api-contract`** indicando cuáles has usado.
- **Detalle de UI (B.7) · `UIS-025`** — FUENTE AUTORITATIVA: los `label` son el texto a pintar y el `widget` el control a usar.
  - Propósito: Presenta un resumen del cambio de mánager propuesto (empleado, mánager actual y nuevo mánager) para que el administrador lo verifique y confirme la operación de forma explícita.
  - Disposición: **confirmación** (`confirmation`) — respétala; no rediseñes la pantalla.
  - Navegación: sección de menú «Gestión de Usuarios» (orden 3).
  - **Datos que muestra:**
    - «Empleado» (widget `key_value`, tipo `string`, opcional, campo `nombre_empleado`)
    - «Mánager actual» (widget `key_value`, tipo `string`, opcional, campo `nombre_manager_actual`)
    - «Nuevo mánager» (widget `key_value`, tipo `string`, opcional, campo `nombre_nuevo_manager`)
  - **Acciones:**
    - «Volver a editar» (widget `secondary_button`, opcional, navega)
    - «Confirmar cambio» (widget `primary_button`, opcional)
- Flujo `FLOW-015` · pantalla `SCR-002`
  - **Rutas:** `/admin/users/{userId}/change-manager/confirm`
  - **Componentes de UI:** Mensaje de Confirmación de Cambio de Manager; Botón Confirmar Cambio; Botón Cancelar
  - **Datos que muestra:** Nombre del empleado; Manager actual; Nuevo manager; Mensaje de confirmación de cambio de manager
  - **Acciones del usuario:** Confirmar cambio de manager; Volver a editar; Cancelar
  - **Navegación:**
    - Cancelar → «Formulario de Modificación de Manager» [back]

### ARC-051 · Diálogo de Confirmación de Eliminación de Asignación
El administrador confirma la desvinculación de un empleado de su manager.
- **API** (eliminar asignación de manager): `DELETE /admin/employees/{employeeId}/manager` — Elimina la asignación de manager de un empleado.
- **Detalle de UI (B.7) · `UIS-023`** — FUENTE AUTORITATIVA: los `label` son el texto a pintar y el `widget` el control a usar.
  - Propósito: El administrador confirma que desea desvincular a un empleado de su mánager actual, asegurando que la acción es intencionada antes de que sea definitiva.
  - Disposición: **confirmación** (`confirmation`) — respétala; no rediseñes la pantalla.
  - Navegación: sección de menú «Gestión de Usuarios» (orden 0).
  - **Datos que muestra:**
    - «Mensaje de confirmación» (widget `text_block`, opcional)
    - «Empleado» (widget `key_value`, tipo `string`, opcional, campo `nombre_empleado`)
    - «Mánager actual» (widget `key_value`, tipo `string`, opcional, campo `nombre_manager_actual`)
  - **Acciones:**
    - «Cancelar» (widget `cancel`, opcional)
    - «Confirmar Eliminación» (widget `primary_button`, opcional)
- Flujo `FLOW-016` · pantalla `SCR-001`
  - **Rutas:** `/admin/users/{userId}/unassign-manager`
  - **Componentes de UI:** Mensaje de Confirmación de Eliminación de Asignación; Botón Confirmar Eliminación; Botón Cancelar
  - **Datos que muestra:** Empleado a desvincular; Manager actual; Mensaje de confirmación de desvinculación
  - **Acciones del usuario:** Confirmar desvinculación; Cancelar

### ARC-052 · Listado de Estructura Jerárquica
El administrador visualiza y filtra la estructura de dependencias de la organización.
- **API** (consultar la estructura jerárquica): `GET /admin/hierarchy` — Consulta la estructura jerárquica de la organización.
- **API** (cargar el catálogo de managers para el filtro): `GET /admin/users` — Consulta el listado de todos los usuarios del sistema (empleados y managers).
- **Campos del contrato de esta pantalla** (tipa el JSON con ESTOS nombres, vía `libs/api-types`): `HierarchyList.items` (array), `HierarchyList.total` (integer), `HierarchyList.page` (integer), `HierarchyList.size` (integer), `UserList.items` (array), `UserList.total` (integer), `UserList.page` (integer), `UserList.size` (integer)
- **Detalle de UI (B.7) · `UIS-026`** — FUENTE AUTORITATIVA: los `label` son el texto a pintar y el `widget` el control a usar.
  - Propósito: Permite a un administrador visualizar la lista de todos los empleados, ver qué manager tienen asignado y filtrar la información para facilitar la gestión de la estructura organizativa.
  - Disposición: **listado** (`list`) — respétala; no rediseñes la pantalla.
  - Navegación: es PUERTA DE ENTRADA de la aplicación; sección de menú «Administración» (orden 0).
  - **Sección «Filtros de búsqueda»** (2 columnas):
    - «Buscar por empleado» (widget `search`, tipo `string`, opcional, campo `filtro_empleado` ⚠ SIN campo en el contrato de sus endpoints (campo-sin-contrato): NO lo inventes en el JSON — repórtalo como `Warning` `api-contract`)
    - «Aplicar filtros» (widget `submit`, opcional)
    - «Filtrar por manager» (widget `select`, tipo `string`, opcional, campo `filtro_manager` ⚠ SIN campo en el contrato de sus endpoints (campo-sin-contrato): NO lo inventes en el JSON — repórtalo como `Warning` `api-contract`)
  - **Sección «Jerarquía de Empleados»** (1 columna):
    - «Modificar asignación» (widget `icon_button`, opcional)
    - «Empleados y managers» (widget `table`, opcional)
      - Columnas: «Empleado» (`label` ⚠ `nombre_empleado` sin campo en el contrato), «Manager Asignado» (`label` ⚠ `nombre_manager` sin campo en el contrato)
    - «Desvincular» (widget `icon_button`, opcional)
- Flujo `FLOW-017` · pantalla `SCR-001`
  - **Rutas:** `/admin/organization/structure`
  - **Componentes de UI:** Título de la pantalla: Estructura Jerárquica; Controles de Filtrado (por empleado, por manager); Tabla de Jerarquía de Empleados; Control de Paginación
  - **Datos que muestra:** Lista de estructura jerárquica; Filtro de búsqueda de estructura jerárquica
  - **Acciones del usuario:** Aplicar filtros de búsqueda; Modificar asignación de manager; Desvincular empleado de manager

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

Antes de arrancar tu sesión, la plataforma levanta los servicios de abajo como contenedores efímeros y deja sus datos de conexión en `.mind/TSK-010/env.sh` (y en `env.json`). Contrato de uso:

- **Haz `source .mind/TSK-010/env.sh` antes de cada build/test** que necesite el entorno; si el fichero no existe, el entorno NO se pudo levantar (ver el final de esta sección).
- Los tests **leen la conexión de esas variables** (o de Testcontainers, ver abajo). NUNCA hardcodees host, puerto ni credenciales, y NUNCA toques la configuración `local/` del arquetipo para apuntarla a este entorno.
- Son servicios de PRUEBA y efímeros: se destruyen al terminar la sesión. No guardes nada que deba sobrevivir ni los uses como almacén de resultados.

### `wiremock` — wiremock/wiremock:3.13.1 (capa `api`)
Por qué está: servir el contrato de API del proyecto (22 endpoint(s)) para que las pantallas tengan a quién preguntar, sin levantar el backend.
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
Comprueba `.mind/TSK-010/env.json`: si su `status` es `unavailable` o `degraded`, la plataforma no pudo darte (todo) el entorno. En ese caso ESCRIBE igualmente los tests de integración y déjalos en el entregable, y repórtalo como health check **Warning** con `check: entorno-de-prueba` — NO como Blocker: no es un defecto de tu tarea, y la verificación queda diferida al CI. Reserva el Blocker para cuando el entorno SÍ estaba y los tests fallan por el código o por el brief.

## Fallo del intento anterior (OBLIGATORIO corregir)

La sesión previa **no entregó**. Corrige la causa antes de ampliar alcance:

> delivery-gate: la verificaciÃ³n bloqueÃ³ la entrega.
toolchain no disponible en el runtime: npm

Acciones:
- Reproduce el fallo lo primero. No amplíes alcance de negocio hasta corregirlo. No entregues basura para «pasar» el finalize.