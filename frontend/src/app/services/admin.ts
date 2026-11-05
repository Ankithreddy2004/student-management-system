import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Admin {

  private apiUrl = 'http://localhost:5000/api/admin';

  private usersUrl = 'http://localhost:5000/api/users';

  constructor(private http: HttpClient) {}

  // GET dashboard statistics
  getDashboardStats(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/dashboard-stats`
    );
  }

  // GET all teachers
  getTeachers(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/teachers`
    );
  }

  // GET all users
  getAllUsers(): Observable<any> {
    return this.http.get<any>(
      this.usersUrl
    );
  }

}