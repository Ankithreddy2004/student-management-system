const express = require('express');

const router = express.Router();

const {
    getAllStudents,
    addStudent,
    getStudentById,
    updateStudent,
    deleteStudent,
    updateStudentStatus
} = require('../controllers/studentController');

// UPDATE student status
router.patch('/:id/status', updateStudentStatus);

// GET all students
router.get('/', getAllStudents);

// POST new student
router.post('/', addStudent);

// GET student by ID
router.get('/:id', getStudentById);

// PUT update student
router.put('/:id', updateStudent);

// DELETE student
router.delete('/:id', deleteStudent);

module.exports = router;