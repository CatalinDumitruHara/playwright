import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { HttpErrorResponse } from '@angular/common/http';
import { of, Subject, throwError } from 'rxjs';
import { ReportIncidentService } from '../../report-incident.service';
import { CategoryOption, CreatedIncident, RoomOption } from '../../report-incident.models';
import { ReportIncidentPage } from './report-incident.page';

const CATEGORIES: CategoryOption[] = [
  { code: 'CLIMA', name: 'Climatización', active: true },
  { code: 'LUZ', name: 'Iluminación', active: true },
  { code: 'OLD', name: 'Antigua', active: false },
];

const ROOMS: RoomOption[] = [
  { id: 1, name: 'Sala Norte', officeId: 10, officeName: 'Madrid', active: true },
  { id: 2, name: 'Sala Sur', officeId: 10, officeName: '', active: true },
  { id: 3, name: 'Sala Cerrada', officeId: 10, officeName: 'Madrid', active: false },
];

const CREATED: CreatedIncident = {
  incidentId: 'abc',
  referenceCode: 'INC-0001',
  status: 'OPEN',
  createdAt: '2026-10-01T10:00:00',
  photoStored: false,
};

const VALID_DESCRIPTION = 'La luz del techo parpadea sin parar';

describe('ReportIncidentPage', () => {
  let fixture: ComponentFixture<ReportIncidentPage>;
  let component: ReportIncidentPage;
  let router: Router;
  let serviceMock: {
    loadCategories: jest.Mock;
    loadRooms: jest.Mock;
    create: jest.Mock;
    readPhoto: jest.Mock;
    getLastRoomId: jest.Mock;
    setLastRoomId: jest.Mock;
  };

  const el = (id: string) => fixture.debugElement.query(By.css(`[data-testid="${id}"]`));
  const text = (id: string): string => (el(id)?.nativeElement.textContent ?? '').trim();

  async function setup(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [ReportIncidentPage],
      providers: [provideRouter([]), { provide: ReportIncidentService, useValue: serviceMock }],
    }).compileComponents();
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(ReportIncidentPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function fillValid(): void {
    component.form.setValue({ roomId: 1, categoryCode: 'LUZ', description: VALID_DESCRIPTION });
    fixture.detectChanges();
  }

  beforeEach(() => {
    serviceMock = {
      loadCategories: jest.fn().mockReturnValue(of(CATEGORIES)),
      loadRooms: jest.fn().mockReturnValue(of(ROOMS)),
      create: jest.fn(),
      readPhoto: jest.fn(),
      getLastRoomId: jest.fn().mockReturnValue(null),
      setLastRoomId: jest.fn(),
    };
  });

  it('AC1: al iniciar carga categorías y salas, pinta selectores y sugiere la última sala activa', async () => {
    serviceMock.getLastRoomId.mockReturnValue(2);
    await setup();
    expect(serviceMock.loadCategories).toHaveBeenCalledTimes(1);
    expect(serviceMock.loadRooms).toHaveBeenCalledTimes(1);
    expect(el('room-select')).toBeTruthy();
    expect(el('category-select')).toBeTruthy();
    expect(component.roomOptions).toEqual([
      { id: 1, label: 'Sala Norte · Madrid' },
      { id: 2, label: 'Sala Sur' },
    ]);
    expect(component.categoryOptions).toEqual([
      { code: 'CLIMA', label: 'Climatización' },
      { code: 'LUZ', label: 'Iluminación' },
    ]);
    expect(el('room-select').componentInstance.options()).toEqual(component.roomOptions);
    expect(component.form.controls.roomId.value).toBe(2);
  });

  it('AC1: la sala sugerida no se aplica si ya no está activa', async () => {
    serviceMock.getLastRoomId.mockReturnValue(3);
    await setup();
    expect(component.form.controls.roomId.value).toBeNull();
  });

  it('AC2: si falla la carga de catálogos muestra el aviso y deshabilita el envío', async () => {
    serviceMock.loadRooms.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    await setup();
    const err = el('catalog-error');
    expect(err).toBeTruthy();
    expect(err.componentInstance.title).toBe('No se han podido cargar las salas, reintenta');
    expect(component.submitDisabled).toBe(true);
    expect(el('submit-incident').nativeElement.disabled).toBe(true);
    component.form.setValue({ roomId: 1, categoryCode: 'LUZ', description: VALID_DESCRIPTION });
    component.submit();
    expect(serviceMock.create).not.toHaveBeenCalled();
  });

  it('AC3: formulario vacío no envía y muestra los mensajes de obligatoriedad', async () => {
    await setup();
    component.submit();
    fixture.detectChanges();
    expect(serviceMock.create).not.toHaveBeenCalled();
    expect(text('error-room')).toBe('Debes indicar la sala afectada');
    expect(text('error-category')).toBe('Selecciona una categoría');
    expect(text('error-description')).toBe('Describe brevemente la incidencia');
  });

  it('AC4: descripción solo con espacios o de menos de 10 caracteres no se envía', async () => {
    await setup();
    component.form.setValue({ roomId: 1, categoryCode: 'LUZ', description: '          ' });
    component.submit();
    fixture.detectChanges();
    expect(text('error-description')).toBe('Describe brevemente la incidencia');

    component.form.setValue({ roomId: 1, categoryCode: 'LUZ', description: '  corta  ' });
    component.submit();
    fixture.detectChanges();
    expect(text('error-description')).toBe('La descripción debe tener entre 10 y 500 caracteres');
    expect(serviceMock.create).not.toHaveBeenCalled();
  });

  it('AC5: envío válido sin foto llama create una sola vez, bloquea doble envío y navega a la confirmación', async () => {
    const response$ = new Subject<CreatedIncident>();
    serviceMock.create.mockReturnValue(response$.asObservable());
    await setup();
    fillValid();

    component.submit();
    component.submit();
    fixture.detectChanges();

    expect(serviceMock.create).toHaveBeenCalledTimes(1);
    expect(serviceMock.create).toHaveBeenCalledWith({
      roomId: 1,
      categoryCode: 'LUZ',
      description: VALID_DESCRIPTION,
      photo: null,
    });
    expect(serviceMock.readPhoto).not.toHaveBeenCalled();
    expect(el('submit-incident').nativeElement.disabled).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();

    response$.next(CREATED);
    response$.complete();

    expect(serviceMock.setLastRoomId).toHaveBeenCalledWith(1);
    expect(router.navigate).toHaveBeenCalledWith(['/incidencias/nueva/confirmacion'], {
      state: { created: CREATED },
    });
  });

  it('AC6: error 422 muestra sala no disponible y conserva los datos del formulario', async () => {
    serviceMock.create.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 422, error: {} })));
    await setup();
    fillValid();
    component.submit();
    fixture.detectChanges();
    expect(el('form-error').componentInstance.title).toBe('La sala seleccionada ya no está disponible');
    expect(component.form.getRawValue()).toEqual({
      roomId: 1,
      categoryCode: 'LUZ',
      description: VALID_DESCRIPTION,
    });
    expect(component.submitting).toBe(false);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('AC6: error 500 muestra el mensaje genérico', async () => {
    serviceMock.create.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500, error: {} })));
    await setup();
    fillValid();
    component.submit();
    fixture.detectChanges();
    expect(el('form-error').componentInstance.title).toBe(
      'No hemos podido registrar la incidencia, inténtalo de nuevo',
    );
    expect(el('submit-incident').nativeElement.disabled).toBe(false);
  });

  describe('AC7: validación de la foto', () => {
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;

    beforeEach(() => {
      URL.createObjectURL = jest.fn().mockReturnValue('blob:preview');
      URL.revokeObjectURL = jest.fn();
    });

    afterEach(() => {
      fixture?.destroy();
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
    });

    it('AC7: rechaza un tipo no permitido (gif)', async () => {
      await setup();
      component.onFileSelected(new File(['x'], 'foto.gif', { type: 'image/gif' }));
      fixture.detectChanges();
      expect(text('error-photo')).toBe('Formato de imagen no admitido, usa JPG o PNG');
      expect(component.photoFile).toBeNull();
      expect(URL.createObjectURL).not.toHaveBeenCalled();
    });

    it('AC7: rechaza una foto de más de 5 MB', async () => {
      await setup();
      const big = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'foto.jpg', { type: 'image/jpeg' });
      component.onFileSelected(big);
      fixture.detectChanges();
      expect(text('error-photo')).toBe('La foto supera el tamaño máximo permitido (5 MB)');
      expect(component.photoFile).toBeNull();
    });

    it('AC7: acepta un PNG válido y muestra la previsualización', async () => {
      await setup();
      component.onFileSelected(new File(['x'], 'foto.png', { type: 'image/png' }));
      fixture.detectChanges();
      expect(el('error-photo')).toBeNull();
      expect(el('photo-preview').nativeElement.getAttribute('src')).toBe('blob:preview');
    });
  });
});
