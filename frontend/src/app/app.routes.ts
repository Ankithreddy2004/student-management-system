import { Routes } from '@angular/router';

// Dashboard layouts
import { AdminLayout } from './components/admin-layout/admin-layout';
import { TeacherLayout } from './components/teacher-layout/teacher-layout';

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

// Student CRUD components
import { Students } from './components/students/students';
import { AddStudent } from './components/add-student/add-student';
import { EditStudent } from './components/edit-student/edit-student';

// Authentication
import { Login } from './components/login/login';
import { Signup } from './components/signup/signup';

// Guards
import { authGuard, roleGuard } from './guards/auth.guard';

export const routes: Routes = [

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  // Authentication routes
  {
    path: 'login',
    component: Login
  },

  {
    path: 'signup',
    component: Signup
  },


  // STUDENT DASHBOARD
  {
    path: 'student-dashboard',
    component: StudentDashboard,
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['Student']
    }
  },


  // ADMIN LAYOUT AND CHILD ROUTES
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

      {
        path: 'dashboard',
        component: AdminDashboard
      },

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

      {
        path: 'teachers',
        component: AdminTeachers
      },

      {
        path: 'subjects',
        component: AdminSubjects
      },

      {
        path: 'assignments',
        component: AdminAssignments
      }

    ]
  },


  // TEACHER LAYOUT AND CHILD ROUTES
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

      {
        path: 'dashboard',
        component: TeacherDashboard
      },

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

      {
        path: 'pending-students',
        component: TeacherPendingStudents
      },

      {
        path: 'attendance',
        component: TeacherAttendance
      },

      {
        path: 'marks',
        component: TeacherMarks
      },

      {
        path: 'profile',
        component: TeacherProfile
      }

    ]
  },


  // Legacy dashboard URLs
  // These keep existing login redirects working.
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


  // Unknown routes
  {
    path: '**',
    redirectTo: 'login'
  }

];