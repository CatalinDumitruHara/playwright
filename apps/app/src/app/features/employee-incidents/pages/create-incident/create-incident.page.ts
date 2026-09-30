import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IncidentService } from '../../services/incident.service';
import { Room } from '../../models/room.model';
import { IncidentCategory } from '../../models/incident-category.model';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import {
  B2bDropDownSelectComponent,
  B2bTextAreaComponent,
  B2bFileUploaderComponent,
  B2bButtonComponent,
} from '@mapfre-tech/b2b-components';

@Component({
  selector: 'app-create-incident-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    B2bDropDownSelectComponent,
    B2bTextAreaComponent,
    B2bFileUploaderComponent,
    B2bButtonComponent,
  ],
  templateUrl: './create-incident.page.html',
})
export class CreateIncidentPage implements OnInit {
  incidentForm!: FormGroup;
  rooms$!: Observable<Room[]>;
  categories$!: Observable<IncidentCategory[]>;

  constructor(
    private fb: FormBuilder,
    private incidentService: IncidentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.incidentForm = this.fb.group({
      roomId: ['', Validators.required],
      categoryCode: ['', Validators.required],
      description: ['', Validators.required],
      photo: [null],
    });

    this.rooms$ = this.incidentService.getRooms();
    this.categories$ = this.incidentService.getIncidentCategories();
  }

  onSubmit(): void {
    if (this.incidentForm.valid) {
      this.incidentService
        .createIncident(this.incidentForm.value)
        .subscribe(() => {
          this.router.navigate(['/incidencias/nueva/confirmacion']);
        });
    }
  }
}
