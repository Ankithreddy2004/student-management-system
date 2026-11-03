import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { timeout } from 'rxjs';

import { Auth, AuthUser, StudentStatus } from '../../services/auth';
import { Student as StudentService } from '../../services/student';
import { Attendance } from '../../services/attendance';
import { Marks } from '../../services/marks';

interface StudentProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  course: string;
  status: StudentStatus;
  created_at?: string;
}

interface AttendanceRecord {
  id: number;
  attendance_date: string;
  status: 'Present' | 'Absent' | 'Late';
  remarks?: string;
  subject_id: number;
  subject_name: string;
  subject_code: string;
}

interface MarkRecord {
  id: number;
  obtained_marks: number;
  remarks?: string;
  exam_id: number;
  exam_name: string;
  exam_type: string;
  exam_date: string;
  max_marks: number;
  subject_id: number;
  subject_name: string;
  subject_code: string;
}

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-dashboard.html',
  styleUrl: './student-dashboard.css'
})
export class StudentDashboard implements OnInit {

  authUser: AuthUser | null = null;
  student: StudentProfile | null = null;

  // Profile
  isLoading = true;
  errorMessage = '';

  // Attendance
  attendanceRecords: AttendanceRecord[] = [];
  attendanceLoading = true;
  attendanceError = '';

  // Marks
  marksRecords: MarkRecord[] = [];
  marksLoading = true;
  marksError = '';

  constructor(
    private authService: Auth,
    private studentService: StudentService,
    private attendanceService: Attendance,
    private marksService: Marks,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authUser = this.authService.getUser();

    this.loadStudentDetails();
    this.loadAttendance();
    this.loadMarks();
  }

  // Load student profile
  loadStudentDetails(): void {

    this.isLoading = true;
    this.errorMessage = '';
    this.student = null;

    if (
      !this.authUser ||
      this.authUser.role !== 'Student' ||
      !this.authUser.student_id
    ) {
      this.errorMessage = 'Student information not found.';
      this.isLoading = false;
      return;
    }

    const studentId = this.authUser.student_id;

    this.studentService.getStudentById(studentId)
      .pipe(timeout(15000))
      .subscribe({

        next: (response: any) => {

          this.isLoading = false;

          if (!response || response.success === false) {
            this.errorMessage =
              response?.message || 'Unable to fetch student details.';
            return;
          }

          const profile =
            response?.data?.student ||
            response?.data ||
            response?.student ||
            response;

          if (!profile || !profile.id) {
            this.errorMessage = 'Student profile data is unavailable.';
            return;
          }

          this.student = profile as StudentProfile;
        },

        error: (error) => {

          this.isLoading = false;

          if (error.name === 'TimeoutError') {
            this.errorMessage =
              'The server is taking too long to respond. Please try again.';
          } else {
            this.errorMessage =
              error.error?.message ||
              'Unable to load student details. Please try again.';
          }
        }
      });
  }

  // Load attendance records
  loadAttendance(): void {

    this.attendanceLoading = true;
    this.attendanceError = '';

    this.attendanceService.getMyAttendance()
      .subscribe({

        next: (response: any) => {

          this.attendanceLoading = false;

          if (!response || response.success === false) {
            this.attendanceError =
              response?.message || 'Unable to fetch attendance.';
            return;
          }

          this.attendanceRecords = response.data || [];
        },

        error: (error) => {

          this.attendanceLoading = false;

          this.attendanceError =
            error.error?.message || 'Unable to load attendance records.';
        }
      });
  }

  // Load marks records
  loadMarks(): void {

    this.marksLoading = true;
    this.marksError = '';

    this.marksService.getMyMarks()
      .subscribe({

        next: (response: any) => {

          this.marksLoading = false;

          if (!response || response.success === false) {
            this.marksError =
              response?.message || 'Unable to fetch marks.';
            return;
          }

          this.marksRecords = response.data || [];
        },

        error: (error) => {

          this.marksLoading = false;

          this.marksError =
            error.error?.message || 'Unable to load marks records.';
        }
      });
  }

  // Attendance summary
  get totalClasses(): number {
    return this.attendanceRecords.length;
  }

  get presentClasses(): number {
    return this.attendanceRecords.filter(
      record => record.status === 'Present'
    ).length;
  }

  get absentClasses(): number {
    return this.attendanceRecords.filter(
      record => record.status === 'Absent'
    ).length;
  }

  get attendancePercentage(): number {
    if (this.totalClasses === 0) {
      return 0;
    }

    return Math.round(
      (this.presentClasses / this.totalClasses) * 100
    );
  }

  // Get current student status
  get studentStatus(): StudentStatus | null {
    return this.student?.status || this.authUser?.status || null;
  }

  // Logout
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}