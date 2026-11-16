const express = require('express');
const router = express.Router();

const {
    getAllUsers,
    createTeacher,
    updateTeacher,
    deleteTeacher,
    getMyProfile,
    getTeacherImage,
    updateMyProfileImage,
    updateTeacherImage
} = require('../controllers/userController');

const {
    verifyToken,
    authorizeRoles
} = require('../middleware/authMiddleware');

const {
    uploadTeacherImage
} = require('../middleware/uploadMiddleware');


// All routes require authentication.
router.use(verifyToken);


// ==========================================
// TEACHER SELF-PROFILE ROUTES
// ==========================================

// These routes derive teacher identity from the JWT.
router.get(
    '/me',
    authorizeRoles('Teacher'),
    getMyProfile
);

router.put(
    '/me/profile-image',
    authorizeRoles('Teacher'),
    uploadTeacherImage,
    updateMyProfileImage
);


// ==========================================
// ADMIN ROUTES
// ==========================================

router.get(
    '/',
    authorizeRoles('Admin'),
    getAllUsers
);

router.post(
    '/teacher',
    authorizeRoles('Admin'),
    uploadTeacherImage,
    createTeacher
);

router.put(
    '/:id/profile-image',
    authorizeRoles('Admin'),
    uploadTeacherImage,
    updateTeacherImage
);

router.put(
    '/:id',
    authorizeRoles('Admin'),
    updateTeacher
);

router.delete(
    '/:id',
    authorizeRoles('Admin'),
    deleteTeacher
);


// ==========================================
// PROTECTED IMAGE ROUTE
// ==========================================

// Admin can retrieve any teacher image.
// Teacher can retrieve only their own image.
router.get(
    '/:id/profile-image',
    authorizeRoles('Admin', 'Teacher'),
    getTeacherImage
);


module.exports = router;