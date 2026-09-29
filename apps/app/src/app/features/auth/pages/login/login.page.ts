import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  B2bButtonComponent,
  B2bInputComponent,
  B2bLabelComponent,
  B2bNotificationInlineComponent,
  B2bPasswordFieldComponent,
} from '@mapfre-tech/b2b-components';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../../../core/auth/authentication.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    B2bInputComponent,
    B2bButtonComponent,
    B2bLabelComponent,
    B2bPasswordFieldComponent,
    B2bNotificationInlineComponent,
  ],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthenticationService);

  loginForm: FormGroup = this.fb.group({
    username: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  errorMessage: string | null = null;

  login() {
    if (this.loginForm.valid) {
      this.errorMessage = null;
      const { username, password } = this.loginForm.getRawValue();
      if (username && password) {
        this.authService.login({ username, password }).subscribe({
          next: () => this.router.navigate(['/inicio']),
          error: () => {
            this.errorMessage = 'Usuario o contraseña incorrectos.';
          },
        });
      }
    }
  }
}
