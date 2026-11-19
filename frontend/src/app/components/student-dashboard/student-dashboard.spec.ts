import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Auth } from '../../services/auth';
import { Student as StudentService } from '../../services/student';
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

interface StudentProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  course: string;
  status: string;
}

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './student-dashboard.html',
  styleUrl: './student-dashboard.css'
})
export class StudentDashboard implements OnInit {

  student: StudentProfile | null = null;

  attendanceRecords: AttendanceRecord[] = [];

  marksRecords: MarkRecord[] = [];

  isLoading = true;

  errorMessage = '';

  constructor(
    private authService: Auth,
    private studentService: StudentService,
    private attendanceService: Attendance,
    private marksService: Marks
  ) {}

  ngOnInit(): void {

    this.loadDashboardData();

  }

  loadDashboardData(): void {

    const user = this.authService.getUser();

    if (!user || user.role !== 'Student' || !user.student_id) {

      this.errorMessage = 'Student information not found.';

      this.isLoading = false;

      return;

    }

    const studentId = user.student_id;

    this.isLoading = true;

    // LOAD STUDENT PROFILE

    this.studentService.getStudentById(studentId).subscribe({

      next: (response: any) => {

        const data =
          response?.data?.student ||
          response?.data ||
          response?.student ||
          response;

        if (data && data.id) {

          this.student = data;

        }

        this.isLoading = false;

      },

      error: (error) => {

        console.error('Student profile error:', error);

        this.isLoading = false;

      }

    });


    // LOAD ATTENDANCE

    this.attendanceService.getMyAttendance().subscribe({

      next: (response: any) => {

        this.attendanceRecords = Array.isArray(response?.data)
          ? response.data
          : [];

      },

      error: (error) => {

        console.error('Attendance error:', error);

      }

    });


    // LOAD MARKS

    this.marksService.getMyMarks().subscribe({

      next: (response: any) => {

        this.marksRecords = Array.isArray(response?.data)
          ? response.data
          : [];

      },

      error: (error) => {

        console.error('Marks error:', error);

      }

    });

  }

  get totalSubjects(): number {

    return new Set(
      this.marksRecords.map(mark => mark.subject_id)
    ).size;

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

  get averageMarks(): number {

    if (this.marksRecords.length === 0) {
      return 0;
    }

    const totalPercentage = this.marksRecords.reduce(
      (total, mark) => {

        if (!mark.max_marks || mark.max_marks <= 0) {
          return total;
        }

        return total +
          (Number(mark.obtained_marks) /
          Number(mark.max_marks)) * 100;

      },
      0
    );

    return Math.round(
      totalPercentage / this.marksRecords.length
    );

  }

  get attendanceChartBackground(): string {

    if (this.totalClasses === 0) {
      return '#e5e1ef';
    }

    const present = (this.presentClasses / this.totalClasses) * 100;

    const absentEnd =
      present + (this.absentClasses / this.totalClasses) * 100;

    return `conic-gradient(
      #22a06b 0% ${present}%,
      #e05252 ${present}% ${absentEnd}%,
      #f0ad4e ${absentEnd}% 100%
    )`;

  }

  get subjectPerformance(): any[] {

    const subjects = new Map<number, any>();

    this.marksRecords.forEach(mark => {

      const subjectId = mark.subject_id;

      if (!subjects.has(subjectId)) {

        subjects.set(subjectId, {
          subject_name: mark.subject_name,
          totalPercentage: 0,
          count: 0
        });

      }

      const subject = subjects.get(subjectId);

      if (Number(mark.max_marks) > 0) {

        subject.totalPercentage +=
          (Number(mark.obtained_marks) /
          Number(mark.max_marks)) * 100;

        subject.count++;

      }

    });

    return Array.from(subjects.values()).map(subject => {

      const percentage = subject.count
        ? Math.round(subject.totalPercentage / subject.count)
        : 0;

      return {
        subject_name: subject.subject_name,
        percentage
      };

    });

  }

  get studentStatus(): string {

    return this.student?.status || 'Unknown';

  }

}