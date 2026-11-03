const express = require('express');

const router = express.Router();

// Import student controllers
const {
    getAllStudents,
    addStudent,
    getStudentById,
    updateStudent,
    deleteStudent,
    updateStudentStatus,
    getPendingStudents
} = require('../controllers/studentController');

// Import authentication middleware
const {
    verifyToken,
    authorizeRoles,
    authorizeStudentAccess
} = require('../middleware/authMiddleware');

// ==========================================
// GET ALL STUDENTS
// Admin and Teacher only
// ==========================================

router.get(
    '/',
    verifyToken,
    authorizeRoles('Admin', 'Teacher'),
    getAllStudents
);

// ==========================================
// GET PENDING STUDENT REGISTRATIONS
// Admin and Teacher only
// ==========================================

router.get(
    '/pending',
    verifyToken,
    authorizeRoles('Admin', 'Teacher'),
    getPendingStudents
);

// ==========================================
// ADD STUDENT
// Admin and Teacher only
// ==========================================

router.post(
    '/',
    verifyToken,
    authorizeRoles('Admin', 'Teacher'),
    addStudent
);

// ==========================================
// GET STUDENT BY ID
// Admin and Teacher can access all
// Student can access own profile only
// ==========================================

router.get(
    '/:id',
    verifyToken,
    authorizeStudentAccess,
    getStudentById
);

// ==========================================
// UPDATE STUDENT
// Admin and Teacher only
// ==========================================

router.put(
    '/:id',
    verifyToken,
    authorizeRoles('Admin', 'Teacher'),
    updateStudent
);

// ==========================================
// DELETE STUDENT
// Admin only
// ==========================================

router.delete(
    '/:id',
    verifyToken,
    authorizeRoles('Admin'),
    deleteStudent
);

// ==========================================
// UPDATE STUDENT STATUS
// Admin only
// ==========================================

router.patch(
    '/:id/status',
    verifyToken,
    authorizeRoles('Admin', 'Teacher'),
    updateStudentStatus
);

// ==========================================
// APPROVE STUDENT REGISTRATION
// Admin and Teacher only
// ==========================================

router.patch(
    '/:id/approve',
    verifyToken,
    authorizeRoles('Admin', 'Teacher'),
    (req, res, next) => {
        req.body.status = 'Active';
        next();
    },
    updateStudentStatus
);

module.exports = router;