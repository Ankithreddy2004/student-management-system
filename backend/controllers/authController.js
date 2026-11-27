const bcrypt = require('bcryptjs');

const jwt = require('jsonwebtoken');

const authRepository = require('../repositories/authRepository');


// ==========================================
// CHECK EMAIL AVAILABILITY
// ==========================================

exports.checkEmail = async (req, res) => {

    const email = req.query.email;

    if (!email || typeof email !== 'string') {

        return res.status(400).json({
            success: false,
            available: false,
            message: 'Email is required.'
        });

    }

    const cleanEmail = email.trim().toLowerCase();

    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (
        !emailPattern.test(cleanEmail) ||
        cleanEmail.length > 150
    ) {

        return res.status(400).json({
            success: false,
            available: false,
            message: 'Please enter a valid email.'
        });

    }

    try {

        const results =
            await authRepository.checkEmail(cleanEmail);

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

    } catch (error) {

        console.error(
            'Email Check Error:',
            error.code || 'UNKNOWN_ERROR'
        );

        return res.status(500).json({
            success: false,
            available: false,
            message: 'Unable to check email availability.'
        });

    }

};


// ==========================================
// GET AVAILABLE COURSES AND SEMESTERS
// ==========================================

exports.getAcademicOptions = async (req, res) => {

    try {

        const results =
            await authRepository.getAcademicOptions();

        return res.status(200).json({

            success: true,

            data: results

        });

    } catch (error) {

        console.error(
            'Academic Options Error:',
            error.code || 'UNKNOWN_ERROR'
        );

        return res.status(500).json({

            success: false,

            message: 'Unable to fetch courses and semesters.'

        });

    }

};


// ==========================================
// STUDENT SIGNUP WITH COURSE AND SEMESTER
// ==========================================

exports.signup = async (req, res) => {

    try {

        const {
            name,
            email,
            phone,
            course,
            semester,
            password
        } = req.body || {};


        // 1. Validate required fields

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
            !password ||

            semester === undefined ||
            semester === null ||
            semester === ''

        ) {

            return res.status(400).json({

                success: false,

                message: 'All fields are required.'

            });

        }


        // 2. Clean inputs

        const cleanName = name.trim();

        const cleanEmail =
            email.trim().toLowerCase();

        const cleanPhone = phone.trim();

        const cleanCourse = course.trim();


        // 3. Validate input lengths

        if (

            cleanName.length > 100 ||

            cleanEmail.length > 150 ||

            cleanCourse.length > 100

        ) {

            return res.status(400).json({

                success: false,

                message: 'Name, email or course exceeds the allowed length.'

            });

        }


        // 4. Validate email

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

        if (!emailPattern.test(cleanEmail)) {

            return res.status(400).json({

                success: false,

                message: 'Please enter a valid email address.'

            });

        }


        // 5. Validate phone number

        if (!/^\d{10}$/.test(cleanPhone)) {

            return res.status(400).json({

                success: false,

                message: 'Phone number must contain exactly 10 digits.'

            });

        }


        // 6. Validate password

        const passwordPattern =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

        if (!passwordPattern.test(password)) {

            return res.status(400).json({

                success: false,

                message: 'Password must contain at least 8 characters, including uppercase, lowercase, number and special character.'

            });

        }


        // 7. Prevent bcrypt password truncation

        if (Buffer.byteLength(password, 'utf8') > 72) {

            return res.status(400).json({

                success: false,

                message: 'Password must not exceed 72 bytes.'

            });

        }


        // 8. Validate course

        if (!cleanCourse) {

            return res.status(400).json({

                success: false,

                message: 'Course is required.'

            });

        }


        // 9. Validate semester

        if (

            (
                typeof semester !== 'number' &&
                typeof semester !== 'string'
            ) ||

            !/^[1-8]$/.test(String(semester))

        ) {

            return res.status(400).json({

                success: false,

                message: 'Semester must be a whole number between 1 and 8.'

            });

        }

        const semesterNumber = Number(semester);


        // 10. Check existing email

        const existingEmail =
            await authRepository.checkEmail(cleanEmail);

        if (existingEmail.length > 0) {

            return res.status(409).json({

                success: false,

                message: 'An account with this email already exists. Please use another email or log in.'

            });

        }


        // 11. Hash password

        const hashedPassword =
            await bcrypt.hash(password, 12);


        // 12. Register student through stored procedure

        const result =
            await authRepository.registerStudentV2(

                cleanName,

                cleanEmail,

                cleanPhone,

                cleanCourse,

                semesterNumber,

                hashedPassword

            );


        // 13. Check stored procedure response

        if (!result) {

            return res.status(500).json({

                success: false,

                message: 'No registration response received.'

            });

        }


        // 14. Validate semester outcome

        if (result.outcome === 'invalid_semester') {

            return res.status(400).json({

                success: false,

                message: 'Please select a valid semester.'

            });

        }


        // 15. Validate course and semester combination

        if (
            result.outcome === 'invalid_academic_selection'
        ) {

            return res.status(400).json({

                success: false,

                message: 'The selected course and semester combination is not available.'

            });

        }


        // 16. Verify registration result

        if (result.outcome !== 'success') {

            return res.status(500).json({

                success: false,

                message: 'Registration failed. Please try again.'

            });

        }


        // 17. Registration successful

        return res.status(201).json({

            success: true,

            message: 'Registration successful. Your account is waiting for approval.',

            data: {

                student_id: result.student_id,

                user_id: result.user_id,

                name: result.name,

                email: result.email,

                course: result.course,

                semester: result.semester,

                role: result.role,

                status: result.status

            }

        });

    } catch (error) {

        console.error(

            'Student Signup Error:',

            error.code || 'UNKNOWN_ERROR'

        );


        // Duplicate email

        if (

            error.code === 'ER_DUP_ENTRY' ||

            error.errno === 1062

        ) {

            return res.status(409).json({

                success: false,

                message: 'An account with this email already exists. Please use another email or log in.'

            });

        }


        // Missing stored procedure

        if (

            error.code === 'ER_SP_DOES_NOT_EXIST' ||

            error.errno === 1305

        ) {

            console.error(
                'Registration stored procedure is missing. Run npm run db:migrate.'
            );

            return res.status(500).json({

                success: false,

                message: 'Registration service is unavailable. Please contact the administrator.'

            });

        }


        // General error

        return res.status(500).json({

            success: false,

            message: 'Registration failed. Please try again.'

        });

    }

};


// ==========================================
// USER LOGIN
// ==========================================

exports.login = async (req, res) => {

    try {

        const { email, password } = req.body || {};


        // 1. Validate required fields

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


        // 2. Clean email

        const cleanEmail =
            email.trim().toLowerCase();


        // 3. Retrieve user through stored procedure

        let results;

        try {

            results =
                await authRepository.login(cleanEmail);

        } catch (error) {

            console.error(

                'Login Database Error:',

                error.code || 'UNKNOWN_ERROR'

            );

            return res.status(500).json({

                success: false,

                message: 'Database error.'

            });

        }


        // 4. Check whether user exists

        if (results.length === 0) {

            return res.status(401).json({

                success: false,

                message: 'Invalid email or password.'

            });

        }

        const user = results[0];

        try {


            // 5. Verify password

            const isPasswordValid =
                await bcrypt.compare(

                    password,

                    user.password

                );

            if (!isPasswordValid) {

                return res.status(401).json({

                    success: false,

                    message: 'Invalid email or password.'

                });

            }


            // 6. Check student profile

            if (

                user.role === 'Student' &&

                !user.student_id

            ) {

                return res.status(403).json({

                    success: false,

                    message: 'Student profile is not linked to this account.'

                });

            }


            // 7. Generate JWT token

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


            // 8. Return successful login response

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

            console.error(

                'Login Processing Error:',

                loginError.code || 'UNKNOWN_ERROR'

            );

            return res.status(500).json({

                success: false,

                message: 'Login processing failed.'

            });

        }

    } catch (error) {

        console.error(

            'Login Error:',

            error.code || 'UNKNOWN_ERROR'

        );

        return res.status(500).json({

            success: false,

            message: 'Internal server error.'

        });

    }

};