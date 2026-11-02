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

  // PUT - Update student
  updateStudent(id: number, student: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, student);
  }

  // DELETE student
  deleteStudent(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
  // UPDATE Student Status
updateStudentStatus(id: number, status: string): Observable<any> {
  return this.http.patch<any>(
    `${this.apiUrl}/${id}/status`,
    { status });
  }

}