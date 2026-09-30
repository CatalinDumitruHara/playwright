import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { LoginPage } from './login.page';
import { AuthenticationService } from '../../../../core/auth/authentication.service';
import { of, throwError } from 'rxjs';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let authService: jest.Mocked<AuthenticationService>;

  beforeEach(async () => {
    const authServiceMock = {
      login: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, RouterTestingModule, LoginPage],
      providers: [{ provide: AuthenticationService, useValue: authServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthenticationService) as jest.Mocked<AuthenticationService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('form should be invalid when empty', () => {
    expect(component.loginForm.valid).toBeFalsy();
  });

  it('form should be valid when both fields are filled', () => {
    component.loginForm.controls['username'].setValue('test@test.com');
    component.loginForm.controls['password'].setValue('password');
    expect(component.loginForm.valid).toBeTruthy();
  });

  it('should call onSubmit method when form is submitted', () => {
    jest.spyOn(component, 'onSubmit');
    const form = fixture.nativeElement.querySelector('form');
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    expect(component.onSubmit).toHaveBeenCalled();
  });

  it('should call login on submit', () => {
    const form = fixture.nativeElement.querySelector('form');
    component.loginForm.controls['username'].setValue('test@test.com');
    component.loginForm.controls['password'].setValue('password');
    fixture.detectChanges();
    form.dispatchEvent(new Event('submit'));
    expect(authService.login).toHaveBeenCalledWith({
      username: 'test@test.com',
      password: 'password',
    });
  });

  it('should not call login on submit if form is invalid', () => {
    const button = fixture.nativeElement.querySelector('button');
    button.click();
    expect(authService.login).not.toHaveBeenCalled();
  });
});