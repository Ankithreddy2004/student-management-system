import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { Auth } from '../../services/auth';
import { Student } from '../../services/student';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './teacher-dashboard.html',
  styleUrl: './teacher-dashboard.css'
})
export class TeacherDashboard implements OnInit {

  teacherName = '';

  totalStudents = 0;
  activeStudents = 0;
  inactiveStudents = 0;

  isLoading = true;
  errorMessage = '';

  constructor(
    private authService: Auth,
    private studentService: Student,
    private router: Router
  ) {}

  ngOnInit(): void {

    const user = this.authService.getUser();

    if (user) {
      this.teacherName = user.name;
    }

    this.loadDashboardData();

  }

  loadDashboardData(): void {

    this.studentService.getStudents().subscribe({

      next: (response: any) => {

        this.isLoading = false;

        const students = response.data || [];

        this.totalStudents = students.length;

        this.activeStudents = students.filter(
          (student: any) => student.status === 'Active'
        ).length;

        this.inactiveStudents = students.filter(
          (student: any) => student.status === 'Inactive'
        ).length;

      },

      error: (error) => {

        this.isLoading = false;

        this.errorMessage =
          error.error?.message || 'Unable to load dashboard data.';

        console.error(error);

      }

    });

  }

  logout(): void {

    this.authService.logout();

    this.router.navigate(['/login']);

  }

}