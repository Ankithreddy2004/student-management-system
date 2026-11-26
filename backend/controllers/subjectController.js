
const subjectRepository =
    require('../repositories/subjectRepository');


// ==========================================
// 1. GET ALL SUBJECTS
// ==========================================

exports.getAllSubjects = async (req, res) => {

    try {

        const results =
            await subjectRepository.getAllSubjects();

        return res.status(200).json({
            success: true,
            message: 'Subjects fetched successfully.',
            data: results
        });

    } catch (error) {

        console.error('Get Subjects Error:', {
            code: error.code,
            message: error.message
        });

        return res.status(500).json({
            success: false,
            message: 'Unable to fetch subjects.'
        });

    }

};


// ==========================================
// 2. GET SUBJECT BY ID
// ==========================================

exports.getSubjectById = async (req, res) => {

    const subjectId = Number(req.params.id);

    if (
        !Number.isInteger(subjectId) ||
        subjectId <= 0
    ) {

        return res.status(400).json({
            success: false,
            message: 'Invalid subject ID.'
        });

    }

    try {

        const results =
            await subjectRepository.getSubjectById(
                subjectId
            );

        if (results.length === 0) {

            return res.status(404).json({
                success: false,
                message: 'Subject not found.'
            });

        }

        return res.status(200).json({
            success: true,
            data: results[0]
        });

    } catch (error) {

        console.error('Get Subject Error:', {
            code: error.code,
            message: error.message
        });

        return res.status(500).json({
            success: false,
            message: 'Unable to fetch subject.'
        });

    }

};


// ==========================================
// 3. CREATE SUBJECT
// ==========================================

exports.createSubject = async (req, res) => {

    let {
        subject_name,
        subject_code,
        course,
        semester
    } = req.body;


    // Validate required fields

    if (
        !subject_name ||
        !subject_code ||
        !course ||
        semester === undefined ||
        semester === null ||
        semester === ''
    ) {

        return res.status(400).json({
            success: false,
            message: 'All subject fields are required.'
        });

    }


    // Clean input values

    subject_name =
        String(subject_name).trim();

    subject_code =
        String(subject_code).trim().toUpperCase();

    course =
        String(course).trim().toUpperCase();

    semester = Number(semester);


    // Validate subject details

    if (
        !subject_name ||
        !subject_code ||
        !course
    ) {

        return res.status(400).json({
            success: false,
            message: 'Subject details cannot be empty.'
        });

    }


    // Validate semester

    if (
        !Number.isInteger(semester) ||
        semester < 1 ||
        semester > 12
    ) {

        return res.status(400).json({
            success: false,
            message: 'Semester must be between 1 and 12.'
        });

    }

    try {

        // Create subject using stored procedure

        const result =
            await subjectRepository.createSubject(
                subject_name,
                subject_code,
                course,
                semester
            );

        return res.status(201).json({

            success: true,

            message: 'Subject created successfully.',

            data: {
                id: result.subject_id,
                subject_name,
                subject_code,
                course,
                semester
            }

        });

    } catch (error) {

        console.error('Create Subject Error:', {
            code: error.code,
            message: error.message
        });


        // Duplicate subject code

        if (error.code === 'ER_DUP_ENTRY') {

            return res.status(409).json({
                success: false,
                message: 'This subject code already exists for this course and semester.'
            });

        }

        return res.status(500).json({
            success: false,
            message: 'Unable to create subject.'
        });

    }

};


// ==========================================
// 4. UPDATE SUBJECT
// ==========================================

exports.updateSubject = async (req, res) => {

    const subjectId = Number(req.params.id);

    let {
        subject_name,
        subject_code,
        course,
        semester
    } = req.body;


    // Validate subject ID

    if (
        !Number.isInteger(subjectId) ||
        subjectId <= 0
    ) {

        return res.status(400).json({
            success: false,
            message: 'Invalid subject ID.'
        });

    }


    // Validate required fields

    if (
        !subject_name ||
        !subject_code ||
        !course ||
        semester === undefined ||
        semester === null ||
        semester === ''
    ) {

        return res.status(400).json({
            success: false,
            message: 'All subject fields are required.'
        });

    }


    // Clean input values

    subject_name =
        String(subject_name).trim();

    subject_code =
        String(subject_code).trim().toUpperCase();

    course =
        String(course).trim().toUpperCase();

    semester = Number(semester);


    // Validate subject details

    if (
        !subject_name ||
        !subject_code ||
        !course
    ) {

        return res.status(400).json({
            success: false,
            message: 'Subject details cannot be empty.'
        });

    }


    // Validate semester

    if (
        !Number.isInteger(semester) ||
        semester < 1 ||
        semester > 12
    ) {

        return res.status(400).json({
            success: false,
            message: 'Semester must be between 1 and 12.'
        });

    }

    try {

        const result =
            await subjectRepository.updateSubject(
                subjectId,
                subject_name,
                subject_code,
                course,
                semester
            );


        // Subject does not exist

        if (!Number(result.subject_exists)) {

            return res.status(404).json({
                success: false,
                message: 'Subject not found.'
            });

        }


        // No changes made

        if (Number(result.affectedRows) === 0) {

            return res.status(200).json({
                success: true,
                message: 'Subject information is already up to date.'
            });

        }


        // Subject updated successfully

        return res.status(200).json({
            success: true,
            message: 'Subject updated successfully.'
        });

    } catch (error) {

        console.error('Update Subject Error:', {
            code: error.code,
            message: error.message
        });


        // Duplicate subject code

        if (error.code === 'ER_DUP_ENTRY') {

            return res.status(409).json({
                success: false,
                message: 'Another subject already uses this code for the selected course and semester.'
            });

        }

        return res.status(500).json({
            success: false,
            message: 'Unable to update subject.'
        });

    }

};


// ==========================================
// 5. DELETE SUBJECT
// ==========================================

exports.deleteSubject = async (req, res) => {

    const subjectId = Number(req.params.id);

    if (
        !Number.isInteger(subjectId) ||
        subjectId <= 0
    ) {

        return res.status(400).json({
            success: false,
            message: 'Invalid subject ID.'
        });

    }

    try {

        const result =
            await subjectRepository.deleteSubject(
                subjectId
            );


        // Subject has teacher assignments

        if (result.outcome === 'has_assignments') {

            return res.status(409).json({
                success: false,
                message: 'Remove teacher assignments before deleting this subject.'
            });

        }


        // Subject has examinations

        if (result.outcome === 'has_exams') {

            return res.status(409).json({
                success: false,
                message: 'This subject has examinations and cannot be deleted.'
            });

        }


        // Subject not found

        if (result.outcome === 'not_found') {

            return res.status(404).json({
                success: false,
                message: 'Subject not found.'
            });

        }


        // Verify deletion result

        if (result.outcome !== 'deleted') {

            return res.status(500).json({
                success: false,
                message: 'Unable to delete subject.'
            });

        }

        return res.status(200).json({
            success: true,
            message: 'Subject deleted successfully.'
        });

    } catch (error) {

        console.error('Delete Subject Error:', {
            code: error.code,
            message: error.message
        });


        // Prevent deletion of related records

        if (
            error.code === 'ER_ROW_IS_REFERENCED_2' ||
            error.errno === 1451
        ) {

            return res.status(409).json({
                success: false,
                message: 'This subject has related records and cannot be deleted.'
            });

        }

        return res.status(500).json({
            success: false,
            message: 'Unable to delete subject.'
        });

    }

};


// ==========================================
// 6. GET ALL TEACHER-SUBJECT ASSIGNMENTS
// ==========================================

exports.getAllAssignments = async (req, res) => {

    try {

        const results =
            await subjectRepository.getAllAssignments();

        return res.status(200).json({
            success: true,
            message: 'Assignments fetched successfully.',
            data: results
        });

    } catch (error) {

        console.error('Get Assignments Error:', {
            code: error.code,
            message: error.message
        });

        return res.status(500).json({
            success: false,
            message: 'Unable to fetch assignments.'
        });

    }

};


// ==========================================
// 7. ASSIGN MULTIPLE SUBJECTS TO TEACHER
// ==========================================

exports.assignSubjects = async (req, res) => {

    const teacherId = Number(req.body.teacher_id);

    const subjectIds = req.body.subject_ids;


    // Validate teacher ID

    if (
        !Number.isInteger(teacherId) ||
        teacherId <= 0
    ) {

        return res.status(400).json({
            success: false,
            message: 'Valid teacher ID is required.'
        });

    }


    // Validate subject array

    if (
        !Array.isArray(subjectIds) ||
        subjectIds.length === 0
    ) {

        return res.status(400).json({
            success: false,
            message: 'Select at least one subject.'
        });

    }


    // Convert subject IDs into numbers

    const normalizedIds =
        subjectIds.map(Number);


    // Validate all subject IDs

    if (
        normalizedIds.some(
            id => !Number.isInteger(id) || id <= 0
        )
    ) {

        return res.status(400).json({
            success: false,
            message: 'One or more subject IDs are invalid.'
        });

    }


    // Remove duplicate IDs

    const uniqueSubjectIds =
        [...new Set(normalizedIds)];

    try {

        const result =
            await subjectRepository.assignSubjects(
                teacherId,
                uniqueSubjectIds
            );


        // Teacher does not exist

        if (result.outcome === 'teacher_not_found') {

            return res.status(404).json({
                success: false,
                message: 'Teacher not found.'
            });

        }


        // One or more subjects do not exist

        if (result.outcome === 'subjects_not_found') {

            return res.status(404).json({
                success: false,
                message: 'One or more selected subjects do not exist.'
            });

        }


        // Verify procedure result

        if (result.outcome !== 'success') {

            return res.status(500).json({
                success: false,
                message: 'Unable to assign subjects.'
            });

        }


        // Assignment successful

        return res.status(200).json({

            success: true,

            message: 'Subject assignment processed successfully.',

            data: {
                teacher_id: result.teacher_id,
                total_requested: result.total_requested,
                newly_assigned: result.newly_assigned,
                already_assigned: result.already_assigned
            }

        });

    } catch (error) {

        console.error('Assign Subjects Error:', {
            code: error.code,
            message: error.message
        });

        return res.status(500).json({
            success: false,
            message: 'Unable to assign subjects.'
        });

    }

};


// ==========================================
// 8. REMOVE TEACHER-SUBJECT ASSIGNMENT
// ==========================================

exports.removeAssignment = async (req, res) => {

    const assignmentId =
        Number(req.params.assignmentId);

    if (
        !Number.isInteger(assignmentId) ||
        assignmentId <= 0
    ) {

        return res.status(400).json({
            success: false,
            message: 'Invalid assignment ID.'
        });

    }

    try {

        const result =
            await subjectRepository.removeAssignment(
                assignmentId
            );

        if (Number(result.affectedRows) === 0) {

            return res.status(404).json({
                success: false,
                message: 'Assignment not found.'
            });

        }

        return res.status(200).json({
            success: true,
            message: 'Subject assignment removed successfully.'
        });

    } catch (error) {

        console.error('Remove Assignment Error:', {
            code: error.code,
            message: error.message
        });

        if (
            error.code === 'ER_ROW_IS_REFERENCED_2' ||
            error.errno === 1451
        ) {

            return res.status(409).json({
                success: false,
                message: 'This assignment is referenced by existing records and cannot be removed.'
            });

        }

        return res.status(500).json({
            success: false,
            message: 'Unable to remove assignment.'
        });

    }

};
