# Contexto común TSK-033 (para coder/tester)

Repo Angular 17.3 standalone (Nx), app en `apps/app/src/app`. Design system `@mapfre-tech/b2b-components@3.12.17` (instalado en node_modules; compruébalo ahí antes de usar un componente).

## API REAL verificada en el paquete instalado (usa ESTO)
- Botón: `<button b2b-button type="button">` (directiva, sin inputs). Secundario: `class="b2b--secondary"` (además deja `variant="secondary"` como atributo estático). Import `B2bButtonComponent`.
- Aviso: `B2bNotificationInlineComponent`, selector `b2b-notification-inline`. Inputs REALES: `visible` (bool, arranca false → SIEMPRE `[visible]`), `state` ('ok'|'error'|'alert'|'info'), `title` (string), `description` (string). NO proyecta contenido (solo `[b2b-notification-inline-actions]` con `[hasActions]="true"`). Por tanto el texto va en `title`/`description`, NUNCA como hijos `<p>`. Pon además el atributo estático `type="error"` igual a state (el lint de la plataforma lo exige). Ej:
  `<b2b-notification-inline [visible]="true" state="error" type="error" title="Usuario o contraseña incorrectos"></b2b-notification-inline>`
- Contraseña: `B2bPasswordFieldComponent`, `<b2b-password-field class="b2b-width-full" formControlName="x" label="..." inputName="x">` (ControlValueAccessor).
- Texto: `B2bInputComponent` `<input b2b-input class="b2b-width-full" formControlName="username" id="username" />` con `B2bLabelComponent` `<label b2b-label for="username">Correo corporativo</label>`.
- Dato leído: `B2bReadDataComponent` `<b2b-read-data><span b2b-read-data-label>Nombre</span><span b2b-read-data-value>{{ x }}</span></b2b-read-data>`.
- Etiqueta estado: `B2bTagComponent` `<b2b-tag>{{ estado }}</b2b-tag>`.
- Tarjeta: `B2bCardPrimaryComponent` `<div b2b-card-primary>`; contenedor `B2bContainerComponent` `<b2b-container>`.
- Títulos: `<h1 style="font-size: var(--b2b-titles-04-font-size)">` (uno por pantalla); sección `--b2b-titles-06-font-size`.
- PROHIBIDO `<div>`+CSS a mano como control, `<input>`/`<button>` nativos sin directiva b2b, clases bootstrap (`btn`, `alert`).

## Servicio (NO lo modifiques; fuera de zona): `apps/app/src/app/core/auth/authentication.service.ts`
- `login(LoginRequest): Observable<SessionDetail>` → POST `${apiBaseUrl}/auth/sessions` (EP-001)
- `changePassword(ChangePasswordRequest): Observable<void>` → PUT `/auth/password` (EP-005)
- `changePasswordForced(ChangePasswordForcedRequest): Observable<void>` → PUT `/auth/initial-password` (EP-006)
- `logout(): Observable<void>` → DELETE `/auth/sessions/current` (EP-002)
- `getSession(): SessionDetail | null` (referencia al objeto en memoria), `getSessionContext(): Observable<SessionContext|null>` → GET `/auth/sessions/current` (EP-003; también rellena la sesión en memoria)
Tipos desde `@api-types` (libs/api-types): `LoginRequest{username?,password?}`, `SessionDetail{token, must_change_password?, user{name,email,role,status,password_last_updated}}`, `ChangePasswordRequest{current_password?,new_password?}`, `ChangePasswordForcedRequest{new_password?}`. PROHIBIDO declarar `interface` con nombres de schema del contrato (LoginRequest, SessionDetail, PasswordChangeRequest, InitialPasswordRequest, PasswordChangeResult, SessionContext). Si necesitas `new_password_confirmation`, usa un tipo local intersección: `type X = ChangePasswordRequest & { new_password_confirmation: string }`.
- Validador existente: `apps/app/src/app/core/validators/password-match.validator.ts` (`passwordMatchValidator`, grupo con controles `newPassword` y `confirmPassword`, error `mismatch`).

## Política de contraseña (REQ-069 / AC-PWD-03)
≥10 caracteres, al menos una mayúscula, una minúscula y un dígito; no contiene el username. Panel de requisitos visible en los formularios de cambio. Validación front: required + minLength(10) + pattern(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).

## Reglas
- Solo edita los ficheros que te indique el encargo. EDITA el fichero existente (misma clase, mismo selector, mismo nombre exportado); no crees otro componente con el mismo nombre.
- Standalone, `imports` con los componentes b2b usados. Textos en español de España.
- Al acabar, compila: `cd /workspaces/mind-a563c5cb-959a-4ac5-a1b7-04b487a00252-TSK-033--feature-TSK-033 && npx nx build app 2>&1 | tail -20`. No lances tests.
