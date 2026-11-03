const jwt = require('jsonwebtoken');

// ==========================================
// VERIFY JWT TOKEN
// ==========================================

const verifyToken = (req, res, next) => {
try {
const authHeader = req.headers.authorization;


    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. Please login first.'
        });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();

} catch (error) {
    return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.'
    });
}


};

// ==========================================
// ROLE-BASED AUTHORIZATION
// ==========================================

const authorizeRoles = (...allowedRoles) => {
return (req, res, next) => {


    if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'You do not have permission to perform this action.'
        });
    }

    next();
};


};

// ==========================================
// STUDENT RECORD ACCESS
// ==========================================

const authorizeStudentAccess = (req, res, next) => {


if (!req.user) {
    return res.status(401).json({
        success: false,
        message: 'Authentication required.'
    });
}

// Admin and Teacher can access any student record
if (
    req.user.role === 'Admin' ||
    req.user.role === 'Teacher'
) {
    return next();
}

// Student can access only their own record
if (
    req.user.role === 'Student' &&
    Number(req.user.student_id) === Number(req.params.id)
) {
    return next();
}

return res.status(403).json({
    success: false,
    message: 'You can only access your own student profile.'
});

};

module.exports = {
verifyToken,
authorizeRoles,
authorizeStudentAccess
};
