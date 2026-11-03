import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeacherPendingStudents } from './teacher-pending-students';

describe('TeacherPendingStudents', () => {
  let component: TeacherPendingStudents;
  let fixture: ComponentFixture<TeacherPendingStudents>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeacherPendingStudents],
    }).compileComponents();

    fixture = TestBed.createComponent(TeacherPendingStudents);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
