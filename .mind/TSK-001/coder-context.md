# Contexto común TSK-001 (coder/tester)

Microservicio Spring Boot (arquetipo container-java) en `sources/` (proyecto Maven independiente; el resto del repo es un SPA Angular ajeno: NO lo toques).
Toolchain: `mvn` del sistema (no hay mvnw), Java 21. Compilar: `cd sources && mvn -q -B compile`. NUNCA `mvn verify` sin `-Dit.test=...`/`-Dtest=...` acotado.

## Paquetes (raíz común `com.mapfre.product.microservice`)
- `sources/src/main/java/com/mapfre/product/microservice/Application.java` (+ `ApplicationStartupTraces.java`) — composition root, esqueleto del arquetipo.
- Todo lo de usuarios en `com.mapfre.product.microservice.users` (subpaquetes `dto`, `security`, `error` permitidos).

## Esquema T.5 (Oracle, ya lo crea el componente de datos; NO lo inventes)
- `user_roles`: `id` NUMBER PK, `role_name` VARCHAR2(50) NOT NULL único ('EMPLEADO','MANAGER','ADMINISTRADOR'). Catálogo: se LEE de BBDD.
- `users`: `id` NUMBER PK (secuencia `USERS_SEQ`, allocationSize=1), `full_name` VARCHAR2(255) NN, `email` VARCHAR2(255) NN único e inmutable (updatable=false), `password_hash` VARCHAR2(255) NN, `role_id` NUMBER NN FK→user_roles, `manager_id` NUMBER FK→users (nullable), `is_active` CHAR(1) NN 'Y'/'N', `created_at` TIMESTAMP NN, `updated_at` TIMESTAMP NN.
- Fechas en Java: `OffsetDateTime` (LocalDateTime PROHIBIDO). PK `GenerationType.SEQUENCE`.

## Contrato API (LEY) — base `/api`, controller `UsuarioController` con `@RequestMapping("/api/admin/users")`
| GET `/api/admin/users` → 200 `UserList` | POST `/api/admin/users` (`UserCreateRequest`) → 201 `UserDetail` | GET `/api/admin/users/{userId}` → 200 `UserDetail` | PUT `/api/admin/users/{userId}` (`UserUpdateRequest`) → 200 `UserDetail` | PATCH `/api/admin/users/{userId}/status` (`UserStatusUpdateRequest`) → 200 `UserDetail` |
Todos requieren rol ADMINISTRADOR.

JSON snake_case EXACTO (usa `@JsonProperty` o records con nombres literales):
- `UserList`: `items` (array de `UserSummary`: `user_id`, `full_name`, `email`, `user_role`, `status`), `total` (int), `page` (int, base 1), `size` (int).
- `UserCreateRequest`: `full_name` (req, @NotBlank), `email` (req, @NotBlank @Email), `user_role` (req, @NotBlank, @Pattern `EMPLEADO|MANAGER`), `initial_password` (opcional).
- `UserDetail`: `user_id` (uuid), `full_name`, `email`, `user_role`, `status` ('Activo'|'Inactivo'), `manager_name` (opcional, full_name del manager si manager_id).
- `UserUpdateRequest`: `full_name` (req @NotBlank), `user_role` (req, @Pattern `EMPLEADO|MANAGER`). Email NO modificable.
- `UserStatusUpdateRequest`: `status` (req, @Pattern `Activo|Inactivo`).
- Listado: query params opcionales `user_role`, `status` (validados mismos patrones), `page` (default 1, min 1), `size` (default 20, 1..100). Orden `full_name` ASC.

`user_id` (uuid) ↔ `users.id` (NUMBER): T.5 no tiene columna UUID. Codificación reversible en `UserIdCodec`: `new UUID(0L, id)` y decodificar con `uuid.getMostSignificantBits()==0 ? uuid.getLeastSignificantBits() : notFound`. UUID mal formado en path → 404.
`status` ↔ `is_active`: 'Y'→'Activo', 'N'→'Inactivo'.

## Reglas de negocio (servicio `UserService`, `@Transactional` / `@Transactional(readOnly=true)`)
- Crear: email único (`existsByEmailIgnoreCase`) → si existe lanza `EmailDuplicadoError` (409, mensaje "El email proporcionado ya está en uso. Por favor, utilice otro."). Rol buscado en `user_roles` por `role_name`; si no existe → `RolInvalidoError` (400, "El rol seleccionado no es válido."). Estado inicial 'Y'. Password: `initial_password` o temporal aleatoria (SecureRandom, 16 chars), siempre guardada como hash BCrypt (`PasswordEncoder`). `created_at`/`updated_at` = now.
- Modificar: actualiza `full_name` y rol; `updated_at`=now. No existe → `UsuarioNoEncontradoError` (404).
- Estado: `Inactivo` sobre la propia cuenta del admin autenticado (email del token == email del usuario objetivo) → `AutoDesactivacionError` (403, "Un administrador no puede desactivar su propia cuenta.") sin cambios. Desactivar ya inactiva / activar ya activa → `EstadoCuentaError` (409). 
- Errores: `@RestControllerAdvice` en `users.error` (`UserApiExceptionHandler`) → `ErrorResponse(code, message, details)` ; validación de body/params → 400 con lista de campos.

## Seguridad
OAuth2 Resource Server JWT. Claim `roles` (lista de strings) → authorities `ROLE_<rol>`; el `sub` del JWT es el email del usuario. `/api/admin/**` requiere `hasRole("ADMINISTRADOR")` (sin token 401, otro rol 403). `/actuator/health` público. Stateless, CSRF off.
Config: `spring.security.oauth2.resourceserver.jwt.jwk-set-uri: ${JWT_JWK_SET_URI:http://localhost:8180/realms/mapfre/protocol/openid-connect/certs}`.
