
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { IncidentDetailPage } from './incident-detail.page';
import { IncidentService } from '../../services/incident.service';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy } from '@angular/core';

describe('IncidentDetailPage', () => {
  let component: IncidentDetailPage;
  let fixture: ComponentFixture<IncidentDetailPage>;
  let incidentService: jest.Mocked<IncidentService>;
  let activatedRoute: any;

  const mockIncident = { id: '1', description: 'Test Incident' };
  const mockHistory = [{ id: 'h1', status: 'Pending' }];
  const mockPhoto = { id: 'p1', url: 'http://example.com/photo.jpg' };
  const incidentId = '123';

  beforeEach(async () => {
    const incidentServiceMock = {
      getIncidentDetail: jest.fn(),
      getIncidentHistory: jest.fn(),
      getIncidentPhoto: jest.fn(),
    };

    const activatedRouteMock = {
      paramMap: of({
        get: jest.fn().mockReturnValue(incidentId),
      }),
    };

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        IncidentDetailPage,
      ],
      providers: [
        { provide: IncidentService, useValue: incidentServiceMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
      ],
    })
    .overrideComponent(IncidentDetailPage, {
      set: {
        changeDetection: ChangeDetectionStrategy.Default
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(IncidentDetailPage);
    component = fixture.componentInstance;
    incidentService = TestBed.inject(IncidentService) as jest.Mocked<IncidentService>;
    activatedRoute = TestBed.inject(ActivatedRoute);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get incidentId from route and show loading state initially', fakeAsync(() => {
    incidentService.getIncidentDetail.mockReturnValue(of(mockIncident));
    incidentService.getIncidentHistory.mockReturnValue(of(mockHistory));
    incidentService.getIncidentPhoto.mockReturnValue(of(mockPhoto));

    fixture.detectChanges(); // Trigger effect
    tick(); // Allow async operations to complete

    expect(activatedRoute.paramMap.source.value.get).toHaveBeenCalledWith('incidentId');
    expect(component.loading()).toBe(true);
  }));

  it('should call incident service methods with the correct incidentId', fakeAsync(() => {
    incidentService.getIncidentDetail.mockReturnValue(of(mockIncident));
    incidentService.getIncidentHistory.mockReturnValue(of(mockHistory));
    incidentService.getIncidentPhoto.mockReturnValue(of(mockPhoto));

    fixture.detectChanges();
    tick();

    expect(incidentService.getIncidentDetail).toHaveBeenCalledWith(incidentId);
    expect(incidentService.getIncidentHistory).toHaveBeenCalledWith(incidentId);
    expect(incidentService.getIncidentPhoto).toHaveBeenCalledWith(incidentId);
  }));

  it('should display incident data, history, and photo on successful load', fakeAsync(() => {
    incidentService.getIncidentDetail.mockReturnValue(of(mockIncident));
    incidentService.getIncidentHistory.mockReturnValue(of(mockHistory));
    incidentService.getIncidentPhoto.mockReturnValue(of(mockPhoto));

    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(component.incident()).toEqual(mockIncident);
    expect(component.history()).toEqual(mockHistory);
    expect(component.photo()).toEqual(mockPhoto);
    expect(component.loading()).toBe(false);
    expect(component.error()).toBe(false);
  }));

  it('should show error state when incident service fails', fakeAsync(() => {
    const errorResponse = new Error('Service failure');
    incidentService.getIncidentDetail.mockReturnValue(throwError(() => errorResponse));
    incidentService.getIncidentHistory.mockReturnValue(of(mockHistory));
    incidentService.getIncidentPhoto.mockReturnValue(of(mockPhoto));


    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(component.error()).toBe(true);
    expect(component.loading()).toBe(false);
    expect(component.incident()).toBeNull();
    expect(component.history()).toEqual([]);
    expect(component.photo()).toBeNull();
  }));

  it('should show error state if incidentId is not present in route', fakeAsync(() => {
    activatedRoute.paramMap = of({
      get: jest.fn().mockReturnValue(null),
    });

    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(component.error()).toBe(true);
    expect(component.loading()).toBe(false);
  }));
});
