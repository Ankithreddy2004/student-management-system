const studentRepository =
    require('../repositories/studentRepository');


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
// 3. ADD NEW STUDENT
// ==========================================

const addStudent = async (req, res) => {

    let { name, email, phone, course } = req.body;

    if (!name || !email || !phone || !course) {

        return res.status(400).json({
            success: false,
            message: 'All fields are required.'
        });

    }

    name = String(name).trim();
    email = String(email).trim().toLowerCase();
    phone = String(phone).trim();
    course = String(course).trim();

    if (!name || !course) {

        return res.status(400).json({
            success: false,
            message: 'Name and course cannot be empty.'
        });

    }

    const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {

        return res.status(400).json({
            success: false,
            message: 'Please enter a valid email address.'
        });

    }

    if (!/^\d{10}$/.test(phone)) {

        return res.status(400).json({
            success: false,
            message: 'Phone number must contain exactly 10 digits.'
        });

    }

    try {

        const result =
            await studentRepository.addStudent(
                name,
                email,
                phone,
                course
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

    if (!/^[1-9]\d*$/.test(id)) {

        return res.status(400).json({
            success: false,
            message: 'Invalid student ID.'
        });

    }

    try {

        const results =
            await studentRepository.getStudentById(id);

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
// ==========================================

const updateStudent = async (req, res) => {

    const { id } = req.params;

    let { name, email, phone, course } = req.body;

    if (!/^[1-9]\d*$/.test(id)) {

        return res.status(400).json({
            success: false,
            message: 'Invalid student ID.'
        });

    }

    if (!name || !email || !phone || !course) {

        return res.status(400).json({
            success: false,
            message: 'All fields are required.'
        });

    }

    name = String(name).trim();
    email = String(email).trim().toLowerCase();
    phone = String(phone).trim();
    course = String(course).trim();

    if (!name || !course) {

        return res.status(400).json({
            success: false,
            message: 'Name and course cannot be empty.'
        });

    }

    const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {

        return res.status(400).json({
            success: false,
            message: 'Invalid email address.'
        });

    }

    if (!/^\d{10}$/.test(phone)) {

        return res.status(400).json({
            success: false,
            message: 'Phone must contain exactly 10 digits.'
        });

    }

    try {

        const result =
            await studentRepository.updateStudent(
                id,
                name,
                email,
                phone,
                course
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

    if (!/^[1-9]\d*$/.test(id)) {

        return res.status(400).json({
            success: false,
            message: 'Invalid student ID.'
        });

    }

    try {

        const result =
            await studentRepository.deleteStudent(id);

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
    const { status } = req.body;

    if (!/^[1-9]\d*$/.test(id)) {

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
                id,
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

    if (!/^[1-9]\d*$/.test(id)) {

        return res.status(400).json({
            success: false,
            message: 'Invalid student ID.'
        });

    }

    try {

        const result =
            await studentRepository.approveStudent(id);

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
// ==========================================

const updateMyProfile = async (req, res) => {

    const studentId = req.user.student_id;

    let { name, phone, course } = req.body;

    if (!studentId) {

        return res.status(400).json({
            success: false,
            message: 'Student information not found.'
        });

    }

    if (!name || !phone || !course) {

        return res.status(400).json({
            success: false,
            message: 'Name, phone and course are required.'
        });

    }

    name = String(name).trim();
    phone = String(phone).trim();
    course = String(course).trim();

    if (!name || !course) {

        return res.status(400).json({
            success: false,
            message: 'Name and course cannot be empty.'
        });

    }

    if (!/^\d{10}$/.test(phone)) {

        return res.status(400).json({
            success: false,
            message: 'Phone number must contain exactly 10 digits.'
        });

    }

    try {

        const result =
            await studentRepository.updateMyProfile(
                studentId,
                name,
                phone,
                course
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
                course
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