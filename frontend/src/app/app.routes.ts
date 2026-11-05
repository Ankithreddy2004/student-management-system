import { Routes } from '@angular/router';

// CRUD components
import { Students } from './components/students/students';
import { AddStudent } from './components/add-student/add-student';
import { EditStudent } from './components/edit-student/edit-student';

// Dashboard components
import { StudentDashboard } from './components/student-dashboard/student-dashboard';
import { TeacherDashboard } from './components/teacher-dashboard/teacher-dashboard';
import { AdminDashboard } from './components/admin-dashboard/admin-dashboard';
import { TeacherPendingStudents } from './components/teacher-pending-students/teacher-pending-students';
import { TeacherAttendance } from './components/teacher-attendance/teacher-attendance';
import { TeacherMarks } from './components/teacher-marks/teacher-marks';

import { AdminSubjects } from './components/admin-subjects/admin-subjects';

import { AdminAssignments } from './components/admin-assignments/admin-assignments';
// Authentication components
import { Login } from './components/login/login';
import { Signup } from './components/signup/signup';

import { AdminTeachers } from './components/admin-teachers/admin-teachers';

// Authentication guards
import { authGuard, roleGuard } from './guards/auth.guard';

export const routes: Routes = [

// Default route
{
path: '',
redirectTo: 'login',
pathMatch: 'full'
},

// Public routes
{
path: 'login',
component: Login
},
{
path: 'signup',
component: Signup
},

// Student dashboard
{
path: 'student-dashboard',
component: StudentDashboard,
canActivate: [authGuard, roleGuard],
data: { roles: ['Student'] }
},

// Teacher dashboard
{
path: 'teacher-dashboard',
component: TeacherDashboard,
canActivate: [authGuard, roleGuard],
data: { roles: ['Teacher'] }
},

// Admin dashboard
{
path: 'admin-dashboard',
component: AdminDashboard,
canActivate: [authGuard, roleGuard],
data: { roles: ['Admin'] }
},

// Student CRUD - Admin and Teacher
{
path: 'students',
component: Students,
canActivate: [authGuard, roleGuard],
data: { roles: ['Admin', 'Teacher'] }
},
{
path: 'add-student',
component: AddStudent,
canActivate: [authGuard, roleGuard],
data: { roles: ['Admin', 'Teacher'] }
},
{
path: 'edit-student/:id',
component: EditStudent,
canActivate: [authGuard, roleGuard],
data: { roles: ['Admin', 'Teacher'] }
},

// Unauthorized route
{
path: 'unauthorized',
redirectTo: 'login'
},
{
  path: 'admin/teachers',
  component: AdminTeachers,
  canActivate: [authGuard, roleGuard],
  data: { roles: ['Admin'] }
},
{
  path: 'teacher/pending-students',
  component: TeacherPendingStudents,
  canActivate: [authGuard, roleGuard],
  data: { roles: ['Teacher', 'Admin'] }
},

{
  path: 'teacher/attendance',
  component: TeacherAttendance,
  canActivate: [authGuard, roleGuard],
  data: { roles: ['Teacher'] }
},
{
  path: 'teacher/marks',
  component: TeacherMarks,
  canActivate: [authGuard, roleGuard],
  data: { roles: ['Teacher'] }
},

{
  path: 'admin/subjects',
  component: AdminSubjects,
  canActivate: [authGuard, roleGuard],
  data: { roles: ['Admin'] }
},

{
  path: 'admin/assignments',
  component: AdminAssignments,
  canActivate: [authGuard, roleGuard],
  data: { roles: ['Admin'] }
},

// Unknown routes
{
path: '**',
redirectTo: 'login'
}
];
