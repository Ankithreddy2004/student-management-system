const marksRepository =
    require('../repositories/marksRepository');


// ==========================================
// SHARED VALIDATION HELPERS
// ==========================================

const validExamTypes = [
    'Internal',
    'Midterm',
    'Final',
    'Practical',
    'Assignment'
];


// Validate positive integer ID

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


// Validate optional examination date

const isValidDate = (date) => {

    if (
        date === undefined ||
        date === null ||
        date === ''
    ) {
        return true;
    }

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


// Validate decimal marks

const isValidMarks = (value) => {

    if (
        typeof value !== 'number' &&
        typeof value !== 'string'
    ) {
        return false;
    }

    if (String(value).trim() === '') {
        return false;
    }

    const number = Number(value);

    return (
        Number.isFinite(number) &&
        number >= 0 &&
        number <= 9999.99 &&
        Math.abs(
            number * 100 -
            Math.round(number * 100)
        ) < 0.0000001
    );

};


// Validate optional remarks

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


// Validate examination details

const isValidExamDetails = (
    examName,
    examType,
    examDate,
    maxMarks
) => {

    return (
        typeof examName === 'string' &&

        examName.trim().length > 0 &&

        examName.trim().length <= 100 &&

        validExamTypes.includes(examType) &&

        isValidMarks(maxMarks) &&

        Number(maxMarks) > 0 &&

        isValidDate(examDate)
    );

};


// Shared error response

const sendError = (res, error, message) => {

    console.error('Marks Module Error:', {
        code: error.code,
        message: error.message
    });

    return res.status(500).json({
        success: false,
        message
    });

};


// ==========================================
// 1. STUDENT: GET MY MARKS
// ==========================================

const getMyMarks = async (req, res) => {

    const studentId = req.user.student_id;

    if (!isValidId(studentId)) {

        return res.status(400).json({
            success: false,
            message: 'Student information not found.'
        });

    }

    try {

        const results =
            await marksRepository.getMyMarks(
                Number(studentId)
            );

        return res.status(200).json({

            success: true,

            message:
                'Marks records fetched successfully.',

            data: results

        });

    } catch (error) {

        return sendError(
            res,
            error,
            'Unable to fetch marks records.'
        );

    }

};


// ==========================================
// 2. TEACHER: GET ASSIGNED SUBJECTS
// ==========================================

const getTeacherSubjects = async (req, res) => {

    const teacherId = req.user.id;

    try {

        const results =
            await marksRepository.getTeacherSubjects(
                teacherId
            );

        return res.status(200).json({
            success: true,
            data: results
        });

    } catch (error) {

        return sendError(
            res,
            error,
            'Unable to fetch assigned subjects.'
        );

    }

};


// ==========================================
// 3. TEACHER: GET STUDENTS FOR MARKS
// ==========================================

const getStudentsForMarks = async (req, res) => {

    const teacherId = req.user.id;
    const subjectId = req.params.subjectId;

    if (!isValidId(subjectId)) {

        return res.status(400).json({
            success: false,
            message: 'Invalid subject ID.'
        });

    }

    try {

        const result =
            await marksRepository.getStudentsForMarks(
                teacherId,
                Number(subjectId)
            );

        if (result.outcome === 'forbidden') {

            return res.status(403).json({
                success: false,
                message:
                    'You are not assigned to this subject.'
            });

        }

        if (result.outcome !== 'success') {

            return res.status(500).json({
                success: false,
                message: 'Unable to fetch students.'
            });

        }

        return res.status(200).json({
            success: true,
            total_students: result.data.length,
            data: result.data
        });

    } catch (error) {

        return sendError(
            res,
            error,
            'Unable to fetch students.'
        );

    }

};


// ==========================================
// 4. TEACHER: GET EXAMINATIONS
// ==========================================

const getExamsBySubject = async (req, res) => {

    const teacherId = req.user.id;
    const subjectId = req.params.subjectId;

    if (!isValidId(subjectId)) {

        return res.status(400).json({
            success: false,
            message: 'Invalid subject ID.'
        });

    }

    try {

        const results =
            await marksRepository.getExamsBySubject(
                teacherId,
                Number(subjectId)
            );

        return res.status(200).json({
            success: true,
            data: results
        });

    } catch (error) {

        return sendError(
            res,
            error,
            'Unable to fetch examinations.'
        );

    }

};


// ==========================================
// 5. TEACHER: CREATE EXAMINATION
// ==========================================

const createExam = async (req, res) => {

    const teacherId = req.user.id;

    const {
        subject_id,
        exam_name,
        exam_type,
        exam_date,
        max_marks
    } = req.body || {};


    // Validate required fields

    if (
        !subject_id ||
        !exam_name ||
        !exam_type ||
        max_marks === undefined
    ) {

        return res.status(400).json({
            success: false,
            message:
                'Please provide all required examination details.'
        });

    }


    // Validate subject ID

    if (!isValidId(subject_id)) {

        return res.status(400).json({
            success: false,
            message: 'Invalid subject ID.'
        });

    }


    // Validate examination name

    if (
        typeof exam_name !== 'string' ||
        !exam_name.trim() ||
        exam_name.trim().length > 100
    ) {

        return res.status(400).json({
            success: false,
            message:
                'Exam name must contain 1 to 100 characters.'
        });

    }


    // Validate examination type

    if (!validExamTypes.includes(exam_type)) {

        return res.status(400).json({
            success: false,
            message: 'Invalid examination type.'
        });

    }


    // Validate maximum marks

    if (
        !isValidMarks(max_marks) ||
        Number(max_marks) <= 0
    ) {

        return res.status(400).json({
            success: false,
            message:
                'Maximum marks must be greater than zero, at most 9999.99, and contain no more than two decimal places.'
        });

    }


    // Validate date

    if (!isValidDate(exam_date)) {

        return res.status(400).json({
            success: false,
            message:
                'Exam date must be a valid date in YYYY-MM-DD format.'
        });

    }

    try {

        const result =
            await marksRepository.createExam(
                teacherId,
                Number(subject_id),
                exam_name.trim(),
                exam_type,
                exam_date || null,
                Number(max_marks)
            );


        // Teacher is not assigned to subject

        if (result.outcome === 'forbidden') {

            return res.status(403).json({
                success: false,
                message:
                    'You are not assigned to this subject.'
            });

        }

        if (result.outcome !== 'success') {

            return res.status(500).json({
                success: false,
                message: 'Unable to create examination.'
            });

        }

        return res.status(201).json({
            success: true,
            message: 'Examination created successfully.',
            exam_id: result.exam_id
        });

    } catch (error) {

        return sendError(
            res,
            error,
            'Unable to create examination.'
        );

    }

};


// ==========================================
// 6. TEACHER: UPDATE EXAMINATION
// ==========================================

const updateExam = async (req, res) => {

    const teacherId = req.user.id;
    const examId = req.params.examId;

    const {
        exam_name,
        exam_type,
        exam_date,
        max_marks
    } = req.body || {};


    // Validate examination ID

    if (!isValidId(examId)) {

        return res.status(400).json({
            success: false,
            message: 'Invalid examination ID.'
        });

    }


    // Validate examination details

    if (
        !isValidExamDetails(
            exam_name,
            exam_type,
            exam_date,
            max_marks
        )
    ) {

        return res.status(400).json({
            success: false,
            message:
                'Please provide valid examination details.'
        });

    }

    try {

        const result =
            await marksRepository.updateExam(
                teacherId,
                Number(examId),
                exam_name.trim(),
                exam_type,
                exam_date || null,
                Number(max_marks)
            );


        // Examination missing or unauthorized

        if (result.outcome === 'not_found') {

            return res.status(404).json({
                success: false,
                message:
                    'Examination not found or not assigned to you.'
            });

        }


        // New maximum marks are too low

        if (
            result.outcome === 'invalid_max_marks'
        ) {

            return res.status(409).json({
                success: false,
                message:
                    `Maximum marks cannot be less than the highest awarded marks (${result.highest_marks}).`
            });

        }

        if (result.outcome !== 'success') {

            return res.status(500).json({
                success: false,
                message: 'Unable to update examination.'
            });

        }

        return res.status(200).json({
            success: true,
            message: 'Examination updated successfully.'
        });

    } catch (error) {

        return sendError(
            res,
            error,
            'Unable to update examination.'
        );

    }

};


// ==========================================
// 7. TEACHER: DELETE EXAMINATION
// ==========================================

const deleteExam = async (req, res) => {

    const teacherId = req.user.id;
    const examId = req.params.examId;

    if (!isValidId(examId)) {

        return res.status(400).json({
            success: false,
            message: 'Invalid examination ID.'
        });

    }

    try {

        const result =
            await marksRepository.deleteExam(
                teacherId,
                Number(examId)
            );


        // Examination missing or unauthorized

        if (result.outcome === 'not_found') {

            return res.status(404).json({
                success: false,
                message:
                    'Examination not found or not assigned to you.'
            });

        }


        // Existing marks protection

        if (result.outcome === 'has_marks') {

            return res.status(409).json({
                success: false,
                message:
                    'This examination already has marks records. Delete those records first.'
            });

        }

        if (result.outcome !== 'success') {

            return res.status(500).json({
                success: false,
                message: 'Unable to delete examination.'
            });

        }

        return res.status(200).json({
            success: true,
            message: 'Examination deleted successfully.'
        });

    } catch (error) {

        if (error.code === 'ER_ROW_IS_REFERENCED_2') {

            return res.status(409).json({
                success: false,
                message:
                    'This examination has related records and cannot be deleted.'
            });

        }

        return sendError(
            res,
            error,
            'Unable to delete examination.'
        );

    }

};


// ==========================================
// 8. TEACHER: ADD BULK MARKS
// ==========================================

const addMarks = async (req, res) => {

    const teacherId = req.user.id;

    const {
        exam_id,
        students
    } = req.body || {};


    // Validate exam ID and students array

    if (
        !isValidId(exam_id) ||
        !Array.isArray(students) ||
        students.length === 0
    ) {

        return res.status(400).json({
            success: false,
            message:
                'Please provide a valid exam ID and students array.'
        });

    }


    const studentIds = new Set();

    const normalizedStudents = [];


    // Validate all students before database execution

    for (const student of students) {

        if (
            !student ||
            !isValidId(student.student_id)
        ) {

            return res.status(400).json({
                success: false,
                message:
                    'Invalid or duplicate student IDs.'
            });

        }


        const studentId =
            Number(student.student_id);


        // Prevent duplicate students

        if (studentIds.has(studentId)) {

            return res.status(400).json({
                success: false,
                message:
                    'Invalid or duplicate student IDs.'
            });

        }

        studentIds.add(studentId);


        // Validate obtained marks

        if (
            !isValidMarks(
                student.obtained_marks
            )
        ) {

            return res.status(400).json({
                success: false,
                message:
                    `Invalid marks for student ID ${studentId}. Enter non-negative marks with at most two decimal places.`
            });

        }


        // Validate remarks

        if (!isValidRemarks(student.remarks)) {

            return res.status(400).json({
                success: false,
                message:
                    `Invalid remarks for student ID ${studentId}.`
            });

        }


        // Prepare normalized student data

        normalizedStudents.push({

            student_id: studentId,

            obtained_marks:
                Number(student.obtained_marks),

            remarks:
                student.remarks || null

        });

    }

    try {

        const result =
            await marksRepository.addMarks(
                teacherId,
                Number(exam_id),
                normalizedStudents
            );


        // Teacher not assigned to exam subject

        if (result.outcome === 'forbidden') {

            return res.status(403).json({
                success: false,
                message:
                    'Examination not found or not assigned to you.'
            });

        }


        // Ineligible students

        if (result.outcome === 'invalid_students') {

            return res.status(403).json({
                success: false,
                message:
                    'One or more students are inactive or do not have approved enrollment in this subject.'
            });

        }


        // Obtained marks exceed maximum marks

        if (result.outcome === 'invalid_marks') {

            return res.status(400).json({
                success: false,
                message:
                    `Invalid marks for student ID ${result.student_id}. Maximum marks: ${result.max_marks}.`
            });

        }

        if (result.outcome !== 'success') {

            return res.status(500).json({
                success: false,
                message: 'Unable to save marks.'
            });

        }

        return res.status(201).json({
            success: true,
            message: 'Marks added successfully.',
            total_students: result.total_students
        });

    } catch (error) {


        // Duplicate marks

        if (error.code === 'ER_DUP_ENTRY') {

            return res.status(409).json({
                success: false,
                message:
                    'Marks already exist for one or more students in this examination.'
            });

        }

        return sendError(
            res,
            error,
            'Unable to save marks.'
        );

    }

};


// ==========================================
// 9. TEACHER: GET MARKS RECORDS
// ==========================================

const getMarksRecords = async (req, res) => {

    const teacherId = req.user.id;
    const examId = req.params.examId;

    if (!isValidId(examId)) {

        return res.status(400).json({
            success: false,
            message: 'Invalid examination ID.'
        });

    }

    try {

        const results =
            await marksRepository.getMarksRecords(
                teacherId,
                Number(examId)
            );

        return res.status(200).json({
            success: true,
            total_records: results.length,
            data: results
        });

    } catch (error) {

        return sendError(
            res,
            error,
            'Unable to fetch marks records.'
        );

    }

};


// ==========================================
// 10. TEACHER: EDIT INDIVIDUAL MARKS
// ==========================================

const editMarks = async (req, res) => {

    const teacherId = req.user.id;
    const markId = req.params.markId;

    const {
        obtained_marks,
        remarks
    } = req.body || {};


    // Validate marks record ID

    if (!isValidId(markId)) {

        return res.status(400).json({
            success: false,
            message: 'Invalid marks ID.'
        });

    }


    // Validate obtained marks

    if (!isValidMarks(obtained_marks)) {

        return res.status(400).json({
            success: false,
            message:
                'Please provide valid obtained marks.'
        });

    }


    // Validate remarks

    if (!isValidRemarks(remarks)) {

        return res.status(400).json({
            success: false,
            message:
                'Remarks must not exceed 255 characters.'
        });

    }

    try {

        const result =
            await marksRepository.editMarks(
                teacherId,
                Number(markId),
                Number(obtained_marks),
                remarks === undefined
                    ? null
                    : remarks
            );


        // Invalid record or unauthorized teacher

        if (
            result.outcome === 'not_found' ||
            result.outcome === 'invalid_marks'
        ) {

            return res.status(400).json({
                success: false,
                message:
                    'Marks record not found, not assigned to you, or marks exceed the maximum.'
            });

        }

        if (result.outcome !== 'success') {

            return res.status(500).json({
                success: false,
                message: 'Unable to update marks.'
            });

        }

        return res.status(200).json({
            success: true,
            message: 'Marks updated successfully.'
        });

    } catch (error) {

        return sendError(
            res,
            error,
            'Unable to update marks.'
        );

    }

};


// ==========================================
// 11. TEACHER: DELETE INDIVIDUAL MARKS
// ==========================================

const deleteMarks = async (req, res) => {

    const teacherId = req.user.id;
    const markId = req.params.markId;

    if (!isValidId(markId)) {

        return res.status(400).json({
            success: false,
            message: 'Invalid marks ID.'
        });

    }

    try {

        const result =
            await marksRepository.deleteMarks(
                teacherId,
                Number(markId)
            );


        // Record missing or unauthorized teacher

        if (result.outcome === 'not_found') {

            return res.status(404).json({
                success: false,
                message:
                    'Marks record not found or not assigned to you.'
            });

        }

        if (result.outcome !== 'success') {

            return res.status(500).json({
                success: false,
                message: 'Unable to delete marks.'
            });

        }

        return res.status(200).json({
            success: true,
            message: 'Marks deleted successfully.'
        });

    } catch (error) {

        return sendError(
            res,
            error,
            'Unable to delete marks.'
        );

    }

};


// ==========================================
// EXPORT ALL CONTROLLER FUNCTIONS
// ==========================================

module.exports = {

    getMyMarks,

    getTeacherSubjects,

    getStudentsForMarks,

    getExamsBySubject,

    createExam,

    updateExam,

    deleteExam,

    addMarks,

    getMarksRecords,

    editMarks,

    deleteMarks

};