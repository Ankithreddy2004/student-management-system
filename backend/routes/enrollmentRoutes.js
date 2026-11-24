const express = require('express');
const router = express.Router();

const {
  verifyToken,
  authorizeRoles
} = require('../middleware/authMiddleware');

const {
  getAvailableSubjects,
  enrollStudent,
  getMyEnrollments,
  getAllEnrollments,
  approveEnrollment,
  rejectEnrollment,
  getStudentEnrollments
} = require('../controllers/enrollmentController');


// ============================================
// AVAILABLE SUBJECTS
// STUDENT / TEACHER / ADMIN
// ============================================

router.get(
  '/subjects',
  verifyToken,
  authorizeRoles('Student', 'Teacher', 'Admin'),
  getAvailableSubjects
);


// ============================================
// ENROLL STUDENT
// STUDENT / TEACHER / ADMIN
// ============================================

router.post(
  '/enroll',
  verifyToken,
  authorizeRoles('Student', 'Teacher', 'Admin'),
  enrollStudent
);


// ============================================
// STUDENT'S OWN ENROLLMENTS
// STUDENT ONLY
// ============================================

router.get(
  '/my',
  verifyToken,
  authorizeRoles('Student'),
  getMyEnrollments
);


// ============================================
// ALL ENROLLMENT REQUESTS
// ADMIN / TEACHER
// ============================================

router.get(
  '/',
  verifyToken,
  authorizeRoles('Admin', 'Teacher'),
  getAllEnrollments
);


// ============================================
// ENROLLMENTS OF A PARTICULAR STUDENT
// ADMIN / TEACHER
// ============================================

router.get(
  '/student/:studentId',
  verifyToken,
  authorizeRoles('Admin', 'Teacher'),
  getStudentEnrollments
);


// ============================================
// APPROVE ENROLLMENT
// ADMIN / TEACHER
// ============================================

router.patch(
  '/:id/approve',
  verifyToken,
  authorizeRoles('Admin', 'Teacher'),
  approveEnrollment
);


// ============================================
// REJECT ENROLLMENT
// ADMIN / TEACHER
// ============================================

router.patch(
  '/:id/reject',
  verifyToken,
  authorizeRoles('Admin', 'Teacher'),
  rejectEnrollment
);


module.exports = router;