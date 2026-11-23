const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// ==========================================
// CHECK EMAIL AVAILABILITY
// ==========================================

exports.checkEmail = (req, res) => {

    const email = req.query.email;

    if (!email || typeof email !== 'string') {
        return res.status(400).json({
            success: false,
            available: false,
            message: 'Email is required.'
        });
    }

    const cleanEmail = email.trim().toLowerCase();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (!emailPattern.test(cleanEmail)) {
        return res.status(400).json({
            success: false,
            available: false,
            message: 'Please enter a valid email.'
        });
    }

    const query = `
        SELECT email FROM users
        WHERE LOWER(email) = ?

        UNION

        SELECT email FROM students
        WHERE LOWER(email) = ?

        LIMIT 1
    `;

    db.query(
        query,
        [cleanEmail, cleanEmail],
        (error, results) => {

            if (error) {

                console.error('Email Check Error:', error);

                return res.status(500).json({
                    success: false,
                    available: false,
                    message: 'Unable to check email availability.'
                });

            }

            if (results.length > 0) {

                return res.status(200).json({
                    success: true,
                    available: false,
                    message: 'Email already registered.'
                });

            }

            return res.status(200).json({
                success: true,
                available: true,
                message: 'Email is available.'
            });

        }
    );

};


// ==========================================
// STUDENT SIGNUP
// ==========================================

exports.signup = async (req, res) => {

    let connection;

    let transactionStarted = false;

    try {

        const {
            name,
            email,
            phone,
            course,
            password
        } = req.body;

        // 1. Required fields

        if (
            typeof name !== 'string' ||
            typeof email !== 'string' ||
            typeof phone !== 'string' ||
            typeof course !== 'string' ||
            typeof password !== 'string' ||
            !name.trim() ||
            !email.trim() ||
            !phone.trim() ||
            !course.trim() ||
            !password
        ) {

            return res.status(400).json({
                success: false,
                message: 'All fields are required.'
            });

        }

        // 2. Clean inputs

        const cleanName = name.trim();

        const cleanEmail = email.trim().toLowerCase();

        const cleanPhone = phone.trim();

        const cleanCourse = course.trim();

        // 3. Validate email

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

        if (!emailPattern.test(cleanEmail)) {

            return res.status(400).json({
                success: false,
                message: 'Please enter a valid email address.'
            });

        }

        // 4. Validate phone

        if (!/^\d{10}$/.test(cleanPhone)) {

            return res.status(400).json({
                success: false,
                message: 'Phone number must contain exactly 10 digits.'
            });

        }

        // 5. Validate password

        const passwordPattern =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

        if (!passwordPattern.test(password)) {

            return res.status(400).json({
                success: false,
                message: 'Password must contain at least 8 characters, including uppercase, lowercase, number and special character.'
            });

        }

        // 6. Validate course

        if (!cleanCourse) {

            return res.status(400).json({
                success: false,
                message: 'Course is required.'
            });

        }

        // 7. Check existing email

        const existingEmail = await new Promise((resolve, reject) => {

            db.query(
                `
                SELECT email FROM users
                WHERE LOWER(email) = ?

                UNION

                SELECT email FROM students
                WHERE LOWER(email) = ?

                LIMIT 1
                `,
                [cleanEmail, cleanEmail],
                (error, results) => {

                    if (error) {
                        reject(error);
                    } else {
                        resolve(results);
                    }

                }
            );

        });

        if (existingEmail.length > 0) {

            return res.status(409).json({
                success: false,
                message: 'An account with this email already exists. Please use another email or log in.'
            });

        }

        // 8. Hash password

        const hashedPassword = await bcrypt.hash(password, 12);

        // 9. Get database connection

        connection = await new Promise((resolve, reject) => {

            db.getConnection((error, conn) => {

                if (error) {
                    reject(error);
                } else {
                    resolve(conn);
                }

            });

        });

        // 10. Start transaction

        await new Promise((resolve, reject) => {

            connection.beginTransaction(error => {

                if (error) {
                    reject(error);
                } else {

                    transactionStarted = true;

                    resolve();

                }

            });

        });

        // 11. Insert student with Pending status

        const studentResult = await new Promise((resolve, reject) => {

            connection.query(
                `
                INSERT INTO students
                (name, email, phone, course, status)
                VALUES (?, ?, ?, ?, 'Pending')
                `,
                [
                    cleanName,
                    cleanEmail,
                    cleanPhone,
                    cleanCourse
                ],
                (error, result) => {

                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }

                }
            );

        });

        const studentId = studentResult.insertId;

        // 12. Create Student login account

        const userResult = await new Promise((resolve, reject) => {

            connection.query(
                `
                INSERT INTO users
                (name, email, password, role, student_id)
                VALUES (?, ?, ?, 'Student', ?)
                `,
                [
                    cleanName,
                    cleanEmail,
                    hashedPassword,
                    studentId
                ],
                (error, result) => {

                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }

                }
            );

        });

        // 13. Commit transaction

        await new Promise((resolve, reject) => {

            connection.commit(error => {

                if (error) {
                    reject(error);
                } else {

                    transactionStarted = false;

                    resolve();

                }

            });

        });

        // 14. Registration successful

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

    } catch (error) {

        console.error('Student Signup Error:', error);

        // Rollback transaction

        if (connection && transactionStarted) {

            await new Promise(resolve => {

                connection.rollback(() => resolve());

            });

        }

        // Duplicate email

        if (error.code === 'ER_DUP_ENTRY') {

            return res.status(409).json({

                success: false,

                message: 'An account with this email already exists. Please use another email or log in.'

            });

        }

        return res.status(500).json({

            success: false,

            message: 'Registration failed. Please try again.'

        });

    } finally {

        if (connection) {
            connection.release();
        }

    }

};


// ==========================================
// USER LOGIN
// ==========================================

exports.login = async (req, res) => {

    try {

        const { email, password } = req.body;

        if (
            typeof email !== 'string' ||
            typeof password !== 'string' ||
            !email.trim() ||
            !password
        ) {

            return res.status(400).json({
                success: false,
                message: 'Email and password are required.'
            });

        }

        const cleanEmail = email.trim().toLowerCase();

        db.query(

            `
            SELECT
                u.id,
                u.name,
                u.email,
                u.password,
                u.role,
                u.student_id,
                s.status AS student_status

            FROM users u

            LEFT JOIN students s
                ON u.student_id = s.id

            WHERE u.email = ?
            `,

            [cleanEmail],

            async (error, results) => {

                if (error) {

                    console.error(error);

                    return res.status(500).json({
                        success: false,
                        message: 'Database error.'
                    });

                }

                if (results.length === 0) {

                    return res.status(401).json({
                        success: false,
                        message: 'Invalid email or password.'
                    });

                }

                const user = results[0];

                try {

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

                    if (user.role === 'Student' && !user.student_id) {

                        return res.status(403).json({
                            success: false,
                            message: 'Student profile is not linked to this account.'
                        });

                    }

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