import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { Auth } from '../../services/auth';
import { Student } from '../../services/student';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboard implements OnInit {

  adminName = '';

  totalStudents = 0;
  activeStudents = 0;
  inactiveStudents = 0;
  totalTeachers = 0;

  isLoading = true;
  errorMessage = '';

  constructor(
    private authService: Auth,
    private studentService: Student,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {

    const user = this.authService.getUser();

    if (user) {
      this.adminName = user.name;
    }

    this.loadDashboardData();
  }

  loadDashboardData(): void {

    // Fetch students
    this.studentService.getStudents().subscribe({

      next: (response: any) => {

        const students = response.data || [];

        this.totalStudents = students.length;

        this.activeStudents = students.filter(
          (student: any) => student.status === 'Active'
        ).length;

        this.inactiveStudents = students.filter(
          (student: any) => student.status === 'Inactive'
        ).length;

        this.checkLoadingComplete();

      },

      error: (error) => {

        console.error('Student loading error:', error);

        this.errorMessage = 'Unable to load student information.';

        this.checkLoadingComplete();

      }

    });

    // Fetch teachers
    this.http.get<any>('http://localhost:5000/api/users').subscribe({

      next: (response) => {

        const users = response.data || [];

        this.totalTeachers = users.filter(
          (user: any) => user.role === 'Teacher'
        ).length;

        this.checkLoadingComplete();

      },

      error: (error) => {

        console.error('Teacher loading error:', error);

        this.checkLoadingComplete();

      }

    });

  }

  private completedRequests = 0;

  private checkLoadingComplete(): void {

    this.completedRequests++;

    if (this.completedRequests >= 2) {
      this.isLoading = false;
    }

  }

  logout(): void {

    this.authService.logout();

    this.router.navigate(['/login']);

  }

}