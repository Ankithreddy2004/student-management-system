import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { MatIconModule } from '@angular/material/icon';

import {
  Enrollment,
  EnrollmentSubject,
  Enrollment as EnrollmentRecord,
  EnrollmentStatus
} from '../../services/enrollment';

import { Student } from '../../services/student';


interface StudentOption {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  course?: string;
}


@Component({
  selector: 'app-admin-enrollments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule
  ],
  templateUrl: './admin-enrollments.html',
  styleUrl: './admin-enrollments.css'
})
export class AdminEnrollments implements OnInit {

  enrollments: EnrollmentRecord[] = [];

  subjects: EnrollmentSubject[] = [];

  students: StudentOption[] = [];

  filteredEnrollments: EnrollmentRecord[] = [];

  searchText = '';

  selectedStatus = 'All';

  selectedSubject = '';

  selectedStudent = '';

  // Enrollment form
  newStudentId: number | null = null;

  newSubjectId: number | null = null;

  // Operation states
  submitting = false;

  processingIds: number[] = [];

  successMessage = '';

  errorMessage = '';

  constructor(
    private enrollmentService: Enrollment,
    private studentService: Student,
    private cdr: ChangeDetectorRef
  ) {}


  // =====================================
  // INITIAL LOAD
  // =====================================

  ngOnInit(): void {
    this.loadInitialData();
  }


  // =====================================
  // LOAD ALL DATA AUTOMATICALLY
  // =====================================

  loadInitialData(): void {

    forkJoin({
      enrollments: this.enrollmentService.getAllEnrollments(),
      subjects: this.enrollmentService.getAvailableSubjects(),
      students: this.studentService.getStudents()
    }).subscribe({

      next: (response) => {

        this.enrollments =
          response.enrollments.enrollments || [];

        this.subjects =
          response.subjects.subjects || [];

        // Handle different possible API response structures.
        const studentResponse = response.students;

        let studentList: any[] = [];

        if (Array.isArray(studentResponse)) {
          studentList = studentResponse;
        } else if (Array.isArray(studentResponse.data)) {
          studentList = studentResponse.data;
        } else if (Array.isArray(studentResponse.students)) {
          studentList = studentResponse.students;
        }

        this.students = studentList.map(student => ({
          id: Number(student.id),
          name: student.name,
          email: student.email,
          phone: student.phone,
          course: student.course
        }));

        this.applyFilters();

        this.cdr.detectChanges();

      },

      error: (error) => {

        console.error('Admin enrollment loading error:', error);

        this.errorMessage =
          error.error?.message ||
          'Unable to load enrollment information.';

        this.cdr.detectChanges();

      }

    });

  }


  // =====================================
  // SUMMARY COUNTS
  // =====================================

  get totalEnrollments(): number {
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


  // =====================================
  // FILTER ENROLLMENTS
  // =====================================

  applyFilters(): void {

    const search = this.searchText.trim().toLowerCase();

    this.filteredEnrollments = this.enrollments.filter(item => {

      const matchesSearch =
        !search ||
        item.student_name?.toLowerCase().includes(search) ||
        item.student_email?.toLowerCase().includes(search) ||
        item.subject_name?.toLowerCase().includes(search) ||
        item.subject_code?.toLowerCase().includes(search);

      const matchesStatus =
        this.selectedStatus === 'All' ||
        item.status === this.selectedStatus;

      const matchesSubject =
        !this.selectedSubject ||
        item.subject_id === Number(this.selectedSubject);

      const matchesStudent =
        !this.selectedStudent ||
        item.student_id === Number(this.selectedStudent);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesSubject &&
        matchesStudent
      );

    });

  }


  // =====================================
  // ADD ENROLLMENT
  // =====================================

  addEnrollment(): void {

    this.clearMessages();

    if (!this.newStudentId || !this.newSubjectId) {

      this.errorMessage =
        'Please select both a student and a subject.';

      return;

    }

    const alreadyExists = this.enrollments.some(item =>
      item.student_id === Number(this.newStudentId) &&
      item.subject_id === Number(this.newSubjectId)
    );

    if (alreadyExists) {

      this.errorMessage =
        'This student already has an enrollment record for this subject.';

      return;

    }

    this.submitting = true;

    this.enrollmentService.enrollStudent({

      studentId: Number(this.newStudentId),

      subjectId: Number(this.newSubjectId)

    }).subscribe({

      next: (response) => {

        this.submitting = false;

        this.successMessage =
          response.message ||
          'Enrollment request created successfully.';

        // Reset form.
        this.newStudentId = null;
        this.newSubjectId = null;

        // Fetch only the enrollment records.
        this.refreshEnrollments();

      },

      error: (error) => {

        this.submitting = false;

        this.errorMessage =
          error.error?.message ||
          'Unable to create enrollment.';

        this.cdr.detectChanges();

      }

    });

  }


  // =====================================
  // APPROVE ENROLLMENT
  // =====================================

  approveEnrollment(item: EnrollmentRecord): void {

    if (item.status !== 'Pending') {
      return;
    }

    this.clearMessages();

    this.processingIds.push(item.enrollment_id);

    this.enrollmentService
      .approveEnrollment(item.enrollment_id)
      .subscribe({

        next: (response) => {

          item.status = 'Approved';

          this.removeProcessing(item.enrollment_id);

          this.successMessage =
            response.message || 'Enrollment approved successfully.';

          this.applyFilters();

          this.cdr.detectChanges();

        },

        error: (error) => {

          this.removeProcessing(item.enrollment_id);

          this.errorMessage =
            error.error?.message ||
            'Unable to approve enrollment.';

          this.cdr.detectChanges();

        }

      });

  }


  // =====================================
  // REJECT ENROLLMENT
  // =====================================

  rejectEnrollment(item: EnrollmentRecord): void {

    if (item.status !== 'Pending') {
      return;
    }

    this.clearMessages();

    this.processingIds.push(item.enrollment_id);

    this.enrollmentService
      .rejectEnrollment(item.enrollment_id)
      .subscribe({

        next: (response) => {

          item.status = 'Rejected';

          this.removeProcessing(item.enrollment_id);

          this.successMessage =
            response.message || 'Enrollment rejected successfully.';

          this.applyFilters();

          this.cdr.detectChanges();

        },

        error: (error) => {

          this.removeProcessing(item.enrollment_id);

          this.errorMessage =
            error.error?.message ||
            'Unable to reject enrollment.';

          this.cdr.detectChanges();

        }

      });

  }


  // =====================================
  // REFRESH ENROLLMENTS ONLY
  // =====================================

  refreshEnrollments(): void {

    this.enrollmentService.getAllEnrollments().subscribe({

      next: (response) => {

        this.enrollments =
          response.enrollments || [];

        this.applyFilters();

        this.cdr.detectChanges();

      },

      error: (error) => {

        console.error('Refresh enrollments error:', error);

        this.errorMessage =
          'Unable to refresh enrollment records.';

        this.cdr.detectChanges();

      }

    });

  }


  // =====================================
  // HELPERS
  // =====================================

  isProcessing(id: number): boolean {

    return this.processingIds.includes(id);

  }


  private removeProcessing(id: number): void {

    this.processingIds =
      this.processingIds.filter(item => item !== id);

  }


  clearMessages(): void {

    this.successMessage = '';

    this.errorMessage = '';

  }


  clearFilters(): void {

    this.searchText = '';

    this.selectedStatus = 'All';

    this.selectedSubject = '';

    this.selectedStudent = '';

    this.applyFilters();

  }


  trackByEnrollment(
    index: number,
    item: EnrollmentRecord
  ): number {

    return item.enrollment_id;

  }

}