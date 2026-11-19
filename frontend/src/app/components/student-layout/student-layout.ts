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
  selector: 'app-student-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatIconModule
  ],
  templateUrl: './student-layout.html',
  styleUrl: './student-layout.css'
})
export class StudentLayout implements OnInit {

  studentName = '';

  constructor(
    private authService: Auth,
    private router: Router
  ) {}

  ngOnInit(): void {

    const user = this.authService.getUser();

    if (user) {
      this.studentName = user.name;
    }

  }

  logout(): void {

    this.authService.logout();

    this.router.navigate(['/login']);

  }

}