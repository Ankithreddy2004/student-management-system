import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { Auth } from '../../services/auth';

@Component({
  selector: 'app-teacher-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatIconModule
  ],
  templateUrl: './teacher-layout.html',
  styleUrl: './teacher-layout.css'
})
export class TeacherLayout implements OnInit {

  teacherName = '';

  constructor(
    private authService: Auth,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();

    if (user) {
      this.teacherName = user.name;
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}