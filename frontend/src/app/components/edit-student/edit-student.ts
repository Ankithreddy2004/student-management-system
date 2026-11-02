import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
FormBuilder,
FormGroup,
Validators,
ReactiveFormsModule
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Student } from '../../services/student';

@Component({
selector: 'app-edit-student',
imports: [CommonModule, ReactiveFormsModule, RouterLink],
templateUrl: './edit-student.html',
styleUrl: './edit-student.css',
})
export class EditStudent implements OnInit {

studentForm: FormGroup;

studentId!: number;
isLoading = false;
isSubmitting = false;

successMessage = '';
errorMessage = '';

constructor(
private fb: FormBuilder,
private studentService: Student,
private route: ActivatedRoute,
private router: Router,
private cdr: ChangeDetectorRef
) {


this.studentForm = this.fb.group({
  name: ['', Validators.required],
  email: ['', [Validators.required, Validators.email]],
  phone: ['', [
    Validators.required,
    Validators.pattern(/^[0-9]{10}$/)
  ]],
  course: ['', Validators.required]
});

}

ngOnInit(): void {


this.studentId = Number(this.route.snapshot.paramMap.get('id'));

if (!Number.isInteger(this.studentId) || this.studentId <= 0) {
  this.errorMessage = 'Invalid student ID.';
  return;
}

this.getStudent();


}

// GET student by ID
getStudent(): void {


this.isLoading = true;

this.studentService.getStudentById(this.studentId).subscribe({

  next: (response) => {

    this.studentForm.patchValue(response.data);

    this.isLoading = false;
    this.cdr.detectChanges();

  },

  error: (error) => {

    console.error('Fetch Student Error:', error);

    this.errorMessage = error.error?.message || 'Unable to fetch student.';

    this.isLoading = false;
    this.cdr.detectChanges();

  }

});


}

// UPDATE student
updateStudent(): void {


if (this.studentForm.invalid) {
  this.studentForm.markAllAsTouched();
  return;
}

this.isSubmitting = true;
this.errorMessage = '';

this.studentService.updateStudent(
  this.studentId,
  this.studentForm.value
).subscribe({

  next: (response) => {

    console.log('Student Updated:', response);

    this.successMessage = 'Student updated successfully!';
    this.isSubmitting = false;

    this.cdr.detectChanges();

    setTimeout(() => {
      this.router.navigate(['/students']);
    }, 1500);

  },

  error: (error) => {

    console.error('Update Student Error:', error);

    this.errorMessage = error.error?.message || 'Unable to update student.';
    this.isSubmitting = false;

    this.cdr.detectChanges();

  }

});

}

}
