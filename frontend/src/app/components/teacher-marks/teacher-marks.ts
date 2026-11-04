import {
Component,
OnInit,
ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Marks } from '../../services/marks';

@Component({
selector: 'app-teacher-marks',
standalone: true,
imports: [CommonModule, FormsModule],
templateUrl: './teacher-marks.html',
styleUrl: './teacher-marks.css'
})
export class TeacherMarks implements OnInit {

// =====================================
// DATA
// =====================================

subjects: any[] = [];
exams: any[] = [];
students: any[] = [];
marksRecords: any[] = [];

selectedSubjectId: number | null = null;
selectedExamId: number | null = null;

// =====================================
// EXAM FORM
// =====================================

showExamForm = false;
isEditingExam = false;
editingExamId: number | null = null;

examForm: any = {
exam_name: '',
exam_type: 'Internal',
exam_date: '',
max_marks: 30
};

// =====================================
// MARKS FORM
// =====================================

showRecords = false;

// =====================================
// LOADING STATES
// =====================================

isLoadingSubjects = false;
isLoadingExams = false;
isLoadingStudents = false;
isLoadingRecords = false;
isSaving = false;

// =====================================
// MESSAGES
// =====================================

errorMessage = '';
successMessage = '';

constructor(
private marksService: Marks,
private cdr: ChangeDetectorRef
) {}
get selectedExam(): any {
  return this.exams.find(
    exam => Number(exam.id) === Number(this.selectedExamId)
  );
}

// =====================================
// INITIALIZATION
// =====================================

ngOnInit(): void {
this.loadSubjects();
}

// =====================================
// LOAD SUBJECTS
// =====================================

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

    console.log('Teacher Subjects:', this.subjects);

  },

  error: (error) => {

    console.error(error);

    this.errorMessage =
      error.error?.message || 'Unable to load subjects.';

    this.isLoadingSubjects = false;

    this.cdr.detectChanges();

  }

});


}

// =====================================
// SUBJECT CHANGE
// =====================================

onSubjectChange(): void {


this.exams = [];
this.students = [];
this.marksRecords = [];

this.selectedExamId = null;

this.showRecords = false;
this.showExamForm = false;

this.successMessage = '';
this.errorMessage = '';

if (!this.selectedSubjectId) {
  this.cdr.detectChanges();
  return;
}

this.loadExams();

this.cdr.detectChanges();


}

// =====================================
// LOAD EXAMS
// =====================================

loadExams(): void {


if (!this.selectedSubjectId) return;

this.isLoadingExams = true;

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

    error: (error) => {

      console.error(error);

      this.errorMessage =
        error.error?.message || 'Unable to load examinations.';

      this.isLoadingExams = false;

      this.cdr.detectChanges();

    }

  });

}

// =====================================
// OPEN EXAM FORM
// =====================================

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

this.errorMessage = '';
this.successMessage = '';

this.cdr.detectChanges();


}

// =====================================
// CREATE EXAM
// =====================================

saveExam(): void {


if (!this.selectedSubjectId) return;

if (
  !this.examForm.exam_name?.trim() ||
  !this.examForm.exam_type ||
  !this.examForm.max_marks ||
  Number(this.examForm.max_marks) <= 0
) {

  this.errorMessage = 'Please enter valid examination details.';

  this.cdr.detectChanges();

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
this.errorMessage = '';
this.successMessage = '';

this.marksService.createExam(payload).subscribe({

  next: (response: any) => {

    this.isSaving = false;

    this.successMessage =
      response.message || 'Examination created successfully.';

    this.showExamForm = false;

    this.loadExams();

    this.cdr.detectChanges();

  },

  error: (error) => {

    console.error(error);

    this.isSaving = false;

    this.errorMessage =
      error.error?.message || 'Unable to create examination.';

    this.cdr.detectChanges();

  }

});


}

// =====================================
// EDIT EXAM
// =====================================

editExam(exam: any): void {


this.showExamForm = true;
this.isEditingExam = true;

this.editingExamId = exam.id;

this.examForm = {

  exam_name: exam.exam_name,

  exam_type: exam.exam_type,

  exam_date: exam.exam_date || '',

  max_marks: Number(exam.max_marks)

};

this.cdr.detectChanges();


}

// =====================================
// UPDATE EXAM
// =====================================

updateExam(): void {

    if (!this.editingExamId) return;

const payload = {

  exam_name: this.examForm.exam_name.trim(),

  exam_type: this.examForm.exam_type,

  exam_date: this.examForm.exam_date || null,

  max_marks: Number(this.examForm.max_marks)

};

this.isSaving = true;

this.marksService
  .updateExam(this.editingExamId, payload)
  .subscribe({

    next: (response: any) => {

      this.isSaving = false;

      this.successMessage = response.message;

      this.showExamForm = false;

      this.loadExams();

      this.cdr.detectChanges();

    },

    error: (error) => {

      console.error(error);

      this.isSaving = false;

      this.errorMessage =
        error.error?.message || 'Unable to update examination.';

      this.cdr.detectChanges();

    }

  });


}

// =====================================
// DELETE EXAM
// =====================================

deleteExam(examId: number): void {


if (!confirm('Are you sure you want to delete this examination?')) {
  return;
}

this.marksService.deleteExam(examId).subscribe({

  next: (response: any) => {

    this.successMessage = response.message;

    this.selectedExamId = null;

    this.students = [];
    this.marksRecords = [];

    this.showRecords = false;

    this.loadExams();

    this.cdr.detectChanges();

  },

  error: (error) => {

    console.error(error);

    this.errorMessage =
      error.error?.message || 'Unable to delete examination.';

    this.cdr.detectChanges();

  }

});


}

// =====================================
// LOAD STUDENTS FOR SELECTED EXAM
// =====================================

loadStudents(): void {


if (!this.selectedSubjectId || !this.selectedExamId) {

  this.errorMessage = 'Please select a subject and examination.';

  this.cdr.detectChanges();

  return;
}

this.isLoadingStudents = true;

this.students = [];
this.marksRecords = [];

this.showRecords = false;

this.errorMessage = '';
this.successMessage = '';

this.marksService
  .getStudentsForMarks(this.selectedSubjectId)
  .subscribe({

    next: (response: any) => {

      this.students = (Array.isArray(response.data)
        ? response.data
        : []).map((student: any) => ({

          ...student,

          obtained_marks: '',

          remarks: ''

        }));

      this.isLoadingStudents = false;

      this.cdr.detectChanges();

      console.log('Loaded Students:', this.students);

    },

    error: (error) => {

      console.error(error);

      this.isLoadingStudents = false;

      this.errorMessage =
        error.error?.message || 'Unable to load students.';

      this.cdr.detectChanges();

    }

  });

}

// =====================================
// ADD BULK MARKS
// =====================================

saveMarks(): void {


if (!this.selectedExamId || this.students.length === 0) {

  this.errorMessage = 'Please load students first.';

  this.cdr.detectChanges();

  return;
}

const selectedExam = this.exams.find(
  exam => Number(exam.id) === Number(this.selectedExamId)
);

const maxMarks = Number(selectedExam?.max_marks);

const invalidStudent = this.students.find(student => {

  const marks = Number(student.obtained_marks);

  return (

    student.obtained_marks === '' ||

    student.obtained_marks === null ||

    !Number.isFinite(marks) ||

    marks < 0 ||

    marks > maxMarks

  );

});

if (invalidStudent) {

  this.errorMessage =
    `Enter valid marks between 0 and ${maxMarks} for every student.`;

  this.cdr.detectChanges();

  return;
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

this.errorMessage = '';
this.successMessage = '';

this.marksService.addMarks(payload).subscribe({

  next: (response: any) => {

    this.isSaving = false;

    this.successMessage =
      response.message || 'Marks saved successfully.';

    this.cdr.detectChanges();

    this.viewMarks();

  },

  error: (error) => {

    console.error(error);

    this.isSaving = false;

    this.errorMessage =
      error.error?.message || 'Unable to save marks.';

    this.cdr.detectChanges();

  }

});


}

// =====================================
// VIEW MARKS
// =====================================

viewMarks(): void {


if (!this.selectedExamId) return;

this.isLoadingRecords = true;

this.showRecords = true;

this.marksRecords = [];

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

      this.cdr.detectChanges();

      console.log('Marks Records:', this.marksRecords);

    },

    error: (error) => {

      console.error(error);

      this.isLoadingRecords = false;

      this.errorMessage =
        error.error?.message || 'Unable to load marks records.';

      this.cdr.detectChanges();

    }

  });


}

// =====================================
// EDIT MARKS
// =====================================

editMarks(record: any): void {


const newMarks = prompt(
  `Enter updated marks (maximum ${record.max_marks}):`,
  String(record.obtained_marks)
);

if (newMarks === null) return;

const marks = Number(newMarks);

if (
  newMarks.trim() === '' ||
  !Number.isFinite(marks) ||
  marks < 0 ||
  marks > record.max_marks
) {

  this.errorMessage = 'Please enter valid marks.';

  this.cdr.detectChanges();

  return;
}

const newRemarks = prompt(
  'Enter remarks:',
  record.remarks || ''
);

if (newRemarks === null) return;

this.marksService
  .editMarks(record.mark_id, {

    obtained_marks: marks,

    remarks: newRemarks

  })
  .subscribe({

    next: (response: any) => {

      this.successMessage = response.message;

      this.viewMarks();

      this.cdr.detectChanges();

    },

    error: (error) => {

      console.error(error);

      this.errorMessage =
        error.error?.message || 'Unable to update marks.';

      this.cdr.detectChanges();

    }

  });


}

// =====================================
// DELETE MARKS
// =====================================

deleteMarks(markId: number): void {


if (!confirm('Are you sure you want to delete this marks record?')) {
  return;
}

this.marksService.deleteMarks(markId).subscribe({

  next: (response: any) => {

    this.successMessage = response.message;

    this.viewMarks();

    this.cdr.detectChanges();

  },

  error: (error) => {

    console.error(error);

    this.errorMessage =
      error.error?.message || 'Unable to delete marks.';

    this.cdr.detectChanges();

  }

});


}

// =====================================
// RESET MESSAGES
// =====================================

clearMessages(): void {


this.errorMessage = '';
this.successMessage = '';


}

}
