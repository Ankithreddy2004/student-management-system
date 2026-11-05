import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Subject {

  private apiUrl = 'http://localhost:5000/api/subjects';

  constructor(private http: HttpClient) {}

  // GET all subjects
  getSubjects(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  // GET subject by ID
  getSubjectById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // CREATE subject
  addSubject(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  // UPDATE subject
  updateSubject(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  // DELETE subject
  deleteSubject(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  // GET all teacher-subject assignments
  getAssignments(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/assignments/all`
    );
  }

  // ASSIGN subjects to teacher
  assignSubjects(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/assignments`,
      data
    );
  }

  // REMOVE assignment
  removeAssignment(id: number): Observable<any> {
    return this.http.delete<any>(
      `${this.apiUrl}/assignments/${id}`
    );
  }

}
