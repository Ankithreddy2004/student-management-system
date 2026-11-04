
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { Student } from '../../services/student';

@Component({
  selector: 'app-teacher-pending-students',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './teacher-pending-students.html',
  styleUrl: './teacher-pending-students.css'
})
export class TeacherPendingStudents implements OnInit {

  pendingStudents: any[] = [];

  isLoading = false;

  approvingStudentId: number | null = null;
  inactiveStudentId: number | null = null;

  successMessage = '';
  errorMessage = '';

  constructor(
    private studentService: Student,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPendingStudents();
  }

  // =====================================
  // LOAD PENDING STUDENTS
  // =====================================

  loadPendingStudents(): void {

    this.isLoading = true;
    this.errorMessage = '';

    this.studentService.getPendingStudents().subscribe({

      next: (response: any) => {

        this.pendingStudents = Array.isArray(response.data)
          ? response.data
          : [];

        this.isLoading = false;

        this.cdr.detectChanges();

        console.log('Pending Students:', this.pendingStudents);

      },

      error: (error) => {

        console.error('Pending Students Error:', error);

        this.isLoading = false;

        this.errorMessage =
          error.error?.message ||
          'Unable to load pending students.';

        this.cdr.detectChanges();

      }

    });

  }

  // =====================================
  // APPROVE STUDENT
  // PENDING -> ACTIVE
  // =====================================

  approveStudent(id: number): void {

    const confirmed = window.confirm(
      'Are you sure you want to activate this student?'
    );

    if (!confirmed) {
      return;
    }

    this.approvingStudentId = id;
    this.successMessage = '';
    this.errorMessage = '';

    this.studentService.approveStudent(id).subscribe({

      next: (response: any) => {

        this.successMessage =
          response.message || 'Student activated successfully.';

        this.approvingStudentId = null;

        this.loadPendingStudents();

      },

      error: (error) => {

        console.error('Student Approval Error:', error);

        this.approvingStudentId = null;

        this.errorMessage =
          error.error?.message ||
          'Unable to activate student.';

        this.cdr.detectChanges();

      }

    });

  }

  // =====================================
  // MAKE STUDENT INACTIVE
  // PENDING -> INACTIVE
  // =====================================

  makeInactive(id: number): void {

    const confirmed = window.confirm(
      'Are you sure you want to make this student inactive?'
    );

    if (!confirmed) {
      return;
    }

    this.inactiveStudentId = id;
    this.successMessage = '';
    this.errorMessage = '';

    this.studentService.updateStudentStatus(id, 'Inactive').subscribe({

      next: (response: any) => {

        this.successMessage =
          response.message || 'Student marked as inactive successfully.';

        this.inactiveStudentId = null;

        this.loadPendingStudents();

      },

      error: (error) => {

        console.error('Student Status Update Error:', error);

        this.inactiveStudentId = null;

        this.errorMessage =
          error.error?.message ||
          'Unable to update student status.';

        this.cdr.detectChanges();

      }

    });

  }

  // =====================================
  // BACK TO TEACHER DASHBOARD
  // =====================================

  goBack(): void {

    this.router.navigate(['/teacher-dashboard']);

  }

}
