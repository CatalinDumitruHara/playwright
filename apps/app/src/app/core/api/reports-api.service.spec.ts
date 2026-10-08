import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ENVIRONMENT_CONFIG } from '@mapfre-tech/ngx-multienvironment/core';
import { ExportJobStatus, MonthlyReportRequest } from '@api-types';
import { ReportsApiService } from './reports-api.service';

describe('ReportsApiService', () => {
  let service: ReportsApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ENVIRONMENT_CONFIG, useValue: { apiBaseUrl: '/api' } },
      ],
    });
    service = TestBed.inject(ReportsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('EP-021 createMonthlyExport: POST /api/reports/monthly-requests/export-jobs con {report_month, report_year}, devuelve ExportJobStatus', () => {
    const payload: MonthlyReportRequest = { report_month: 3, report_year: 2026 };
    const body: ExportJobStatus = {
      job_id: 'j1',
      status: 'PENDING',
      download_url: null,
    };
    let result: ExportJobStatus | undefined;

    service.createMonthlyExport(payload).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/reports/monthly-requests/export-jobs');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ report_month: 3, report_year: 2026 });
    expect(Object.keys(req.request.body).sort()).toEqual([
      'report_month',
      'report_year',
    ]);
    req.flush(body);

    expect(result).toEqual(body);
  });

  it('EP-022 getExportJob: GET /api/reports/export-jobs/j1, devuelve ExportJobStatus', () => {
    const body: ExportJobStatus = {
      job_id: 'j1',
      status: 'COMPLETED',
      download_url: 'https://files.test/j1.xlsx',
    };
    let result: ExportJobStatus | undefined;

    service.getExportJob('j1').subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/reports/export-jobs/j1');
    expect(req.request.method).toBe('GET');
    req.flush(body);

    expect(result).toEqual(body);
  });

  it('propaga el error HTTP al suscriptor (400 en createMonthlyExport)', () => {
    let status: number | undefined;
    let emitted = false;

    service
      .createMonthlyExport({ report_month: 13, report_year: 2026 })
      .subscribe({
        next: () => (emitted = true),
        error: (e: { status: number }) => (status = e.status),
      });

    httpMock
      .expectOne('/api/reports/monthly-requests/export-jobs')
      .flush({ message: 'bad month' }, { status: 400, statusText: 'Bad Request' });

    expect(emitted).toBe(false);
    expect(status).toBe(400);
  });
});
