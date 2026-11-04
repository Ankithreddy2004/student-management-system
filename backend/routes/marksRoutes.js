const express = require('express');

const router = express.Router();

const {
    getMyMarks,
    getTeacherSubjects,
    getStudentsForMarks,
    getExamsBySubject,
    createExam,
    updateExam,
    deleteExam,
    addMarks,
    getMarksRecords,
    editMarks,
    deleteMarks
} = require('../controllers/marksController');

const {
    verifyToken,
    authorizeRoles
} = require('../middleware/authMiddleware');


// ==========================================
// STUDENT ROUTES
// ==========================================

router.get(
    '/my-marks',
    verifyToken,
    authorizeRoles('Student'),
    getMyMarks
);


// ==========================================
// TEACHER ROUTES
// ==========================================

// Get assigned subjects
router.get(
    '/teacher/subjects',
    verifyToken,
    authorizeRoles('Teacher'),
    getTeacherSubjects
);

// Get students for a subject
router.get(
    '/teacher/students/:subjectId',
    verifyToken,
    authorizeRoles('Teacher'),
    getStudentsForMarks
);

// Get examinations for a subject
router.get(
    '/teacher/exams/:subjectId',
    verifyToken,
    authorizeRoles('Teacher'),
    getExamsBySubject
);

// Create examination
router.post(
    '/teacher/exams',
    verifyToken,
    authorizeRoles('Teacher'),
    createExam
);

// Update examination
router.put(
    '/teacher/exams/:examId',
    verifyToken,
    authorizeRoles('Teacher'),
    updateExam
);

// Delete examination
router.delete(
    '/teacher/exams/:examId',
    verifyToken,
    authorizeRoles('Teacher'),
    deleteExam
);

// Add marks
router.post(
    '/teacher/add',
    verifyToken,
    authorizeRoles('Teacher'),
    addMarks
);

// View marks
router.get(
    '/teacher/records/:examId',
    verifyToken,
    authorizeRoles('Teacher'),
    getMarksRecords
);

// Edit marks
router.put(
    '/teacher/edit/:markId',
    verifyToken,
    authorizeRoles('Teacher'),
    editMarks
);

// Delete marks
router.delete(
    '/teacher/delete/:markId',
    verifyToken,
    authorizeRoles('Teacher'),
    deleteMarks
);


module.exports = router;