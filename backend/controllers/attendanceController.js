const attendanceRepository =
    require('../repositories/attendanceRepository');


// ==========================================
// SHARED VALIDATION HELPERS
// ==========================================

const validStatuses = [
    'Present',
    'Absent',
    'Late'
];


// Validate ID

const isValidId = (id) => {

    return (
        (
            typeof id === 'number' ||
            typeof id === 'string'
        ) &&
        /^[1-9]\d*$/.test(String(id)) &&
        Number.isSafeInteger(Number(id)) &&
        Number(id) <= 2147483647
    );

};


// Validate attendance date

const isValidDate = (date) => {

    return (
        typeof date === 'string' &&

        /^\d{4}-\d{2}-\d{2}$/.test(date) &&

        Number.isFinite(
            Date.parse(`${date}T00:00:00Z`)
        ) &&

        new Date(`${date}T00:00:00Z`)
            .toISOString()
            .slice(0, 10) === date
    );

};


// Validate attendance remarks

const isValidRemarks = (remarks) => {

    return (
        remarks === undefined ||

        remarks === null ||

        (
            typeof remarks === 'string' &&
            remarks.length <= 255
        )
    );

};


// ==========================================
// 1. GET STUDENT'S OWN ATTENDANCE
// ==========================================

const getMyAttendance = async (req, res) => {

    const studentId = req.user.student_id;

    if (!isValidId(studentId)) {

        return res.status(400).json({

            success: false,

            message: 'Student information not found.'

        });

    }

    try {

        const results =
            await attendanceRepository.getMyAttendance(
                Number(studentId)
            );

        return res.status(200).json({

            success: true,

            message:
                'Attendance records fetched successfully.',

            data: results

        });

    } catch (error) {

        console.error('Get My Attendance Error:', {
            code: error.code,
            message: error.message
        });

        return res.status(500).json({

            success: false,

            message: 'Unable to fetch attendance records.'

        });

    }

};


// ==========================================
// 2. GET TEACHER'S ASSIGNED SUBJECTS
// ==========================================

const getTeacherSubjects = async (req, res) => {

    const teacherId = req.user.id;

    try {

        const results =
            await attendanceRepository.getTeacherSubjects(
                teacherId
            );

        return res.status(200).json({

            success: true,

            message:
                'Teacher subjects fetched successfully.',

            data: results

        });

    } catch (error) {

        console.error('Teacher Subjects Error:', {
            code: error.code,
            message: error.message
        });

        return res.status(500).json({

            success: false,

            message: 'Unable to fetch assigned subjects.'

        });

    }

};


// ==========================================
// 3. GET ACTIVE AND APPROVED STUDENTS
// ==========================================

const getStudentsForAttendance = async (req, res) => {

    const teacherId = req.user.id;

    const subjectId = req.params.subjectId;


    // Validate subject ID

    if (!isValidId(subjectId)) {

        return res.status(400).json({

            success: false,

            message: 'Invalid subject ID.'

        });

    }

    try {

        const result =
            await attendanceRepository
                .getStudentsForAttendance(

                    teacherId,

                    Number(subjectId)

                );


        // Teacher is not assigned to the subject

        if (result.outcome === 'forbidden') {

            return res.status(403).json({

                success: false,

                message:
                    'You are not assigned to this subject.'

            });

        }


        // Verify procedure outcome

        if (result.outcome !== 'success') {

            return res.status(500).json({

                success: false,

                message: 'Unable to fetch students.'

            });

        }


        return res.status(200).json({

            success: true,

            message:
                'Active students fetched successfully.',

            data: result.data

        });

    } catch (error) {

        console.error('Attendance Students Error:', {
            code: error.code,
            message: error.message
        });

        return res.status(500).json({

            success: false,

            message: 'Unable to fetch students.'

        });

    }

};


// ==========================================
// 4. MARK BULK ATTENDANCE
// ==========================================

const markAttendance = async (req, res) => {

    const teacherId = req.user.id;

    const {
        subject_id,
        attendance_date,
        students
    } = req.body || {};


    // Validate subject ID

    if (!isValidId(subject_id)) {

        return res.status(400).json({

            success: false,

            message: 'Valid subject ID is required.'

        });

    }


    // Validate attendance date

    if (!isValidDate(attendance_date)) {

        return res.status(400).json({

            success: false,

            message:
                'Valid attendance date in YYYY-MM-DD format is required.'

        });

    }


    // Validate students array

    if (
        !Array.isArray(students) ||
        students.length === 0
    ) {

        return res.status(400).json({

            success: false,

            message:
                'At least one student attendance record is required.'

        });

    }


    // Validate individual attendance records

    const studentIds = new Set();

    const normalizedStudents = [];


    for (const student of students) {


        // Validate student ID

        if (
            !student ||
            !isValidId(student.student_id)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Every student must have a valid student ID.'

            });

        }


        // Validate attendance status

        if (!validStatuses.includes(student.status)) {

            return res.status(400).json({

                success: false,

                message:
                    'Attendance status must be Present, Absent or Late.'

            });

        }


        const studentId = Number(student.student_id);


        // Prevent duplicate student IDs

        if (studentIds.has(studentId)) {

            return res.status(400).json({

                success: false,

                message:
                    'Duplicate student IDs are not allowed.'

            });

        }

        studentIds.add(studentId);


        // Validate remarks

        if (!isValidRemarks(student.remarks)) {

            return res.status(400).json({

                success: false,

                message:
                    'Remarks must be text with a maximum of 255 characters.'

            });

        }


        // Prepare data for stored procedure

        normalizedStudents.push({

            student_id: studentId,

            status: student.status,

            remarks: student.remarks || null

        });

    }


    try {

        const result =
            await attendanceRepository.markAttendance(

                teacherId,

                Number(subject_id),

                attendance_date,

                normalizedStudents

            );


        // Unauthorized teacher

        if (result.outcome === 'forbidden') {

            return res.status(403).json({

                success: false,

                message:
                    'You are not assigned to this subject.'

            });

        }


        // One or more students are ineligible

        if (result.outcome === 'invalid_students') {

            return res.status(403).json({

                success: false,

                message:
                    'One or more students are inactive or do not have approved enrollment in this subject.'

            });

        }


        // Verify stored procedure response

        if (result.outcome !== 'success') {

            return res.status(500).json({

                success: false,

                message: 'Unable to save attendance.'

            });

        }


        // Attendance saved successfully

        return res.status(201).json({

            success: true,

            message: 'Attendance saved successfully.',

            subject_id: Number(subject_id),

            attendance_date,

            total_students: result.total_students

        });

    } catch (error) {


        // Duplicate attendance record

        if (error.code === 'ER_DUP_ENTRY') {

            return res.status(409).json({

                success: false,

                message:
                    'Attendance has already been recorded for one or more students on this date.'

            });

        }


        console.error('Mark Attendance Error:', {
            code: error.code,
            message: error.message
        });


        return res.status(500).json({

            success: false,

            message: 'Unable to save attendance.'

        });

    }

};


// ==========================================
// 5. GET TEACHER ATTENDANCE RECORDS
// ==========================================

const getTeacherAttendanceRecords = async (
    req,
    res
) => {

    const teacherId = req.user.id;

    const subjectId = req.params.subjectId;

    const attendanceDate = req.query.date;


    // Validate subject ID

    if (!isValidId(subjectId)) {

        return res.status(400).json({

            success: false,

            message: 'Invalid subject ID.'

        });

    }


    // Validate optional attendance date

    if (
        attendanceDate !== undefined &&
        !isValidDate(attendanceDate)
    ) {

        return res.status(400).json({

            success: false,

            message:
                'Invalid date. Use YYYY-MM-DD format.'

        });

    }

    try {

        const result =
            await attendanceRepository
                .getTeacherAttendanceRecords(

                    teacherId,

                    Number(subjectId),

                    attendanceDate ?? null

                );


        // Verify teacher assignment

        if (result.outcome === 'forbidden') {

            return res.status(403).json({

                success: false,

                message:
                    'You are not assigned to this subject.'

            });

        }


        // Verify procedure result

        if (result.outcome !== 'success') {

            return res.status(500).json({

                success: false,

                message:
                    'Unable to fetch attendance records.'

            });

        }


        return res.status(200).json({

            success: true,

            message:
                'Attendance records fetched successfully.',

            total_records: result.data.length,

            data: result.data

        });

    } catch (error) {

        console.error('Attendance Records Error:', {
            code: error.code,
            message: error.message
        });

        return res.status(500).json({

            success: false,

            message: 'Unable to fetch attendance records.'

        });

    }

};


// ==========================================
// 6. EDIT EXISTING ATTENDANCE
// ==========================================

const editAttendance = async (req, res) => {

    const teacherId = req.user.id;

    const attendanceId = req.params.attendanceId;

    const { status, remarks } = req.body || {};


    // Validate attendance ID

    if (!isValidId(attendanceId)) {

        return res.status(400).json({

            success: false,

            message: 'Invalid attendance ID.'

        });

    }


    // Validate attendance status

    if (!validStatuses.includes(status)) {

        return res.status(400).json({

            success: false,

            message:
                'Status must be Present, Absent or Late.'

        });

    }


    // Validate remarks

    if (!isValidRemarks(remarks)) {

        return res.status(400).json({

            success: false,

            message:
                'Remarks must be text with a maximum of 255 characters.'

        });

    }


    // Determine whether remarks should be updated

    const updateRemarks = remarks !== undefined;

    const normalizedRemarks = remarks || null;


    try {

        const result =
            await attendanceRepository.editAttendance(

                teacherId,

                Number(attendanceId),

                status,

                normalizedRemarks,

                updateRemarks

            );


        // Attendance record is missing
        // or the teacher is unauthorized

        if (result.outcome === 'not_found') {

            return res.status(404).json({

                success: false,

                message:
                    'Attendance record not found, enrollment is not approved, or you are not authorized to edit it.'

            });

        }


        // Verify procedure outcome

        if (result.outcome !== 'success') {

            return res.status(500).json({

                success: false,

                message: 'Unable to update attendance.'

            });

        }


        // Attendance updated successfully

        return res.status(200).json({

            success: true,

            message: 'Attendance updated successfully.',

            data: {

                attendance_id:
                    Number(result.attendance_id),

                student_id:
                    result.student_id,

                subject_id:
                    result.subject_id,

                attendance_date:
                    result.attendance_date,

                status:
                    result.status,

                remarks:
                    result.remarks

            }

        });

    } catch (error) {

        console.error('Edit Attendance Error:', {
            code: error.code,
            message: error.message
        });

        return res.status(500).json({

            success: false,

            message: 'Unable to update attendance.'

        });

    }

};


// ==========================================
// EXPORT ALL CONTROLLER FUNCTIONS
// ==========================================

module.exports = {

    getMyAttendance,

    getTeacherSubjects,

    getStudentsForAttendance,

    markAttendance,

    getTeacherAttendanceRecords,

    editAttendance

};