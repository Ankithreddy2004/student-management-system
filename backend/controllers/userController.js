const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const userRepository =
    require('../repositories/userRepository');

const uploadDirectory = path.join(
    __dirname,
    '../uploads/teachers'
);

fs.mkdirSync(uploadDirectory, { recursive: true });


// ==========================================
// IMAGE HELPER - DETECT IMAGE TYPE
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


// ==========================================
// IMAGE HELPER - SAVE IMAGE
// ==========================================

const saveTeacherImage = async (teacherId, file) => {

    if (!file) {
        return null;
    }

    const extension =
        detectImageExtension(file.buffer);

    if (!extension) {
        throw new Error('Invalid image file.');
    }

    const filename =
        `${teacherId}-${randomUUID()}.${extension}`;

    const absolutePath = path.join(
        uploadDirectory,
        filename
    );

    const relativePath =
        `uploads/teachers/${filename}`;

    await fs.promises.writeFile(
        absolutePath,
        file.buffer
    );

    return relativePath;
};


// ==========================================
// IMAGE HELPER - GET IMAGE PATH
// ==========================================

const getTeacherImagePath = (imagePath) => {

    if (!imagePath) {
        return null;
    }

    const normalizedPath =
        imagePath.replace(/\\/g, '/');

    if (
        !normalizedPath.startsWith(
            'uploads/teachers/'
        )
    ) {
        return null;
    }

    const filename = path.basename(normalizedPath);

    return path.join(
        uploadDirectory,
        filename
    );
};


// ==========================================
// IMAGE HELPER - DELETE IMAGE
// ==========================================

const deleteTeacherImage = async (imagePath) => {

    const absolutePath =
        getTeacherImagePath(imagePath);

    if (!absolutePath) {
        return;
    }

    try {

        await fs.promises.unlink(absolutePath);

    } catch (error) {

        if (error.code !== 'ENOENT') {
            console.error(
                'Image deletion error:',
                error.code
            );
        }

    }
};


// ==========================================
// 1. GET ALL USERS
// ==========================================

exports.getAllUsers = async (req, res) => {

    try {

        const results =
            await userRepository.getAllUsers();

        return res.status(200).json({
            success: true,
            message: 'Users fetched successfully.',
            data: results
        });

    } catch (error) {

        console.error(
            'Get Users Error:',
            error.code
        );

        return res.status(500).json({
            success: false,
            message: 'Unable to fetch users.'
        });

    }
};


// ==========================================
// 2. CREATE TEACHER ACCOUNT
// ==========================================

exports.createTeacher = async (req, res) => {

    let stage = 'validation';

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

        const cleanEmail =
            email.trim().toLowerCase();

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


        // Check duplicate email

        stage = 'email';

        const existingUsers =
            await userRepository.checkEmail(
                cleanEmail
            );

        if (existingUsers.length > 0) {

            return res.status(409).json({
                success: false,
                message: 'An account with this email already exists.'
            });

        }


        // Hash password

        stage = 'hash';

        const hashedPassword =
            await bcrypt.hash(password, 12);


        // Create teacher through stored procedure

        stage = 'create';

        const result =
            await userRepository.createTeacher(
                cleanName,
                cleanEmail,
                hashedPassword
            );

        const teacherId = result.teacher_id;

        let imagePath = null;


        // Save teacher profile image

        if (req.file) {

            try {

                imagePath = await saveTeacherImage(
                    teacherId,
                    req.file
                );

            } catch (imageError) {

                console.error(
                    'Image Save Error:',
                    imageError.code
                );

                // Attempt to remove the incomplete
                // teacher account if saving fails.

                try {

                    await userRepository.deleteTeacher(
                        teacherId
                    );

                } catch (cleanupError) {

                    console.error(
                        'Teacher Cleanup Error:',
                        cleanupError.code
                    );

                }

                return res.status(500).json({
                    success: false,
                    message: 'Unable to save teacher image.'
                });

            }


            // Save image path in database

            try {

                const updated =
                    await userRepository.updateTeacherImage(
                        teacherId,
                        imagePath
                    );

                if (!Number(updated.affectedRows)) {
                    throw new Error('Teacher not found.');
                }

            } catch (imageError) {

                console.error(
                    'Image Path Error:',
                    imageError.code
                );

                await deleteTeacherImage(imagePath);

                return res.status(500).json({
                    success: false,
                    message: 'Teacher created, but image path could not be saved.'
                });

            }

        }


        // Return successful response

        return res.status(201).json({

            success: true,

            message: req.file
                ? 'Teacher created successfully.'
                : 'Teacher account created successfully.',

            data: {
                id: teacherId,
                name: cleanName,
                email: cleanEmail,
                role: 'Teacher',
                profile_image: imagePath
            }

        });

    } catch (error) {

        console.error(
            'Create Teacher Error:',
            error.code
        );

        if (error.code === 'ER_DUP_ENTRY') {

            return res.status(409).json({
                success: false,
                message: 'An account with this email already exists.'
            });

        }

        const messages = {
            email: 'Database error.',
            hash: 'Password hashing failed.',
            create: 'Unable to create teacher account.'
        };

        return res.status(500).json({
            success: false,
            message: messages[stage] ||
                'Internal server error.'
        });

    }

};


// ==========================================
// 3. UPDATE TEACHER
// ==========================================

exports.updateTeacher = async (req, res) => {

    const teacherId = Number(req.params.id);

    const { name, email } = req.body;

    if (
        !Number.isInteger(teacherId) ||
        teacherId <= 0
    ) {

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

    const cleanEmail =
        email.trim().toLowerCase();

    if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {

        return res.status(400).json({
            success: false,
            message: 'Please enter a valid email.'
        });

    }

    let stage = 'find';

    try {

        // Check teacher exists

        const teacher =
            await userRepository.getTeacherById(
                teacherId
            );

        if (!teacher) {

            return res.status(404).json({
                success: false,
                message: 'Teacher not found.'
            });

        }


        // Check duplicate email

        stage = 'email';

        const existingUsers =
            await userRepository.checkEmail(
                cleanEmail,
                teacherId
            );

        if (existingUsers.length > 0) {

            return res.status(409).json({
                success: false,
                message: 'This email is already used by another account.'
            });

        }


        // Update teacher

        stage = 'update';

        await userRepository.updateTeacher(
            teacherId,
            cleanName,
            cleanEmail
        );

        return res.status(200).json({
            success: true,
            message: 'Teacher updated successfully.'
        });

    } catch (error) {

        console.error(
            'Update Teacher Error:',
            error.code
        );

        if (error.code === 'ER_DUP_ENTRY') {

            return res.status(409).json({
                success: false,
                message: 'This email is already used by another account.'
            });

        }

        const messages = {
            find: 'Database error.',
            email: 'Unable to verify email.',
            update: 'Unable to update teacher.'
        };

        return res.status(500).json({
            success: false,
            message: messages[stage]
        });

    }

};


// ==========================================
// 4. DELETE TEACHER
// ==========================================

exports.deleteTeacher = async (req, res) => {

    const teacherId = Number(req.params.id);

    if (
        !Number.isInteger(teacherId) ||
        teacherId <= 0
    ) {

        return res.status(400).json({
            success: false,
            message: 'Invalid teacher ID.'
        });

    }

    let stage = 'find';

    try {

        // Check teacher exists

        const teacher =
            await userRepository.getTeacherById(
                teacherId
            );

        if (!teacher) {

            return res.status(404).json({
                success: false,
                message: 'Teacher not found.'
            });

        }


        // Check subject assignments

        stage = 'assignments';

        const assignments =
            await userRepository.checkAssignments(
                teacherId
            );

        if (assignments.length > 0) {

            return res.status(409).json({
                success: false,
                message: 'This teacher has subject assignments. Remove the assignments before deleting the teacher.'
            });

        }


        // Delete teacher

        stage = 'delete';

        const result =
            await userRepository.deleteTeacher(
                teacherId
            );

        if (!Number(result.affectedRows)) {

            return res.status(404).json({
                success: false,
                message: 'Teacher not found.'
            });

        }


        // Delete profile image after successful DB deletion

        await deleteTeacherImage(
            teacher.profile_image
        );

        return res.status(200).json({
            success: true,
            message: 'Teacher deleted successfully.'
        });

    } catch (error) {

        console.error(
            'Delete Teacher Error:',
            error.code
        );

        if (
            error.code === 'ER_ROW_IS_REFERENCED_2' ||
            error.errno === 1451
        ) {

            return res.status(409).json({
                success: false,
                message: 'This teacher is linked to existing academic records and cannot be deleted.'
            });

        }

        const messages = {
            find: 'Database error.',
            assignments: 'Unable to check teacher assignments.',
            delete: 'Unable to delete teacher.'
        };

        return res.status(500).json({
            success: false,
            message: messages[stage]
        });

    }

};


// ==========================================
// 5. GET LOGGED-IN TEACHER PROFILE
// ==========================================

exports.getMyProfile = async (req, res) => {

    try {

        const teacher =
            await userRepository.getTeacherById(
                req.user.id
            );

        if (!teacher) {

            return res.status(404).json({
                success: false,
                message: 'Teacher profile not found.'
            });

        }

        return res.status(200).json({
            success: true,
            data: teacher
        });

    } catch (error) {

        console.error(
            'Get Teacher Profile Error:',
            error.code
        );

        return res.status(500).json({
            success: false,
            message: 'Unable to fetch profile.'
        });

    }

};


// ==========================================
// 6. GET TEACHER PROFILE IMAGE
// ==========================================

exports.getTeacherImage = async (req, res) => {

    const teacherId = Number(req.params.id);


    // Admin can access all teacher images.
    // Teacher can access only their own image.

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

    if (
        !Number.isInteger(teacherId) ||
        teacherId <= 0
    ) {

        return res.status(400).json({
            success: false,
            message: 'Invalid teacher ID.'
        });

    }

    try {

        const teacher =
            await userRepository.getTeacherImage(
                teacherId
            );

        if (
            !teacher ||
            !teacher.profile_image
        ) {

            return res.status(404).json({
                success: false,
                message: 'Profile image not found.'
            });

        }

        const imagePath =
            getTeacherImagePath(
                teacher.profile_image
            );

        if (!imagePath) {

            return res.status(404).json({
                success: false,
                message: 'Invalid image path.'
            });

        }

        return res.sendFile(
            imagePath,
            (sendError) => {

                if (
                    sendError &&
                    !res.headersSent
                ) {

                    res.status(404).json({
                        success: false,
                        message: 'Profile image not found.'
                    });

                }

            }
        );

    } catch (error) {

        console.error(
            'Get Teacher Image Error:',
            error.code
        );

        return res.status(500).json({
            success: false,
            message: 'Unable to fetch image.'
        });

    }

};


// ==========================================
// SHARED IMAGE UPDATE HELPER
// ==========================================

const replaceTeacherImage = async (
    req,
    res,
    teacherId,
    successMessage,
    updateErrorMessage
) => {

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

    let teacher;

    try {

        teacher =
            await userRepository.getTeacherImage(
                teacherId
            );

    } catch (error) {

        console.error(
            'Find Teacher Image Error:',
            error.code
        );

        return res.status(500).json({
            success: false,
            message: 'Database error.'
        });

    }

    if (!teacher) {

        return res.status(404).json({
            success: false,
            message: 'Teacher not found.'
        });

    }

    const oldImagePath = teacher.profile_image;

    let newImagePath;

    try {

        newImagePath = await saveTeacherImage(
            teacherId,
            req.file
        );

    } catch (error) {

        console.error(
            'Save Image Error:',
            error.code
        );

        return res.status(500).json({
            success: false,
            message: 'Unable to save teacher image.'
        });

    }

    try {

        const result =
            await userRepository.updateTeacherImage(
                teacherId,
                newImagePath
            );

        if (!Number(result.affectedRows)) {

            await deleteTeacherImage(newImagePath);

            return res.status(404).json({
                success: false,
                message: 'Teacher not found.'
            });

        }

    } catch (error) {

        console.error(
            'Update Image Error:',
            error.code
        );

        await deleteTeacherImage(newImagePath);

        return res.status(500).json({
            success: false,
            message: updateErrorMessage
        });

    }


    // Remove old image only after successful DB update

    if (
        oldImagePath &&
        oldImagePath !== newImagePath
    ) {

        await deleteTeacherImage(oldImagePath);

    }

    return res.status(200).json({
        success: true,
        message: successMessage,
        profile_image: newImagePath
    });

};


// ==========================================
// 7. TEACHER UPDATE OWN PROFILE IMAGE
// ==========================================

exports.updateMyProfileImage = async (req, res) => {

    if (req.user.role !== 'Teacher') {

        return res.status(403).json({
            success: false,
            message: 'Only teachers can update their profile image.'
        });

    }

    const teacherId = Number(req.user.id);

    return replaceTeacherImage(
        req,
        res,
        teacherId,
        'Profile image updated successfully.',
        'Unable to update profile image.'
    );

};


// ==========================================
// 8. ADMIN UPDATE TEACHER IMAGE
// ==========================================

exports.updateTeacherImage = async (req, res) => {

    const teacherId = Number(req.params.id);

    if (
        !Number.isInteger(teacherId) ||
        teacherId <= 0
    ) {

        return res.status(400).json({
            success: false,
            message: 'Invalid teacher ID.'
        });

    }

    return replaceTeacherImage(
        req,
        res,
        teacherId,
        'Teacher image updated successfully.',
        'Unable to update teacher image.'
    );

};