
const db = require('../config/db');

const pool = db.promise();


// ==========================================
// 1. GET ALL SUBJECTS
// ==========================================

exports.getAllSubjects = async () => {

    const [results] = await pool.query(
        'CALL sp_subject_get_all()'
    );

    return results[0];

};


// ==========================================
// 2. GET SUBJECT BY ID
// ==========================================

exports.getSubjectById = async (subjectId) => {

    const [results] = await pool.query(
        'CALL sp_subject_get_by_id(?)',
        [subjectId]
    );

    return results[0];

};


// ==========================================
// 3. CREATE SUBJECT
// ==========================================

exports.createSubject = async (
    subjectName,
    subjectCode,
    course,
    semester
) => {

    const [results] = await pool.query(
        'CALL sp_subject_create(?, ?, ?, ?)',
        [
            subjectName,
            subjectCode,
            course,
            semester
        ]
    );

    return results[0][0];

};


// ==========================================
// 4. UPDATE SUBJECT
// ==========================================

exports.updateSubject = async (
    subjectId,
    subjectName,
    subjectCode,
    course,
    semester
) => {

    const [results] = await pool.query(
        'CALL sp_subject_update(?, ?, ?, ?, ?)',
        [
            subjectId,
            subjectName,
            subjectCode,
            course,
            semester
        ]
    );

    return results[0][0];

};


// ==========================================
// 5. DELETE SUBJECT
// ==========================================

exports.deleteSubject = async (subjectId) => {

    const [results] = await pool.query(
        'CALL sp_subject_delete(?)',
        [subjectId]
    );

    return results[0][0];

};


// ==========================================
// 6. GET ALL ASSIGNMENTS
// ==========================================

exports.getAllAssignments = async () => {

    const [results] = await pool.query(
        'CALL sp_subject_get_assignments()'
    );

    return results[0];

};


// ==========================================
// 7. ASSIGN MULTIPLE SUBJECTS
// ==========================================

exports.assignSubjects = async (
    teacherId,
    subjectIds
) => {

    const [results] = await pool.query(
        'CALL sp_subject_assign_multiple(?, ?)',
        [
            teacherId,
            JSON.stringify(subjectIds)
        ]
    );

    return results[0][0];

};


// ==========================================
// 8. REMOVE ASSIGNMENT
// ==========================================

exports.removeAssignment = async (
    assignmentId
) => {

    const [results] = await pool.query(
        'CALL sp_subject_remove_assignment(?)',
        [assignmentId]
    );

    return results[0][0];

};
