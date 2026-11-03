const db = require('../config/db');

// Get marks of the logged-in student
const getMyMarks = (req, res) => {

    const studentId = req.user.student_id;

    if (!studentId) {
        return res.status(400).json({
            success: false,
            message: 'Student information not found.'
        });
    }

    const sql = `
        SELECT
            m.id,
            m.obtained_marks,
            m.remarks,
            e.id AS exam_id,
            e.exam_name,
            e.exam_type,
            e.exam_date,
            e.max_marks,
            s.id AS subject_id,
            s.subject_name,
            s.subject_code
        FROM marks m
        JOIN exams e
            ON m.exam_id = e.id
        JOIN subjects s
            ON e.subject_id = s.id
        WHERE m.student_id = ?
        ORDER BY e.exam_date DESC
    `;

    db.query(sql, [studentId], (error, results) => {

        if (error) {
            return res.status(500).json({
                success: false,
                message: 'Unable to fetch marks records.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Marks records fetched successfully.',
            data: results
        });
    });
};

module.exports = {
    getMyMarks
};