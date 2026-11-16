import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';

import { Auth } from '../../services/auth';
import { Student } from '../../services/student';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatIconModule
  ],
  templateUrl: './teacher-dashboard.html',
  styleUrl: './teacher-dashboard.css'
})
export class TeacherDashboard implements OnInit, OnDestroy {

  private userApiUrl = 'http://localhost:5000/api/users';

  teacherName = '';
  teacherImageUrl = '';

  totalStudents = 0;
  activeStudents = 0;
  inactiveStudents = 0;
  pendingStudents = 0;

  isLoading = false;
  pendingLoading = false;

  errorMessage = '';
  pendingErrorMessage = '';

  constructor(
    private authService: Auth,
    private studentService: Student,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

    const user = this.authService.getUser();

    if (user) {
      this.teacherName = user.name;

      // Load logged-in teacher's own profile photo
      this.loadTeacherImage(user.id);
    }

    this.loadDashboardData();
    this.loadPendingStudents();
  }

  // =====================================
  // LOAD LOGGED-IN TEACHER PROFILE IMAGE
  // =====================================

  loadTeacherImage(teacherId: number): void {

    const token = this.authService.getToken();

    if (!token || !teacherId) {
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.http.get(
      `${this.userApiUrl}/${teacherId}/profile-image`,
      {
        headers,
        responseType: 'blob'
      }
    ).subscribe({

      next: (blob) => {

        if (this.teacherImageUrl) {
          URL.revokeObjectURL(this.teacherImageUrl);
        }

        this.teacherImageUrl = URL.createObjectURL(blob);

        this.cdr.detectChanges();
      },

      error: (error) => {

        console.error('Teacher image loading failed:', error);

        this.teacherImageUrl = '';

        this.cdr.detectChanges();
      }

    });
  }

  // =====================================
  // LOAD DASHBOARD STATISTICS
  // =====================================

  loadDashboardData(): void {

    this.isLoading = true;
    this.errorMessage = '';

    this.studentService.getStudents().subscribe({

      next: (response: any) => {

        console.log('Dashboard API Response:', response);

        const students = Array.isArray(response.data)
          ? response.data
          : [];

        this.totalStudents = students.length;

        this.activeStudents = students.filter(
          (student: any) => student.status === 'Active'
        ).length;

        this.inactiveStudents = students.filter(
          (student: any) => student.status === 'Inactive'
        ).length;

        this.isLoading = false;

        this.cdr.detectChanges();

        console.log('Total Students:', this.totalStudents);
        console.log('Active Students:', this.activeStudents);
        console.log('Inactive Students:', this.inactiveStudents);

      },

      error: (error) => {

        console.error('Dashboard API Error:', error);

        this.isLoading = false;

        this.errorMessage =
          error.error?.message ||
          'Unable to load dashboard statistics.';

        this.cdr.detectChanges();

      }

    });
  }

  // =====================================
  // LOAD PENDING STUDENTS
  // =====================================

  loadPendingStudents(): void {

    this.pendingLoading = true;
    this.pendingErrorMessage = '';

    this.cdr.detectChanges();

    this.studentService.getPendingStudents().subscribe({

      next: (response: any) => {

        console.log('Pending API Response:', response);

        this.pendingStudents = Array.isArray(response.data)
          ? response.data.length
          : 0;

        this.pendingLoading = false;

        this.cdr.detectChanges();

        console.log('Updated Pending Count:', this.pendingStudents);

      },

      error: (error) => {

        console.error('Pending API Error:', error);

        this.pendingLoading = false;

        this.pendingErrorMessage =
          error.error?.message ||
          'Unable to fetch pending registrations.';

        this.cdr.detectChanges();

      }

    });
  }

  // =====================================
  // REFRESH DASHBOARD
  // =====================================

  refreshDashboard(): void {

    this.loadDashboardData();
    this.loadPendingStudents();

  }

  // =====================================
  // NAVIGATION
  // =====================================

  viewPendingRequests(): void {

    this.router.navigate(['/teacher/pending-students']);

  }

  // =====================================
  // LOGOUT
  // =====================================

  logout(): void {

    this.authService.logout();

    this.router.navigate(['/login']);

  }

  // =====================================
  // CLEANUP IMAGE URL
  // =====================================

  ngOnDestroy(): void {

    if (this.teacherImageUrl) {
      URL.revokeObjectURL(this.teacherImageUrl);
    }

  }

}