const studentRepository =
    require('../repositories/studentRepository');


// ==========================================
// COMMON VALIDATION FUNCTIONS
// ==========================================

const isValidId = (id) => {

    return (
        /^[1-9]\d*$/.test(String(id)) &&
        Number.isSafeInteger(Number(id)) &&
        Number(id) <= 2147483647
    );

};

const isValidSemester = (semester) => {

    return (
        (
            typeof semester === 'number' ||
            typeof semester === 'string'
        ) &&
        /^[1-8]$/.test(String(semester))
    );

};

const isValidEmail = (email) => {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

};

const isValidPhone = (phone) => {

    return /^\d{10}$/.test(phone);

};


// ==========================================
// 1. GET ALL STUDENTS
// ==========================================

const getAllStudents = async (req, res) => {

    try {

        const results =
            await studentRepository.getAllStudents();

        return res.status(200).json({
            success: true,
            message: 'Students fetched successfully.',
            data: results
        });

    } catch (error) {

        console.error(
            'Get All Students Error:',
            error.code || 'UNKNOWN_ERROR'
        );

        return res.status(500).json({
            success: false,
            message: 'Error fetching students.'
        });

    }

};


// ==========================================
// 2. GET PENDING STUDENTS
// ==========================================

const getPendingStudents = async (req, res) => {

    try {

        const results =
            await studentRepository.getPendingStudents();

        return res.status(200).json({
            success: true,
            message: 'Pending registrations fetched successfully.',
            data: results
        });

    } catch (error) {

        console.error(
            'Get Pending Students Error:',
            error.code || 'UNKNOWN_ERROR'
        );

        return res.status(500).json({
            success: false,
            message: 'Error fetching pending registrations.'
        });

    }

};


// ==========================================
// 3. ADD NEW STUDENT WITH SEMESTER
// ==========================================

const addStudent = async (req, res) => {

    let {
        name,
        email,
        phone,
        course,
        semester
    } = req.body || {};


    // Validate required fields

    if (
        typeof name !== 'string' ||
        typeof email !== 'string' ||
        typeof phone !== 'string' ||
        typeof course !== 'string' ||
        !name.trim() ||
        !email.trim() ||
        !phone.trim() ||
        !course.trim() ||
        semester === undefined ||
        semester === null ||
        semester === ''
    ) {

        return res.status(400).json({
            success: false,
            message: 'All fields are required.'
        });

    }


    // Clean inputs

    name = name.trim();

    email = email.trim().toLowerCase();

    phone = phone.trim();

    course = course.trim();


    // Validate input lengths

    if (
        name.length > 100 ||
        email.length > 150 ||
        course.length > 100
    ) {

        return res.status(400).json({
            success: false,
            message: 'Name, email or course exceeds the allowed length.'
        });

    }


    // Validate email

    if (!isValidEmail(email)) {

        return res.status(400).json({
            success: false,
            message: 'Please enter a valid email address.'
        });

    }


    // Validate phone

    if (!isValidPhone(phone)) {

        return res.status(400).json({
            success: false,
            message: 'Phone number must contain exactly 10 digits.'
        });

    }


    // Validate semester: 1 to 8 only

    if (!isValidSemester(semester)) {

        return res.status(400).json({
            success: false,
            message: 'Semester must be between 1 and 8.'
        });

    }

    semester = Number(semester);


    try {

        const result =
            await studentRepository.addStudent(
                name,
                email,
                phone,
                course,
                semester
            );

        return res.status(201).json({
            success: true,
            message: 'Student added successfully.',
            studentId: result.studentId
        });

    } catch (error) {

        console.error(
            'Add Student Error:',
            error.code || 'UNKNOWN_ERROR'
        );

        if (error.code === 'ER_DUP_ENTRY') {

            return res.status(409).json({
                success: false,
                message: 'Email already exists.'
            });

        }

        return res.status(500).json({
            success: false,
            message: 'Error adding student.'
        });

    }

};


// ==========================================
// 4. GET STUDENT BY ID
// ==========================================

const getStudentById = async (req, res) => {

    const { id } = req.params;

    if (!isValidId(id)) {

        return res.status(400).json({
            success: false,
            message: 'Invalid student ID.'
        });

    }

    try {

        const results =
            await studentRepository.getStudentById(
                Number(id)
            );

        if (results.length === 0) {

            return res.status(404).json({
                success: false,
                message: 'Student not found.'
            });

        }

        return res.status(200).json({
            success: true,
            message: 'Student fetched successfully.',
            data: results[0]
        });

    } catch (error) {

        console.error(
            'Get Student Error:',
            error.code || 'UNKNOWN_ERROR'
        );

        return res.status(500).json({
            success: false,
            message: 'Error fetching student.'
        });

    }

};


// ==========================================
// 5. UPDATE STUDENT
// ONLY ADMIN CAN CHANGE COURSE AND SEMESTER
// ==========================================

const updateStudent = async (req, res) => {

    const { id } = req.params;

    let {
        name,
        email,
        phone,
        course,
        semester
    } = req.body || {};


    // Validate user role

    if (
        !req.user ||
        !['Admin', 'Teacher'].includes(req.user.role)
    ) {

        return res.status(403).json({
            success: false,
            message: 'Access denied.'
        });

    }

    const isAdmin = req.user.role === 'Admin';


    // Validate student ID

    if (!isValidId(id)) {

        return res.status(400).json({
            success: false,
            message: 'Invalid student ID.'
        });

    }


    // Validate personal information

    if (
        typeof name !== 'string' ||
        typeof email !== 'string' ||
        typeof phone !== 'string' ||
        !name.trim() ||
        !email.trim() ||
        !phone.trim()
    ) {

        return res.status(400).json({
            success: false,
            message: 'Name, email and phone are required.'
        });

    }


    // Clean personal information

    name = name.trim();

    email = email.trim().toLowerCase();

    phone = phone.trim();


    // Validate input lengths

    if (
        name.length > 100 ||
        email.length > 150
    ) {

        return res.status(400).json({
            success: false,
            message: 'Name or email exceeds the allowed length.'
        });

    }


    // Validate email

    if (!isValidEmail(email)) {

        return res.status(400).json({
            success: false,
            message: 'Invalid email address.'
        });

    }


    // Validate phone

    if (!isValidPhone(phone)) {

        return res.status(400).json({
            success: false,
            message: 'Phone number must contain exactly 10 digits.'
        });

    }


    // Admin can update academic information

    if (isAdmin) {

        if (
            typeof course !== 'string' ||
            !course.trim()
        ) {

            return res.status(400).json({
                success: false,
                message: 'Course is required.'
            });

        }

        course = course.trim();

        if (course.length > 100) {

            return res.status(400).json({
                success: false,
                message: 'Course exceeds the allowed length.'
            });

        }

        if (!isValidSemester(semester)) {

            return res.status(400).json({
                success: false,
                message: 'Semester must be between 1 and 8.'
            });

        }

        semester = Number(semester);

    } else {

        // Teachers cannot modify academic information

        course = null;

        semester = null;

    }


    try {

        const result =
            await studentRepository.updateStudent(
                Number(id),
                name,
                email,
                phone,
                course,
                semester,
                isAdmin
            );


        // Check whether student exists

        if (!Number(result.student_exists)) {

            return res.status(404).json({
                success: false,
                message: 'Student not found.'
            });

        }


        // Check whether information was changed

        if (Number(result.affectedRows) === 0) {

            return res.status(200).json({
                success: true,
                message: 'Student information is already up to date.'
            });

        }

        return res.status(200).json({
            success: true,
            message: 'Student updated successfully.'
        });

    } catch (error) {

        console.error(
            'Update Student Error:',
            error.code || 'UNKNOWN_ERROR'
        );

        if (error.code === 'ER_DUP_ENTRY') {

            return res.status(409).json({
                success: false,
                message: 'Email already exists.'
            });

        }

        return res.status(500).json({
            success: false,
            message: 'Error updating student.'
        });

    }

};


// ==========================================
// 6. DELETE STUDENT
// ADMIN ONLY
// ==========================================

const deleteStudent = async (req, res) => {

    const { id } = req.params;

    if (!isValidId(id)) {

        return res.status(400).json({
            success: false,
            message: 'Invalid student ID.'
        });

    }

    try {

        const result =
            await studentRepository.deleteStudent(
                Number(id)
            );

        if (Number(result.affectedRows) === 0) {

            return res.status(404).json({
                success: false,
                message: 'Student not found.'
            });

        }

        return res.status(200).json({
            success: true,
            message: 'Student deleted successfully.'
        });

    } catch (error) {

        console.error(
            'Delete Student Error:',
            error.code || 'UNKNOWN_ERROR'
        );

        if (error.code === 'ER_ROW_IS_REFERENCED_2') {

            return res.status(409).json({
                success: false,
                message: 'Cannot delete this student because related records exist.'
            });

        }

        return res.status(500).json({
            success: false,
            message: 'Error deleting student.'
        });

    }

};


// ==========================================
// 7. UPDATE STUDENT STATUS
// ADMIN AND TEACHER
// ==========================================

const updateStudentStatus = async (req, res) => {

    const { id } = req.params;

    const { status } = req.body || {};

    if (!isValidId(id)) {

        return res.status(400).json({
            success: false,
            message: 'Invalid student ID.'
        });

    }

    if (!['Active', 'Inactive'].includes(status)) {

        return res.status(400).json({
            success: false,
            message: 'Status must be Active or Inactive.'
        });

    }

    try {

        const result =
            await studentRepository.updateStudentStatus(
                Number(id),
                status
            );

        if (!Number(result.student_exists)) {

            return res.status(404).json({
                success: false,
                message: 'Student not found.'
            });

        }

        if (Number(result.affectedRows) === 0) {

            return res.status(200).json({
                success: true,
                message: 'Student already has this status.',
                data: {
                    id: Number(id),
                    status
                }
            });

        }

        return res.status(200).json({
            success: true,
            message: 'Student status updated successfully.',
            data: {
                id: Number(id),
                status
            }
        });

    } catch (error) {

        console.error(
            'Update Student Status Error:',
            error.code || 'UNKNOWN_ERROR'
        );

        return res.status(500).json({
            success: false,
            message: 'Unable to update student status.'
        });

    }

};


// ==========================================
// 8. APPROVE PENDING STUDENT
// ADMIN AND TEACHER
// ==========================================

const approveStudent = async (req, res) => {

    const { id } = req.params;

    if (!isValidId(id)) {

        return res.status(400).json({
            success: false,
            message: 'Invalid student ID.'
        });

    }

    try {

        const result =
            await studentRepository.approveStudent(
                Number(id)
            );

        if (!Number(result.student_exists)) {

            return res.status(404).json({
                success: false,
                message: 'Student not found.'
            });

        }

        if (Number(result.affectedRows) === 0) {

            return res.status(409).json({
                success: false,
                message:
                    `Student cannot be approved. Current status: ${result.current_status}.`
            });

        }

        return res.status(200).json({
            success: true,
            message: 'Student approved successfully. The account is now Active.',
            data: {
                id: Number(id),
                status: 'Active'
            }
        });

    } catch (error) {

        console.error(
            'Approve Student Error:',
            error.code || 'UNKNOWN_ERROR'
        );

        return res.status(500).json({
            success: false,
            message: 'Unable to approve student.'
        });

    }

};


// ==========================================
// 9. UPDATE OWN STUDENT PROFILE
// ACTIVE STUDENTS ONLY
// COURSE AND SEMESTER ARE READ-ONLY
// ==========================================

const updateMyProfile = async (req, res) => {

    if (!req.user || req.user.role !== 'Student') {

        return res.status(403).json({
            success: false,
            message: 'Access denied.'
        });

    }

    const studentId = req.user.student_id;

    let {
        name,
        phone
    } = req.body || {};


    // Validate student ID

    if (!isValidId(studentId)) {

        return res.status(400).json({
            success: false,
            message: 'Student information not found.'
        });

    }


    // Validate required fields

    if (
        typeof name !== 'string' ||
        typeof phone !== 'string' ||
        !name.trim() ||
        !phone.trim()
    ) {

        return res.status(400).json({
            success: false,
            message: 'Name and phone are required.'
        });

    }


    // Clean inputs

    name = name.trim();

    phone = phone.trim();


    // Validate name length

    if (name.length > 100) {

        return res.status(400).json({
            success: false,
            message: 'Name must not exceed 100 characters.'
        });

    }


    // Validate phone

    if (!isValidPhone(phone)) {

        return res.status(400).json({
            success: false,
            message: 'Phone number must contain exactly 10 digits.'
        });

    }


    try {

        const result =
            await studentRepository.updateMyProfile(
                Number(studentId),
                name,
                phone
            );


        if (result.outcome === 'not_found') {

            return res.status(404).json({
                success: false,
                message: 'Student not found.'
            });

        }


        if (result.outcome === 'inactive') {

            return res.status(403).json({
                success: false,
                message: 'Only Active students can update their profile.'
            });

        }


        if (result.outcome !== 'updated') {

            return res.status(500).json({
                success: false,
                message: 'Unable to update profile.'
            });

        }


        return res.status(200).json({

            success: true,

            message: 'Profile updated successfully.',

            data: {
                id: Number(studentId),
                name,
                phone,
                course: result.course,
                semester: result.semester
            }

        });

    } catch (error) {

        console.error(
            'Update Profile Error:',
            error.code || 'UNKNOWN_ERROR'
        );

        return res.status(500).json({
            success: false,
            message: 'Unable to update profile.'
        });

    }

};


// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {

    getAllStudents,

    getPendingStudents,

    addStudent,

    getStudentById,

    updateStudent,

    deleteStudent,

    updateStudentStatus,

    approveStudent,

    updateMyProfile

};