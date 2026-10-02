import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { MyIncidentsService } from '../../my-incidents.service';
import { PhotoContent } from '../../my-incidents.models';
import { IncidentPhotoPage } from './incident-photo.page';

const PHOTO: PhotoContent = {
  fileName: 'grifo.png',
  mimeType: 'image/png',
  contentBase64: btoa('fake-png-bytes'),
};

describe('IncidentPhotoPage', () => {
  let fixture: ComponentFixture<IncidentPhotoPage>;
  let serviceMock: { photo: jest.Mock };
  let router: Router;
  let createObjectURL: jest.Mock;
  let revokeObjectURL: jest.Mock;
  const originalCreate = (URL as unknown as { createObjectURL?: unknown }).createObjectURL;
  const originalRevoke = (URL as unknown as { revokeObjectURL?: unknown }).revokeObjectURL;

  const one = (id: string) => fixture.debugElement.query(By.css(`[data-testid="${id}"]`));

  async function setup(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [IncidentPhotoPage],
      providers: [
        provideRouter([]),
        { provide: MyIncidentsService, useValue: serviceMock },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '7' }) } } },
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(IncidentPhotoPage);
    fixture.detectChanges();
  }

  beforeEach(() => {
    serviceMock = { photo: jest.fn() };
    createObjectURL = jest.fn().mockReturnValue('blob:http://localhost/foto-7');
    revokeObjectURL = jest.fn();
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, configurable: true, writable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURL, configurable: true, writable: true });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    Object.defineProperty(URL, 'createObjectURL', { value: originalCreate, configurable: true, writable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: originalRevoke, configurable: true, writable: true });
  });

  it('AC: con contenido pinta la imagen con la URL del blob', async () => {
    serviceMock.photo.mockReturnValue(of(PHOTO));
    await setup();
    expect(serviceMock.photo).toHaveBeenCalledWith('7');
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe('image/png');
    const img = one('photo-image');
    expect(img).toBeTruthy();
    expect(img.nativeElement.getAttribute('src')).toBe('blob:http://localhost/foto-7');
    expect(one('download-photo')).toBeTruthy();
    expect(one('photo-empty')).toBeNull();
    expect(one('photo-error')).toBeNull();
  });

  it('AC: al destruir la página revoca la URL del blob', async () => {
    serviceMock.photo.mockReturnValue(of(PHOTO));
    await setup();
    fixture.destroy();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/foto-7');
  });

  it('AC: sin foto (null) muestra «Esta incidencia no tiene foto adjunta»', async () => {
    serviceMock.photo.mockReturnValue(of(null));
    await setup();
    const empty = one('photo-empty');
    expect(empty).toBeTruthy();
    expect(empty.componentInstance.title).toBe('Esta incidencia no tiene foto adjunta');
    expect(one('photo-image')).toBeNull();
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it('Error: 500 muestra «La imagen adjunta no está disponible en este momento»', async () => {
    serviceMock.photo.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    await setup();
    const err = one('photo-error');
    expect(err).toBeTruthy();
    expect(err.componentInstance.title).toBe('La imagen adjunta no está disponible en este momento');
    expect(one('photo-image')).toBeNull();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('Error: 404 navega a /incidencias/no-encontrada con el id', async () => {
    serviceMock.photo.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
    await setup();
    expect(router.navigate).toHaveBeenCalledWith(['/incidencias/no-encontrada'], { queryParams: { id: '7' } });
  });
});
