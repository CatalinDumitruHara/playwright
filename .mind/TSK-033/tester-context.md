# Contexto tester TSK-033

- Jest + jest-preset-angular (Angular 17 standalone). Test setup `apps/app/src/test-setup.ts` con errorOnUnknownElements/Properties.
- Ejecuta SOLO tu spec: `cd /workspaces/mind-a563c5cb-959a-4ac5-a1b7-04b487a00252-TSK-033--feature-TSK-033 && npx nx test app --testPathPattern='<ruta/parcial/del/spec>' 2>&1 | grep -E "PASS|FAIL|Tests:|✓|✕|●" | head -60` (tarda ~1-2 min). NUNCA la suite completa.
- Antes de escribir, LEE el componente productivo (.ts y .html) que pruebas: importa la clase real con la ruta relativa real. No inventes nombres.
- Mockea `AuthenticationService` (`apps/app/src/app/core/auth/authentication.service.ts`) con `{ provide: AuthenticationService, useValue: mock }`; los métodos devuelven `of(...)`/`throwError(() => new HttpErrorResponse({ status, error }))`. Router: `provideRouter([])` o `RouterTestingModule` y `jest.spyOn(router, 'navigate').mockResolvedValue(true)`.
- Los componentes b2b son reales (no los mockees). Los avisos `b2b-notification-inline` llevan el texto en el input `title`: comprueba vía `fixture.debugElement.query(By.css('[data-testid="x"]'))` + `.componentInstance.title` / `.visible`, o el `textContent` del elemento.
- Para rellenar formularios usa `component.<form>.controls[...].setValue(...)` y llama al método de envío o `form.dispatchEvent(new Event('submit'))`.
- Contraseña válida de política: `'NuevaClave2026'`. Inválida: `'corta1A'`, `'sinmayusculas123'`.
- NO modifiques código productivo. Si encuentras un bug productivo, NO lo arregles: descríbelo en tu respuesta final (fichero, línea, comportamiento esperado).
- EDITA el spec existente sobrescribiéndolo (Write sobre el mismo path). Sin ficheros nuevos, sin `.skip`, sin `xit`.
- Respuesta final: número de tests del spec y cuántos pasan.
