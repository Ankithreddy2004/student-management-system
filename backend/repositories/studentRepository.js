const db = require('../config/db');

const pool = db.promise();


// ==========================================
// 1. GET ALL STUDENTS
// ==========================================

exports.getAllStudents = async () => {

    const [results] = await pool.query(
        'CALL sp_student_get_all()'
    );

    return results[0];

};


// ==========================================
// 2. GET PENDING STUDENTS
// ==========================================

exports.getPendingStudents = async () => {

    const [results] = await pool.query(
        'CALL sp_student_get_pending()'
    );

    return results[0];

};


// ==========================================
// 3. ADD STUDENT WITH SEMESTER
// ==========================================

exports.addStudent = async (
    name,
    email,
    phone,
    course,
    semester
) => {

    const [results] = await pool.query(
        'CALL sp_student_add_v2(?, ?, ?, ?, ?)',
        [
            name,
            email,
            phone,
            course,
            semester
        ]
    );

    return results[0][0];

};


// ==========================================
// 4. GET STUDENT BY ID
// ==========================================

exports.getStudentById = async (id) => {

    const [results] = await pool.query(
        'CALL sp_student_get_by_id(?)',
        [id]
    );

    return results[0];

};


// ==========================================
// 5. UPDATE STUDENT WITH SEMESTER
// ==========================================

exports.updateStudent = async (
    id,
    name,
    email,
    phone,
    course,
    semester,
    isAdmin
) => {

    const [results] = await pool.query(
        'CALL sp_student_update_v2(?, ?, ?, ?, ?, ?, ?)',
        [
            id,
            name,
            email,
            phone,
            course,
            semester,
            isAdmin ? 1 : 0
        ]
    );

    return results[0][0];

};


// ==========================================
// 6. DELETE STUDENT
// ==========================================

exports.deleteStudent = async (id) => {

    const [results] = await pool.query(
        'CALL sp_student_delete(?)',
        [id]
    );

    return results[0][0];

};


// ==========================================
// 7. UPDATE STUDENT STATUS
// ==========================================

exports.updateStudentStatus = async (id, status) => {

    const [results] = await pool.query(
        'CALL sp_student_update_status(?, ?)',
        [id, status]
    );

    return results[0][0];

};


// ==========================================
// 8. APPROVE STUDENT
// ==========================================

exports.approveStudent = async (id) => {

    const [results] = await pool.query(
        'CALL sp_student_approve(?)',
        [id]
    );

    return results[0][0];

};


// ==========================================
// 9. UPDATE OWN PROFILE
// NAME AND PHONE ONLY
// ==========================================

exports.updateMyProfile = async (
    id,
    name,
    phone
) => {

    const [results] = await pool.query(
        'CALL sp_student_update_profile_v2(?, ?, ?)',
        [
            id,
            name,
            phone
        ]
    );

    return results[0][0];

};