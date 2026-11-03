const express = require('express');
const router = express.Router();

// Import user controllers
const {
getAllUsers,
createTeacher
} = require('../controllers/userController');

// Import authentication middleware
const {
verifyToken,
authorizeRoles
} = require('../middleware/authMiddleware');

// Get all users - Admin only
router.get(
'/',
verifyToken,
authorizeRoles('Admin'),
getAllUsers
);

// Create Teacher - Admin only
router.post(
'/teacher',
verifyToken,
authorizeRoles('Admin'),
createTeacher
);

module.exports = router;
