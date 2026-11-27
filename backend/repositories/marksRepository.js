const db = require('../config/db');

const pool = db.promise();


// ==========================================
// 1. GET STUDENT'S OWN MARKS
// ==========================================

exports.getMyMarks = async (studentId) => {

    const [results] = await pool.query(
        'CALL sp_marks_get_my(?)',
        [studentId]
    );

    return results[0];

};


// ==========================================
// 2. GET TEACHER SUBJECTS
// ==========================================

exports.getTeacherSubjects = async (teacherId) => {

    const [results] = await pool.query(
        'CALL sp_marks_get_teacher_subjects(?)',
        [teacherId]
    );

    return results[0];

};


// ==========================================
// 3. GET STUDENTS FOR MARKS
// ==========================================

exports.getStudentsForMarks = async (
    teacherId,
    subjectId
) => {

    const [results] = await pool.query(
        'CALL sp_marks_get_students(?, ?)',
        [teacherId, subjectId]
    );

    const outcome = results[0][0].outcome;

    return {
        outcome,
        data: outcome === 'success'
            ? results[1]
            : []
    };

};


// ==========================================
// 4. GET EXAMINATIONS BY SUBJECT
// ==========================================

exports.getExamsBySubject = async (
    teacherId,
    subjectId
) => {

    const [results] = await pool.query(
        'CALL sp_marks_get_exams(?, ?)',
        [teacherId, subjectId]
    );

    return results[0];

};


// ==========================================
// 5. CREATE EXAMINATION
// ==========================================

exports.createExam = async (
    teacherId,
    subjectId,
    examName,
    examType,
    examDate,
    maxMarks
) => {

    const [results] = await pool.query(
        'CALL sp_marks_create_exam(?, ?, ?, ?, ?, ?)',
        [
            teacherId,
            subjectId,
            examName,
            examType,
            examDate,
            maxMarks
        ]
    );

    return results[0][0];

};


// ==========================================
// 6. UPDATE EXAMINATION
// ==========================================

exports.updateExam = async (
    teacherId,
    examId,
    examName,
    examType,
    examDate,
    maxMarks
) => {

    const [results] = await pool.query(
        'CALL sp_marks_update_exam(?, ?, ?, ?, ?, ?)',
        [
            teacherId,
            examId,
            examName,
            examType,
            examDate,
            maxMarks
        ]
    );

    return results[0][0];

};


// ==========================================
// 7. DELETE EXAMINATION
// ==========================================

exports.deleteExam = async (
    teacherId,
    examId
) => {

    const [results] = await pool.query(
        'CALL sp_marks_delete_exam(?, ?)',
        [teacherId, examId]
    );

    return results[0][0];

};


// ==========================================
// 8. ADD BULK MARKS
// ==========================================

exports.addMarks = async (
    teacherId,
    examId,
    students
) => {

    const [results] = await pool.query(
        'CALL sp_marks_add_bulk(?, ?, ?)',
        [
            teacherId,
            examId,
            JSON.stringify(students)
        ]
    );

    return results[0][0];

};


// ==========================================
// 9. GET MARKS RECORDS
// ==========================================

exports.getMarksRecords = async (
    teacherId,
    examId
) => {

    const [results] = await pool.query(
        'CALL sp_marks_get_records(?, ?)',
        [teacherId, examId]
    );

    return results[0];

};


// ==========================================
// 10. EDIT MARKS
// ==========================================

exports.editMarks = async (
    teacherId,
    markId,
    obtainedMarks,
    remarks
) => {

    const [results] = await pool.query(
        'CALL sp_marks_edit(?, ?, ?, ?)',
        [
            teacherId,
            markId,
            obtainedMarks,
            remarks
        ]
    );

    return results[0][0];

};


// ==========================================
// 11. DELETE MARKS
// ==========================================

exports.deleteMarks = async (
    teacherId,
    markId
) => {

    const [results] = await pool.query(
        'CALL sp_marks_delete(?, ?)',
        [teacherId, markId]
    );

    return results[0][0];

};