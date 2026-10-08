import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ExportJobStatus, MonthlyReportRequest } from '@api-types';
import { ENVIRONMENT_CONFIG } from '@mapfre-tech/ngx-multienvironment/core';

@Injectable({
  providedIn: 'root',
})
export class ReportsApiService {
  private http = inject(HttpClient);
  private environment = inject(ENVIRONMENT_CONFIG);
  private apiBaseUrl = this.environment['apiBaseUrl'] as string;

  /** EP-021 POST /reports/monthly-requests/export-jobs */
  createMonthlyExport(body: MonthlyReportRequest): Observable<ExportJobStatus> {
    return this.http.post<ExportJobStatus>(
      `${this.apiBaseUrl}/reports/monthly-requests/export-jobs`,
      body
    );
  }

  /** EP-022 GET /reports/export-jobs/{jobId} */
  getExportJob(jobId: string): Observable<ExportJobStatus> {
    return this.http.get<ExportJobStatus>(
      `${this.apiBaseUrl}/reports/export-jobs/${encodeURIComponent(jobId)}`
    );
  }
}
