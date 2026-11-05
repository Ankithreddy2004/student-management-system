const express = require('express');

const router = express.Router();

const {
    verifyToken,
    authorizeRoles
} = require('../middleware/authMiddleware');

const {
    getAllSubjects,
    getSubjectById,
    createSubject,
    updateSubject,
    deleteSubject,
    getAllAssignments,
    assignSubjects,
    removeAssignment
} = require('../controllers/subjectController');

// All subject routes require Admin authentication
router.use(verifyToken, authorizeRoles('Admin'));

// Subject CRUD
router.get('/', getAllSubjects);

router.get('/:id', getSubjectById);

router.post('/', createSubject);

router.put('/:id', updateSubject);

router.delete('/:id', deleteSubject);

// Teacher-subject assignments
router.get('/assignments/all', getAllAssignments);

router.post('/assignments', assignSubjects);

router.delete(
    '/assignments/:assignmentId',
    removeAssignment
);

module.exports = router;