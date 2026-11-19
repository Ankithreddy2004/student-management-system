import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { Attendance } from '../../services/attendance';

interface AttendanceRecord {
  id: number;
  attendance_date: string;
  status: 'Present' | 'Absent' | 'Late';
  remarks?: string;
  subject_id: number;
  subject_name: string;
  subject_code: string;
}

@Component({
  selector: 'app-student-attendance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-attendance.html',
  styleUrl: './student-attendance.css'
})
export class StudentAttendance implements OnInit {

  attendanceRecords: AttendanceRecord[] = [];

  isLoading = false;

  errorMessage = '';

  constructor(
    private attendanceService: Attendance,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAttendance();
  }

  loadAttendance(): void {

    this.isLoading = true;
    this.errorMessage = '';

    this.attendanceService.getMyAttendance().subscribe({

      next: (response: any) => {

        this.attendanceRecords = Array.isArray(response?.data)
          ? response.data
          : [];

        this.isLoading = false;

        this.cdr.markForCheck();
      },

      error: (error) => {

        console.error('Attendance loading error:', error);

        this.errorMessage =
          error?.error?.message ||
          'Unable to load attendance records.';

        this.isLoading = false;

        this.cdr.markForCheck();
      }

    });
  }

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

  get lateClasses(): number {
    return this.attendanceRecords.filter(
      record => record.status === 'Late'
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

  get attendanceChartBackground(): string {

    if (this.totalClasses === 0) {
      return '#e5e1ef';
    }

    const present =
      (this.presentClasses / this.totalClasses) * 100;

    const absentEnd =
      present + (this.absentClasses / this.totalClasses) * 100;

    return `conic-gradient(
      #22a06b 0% ${present}%,
      #e05252 ${present}% ${absentEnd}%,
      #f0ad4e ${absentEnd}% 100%
    )`;
  }

}