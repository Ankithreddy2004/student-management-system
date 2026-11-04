import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { forkJoin, finalize } from 'rxjs';

import { Attendance } from '../../services/attendance';

@Component({
  selector: 'app-teacher-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './teacher-attendance.html',
  styleUrl: './teacher-attendance.css'
})
export class TeacherAttendance implements OnInit {

  subjects: any[] = [];
  students: any[] = [];

  selectedSubjectId: number | null = null;
  selectedDate: string = this.getTodayDate();

  isLoadingSubjects = false;
  isLoading = false;
  isSaving = false;

  errorMessage = '';
  successMessage = '';

  showAttendanceRecords = false;

  constructor(
    private attendanceService: Attendance,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSubjects();
  }

  // Get today's date in YYYY-MM-DD format
  getTodayDate(): string {

    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  // Load subjects assigned to teacher
  loadSubjects(): void {

    if (this.isLoadingSubjects) {
      return;
    }

    this.isLoadingSubjects = true;
    this.errorMessage = '';

    this.attendanceService.getTeacherSubjects()
      .pipe(
        finalize(() => {
          this.isLoadingSubjects = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({

        next: (response) => {

          this.subjects = response.data || [];

          console.log('Teacher Subjects:', this.subjects);

          if (this.subjects.length === 0) {
            this.errorMessage =
              'No subjects have been assigned to you.';
          }

          this.cdr.detectChanges();
        },

        error: (error) => {

          console.error('Subject Loading Error:', error);

          this.errorMessage =
            error.error?.message || 'Unable to load subjects.';

          this.cdr.detectChanges();
        }

      });

  }

  // Handle subject selection
  onSubjectChange(event: Event): void {

    const value = (event.target as HTMLSelectElement).value;

    this.selectedSubjectId = value ? Number(value) : null;

    this.students = [];
    this.showAttendanceRecords = false;

    this.errorMessage = '';
    this.successMessage = '';

    this.cdr.detectChanges();
  }

  // Handle date selection
  onDateChange(): void {

    this.students = [];
    this.showAttendanceRecords = false;

    this.errorMessage = '';
    this.successMessage = '';

    this.cdr.detectChanges();
  }

  // Load all active students and existing attendance
  loadStudents(): void {

    if (this.isLoading || this.isSaving) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.students = [];
    this.showAttendanceRecords = false;

    if (!this.selectedSubjectId) {
      this.errorMessage = 'Please select a subject first.';
      return;
    }

    if (!this.selectedDate) {
      this.errorMessage = 'Please select an attendance date.';
      return;
    }

    this.isLoading = true;

    this.cdr.detectChanges();

    forkJoin({

      studentsResponse:
        this.attendanceService.getStudentsForAttendance(
          this.selectedSubjectId
        ),

      attendanceResponse:
        this.attendanceService.getTeacherAttendanceRecords(
          this.selectedSubjectId,
          this.selectedDate
        )

    })
    .pipe(
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    )
    .subscribe({

      next: ({ studentsResponse, attendanceResponse }) => {

        const studentList = studentsResponse.data || [];
        const attendanceList = attendanceResponse.data || [];

        // Match existing attendance with students
        this.students = studentList.map((student: any) => {

          const existingRecord = attendanceList.find(
            (record: any) =>
              Number(record.student_id) === Number(student.id)
          );

          return {

            ...student,

            attendanceId: existingRecord
              ? existingRecord.attendance_id
              : null,

            status: existingRecord
              ? existingRecord.status
              : '',

            remarks: existingRecord
              ? existingRecord.remarks || ''
              : '',

            originalStatus: existingRecord
              ? existingRecord.status
              : '',

            originalRemarks: existingRecord
              ? existingRecord.remarks || ''
              : ''

          };

        });

        console.log('Loaded Students:', this.students);

        if (this.students.length === 0) {
          this.errorMessage =
            'No active students found for this subject.';
        }

        this.cdr.detectChanges();
      },

      error: (error) => {

        console.error('Load Students Error:', error);

        this.errorMessage =
          error.error?.message ||
          'Unable to load students and attendance.';

        this.cdr.detectChanges();
      }

    });

  }

  // View only saved attendance records
  viewAttendance(): void {

    if (this.isLoading || this.isSaving) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.students = [];
    this.showAttendanceRecords = true;

    if (!this.selectedSubjectId) {
      this.errorMessage = 'Please select a subject first.';
      this.showAttendanceRecords = false;
      return;
    }

    if (!this.selectedDate) {
      this.errorMessage = 'Please select an attendance date.';
      this.showAttendanceRecords = false;
      return;
    }

    this.isLoading = true;

    this.cdr.detectChanges();

    this.attendanceService
      .getTeacherAttendanceRecords(
        this.selectedSubjectId,
        this.selectedDate
      )
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({

        next: (response) => {

          const records = response.data || [];

          this.students = records.map((record: any) => ({

            id: record.student_id,

            name: record.student_name,

            email: record.email,

            attendanceId: record.attendance_id,

            status: record.status,

            remarks: record.remarks || '',

            originalStatus: record.status,

            originalRemarks: record.remarks || ''

          }));

          console.log(
            'Saved Attendance Records:',
            this.students
          );

          if (this.students.length === 0) {
            this.successMessage =
              'No attendance records found for this subject and date.';
          }

          this.cdr.detectChanges();
        },

        error: (error) => {

          console.error('View Attendance Error:', error);

          this.errorMessage =
            error.error?.message ||
            'Unable to load attendance records.';

          this.cdr.detectChanges();
        }

      });

  }

  // Save new attendance and update existing records
  saveAttendance(): void {

    if (this.isSaving || this.isLoading) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    if (!this.selectedSubjectId || !this.selectedDate) {
      this.errorMessage =
        'Please select a subject and date.';
      return;
    }

    if (this.students.length === 0) {
      this.errorMessage =
        'Please load students first.';
      return;
    }

    // Validate attendance status
    const invalidStudent = this.students.find(
      student => !student.status
    );

    if (invalidStudent) {

      this.errorMessage =
        `Please select attendance status for ${invalidStudent.name}.`;

      return;
    }

    // Identify new attendance records
    const newStudents = this.students.filter(
      student => !student.attendanceId
    );

    // Identify modified attendance records
    const updatedStudents = this.students.filter(
      student =>
        student.attendanceId &&
        (
          student.status !== student.originalStatus ||
          student.remarks !== student.originalRemarks
        )
    );

    // Check whether anything changed
    if (
      newStudents.length === 0 &&
      updatedStudents.length === 0
    ) {

      this.successMessage =
        'Attendance is already up to date.';

      return;
    }

    const requests: any[] = [];

    // Insert new attendance records
    if (newStudents.length > 0) {

      const payload = {

        subject_id: this.selectedSubjectId,

        attendance_date: this.selectedDate,

        students: newStudents.map(student => ({

          student_id: student.id,

          status: student.status,

          remarks: student.remarks || null

        }))

      };

      console.log('New Attendance Payload:', payload);

      requests.push(
        this.attendanceService.markAttendance(payload)
      );

    }

    // Update existing attendance records
    updatedStudents.forEach(student => {

      const payload = {

        status: student.status,

        remarks: student.remarks || null

      };

      console.log(
        'Updating Attendance:',
        student.attendanceId,
        payload
      );

      requests.push(

        this.attendanceService.editAttendance(
          student.attendanceId,
          payload
        )

      );

    });

    this.isSaving = true;

    this.cdr.detectChanges();

    forkJoin(requests)
      .pipe(
        finalize(() => {
          this.isSaving = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({

        next: () => {

          this.successMessage =
            'Attendance saved and updated successfully.';

          // Refresh the current page after saving
          if (this.showAttendanceRecords) {
            this.viewAttendance();
          } else {
            this.loadStudents();
          }

          this.cdr.detectChanges();
        },

        error: (error) => {

          console.error('Save Attendance Error:', error);

          this.errorMessage =
            error.error?.message ||
            'Unable to save attendance.';

          this.cdr.detectChanges();
        }

      });

  }

}
