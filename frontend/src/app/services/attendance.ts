import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Attendance {

  private apiUrl = 'http://localhost:5000/api/attendance';

  constructor(private http: HttpClient) {}

  // Get attendance of logged-in student
  getMyAttendance(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/my-attendance`
    );
  }

}