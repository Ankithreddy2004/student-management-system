const express = require('express');

const router = express.Router();

const {
    getMyMarks
} = require('../controllers/marksController');

const {
    verifyToken,
    authorizeRoles
} = require('../middleware/authMiddleware');

// Get marks of logged-in student
router.get(
    '/my-marks',
    verifyToken,
    authorizeRoles('Student'),
    getMyMarks
);

module.exports = router;