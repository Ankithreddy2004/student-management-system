import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { Marks } from '../../services/marks';

interface MarkRecord {
  id: number;
  obtained_marks: number;
  remarks?: string;
  exam_id: number;
  exam_name: string;
  exam_type: string;
  exam_date: string;
  max_marks: number;
  subject_id: number;
  subject_name: string;
  subject_code: string;
}

@Component({
  selector: 'app-student-marks',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-marks.html',
  styleUrl: './student-marks.css'
})
export class StudentMarks implements OnInit {

  marksRecords: MarkRecord[] = [];

  isLoading = false;
  errorMessage = '';

  // PAGINATION

  pageSize = 5;
  currentPage = 1;

  pageSizeOptions = [5, 10, 20, 50];

  constructor(
    private marksService: Marks,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadMarks();
  }

  loadMarks(): void {

    this.isLoading = true;
    this.errorMessage = '';

    this.marksService.getMyMarks().subscribe({

      next: (response: any) => {

        this.marksRecords = Array.isArray(response?.data)
          ? response.data
          : [];

        this.currentPage = 1;

        this.isLoading = false;

        this.cdr.markForCheck();
      },

      error: (error) => {

        console.error('Marks loading error:', error);

        this.errorMessage =
          error?.error?.message ||
          'Unable to load marks records.';

        this.isLoading = false;

        this.cdr.markForCheck();
      }

    });
  }

  // PAGINATION GETTERS

  get totalPages(): number {
    return Math.max(
      1,
      Math.ceil(this.marksRecords.length / this.pageSize)
    );
  }

  get paginatedMarks(): MarkRecord[] {

    const startIndex = (this.currentPage - 1) * this.pageSize;

    return this.marksRecords.slice(
      startIndex,
      startIndex + this.pageSize
    );
  }

  get startRecord(): number {
    return this.marksRecords.length === 0
      ? 0
      : (this.currentPage - 1) * this.pageSize + 1;
  }

  get endRecord(): number {
    return Math.min(
      this.currentPage * this.pageSize,
      this.marksRecords.length
    );
  }

  get pages(): number[] {
    return Array.from(
      { length: this.totalPages },
      (_, index) => index + 1
    );
  }

  changePage(page: number): void {

    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;
  }

  changePageSize(event: Event): void {

    const value = Number(
      (event.target as HTMLSelectElement).value
    );

    if (![5, 10, 20, 50].includes(value)) {
      return;
    }

    this.pageSize = value;
    this.currentPage = 1;
  }

  // SUMMARY

  get totalExams(): number {
    return this.marksRecords.length;
  }

  get totalObtainedMarks(): number {
    return this.marksRecords.reduce(
      (total, mark) => total + Number(mark.obtained_marks || 0),
      0
    );
  }

  get totalMaximumMarks(): number {
    return this.marksRecords.reduce(
      (total, mark) => total + Number(mark.max_marks || 0),
      0
    );
  }

  get averagePercentage(): number {

    if (this.totalMaximumMarks === 0) {
      return 0;
    }

    return Math.round(
      (this.totalObtainedMarks / this.totalMaximumMarks) * 100
    );
  }

  get subjectCount(): number {
    return new Set(
      this.marksRecords.map(mark => mark.subject_id)
    ).size;
  }

  getPercentage(mark: MarkRecord): number {

    if (!mark.max_marks || mark.max_marks <= 0) {
      return 0;
    }

    return Math.round(
      (Number(mark.obtained_marks) /
      Number(mark.max_marks)) * 100
    );
  }

  getResult(mark: MarkRecord): string {

    return this.getPercentage(mark) >= 35
      ? 'Pass'
      : 'Needs Improvement';
  }

}