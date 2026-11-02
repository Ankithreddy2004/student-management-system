import { Routes } from '@angular/router';

import { Students } from './components/students/students';
import { AddStudent } from './components/add-student/add-student';
import { EditStudent } from './components/edit-student/edit-student';

export const routes: Routes = [

{
path: '',
redirectTo: 'students',
pathMatch: 'full'
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
path: '**',
redirectTo: 'students'
}

];
