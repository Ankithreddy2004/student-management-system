import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  forkJoin,
  of,
  timeout,
  catchError
} from 'rxjs';

import { Attendance } from '../../services/attendance';
import { Marks } from '../../services/marks';

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

  // Dashboard loading
  isLoading = true;

  // Attendance
  attendanceRecords: AttendanceRecord[] = [];
  attendanceError = '';

  // Marks
  marksRecords: MarkRecord[] = [];
  marksError = '';

  constructor(
    private attendanceService: Attendance,
    private marksService: Marks,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  // ==========================================
  // LOAD DASHBOARD DATA
  // ==========================================

  loadDashboardData(): void {

    this.isLoading = true;

    this.attendanceError = '';
    this.marksError = '';

    this.cdr.markForCheck();

    forkJoin({

      attendance: this.attendanceService
        .getMyAttendance()
        .pipe(
          timeout(15000),
          catchError(error => {

            console.error('Attendance Error:', error);

            this.attendanceError =
              error?.error?.message ||
              'Unable to load attendance information.';

            return of(null);
          })
        ),

      marks: this.marksService
        .getMyMarks()
        .pipe(
          timeout(15000),
          catchError(error => {

            console.error('Marks Error:', error);

            this.marksError =
              error?.error?.message ||
              'Unable to load marks information.';

            return of(null);
          })
        )

    }).subscribe({

      next: (response) => {

        // Attendance response
        if (response.attendance?.success === false) {

          this.attendanceError =
            response.attendance.message ||
            'Unable to load attendance information.';

        } else {

          this.attendanceRecords =
            Array.isArray(response.attendance?.data)
              ? response.attendance.data
              : [];

        }

        // Marks response
        if (response.marks?.success === false) {

          this.marksError =
            response.marks.message ||
            'Unable to load marks information.';

        } else {

          this.marksRecords =
            Array.isArray(response.marks?.data)
              ? response.marks.data
              : [];

        }

        this.isLoading = false;

        // Update Angular view after API response
        this.cdr.markForCheck();

      },

      error: (error) => {

        console.error('Dashboard Error:', error);

        this.isLoading = false;

        // Update Angular view after error
        this.cdr.markForCheck();

      }

    });

  }

  // ==========================================
  // TOTAL SUBJECTS
  // ==========================================

  get totalSubjects(): number {

    const subjectIds = new Set(
      this.marksRecords.map(record => record.subject_id)
    );

    return subjectIds.size;

  }

  // ==========================================
  // TOTAL CLASSES
  // ==========================================

  get totalClasses(): number {

    return this.attendanceRecords.length;

  }

  // ==========================================
  // AVERAGE MARKS
  // ==========================================

  get averageMarks(): number {

    if (this.marksRecords.length === 0) {
      return 0;
    }

    const validRecords = this.marksRecords.filter(
      record => Number(record.max_marks) > 0
    );

    if (validRecords.length === 0) {
      return 0;
    }

    const totalObtained = validRecords.reduce(
      (total, record) =>
        total + Number(record.obtained_marks || 0),
      0
    );

    const totalMaximum = validRecords.reduce(
      (total, record) =>
        total + Number(record.max_marks || 0),
      0
    );

    if (totalMaximum === 0) {
      return 0;
    }

    return Math.round(
      (totalObtained / totalMaximum) * 100
    );

  }

}
