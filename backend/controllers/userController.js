const bcrypt = require('bcryptjs');
const db = require('../config/db');

const fs = require('fs');
const path = require('path');

const uploadDirectory = path.join(
    __dirname,
    '../uploads/teachers'
);

// Create upload directory if it doesn't exist.
fs.mkdirSync(uploadDirectory, { recursive: true });


// ==========================================
// IMAGE HELPERS
// ==========================================

const detectImageExtension = (buffer) => {

    if (
        buffer.length >= 3 &&
        buffer[0] === 0xFF &&
        buffer[1] === 0xD8 &&
        buffer[2] === 0xFF
    ) {
        return 'jpg';
    }

    if (
        buffer.length >= 8 &&
        buffer.subarray(0, 8).equals(
            Buffer.from([
                0x89, 0x50, 0x4E, 0x47,
                0x0D, 0x0A, 0x1A, 0x0A
            ])
        )
    ) {
        return 'png';
    }

    if (
        buffer.length >= 12 &&
        buffer.toString('ascii', 0, 4) === 'RIFF' &&
        buffer.toString('ascii', 8, 12) === 'WEBP'
    ) {
        return 'webp';
    }

    return null;

};


const saveTeacherImage = async (teacherId, file) => {

    if (!file) {
        return null;
    }

    const extension = detectImageExtension(file.buffer);

    if (!extension) {
        throw new Error('Invalid image file. Upload a genuine JPG, PNG or WebP image.');
    }

    const filename = `${teacherId}.${extension}`;

    const absolutePath = path.join(
        uploadDirectory,
        filename
    );

    const relativePath = `uploads/teachers/${filename}`;

    await fs.promises.writeFile(absolutePath, file.buffer);

    return relativePath;

};


const deleteTeacherImage = async (imagePath) => {

    if (!imagePath) {
        return;
    }

    // Only delete files from the teacher upload directory.
    const normalizedPath = imagePath.replace(/\\/g, '/');

    if (!normalizedPath.startsWith('uploads/teachers/')) {
        return;
    }

    const filename = path.basename(normalizedPath);

    const absolutePath = path.join(
        uploadDirectory,
        filename
    );

    try {
        await fs.promises.unlink(absolutePath);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error('Image deletion error:', error);
        }
    }

};


const getTeacherImagePath = (imagePath) => {

    if (!imagePath) {
        return null;
    }

    const normalizedPath = imagePath.replace(/\\/g, '/');

    if (!normalizedPath.startsWith('uploads/teachers/')) {
        return null;
    }

    const filename = path.basename(normalizedPath);

    return path.join(uploadDirectory, filename);

};


// ==========================================
// GET ALL USERS
// ==========================================

exports.getAllUsers = (req, res) => {

    const sql = `
        SELECT
            id,
            name,
            email,
            role,
            student_id,
            profile_image,
            created_at
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


// ==========================================
// CREATE TEACHER ACCOUNT
// ==========================================

exports.createTeacher = async (req, res) => {

    try {

        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email and password are required.'
            });
        }

        if (
            typeof name !== 'string' ||
            typeof email !== 'string' ||
            typeof password !== 'string'
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid input.'
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

        if (
            req.file &&
            !detectImageExtension(req.file.buffer)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid image file.'
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

                        async (insertError, result) => {

                            if (insertError) {
                                console.error(insertError);

                                return res.status(500).json({
                                    success: false,
                                    message: 'Unable to create teacher account.'
                                });
                            }

                            const teacherId = result.insertId;

                            let imagePath = null;

                            try {

                                if (req.file) {

                                    imagePath = await saveTeacherImage(
                                        teacherId,
                                        req.file
                                    );

                                    db.query(
                                        `UPDATE users
                                         SET profile_image = ?
                                         WHERE id = ? AND role = 'Teacher'`,
                                        [imagePath, teacherId],
                                        (updateError) => {

                                            if (updateError) {
                                                console.error(updateError);

                                                deleteTeacherImage(imagePath);

                                                return res.status(500).json({
                                                    success: false,
                                                    message: 'Teacher created, but image path could not be saved.'
                                                });
                                            }

                                            return res.status(201).json({
                                                success: true,
                                                message: 'Teacher created successfully.',
                                                data: {
                                                    id: teacherId,
                                                    name: cleanName,
                                                    email: cleanEmail,
                                                    role: 'Teacher',
                                                    profile_image: imagePath
                                                }
                                            });

                                        }
                                    );

                                } else {

                                    return res.status(201).json({
                                        success: true,
                                        message: 'Teacher account created successfully.',
                                        data: {
                                            id: teacherId,
                                            name: cleanName,
                                            email: cleanEmail,
                                            role: 'Teacher',
                                            profile_image: null
                                        }
                                    });

                                }

                            } catch (imageError) {

                                console.error(imageError);

                                db.query(
                                    'DELETE FROM users WHERE id = ? AND role = ?',
                                    [teacherId, 'Teacher']
                                );

                                return res.status(500).json({
                                    success: false,
                                    message: 'Unable to save teacher image.'
                                });

                            }

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


// ==========================================
// UPDATE TEACHER
// ==========================================

exports.updateTeacher = (req, res) => {

    const teacherId = Number(req.params.id);
    const { name, email } = req.body;

    if (!Number.isInteger(teacherId) || teacherId <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid teacher ID.'
        });
    }

    if (
        typeof name !== 'string' ||
        typeof email !== 'string' ||
        !name.trim() ||
        !email.trim()
    ) {
        return res.status(400).json({
            success: false,
            message: 'Name and email are required.'
        });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return res.status(400).json({
            success: false,
            message: 'Please enter a valid email.'
        });
    }

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


// ==========================================
// DELETE TEACHER
// ==========================================

exports.deleteTeacher = (req, res) => {

    const teacherId = Number(req.params.id);

    if (!Number.isInteger(teacherId) || teacherId <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid teacher ID.'
        });
    }

    db.query(
        `SELECT id, profile_image FROM users
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

            const imagePath = results[0].profile_image;

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

                    db.query(
                        `DELETE FROM users
                         WHERE id = ? AND role = 'Teacher'`,
                        [teacherId],
                        async (deleteError, result) => {

                            if (deleteError) {
                                console.error(deleteError);

                                if (deleteError.code === 'ER_ROW_IS_REFERENCED_2') {
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

                            await deleteTeacherImage(imagePath);

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


// ==========================================
// GET LOGGED-IN TEACHER PROFILE
// ==========================================

exports.getMyProfile = (req, res) => {

    db.query(
        `SELECT id, name, email, role, profile_image
         FROM users
         WHERE id = ? AND role = 'Teacher'`,
        [req.user.id],
        (error, results) => {

            if (error) {
                console.error(error);

                return res.status(500).json({
                    success: false,
                    message: 'Unable to fetch profile.'
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Teacher profile not found.'
                });
            }

            return res.status(200).json({
                success: true,
                data: results[0]
            });

        }
    );

};


// ==========================================
// GET TEACHER IMAGE
// ==========================================

exports.getTeacherImage = (req, res) => {

    const teacherId = Number(req.params.id);

    if (
        req.user.role !== 'Admin' &&
        (
            req.user.role !== 'Teacher' ||
            Number(req.user.id) !== teacherId
        )
    ) {
        return res.status(403).json({
            success: false,
            message: 'You can only access your own profile image.'
        });
    }

    if (!Number.isInteger(teacherId) || teacherId <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid teacher ID.'
        });
    }

    db.query(
        `SELECT profile_image
         FROM users
         WHERE id = ? AND role = 'Teacher'`,
        [teacherId],
        (error, results) => {

            if (error) {
                console.error(error);

                return res.status(500).json({
                    success: false,
                    message: 'Unable to fetch image.'
                });
            }

            if (
                results.length === 0 ||
                !results[0].profile_image
            ) {
                return res.status(404).json({
                    success: false,
                    message: 'Profile image not found.'
                });
            }

            const imagePath = getTeacherImagePath(
                results[0].profile_image
            );

            if (!imagePath) {
                return res.status(404).json({
                    success: false,
                    message: 'Invalid image path.'
                });
            }

            return res.sendFile(imagePath, (sendError) => {

                if (sendError && !res.headersSent) {
                    res.status(404).json({
                        success: false,
                        message: 'Profile image not found.'
                    });
                }

            });

        }
    );

};


// ==========================================
// UPDATE TEACHER IMAGE
// ==========================================

exports.updateMyProfileImage = (req, res) => {

    if (req.user.role !== 'Teacher') {
        return res.status(403).json({
            success: false,
            message: 'Only teachers can update their profile image.'
        });
    }

    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'Please select an image.'
        });
    }

    const extension = detectImageExtension(req.file.buffer);

    if (!extension) {
        return res.status(400).json({
            success: false,
            message: 'Invalid image file.'
        });
    }

    const teacherId = Number(req.user.id);

    db.query(
        `SELECT profile_image
         FROM users
         WHERE id = ? AND role = 'Teacher'`,
        [teacherId],
        async (error, results) => {

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

            const oldImagePath = results[0].profile_image;

            try {

                const newImagePath = await saveTeacherImage(
                    teacherId,
                    req.file
                );

                db.query(
                    `UPDATE users
                     SET profile_image = ?
                     WHERE id = ? AND role = 'Teacher'`,
                    [newImagePath, teacherId],
                    async (updateError) => {

                        if (updateError) {
                            console.error(updateError);

                            await deleteTeacherImage(newImagePath);

                            return res.status(500).json({
                                success: false,
                                message: 'Unable to update profile image.'
                            });
                        }

                        // The new file replaces the old image.
                        // It is saved with the same teacher ID.
                        return res.status(200).json({
                            success: true,
                            message: 'Profile image updated successfully.',
                            profile_image: newImagePath
                        });

                    }
                );

            } catch (imageError) {

                console.error(imageError);

                return res.status(500).json({
                    success: false,
                    message: 'Unable to save profile image.'
                });

            }

        }
    );

};


// ==========================================
// ADMIN UPDATE TEACHER IMAGE
// ==========================================

exports.updateTeacherImage = (req, res) => {

    const teacherId = Number(req.params.id);

    if (!Number.isInteger(teacherId) || teacherId <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid teacher ID.'
        });
    }

    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'Please select an image.'
        });
    }

    if (!detectImageExtension(req.file.buffer)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid image file.'
        });
    }

    db.query(
        `SELECT id
         FROM users
         WHERE id = ? AND role = 'Teacher'`,
        [teacherId],
        async (error, results) => {

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

            try {

                const newImagePath = await saveTeacherImage(
                    teacherId,
                    req.file
                );

                db.query(
                    `UPDATE users
                     SET profile_image = ?
                     WHERE id = ? AND role = 'Teacher'`,
                    [newImagePath, teacherId],
                    (updateError) => {

                        if (updateError) {
                            console.error(updateError);

                            deleteTeacherImage(newImagePath);

                            return res.status(500).json({
                                success: false,
                                message: 'Unable to update teacher image.'
                            });
                        }

                        return res.status(200).json({
                            success: true,
                            message: 'Teacher image updated successfully.',
                            profile_image: newImagePath
                        });

                    }
                );

            } catch (imageError) {

                console.error(imageError);

                return res.status(500).json({
                    success: false,
                    message: 'Unable to save teacher image.'
                });

            }

        }
    );

};