import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthenticationService } from '../../../../core/auth/authentication.service';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login-page',
  templateUrl: './login.page.html',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // TODO: Add B2B components once they are available
    // B2bInputComponent,
    // B2bButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  loginForm: FormGroup;
  authError = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthenticationService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.authService.login(this.loginForm.value).subscribe({
        next: () => {
          this.router.navigate(['/inicio']);
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 423) {
            this.router.navigate(['/acceso/cuenta-bloqueada']);
          } else {
            this.authError = true;
          }
        },
      });
    }
  }
}
