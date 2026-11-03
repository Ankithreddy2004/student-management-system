const db = require('../config/db');

// ==========================================
// GET ALL STUDENTS
// ==========================================

const getAllStudents = (req, res) => {

    const sql = 'SELECT * FROM students ORDER BY id ASC';

    db.query(sql, (err, results) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error fetching students.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Students fetched successfully.',
            data: results
        });

    });

};


// ==========================================
// GET PENDING STUDENTS
// ==========================================

const getPendingStudents = (req, res) => {

    const sql = `
        SELECT
            id,
            name,
            email,
            phone,
            course,
            status,
            created_at
        FROM students
        WHERE status = 'Pending'
        ORDER BY created_at ASC
    `;

    db.query(sql, (err, results) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error fetching pending registrations.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Pending registrations fetched successfully.',
            data: results
        });

    });

};


// ==========================================
// ADD NEW STUDENT
// ==========================================

const addStudent = (req, res) => {

    let { name, email, phone, course } = req.body;

    if (!name || !email || !phone || !course) {
        return res.status(400).json({
            success: false,
            message: 'All fields are required.'
        });
    }

    name = String(name).trim();
    email = String(email).trim().toLowerCase();
    phone = String(phone).trim();
    course = String(course).trim();

    if (!name || !course) {
        return res.status(400).json({
            success: false,
            message: 'Name and course cannot be empty.'
        });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'Please enter a valid email address.'
        });
    }

    if (!/^\d{10}$/.test(phone)) {
        return res.status(400).json({
            success: false,
            message: 'Phone number must contain exactly 10 digits.'
        });
    }

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
                    message: 'Email already exists.'
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Error adding student.'
            });

        }

        res.status(201).json({
            success: true,
            message: 'Student added successfully.',
            studentId: result.insertId
        });

    });

};


// ==========================================
// GET STUDENT BY ID
// ==========================================

const getStudentById = (req, res) => {

    const { id } = req.params;

    if (!/^[1-9]\d*$/.test(id)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid student ID.'
        });
    }

    const sql = 'SELECT * FROM students WHERE id = ?';

    db.query(sql, [id], (err, results) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error fetching student.'
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Student fetched successfully.',
            data: results[0]
        });

    });

};


// ==========================================
// UPDATE STUDENT
// ==========================================

const updateStudent = (req, res) => {

    const { id } = req.params;

    let { name, email, phone, course } = req.body;

    if (!/^[1-9]\d*$/.test(id)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid student ID.'
        });
    }

    if (!name || !email || !phone || !course) {
        return res.status(400).json({
            success: false,
            message: 'All fields are required.'
        });
    }

    name = String(name).trim();
    email = String(email).trim().toLowerCase();
    phone = String(phone).trim();
    course = String(course).trim();

    if (!name || !course) {
        return res.status(400).json({
            success: false,
            message: 'Name and course cannot be empty.'
        });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid email address.'
        });
    }

    if (!/^\d{10}$/.test(phone)) {
        return res.status(400).json({
            success: false,
            message: 'Phone must contain exactly 10 digits.'
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
                    message: 'Email already exists.'
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Error updating student.'
            });

        }

        if (result.affectedRows === 0) {

            return db.query(
                'SELECT id FROM students WHERE id = ?',
                [id],
                (checkErr, rows) => {

                    if (checkErr) {
                        return res.status(500).json({
                            success: false,
                            message: 'Error checking student record.'
                        });
                    }

                    if (rows.length === 0) {
                        return res.status(404).json({
                            success: false,
                            message: 'Student not found.'
                        });
                    }

                    res.status(200).json({
                        success: true,
                        message: 'Student information is already up to date.'
                    });

                }
            );

        }

        res.status(200).json({
            success: true,
            message: 'Student updated successfully.'
        });

    });

};


// ==========================================
// DELETE STUDENT
// ADMIN ONLY
// ==========================================

const deleteStudent = (req, res) => {

    const { id } = req.params;

    if (!/^[1-9]\d*$/.test(id)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid student ID.'
        });
    }

    const sql = 'DELETE FROM students WHERE id = ?';

    db.query(sql, [id], (err, result) => {

        if (err) {

            if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(409).json({
                    success: false,
                    message: 'Cannot delete this student because related records exist.'
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Error deleting student.'
            });

        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Student deleted successfully.'
        });

    });

};


// ==========================================
// UPDATE STUDENT STATUS
// ADMIN AND TEACHER
// ==========================================

const updateStudentStatus = (req, res) => {

    const { id } = req.params;
    const { status } = req.body;

    if (!/^[1-9]\d*$/.test(id)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid student ID.'
        });
    }

    if (!['Active', 'Inactive'].includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Status must be Active or Inactive.'
        });
    }

    const sql = `
        UPDATE students
        SET status = ?
        WHERE id = ?
    `;

    db.query(sql, [status, id], (err, result) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Unable to update student status.'
            });
        }

        if (result.affectedRows === 0) {

            return db.query(
                'SELECT id FROM students WHERE id = ?',
                [id],
                (checkErr, rows) => {

                    if (checkErr) {
                        return res.status(500).json({
                            success: false,
                            message: 'Error checking student record.'
                        });
                    }

                    if (rows.length === 0) {
                        return res.status(404).json({
                            success: false,
                            message: 'Student not found.'
                        });
                    }

                    res.status(200).json({
                        success: true,
                        message: 'Student already has this status.',
                        data: {
                            id: Number(id),
                            status
                        }
                    });

                }
            );

        }

        res.status(200).json({
            success: true,
            message: 'Student status updated successfully.',
            data: {
                id: Number(id),
                status
            }
        });

    });

};


// ==========================================
// APPROVE PENDING STUDENT
// ADMIN AND TEACHER
// ==========================================

const approveStudent = (req, res) => {

    const { id } = req.params;

    if (!/^[1-9]\d*$/.test(id)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid student ID.'
        });
    }

    const sql = `
        UPDATE students
        SET status = 'Active'
        WHERE id = ?
        AND status = 'Pending'
    `;

    db.query(sql, [id], (err, result) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Unable to approve student.'
            });
        }

        if (result.affectedRows === 0) {

            return db.query(
                'SELECT status FROM students WHERE id = ?',
                [id],
                (checkErr, rows) => {

                    if (checkErr) {
                        return res.status(500).json({
                            success: false,
                            message: 'Error checking student record.'
                        });
                    }

                    if (rows.length === 0) {
                        return res.status(404).json({
                            success: false,
                            message: 'Student not found.'
                        });
                    }

                    return res.status(409).json({
                        success: false,
                        message: `Student cannot be approved. Current status: ${rows[0].status}.`
                    });

                }
            );

        }

        res.status(200).json({
            success: true,
            message: 'Student approved successfully. The account is now Active.',
            data: {
                id: Number(id),
                status: 'Active'
            }
        });

    });

};


// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {

    getAllStudents,
    getPendingStudents,
    addStudent,
    getStudentById,
    updateStudent,
    deleteStudent,
    updateStudentStatus,
    approveStudent

};