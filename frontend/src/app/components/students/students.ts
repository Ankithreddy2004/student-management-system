import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Student } from '../../services/student';
import { Auth } from '../../services/auth';

import {
  RouterLink,
  Router
} from '@angular/router';


@Component({
  selector: 'app-students',
  standalone: true,

  imports: [
    CommonModule,
    RouterLink,
    FormsModule
  ],

  templateUrl: './students.html',
  styleUrl: './students.css',
})

export class Students implements OnInit {

  // ==========================================
  // STUDENT DATA
  // ==========================================

  students: any[] = [];

  isLoading = false;

  errorMessage = '';
  successMessage = '';

  searchTerm = '';

  userRole = '';


  // ==========================================
  // PAGINATION
  // ==========================================

  pageSize = 5;

  currentPage = 1;


  constructor(
    private studentService: Student,
    private authService: Auth,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}


  // ==========================================
  // INITIALIZATION
  // ==========================================

  ngOnInit(): void {

    this.userRole = this.authService.getRole() || '';

    this.getStudents();

  }


  // ==========================================
  // USER ROLE
  // ==========================================

  get isAdmin(): boolean {

    return this.userRole === 'Admin';

  }


  get isTeacher(): boolean {

    return this.userRole === 'Teacher';

  }


  // ==========================================
  // GET ALL STUDENTS
  // ==========================================

  getStudents(): void {

    this.isLoading = true;

    this.errorMessage = '';

    this.successMessage = '';

    this.studentService.getStudents().subscribe({

      next: (response) => {

        this.students = response.data || [];

        this.isLoading = false;

        // Ensure current page remains valid after deletion.
        const maxPage = Math.max(
          1,
          Math.ceil(this.filteredStudents.length / this.pageSize)
        );

        this.currentPage = Math.min(
          this.currentPage,
          maxPage
        );

        this.cdr.detectChanges();

      },

      error: (error) => {

        console.error('Fetch Students Error:', error);

        this.errorMessage =
          error.error?.message || 'Unable to fetch students.';

        this.isLoading = false;

        this.cdr.detectChanges();

      }

    });

  }


  // ==========================================
  // SEARCH STUDENTS
  // ==========================================

  get filteredStudents(): any[] {

    const search = this.searchTerm.toLowerCase().trim();

    return this.students.filter(student =>

      (student.name || '').toLowerCase().includes(search) ||

      (student.email || '').toLowerCase().includes(search) ||

      String(student.phone || '').includes(search) ||

      (student.course || '').toLowerCase().includes(search)

    );

  }


  // Reset pagination whenever search changes.
  onSearchChange(): void {

    this.currentPage = 1;

  }


  // ==========================================
  // PAGINATED STUDENTS
  // ==========================================

  get paginatedStudents(): any[] {

    const start = (this.currentPage - 1) * this.pageSize;

    return this.filteredStudents.slice(
      start,
      start + this.pageSize
    );

  }


  // ==========================================
  // TOTAL PAGES
  // ==========================================

  get totalPages(): number {

    return Math.ceil(
      this.filteredStudents.length / this.pageSize
    );

  }


  // ==========================================
  // PAGINATION START INDEX
  // ==========================================

  get startIndex(): number {

    return this.filteredStudents.length === 0
      ? 0
      : (this.currentPage - 1) * this.pageSize + 1;

  }


  // ==========================================
  // PAGINATION END INDEX
  // ==========================================

  get endIndex(): number {

    return Math.min(
      this.currentPage * this.pageSize,
      this.filteredStudents.length
    );

  }


  // ==========================================
  // PREVIOUS PAGE
  // ==========================================

  previousPage(): void {

    if (this.currentPage > 1) {

      this.currentPage--;

    }

  }


  // ==========================================
  // NEXT PAGE
  // ==========================================

  nextPage(): void {

    if (this.currentPage < this.totalPages) {

      this.currentPage++;

    }

  }


  // ==========================================
  // EDIT STUDENT - ADMIN AND TEACHER
  // ==========================================

  editStudent(id: number): void {

    if (this.isAdmin) {

      this.router.navigate(['/admin/edit-student', id]);

    }

    else if (this.isTeacher) {

      this.router.navigate(['/teacher/edit-student', id]);

    }

  }


  // ==========================================
  // DELETE STUDENT - ADMIN ONLY
  // ==========================================

  deleteStudent(id: number): void {

    if (!this.isAdmin) {

      this.errorMessage = 'Only Admin can delete students.';

      return;

    }

    const confirmDelete = window.confirm(
      'Are you sure you want to delete this student?'
    );

    if (!confirmDelete) {

      return;

    }

    this.studentService.deleteStudent(id).subscribe({

      next: (response) => {

        this.successMessage =
          response.message || 'Student deleted successfully!';

        this.errorMessage = '';

        this.getStudents();

      },

      error: (error) => {

        console.error('Delete Student Error:', error);

        this.errorMessage =
          error.error?.message || 'Unable to delete student.';

        this.cdr.detectChanges();

      }

    });

  }


  // ==========================================
  // CHANGE ACTIVE / INACTIVE STATUS
  // ADMIN AND TEACHER
  // ==========================================

  updateStudentStatus(student: any, event: Event): void {

    const selectElement = event.target as HTMLSelectElement;

    const newStatus = selectElement.value;

    const previousStatus = student.status;

    this.studentService.updateStudentStatus(
      student.id,
      newStatus
    ).subscribe({

      next: (response) => {

        student.status = newStatus;

        this.successMessage =
          response.message || 'Student status updated successfully!';

        this.errorMessage = '';

        this.cdr.detectChanges();

      },

      error: (error) => {

        console.error('Status Update Error:', error);

        student.status = previousStatus;

        selectElement.value = previousStatus;

        this.errorMessage =
          error.error?.message || 'Unable to update status.';

        this.cdr.detectChanges();

      }

    });

  }

}