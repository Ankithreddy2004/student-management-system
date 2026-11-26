const db = require('../config/db');

const pool = db.promise();

// ==========================================
// 1. GET ALL USERS
// ==========================================

exports.getAllUsers = async () => {
    const [results] = await pool.query(
        'CALL sp_user_get_all()'
    );

    return results[0];
};


// ==========================================
// 2. CHECK EMAIL
// ==========================================

exports.checkEmail = async (email, excludeId = null) => {
    const [results] = await pool.query(
        'CALL sp_user_check_email(?, ?)',
        [email, excludeId]
    );

    return results[0];
};


// ==========================================
// 3. CREATE TEACHER
// ==========================================

exports.createTeacher = async (
    name,
    email,
    passwordHash
) => {
    const [results] = await pool.query(
        'CALL sp_user_create_teacher(?, ?, ?)',
        [name, email, passwordHash]
    );

    return results[0][0];
};


// ==========================================
// 4. GET TEACHER DETAILS
// ==========================================

exports.getTeacherById = async (teacherId) => {
    const [results] = await pool.query(
        'CALL sp_user_get_teacher(?)',
        [teacherId]
    );

    return results[0][0] || null;
};


// ==========================================
// 5. UPDATE TEACHER
// ==========================================

exports.updateTeacher = async (
    teacherId,
    name,
    email
) => {
    const [results] = await pool.query(
        'CALL sp_user_update_teacher(?, ?, ?)',
        [teacherId, name, email]
    );

    return results[0][0];
};


// ==========================================
// 6. CHECK SUBJECT ASSIGNMENTS
// ==========================================

exports.checkAssignments = async (teacherId) => {
    const [results] = await pool.query(
        'CALL sp_user_check_assignments(?)',
        [teacherId]
    );

    return results[0];
};


// ==========================================
// 7. DELETE TEACHER
// ==========================================

exports.deleteTeacher = async (teacherId) => {
    const [results] = await pool.query(
        'CALL sp_user_delete_teacher(?)',
        [teacherId]
    );

    return results[0][0];
};


// ==========================================
// 8. GET TEACHER IMAGE
// ==========================================

exports.getTeacherImage = async (teacherId) => {
    const [results] = await pool.query(
        'CALL sp_user_get_teacher_image(?)',
        [teacherId]
    );

    return results[0][0] || null;
};


// ==========================================
// 9. UPDATE TEACHER IMAGE
// ==========================================

exports.updateTeacherImage = async (
    teacherId,
    imagePath
) => {
    const [results] = await pool.query(
        'CALL sp_user_update_teacher_image(?, ?)',
        [teacherId, imagePath]
    );

    return results[0][0];
};