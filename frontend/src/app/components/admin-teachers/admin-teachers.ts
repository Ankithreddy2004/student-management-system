import { Component, OnInit } from '@angular/core';
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

  isLoading = false;
  isCreating = false;

  successMessage = '';
  errorMessage = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadTeachers();
  }

  // GET all users and filter teachers
  loadTeachers(): void {

    this.isLoading = true;
    this.errorMessage = '';

    this.http.get<any>(this.apiUrl).subscribe({

      next: (response) => {

        const users = response.users || response.data || [];

        this.teachers = users.filter(
          (user: any) => user.role === 'Teacher'
        );

        this.isLoading = false;

      },

      error: (error) => {

        console.error('Fetch Teachers Error:', error);

        this.errorMessage =
          error.error?.message || 'Unable to load teachers.';

        this.isLoading = false;

      }

    });

  }

  // CREATE teacher account
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
          response.message || 'Teacher account created successfully!';

        this.teacher = {
          name: '',
          email: '',
          password: ''
        };

        this.isCreating = false;

        this.loadTeachers();

      },

      error: (error) => {

        console.error('Create Teacher Error:', error);

        this.errorMessage =
          error.error?.message || 'Unable to create teacher account.';

        this.isCreating = false;

      }

    });

  }

}