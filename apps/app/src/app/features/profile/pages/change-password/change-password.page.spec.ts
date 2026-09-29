import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangePasswordPage } from './change-password.page';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';

describe('ChangePasswordPage', () => {
  let component: ChangePasswordPage;
  let fixture: ComponentFixture<ChangePasswordPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ChangePasswordPage,
        NoopAnimationsModule,
        RouterTestingModule,
        ReactiveFormsModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChangePasswordPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
