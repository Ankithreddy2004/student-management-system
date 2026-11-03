const db = require('../config/db');

// Get attendance records of the logged-in student
const getMyAttendance = (req, res) => {

    // Get student ID from JWT
    const studentId = req.user.student_id;

    if (!studentId) {
        return res.status(400).json({
            success: false,
            message: 'Student information not found.'
        });
    }

    const sql = `
        SELECT
            a.id,
            a.attendance_date,
            a.status,
            a.remarks,
            s.id AS subject_id,
            s.subject_name,
            s.subject_code
        FROM attendance a
        JOIN subjects s
            ON a.subject_id = s.id
        WHERE a.student_id = ?
        ORDER BY a.attendance_date DESC
    `;

    db.query(sql, [studentId], (error, results) => {

        if (error) {
            return res.status(500).json({
                success: false,
                message: 'Unable to fetch attendance records.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Attendance records fetched successfully.',
            data: results
        });
    });
};

module.exports = {
    getMyAttendance
};