const express = require('express');
const router = express.Router();

const {
signup,
login
} = require('../controllers/authController');

const { verifyToken } = require('../middleware/authMiddleware');

// Student Signup
router.post('/signup', signup);

// User Login
router.post('/login', login);

// Protected route - Get logged-in user details
router.get('/me', verifyToken, (req, res) => {
res.status(200).json({
success: true,
message: 'Authenticated user details fetched successfully.',
user: req.user
});
});

module.exports = router;
