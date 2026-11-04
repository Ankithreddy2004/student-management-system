const express = require('express');

const router = express.Router();

const {
getMyAttendance,
getTeacherSubjects,
getStudentsForAttendance,
markAttendance,
getTeacherAttendanceRecords,
editAttendance
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

// Get subjects assigned to logged-in teacher
router.get(
'/teacher/subjects',
verifyToken,
authorizeRoles('Teacher'),
getTeacherSubjects
);

// Get active students for a selected subject
router.get(
'/teacher/students/:subjectId',
verifyToken,
authorizeRoles('Teacher'),
getStudentsForAttendance
);

// Mark and save attendance
router.post(
'/teacher/mark',
verifyToken,
authorizeRoles('Teacher'),
markAttendance
);

// View attendance records
router.get(
'/teacher/records/:subjectId',
verifyToken,
authorizeRoles('Teacher'),
getTeacherAttendanceRecords
);

// Edit attendance record
router.put(
'/teacher/edit/:attendanceId',
verifyToken,
authorizeRoles('Teacher'),
editAttendance
);

module.exports = router;
