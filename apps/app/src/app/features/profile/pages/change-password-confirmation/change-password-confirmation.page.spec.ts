import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangePasswordConfirmationPage } from './change-password-confirmation.page';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

describe('ChangePasswordConfirmationPage', () => {
  let component: ChangePasswordConfirmationPage;
  let fixture: ComponentFixture<ChangePasswordConfirmationPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ChangePasswordConfirmationPage,
        NoopAnimationsModule,
        RouterTestingModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChangePasswordConfirmationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
