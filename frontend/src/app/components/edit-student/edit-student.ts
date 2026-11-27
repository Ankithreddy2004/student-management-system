import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';

import { Student } from '../../services/student';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-edit-student',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './edit-student.html',
  styleUrl: './edit-student.css',
})
export class EditStudent implements OnInit {

  studentForm: FormGroup;

  readonly semesters = [1, 2, 3, 4, 5, 6, 7, 8];

  studentId!: number;

  studentLoaded = false;

  isLoading = false;
  isSubmitting = false;

  successMessage = '';
  errorMessage = '';

  userRole = '';

  constructor(
    private fb: FormBuilder,
    private studentService: Student,
    private authService: Auth,
    private route: ActivatedRoute,
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
  // INITIALIZE COMPONENT
  // ==========================================

  ngOnInit(): void {

    this.userRole =
      this.authService.getRole() || '';


    // Only Admin and Teacher can edit students

    if (!['Admin', 'Teacher'].includes(this.userRole)) {

      this.errorMessage = 'Access denied.';

      return;

    }


    // Teachers cannot change academic information

    if (this.userRole === 'Teacher') {

      this.studentForm.get('course')?.disable();

      this.studentForm.get('semester')?.disable();

    }


    // Retrieve student ID from route

    this.studentId = Number(
      this.route.snapshot.paramMap.get('id')
    );

    if (
      !Number.isInteger(this.studentId) ||
      this.studentId <= 0
    ) {

      this.errorMessage = 'Invalid student ID.';

      return;

    }

    this.getStudent();

  }


  // ==========================================
  // GET STUDENT BY ID
  // ==========================================

  getStudent(): void {

    this.isLoading = true;

    this.studentLoaded = false;

    this.errorMessage = '';

    this.studentService
      .getStudentById(this.studentId)
      .subscribe({

        next: (response) => {

          const student = response.data;

          if (!student) {

            this.errorMessage = 'Student not found.';

            this.isLoading = false;

            this.cdr.detectChanges();

            return;

          }


          // Populate student information

          this.studentForm.patchValue({

            ...student,

            semester:
              student.semester === null ||
              student.semester === undefined

                ? null

                : Number(student.semester)

          });


          this.studentLoaded = true;

          this.isLoading = false;

          this.cdr.detectChanges();

        },

        error: (error) => {

          console.error(
            'Fetch Student Error:',
            error
          );

          this.errorMessage =
            error.error?.message ||
            'Unable to fetch student.';

          this.isLoading = false;

          this.studentLoaded = false;

          this.cdr.detectChanges();

        }

      });

  }


  // ==========================================
  // CANCEL EDIT
  // ==========================================

  cancelEdit(): void {

    const role = this.authService.getRole();

    if (role === 'Admin') {

      this.router.navigate(['/admin/students']);

    }

    else if (role === 'Teacher') {

      this.router.navigate(['/teacher/students']);

    }

    else {

      this.router.navigate(['/login']);

    }

  }


  // ==========================================
  // UPDATE STUDENT
  // ==========================================

  updateStudent(): void {

    if (
      this.isSubmitting ||
      !this.studentLoaded
    ) {

      return;

    }

    this.errorMessage = '';

    this.successMessage = '';

    if (this.studentForm.invalid) {

      this.studentForm.markAllAsTouched();

      return;

    }

    this.isSubmitting = true;


    // Admin payload:
    // name, email, phone, course, semester
    //
    // Teacher payload:
    // name, email, phone
    //
    // Angular excludes disabled form controls.

    const payload = this.studentForm.value;


    this.studentService.updateStudent(
      this.studentId,
      payload
    ).subscribe({

      next: (response) => {

        if (response.success === false) {

          this.errorMessage =
            response.message ||
            'Unable to update student.';

          this.isSubmitting = false;

          this.cdr.detectChanges();

          return;

        }

        console.log('Student Updated:', response);

        this.successMessage =
          response.message ||
          'Student updated successfully!';

        this.cdr.detectChanges();

        setTimeout(() => {

          this.cancelEdit();

        }, 1500);

      },

      error: (error) => {

        console.error(
          'Update Student Error:',
          error
        );

        this.errorMessage =
          error.error?.message ||
          'Unable to update student.';

        this.isSubmitting = false;

        this.cdr.detectChanges();

      }

    });

  }

}