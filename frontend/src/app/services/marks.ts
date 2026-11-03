import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Marks {

  private apiUrl = 'http://localhost:5000/api/marks';

  constructor(private http: HttpClient) {}

  // Get marks of logged-in student
  getMyMarks(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/my-marks`
    );
  }

}