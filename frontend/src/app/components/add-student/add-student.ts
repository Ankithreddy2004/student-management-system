import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Student } from '../../services/student';

@Component({
  selector: 'app-add-student',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './add-student.html',
  styleUrl: './add-student.css',
})
export class AddStudent {

  studentForm: FormGroup;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private studentService: Student,
    private router: Router
  ) {

    this.studentForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      course: ['', Validators.required]
    });

  }

  addStudent(): void {

    if (this.studentForm.invalid) {
      this.studentForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    this.studentService.addStudent(this.studentForm.value).subscribe({

      next: (response) => {

        this.successMessage = 'Student added successfully!';
        this.isSubmitting = false;

        console.log('Student Added:', response);

        setTimeout(() => {
          this.router.navigate(['/students']);
        }, 1500);

      },

      error: (error) => {

        console.error('Add Student Error:', error);

        this.errorMessage = error.error?.message || 'Unable to add student.';
        this.isSubmitting = false;

      }

    });

  }

}