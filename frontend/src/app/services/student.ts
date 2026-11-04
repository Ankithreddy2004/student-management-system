
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Student {

  private apiUrl = 'http://localhost:5000/api/students';

  constructor(private http: HttpClient) { }

  // GET all students
  getStudents(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  // GET student by ID
  getStudentById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // POST - Add student
  addStudent(student: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, student);
  }

  // PUT - Update student (Admin/Teacher)
  updateStudent(id: number, student: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, student);
  }

  // PATCH - Update logged-in student's own profile
  updateMyProfile(profile: {
    name: string;
    phone: string;
    course: string;
  }): Observable<any> {
    return this.http.patch<any>(
      `${this.apiUrl}/my-profile`,
      profile
    );
  }

  // DELETE student
  deleteStudent(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  // UPDATE student status
  updateStudentStatus(id: number, status: string): Observable<any> {
    return this.http.patch<any>(
      `${this.apiUrl}/${id}/status`,
      { status }
    );
  }

  // GET all pending student registrations
  getPendingStudents(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/pending`);
  }

  // APPROVE a pending student
  approveStudent(id: number): Observable<any> {
    return this.http.patch<any>(
      `${this.apiUrl}/${id}/approve`,
      {}
    );
  }

}
