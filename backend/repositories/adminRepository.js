const db = require('../config/db');

const pool = db.promise();


// ==========================================
// 1. GET ALL TEACHERS
// ==========================================

exports.getAllTeachers = async () => {

    const [results] = await pool.query(
        'CALL sp_admin_get_teachers()'
    );

    return results[0];

};


// ==========================================
// 2. GET ADMIN DASHBOARD STATISTICS
// ==========================================

exports.getDashboardStats = async () => {

    const [results] = await pool.query(
        'CALL sp_admin_get_dashboard_stats()'
    );

    return results[0][0];

};