import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Student } from '../../services/student';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-edit-student',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-student.html',
  styleUrl: './edit-student.css',
})
export class EditStudent implements OnInit {

  studentForm: FormGroup;

  studentId!: number;

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

      name: ['', Validators.required],

      email: ['', [
        Validators.required,
        Validators.email
      ]],

      phone: ['', [
        Validators.required,
        Validators.pattern(/^[0-9]{10}$/)
      ]],

      course: ['', Validators.required]

    });

  }

  ngOnInit(): void {

    this.userRole = this.authService.getRole() || '';

    this.studentId = Number(
      this.route.snapshot.paramMap.get('id')
    );

    if (!Number.isInteger(this.studentId) || this.studentId <= 0) {

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
    this.errorMessage = '';

    this.studentService.getStudentById(this.studentId).subscribe({

      next: (response) => {

        this.studentForm.patchValue(response.data);

        this.isLoading = false;

        this.cdr.detectChanges();

      },

      error: (error) => {

        console.error('Fetch Student Error:', error);

        this.errorMessage =
          error.error?.message || 'Unable to fetch student.';

        this.isLoading = false;

        this.cdr.detectChanges();

      }

    });

  }
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

    if (this.studentForm.invalid) {

      this.studentForm.markAllAsTouched();

      return;

    }

    this.isSubmitting = true;

    this.errorMessage = '';
    this.successMessage = '';

    this.studentService.updateStudent(
      this.studentId,
      this.studentForm.value
    ).subscribe({

      next: (response) => {

        console.log('Student Updated:', response);

        this.successMessage =
          response.message || 'Student updated successfully!';

        this.isSubmitting = false;

        this.cdr.detectChanges();

        setTimeout(() => {

          if (this.userRole === 'Admin') {

            this.router.navigate(['/admin/students']);

          }
          else if (this.userRole === 'Teacher') {

            this.router.navigate(['/teacher/students']);

          }
          else {

            console.error('Unknown user role:', this.userRole);

          }

        }, 1500);

      },

      error: (error) => {

        console.error('Update Student Error:', error);

        this.errorMessage =
          error.error?.message || 'Unable to update student.';

        this.isSubmitting = false;

        this.cdr.detectChanges();

      }

    });

  }

}