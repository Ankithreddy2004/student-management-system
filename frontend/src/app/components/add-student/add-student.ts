import {
  Component,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';

import { Router, RouterLink } from '@angular/router';

import { Student } from '../../services/student';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-add-student',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './add-student.html',
  styleUrl: './add-student.css',
})
export class AddStudent {

  studentForm: FormGroup;

  readonly semesters = [1, 2, 3, 4, 5, 6, 7, 8];

  isSubmitting = false;

  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private studentService: Student,
    private authService: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {

    this.studentForm = this.fb.group({

      name: ['', [
        Validators.required,
        Validators.maxLength(100)
      ]],

      email: ['', [
        Validators.required,
        Validators.email,
        Validators.maxLength(150)
      ]],

      phone: ['', [
        Validators.required,
        Validators.pattern(/^[0-9]{10}$/)
      ]],

      course: ['', [
        Validators.required,
        Validators.maxLength(100)
      ]],

      semester: [null, [
        Validators.required,
        Validators.min(1),
        Validators.max(8),
        Validators.pattern(/^[1-8]$/)
      ]]

    });

  }


  // ==========================================
  // ROLE-BASED STUDENT LIST ROUTE
  // ==========================================

  get studentListRoute(): string {

    const role = this.authService.getRole();

    if (role === 'Admin') {

      return '/admin/students';

    }

    if (role === 'Teacher') {

      return '/teacher/students';

    }

    return '/login';

  }


  // ==========================================
  // ADD STUDENT
  // ==========================================

  addStudent(): void {

    if (this.isSubmitting) {

      return;

    }

    this.successMessage = '';
    this.errorMessage = '';

    if (this.studentForm.invalid) {

      this.studentForm.markAllAsTouched();

      return;

    }

    this.isSubmitting = true;

    this.studentService
      .addStudent(this.studentForm.value)
      .subscribe({

        next: (response) => {

          if (response.success === false) {

            this.errorMessage =
              response.message || 'Unable to add student.';

            this.isSubmitting = false;

            this.cdr.detectChanges();

            return;

          }

          this.successMessage =
            response.message || 'Student added successfully!';

          console.log('Student Added:', response);

          this.cdr.detectChanges();

          setTimeout(() => {

            this.router.navigate([
              this.studentListRoute
            ]);

          }, 1500);

        },

        error: (error) => {

          console.error(
            'Add Student Error:',
            error
          );

          this.errorMessage =
            error.error?.message ||
            'Unable to add student.';

          this.isSubmitting = false;

          this.cdr.detectChanges();

        }

      });

  }

}