import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { Auth } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatIconModule
  ],

  templateUrl: './login.html',
  styleUrl: './login.css'
})

export class Login {

  email = '';
  password = '';

  errorMessage = '';

  isLoading = false;

  showPassword = false;

  constructor(
    private authService: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }


  // ==================================
  // LOGIN FUNCTIONALITY
  // ==================================

  onLogin(loginForm: NgForm): void {

    if (this.isLoading) {
      return;
    }

    this.errorMessage = '';

    if (loginForm.invalid) {

      loginForm.control.markAllAsTouched();

      this.errorMessage = 'Please enter a valid email and password.';

      this.cdr.detectChanges();

      return;
    }

    this.email = this.email.trim();

    this.isLoading = true;

    this.cdr.detectChanges();


    this.authService.login({

      email: this.email,
      password: this.password

    }).subscribe({

      next: (response) => {

        this.isLoading = false;

        if (response.success && response.user) {

          this.errorMessage = '';

          this.cdr.detectChanges();

          switch (response.user.role) {

            case 'Admin':
              this.router.navigate(['/admin-dashboard']);
              break;

            case 'Teacher':
              this.router.navigate(['/teacher-dashboard']);
              break;

            case 'Student':
              this.router.navigate(['/student-dashboard']);
              break;

            default:

              this.authService.logout();

              this.errorMessage = 'Invalid user role.';

              this.cdr.detectChanges();

              break;
          }

        } else {

          this.errorMessage =
            'Incorrect email or password. Please try again.';

          this.cdr.detectChanges();

        }

      },


      error: (error) => {

        this.isLoading = false;

        if (
          error.status === 400 ||
          error.status === 401
        ) {

          this.errorMessage =
            'Incorrect email or password. Please try again.';

        }

        else if (error.status === 0 || error.status >= 500) {

          this.errorMessage =
            'Unable to connect to the server. Please try again later.';

        }

        else {

          this.errorMessage =
            error.error?.message || 'Login failed. Please try again.';

        }

        // IMPORTANT: Immediately refresh Angular UI
        this.cdr.detectChanges();

      }

    });

  }


  // ==================================
  // SHOW / HIDE PASSWORD
  // ==================================

  togglePassword(): void {

    this.showPassword = !this.showPassword;

  }


  // ==================================
  // CLEAR ERROR WHEN TYPING
  // ==================================

  clearError(): void {

    this.errorMessage = '';

  }

}