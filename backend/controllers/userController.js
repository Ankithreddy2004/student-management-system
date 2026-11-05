const bcrypt = require('bcryptjs');
const db = require('../config/db');

// GET ALL USERS
exports.getAllUsers = (req, res) => {

    const sql = `
        SELECT id, name, email, role, student_id, created_at
        FROM users
        ORDER BY id ASC
    `;

    db.query(sql, (error, results) => {

        if (error) {
            console.error(error);

            return res.status(500).json({
                success: false,
                message: 'Unable to fetch users.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Users fetched successfully.',
            data: results
        });

    });
};


// CREATE TEACHER ACCOUNT
exports.createTeacher = async (req, res) => {

    try {

        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email and password are required.'
            });
        }

        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();

        if (
            !cleanName ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid name and email.'
            });
        }

        if (password.length < 12) {
            return res.status(400).json({
                success: false,
                message: 'Password must contain at least 12 characters.'
            });
        }

        db.query(
            'SELECT id FROM users WHERE email = ?',
            [cleanEmail],
            async (error, results) => {

                if (error) {
                    console.error(error);

                    return res.status(500).json({
                        success: false,
                        message: 'Database error.'
                    });
                }

                if (results.length > 0) {
                    return res.status(409).json({
                        success: false,
                        message: 'An account with this email already exists.'
                    });
                }

                try {

                    const hashedPassword = await bcrypt.hash(password, 12);

                    db.query(
                        `INSERT INTO users
                        (name, email, password, role, student_id)
                        VALUES (?, ?, ?, 'Teacher', NULL)`,
                        [cleanName, cleanEmail, hashedPassword],
                        (insertError, result) => {

                            if (insertError) {
                                console.error(insertError);

                                return res.status(500).json({
                                    success: false,
                                    message: 'Unable to create teacher account.'
                                });
                            }

                            return res.status(201).json({
                                success: true,
                                message: 'Teacher account created successfully.',
                                data: {
                                    id: result.insertId,
                                    name: cleanName,
                                    email: cleanEmail,
                                    role: 'Teacher'
                                }
                            });

                        }
                    );

                } catch (hashError) {

                    console.error(hashError);

                    return res.status(500).json({
                        success: false,
                        message: 'Password hashing failed.'
                    });

                }

            }
        );

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });

    }

};


// UPDATE TEACHER
exports.updateTeacher = (req, res) => {

    const teacherId = Number(req.params.id);
    const { name, email } = req.body;

    if (!Number.isInteger(teacherId) || teacherId <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid teacher ID.'
        });
    }

    if (!name || !email) {
        return res.status(400).json({
            success: false,
            message: 'Name and email are required.'
        });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (
        !cleanName ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
        return res.status(400).json({
            success: false,
            message: 'Please enter a valid name and email.'
        });
    }

    // Verify teacher exists
    db.query(
        `SELECT id FROM users
         WHERE id = ? AND role = 'Teacher'`,
        [teacherId],
        (error, results) => {

            if (error) {
                console.error(error);

                return res.status(500).json({
                    success: false,
                    message: 'Database error.'
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Teacher not found.'
                });
            }

            // Check duplicate email belonging to another user
            db.query(
                'SELECT id FROM users WHERE email = ? AND id != ?',
                [cleanEmail, teacherId],
                (emailError, emailResults) => {

                    if (emailError) {
                        console.error(emailError);

                        return res.status(500).json({
                            success: false,
                            message: 'Unable to verify email.'
                        });
                    }

                    if (emailResults.length > 0) {
                        return res.status(409).json({
                            success: false,
                            message: 'This email is already used by another account.'
                        });
                    }

                    // Update only name and email.
                    // Password remains unchanged.
                    db.query(
                        `UPDATE users
                         SET name = ?, email = ?
                         WHERE id = ? AND role = 'Teacher'`,
                        [cleanName, cleanEmail, teacherId],
                        (updateError) => {

                            if (updateError) {
                                console.error(updateError);

                                return res.status(500).json({
                                    success: false,
                                    message: 'Unable to update teacher.'
                                });
                            }

                            return res.status(200).json({
                                success: true,
                                message: 'Teacher updated successfully.'
                            });

                        }
                    );

                }
            );

        }
    );

};


// DELETE TEACHER
exports.deleteTeacher = (req, res) => {

    const teacherId = Number(req.params.id);

    if (!Number.isInteger(teacherId) || teacherId <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid teacher ID.'
        });
    }

    // Verify teacher exists
    db.query(
        `SELECT id FROM users
         WHERE id = ? AND role = 'Teacher'`,
        [teacherId],
        (error, results) => {

            if (error) {
                console.error(error);

                return res.status(500).json({
                    success: false,
                    message: 'Database error.'
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Teacher not found.'
                });
            }

            // Check whether the teacher has subject assignments
            db.query(
                'SELECT id FROM teacher_subjects WHERE teacher_id = ? LIMIT 1',
                [teacherId],
                (assignmentError, assignments) => {

                    if (assignmentError) {
                        console.error(assignmentError);

                        return res.status(500).json({
                            success: false,
                            message: 'Unable to check teacher assignments.'
                        });
                    }

                    if (assignments.length > 0) {
                        return res.status(409).json({
                            success: false,
                            message: 'This teacher has subject assignments. Remove the assignments before deleting the teacher.'
                        });
                    }

                    // Foreign-key constraints provide an additional
                    // safeguard against deleting referenced records.
                    db.query(
                        `DELETE FROM users
                         WHERE id = ? AND role = 'Teacher'`,
                        [teacherId],
                        (deleteError, result) => {

                            if (deleteError) {
                                console.error(deleteError);

                                if (
                                    deleteError.code === 'ER_ROW_IS_REFERENCED_2' ||
                                    deleteError.code === 'ER_NO_REFERENCED_ROW_2'
                                ) {
                                    return res.status(409).json({
                                        success: false,
                                        message: 'This teacher is linked to existing academic records and cannot be deleted.'
                                    });
                                }

                                return res.status(500).json({
                                    success: false,
                                    message: 'Unable to delete teacher.'
                                });
                            }

                            if (result.affectedRows === 0) {
                                return res.status(404).json({
                                    success: false,
                                    message: 'Teacher not found.'
                                });
                            }

                            return res.status(200).json({
                                success: true,
                                message: 'Teacher deleted successfully.'
                            });

                        }
                    );

                }
            );

        }
    );

};