const db = require('../config/db');

// ==========================================
// GET ALL TEACHERS
// ==========================================

exports.getAllTeachers = (req, res) => {

    const sql = `
        SELECT
            id,
            name,
            email,
            role,
            created_at
        FROM users
        WHERE role = 'Teacher'
        ORDER BY name ASC
    `;

    db.query(sql, (err, results) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Unable to fetch teachers.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Teachers fetched successfully.',
            data: results
        });

    });

};


// ==========================================
// ADMIN DASHBOARD STATISTICS
// ==========================================

exports.getDashboardStats = (req, res) => {

    const sql = `
        SELECT
            (SELECT COUNT(*) FROM students)
                AS total_students,

            (SELECT COUNT(*)
             FROM students
             WHERE status = 'Active')
                AS active_students,

            (SELECT COUNT(*)
             FROM students
             WHERE status = 'Inactive')
                AS inactive_students,

            (SELECT COUNT(*)
             FROM students
             WHERE status = 'Pending')
                AS pending_students,

            (SELECT COUNT(*)
             FROM users
             WHERE role = 'Teacher')
                AS total_teachers,

            (SELECT COUNT(*)
             FROM subjects)
                AS total_subjects,

            (SELECT COUNT(*)
             FROM teacher_subjects)
                AS total_assignments
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                success: false,
                message: 'Unable to fetch dashboard statistics.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Dashboard statistics fetched successfully.',
            data: results[0]
        });

    });

};