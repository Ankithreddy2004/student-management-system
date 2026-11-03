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
// ADMIN ONLY

exports.createTeacher = async (req, res) => {


try {
    const { name, email, password } = req.body;

    // Validate fields
    if (!name || !email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Name, email and password are required.'
        });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
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

    // Check duplicate email
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
                // Hash password
                const hashedPassword = await bcrypt.hash(password, 12);

                // Insert Teacher account
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
