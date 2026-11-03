import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { Auth } from '../../services/auth';
import { Student as StudentService } from '../../services/student';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-dashboard.html',
  styleUrl: './student-dashboard.css'
})
export class StudentDashboard implements OnInit {

  student: any = null;

  isLoading = true;
  errorMessage = '';

  constructor(
    private authService: Auth,
    private studentService: StudentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadStudentDetails();
  }

  // Fetch logged-in student's details
  loadStudentDetails(): void {

    const user = this.authService.getUser();

    if (!user || !user.student_id) {
      this.errorMessage = 'Student information not found.';
      this.isLoading = false;
      return;
    }

    this.studentService.getStudentById(user.student_id).subscribe({

      next: (response: any) => {

        this.isLoading = false;

        if (response.success === false) {
          this.errorMessage = response.message || 'Unable to fetch student details.';
          return;
        }

        this.student =
          response.data ||
          response.student ||
          response;

      },

      error: (error) => {

        this.isLoading = false;

        this.errorMessage =
          error.error?.message ||
          'Unable to load student details. Please try again.';

        console.error('Student Details Error:', error);

      }

    });

  }

  // Logout
  logout(): void {

    this.authService.logout();

    this.router.navigate(['/login']);

  }

}