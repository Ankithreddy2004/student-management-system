const express = require('express');

const router = express.Router();

const {
    verifyToken,
    authorizeRoles
} = require('../middleware/authMiddleware');

const {
    getAllTeachers,
    getDashboardStats
} = require('../controllers/adminController');

// Admin-only routes
router.use(verifyToken, authorizeRoles('Admin'));

// Get all teachers
router.get('/teachers', getAllTeachers);

// Dashboard statistics
router.get('/dashboard-stats', getDashboardStats);

module.exports = router;