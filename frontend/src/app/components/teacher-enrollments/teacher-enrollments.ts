import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';

import {
  Enrollment,
  EnrollmentSubject,
  Enrollment as EnrollmentRecord,
  EnrollmentStatus
} from '../../services/enrollment';

import { Student } from '../../services/student';

@Component({
  selector: 'app-teacher-enrollments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule
  ],
  templateUrl: './teacher-enrollments.html',
  styleUrl: './teacher-enrollments.css'
})
export class TeacherEnrollments implements OnInit {

  availableSubjects: EnrollmentSubject[] = [];
  enrollments: EnrollmentRecord[] = [];
  students: any[] = [];

  selectedStudentId: number | null = null;
  selectedSubjectId: number | null = null;

  selectedFilter: 'All' | EnrollmentStatus = 'All';

  searchText = '';

  loading = false;
  submitting = false;

  processingId: number | null = null;

  errorMessage = '';
  successMessage = '';

  constructor(
    private enrollmentService: Enrollment,
    private studentService: Student
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  // ==========================================
  // LOAD ALL DATA SIMULTANEOUSLY
  // ==========================================

  loadData(): void {

    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      subjects: this.enrollmentService.getAvailableSubjects(),
      enrollments: this.enrollmentService.getAllEnrollments(),
      students: this.studentService.getStudents()
    }).subscribe({

      next: (response) => {

        this.availableSubjects =
          response.subjects.subjects || [];

        this.enrollments =
          response.enrollments.enrollments || [];

        this.students =
          response.students.data ||
          response.students.students ||
          [];

        this.loading = false;

      },

      error: (error) => {

        console.error('Teacher enrollment loading error:', error);

        this.loading = false;

        this.errorMessage =
          error.error?.message ||
          'Unable to load enrollment information. Please try again.';

      }

    });

  }

  // ==========================================
  // ENROLL STUDENT INTO SUBJECT
  // ==========================================

  enrollStudent(): void {

    if (
      !this.selectedStudentId ||
      !this.selectedSubjectId ||
      this.submitting
    ) {
      return;
    }

    const alreadyEnrolled = this.enrollments.some(item =>
      Number(item.student_id) === Number(this.selectedStudentId) &&
      Number(item.subject_id) === Number(this.selectedSubjectId)
    );

    if (alreadyEnrolled) {

      this.errorMessage =
        'This student already has an enrollment record for this subject.';

      return;

    }

    this.errorMessage = '';
    this.successMessage = '';

    this.submitting = true;

    this.enrollmentService.enrollStudent({

      studentId: Number(this.selectedStudentId),
      subjectId: Number(this.selectedSubjectId)

    }).subscribe({

      next: (response) => {

        this.submitting = false;

        this.successMessage =
          response.message ||
          'Student enrollment request submitted successfully.';

        this.selectedStudentId = null;
        this.selectedSubjectId = null;

        this.loadData();

      },

      error: (error) => {

        console.error('Student enrollment error:', error);

        this.submitting = false;

        this.errorMessage =
          error.error?.message ||
          'Unable to enroll student. Please try again.';

        this.loadData();

      }

    });

  }

  // ==========================================
  // APPROVE ENROLLMENT
  // ==========================================

  approveEnrollment(enrollment: EnrollmentRecord): void {

    if (
      enrollment.status !== 'Pending' ||
      this.processingId !== null
    ) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.processingId = enrollment.enrollment_id;

    this.enrollmentService
      .approveEnrollment(enrollment.enrollment_id)
      .subscribe({

        next: (response) => {

          this.processingId = null;

          this.successMessage =
            response.message || 'Enrollment approved successfully.';

          this.loadData();

        },

        error: (error) => {

          console.error('Approval error:', error);

          this.processingId = null;

          this.errorMessage =
            error.error?.message ||
            'Unable to approve enrollment.';

          this.loadData();

        }

      });

  }

  // ==========================================
  // REJECT ENROLLMENT
  // ==========================================

  rejectEnrollment(enrollment: EnrollmentRecord): void {

    if (
      enrollment.status !== 'Pending' ||
      this.processingId !== null
    ) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.processingId = enrollment.enrollment_id;

    this.enrollmentService
      .rejectEnrollment(enrollment.enrollment_id)
      .subscribe({

        next: (response) => {

          this.processingId = null;

          this.successMessage =
            response.message || 'Enrollment rejected successfully.';

          this.loadData();

        },

        error: (error) => {

          console.error('Rejection error:', error);

          this.processingId = null;

          this.errorMessage =
            error.error?.message ||
            'Unable to reject enrollment.';

          this.loadData();

        }

      });

  }

  // ==========================================
  // FILTER ENROLLMENTS
  // ==========================================

  get filteredEnrollments(): EnrollmentRecord[] {

    return this.enrollments.filter(enrollment => {

      const search = this.searchText.toLowerCase();

      const matchesSearch =
        (enrollment.student_name || '').toLowerCase().includes(search) ||
        (enrollment.student_email || '').toLowerCase().includes(search) ||
        (enrollment.subject_name || '').toLowerCase().includes(search) ||
        (enrollment.subject_code || '').toLowerCase().includes(search);

      const matchesStatus =
        this.selectedFilter === 'All' ||
        enrollment.status === this.selectedFilter;

      return matchesSearch && matchesStatus;

    });

  }

  // ==========================================
  // FILTER SELECTION
  // ==========================================

  setFilter(filter: 'All' | EnrollmentStatus): void {

    this.selectedFilter = filter;

  }

  // ==========================================
  // COUNTS
  // ==========================================

  get totalCount(): number {
    return this.enrollments.length;
  }

  get pendingCount(): number {
    return this.enrollments.filter(
      item => item.status === 'Pending'
    ).length;
  }

  get approvedCount(): number {
    return this.enrollments.filter(
      item => item.status === 'Approved'
    ).length;
  }

  get rejectedCount(): number {
    return this.enrollments.filter(
      item => item.status === 'Rejected'
    ).length;
  }

  // ==========================================
  // REFRESH
  // ==========================================

  refresh(): void {

    this.successMessage = '';
    this.errorMessage = '';

    this.loadData();

  }

}