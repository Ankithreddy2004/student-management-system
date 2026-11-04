import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Attendance {

  private apiUrl = 'http://localhost:5000/api/attendance';

  constructor(private http: HttpClient) {}

  // ==============================
  // STUDENT ATTENDANCE
  // ==============================

  getMyAttendance(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/my-attendance`
    );
  }

  // ==============================
  // TEACHER ATTENDANCE
  // ==============================

  // Get subjects assigned to logged-in teacher
  getTeacherSubjects(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/teacher/subjects`
    );
  }

  // Get students for selected subject
  getStudentsForAttendance(subjectId: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/teacher/students/${subjectId}`
    );
  }

  // Mark attendance
  markAttendance(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/teacher/mark`,
      data
    );
  }

  // Get attendance records
  getTeacherAttendanceRecords(
    subjectId: number,
    date?: string
  ): Observable<any> {

    let url = `${this.apiUrl}/teacher/records/${subjectId}`;

    if (date) {
      url += `?date=${date}`;
    }

    return this.http.get<any>(url);
  }

  // Edit attendance record
  editAttendance(
    attendanceId: number,
    data: any
  ): Observable<any> {

    return this.http.put<any>(
      `${this.apiUrl}/teacher/edit/${attendanceId}`,
      data
    );
  }

}