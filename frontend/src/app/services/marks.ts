import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
providedIn: 'root'
})
export class Marks {

private apiUrl = 'http://localhost:5000/api/marks';

constructor(private http: HttpClient) {}

// =====================================
// STUDENT: GET MY MARKS
// =====================================

getMyMarks(): Observable<any> {
return this.http.get<any>(
`${this.apiUrl}/my-marks`
);
}

// =====================================
// TEACHER: GET ASSIGNED SUBJECTS
// =====================================

getTeacherSubjects(): Observable<any> {
return this.http.get<any>(
`${this.apiUrl}/teacher/subjects`
);
}

// =====================================
// TEACHER: GET STUDENTS BY SUBJECT
// =====================================

getStudentsForMarks(subjectId: number): Observable<any> {
return this.http.get<any>(
`${this.apiUrl}/teacher/students/${subjectId}`
);
}

// =====================================
// TEACHER: GET EXAMS BY SUBJECT
// =====================================

getExamsBySubject(subjectId: number): Observable<any> {
return this.http.get<any>(
`${this.apiUrl}/teacher/exams/${subjectId}`
);
}

// =====================================
// TEACHER: CREATE EXAM
// =====================================

createExam(data: any): Observable<any> {
return this.http.post<any>(
`${this.apiUrl}/teacher/exams`,
data
);
}

// =====================================
// TEACHER: UPDATE EXAM
// =====================================

updateExam(examId: number, data: any): Observable<any> {
return this.http.put<any>(
`${this.apiUrl}/teacher/exams/${examId}`,
data
);
}

// =====================================
// TEACHER: DELETE EXAM
// =====================================

deleteExam(examId: number): Observable<any> {
return this.http.delete<any>(
`${this.apiUrl}/teacher/exams/${examId}`
);
}

// =====================================
// TEACHER: ADD BULK MARKS
// =====================================

addMarks(data: any): Observable<any> {
return this.http.post<any>(
`${this.apiUrl}/teacher/add`,
data
);
}

// =====================================
// TEACHER: GET MARKS RECORDS
// =====================================

getMarksRecords(examId: number): Observable<any> {
return this.http.get<any>(
`${this.apiUrl}/teacher/records/${examId}`
);
}

// =====================================
// TEACHER: EDIT MARKS
// =====================================

editMarks(markId: number, data: any): Observable<any> {
return this.http.put<any>(
`${this.apiUrl}/teacher/edit/${markId}`,
data
);
}

// =====================================
// TEACHER: DELETE MARKS
// =====================================

deleteMarks(markId: number): Observable<any> {
return this.http.delete<any>(
`${this.apiUrl}/teacher/delete/${markId}`
);
}

}
