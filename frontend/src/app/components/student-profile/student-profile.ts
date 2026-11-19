import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Auth } from '../../services/auth';
import { Student as StudentService } from '../../services/student';

interface StudentProfileData {
  id: number;
  name: string;
  email: string;
  phone: string;
  course: string;
  status: string;
  created_at?: string;
}

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './student-profile.html',
  styleUrl: './student-profile.css'
})
export class StudentProfile implements OnInit {

  student: StudentProfileData | null = null;

  isLoading = false;

  isSaving = false;

  isEditing = false;

  errorMessage = '';

  successMessage = '';

  profileForm = {
    name: '',
    phone: '',
    course: ''
  };

  constructor(
    private authService: Auth,
    private studentService: StudentService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadStudentProfile();
  }

  loadStudentProfile(): void {

    const user = this.authService.getUser();

    if (!user || user.role !== 'Student' || !user.student_id) {

      this.errorMessage = 'Student information not found.';

      return;
    }

    this.isLoading = true;

    this.errorMessage = '';

    this.studentService.getStudentById(user.student_id).subscribe({

      next: (response: any) => {

        const data =
          response?.data?.student ||
          response?.data ||
          response?.student ||
          response;

        if (data && data.id) {

          this.student = data;

        } else {

          this.errorMessage = 'Unable to find student profile.';
        }

        this.isLoading = false;

        this.cdr.markForCheck();
      },

      error: (error) => {

        console.error('Profile loading error:', error);

        this.errorMessage =
          error?.error?.message ||
          'Unable to load student profile.';

        this.isLoading = false;

        this.cdr.markForCheck();
      }

    });
  }

  get canEditProfile(): boolean {
    return this.student?.status === 'Active';
  }

  openEditProfile(): void {

    if (!this.student || !this.canEditProfile) {
      return;
    }

    this.profileForm = {
      name: this.student.name || '',
      phone: this.student.phone || '',
      course: this.student.course || ''
    };

    this.isEditing = true;

    this.errorMessage = '';
    this.successMessage = '';

    this.cdr.markForCheck();
  }

  cancelEdit(): void {

    this.isEditing = false;

    this.errorMessage = '';
    this.successMessage = '';

    this.cdr.markForCheck();
  }

  saveProfile(): void {

    if (!this.student) {
      return;
    }

    const name = this.profileForm.name.trim();
    const phone = this.profileForm.phone.trim();
    const course = this.profileForm.course.trim();

    if (!name || !phone || !course) {

      this.errorMessage = 'All fields are required.';

      return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {

      this.errorMessage = 'Enter a valid 10-digit phone number.';

      return;
    }

    this.isSaving = true;

    this.errorMessage = '';
    this.successMessage = '';

    this.studentService.updateMyProfile({
      name,
      phone,
      course
    }).subscribe({

      next: (response: any) => {

        this.student = {
          ...this.student!,
          name,
          phone,
          course
        };

        const user = this.authService.getUser();

        if (user) {
          user.name = name;
        }

        this.isSaving = false;

        this.isEditing = false;

        this.successMessage =
          response?.message ||
          'Profile updated successfully.';

        this.cdr.markForCheck();
      },

      error: (error) => {

        console.error('Profile update error:', error);

        this.errorMessage =
          error?.error?.message ||
          'Unable to update profile.';

        this.isSaving = false;

        this.cdr.markForCheck();
      }

    });
  }

}