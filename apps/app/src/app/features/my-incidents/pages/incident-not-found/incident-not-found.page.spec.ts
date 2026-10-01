import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router, RouterLink } from '@angular/router';
import { By } from '@angular/platform-browser';
import { IncidentNotFoundPage } from './incident-not-found.page';

describe('IncidentNotFoundPage', () => {
  let fixture: ComponentFixture<IncidentNotFoundPage>;
  let router: Router;

  const one = (id: string) => fixture.debugElement.query(By.css(`[data-testid="${id}"]`));

  async function setup(queryParams: Record<string, string>): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [IncidentNotFoundPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({}), queryParamMap: convertToParamMap(queryParams) } },
        },
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    jest.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(IncidentNotFoundPage);
    fixture.detectChanges();
  }

  it('AC: con queryParam id=99 muestra «No hemos encontrado esa incidencia» y el id', async () => {
    await setup({ id: '99' });
    const info = one('not-found-info');
    expect(info).toBeTruthy();
    expect(info.componentInstance.title).toBe('No hemos encontrado esa incidencia');
    expect(one('requested-id').nativeElement.textContent.trim()).toBe('99');
  });

  it('AC: sin id no pinta el bloque de incidencia solicitada', async () => {
    await setup({});
    expect(one('not-found-info')).toBeTruthy();
    expect(one('requested-id')).toBeNull();
  });

  it('AC: botones «Volver a mis incidencias» y «Volver a todas las incidencias» presentes y navegan', async () => {
    await setup({ id: '99' });
    const mine = one('back-mine');
    const all = one('back-all');
    expect(mine.nativeElement.textContent.trim()).toBe('Volver a mis incidencias');
    expect(all.nativeElement.textContent.trim()).toBe('Volver a todas las incidencias');
    expect(mine.injector.get(RouterLink).urlTree?.toString()).toBe('/incidencias/mias');
    mine.nativeElement.click();
    expect(router.navigateByUrl).toHaveBeenCalled();
    const target = (router.navigateByUrl as jest.Mock).mock.calls[0][0];
    expect(router.serializeUrl(target)).toBe('/incidencias/mias');
    all.nativeElement.click();
    expect(router.navigate).toHaveBeenCalledWith(['/incidents']);
  });
});
