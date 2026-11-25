import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type EnrollmentStatus = 'Pending' | 'Approved' | 'Rejected';

export interface EnrollmentSubject {
  id: number;
  subject_name: string;
  subject_code: string;
  course: string;
  semester: number;
}

export interface Enrollment {
  enrollment_id: number;
  student_id: number;
  subject_id: number;
  status: EnrollmentStatus;

  enrolled_by: number;
  enrolled_by_role: 'Student' | 'Teacher' | 'Admin';

  approved_by: number | null;
  enrollment_date: string;
  updated_at: string;

  student_name?: string;
  student_email?: string;
  student_phone?: string;

  subject_name: string;
  subject_code: string;
  course: string;
  semester: number;

  enrolled_by_name?: string;
  reviewer_name?: string;
}

export interface EnrollmentResponse {
  success: boolean;
  message?: string;
  subjects?: EnrollmentSubject[];
  enrollments?: Enrollment[];
  enrollmentId?: number;
  status?: EnrollmentStatus;
}

@Injectable({
  providedIn: 'root'
})
export class Enrollment {

  private apiUrl = 'http://localhost:5000/api/enrollments';

  constructor(private http: HttpClient) {}

  // GET available subjects
  getAvailableSubjects(): Observable<EnrollmentResponse> {
    return this.http.get<EnrollmentResponse>(
      `${this.apiUrl}/subjects`
    );
  }

  // ENROLL STUDENT
  enrollStudent(data: {
    studentId?: number;
    subjectId: number;
  }): Observable<EnrollmentResponse> {
    return this.http.post<EnrollmentResponse>(
      `${this.apiUrl}/enroll`,
      data
    );
  }

  // GET MY ENROLLMENTS (STUDENT)
  getMyEnrollments(): Observable<EnrollmentResponse> {
    return this.http.get<EnrollmentResponse>(
      `${this.apiUrl}/my`
    );
  }

  // GET ALL ENROLLMENTS (ADMIN / TEACHER)
  getAllEnrollments(
    status?: EnrollmentStatus,
    subjectId?: number,
    studentId?: number
  ): Observable<EnrollmentResponse> {

    let params = new HttpParams();

    if (status) {
      params = params.set('status', status);
    }

    if (subjectId) {
      params = params.set('subjectId', subjectId);
    }

    if (studentId) {
      params = params.set('studentId', studentId);
    }

    return this.http.get<EnrollmentResponse>(
      this.apiUrl,
      { params }
    );
  }

  // GET ENROLLMENTS FOR ONE STUDENT
  getStudentEnrollments(
    studentId: number
  ): Observable<EnrollmentResponse> {
    return this.http.get<EnrollmentResponse>(
      `${this.apiUrl}/student/${studentId}`
    );
  }

  // APPROVE ENROLLMENT
  approveEnrollment(id: number): Observable<EnrollmentResponse> {
    return this.http.patch<EnrollmentResponse>(
      `${this.apiUrl}/${id}/approve`,
      {}
    );
  }

  // REJECT ENROLLMENT
  rejectEnrollment(id: number): Observable<EnrollmentResponse> {
    return this.http.patch<EnrollmentResponse>(
      `${this.apiUrl}/${id}/reject`,
      {}
    );
  }

}