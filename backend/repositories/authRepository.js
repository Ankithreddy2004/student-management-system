const db = require('../config/db');

// ==========================================
// CHECK EMAIL AVAILABILITY
// ==========================================

exports.checkEmail = async (email) => {

    const [results] = await db.promise().query(
        'CALL sp_auth_check_email(?)',
        [email]
    );

    return results[0];

};


// ==========================================
// REGISTER STUDENT
// ==========================================

exports.registerStudent = async (
    name,
    email,
    phone,
    course,
    passwordHash
) => {

    const [results] = await db.promise().query(
        'CALL sp_auth_register_student(?, ?, ?, ?, ?)',
        [
            name,
            email,
            phone,
            course,
            passwordHash
        ]
    );

    return results[0][0];

};


// ==========================================
// USER LOGIN
// ==========================================

exports.login = async (email) => {

    const [results] = await db.promise().query(
        'CALL sp_auth_login(?)',
        [email]
    );

    return results[0];

};

// ==========================================
// GET COURSE AND SEMESTER OPTIONS
// ==========================================

exports.getAcademicOptions = async () => {

    const [results] = await db.promise().query(
        'CALL sp_academic_get_options()'
    );

    return results[0];

};


// ==========================================
// REGISTER STUDENT WITH SEMESTER
// ==========================================

exports.registerStudentV2 = async (
    name,
    email,
    phone,
    course,
    semester,
    passwordHash
) => {

    const [results] = await db.promise().query(
        'CALL sp_auth_register_student_v2(?, ?, ?, ?, ?, ?)',
        [
            name,
            email,
            phone,
            course,
            semester,
            passwordHash
        ]
    );

    return results[0][0];

};