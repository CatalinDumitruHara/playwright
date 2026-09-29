import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangePasswordForcedPage } from './change-password-forced.page';
import { ReactiveFormsModule } from '@angular/forms';
import {
  B2bButtonComponent,
  B2bInputComponent,
  B2bLabelComponent,
  B2bNotificationInlineComponent,
} from '@mapfre-tech/b2b-components';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ChangePasswordForcedPage', () => {
  let component: ChangePasswordForcedPage;
  let fixture: ComponentFixture<ChangePasswordForcedPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ChangePasswordForcedPage,
        ReactiveFormsModule,
        B2bInputComponent,
        B2bButtonComponent,
        B2bLabelComponent,
        B2bNotificationInlineComponent,
        NoopAnimationsModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChangePasswordForcedPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with empty values', () => {
    const form = component.form;
    expect(form.get('newPassword')?.value).toEqual('');
    expect(form.get('confirmPassword')?.value).toEqual('');
  });

  it('should be invalid when passwords do not match', () => {
    const form = component.form;
    form.get('newPassword')?.setValue('password123');
    form.get('confirmPassword')?.setValue('password456');
    expect(form.valid).toBeFalsy();
  });

  it('should be valid when passwords match', () => {
    const form = component.form;
    form.get('newPassword')?.setValue('password123');
    form.get('confirmPassword')?.setValue('password123');
    // We need to also satisfy the minLength validator
    form.get('newPassword')?.setValue('password12345');
    form.get('confirmPassword')?.setValue('password12345');
    expect(form.valid).toBeTruthy();
  });
});
