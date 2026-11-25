import { Routes } from '@angular/router';

// Dashboard layouts
import { AdminLayout } from './components/admin-layout/admin-layout';
import { TeacherLayout } from './components/teacher-layout/teacher-layout';
import { StudentLayout } from './components/student-layout/student-layout';

// Dashboard components
import { StudentDashboard } from './components/student-dashboard/student-dashboard';
import { AdminDashboard } from './components/admin-dashboard/admin-dashboard';
import { TeacherDashboard } from './components/teacher-dashboard/teacher-dashboard';

// Admin components
import { AdminTeachers } from './components/admin-teachers/admin-teachers';
import { AdminSubjects } from './components/admin-subjects/admin-subjects';
import { AdminAssignments } from './components/admin-assignments/admin-assignments';

// Teacher components
import { TeacherPendingStudents } from './components/teacher-pending-students/teacher-pending-students';
import { TeacherAttendance } from './components/teacher-attendance/teacher-attendance';
import { TeacherMarks } from './components/teacher-marks/teacher-marks';
import { TeacherProfile } from './components/teacher-profile/teacher-profile';

// Student components
import { StudentAttendance } from './components/student-attendance/student-attendance';
import { StudentMarks } from './components/student-marks/student-marks';
import { StudentProfile } from './components/student-profile/student-profile';
import { StudentSubjects } from './components/student-subjects/student-subjects';

// Student CRUD components
import { Students } from './components/students/students';
import { AddStudent } from './components/add-student/add-student';
import { EditStudent } from './components/edit-student/edit-student';
import { TeacherEnrollments } from './components/teacher-enrollments/teacher-enrollments';
import { AdminEnrollments } from './components/admin-enrollments/admin-enrollments';

// Authentication
import { Login } from './components/login/login';
import { Signup } from './components/signup/signup';

// Guards
import { authGuard, roleGuard } from './guards/auth.guard';

export const routes: Routes = [

  // ==========================================
  // DEFAULT ROUTE
  // ==========================================

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  // ==========================================
  // AUTHENTICATION
  // ==========================================

  {
    path: 'login',
    component: Login
  },

  {
    path: 'signup',
    component: Signup
  },

  // ==========================================
  // STUDENT LAYOUT AND CHILD ROUTES
  // ==========================================

  {
    path: 'student',
    component: StudentLayout,
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['Student']
    },
    children: [

      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },

      // Student Dashboard
      {
        path: 'dashboard',
        component: StudentDashboard
      },

      // Student Attendance
      {
        path: 'attendance',
        component: StudentAttendance
      },

      // Student Marks
      {
        path: 'marks',
        component: StudentMarks
      },

      // Student Subject Enrollment
      {
        path: 'subjects',
        component: StudentSubjects
      },

      // Student Profile
      {
        path: 'profile',
        component: StudentProfile
      }

    ]
  },

  // ==========================================
  // ADMIN LAYOUT AND CHILD ROUTES
  // ==========================================

  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['Admin']
    },
    children: [

      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },

      // Admin Dashboard
      {
        path: 'dashboard',
        component: AdminDashboard
      },

      //student enrollment
      {
        path: 'enrollments',
        component: AdminEnrollments
      },

      // Student Management
      {
        path: 'students',
        component: Students
      },

      {
        path: 'add-student',
        component: AddStudent
      },

      {
        path: 'edit-student/:id',
        component: EditStudent
      },

      // Teacher Management
      {
        path: 'teachers',
        component: AdminTeachers
      },

      // Subject Management
      {
        path: 'subjects',
        component: AdminSubjects
      },

      // Teacher Subject Assignments
      {
        path: 'assignments',
        component: AdminAssignments
      }

    ]
  },

  // ==========================================
  // TEACHER LAYOUT AND CHILD ROUTES
  // ==========================================

  {
    path: 'teacher',
    component: TeacherLayout,
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['Teacher']
    },
    children: [

      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },

      // Teacher Dashboard
      {
        path: 'dashboard',
        component: TeacherDashboard
      },

      // Teacher Subject Enrollment Management
      {
        path: 'enrollments',
        component: TeacherEnrollments
      },

      // Student Management
      {
        path: 'students',
        component: Students
      },

      {
        path: 'add-student',
        component: AddStudent
      },

      {
        path: 'edit-student/:id',
        component: EditStudent
      },

      // Pending Student Account Approvals
      {
        path: 'pending-students',
        component: TeacherPendingStudents
      },

      // Attendance Management
      {
        path: 'attendance',
        component: TeacherAttendance
      },

      // Marks Management
      {
        path: 'marks',
        component: TeacherMarks
      },

      // Teacher Profile
      {
        path: 'profile',
        component: TeacherProfile
      }

    ]
  },

  // ==========================================
  // LEGACY DASHBOARD URL REDIRECTS
  // ==========================================

  {
    path: 'student-dashboard',
    redirectTo: 'student/dashboard',
    pathMatch: 'full'
  },

  {
    path: 'admin-dashboard',
    redirectTo: 'admin/dashboard',
    pathMatch: 'full'
  },

  {
    path: 'teacher-dashboard',
    redirectTo: 'teacher/dashboard',
    pathMatch: 'full'
  },

  // ==========================================
  // UNKNOWN ROUTES
  // ==========================================

  {
    path: '**',
    redirectTo: 'login'
  }

];
