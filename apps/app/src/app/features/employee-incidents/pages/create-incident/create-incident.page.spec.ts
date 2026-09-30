
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { CreateIncidentPage } from './create-incident.page';
import { IncidentService } from '../../services/incident.service';
import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'b2b-select-field',
  template: '',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MockB2bSelectFieldComponent),
      multi: true,
    },
  ],
})
class MockB2bSelectFieldComponent implements ControlValueAccessor {
  @Input() items: any[];
  @Input() label: string;
  @Input() placeholder: string;
  @Input() options: any[];
  writeValue(obj: any): void {}
  registerOnChange(fn: any): void {}
  registerOnTouched(fn: any): void {}
}

@Component({
  selector: 'b2b-textarea-field',
  template: '',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MockB2bTextareaFieldComponent),
      multi: true,
    },
  ],
})
class MockB2bTextareaFieldComponent implements ControlValueAccessor {
  @Input() label: string;
  @Input() placeholder: string;
  writeValue(obj: any): void {}
  registerOnChange(fn: any): void {}
  registerOnTouched(fn: any): void {}
}

@Component({
  selector: 'b2b-file-upload-field',
  template: '',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MockB2bFileUploaderFieldComponent),
      multi: true,
    },
  ],
})
class MockB2bFileUploaderFieldComponent implements ControlValueAccessor {
  @Input() label: string;
  writeValue(obj: any): void {}
  registerOnChange(fn: any): void {}
  registerOnTouched(fn: any): void {}
}

@Component({
  selector: 'b2b-button-field',
  template: '<button></button>',
})
class MockB2bButtonFieldComponent {
  @Input() disabled: boolean;
}

describe('CreateIncidentPage', () => {
  let component: CreateIncidentPage;
  let fixture: ComponentFixture<CreateIncidentPage>;
  let incidentService: jest.Mocked<IncidentService>;
  let router: jest.Mocked<Router>;

  beforeEach(async () => {
    const incidentServiceMock = {
      getRooms: jest.fn().mockReturnValue(of([])),
      getIncidentCategories: jest.fn().mockReturnValue(of([])),
      createIncident: jest.fn().mockReturnValue(of(null)),
    };

    const routerMock = {
      navigate: jest.fn(),
    };

    await TestBed.configureTestingModule({
      declarations: [
        CreateIncidentPage,
        MockB2bSelectFieldComponent,
        MockB2bTextareaFieldComponent,
        MockB2bFileUploaderFieldComponent,
        MockB2bButtonFieldComponent,
      ],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: IncidentService, useValue: incidentServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateIncidentPage);
    component = fixture.componentInstance;
    incidentService = TestBed.inject(IncidentService) as jest.Mocked<IncidentService>;
    router = TestBed.inject(Router) as jest.Mocked<Router>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load catalogs on ngOnInit', () => {
    expect(incidentService.getRooms).toHaveBeenCalled();
    expect(incidentService.getIncidentCategories).toHaveBeenCalled();
  });

  it('should have an invalid form when required fields are empty', () => {
    expect(component.incidentForm.valid).toBeFalsy();
  });

  it('should call incidentService.createIncident and router.navigate on valid form submission', () => {
    component.incidentForm.setValue({
      roomId: '1',
      categoryCode: 'cat1',
      description: 'Test description',
      photo: null,
    });

    component.onSubmit();

    expect(incidentService.createIncident).toHaveBeenCalledWith({
      roomId: '1',
      categoryCode: 'cat1',
      description: 'Test description',
      photo: null,
    });
    expect(router.navigate).toHaveBeenCalledWith(['/incidencias/nueva/confirmacion']);
  });
});
