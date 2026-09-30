import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { SessionEndedPage } from './session-ended.page';

function setup(query: Record<string, string> = {}): {
  fixture: ComponentFixture<SessionEndedPage>;
  navigate: jest.SpyInstance;
} {
  TestBed.configureTestingModule({
    imports: [SessionEndedPage],
    providers: [
      provideRouter([]),
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { queryParamMap: convertToParamMap(query) } },
      },
    ],
  });
  const router = TestBed.inject(Router);
  const navigate = jest.spyOn(router, 'navigate').mockResolvedValue(true);
  const fixture = TestBed.createComponent(SessionEndedPage);
  fixture.detectChanges();
  return { fixture, navigate };
}

function q(fixture: ComponentFixture<SessionEndedPage>, sel: string): HTMLElement | null {
  return (fixture.nativeElement as HTMLElement).querySelector(sel);
}

describe('SessionEndedPage (ARC-070)', () => {
  afterEach(() => {
    history.replaceState(null, '');
  });

  it('ARC-070: con estado reason=logout muestra "Sesión cerrada" y mensaje de cierre', () => {
    history.replaceState({ reason: 'logout', endedAt: '2026-09-30T10:15:00.000Z' }, '');
    const { fixture } = setup();
    const cmp = fixture.componentInstance;
    expect(cmp.reason).toBe('logout');
    expect(cmp.title).toBe('Sesión cerrada');
    expect(cmp.message).toBe('Has cerrado tu sesión correctamente.');
    expect(q(fixture, '[data-testid="reason"]')).not.toBeNull();
  });

  it('ARC-070: sin estado de navegación el motivo es expired ("Sesión caducada")', () => {
    history.replaceState(null, '');
    const { fixture } = setup();
    const cmp = fixture.componentInstance;
    expect(cmp.reason).toBe('expired');
    expect(cmp.title).toBe('Sesión caducada');
    expect(cmp.message).toContain('caducado');
  });

  it('ARC-070: muestra la fecha de finalización formateada dd/MM/yyyy', () => {
    history.replaceState({ reason: 'logout', endedAt: '2026-09-30T10:15:00.000Z' }, '');
    const { fixture } = setup();
    expect(q(fixture, '[data-testid="datetime"]')?.textContent).toContain('30/09/2026');
  });

  it('ARC-070: volver al acceso conserva returnUrl interno (/mi-perfil)', () => {
    const { fixture, navigate } = setup({ returnUrl: '/mi-perfil' });
    q(fixture, '[data-testid="back-button"]')?.click();
    expect(navigate).toHaveBeenCalledWith(['/acceso'], {
      queryParams: { returnUrl: '/mi-perfil' },
    });
  });

  it('ARC-070 (error): returnUrl externo (//evil.com) se descarta', () => {
    const { fixture, navigate } = setup({ returnUrl: '//evil.com' });
    q(fixture, '[data-testid="back-button"]')?.click();
    expect(navigate).toHaveBeenCalledWith(['/acceso'], { queryParams: {} });
  });
});
