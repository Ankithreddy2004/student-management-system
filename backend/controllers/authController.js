const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// ==========================================
// STUDENT SIGNUP
// ==========================================

exports.signup = async (req, res) => {
    try {
        const { name, email, phone, course, password } = req.body;

        // 1. Validate required fields
        if (!name || !email || !phone || !course || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required.'
            });
        }

        // 2. Validate password
        if (typeof password !== 'string' || password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must contain at least 8 characters.'
            });
        }

        // 3. Clean input
        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();
        const cleanPhone = phone.trim();
        const cleanCourse = course.trim();

        // 4. Validate name and email
        if (
            !cleanName ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid name and email.'
            });
        }

        // 5. Validate phone
        if (!/^\d{10}$/.test(cleanPhone)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid 10-digit phone number.'
            });
        }

        if (!cleanCourse) {
            return res.status(400).json({
                success: false,
                message: 'Course is required.'
            });
        }

        // 6. Check duplicate email in students
        db.query(
            'SELECT id FROM students WHERE email = ?',
            [cleanEmail],
            async (studentError, students) => {

                if (studentError) {
                    console.error(studentError);

                    return res.status(500).json({
                        success: false,
                        message: 'Database error.'
                    });
                }

                if (students.length > 0) {
                    return res.status(409).json({
                        success: false,
                        message: 'A student with this email already exists.'
                    });
                }

                // 7. Check duplicate email in users
                db.query(
                    'SELECT id FROM users WHERE email = ?',
                    [cleanEmail],
                    async (userError, users) => {

                        if (userError) {
                            console.error(userError);

                            return res.status(500).json({
                                success: false,
                                message: 'Database error.'
                            });
                        }

                        if (users.length > 0) {
                            return res.status(409).json({
                                success: false,
                                message: 'An account with this email already exists.'
                            });
                        }

                        try {
                            // 8. Hash password
                            const hashedPassword = await bcrypt.hash(password, 12);

                            // 9. Start transaction
                            db.beginTransaction((transactionError) => {

                                if (transactionError) {
                                    console.error(transactionError);

                                    return res.status(500).json({
                                        success: false,
                                        message: 'Unable to start registration.'
                                    });
                                }

                                // 10. Insert student with Pending status
                                db.query(
                                    `INSERT INTO students
                                    (name, email, phone, course, status)
                                    VALUES (?, ?, ?, ?, 'Pending')`,
                                    [
                                        cleanName,
                                        cleanEmail,
                                        cleanPhone,
                                        cleanCourse
                                    ],
                                    (insertStudentError, studentResult) => {

                                        if (insertStudentError) {
                                            return db.rollback(() => {
                                                console.error(insertStudentError);

                                                return res.status(500).json({
                                                    success: false,
                                                    message: 'Unable to register student.'
                                                });
                                            });
                                        }

                                        const studentId = studentResult.insertId;

                                        // 11. Create Student login account
                                        db.query(
                                            `INSERT INTO users
                                            (name, email, password, role, student_id)
                                            VALUES (?, ?, ?, 'Student', ?)`,
                                            [
                                                cleanName,
                                                cleanEmail,
                                                hashedPassword,
                                                studentId
                                            ],
                                            (insertUserError, userResult) => {

                                                if (insertUserError) {
                                                    return db.rollback(() => {
                                                        console.error(insertUserError);

                                                        return res.status(500).json({
                                                            success: false,
                                                            message: 'Unable to create student account.'
                                                        });
                                                    });
                                                }

                                                // 12. Commit transaction
                                                db.commit((commitError) => {

                                                    if (commitError) {
                                                        return db.rollback(() => {
                                                            console.error(commitError);

                                                            return res.status(500).json({
                                                                success: false,
                                                                message: 'Registration failed.'
                                                            });
                                                        });
                                                    }

                                                    // 13. Registration successful
                                                    return res.status(201).json({
                                                        success: true,
                                                        message: 'Registration successful. Your account is waiting for approval.',
                                                        data: {
                                                            student_id: studentId,
                                                            user_id: userResult.insertId,
                                                            name: cleanName,
                                                            email: cleanEmail,
                                                            role: 'Student',
                                                            status: 'Pending'
                                                        }
                                                    });

                                                });
                                            }
                                        );
                                    }
                                );
                            });

                        } catch (error) {
                            console.error(error);

                            return res.status(500).json({
                                success: false,
                                message: 'Password processing failed.'
                            });
                        }
                    }
                );
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


// ==========================================
// USER LOGIN
// ==========================================

exports.login = async (req, res) => {

    try {
        const { email, password } = req.body;

        // 1. Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required.'
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        // 2. Fetch user and associated student status
        db.query(
            `SELECT
                u.id,
                u.name,
                u.email,
                u.password,
                u.role,
                u.student_id,
                s.status AS student_status
             FROM users u
             LEFT JOIN students s ON u.student_id = s.id
             WHERE u.email = ?`,
            [cleanEmail],

            async (error, results) => {

                if (error) {
                    console.error(error);

                    return res.status(500).json({
                        success: false,
                        message: 'Database error.'
                    });
                }

                // 3. Check user
                if (results.length === 0) {
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid email or password.'
                    });
                }

                const user = results[0];

                try {
                    // 4. Verify password
                    const isPasswordValid = await bcrypt.compare(
                        password,
                        user.password
                    );

                    if (!isPasswordValid) {
                        return res.status(401).json({
                            success: false,
                            message: 'Invalid email or password.'
                        });
                    }

                    // 5. Validate student account relationship
                    if (user.role === 'Student' && !user.student_id) {
                        return res.status(403).json({
                            success: false,
                            message: 'Student profile is not linked to this account.'
                        });
                    }

                    // 6. Generate JWT
                    const token = jwt.sign(
                        {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            role: user.role,
                            student_id: user.student_id
                        },
                        process.env.JWT_SECRET,
                        {
                            expiresIn: '1d'
                        }
                    );

                    // 7. Successful login
                    return res.status(200).json({
                        success: true,
                        message: 'Login successful.',
                        token: token,

                        user: {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            role: user.role,
                            student_id: user.student_id,
                            status: user.role === 'Student'
                                ? user.student_status
                                : null
                        }
                    });

                } catch (loginError) {
                    console.error(loginError);

                    return res.status(500).json({
                        success: false,
                        message: 'Login processing failed.'
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

