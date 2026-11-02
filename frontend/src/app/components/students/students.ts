import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Student } from '../../services/student';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-students',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './students.html',
  styleUrl: './students.css',
})
export class Students implements OnInit {

  students: any[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  searchTerm = '';

  constructor(
    private studentService: Student,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.getStudents();
  }

  // GET all students
  getStudents(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.studentService.getStudents().subscribe({
      next: (response) => {
        this.students = response.data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Unable to fetch students.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Search students
  get filteredStudents(): any[] {
    const search = this.searchTerm.toLowerCase().trim();

    return this.students.filter(student =>
      student.name.toLowerCase().includes(search) ||
      student.email.toLowerCase().includes(search) ||
      student.phone.includes(search) ||
      student.course.toLowerCase().includes(search)
    );
  }

  // EDIT student
  editStudent(id: number): void {
    this.router.navigate(['/edit-student', id]);
  }

  // DELETE student
  deleteStudent(id: number): void {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this student?'
    );

    if (!confirmDelete) {
      return;
    }

    this.studentService.deleteStudent(id).subscribe({
      next: () => {
        this.successMessage = 'Student deleted successfully!';
        this.getStudents();
      },
      error: (error) => {
        console.error(error);
        this.errorMessage =
          error.error?.message || 'Unable to delete student.';
        this.cdr.detectChanges();
      }
    });
  }

  // CHANGE ACTIVE / INACTIVE STATUS
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

        this.successMessage = response.message;
        this.errorMessage = '';

        this.cdr.detectChanges();
      },

      error: (error) => {
        console.error('Status Update Error:', error);

        student.status = previousStatus;

        this.errorMessage =
          error.error?.message || 'Unable to update status.';

        this.cdr.detectChanges();
      }

    });
  }

}