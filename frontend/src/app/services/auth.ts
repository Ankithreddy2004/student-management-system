import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

// ==========================================
// AUTH USER INTERFACE
// ==========================================

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Teacher' | 'Student';
  student_id: number | null;
}

// ==========================================
// AUTH RESPONSE INTERFACE
// ==========================================

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: AuthUser;
}

// ==========================================
// AUTH SERVICE
// ==========================================

@Injectable({
  providedIn: 'root'
})
export class Auth {

  private apiUrl = 'http://localhost:5000/api/auth';

  constructor(private http: HttpClient) { }


  // ==========================================
  // STUDENT SIGNUP
  // ==========================================

  signup(user: {
    name: string;
    email: string;
    phone: string;
    course: string;
    password: string;
  }): Observable<AuthResponse> {

    return this.http.post<AuthResponse>(
      `${this.apiUrl}/signup`,
      user
    );

  }


  // ==========================================
  // USER LOGIN
  // ==========================================

  login(credentials: {
    email: string;
    password: string;
  }): Observable<AuthResponse> {

    return this.http.post<AuthResponse>(
      `${this.apiUrl}/login`,
      credentials
    ).pipe(

      tap(response => {

        if (response.success && response.token && response.user) {

          // Store JWT token
          localStorage.setItem('token', response.token);

          // Store logged-in user details
          localStorage.setItem(
            'user',
            JSON.stringify(response.user)
          );

        }

      })

    );

  }


  // ==========================================
  // GET JWT TOKEN
  // ==========================================

  getToken(): string | null {

    return localStorage.getItem('token');

  }


  // ==========================================
  // GET CURRENT USER
  // ==========================================

  getUser(): AuthUser | null {

    const user = localStorage.getItem('user');

    if (!user) {
      return null;
    }

    try {

      return JSON.parse(user) as AuthUser;

    } catch {

      return null;

    }

  }


  // ==========================================
  // GET USER ROLE
  // ==========================================

  getRole(): string | null {

    const user = this.getUser();

    return user ? user.role : null;

  }


  // ==========================================
  // CHECK LOGIN STATUS
  // ==========================================

  isLoggedIn(): boolean {

    return !!this.getToken();

  }


  // ==========================================
  // LOGOUT
  // ==========================================

  logout(): void {

    localStorage.removeItem('token');

    localStorage.removeItem('user');

  }

}