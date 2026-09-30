
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { IncidentDetailPage } from './incident-detail.page';
import { IncidentService } from '../../services/incident.service';
import { CommonModule } from '@angular/common';
import { Component, Directive, Input } from '@angular/core';
import { By } from '@angular/platform-browser';

@Component({
  selector: 'b2b-read-data',
  template: '<p><ng-content></ng-content></p>',
  standalone: true,
})
class MockReadDataComponent {
  @Input() label: string = '';
}

@Component({
  selector: 'b2b-spinner',
  template: '<div></div>',
  standalone: true,
})
class MockSpinnerComponent {}

@Directive({
  selector: '[b2b-card-primary]',
  standalone: true,
})
class MockCardPrimaryDirective {}

describe('IncidentDetailPage', () => {
  let component: IncidentDetailPage;
  let fixture: ComponentFixture<IncidentDetailPage>;
  let incidentService: any;
  let activatedRoute: any;

  const mockIncident = {
    id: '1',
    category: 'Test',
    creationDate: new Date(),
    status: 'Open',
    description: 'Test incident',
  };
  const mockHistory = [{ timestamp: new Date(), description: 'History item' }];
  const mockPhoto = { url: 'http://example.com/photo.jpg' };

  beforeEach(async () => {
    incidentService = {
      getIncidentDetail: jest.fn().mockReturnValue(of(mockIncident)),
      getIncidentHistory: jest.fn().mockReturnValue(of(mockHistory)),
      getIncidentPhoto: jest.fn().mockReturnValue(of(mockPhoto)),
    };

    activatedRoute = {
      paramMap: of({
        get: jest.fn().mockReturnValue('1'),
      }),
    };

    await TestBed.configureTestingModule({
      imports: [CommonModule, IncidentDetailPage],
      providers: [
        { provide: IncidentService, useValue: incidentService },
        { provide: ActivatedRoute, useValue: activatedRoute },
      ],
    })
      .overrideComponent(IncidentDetailPage, {
        set: {
          imports: [
            CommonModule,
            MockReadDataComponent,
            MockSpinnerComponent,
            MockCardPrimaryDirective,
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(IncidentDetailPage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should get incidentId from route and show loading state initially', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    expect(activatedRoute.paramMap.source.value.get).toHaveBeenCalledWith(
      'incidentId'
    );
    expect(component.loading()).toBe(false);
  }));

  it('should call incident service methods with the correct incidentId', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    expect(incidentService.getIncidentDetail).toHaveBeenCalledWith('1');
    expect(incidentService.getIncidentHistory).toHaveBeenCalledWith('1');
    expect(incidentService.getIncidentPhoto).toHaveBeenCalledWith('1');
  }));

  it('should set incident data, history, and photo on successful load', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    expect(component.incident()).toEqual(mockIncident);
    expect(component.history()).toEqual(mockHistory);
    expect(component.photo()).toEqual(mockPhoto);
    expect(component.error()).toBe(false);
  }));

  it('should show error state when incident service fails', fakeAsync(() => {
    incidentService.getIncidentDetail.mockReturnValue(
      throwError(() => new Error('Failed to load'))
    );
    fixture.detectChanges();
    tick();
    expect(component.error()).toBe(true);
    expect(component.loading()).toBe(false);
  }));

  it('should show error state if incidentId is not present in route', fakeAsync(() => {
    activatedRoute.paramMap = of({
      get: jest.fn().mockReturnValue(null),
    });
    fixture.detectChanges();
    tick();
    expect(component.error()).toBe(true);
    expect(component.loading()).toBe(false);
  }));

  it('should display incident data after loading', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    const incidentCategory = fixture.debugElement.query(
      By.css('[data-testid="incident-category"]')
    );
    expect(incidentCategory).toBeTruthy();
  }));

  it('should display error message on failure', fakeAsync(() => {
    incidentService.getIncidentDetail.mockReturnValue(
      throwError(() => new Error('Failed to load'))
    );
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    const errorContainer = fixture.debugElement.query(
      By.css('[data-testid="error-container"]')
    );
    expect(errorContainer).toBeTruthy();
  }));
});
