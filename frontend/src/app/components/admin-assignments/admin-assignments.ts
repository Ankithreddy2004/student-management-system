import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { Subject } from '../../services/subject';
import { Admin } from '../../services/admin';

@Component({
  selector: 'app-admin-assignments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatIconModule
  ],
  templateUrl: './admin-assignments.html',
  styleUrl: './admin-assignments.css'
})
export class AdminAssignments implements OnInit {

  teachers: any[] = [];
  subjects: any[] = [];
  assignments: any[] = [];

  selectedTeacherId: number | null = null;
  selectedSubjectIds: number[] = [];

  isLoading = false;
  isSaving = false;

  successMessage = '';
  errorMessage = '';

  // PAGINATION
  currentPage = 1;
  pageSize = 5;
  pageSizeOptions = [5, 10, 25, 50];

  constructor(
    private subjectService: Subject,
    private adminService: Admin,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  // LOAD INITIAL DATA
  loadInitialData(): void {

    this.isLoading = true;

    let completed = 0;

    const finish = () => {

      completed++;

      if (completed === 3) {

        this.isLoading = false;

        this.adjustCurrentPage();

        this.cdr.detectChanges();

      }

    };

    this.adminService.getTeachers().subscribe({

      next: response => {

        this.teachers = response.data || [];

        finish();

      },

      error: error => {

        console.error(error);

        this.errorMessage = 'Unable to load teachers.';

        finish();

      }

    });

    this.subjectService.getSubjects().subscribe({

      next: response => {

        this.subjects = response.data || [];

        finish();

      },

      error: error => {

        console.error(error);

        this.errorMessage = 'Unable to load subjects.';

        finish();

      }

    });

    this.loadAssignments(finish);

  }

  // LOAD ASSIGNMENTS
  loadAssignments(finish?: () => void): void {

    this.subjectService.getAssignments().subscribe({

      next: response => {

        this.assignments = response.data || [];

        this.adjustCurrentPage();

        if (finish) {
          finish();
        }

        this.cdr.detectChanges();

      },

      error: error => {

        console.error(error);

        this.errorMessage = 'Unable to load assignments.';

        if (finish) {
          finish();
        }

        this.cdr.detectChanges();

      }

    });

  }

  // PAGINATION GETTERS
  get totalPages(): number {

    return Math.ceil(
      this.assignments.length / this.pageSize
    );

  }

  get paginatedAssignments(): any[] {

    const startIndex =
      (this.currentPage - 1) * this.pageSize;

    const endIndex =
      startIndex + this.pageSize;

    return this.assignments.slice(startIndex, endIndex);

  }

  // PAGE SIZE CHANGE
  onPageSizeChange(event: Event): void {

    const selectElement = event.target as HTMLSelectElement;

    this.pageSize = Number(selectElement.value);
    this.currentPage = 1;

  }

  // PREVIOUS PAGE
  previousPage(): void {

    if (this.currentPage > 1) {
      this.currentPage--;
    }

  }

  // NEXT PAGE
  nextPage(): void {

    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }

  }

  // ADJUST CURRENT PAGE
  adjustCurrentPage(): void {

    const maxPage = Math.max(1, this.totalPages);

    if (this.currentPage > maxPage) {
      this.currentPage = maxPage;
    }

  }

  // CHECK SUBJECT SELECTION
  toggleSubject(subjectId: number, event: Event): void {

    const checked =
      (event.target as HTMLInputElement).checked;

    if (checked) {

      if (!this.selectedSubjectIds.includes(subjectId)) {
        this.selectedSubjectIds.push(subjectId);
      }

    } else {

      this.selectedSubjectIds =
        this.selectedSubjectIds.filter(id => id !== subjectId);

    }

  }

  isSubjectSelected(subjectId: number): boolean {

    return this.selectedSubjectIds.includes(subjectId);

  }

  // ASSIGN SUBJECTS
  assignSubjects(): void {

    this.clearMessages();

    if (!this.selectedTeacherId) {

      this.errorMessage = 'Please select a teacher.';
      return;

    }

    if (this.selectedSubjectIds.length === 0) {

      this.errorMessage = 'Please select at least one subject.';
      return;

    }

    this.isSaving = true;

    const data = {
      teacher_id: Number(this.selectedTeacherId),
      subject_ids: this.selectedSubjectIds
    };

    this.subjectService.assignSubjects(data).subscribe({

      next: response => {

        const result = response.data;

        this.successMessage =
          `${result.newly_assigned} subject(s) assigned successfully. ` +
          `${result.already_assigned} already assigned.`;

        this.selectedSubjectIds = [];

        this.isSaving = false;

        this.currentPage = 1;

        this.loadAssignments();

        this.cdr.detectChanges();

      },

      error: error => {

        this.errorMessage =
          error.error?.message || 'Unable to assign subjects.';

        this.isSaving = false;

        this.cdr.detectChanges();

      }

    });

  }

  // REMOVE ASSIGNMENT
  removeAssignment(id: number): void {

    this.clearMessages();

    const confirmed = confirm(
      'Are you sure you want to remove this subject assignment?'
    );

    if (!confirmed) {
      return;
    }

    this.subjectService.removeAssignment(id).subscribe({

      next: response => {

        this.successMessage =
          response.message || 'Assignment removed successfully.';

        this.loadAssignments();

        this.cdr.detectChanges();

      },

      error: error => {

        this.errorMessage =
          error.error?.message || 'Unable to remove assignment.';

        this.cdr.detectChanges();

      }

    });

  }

  // CLEAR MESSAGES
  clearMessages(): void {

    this.successMessage = '';
    this.errorMessage = '';

  }

}