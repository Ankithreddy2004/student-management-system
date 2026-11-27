import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import {
  Router,
  RouterLink
} from '@angular/router';

import {
  Auth,
  AcademicOption
} from '../../services/auth';

import {
  Subscription,
  timer,
  of
} from 'rxjs';

import {
  switchMap,
  catchError
} from 'rxjs/operators';


type EmailStatus =
  'idle' |
  'checking' |
  'available' |
  'taken' |
  'error';


@Component({

  selector: 'app-signup',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],

  templateUrl: './signup.html',

  styleUrl: './signup.css'

})

export class Signup implements OnInit, OnDestroy {

  name = '';
  email = '';
  phone = '';
  course = '';

  semester: number | null = null;

  password = '';
  confirmPassword = '';

  errorMessage = '';
  successMessage = '';

  isLoading = false;
  showPassword = false;

  loadingOptions = false;

  academicOptions: AcademicOption[] = [];

  emailStatus: EmailStatus = 'idle';

  emailStatusMessage = '';

  private emailCheckSubscription?: Subscription;

  private academicSubscription?: Subscription;

  private signupSubscription?: Subscription;

  private redirectTimer?: ReturnType<typeof setTimeout>;


  constructor(

    private authService: Auth,

    private router: Router,

    private cdr: ChangeDetectorRef

  ) {}


// ==========================================
// INITIALIZE SIGNUP PAGE
// ==========================================

  ngOnInit(): void {

    this.loadAcademicOptions();

  }


// ==========================================
// LOAD COURSES AND SEMESTERS FROM DATABASE
// ==========================================

  loadAcademicOptions(): void {

    this.loadingOptions = true;

    this.errorMessage = '';

    this.academicSubscription?.unsubscribe();

    this.academicSubscription =
      this.authService.getAcademicOptions().subscribe({

        next: (response) => {

          this.loadingOptions = false;

          if (!response.success) {

            this.academicOptions = [];

            this.errorMessage =
              'Unable to load academic options.';

            this.cdr.markForCheck();

            return;

          }

          // Accept semesters 1 to 8 only

          this.academicOptions = (response.data || [])

            .map(option => ({

              course: option.course,

              semester: Number(option.semester)

            }))

            .filter(option =>

              Number.isInteger(option.semester) &&

              option.semester >= 1 &&

              option.semester <= 8

            );

          if (this.academicOptions.length === 0) {

            this.errorMessage =
              'No courses are available. Please contact the administrator.';

          }

          this.cdr.markForCheck();

        },

        error: (error) => {

          this.loadingOptions = false;

          this.academicOptions = [];

          this.errorMessage =

            error.error?.message ||

            'Unable to load courses and semesters.';

          this.cdr.markForCheck();

        }

      });

  }


// ==========================================
// GET UNIQUE COURSES
// ==========================================

  get courses(): string[] {

    return [

      ...new Set(

        this.academicOptions.map(

          option => option.course

        )

      )

    ].sort();

  }


// ==========================================
// GET SEMESTERS FOR SELECTED COURSE
// ==========================================

  // ==========================================
// GET ALL SEMESTERS (1–8)
// ==========================================

get semesters(): number[] {

  return [1, 2, 3, 4, 5, 6, 7, 8];

}
// ==========================================
// COURSE CHANGE
// ==========================================

  onCourseChange(course: string): void {

    this.course = course;

    // Reset previous semester selection

    this.semester = null;

    this.errorMessage = '';

  }


// ==========================================
// EMAIL VALIDATION
// ==========================================

  onEmailChange(value: string): void {

    this.email = value;

    this.emailCheckSubscription?.unsubscribe();

    this.emailStatus = 'idle';

    this.emailStatusMessage = '';

    this.errorMessage = '';

    const cleanEmail =
      value.trim().toLowerCase();

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (
      !cleanEmail ||
      cleanEmail.length > 150 ||
      !emailPattern.test(cleanEmail)
    ) {

      return;

    }

    this.emailStatus = 'checking';

    this.emailStatusMessage =
      'Checking email availability...';

    this.emailCheckSubscription = timer(500).pipe(

      switchMap(() =>

        this.authService.checkEmailAvailability(
          cleanEmail
        )

      ),

      catchError(() =>

        of({

          success: false,

          available: false,

          message:
            'Unable to verify email. Please try again.'

        })

      )

    ).subscribe(response => {

      // Ignore outdated results

      if (
        this.email.trim().toLowerCase()
        !== cleanEmail
      ) {

        return;

      }

      if (!response.success) {

        this.emailStatus = 'error';

        this.emailStatusMessage =
          response.message ||
          'Unable to verify email.';

      } else if (response.available) {

        this.emailStatus = 'available';

        this.emailStatusMessage =
          'Email is available.';

      } else {

        this.emailStatus = 'taken';

        this.emailStatusMessage =
          'Email already registered. Please use another email.';

      }

      this.cdr.markForCheck();

    });

  }


// ==========================================
// PHONE VALIDATION
// ==========================================

  onPhoneInput(event: Event): void {

    const input =
      event.target as HTMLInputElement;

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

    return (

      passwordPattern.test(this.password) &&

      new TextEncoder().encode(this.password).length <= 72

    );

  }


// ==========================================
// CONFIRM PASSWORD VALIDATION
// ==========================================

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

    if (this.isLoading || this.loadingOptions) {

      return;

    }

    this.errorMessage = '';

    this.successMessage = '';


    // 1. Validate required fields

    if (

      !this.name.trim() ||

      !this.email.trim() ||

      !this.phone.trim() ||

      !this.course.trim() ||

      this.semester === null ||

      !this.password ||

      !this.confirmPassword

    ) {

      this.errorMessage =
        'Please fill in all fields.';

      return;

    }


    // 2. Validate input lengths

    if (

      this.name.trim().length > 100 ||

      this.email.trim().length > 150 ||

      this.course.trim().length > 100

    ) {

      this.errorMessage =
        'Name, email or course exceeds the allowed length.';

      return;

    }


    // 3. Validate email format

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (!emailPattern.test(this.email.trim())) {

      this.errorMessage =
        'Please enter a valid email address.';

      return;

    }


    // 4. Validate email availability

    if (this.emailStatus !== 'available') {

      if (this.emailStatus === 'taken') {

        this.errorMessage =
          'This email is already registered.';

      } else {

        this.errorMessage =
          'Please complete email verification.';

      }

      return;

    }


    // 5. Validate phone

    if (!/^\d{10}$/.test(this.phone)) {

      this.errorMessage =
        'Phone number must contain exactly 10 digits.';

      return;

    }


    // 6. Validate course

    if (!this.courses.includes(this.course)) {

      this.errorMessage =
        'Please select a valid course.';

      return;

    }


    // 7. Validate semester: 1 to 8 only

    if (

      !Number.isInteger(this.semester) ||

      this.semester < 1 ||

      this.semester > 8

    ) {

      this.errorMessage =
        'Semester must be between 1 and 8.';

      return;

    }


    // 8. Validate course and semester combination

    if (!this.semesters.includes(this.semester)) {

      this.errorMessage =
        'The selected semester is not available for this course.';

      return;

    }


    // 9. Validate password

    if (!this.isPasswordValid()) {

      this.errorMessage =
        'Password must contain at least 8 characters, including uppercase, lowercase, number and special character, and must not exceed 72 bytes.';

      return;

    }


    // 10. Validate confirm password

    if (!this.passwordsMatch()) {

      this.errorMessage =
        'Passwords do not match.';

      return;

    }


    // 11. Send signup request

    this.isLoading = true;

    this.signupSubscription =
      this.authService.signup({

        name: this.name.trim(),

        email: this.email.trim().toLowerCase(),

        phone: this.phone,

        course: this.course,

        semester: this.semester,

        password: this.password

      }).subscribe({

        next: (response) => {

          this.isLoading = false;

          if (response.success) {

            this.successMessage =
              response.message;


            // Clear form

            this.name = '';

            this.email = '';

            this.phone = '';

            this.course = '';

            this.semester = null;

            this.password = '';

            this.confirmPassword = '';

            this.emailStatus = 'idle';

            this.emailStatusMessage = '';


            // Redirect to login page

            this.redirectTimer = setTimeout(() => {

              this.router.navigate(['/login']);

            }, 2000);

          } else {

            this.errorMessage =
              response.message;

          }

          this.cdr.markForCheck();

        },

        error: (error) => {

          this.isLoading = false;

          this.errorMessage =

            error.error?.message ||

            'Signup failed. Please try again.';


          // Handle duplicate email

          if (error.status === 409) {

            this.emailStatus = 'taken';

            this.emailStatusMessage =
              'Email already registered. Please use another email.';

          }

          this.cdr.markForCheck();

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

    this.academicSubscription?.unsubscribe();

    this.signupSubscription?.unsubscribe();

    if (this.redirectTimer) {

      clearTimeout(this.redirectTimer);

    }

  }

}