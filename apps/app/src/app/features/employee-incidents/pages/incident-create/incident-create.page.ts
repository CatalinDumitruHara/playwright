import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  B2bButtonComponent,
  B2bContainerComponent,
  B2bDropDownSelectComponent,
  B2bFileUploaderComponent,
  B2bGridLayoutComponent,
  B2bTextAreaComponent,
} from '@mapfre-tech/b2b-components';

import { IncidentsService } from '../../services/incidents.service';
import {
  IncidentCategory,
  IncidentCategoryList,
  IncidentCreateRequest,
  Room,
  RoomList,
} from '../../../../../libs/api-types/src/lib';

@Component({
  selector: 'app-incident-create',
  templateUrl: './incident-create.page.html',
  styleUrls: [],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    B2bButtonComponent,
    B2bContainerComponent,
    B2bDropDownSelectComponent,
    B2bFileUploaderComponent,
    B2bGridLayoutComponent,
    B2bTextAreaComponent,
    AsyncPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidentCreatePage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly incidentsService = inject(IncidentsService);

  incidentForm!: FormGroup;
  rooms$!: Observable<Room[]>;
  categories$!: Observable<IncidentCategory[]>;

  ngOnInit(): void {
    this.incidentForm = this.fb.group({
      roomId: ['', [Validators.required]],
      categoryCode: ['', [Validators.required]],
      description: ['', [Validators.required]],
      photo: [null],
    });

    this.loadDropdownData();
  }

  onSubmit(): void {
    if (this.incidentForm.valid) {
      const incidentData: IncidentCreateRequest = this.incidentForm.value;
      this.incidentsService
        .createIncident(incidentData)
        .subscribe(() => {
          this.router.navigate(['/incidencias/nueva/confirmacion']);
        });
    }
  }

  onCancel(): void {
    this.router.navigate(['/mis-incidencias']);
  }

  private loadDropdownData(): void {
    this.rooms$ = this.incidentsService
      .getRooms()
      .pipe(map((response: RoomList) => response.items));
    this.categories$ = this.incidentsService
      .getIncidentCategories()
      .pipe(map((response: IncidentCategoryList) => response.items));
  }
}
