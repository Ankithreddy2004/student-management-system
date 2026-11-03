import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';

import { Auth } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
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
    private router: Router
  ) { }

  // Login functionality
  onLogin(): void {

    this.errorMessage = '';

    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter email and password.';
      return;
    }

    this.isLoading = true;

    this.authService.login({
      email: this.email,
      password: this.password
    }).subscribe({

      next: (response) => {

        this.isLoading = false;

        if (response.success && response.user) {

          // Redirect according to user role
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
          }

        } else {
          this.errorMessage = response.message;
        }

      },

      error: (error) => {

        this.isLoading = false;

        this.errorMessage =
          error.error?.message || 'Login failed. Please try again.';

      }

    });

  }

  // Show or hide password
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

}