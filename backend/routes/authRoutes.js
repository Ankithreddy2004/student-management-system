const express = require('express');

const router = express.Router();

const {

    signup,

    login,

    checkEmail,

    getAcademicOptions

} = require('../controllers/authController');


const {

    verifyToken

} = require('../middleware/authMiddleware');


// ==========================================
// CHECK EMAIL AVAILABILITY
// ==========================================

router.get('/check-email', checkEmail);


// ==========================================
// GET AVAILABLE COURSES AND SEMESTERS
// ==========================================

router.get('/academic-options', getAcademicOptions);


// ==========================================
// STUDENT SIGNUP
// ==========================================

router.post('/signup', signup);


// ==========================================
// USER LOGIN
// ==========================================

router.post('/login', login);


// ==========================================
// PROTECTED ROUTE - GET LOGGED-IN USER
// ==========================================

router.get('/me', verifyToken, (req, res) => {

    return res.status(200).json({

        success: true,

        message: 'Authenticated user details fetched successfully.',

        user: req.user

    });

});


module.exports = router;