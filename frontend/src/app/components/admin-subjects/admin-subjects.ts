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

@Component({
  selector: 'app-admin-subjects',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatIconModule
  ],
  templateUrl: './admin-subjects.html',
  styleUrl: './admin-subjects.css'
})
export class AdminSubjects implements OnInit {

  subjects: any[] = [];

  isLoading = false;
  isSaving = false;

  errorMessage = '';
  successMessage = '';

  searchTerm = '';
  selectedCourse = '';
  selectedSemester = '';

  isEditing = false;
  editingId: number | null = null;

  // =====================================
  // PAGINATION
  // =====================================

  currentPage = 1;
  pageSize = 5;


  subject = {
    subject_name: '',
    subject_code: '',
    course: '',
    semester: 1
  };


  constructor(
    private subjectService: Subject,
    private cdr: ChangeDetectorRef
  ) {}


  ngOnInit(): void {
    this.loadSubjects();
  }


  // =====================================
  // LOAD SUBJECTS
  // =====================================

  loadSubjects(): void {

    this.isLoading = true;
    this.errorMessage = '';

    this.subjectService.getSubjects().subscribe({

      next: (response) => {

        this.subjects = response.data || [];
        this.isLoading = false;

        // Keep current page within valid range
        if (this.currentPage > this.totalPages) {
          this.currentPage = Math.max(1, this.totalPages);
        }

        this.cdr.detectChanges();

      },

      error: (error) => {

        console.error(error);

        this.errorMessage =
          error.error?.message || 'Unable to load subjects.';

        this.isLoading = false;

        this.cdr.detectChanges();

      }

    });

  }


  // =====================================
  // FILTERED SUBJECTS
  // =====================================

  get filteredSubjects(): any[] {

    return this.subjects.filter(subject => {

      const search = this.searchTerm.toLowerCase();

      const matchesSearch =
        (subject.subject_name || '').toLowerCase().includes(search) ||
        (subject.subject_code || '').toLowerCase().includes(search) ||
        (subject.course || '').toLowerCase().includes(search);

      const matchesCourse =
        !this.selectedCourse ||
        subject.course === this.selectedCourse;

      const matchesSemester =
        !this.selectedSemester ||
        Number(subject.semester) === Number(this.selectedSemester);

      return matchesSearch && matchesCourse && matchesSemester;

    });

  }


  get courses(): string[] {

    return [...new Set(
      this.subjects.map(subject => subject.course)
    )] as string[];

  }


  // =====================================
  // PAGINATION GETTERS
  // =====================================

  get totalPages(): number {

    return Math.ceil(
      this.filteredSubjects.length / this.pageSize
    );

  }


  get paginatedSubjects(): any[] {

    const startIndex =
      (this.currentPage - 1) * this.pageSize;

    const endIndex =
      startIndex + this.pageSize;

    return this.filteredSubjects.slice(startIndex, endIndex);

  }


  get pageNumbers(): number[] {

    return Array.from(
      { length: this.totalPages },
      (_, index) => index + 1
    );

  }


  get startItem(): number {

    if (this.filteredSubjects.length === 0) {
      return 0;
    }

    return (this.currentPage - 1) * this.pageSize + 1;

  }


  get endItem(): number {

    return Math.min(
      this.currentPage * this.pageSize,
      this.filteredSubjects.length
    );

  }


  // =====================================
  // PAGINATION METHODS
  // =====================================

  goToPage(page: number): void {

    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;

  }


  previousPage(): void {

    if (this.currentPage > 1) {
      this.currentPage--;
    }

  }


  nextPage(): void {

    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }

  }


  // =====================================
  // FILTER CHANGE
  // =====================================

  onFilterChange(): void {

    // Reset pagination whenever filters change
    this.currentPage = 1;

  }


  // =====================================
  // SAVE SUBJECT
  // =====================================

  saveSubject(): void {

    this.clearMessages();

    if (
      !this.subject.subject_name.trim() ||
      !this.subject.subject_code.trim() ||
      !this.subject.course.trim() ||
      !this.subject.semester
    ) {

      this.errorMessage = 'Please fill in all fields.';
      return;

    }

    this.isSaving = true;

    const data = {
      subject_name: this.subject.subject_name.trim(),
      subject_code: this.subject.subject_code.trim().toUpperCase(),
      course: this.subject.course.trim().toUpperCase(),
      semester: Number(this.subject.semester)
    };

    const request = this.isEditing && this.editingId
      ? this.subjectService.updateSubject(this.editingId, data)
      : this.subjectService.addSubject(data);

    request.subscribe({

      next: (response) => {

        this.successMessage =
          response.message || 'Subject saved successfully.';

        this.resetForm();

        this.isSaving = false;

        // Return to first page after saving
        this.currentPage = 1;

        this.loadSubjects();

        this.cdr.detectChanges();

      },

      error: (error) => {

        this.errorMessage =
          error.error?.message || 'Unable to save subject.';

        this.isSaving = false;

        this.cdr.detectChanges();

      }

    });

  }


  // =====================================
  // EDIT SUBJECT
  // =====================================

  editSubject(item: any): void {

    this.clearMessages();

    this.isEditing = true;
    this.editingId = Number(item.id);

    this.subject = {
      subject_name: item.subject_name,
      subject_code: item.subject_code,
      course: item.course,
      semester: Number(item.semester)
    };

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

  }


  // =====================================
  // DELETE SUBJECT
  // =====================================

  deleteSubject(id: number): void {

    this.clearMessages();

    const confirmed = confirm(
      'Are you sure you want to delete this subject?'
    );

    if (!confirmed) {
      return;
    }

    this.subjectService.deleteSubject(id).subscribe({

      next: (response) => {

        this.successMessage =
          response.message || 'Subject deleted successfully.';

        this.loadSubjects();

        this.cdr.detectChanges();

      },

      error: (error) => {

        this.errorMessage =
          error.error?.message || 'Unable to delete subject.';

        this.cdr.detectChanges();

      }

    });

  }


  // =====================================
  // RESET FORM
  // =====================================

  resetForm(): void {

    this.subject = {
      subject_name: '',
      subject_code: '',
      course: '',
      semester: 1
    };

    this.isEditing = false;
    this.editingId = null;

  }


  cancelEdit(): void {

    this.resetForm();
    this.clearMessages();

  }


  // =====================================
  // CLEAR MESSAGES
  // =====================================

  clearMessages(): void {

    this.successMessage = '';
    this.errorMessage = '';

  }

}