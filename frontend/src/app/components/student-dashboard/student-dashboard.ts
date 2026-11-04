
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  imports: [CommonModule, FormsModule],
  templateUrl: './student-dashboard.html',
  styleUrl: './student-dashboard.css'
})
export class StudentDashboard implements OnInit {

  authUser: AuthUser | null = null;
  student: StudentProfile | null = null;

  // Profile
  isLoading = true;
  errorMessage = '';

  // Edit Profile
  isEditing = false;
  isSaving = false;
  profileSuccess = '';
  profileError = '';

  profileForm = {
    name: '',
    phone: '',
    course: ''
  };

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
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authUser = this.authService.getUser();

    this.loadStudentDetails();
    this.loadAttendance();
    this.loadMarks();
  }

  // ==========================================
  // LOAD STUDENT PROFILE
  // ==========================================

  loadStudentDetails(): void {

    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    if (
      !this.authUser ||
      this.authUser.role !== 'Student' ||
      !this.authUser.student_id
    ) {
      this.errorMessage = 'Student information not found.';
      this.isLoading = false;
      this.cdr.detectChanges();
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

            this.cdr.detectChanges();
            return;
          }

          const profile =
            response?.data?.student ||
            response?.data ||
            response?.student ||
            response;

          if (!profile || !profile.id) {
            this.errorMessage = 'Student profile data is unavailable.';
            this.cdr.detectChanges();
            return;
          }

          this.student = profile as StudentProfile;

          this.cdr.detectChanges();

          console.log('Student Profile Loaded:', this.student);
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

          this.cdr.detectChanges();
          console.error('Student Profile Error:', error);
        }
      });
  }

  // ==========================================
  // EDIT PROFILE
  // ==========================================

  get canEditProfile(): boolean {
    return this.student?.status === 'Active';
  }

  openEditProfile(): void {

    if (!this.student || !this.canEditProfile) {
      return;
    }

    this.profileForm = {
      name: this.student.name,
      phone: this.student.phone,
      course: this.student.course
    };

    this.profileSuccess = '';
    this.profileError = '';
    this.isEditing = true;

    this.cdr.detectChanges();
  }

  cancelEdit(): void {

    this.isEditing = false;
    this.profileError = '';
    this.profileSuccess = '';

    this.cdr.detectChanges();
  }

  saveProfile(): void {

    if (!this.student || !this.canEditProfile) {
      return;
    }

    const name = this.profileForm.name.trim();
    const phone = this.profileForm.phone.trim();
    const course = this.profileForm.course.trim();

    if (!name || !phone || !course) {
      this.profileError = 'All fields are required.';
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      this.profileError =
        'Phone number must contain exactly 10 digits.';
      return;
    }

    this.isSaving = true;
    this.profileError = '';
    this.profileSuccess = '';

    this.studentService.updateMyProfile({
      name,
      phone,
      course
    }).subscribe({

      next: (response: any) => {

        this.isSaving = false;

        if (!response || response.success === false) {
          this.profileError =
            response?.message || 'Unable to update profile.';

          this.cdr.detectChanges();
          return;
        }

        this.student = {
          ...this.student!,
          name,
          phone,
          course
        };

        if (this.authUser) {
          this.authUser.name = name;
        }

        this.profileSuccess = 'Profile updated successfully!';
        this.isEditing = false;

        this.cdr.detectChanges();
      },

      error: (error) => {

        this.isSaving = false;

        this.profileError =
          error.error?.message || 'Unable to update profile.';

        this.cdr.detectChanges();
        console.error('Profile Update Error:', error);
      }

    });
  }

  // ==========================================
  // LOAD ATTENDANCE
  // ==========================================

  loadAttendance(): void {

    this.attendanceLoading = true;
    this.attendanceError = '';
    this.cdr.detectChanges();

    this.attendanceService.getMyAttendance()
      .subscribe({

        next: (response: any) => {

          this.attendanceLoading = false;

          if (!response || response.success === false) {
            this.attendanceError =
              response?.message || 'Unable to fetch attendance.';

            this.cdr.detectChanges();
            return;
          }

          this.attendanceRecords = Array.isArray(response.data)
            ? response.data
            : [];

          this.cdr.detectChanges();

          console.log('Attendance Loaded:', this.attendanceRecords);
        },

        error: (error) => {

          this.attendanceLoading = false;

          this.attendanceError =
            error.error?.message || 'Unable to load attendance records.';

          this.cdr.detectChanges();
          console.error('Attendance Error:', error);
        }
      });
  }

  // ==========================================
  // LOAD MARKS
  // ==========================================

  loadMarks(): void {

    this.marksLoading = true;
    this.marksError = '';
    this.cdr.detectChanges();

    this.marksService.getMyMarks()
      .subscribe({

        next: (response: any) => {

          this.marksLoading = false;

          if (!response || response.success === false) {
            this.marksError =
              response?.message || 'Unable to fetch marks.';

            this.cdr.detectChanges();
            return;
          }

          this.marksRecords = Array.isArray(response.data)
            ? response.data
            : [];

          this.cdr.detectChanges();

          console.log('Marks Loaded:', this.marksRecords);
        },

        error: (error) => {

          this.marksLoading = false;

          this.marksError =
            error.error?.message || 'Unable to load marks records.';

          this.cdr.detectChanges();
          console.error('Marks Error:', error);
        }
      });
  }

  // ==========================================
  // ATTENDANCE SUMMARY
  // ==========================================

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

  // ==========================================
  // STUDENT STATUS
  // ==========================================

  get studentStatus(): StudentStatus | null {
    return this.student?.status || this.authUser?.status || null;
  }

  // ==========================================
  // LOGOUT
  // ==========================================

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

}
