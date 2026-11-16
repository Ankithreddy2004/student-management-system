import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { Auth } from '../../services/auth';

@Component({
  selector: 'app-teacher-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  templateUrl: './teacher-profile.html',
  styleUrl: './teacher-profile.css'
})
export class TeacherProfile implements OnInit, OnDestroy {

  private apiUrl = 'http://localhost:5000/api/users';

  teacher: any = null;
  teacherImageUrl = '';

  selectedFile: File | null = null;
  previewUrl = '';

  isLoading = false;
  isUploading = false;

  successMessage = '';
  errorMessage = '';

  constructor(
    private http: HttpClient,
    private authService: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  get headers(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.authService.getToken()}`
    });
  }

  loadProfile(): void {
    this.isLoading = true;

    this.http.get<any>(`${this.apiUrl}/me`, {
      headers: this.headers
    }).subscribe({
      next: (response) => {
        this.teacher = response.data || response;
        this.loadProfileImage();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.errorMessage =
          error.error?.message || 'Unable to load teacher profile.';

        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadProfileImage(): void {
    if (!this.teacher?.id) {
      return;
    }

    this.http.get(
      `${this.apiUrl}/${this.teacher.id}/profile-image`,
      {
        headers: this.headers,
        responseType: 'blob'
      }
    ).subscribe({
      next: (blob) => {
        if (this.teacherImageUrl) {
          URL.revokeObjectURL(this.teacherImageUrl);
        }

        this.teacherImageUrl = URL.createObjectURL(blob);
        this.cdr.detectChanges();
      },
      error: () => {
        this.teacherImageUrl = '';
        this.cdr.detectChanges();
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files?.length) {
      return;
    }

    const file = input.files[0];
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (!allowedTypes.includes(file.type)) {
      this.errorMessage = 'Only JPG, PNG and WebP images are allowed.';
      input.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      this.errorMessage = 'Image size must not exceed 2MB.';
      input.value = '';
      return;
    }

    this.selectedFile = file;

    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }

    this.previewUrl = URL.createObjectURL(file);
    this.errorMessage = '';
    this.successMessage = '';
  }

  uploadImage(): void {
    if (!this.selectedFile) {
      this.errorMessage = 'Please select an image first.';
      return;
    }

    const formData = new FormData();
    formData.append('profileImage', this.selectedFile);

    this.isUploading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.http.put(
      `${this.apiUrl}/me/profile-image`,
      formData,
      { headers: this.headers }
    ).subscribe({
      next: () => {
        this.successMessage = 'Profile photo updated successfully.';

        this.selectedFile = null;

        if (this.previewUrl) {
          URL.revokeObjectURL(this.previewUrl);
          this.previewUrl = '';
        }

        this.loadProfileImage();
        this.isUploading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.errorMessage =
          error.error?.message || 'Unable to update profile photo.';

        this.isUploading = false;
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.teacherImageUrl) {
      URL.revokeObjectURL(this.teacherImageUrl);
    }

    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }
  }
}