import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginPage } from './login.page';
import { ReactiveFormsModule } from '@angular/forms';
import { B2bInputComponent, B2bButtonComponent, B2bLabelComponent } from '@mapfre-tech/b2b-components';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        LoginPage,
        ReactiveFormsModule,
        B2bInputComponent,
        B2bButtonComponent,
        B2bLabelComponent,
        NoopAnimationsModule
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with empty values', () => {
    const form = component.form;
    expect(form.get('username')?.value).toEqual('');
    expect(form.get('password')?.value).toEqual('');
  });
});
