import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { Auth } from '../../services/auth';

import {
  Subscription,
  timer,
  of
} from 'rxjs';

import {
  switchMap,
  catchError
} from 'rxjs/operators';

type EmailStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css'
})
export class Signup implements OnDestroy {

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

  emailStatus: EmailStatus = 'idle';
  emailStatusMessage = '';

  private emailCheckSubscription?: Subscription;

  constructor(
    private authService: Auth,
    private router: Router
  ) {}

  // ==========================================
  // EMAIL VALIDATION
  // ==========================================

  onEmailChange(value: string): void {

    this.email = value;

    this.emailCheckSubscription?.unsubscribe();

    this.emailStatus = 'idle';
    this.emailStatusMessage = '';

    this.errorMessage = '';

    const cleanEmail = value.trim().toLowerCase();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (!cleanEmail || !emailPattern.test(cleanEmail)) {
      return;
    }

    this.emailStatus = 'checking';
    this.emailStatusMessage = 'Checking email availability...';

    this.emailCheckSubscription = timer(500).pipe(

      switchMap(() =>
        this.authService.checkEmailAvailability(cleanEmail)
      ),

      catchError(() =>
        of({
          success: false,
          available: false,
          message: 'Unable to verify email. Please try again.'
        })
      )

    ).subscribe(response => {

      // Ignore outdated results if the email changed.
      if (this.email.trim().toLowerCase() !== cleanEmail) {
        return;
      }

      if (!response.success) {

        this.emailStatus = 'error';

        this.emailStatusMessage =
          response.message || 'Unable to verify email.';

      } else if (response.available) {

        this.emailStatus = 'available';

        this.emailStatusMessage = 'Email is available.';

      } else {

        this.emailStatus = 'taken';

        this.emailStatusMessage =
          'Email already registered. Please use another email.';

      }

    });

  }

  // ==========================================
  // PHONE VALIDATION
  // ==========================================

  onPhoneInput(event: Event): void {

    const input = event.target as HTMLInputElement;

    // Allow only digits and maximum 10 characters.
    const cleanPhone = input.value
      .replace(/\D/g, '')
      .slice(0, 10);

    input.value = cleanPhone;

    this.phone = cleanPhone;

  }

  // ==========================================
  // PASSWORD VALIDATION
  // ==========================================

  isPasswordValid(): boolean {

    const passwordPattern =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

    return passwordPattern.test(this.password);

  }

  passwordsMatch(): boolean {

    return (
      this.password.length > 0 &&
      this.password === this.confirmPassword
    );

  }

  // ==========================================
  // SIGNUP
  // ==========================================

  onSignup(): void {

    this.errorMessage = '';
    this.successMessage = '';

    // Required fields
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

    // Email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (!emailPattern.test(this.email.trim())) {

      this.errorMessage = 'Please enter a valid email address.';
      return;

    }

    // Email availability
    if (this.emailStatus !== 'available') {

      if (this.emailStatus === 'taken') {

        this.errorMessage =
          'This email is already registered. Please use another email.';

      } else {

        this.errorMessage =
          'Please wait until email verification is completed.';

      }

      return;

    }

    // Phone
    if (!/^\d{10}$/.test(this.phone)) {

      this.errorMessage =
        'Phone number must contain exactly 10 digits.';

      return;

    }

    // Password
    if (!this.isPasswordValid()) {

      this.errorMessage =
        'Password must contain at least 8 characters, including uppercase, lowercase, number and special character.';

      return;

    }

    // Confirm password
    if (!this.passwordsMatch()) {

      this.errorMessage = 'Passwords do not match.';
      return;

    }

    this.isLoading = true;

    this.authService.signup({

      name: this.name.trim(),

      email: this.email.trim().toLowerCase(),

      phone: this.phone,

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

          this.emailStatus = 'idle';
          this.emailStatusMessage = '';

          setTimeout(() => {

            this.router.navigate(['/login']);

          }, 2000);

        } else {

          this.errorMessage = response.message;

        }

      },

      error: (error) => {

        this.isLoading = false;

        this.errorMessage =
          error.error?.message ||
          'Signup failed. Please try again.';

        // Handle duplicate email response.
        if (error.status === 409) {

          this.emailStatus = 'taken';

          this.emailStatusMessage =
            'Email already registered. Please use another email.';

        }

      }

    });

  }

  // ==========================================
  // SHOW PASSWORD
  // ==========================================

  togglePassword(): void {

    this.showPassword = !this.showPassword;

  }

  // ==========================================
  // CLEANUP
  // ==========================================

  ngOnDestroy(): void {

    this.emailCheckSubscription?.unsubscribe();

  }

}