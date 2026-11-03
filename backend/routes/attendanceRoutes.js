const express = require('express');

const router = express.Router();

const {
    getMyAttendance
} = require('../controllers/attendanceController');

const {
    verifyToken,
    authorizeRoles
} = require('../middleware/authMiddleware');

// Get attendance of logged-in student
router.get(
    '/my-attendance',
    verifyToken,
    authorizeRoles('Student'),
    getMyAttendance
);

module.exports = router;