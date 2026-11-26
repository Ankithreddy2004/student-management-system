const db = require('../config/db');

const pool = db.promise();


// ==========================================
// 1. GET AVAILABLE SUBJECTS
// ==========================================

exports.getAvailableSubjects = async (
    teacherId = null
) => {

    const [results] = await pool.query(
        'CALL sp_enrollment_get_subjects(?)',
        [teacherId]
    );

    return results[0];

};


// ==========================================
// 2. CREATE ENROLLMENT REQUEST
// ==========================================

exports.enrollStudent = async (
    studentId,
    subjectId,
    enrolledBy,
    enrolledByRole
) => {

    const [results] = await pool.query(
        'CALL sp_enrollment_create(?, ?, ?, ?)',
        [
            studentId,
            subjectId,
            enrolledBy,
            enrolledByRole
        ]
    );

    return results[0][0];

};


// ==========================================
// 3. GET MY ENROLLMENTS
// ==========================================

exports.getMyEnrollments = async (studentId) => {

    const [results] = await pool.query(
        'CALL sp_enrollment_get_my(?)',
        [studentId]
    );

    return results[0];

};


// ==========================================
// 4. GET ALL ENROLLMENTS
// ==========================================

exports.getAllEnrollments = async (
    teacherId = null,
    status = null,
    subjectId = null,
    studentId = null
) => {

    const [results] = await pool.query(
        'CALL sp_enrollment_get_all(?, ?, ?, ?)',
        [
            teacherId,
            status,
            subjectId,
            studentId
        ]
    );

    return results[0];

};


// ==========================================
// 5. APPROVE OR REJECT ENROLLMENT
// ==========================================

exports.reviewEnrollment = async (
    enrollmentId,
    reviewerId,
    reviewerRole,
    newStatus
) => {

    const [results] = await pool.query(
        'CALL sp_enrollment_review(?, ?, ?, ?)',
        [
            enrollmentId,
            reviewerId,
            reviewerRole,
            newStatus
        ]
    );

    return results[0][0];

};


// ==========================================
// 6. GET ENROLLMENTS FOR ONE STUDENT
// ==========================================

exports.getStudentEnrollments = async (
    studentId,
    teacherId = null
) => {

    const [results] = await pool.query(
        'CALL sp_enrollment_get_student(?, ?)',
        [
            studentId,
            teacherId
        ]
    );

    return results[0];

};