
import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { IncidentCreatePage } from './incident-create.page';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { IncidentsService } from '../../services/incidents.service';

describe('IncidentCreatePage', () => {
  let spectator: Spectator<IncidentCreatePage>;
  const createComponent = createComponentFactory({
    component: IncidentCreatePage,
    imports: [ReactiveFormsModule, IonicModule.forRoot()],
    mocks: [IncidentsService],
  });

  beforeEach(() => (spectator = createComponent()));

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  it('should have a form with the required controls', () => {
    const form = spectator.component.form;
    expect(form.get('title')).toBeTruthy();
    expect(form.get('description')).toBeTruthy();
  });
});
