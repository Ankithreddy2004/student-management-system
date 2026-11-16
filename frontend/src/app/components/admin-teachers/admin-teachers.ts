import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Auth } from '../../services/auth';

@Component({
  selector: 'app-admin-teachers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './admin-teachers.html',
  styleUrl: './admin-teachers.css'
})
export class AdminTeachers implements OnInit, OnDestroy {

  private apiUrl = 'http://localhost:5000/api/users';

  teachers: any[] = [];

  teacher = {
    name: '',
    email: '',
    password: ''
  };

  editTeacherData = {
    id: 0,
    name: '',
    email: ''
  };

  isLoading = false;
  isCreating = false;
  isUpdating = false;
  isEditing = false;
  isDeletingId: number | null = null;

  errorMessage = '';
  successMessage = '';

  // CREATE TEACHER IMAGE
  selectedImage: File | null = null;
  imagePreviewUrl = '';

  // EXISTING TEACHER IMAGES
  teacherImageUrls: { [key: number]: string } = {};

  // SELECTED IMAGE FOR EACH TEACHER
  selectedTeacherImages: { [key: number]: File } = {};

  // IMAGE PREVIEWS FOR EACH TEACHER
  teacherImagePreviews: { [key: number]: string } = {};

  isUpdatingImageId: number | null = null;

  constructor(
    private http: HttpClient,
    private authService: Auth,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTeachers();
  }

  // AUTHORIZATION HEADER
  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  // LOAD ALL TEACHERS
  loadTeachers(): void {

    this.isLoading = true;
    this.errorMessage = '';

    this.http.get<any>(this.apiUrl, {
      headers: this.getHeaders()
    }).subscribe({

      next: (response) => {

        this.teachers = Array.isArray(response.data)
          ? response.data.filter((user: any) => user.role === 'Teacher')
          : [];

        this.teachers.forEach((teacher: any) => {

          if (teacher.profile_image) {
            this.loadTeacherImage(teacher.id);
          }

        });

        this.isLoading = false;
        this.cdr.detectChanges();
      },

      error: (error) => {

        console.error('Load teachers error:', error);

        this.errorMessage =
          error.error?.message || 'Unable to load teachers.';

        this.isLoading = false;
        this.cdr.detectChanges();
      }

    });
  }

  // LOAD INDIVIDUAL TEACHER IMAGE
  loadTeacherImage(teacherId: number): void {

    this.http.get(
      `${this.apiUrl}/${teacherId}/profile-image`,
      {
        headers: this.getHeaders(),
        responseType: 'blob'
      }
    ).subscribe({

      next: (blob) => {

        if (this.teacherImageUrls[teacherId]) {
          URL.revokeObjectURL(this.teacherImageUrls[teacherId]);
        }

        this.teacherImageUrls[teacherId] =
          URL.createObjectURL(blob);

        this.cdr.detectChanges();
      },

      error: (error) => {

        console.error(
          `Unable to load image for teacher ${teacherId}:`,
          error
        );

        this.cdr.detectChanges();
      }

    });
  }

  // IMAGE VALIDATION
  private validateImage(file: File): boolean {

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (!allowedTypes.includes(file.type)) {

      alert('Only JPG, JPEG, PNG and WebP images are allowed.');

      return false;
    }

    if (file.size > 2 * 1024 * 1024) {

      alert('Image size must not exceed 2MB.');

      return false;
    }

    return true;
  }

  // SELECT IMAGE WHILE CREATING TEACHER
  onImageSelected(event: Event): void {

    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    if (!this.validateImage(file)) {
      input.value = '';
      return;
    }

    this.selectedImage = file;

    if (this.imagePreviewUrl) {
      URL.revokeObjectURL(this.imagePreviewUrl);
    }

    this.imagePreviewUrl = URL.createObjectURL(file);

    this.cdr.detectChanges();
  }

  // REMOVE CREATE IMAGE PREVIEW
  clearCreateImage(): void {

    this.selectedImage = null;

    if (this.imagePreviewUrl) {
      URL.revokeObjectURL(this.imagePreviewUrl);
      this.imagePreviewUrl = '';
    }
  }

  // CREATE TEACHER
  createTeacher(): void {

    this.errorMessage = '';
    this.successMessage = '';

    if (
      !this.teacher.name.trim() ||
      !this.teacher.email.trim() ||
      !this.teacher.password.trim()
    ) {

      this.errorMessage = 'Please fill all required fields.';
      return;
    }

    if (this.teacher.password.length < 12) {

      this.errorMessage = 'Password must contain at least 12 characters.';
      return;
    }

    const formData = new FormData();

    formData.append('name', this.teacher.name.trim());
    formData.append('email', this.teacher.email.trim());
    formData.append('password', this.teacher.password);

    if (this.selectedImage) {
      formData.append('profileImage', this.selectedImage);
    }

    this.isCreating = true;

    this.http.post<any>(
      `${this.apiUrl}/teacher`,
      formData,
      {
        headers: this.getHeaders()
      }
    ).subscribe({

      next: (response) => {

        this.successMessage =
          response.message || 'Teacher created successfully.';

        this.teacher = {
          name: '',
          email: '',
          password: ''
        };

        this.clearCreateImage();

        this.isCreating = false;

        this.loadTeachers();
        this.cdr.detectChanges();
      },

      error: (error) => {

        console.error('Create teacher error:', error);

        this.errorMessage =
          error.error?.message || 'Unable to create teacher.';

        this.isCreating = false;
        this.cdr.detectChanges();
      }

    });
  }

  // SELECT IMAGE FOR EXISTING TEACHER
  onTeacherImageSelected(event: Event, teacherId: number): void {

    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    if (!this.validateImage(file)) {
      input.value = '';
      return;
    }

    this.selectedTeacherImages[teacherId] = file;

    if (this.teacherImagePreviews[teacherId]) {
      URL.revokeObjectURL(this.teacherImagePreviews[teacherId]);
    }

    this.teacherImagePreviews[teacherId] =
      URL.createObjectURL(file);

    this.cdr.detectChanges();
  }

  // UPDATE EXISTING TEACHER IMAGE
  updateTeacherImage(teacherId: number): void {

    const selectedFile = this.selectedTeacherImages[teacherId];

    if (!selectedFile) {
      return;
    }

    const formData = new FormData();

    formData.append('profileImage', selectedFile);

    this.isUpdatingImageId = teacherId;

    this.http.put<any>(
      `${this.apiUrl}/${teacherId}/profile-image`,
      formData,
      {
        headers: this.getHeaders()
      }
    ).subscribe({

      next: (response) => {

        this.successMessage =
          response.message || 'Teacher photo updated successfully.';

        this.cancelTeacherImage(teacherId);

        // Reload the saved image
        this.loadTeacherImage(teacherId);

        this.isUpdatingImageId = null;

        this.cdr.detectChanges();
      },

      error: (error) => {

        console.error('Update teacher image error:', error);

        this.errorMessage =
          error.error?.message || 'Unable to update teacher photo.';

        this.isUpdatingImageId = null;
        this.cdr.detectChanges();
      }

    });
  }

  // CANCEL TEACHER IMAGE CHANGE
  cancelTeacherImage(teacherId: number): void {

    delete this.selectedTeacherImages[teacherId];

    if (this.teacherImagePreviews[teacherId]) {

      URL.revokeObjectURL(
        this.teacherImagePreviews[teacherId]
      );

      delete this.teacherImagePreviews[teacherId];
    }

    this.cdr.detectChanges();
  }

  // EDIT TEACHER
  editTeacher(teacher: any): void {

    this.isEditing = true;

    this.editTeacherData = {
      id: teacher.id,
      name: teacher.name,
      email: teacher.email
    };

    this.errorMessage = '';
    this.successMessage = '';
  }

  // UPDATE TEACHER DETAILS
  updateTeacher(): void {

    if (
      !this.editTeacherData.name.trim() ||
      !this.editTeacherData.email.trim()
    ) {

      this.errorMessage = 'Name and email are required.';
      return;
    }

    this.isUpdating = true;

    this.http.put<any>(
      `${this.apiUrl}/${this.editTeacherData.id}`,
      {
        name: this.editTeacherData.name.trim(),
        email: this.editTeacherData.email.trim()
      },
      {
        headers: this.getHeaders()
      }
    ).subscribe({

      next: (response) => {

        this.successMessage =
          response.message || 'Teacher updated successfully.';

        this.isUpdating = false;
        this.isEditing = false;

        this.loadTeachers();
        this.cdr.detectChanges();
      },

      error: (error) => {

        console.error('Update teacher error:', error);

        this.errorMessage =
          error.error?.message || 'Unable to update teacher.';

        this.isUpdating = false;
        this.cdr.detectChanges();
      }

    });
  }

  // CANCEL EDIT
  cancelEdit(): void {

    this.isEditing = false;

    this.editTeacherData = {
      id: 0,
      name: '',
      email: ''
    };

    this.errorMessage = '';
  }

  // DELETE TEACHER
  deleteTeacher(teacherId: number): void {

    const confirmDelete = confirm(
      'Are you sure you want to delete this teacher?'
    );

    if (!confirmDelete) {
      return;
    }

    this.isDeletingId = teacherId;

    this.http.delete<any>(
      `${this.apiUrl}/${teacherId}`,
      {
        headers: this.getHeaders()
      }
    ).subscribe({

      next: (response) => {

        this.successMessage =
          response.message || 'Teacher deleted successfully.';

        this.isDeletingId = null;

        this.cancelTeacherImage(teacherId);

        if (this.teacherImageUrls[teacherId]) {
          URL.revokeObjectURL(this.teacherImageUrls[teacherId]);
          delete this.teacherImageUrls[teacherId];
        }

        this.loadTeachers();
        this.cdr.detectChanges();
      },

      error: (error) => {

        console.error('Delete teacher error:', error);

        this.errorMessage =
          error.error?.message || 'Unable to delete teacher.';

        this.isDeletingId = null;
        this.cdr.detectChanges();
      }

    });
  }

  // CLEAN UP IMAGE URLS
  ngOnDestroy(): void {

    if (this.imagePreviewUrl) {
      URL.revokeObjectURL(this.imagePreviewUrl);
    }

    Object.values(this.teacherImageUrls).forEach(url => {
      URL.revokeObjectURL(url);
    });

    Object.values(this.teacherImagePreviews).forEach(url => {
      URL.revokeObjectURL(url);
    });
  }

}