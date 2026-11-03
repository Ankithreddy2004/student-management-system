import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

// ==========================================
// STUDENT STATUS TYPE
// ==========================================

export type StudentStatus = 'Pending' | 'Active' | 'Inactive';

// ==========================================
// AUTH USER INTERFACE
// ==========================================

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Teacher' | 'Student';
  student_id: number | null;
  status?: StudentStatus | null;
}

// ==========================================
// AUTH RESPONSE INTERFACE
// ==========================================

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: AuthUser;

  data?: {
    student_id: number;
    user_id: number;
    name: string;
    email: string;
    role: 'Student';
    status: StudentStatus;
  };
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
          this.setUser(response.user);

        }

      })

    );

  }


  // ==========================================
  // STORE USER DETAILS
  // ==========================================

  setUser(user: AuthUser): void {

    localStorage.setItem(
      'user',
      JSON.stringify(user)
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
  // GET STUDENT STATUS
  // ==========================================

  getStudentStatus(): StudentStatus | null {

    const user = this.getUser();

    if (!user || user.role !== 'Student') {
      return null;
    }

    return user.status ?? null;

  }


  // ==========================================
  // CHECK STUDENT STATUS
  // ==========================================

  isStudentPending(): boolean {

    return this.getStudentStatus() === 'Pending';

  }


  isStudentActive(): boolean {

    return this.getStudentStatus() === 'Active';

  }


  isStudentInactive(): boolean {

    return this.getStudentStatus() === 'Inactive';

  }


  // ==========================================
  // CHECK READ-ONLY ACCESS
  // ==========================================

  isStudentReadOnly(): boolean {

    const user = this.getUser();

    if (!user || user.role !== 'Student') {
      return false;
    }

    return user.status !== 'Active';

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