const enrollmentRepository =
    require('../repositories/enrollmentRepository');


// ==========================================
// HELPER: VALIDATE POSITIVE INTEGER
// ==========================================

const isValidId = (id) => {

    return (
        Number.isSafeInteger(Number(id)) &&
        Number(id) > 0 &&
        Number(id) <= 2147483647
    );

};


// ==========================================
// HELPER: GET TEACHER SCOPE
// ==========================================

const getTeacherScope = (user) => {

    if (user.role === 'Teacher') {

        if (!isValidId(user.id)) {

            throw new Error('Invalid teacher identity.');

        }

        return Number(user.id);

    }

    return null;

};


// ==========================================
// 1. GET AVAILABLE SUBJECTS
// ==========================================

const getAvailableSubjects = async (req, res) => {

    try {

        // Teachers see only assigned subjects.
        // Admin and Student can see all subjects.

        const teacherId = getTeacherScope(req.user);


        const results =
            await enrollmentRepository
                .getAvailableSubjects(teacherId);


        return res.status(200).json({

            success: true,

            subjects: results

        });

    } catch (error) {

        console.error(
            'Get Available Subjects Error:',
            error.code,
            error.message
        );

        return res.status(500).json({

            success: false,

            message: 'Failed to fetch available subjects.'

        });

    }

};


// ==========================================
// 2. ENROLL STUDENT INTO SUBJECT
// ==========================================

const enrollStudent = async (req, res) => {

    const { subjectId } = req.body;

    let studentId;


    // Students can enroll only themselves.

    if (req.user.role === 'Student') {

        studentId = req.user.student_id;

    } else {

        studentId = req.body.studentId;

    }


    // Validate student ID

    if (!isValidId(studentId)) {

        return res.status(400).json({

            success: false,

            message: 'Valid student ID is required.'

        });

    }


    // Validate subject ID

    if (!isValidId(subjectId)) {

        return res.status(400).json({

            success: false,

            message: 'Valid subject ID is required.'

        });

    }


    // Validate authenticated user ID

    if (!isValidId(req.user.id)) {

        return res.status(403).json({

            success: false,

            message: 'Invalid user account.'

        });

    }

    try {

        const result =
            await enrollmentRepository.enrollStudent(

                Number(studentId),

                Number(subjectId),

                Number(req.user.id),

                req.user.role

            );


        // Student does not exist

        if (result.outcome === 'student_not_found') {

            return res.status(404).json({

                success: false,

                message: 'Student not found.'

            });

        }


        // Subject does not exist

        if (result.outcome === 'subject_not_found') {

            return res.status(404).json({

                success: false,

                message: 'Subject not found.'

            });

        }


        // Teacher does not have subject permission

        if (result.outcome === 'forbidden') {

            return res.status(403).json({

                success: false,

                message: 'You can enroll students only in your assigned subjects.'

            });

        }


        // Verify procedure response

        if (result.outcome !== 'success') {

            return res.status(500).json({

                success: false,

                message: 'Failed to create enrollment request.'

            });

        }


        // Enrollment request submitted successfully

        return res.status(201).json({

            success: true,

            message: 'Enrollment request submitted successfully. Waiting for approval.',

            enrollmentId: result.enrollmentId,

            status: 'Pending'

        });

    } catch (error) {


        // Duplicate enrollment

        if (error.code === 'ER_DUP_ENTRY') {

            return res.status(409).json({

                success: false,

                message: 'This student has already requested or enrolled in this subject.'

            });

        }


        console.error(
            'Create Enrollment Error:',
            error.code,
            error.message
        );


        return res.status(500).json({

            success: false,

            message: 'Failed to create enrollment request.'

        });

    }

};


// ==========================================
// 3. GET MY ENROLLMENTS
// STUDENT ONLY
// ==========================================

const getMyEnrollments = async (req, res) => {

    const studentId = req.user.student_id;


    // Validate linked student account

    if (!isValidId(studentId)) {

        return res.status(400).json({

            success: false,

            message: 'Student account is not linked to a valid student record.'

        });

    }

    try {

        const results =
            await enrollmentRepository.getMyEnrollments(
                Number(studentId)
            );


        return res.status(200).json({

            success: true,

            enrollments: results

        });

    } catch (error) {

        console.error(
            'Get My Enrollments Error:',
            error.code,
            error.message
        );

        return res.status(500).json({

            success: false,

            message: 'Failed to fetch your enrollments.'

        });

    }

};


// ==========================================
// 4. GET ALL ENROLLMENTS
// ADMIN AND TEACHER
// ==========================================

const getAllEnrollments = async (req, res) => {

    let status = null;

    let subjectId = null;

    let studentId = null;


    // Validate optional status filter

    if (req.query.status) {

        const allowedStatuses = [
            'Pending',
            'Approved',
            'Rejected'
        ];

        if (!allowedStatuses.includes(req.query.status)) {

            return res.status(400).json({

                success: false,

                message: 'Invalid enrollment status.'

            });

        }

        status = req.query.status;

    }


    // Validate optional subject filter

    if (req.query.subjectId) {

        if (!isValidId(req.query.subjectId)) {

            return res.status(400).json({

                success: false,

                message: 'Invalid subject ID.'

            });

        }

        subjectId = Number(req.query.subjectId);

    }


    // Validate optional student filter

    if (req.query.studentId) {

        if (!isValidId(req.query.studentId)) {

            return res.status(400).json({

                success: false,

                message: 'Invalid student ID.'

            });

        }

        studentId = Number(req.query.studentId);

    }

    try {


        // Teacher sees assigned subject enrollments only.

        const teacherId = getTeacherScope(req.user);


        const results =
            await enrollmentRepository.getAllEnrollments(

                teacherId,

                status,

                subjectId,

                studentId

            );


        return res.status(200).json({

            success: true,

            enrollments: results

        });

    } catch (error) {

        console.error(
            'Get All Enrollments Error:',
            error.code,
            error.message
        );

        return res.status(500).json({

            success: false,

            message: 'Failed to fetch enrollment requests.'

        });

    }

};


// ==========================================
// 5. SHARED APPROVE / REJECT HELPER
// ==========================================

const reviewEnrollment = async (
    req,
    res,
    newStatus
) => {

    const enrollmentId = req.params.id;


    // Validate enrollment ID

    if (!isValidId(enrollmentId)) {

        return res.status(400).json({

            success: false,

            message: 'Invalid enrollment ID.'

        });

    }


    // Verify reviewer identity

    if (!isValidId(req.user.id)) {

        return res.status(403).json({

            success: false,

            message: 'Invalid reviewer account.'

        });

    }

    try {

        const result =
            await enrollmentRepository.reviewEnrollment(

                Number(enrollmentId),

                Number(req.user.id),

                req.user.role,

                newStatus

            );


        // Enrollment does not exist

        if (result.outcome === 'not_found') {

            return res.status(404).json({

                success: false,

                message: 'Enrollment request not found.'

            });

        }


        // Teacher cannot review unassigned subjects

        if (result.outcome === 'forbidden') {

            return res.status(403).json({

                success: false,

                message: 'You can review enrollments only for your assigned subjects.'

            });

        }


        // Enrollment is already approved or rejected

        if (result.outcome === 'already_reviewed') {

            const currentStatus = result.current_status;

            return res.status(409).json({

                success: false,

                message: currentStatus &&
                         currentStatus !== 'Pending'

                    ? `This enrollment has already been ${currentStatus.toLowerCase()}.`

                    : 'This enrollment request has already been reviewed.'

            });

        }


        // Verify procedure outcome

        if (result.outcome !== 'success') {

            return res.status(500).json({

                success: false,

                message: 'Failed to update enrollment status.'

            });

        }


        // Enrollment reviewed successfully

        return res.status(200).json({

            success: true,

            message:
                `Enrollment ${newStatus.toLowerCase()} successfully.`,

            status: newStatus

        });

    } catch (error) {

        console.error(
            'Review Enrollment Error:',
            error.code,
            error.message
        );

        return res.status(500).json({

            success: false,

            message: 'Failed to update enrollment status.'

        });

    }

};


// ==========================================
// 6. APPROVE ENROLLMENT
// ==========================================

const approveEnrollment = async (req, res) => {

    return reviewEnrollment(
        req,
        res,
        'Approved'
    );

};


// ==========================================
// 7. REJECT ENROLLMENT
// ==========================================

const rejectEnrollment = async (req, res) => {

    return reviewEnrollment(
        req,
        res,
        'Rejected'
    );

};


// ==========================================
// 8. GET ENROLLMENTS FOR ONE STUDENT
// ADMIN AND TEACHER
// ==========================================

const getStudentEnrollments = async (req, res) => {

    const studentId = req.params.studentId;


    // Validate student ID

    if (!isValidId(studentId)) {

        return res.status(400).json({

            success: false,

            message: 'Invalid student ID.'

        });

    }

    try {


        // Restrict teacher access to assigned subjects.

        const teacherId = getTeacherScope(req.user);


        const results =
            await enrollmentRepository
                .getStudentEnrollments(

                    Number(studentId),

                    teacherId

                );


        return res.status(200).json({

            success: true,

            enrollments: results

        });

    } catch (error) {

        console.error(
            'Get Student Enrollments Error:',
            error.code,
            error.message
        );

        return res.status(500).json({

            success: false,

            message: 'Failed to fetch student enrollments.'

        });

    }

};


// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {

    getAvailableSubjects,

    enrollStudent,

    getMyEnrollments,

    getAllEnrollments,

    approveEnrollment,

    rejectEnrollment,

    getStudentEnrollments

};