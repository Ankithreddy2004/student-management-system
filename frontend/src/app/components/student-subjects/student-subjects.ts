import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

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

@Component({
  selector: 'app-student-subjects',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule
  ],
  templateUrl: './student-subjects.html',
  styleUrl: './student-subjects.css'
})
export class StudentSubjects implements OnInit {

  availableSubjects: EnrollmentSubject[] = [];

  myEnrollments: EnrollmentRecord[] = [];

  searchText = '';

  selectedFilter: 'All' | EnrollmentStatus = 'All';

  loading = false;
  submitting = false;

  errorMessage = '';
  successMessage = '';

  constructor(
    private enrollmentService: Enrollment,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Automatically load data when the page opens.
    this.loadData();
  }

  // =========================================
  // LOAD SUBJECTS AND ENROLLMENTS
  // =========================================

  loadData(): void {

    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      subjects: this.enrollmentService.getAvailableSubjects(),
      enrollments: this.enrollmentService.getMyEnrollments()
    }).subscribe({

      next: (response) => {

        // Support both direct arrays and nested responses.
        const subjectsResponse: any = response.subjects;
        const enrollmentsResponse: any = response.enrollments;

        this.availableSubjects = Array.isArray(subjectsResponse)
          ? subjectsResponse
          : subjectsResponse?.subjects || [];

        this.myEnrollments = Array.isArray(enrollmentsResponse)
          ? enrollmentsResponse
          : enrollmentsResponse?.enrollments || [];

        this.loading = false;

        console.log(
          'Available Subjects:',
          this.availableSubjects
        );

        console.log(
          'My Enrollments:',
          this.myEnrollments
        );

        this.cdr.detectChanges();

      },

      error: (error) => {

        console.error(
          'Enrollment loading error:',
          error
        );

        this.loading = false;

        this.errorMessage =
          error.error?.message ||
          'Unable to load subject enrollment details. Please try again.';

        this.cdr.detectChanges();

      }

    });

  }

  // =========================================
  // CHECK EXISTING ENROLLMENT
  // =========================================

  isAlreadyEnrolled(subjectId: number): boolean {

    return this.myEnrollments.some(
      enrollment =>
        Number(enrollment.subject_id) === Number(subjectId)
    );

  }

  // =========================================
  // GET ENROLLMENT STATUS
  // =========================================

  getEnrollmentStatus(
    subjectId: number
  ): EnrollmentStatus | null {

    const enrollment = this.myEnrollments.find(
      item =>
        Number(item.subject_id) === Number(subjectId)
    );

    return enrollment ? enrollment.status : null;

  }

  // =========================================
  // ENROLL IN SUBJECT
  // =========================================

  enrollSubject(subject: EnrollmentSubject): void {

    if (
      this.submitting ||
      this.isAlreadyEnrolled(subject.id)
    ) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.submitting = true;

    this.enrollmentService
      .enrollStudent({
        subjectId: subject.id
      })
      .subscribe({

        next: (response) => {

          this.submitting = false;

          this.successMessage =
            response.message ||
            'Enrollment request submitted successfully.';

          // Reload subjects and enrollment status.
          this.loadData();

        },

        error: (error) => {

          this.submitting = false;

          console.error(
            'Enrollment error:',
            error
          );

          this.errorMessage =
            error.error?.message ||
            'Unable to submit enrollment request. Please try again.';

          this.loadData();

        }

      });

  }

  // =========================================
  // FILTER SUBJECTS
  // =========================================

  get filteredSubjects(): EnrollmentSubject[] {

    return this.availableSubjects.filter(subject => {

      const search = this.searchText.toLowerCase().trim();

      const matchesSearch =
        (subject.subject_name || '').toLowerCase().includes(search) ||
        (subject.subject_code || '').toLowerCase().includes(search) ||
        (subject.course || '').toLowerCase().includes(search);

      const status = this.getEnrollmentStatus(subject.id);

      const matchesFilter =
        this.selectedFilter === 'All' ||
        status === this.selectedFilter;

      return matchesSearch && matchesFilter;

    });

  }

  // =========================================
  // SET FILTER
  // =========================================

  setFilter(
    filter: 'All' | EnrollmentStatus
  ): void {

    this.selectedFilter = filter;

  }

  // =========================================
  // SUMMARY COUNTS
  // =========================================

  get pendingCount(): number {

    return this.myEnrollments.filter(
      item => item.status === 'Pending'
    ).length;

  }

  get approvedCount(): number {

    return this.myEnrollments.filter(
      item => item.status === 'Approved'
    ).length;

  }

  get rejectedCount(): number {

    return this.myEnrollments.filter(
      item => item.status === 'Rejected'
    ).length;

  }

  get availableCount(): number {

    return this.availableSubjects.filter(
      subject => !this.isAlreadyEnrolled(subject.id)
    ).length;

  }

  // =========================================
  // REFRESH
  // =========================================

  refresh(): void {

    this.successMessage = '';
    this.errorMessage = '';

    this.loadData();

  }

}