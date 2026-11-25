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


  // =========================================
  // PAGINATION
  // =========================================

  currentPage = 1;
  pageSize = 5;

  pageSizeOptions = [5, 10, 20];

  get totalPages(): number {

    if (this.students.length === 0) {
      return 0;
    }

    return Math.ceil(this.students.length / this.pageSize);

  }

  get displayedPage(): number {

    return this.students.length === 0 ? 0 : this.currentPage;

  }

  get paginatedStudents(): any[] {

    const startIndex = (this.currentPage - 1) * this.pageSize;

    const endIndex = startIndex + this.pageSize;

    return this.students.slice(startIndex, endIndex);

  }


  // =========================================
  // CONSTRUCTOR
  // =========================================

  constructor(
    private attendanceService: Attendance,
    private cdr: ChangeDetectorRef
  ) {}


  // =========================================
  // INITIALIZATION
  // =========================================

  ngOnInit(): void {

    this.loadSubjects();

  }


  // =========================================
  // GET TODAY'S DATE
  // =========================================

  getTodayDate(): string {

    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;

  }


  // =========================================
  // RESET PAGINATION
  // =========================================

  resetPagination(): void {

    this.currentPage = 1;

  }


  // =========================================
  // PREVIOUS PAGE
  // =========================================

  previousPage(): void {

    if (this.currentPage > 1) {

      this.currentPage--;

      this.cdr.detectChanges();

    }

  }


  // =========================================
  // NEXT PAGE
  // =========================================

  nextPage(): void {

    if (this.currentPage < this.totalPages) {

      this.currentPage++;

      this.cdr.detectChanges();

    }

  }


  // =========================================
  // CHANGE PAGE SIZE
  // =========================================

  onPageSizeChange(): void {

    this.currentPage = 1;

    this.cdr.detectChanges();

  }


  // =========================================
  // LOAD TEACHER SUBJECTS
  // =========================================

  loadSubjects(): void {

    if (this.isLoadingSubjects) {
      return;
    }

    this.isLoadingSubjects = true;

    this.errorMessage = '';

    this.cdr.detectChanges();

    this.attendanceService.getTeacherSubjects()
      .pipe(

        finalize(() => {

          this.isLoadingSubjects = false;

          this.cdr.detectChanges();

        })

      )
      .subscribe({

        next: (response: any) => {

          this.subjects = response?.data || [];

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
            error?.error?.message ||
            'Unable to load subjects.';

          this.cdr.detectChanges();

        }

      });

  }


  // =========================================
  // SUBJECT CHANGE
  // =========================================

  onSubjectChange(event: Event): void {

    const value = (event.target as HTMLSelectElement).value;

    this.selectedSubjectId = value ? Number(value) : null;

    this.students = [];

    this.resetPagination();

    this.showAttendanceRecords = false;

    this.errorMessage = '';
    this.successMessage = '';

    this.cdr.detectChanges();

  }


  // =========================================
  // DATE CHANGE
  // =========================================

  onDateChange(): void {

    this.students = [];

    this.resetPagination();

    this.showAttendanceRecords = false;

    this.errorMessage = '';
    this.successMessage = '';

    this.cdr.detectChanges();

  }


  // =========================================
  // LOAD STUDENTS
  // =========================================

  loadStudents(): void {

    if (
      this.isLoading ||
      this.isSaving ||
      this.isLoadingSubjects
    ) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.students = [];

    this.resetPagination();

    this.showAttendanceRecords = false;

    // Validate subject

    if (!this.selectedSubjectId) {

      this.errorMessage = 'Please select a subject first.';

      this.cdr.detectChanges();

      return;

    }

    // Validate date

    if (!this.selectedDate) {

      this.errorMessage = 'Please select an attendance date.';

      this.cdr.detectChanges();

      return;

    }

    this.isLoading = true;

    this.cdr.detectChanges();

    const subjectId = this.selectedSubjectId;

    const attendanceDate = this.selectedDate;


    // Fetch students and attendance records together

    forkJoin({

      studentsResponse:
        this.attendanceService.getStudentsForAttendance(
          subjectId
        ),

      attendanceResponse:
        this.attendanceService.getTeacherAttendanceRecords(
          subjectId,
          attendanceDate
        )

    })
    .pipe(

      finalize(() => {

        // Stop loading after API requests finish

        this.isLoading = false;

        // Update the Angular view

        this.cdr.detectChanges();

      })

    )
    .subscribe({

      next: ({ studentsResponse, attendanceResponse }: any) => {

        const studentList = studentsResponse?.data || [];

        const attendanceList = attendanceResponse?.data || [];

        console.log('API Student Response:', studentList);

        console.log('API Attendance Response:', attendanceList);


        // Match saved attendance with students

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


        // Reset pagination

        this.resetPagination();


        // Debug information

        console.log('Loaded Students:', this.students);

        console.log('Student count:', this.students.length);

        console.log('Paginated Students:', this.paginatedStudents);


        // Empty student validation

        if (this.students.length === 0) {

          this.errorMessage =
            'No active students found for this subject.';

        }


        // Force UI refresh

        this.cdr.detectChanges();

      },

      error: (error) => {

        console.error('Load Students Error:', error);

        this.errorMessage =
          error?.error?.message ||
          'Unable to load students and attendance.';

        this.cdr.detectChanges();

      }

    });

  }


  // =========================================
  // VIEW ATTENDANCE
  // =========================================

  viewAttendance(): void {

    if (
      this.isLoading ||
      this.isSaving ||
      this.isLoadingSubjects
    ) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.students = [];

    this.resetPagination();

    this.showAttendanceRecords = true;


    // Validate subject

    if (!this.selectedSubjectId) {

      this.errorMessage = 'Please select a subject first.';

      this.showAttendanceRecords = false;

      this.cdr.detectChanges();

      return;

    }


    // Validate date

    if (!this.selectedDate) {

      this.errorMessage = 'Please select an attendance date.';

      this.showAttendanceRecords = false;

      this.cdr.detectChanges();

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

        next: (response: any) => {

          const records = response?.data || [];


          // Convert attendance records into student rows

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


          this.resetPagination();


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
            error?.error?.message ||
            'Unable to load attendance records.';

          this.cdr.detectChanges();

        }

      });

  }


  // =========================================
  // SAVE ATTENDANCE
  // =========================================

  saveAttendance(): void {

    if (this.isSaving || this.isLoading) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';


    // Validate subject and date

    if (!this.selectedSubjectId || !this.selectedDate) {

      this.errorMessage =
        'Please select a subject and date.';

      this.cdr.detectChanges();

      return;

    }


    // Validate students

    if (this.students.length === 0) {

      this.errorMessage =
        'Please load students first.';

      this.cdr.detectChanges();

      return;

    }


    // Validate attendance status for all students

    const invalidStudent = this.students.find(
      student => !student.status
    );

    if (invalidStudent) {

      this.errorMessage =
        `Please select attendance status for ${invalidStudent.name}.`;


      // Navigate to the page containing the invalid student

      const studentIndex = this.students.indexOf(invalidStudent);

      this.currentPage =
        Math.floor(studentIndex / this.pageSize) + 1;


      this.cdr.detectChanges();

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

      this.cdr.detectChanges();

      return;

    }


    const requests: any[] = [];


    // =====================================
    // INSERT NEW ATTENDANCE RECORDS
    // =====================================

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


    // =====================================
    // UPDATE EXISTING ATTENDANCE RECORDS
    // =====================================

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


    // Start saving

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

          // Release saving state before refreshing

          this.isSaving = false;

          this.successMessage =
            'Attendance saved and updated successfully.';


          // Refresh the currently displayed data

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
            error?.error?.message ||
            'Unable to save attendance.';

          this.cdr.detectChanges();

        }

      });

  }

}