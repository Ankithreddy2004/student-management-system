import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

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

  // Student statistics
  totalStudents = 0;
  activeStudents = 0;
  inactiveStudents = 0;
  pendingStudents = 0;

  // Loading states
  isLoading = false;
  pendingLoading = false;

  // Error messages
  errorMessage = '';
  pendingErrorMessage = '';

  constructor(
    private authService: Auth,
    private studentService: Student,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  // =====================================
  // INITIALIZE DASHBOARD
  // =====================================

  ngOnInit(): void {

    const user = this.authService.getUser();

    if (user) {
      this.teacherName = user.name;
    }

    this.loadDashboardData();
    this.loadPendingStudents();

  }


  // =====================================
  // LOAD STUDENT STATISTICS
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
  // LOAD PENDING STUDENT COUNT
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

        console.log(
          'Updated Pending Count:',
          this.pendingStudents
        );

        console.log(
          'Updated Pending Loading:',
          this.pendingLoading
        );

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
  // OPEN PENDING STUDENT REQUESTS
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

}
