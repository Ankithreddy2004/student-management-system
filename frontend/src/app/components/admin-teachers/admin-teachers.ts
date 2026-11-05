import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-teachers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-teachers.html',
  styleUrl: './admin-teachers.css'
})
export class AdminTeachers implements OnInit {

  private apiUrl = 'http://localhost:5000/api/users';

  teachers: any[] = [];

  teacher = {
    name: '',
    email: '',
    password: ''
  };

  editTeacherData = {
    id: 0,
    name: '',
    email: ''
  };

  isLoading = false;
  isCreating = false;
  isUpdating = false;
  isEditing = false;
  isDeletingId: number | null = null;

  successMessage = '';
  errorMessage = '';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTeachers();
  }

  // LOAD TEACHERS
  loadTeachers(): void {

    this.isLoading = true;

    this.http.get<any>(this.apiUrl).subscribe({

      next: (response) => {

        const users = response.data || response.users || [];

        this.teachers = users.filter(
          (user: any) => user.role === 'Teacher'
        );

        this.isLoading = false;
        this.cdr.detectChanges();

      },

      error: (error) => {

        console.error('Fetch Teachers Error:', error);

        this.errorMessage =
          error.error?.message || 'Unable to load teachers.';

        this.isLoading = false;
        this.cdr.detectChanges();

      }

    });

  }


  // CREATE TEACHER
  createTeacher(): void {

    this.successMessage = '';
    this.errorMessage = '';

    if (
      !this.teacher.name.trim() ||
      !this.teacher.email.trim() ||
      !this.teacher.password
    ) {
      this.errorMessage = 'Please fill in all fields.';
      return;
    }

    if (this.teacher.password.length < 12) {
      this.errorMessage = 'Password must contain at least 12 characters.';
      return;
    }

    this.isCreating = true;

    this.http.post<any>(
      `${this.apiUrl}/teacher`,
      this.teacher
    ).subscribe({

      next: (response) => {

        this.successMessage =
          response.message || 'Teacher created successfully!';

        this.teacher = {
          name: '',
          email: '',
          password: ''
        };

        this.isCreating = false;

        this.loadTeachers();
        this.cdr.detectChanges();

      },

      error: (error) => {

        console.error('Create Teacher Error:', error);

        this.errorMessage =
          error.error?.message || 'Unable to create teacher.';

        this.isCreating = false;
        this.cdr.detectChanges();

      }

    });

  }


  // OPEN EDIT FORM
  editTeacher(teacher: any): void {

    this.successMessage = '';
    this.errorMessage = '';

    this.editTeacherData = {
      id: teacher.id,
      name: teacher.name,
      email: teacher.email
    };

    this.isEditing = true;

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    this.cdr.detectChanges();

  }


  // UPDATE TEACHER
  updateTeacher(): void {

    this.successMessage = '';
    this.errorMessage = '';

    if (
      !this.editTeacherData.name.trim() ||
      !this.editTeacherData.email.trim()
    ) {
      this.errorMessage = 'Please enter teacher name and email.';
      return;
    }

    this.isUpdating = true;

    const updateData = {
      name: this.editTeacherData.name,
      email: this.editTeacherData.email
    };

    this.http.put<any>(
      `${this.apiUrl}/${this.editTeacherData.id}`,
      updateData
    ).subscribe({

      next: (response) => {

        this.successMessage =
          response.message || 'Teacher updated successfully!';

        this.isUpdating = false;
        this.isEditing = false;

        this.editTeacherData = {
          id: 0,
          name: '',
          email: ''
        };

        this.loadTeachers();
        this.cdr.detectChanges();

      },

      error: (error) => {

        console.error('Update Teacher Error:', error);

        this.errorMessage =
          error.error?.message || 'Unable to update teacher.';

        this.isUpdating = false;
        this.cdr.detectChanges();

      }

    });

  }


  // CANCEL EDIT
  cancelEdit(): void {

    this.isEditing = false;

    this.editTeacherData = {
      id: 0,
      name: '',
      email: ''
    };

    this.errorMessage = '';
    this.successMessage = '';

    this.cdr.detectChanges();

  }


  // DELETE TEACHER
  deleteTeacher(teacher: any): void {

    const confirmed = window.confirm(
      `Are you sure you want to delete ${teacher.name}?`
    );

    if (!confirmed) {
      return;
    }

    this.successMessage = '';
    this.errorMessage = '';

    this.isDeletingId = teacher.id;

    this.http.delete<any>(
      `${this.apiUrl}/${teacher.id}`
    ).subscribe({

      next: (response) => {

        this.successMessage =
          response.message || 'Teacher deleted successfully!';

        this.isDeletingId = null;

        this.loadTeachers();
        this.cdr.detectChanges();

      },

      error: (error) => {

        console.error('Delete Teacher Error:', error);

        this.errorMessage =
          error.error?.message || 'Unable to delete teacher.';

        this.isDeletingId = null;
        this.cdr.detectChanges();

      }

    });

  }

}