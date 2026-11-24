import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Marks } from '../../services/marks';

@Component({
  selector: 'app-teacher-marks',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './teacher-marks.html',
  styleUrl: './teacher-marks.css'
})
export class TeacherMarks implements OnInit {

  // ==========================================
  // DATA
  // ==========================================

  subjects: any[] = [];
  exams: any[] = [];
  students: any[] = [];
  marksRecords: any[] = [];

  selectedSubjectId: number | null = null;
  selectedExamId: number | null = null;


  // ==========================================
  // EXAM FORM
  // ==========================================

  showExamForm = false;
  isEditingExam = false;
  editingExamId: number | null = null;

  examForm = {
    exam_name: '',
    exam_type: 'Internal',
    exam_date: '',
    max_marks: 30
  };

  showRecords = false;


  // ==========================================
  // LOADING STATES
  // ==========================================

  isLoadingSubjects = false;
  isLoadingExams = false;
  isLoadingStudents = false;
  isLoadingRecords = false;
  isSaving = false;


  // ==========================================
  // MESSAGES
  // ==========================================

  errorMessage = '';
  successMessage = '';


  // ==========================================
  // TABLE PAGINATION
  // ==========================================

  pageSize = 5;

  studentPage = 1;
  recordsPage = 1;


  constructor(
    private marksService: Marks,
    private cdr: ChangeDetectorRef
  ) {}


  // ==========================================
  // SELECTED EXAM
  // ==========================================

  get selectedExam(): any {
    return this.exams.find(
      exam =>
        Number(exam.id) === Number(this.selectedExamId)
    );
  }


  // ==========================================
  // STUDENT TABLE PAGINATION
  // ==========================================

  get paginatedStudents(): any[] {

    const start = (this.studentPage - 1) * this.pageSize;

    return this.students.slice(
      start,
      start + this.pageSize
    );
  }

  get totalStudentPages(): number {

    return Math.ceil(
      this.students.length / this.pageSize
    );
  }

  get studentStart(): number {

    return this.students.length === 0
      ? 0
      : (this.studentPage - 1) * this.pageSize + 1;
  }

  get studentEnd(): number {

    return Math.min(
      this.studentPage * this.pageSize,
      this.students.length
    );
  }

  previousStudentPage(): void {

    if (this.studentPage > 1) {
      this.studentPage--;
    }
  }

  nextStudentPage(): void {

    if (this.studentPage < this.totalStudentPages) {
      this.studentPage++;
    }
  }


  // ==========================================
  // SAVED MARKS TABLE PAGINATION
  // ==========================================

  get paginatedMarksRecords(): any[] {

    const start = (this.recordsPage - 1) * this.pageSize;

    return this.marksRecords.slice(
      start,
      start + this.pageSize
    );
  }

  get totalRecordsPages(): number {

    return Math.ceil(
      this.marksRecords.length / this.pageSize
    );
  }

  get recordsStart(): number {

    return this.marksRecords.length === 0
      ? 0
      : (this.recordsPage - 1) * this.pageSize + 1;
  }

  get recordsEnd(): number {

    return Math.min(
      this.recordsPage * this.pageSize,
      this.marksRecords.length
    );
  }

  previousRecordsPage(): void {

    if (this.recordsPage > 1) {
      this.recordsPage--;
    }
  }

  nextRecordsPage(): void {

    if (this.recordsPage < this.totalRecordsPages) {
      this.recordsPage++;
    }
  }


  // ==========================================
  // INITIALIZATION
  // ==========================================

  ngOnInit(): void {

    this.loadSubjects();

  }


  // ==========================================
  // LOAD TEACHER SUBJECTS
  // ==========================================

  loadSubjects(): void {

    this.isLoadingSubjects = true;
    this.errorMessage = '';

    this.cdr.detectChanges();

    this.marksService.getTeacherSubjects().subscribe({

      next: (response: any) => {

        this.subjects = Array.isArray(response.data)
          ? response.data
          : [];

        this.isLoadingSubjects = false;

        this.cdr.detectChanges();

        console.log('Teacher subjects:', this.subjects);

      },

      error: (error: any) => {

        console.error('Error loading subjects:', error);

        this.errorMessage =
          error.error?.message || 'Failed to load subjects.';

        this.isLoadingSubjects = false;

        this.cdr.detectChanges();

      }

    });

  }


  // ==========================================
  // SUBJECT CHANGE
  // ==========================================

  onSubjectChange(): void {

    this.exams = [];
    this.students = [];
    this.marksRecords = [];

    this.selectedExamId = null;

    this.showRecords = false;
    this.showExamForm = false;

    this.studentPage = 1;
    this.recordsPage = 1;

    this.clearMessages();

    if (!this.selectedSubjectId) {

      this.cdr.detectChanges();

      return;

    }

    this.loadExams();

    this.cdr.detectChanges();

  }


  // ==========================================
  // LOAD EXAMS
  // ==========================================

  loadExams(): void {

    if (!this.selectedSubjectId) {
      return;
    }

    this.isLoadingExams = true;
    this.errorMessage = '';

    this.marksService
      .getExamsBySubject(this.selectedSubjectId)
      .subscribe({

        next: (response: any) => {

          this.exams = Array.isArray(response.data)
            ? response.data
            : [];

          this.isLoadingExams = false;

          this.cdr.detectChanges();

          console.log('Exams:', this.exams);

        },

        error: (error: any) => {

          console.error('Error loading exams:', error);

          this.errorMessage =
            error.error?.message || 'Failed to load examinations.';

          this.isLoadingExams = false;

          this.cdr.detectChanges();

        }

      });

  }


  // ==========================================
  // OPEN EXAM FORM
  // ==========================================

  openExamForm(): void {

    this.showExamForm = true;

    this.isEditingExam = false;
    this.editingExamId = null;

    this.examForm = {
      exam_name: '',
      exam_type: 'Internal',
      exam_date: '',
      max_marks: 30
    };

    this.clearMessages();

    this.cdr.detectChanges();

  }


  // ==========================================
  // CREATE EXAM
  // ==========================================

  saveExam(): void {

    if (!this.selectedSubjectId) {

      this.errorMessage = 'Please select a subject.';

      return;

    }

    if (!this.examForm.exam_name.trim()) {

      this.errorMessage = 'Please enter examination name.';

      return;

    }

    if (!this.examForm.exam_type) {

      this.errorMessage = 'Please select examination type.';

      return;

    }

    if (
      !this.examForm.max_marks ||
      Number(this.examForm.max_marks) <= 0
    ) {

      this.errorMessage = 'Maximum marks must be greater than zero.';

      return;

    }

    const payload = {

      subject_id: this.selectedSubjectId,

      exam_name: this.examForm.exam_name.trim(),

      exam_type: this.examForm.exam_type,

      exam_date: this.examForm.exam_date || null,

      max_marks: Number(this.examForm.max_marks)

    };

    this.isSaving = true;

    this.clearMessages();

    this.marksService.createExam(payload).subscribe({

      next: (response: any) => {

        this.successMessage =
          response.message || 'Examination created successfully.';

        this.showExamForm = false;

        this.isSaving = false;

        this.loadExams();

        this.cdr.detectChanges();

      },

      error: (error: any) => {

        console.error('Error creating exam:', error);

        this.errorMessage =
          error.error?.message || 'Failed to create examination.';

        this.isSaving = false;

        this.cdr.detectChanges();

      }

    });

  }


  // ==========================================
  // EDIT EXAM
  // ==========================================

  editExam(exam: any): void {

    this.showExamForm = true;

    this.isEditingExam = true;

    this.editingExamId = exam.id;

    this.examForm = {

      exam_name: exam.exam_name || '',

      exam_type: exam.exam_type || 'Internal',

      exam_date: exam.exam_date
        ? exam.exam_date.substring(0, 10)
        : '',

      max_marks: Number(exam.max_marks) || 30

    };

    this.clearMessages();

    this.cdr.detectChanges();

  }


  // ==========================================
  // UPDATE EXAM
  // ==========================================

  updateExam(): void {

    if (!this.editingExamId) {
      return;
    }

    if (!this.examForm.exam_name.trim()) {

      this.errorMessage = 'Please enter examination name.';

      return;

    }

    if (
      !this.examForm.max_marks ||
      Number(this.examForm.max_marks) <= 0
    ) {

      this.errorMessage = 'Maximum marks must be greater than zero.';

      return;

    }

    const payload = {

      exam_name: this.examForm.exam_name.trim(),

      exam_type: this.examForm.exam_type,

      exam_date: this.examForm.exam_date || null,

      max_marks: Number(this.examForm.max_marks)

    };

    this.isSaving = true;

    this.clearMessages();

    this.marksService
      .updateExam(this.editingExamId, payload)
      .subscribe({

        next: (response: any) => {

          this.successMessage =
            response.message || 'Examination updated successfully.';

          this.showExamForm = false;

          this.isEditingExam = false;

          this.editingExamId = null;

          this.isSaving = false;

          this.loadExams();

          this.cdr.detectChanges();

        },

        error: (error: any) => {

          console.error('Error updating exam:', error);

          this.errorMessage =
            error.error?.message || 'Failed to update examination.';

          this.isSaving = false;

          this.cdr.detectChanges();

        }

      });

  }


  // ==========================================
  // DELETE EXAM
  // ==========================================

  deleteExam(examId: number): void {

    const confirmed = confirm(
      'Are you sure you want to delete this examination?'
    );

    if (!confirmed) {
      return;
    }

    this.clearMessages();

    this.marksService.deleteExam(examId).subscribe({

      next: (response: any) => {

        this.successMessage =
          response.message || 'Examination deleted successfully.';

        this.selectedExamId = null;

        this.students = [];
        this.marksRecords = [];

        this.showRecords = false;

        this.studentPage = 1;
        this.recordsPage = 1;

        this.loadExams();

        this.cdr.detectChanges();

      },

      error: (error: any) => {

        console.error('Error deleting exam:', error);

        this.errorMessage =
          error.error?.message || 'Failed to delete examination.';

        this.cdr.detectChanges();

      }

    });

  }


  // ==========================================
  // LOAD STUDENTS
  // ==========================================

  loadStudents(): void {

    if (!this.selectedSubjectId) {

      this.errorMessage = 'Please select a subject.';

      return;

    }

    if (!this.selectedExamId) {

      this.errorMessage = 'Please select an examination.';

      return;

    }

    this.isLoadingStudents = true;

    this.students = [];
    this.marksRecords = [];

    this.showRecords = false;

    this.studentPage = 1;
    this.recordsPage = 1;

    this.clearMessages();

    this.marksService
      .getStudentsForMarks(this.selectedSubjectId)
      .subscribe({

        next: (response: any) => {

          this.students = Array.isArray(response.data)
            ? response.data.map((student: any) => ({

                ...student,

                obtained_marks: '',

                remarks: ''

              }))
            : [];

          this.isLoadingStudents = false;

          this.studentPage = 1;

          this.cdr.detectChanges();

          console.log('Students:', this.students);

        },

        error: (error: any) => {

          console.error('Error loading students:', error);

          this.errorMessage =
            error.error?.message || 'Failed to load students.';

          this.isLoadingStudents = false;

          this.cdr.detectChanges();

        }

      });

  }


  // ==========================================
  // SAVE MARKS
  // ==========================================

  saveMarks(): void {

    if (!this.selectedExamId) {

      this.errorMessage = 'Please select an examination.';

      return;

    }

    if (this.students.length === 0) {

      this.errorMessage = 'No students available to save marks.';

      return;

    }

    const exam = this.selectedExam;

    if (!exam) {

      this.errorMessage = 'Selected examination not found.';

      return;

    }

    const maxMarks = Number(exam.max_marks);

    for (const student of this.students) {

      const marks = Number(student.obtained_marks);

      if (
        student.obtained_marks === '' ||
        student.obtained_marks === null ||
        student.obtained_marks === undefined
      ) {

        this.errorMessage =
          `Please enter marks for ${student.name}.`;

        return;

      }

      if (
        !Number.isFinite(marks) ||
        marks < 0 ||
        marks > maxMarks
      ) {

        this.errorMessage =
          `Marks for ${student.name} must be between 0 and ${maxMarks}.`;

        return;

      }

    }

    const payload = {

      exam_id: this.selectedExamId,

      students: this.students.map(student => ({

        student_id: student.id,

        obtained_marks: Number(student.obtained_marks),

        remarks: student.remarks || null

      }))

    };

    this.isSaving = true;

    this.clearMessages();

    this.marksService.addMarks(payload).subscribe({

      next: (response: any) => {

        this.successMessage =
          response.message || 'Marks saved successfully.';

        this.isSaving = false;

        this.cdr.detectChanges();

        this.viewMarks();

      },

      error: (error: any) => {

        console.error('Error saving marks:', error);

        this.errorMessage =
          error.error?.message || 'Failed to save marks.';

        this.isSaving = false;

        this.cdr.detectChanges();

      }

    });

  }


  // ==========================================
  // VIEW SAVED MARKS
  // ==========================================

  viewMarks(): void {

    if (!this.selectedExamId) {

      this.errorMessage = 'Please select an examination.';

      return;

    }

    this.isLoadingRecords = true;

    this.showRecords = true;

    this.marksRecords = [];

    this.clearMessages();

    this.cdr.detectChanges();

    this.marksService
      .getMarksRecords(this.selectedExamId)
      .subscribe({

        next: (response: any) => {

          this.marksRecords = Array.isArray(response.data)
            ? response.data.map((record: any) => ({

                ...record,

                obtained_marks: Number(record.obtained_marks),

                max_marks: Number(record.max_marks)

              }))
            : [];

          this.isLoadingRecords = false;

          // Keep the current page where possible.
          // If records were deleted, move to the last available page.
          const maxPage = Math.max(
            1,
            Math.ceil(this.marksRecords.length / this.pageSize)
          );

          this.recordsPage = Math.min(
            this.recordsPage,
            maxPage
          );

          this.cdr.detectChanges();

          console.log('Marks records:', this.marksRecords);

        },

        error: (error: any) => {

          console.error('Error loading marks:', error);

          this.errorMessage =
            error.error?.message || 'Failed to load saved marks.';

          this.isLoadingRecords = false;

          this.cdr.detectChanges();

        }

      });

  }


  // ==========================================
  // EDIT MARKS
  // ==========================================

  editMarks(record: any): void {

    const newMarks = prompt(
      'Enter new marks:',
      String(record.obtained_marks)
    );

    if (newMarks === null) {
      return;
    }

    const marks = Number(newMarks);

    const maxMarks = Number(record.max_marks);

    if (
      newMarks.trim() === '' ||
      !Number.isFinite(marks) ||
      marks < 0 ||
      marks > maxMarks
    ) {

      this.errorMessage =
        `Marks must be between 0 and ${maxMarks}.`;

      return;

    }

    const newRemarks = prompt(
      'Enter remarks:',
      record.remarks || ''
    );

    if (newRemarks === null) {
      return;
    }

    this.clearMessages();

    this.marksService
      .editMarks(record.mark_id, {

        obtained_marks: marks,

        remarks: newRemarks

      })
      .subscribe({

        next: (response: any) => {

          this.successMessage =
            response.message || 'Marks updated successfully.';

          this.viewMarks();

          this.cdr.detectChanges();

        },

        error: (error: any) => {

          console.error('Error updating marks:', error);

          this.errorMessage =
            error.error?.message || 'Failed to update marks.';

          this.cdr.detectChanges();

        }

      });

  }


  // ==========================================
  // DELETE MARKS
  // ==========================================

  deleteMarks(markId: number): void {

    const confirmed = confirm(
      'Are you sure you want to delete this marks record?'
    );

    if (!confirmed) {
      return;
    }

    this.clearMessages();

    this.marksService.deleteMarks(markId).subscribe({

      next: (response: any) => {

        this.successMessage =
          response.message || 'Marks deleted successfully.';

        this.viewMarks();

        this.cdr.detectChanges();

      },

      error: (error: any) => {

        console.error('Error deleting marks:', error);

        this.errorMessage =
          error.error?.message || 'Failed to delete marks.';

        this.cdr.detectChanges();

      }

    });

  }


  // ==========================================
  // CLEAR MESSAGES
  // ==========================================

  clearMessages(): void {

    this.errorMessage = '';

    this.successMessage = '';

  }

}