const db = require('../config/db');

const pool = db.promise();


// ==========================================
// 1. GET STUDENT'S OWN ATTENDANCE
// ==========================================

exports.getMyAttendance = async (studentId) => {

    const [results] = await pool.query(
        'CALL sp_attendance_get_my(?)',
        [studentId]
    );

    return results[0];

};


// ==========================================
// 2. GET TEACHER'S ASSIGNED SUBJECTS
// ==========================================

exports.getTeacherSubjects = async (teacherId) => {

    const [results] = await pool.query(
        'CALL sp_attendance_get_teacher_subjects(?)',
        [teacherId]
    );

    return results[0];

};


// ==========================================
// 3. GET STUDENTS FOR ATTENDANCE
// ==========================================

exports.getStudentsForAttendance = async (
    teacherId,
    subjectId
) => {

    const [results] = await pool.query(
        'CALL sp_attendance_get_students(?, ?)',
        [
            teacherId,
            subjectId
        ]
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
// 4. MARK BULK ATTENDANCE
// ==========================================

exports.markAttendance = async (
    teacherId,
    subjectId,
    attendanceDate,
    students
) => {

    const [results] = await pool.query(
        'CALL sp_attendance_mark(?, ?, ?, ?)',
        [
            teacherId,
            subjectId,
            attendanceDate,
            JSON.stringify(students)
        ]
    );

    return results[0][0];

};


// ==========================================
// 5. GET TEACHER ATTENDANCE RECORDS
// ==========================================

exports.getTeacherAttendanceRecords = async (
    teacherId,
    subjectId,
    attendanceDate = null
) => {

    const [results] = await pool.query(
        'CALL sp_attendance_get_records(?, ?, ?)',
        [
            teacherId,
            subjectId,
            attendanceDate
        ]
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
// 6. EDIT ATTENDANCE RECORD
// ==========================================

exports.editAttendance = async (
    teacherId,
    attendanceId,
    status,
    remarks,
    updateRemarks
) => {

    const [results] = await pool.query(
        'CALL sp_attendance_edit(?, ?, ?, ?, ?)',
        [
            teacherId,
            attendanceId,
            status,
            remarks,
            updateRemarks ? 1 : 0
        ]
    );

    return results[0][0];

};