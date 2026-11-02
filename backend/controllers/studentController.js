const db = require('../config/db');

// GET all students
const getAllStudents = (req, res) => {

    const sql = 'SELECT * FROM students ORDER BY id ASC';

    db.query(sql, (err, results) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                success: false,
                message: 'Error fetching students'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Students fetched successfully',
            data: results
        });

    });

};

// POST - Add new student
const addStudent = (req, res) => {


const { name, email, phone, course } = req.body;

// Validate required fields
if (!name || !email || !phone || !course) {
    return res.status(400).json({
        success: false,
        message: 'All fields are required'
    });
}

// Validate email
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!emailRegex.test(email)) {
    return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
    });
}

// Validate 10-digit phone number
if (!/^\d{10}$/.test(phone)) {
    return res.status(400).json({
        success: false,
        message: 'Phone number must contain exactly 10 digits'
    });
}

// Parameterized SQL query
const sql = `
    INSERT INTO students (name, email, phone, course)
    VALUES (?, ?, ?, ?)
`;

const values = [name, email, phone, course];

db.query(sql, values, (err, result) => {

    if (err) {

        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'Email already exists'
            });
        }

        console.error(err);

        return res.status(500).json({
            success: false,
            message: 'Error adding student'
        });
    }

    res.status(201).json({
        success: true,
        message: 'Student added successfully',
        studentId: result.insertId
    });

});


};

// GET student by ID
const getStudentById = (req, res) => {

    // Get ID from URL
    const { id } = req.params;

    // Validate ID
    if (!/^[1-9]\d*$/.test(id)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid student ID'
        });
    }

    // SQL query
    const sql = 'SELECT * FROM students WHERE id = ?';

    db.query(sql, [id], (err, results) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                success: false,
                message: 'Error fetching student'
            });
        }

        // Check if student exists
        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Student fetched successfully',
            data: results[0]
        });

    });

};


// PUT - Update student
const updateStudent = (req, res) => {

    const { id } = req.params;

    const { name, email, phone, course } = req.body;

    // Validate student ID
    if (!/^[1-9]\d*$/.test(id)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid student ID'
        });
    }

    // Validate required fields
    if (!name || !email || !phone || !course) {
        return res.status(400).json({
            success: false,
            message: 'All fields are required'
        });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid email address'
        });
    }

    // Validate phone
    if (!/^\d{10}$/.test(phone)) {
        return res.status(400).json({
            success: false,
            message: 'Phone must contain exactly 10 digits'
        });
    }

    const sql = `
        UPDATE students
        SET name = ?, email = ?, phone = ?, course = ?
        WHERE id = ?
    `;

    const values = [name, email, phone, course, id];

    db.query(sql, values, (err, result) => {

        if (err) {

            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({
                    success: false,
                    message: 'Email already exists'
                });
            }

            console.error(err);

            return res.status(500).json({
                success: false,
                message: 'Error updating student'
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Student updated successfully'
        });

    });

};

// DELETE - Delete student
const deleteStudent = (req, res) => {

    const { id } = req.params;

    // Validate student ID
    if (!/^[1-9]\d*$/.test(id)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid student ID'
        });
    }

    const sql = 'DELETE FROM students WHERE id = ?';

    db.query(sql, [id], (err, result) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                success: false,
                message: 'Error deleting student'
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Student deleted successfully'
        });

    });

};

// UPDATE Student Status
const updateStudentStatus = (req, res) => {

    const { id } = req.params;
    const { status } = req.body;

    // Validate ID
    if (!/^[1-9]\d*$/.test(id)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid student ID.'
        });
    }

    // Validate status
    if (!['Active', 'Inactive'].includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Status must be Active or Inactive.'
        });
    }

    // Check whether student exists
    db.query(
        'SELECT id FROM students WHERE id = ?',
        [id],
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Database error.'
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Student not found.'
                });
            }

            // Update status
            db.query(
                'UPDATE students SET status = ? WHERE id = ?',
                [status, id],
                (updateErr) => {

                    if (updateErr) {
                        return res.status(500).json({
                            success: false,
                            message: 'Unable to update student status.'
                        });
                    }

                    res.status(200).json({
                        success: true,
                        message: 'Student status updated successfully.',
                        data: {
                            id: Number(id),
                            status: status
                        }
                    });
                }
            );
        }
    );
};


module.exports = {
    getAllStudents,
    addStudent,
    getStudentById,
    updateStudent,
    deleteStudent,
    updateStudentStatus
};