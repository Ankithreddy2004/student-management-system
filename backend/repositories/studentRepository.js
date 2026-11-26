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
// 3. ADD STUDENT
// ==========================================

exports.addStudent = async (
    name,
    email,
    phone,
    course
) => {

    const [results] = await pool.query(
        'CALL sp_student_add(?, ?, ?, ?)',
        [name, email, phone, course]
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
// 5. UPDATE STUDENT
// ==========================================

exports.updateStudent = async (
    id,
    name,
    email,
    phone,
    course
) => {

    const [results] = await pool.query(
        'CALL sp_student_update(?, ?, ?, ?, ?)',
        [id, name, email, phone, course]
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
// ==========================================

exports.updateMyProfile = async (
    id,
    name,
    phone,
    course
) => {

    const [results] = await pool.query(
        'CALL sp_student_update_profile(?, ?, ?, ?)',
        [id, name, phone, course]
    );

    return results[0][0];

};