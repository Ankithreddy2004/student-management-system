import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { Auth } from '../../services/auth';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css'
})
export class Signup {

  name = '';
  email = '';
  phone = '';
  course = '';
  password = '';
  confirmPassword = '';

  errorMessage = '';
  successMessage = '';

  isLoading = false;
  showPassword = false;

  constructor(
    private authService: Auth,
    private router: Router
  ) {}

  onSignup(): void {

    this.errorMessage = '';
    this.successMessage = '';

    // Validate required fields
    if (
      !this.name.trim() ||
      !this.email.trim() ||
      !this.phone.trim() ||
      !this.course.trim() ||
      !this.password ||
      !this.confirmPassword
    ) {
      this.errorMessage = 'Please fill in all fields.';
      return;
    }

    // Validate password
    if (this.password.length < 8) {
      this.errorMessage =
        'Password must contain at least 8 characters.';
      return;
    }

    // Confirm password
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    // Validate phone
    if (!/^\d{10}$/.test(this.phone.trim())) {
      this.errorMessage =
        'Please enter a valid 10-digit phone number.';
      return;
    }

    this.isLoading = true;

    // Send registration details to backend
    this.authService.signup({

      name: this.name.trim(),
      email: this.email.trim().toLowerCase(),
      phone: this.phone.trim(),
      course: this.course.trim(),
      password: this.password

    }).subscribe({

      next: (response) => {

        this.isLoading = false;

        if (response.success) {

          this.successMessage = response.message;

          // Clear form
          this.name = '';
          this.email = '';
          this.phone = '';
          this.course = '';
          this.password = '';
          this.confirmPassword = '';

          // Redirect to login
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 1500);

        } else {

          this.errorMessage = response.message;

        }

      },

      error: (error) => {

        this.isLoading = false;

        this.errorMessage =
          error.error?.message ||
          'Signup failed. Please try again.';

      }

    });

  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

}