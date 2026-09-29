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

  it('should call login on submit', () => {
    const button = fixture.nativeElement.querySelector('button');
    component.loginForm.controls['username'].setValue('test@test.com');
    component.loginForm.controls['password'].setValue('password');
    fixture.detectChanges();
    button.click();
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