import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { Auth } from '../../services/auth';
import { Admin } from '../../services/admin';

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
  pendingStudents = 0;

  totalTeachers = 0;
  totalSubjects = 0;
  totalAssignments = 0;

  isLoading = true;
  errorMessage = '';

  constructor(
    private authService: Auth,
    private adminService: Admin,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {

    const user = this.authService.getUser();

    if (user) {
      this.adminName = user.name;
    }

    this.loadDashboardData();

  }

  // =====================================
  // LOAD DASHBOARD STATISTICS
  // =====================================

  loadDashboardData(): void {

    this.isLoading = true;
    this.errorMessage = '';

    this.adminService.getDashboardStats().subscribe({

      next: (response: any) => {

        console.log('Admin Dashboard API Response:', response);

        const data = response.data;

        this.totalStudents = Number(data.total_students || 0);
        this.activeStudents = Number(data.active_students || 0);
        this.inactiveStudents = Number(data.inactive_students || 0);
        this.pendingStudents = Number(data.pending_students || 0);

        this.totalTeachers = Number(data.total_teachers || 0);
        this.totalSubjects = Number(data.total_subjects || 0);
        this.totalAssignments = Number(data.total_assignments || 0);

        this.isLoading = false;

        this.cdr.detectChanges();

      },

      error: (error) => {

        console.error('Dashboard API Error:', error);

        this.errorMessage =
          error.error?.message || 'Unable to load dashboard information.';

        this.isLoading = false;

        this.cdr.detectChanges();

      }

    });

  }

  // =====================================
  // REFRESH DASHBOARD
  // =====================================

  refreshDashboard(): void {

    this.loadDashboardData();

  }

  // =====================================
  // LOGOUT
  // =====================================

  logout(): void {

    this.authService.logout();

    this.router.navigate(['/login']);

  }

}