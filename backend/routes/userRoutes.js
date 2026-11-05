const express = require('express');
const router = express.Router();

const {
    getAllUsers,
    createTeacher,
    updateTeacher,
    deleteTeacher
} = require('../controllers/userController');

const {
    verifyToken,
    authorizeRoles
} = require('../middleware/authMiddleware');

// All routes below require Admin authentication
router.use(verifyToken, authorizeRoles('Admin'));

// GET all users
router.get('/', getAllUsers);

// CREATE teacher
router.post('/teacher', createTeacher);

// UPDATE teacher
router.put('/:id', updateTeacher);

// DELETE teacher
router.delete('/:id', deleteTeacher);

module.exports = router;