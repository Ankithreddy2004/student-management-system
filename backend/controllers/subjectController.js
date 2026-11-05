const db = require('../config/db');

// ==========================================
// GET ALL SUBJECTS
// ==========================================

exports.getAllSubjects = (req, res) => {

    const sql = `
        SELECT
            id,
            subject_name,
            subject_code,
            course,
            semester,
            created_at
        FROM subjects
        ORDER BY course, semester, subject_name
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                success: false,
                message: 'Unable to fetch subjects.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Subjects fetched successfully.',
            data: results
        });

    });

};


// ==========================================
// GET SUBJECT BY ID
// ==========================================

exports.getSubjectById = (req, res) => {

    const subjectId = Number(req.params.id);

    if (!Number.isInteger(subjectId) || subjectId <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid subject ID.'
        });
    }

    const sql = `
        SELECT *
        FROM subjects
        WHERE id = ?
    `;

    db.query(sql, [subjectId], (err, results) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Unable to fetch subject.'
            });
        }

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

    });

};


// ==========================================
// CREATE SUBJECT
// ==========================================

exports.createSubject = (req, res) => {

    let {
        subject_name,
        subject_code,
        course,
        semester
    } = req.body;

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

    subject_name = String(subject_name).trim();
    subject_code = String(subject_code).trim().toUpperCase();
    course = String(course).trim().toUpperCase();
    semester = Number(semester);

    if (!subject_name || !subject_code || !course) {
        return res.status(400).json({
            success: false,
            message: 'Subject details cannot be empty.'
        });
    }

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

    const sql = `
        INSERT INTO subjects
        (subject_name, subject_code, course, semester)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [subject_name, subject_code, course, semester],
        (err, result) => {

            if (err) {

                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({
                        success: false,
                        message: 'This subject code already exists for this course and semester.'
                    });
                }

                console.error(err);

                return res.status(500).json({
                    success: false,
                    message: 'Unable to create subject.'
                });

            }

            return res.status(201).json({
                success: true,
                message: 'Subject created successfully.',
                data: {
                    id: result.insertId,
                    subject_name,
                    subject_code,
                    course,
                    semester
                }
            });

        }
    );

};


// ==========================================
// UPDATE SUBJECT
// ==========================================

exports.updateSubject = (req, res) => {

    const subjectId = Number(req.params.id);

    let {
        subject_name,
        subject_code,
        course,
        semester
    } = req.body;

    if (!Number.isInteger(subjectId) || subjectId <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid subject ID.'
        });
    }

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

    subject_name = String(subject_name).trim();
    subject_code = String(subject_code).trim().toUpperCase();
    course = String(course).trim().toUpperCase();
    semester = Number(semester);

    if (!subject_name || !subject_code || !course) {
        return res.status(400).json({
            success: false,
            message: 'Subject details cannot be empty.'
        });
    }

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

    const sql = `
        UPDATE subjects
        SET
            subject_name = ?,
            subject_code = ?,
            course = ?,
            semester = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [
            subject_name,
            subject_code,
            course,
            semester,
            subjectId
        ],
        (err, result) => {

            if (err) {

                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({
                        success: false,
                        message: 'Another subject already uses this code for the selected course and semester.'
                    });
                }

                console.error(err);

                return res.status(500).json({
                    success: false,
                    message: 'Unable to update subject.'
                });

            }

            if (result.affectedRows === 0) {

                return db.query(
                    'SELECT id FROM subjects WHERE id = ?',
                    [subjectId],
                    (checkErr, rows) => {

                        if (checkErr) {
                            return res.status(500).json({
                                success: false,
                                message: 'Unable to verify subject.'
                            });
                        }

                        if (rows.length === 0) {
                            return res.status(404).json({
                                success: false,
                                message: 'Subject not found.'
                            });
                        }

                        return res.status(200).json({
                            success: true,
                            message: 'Subject information is already up to date.'
                        });

                    }
                );

            }

            return res.status(200).json({
                success: true,
                message: 'Subject updated successfully.'
            });

        }
    );

};


// ==========================================
// DELETE SUBJECT
// ==========================================

exports.deleteSubject = (req, res) => {

    const subjectId = Number(req.params.id);

    if (!Number.isInteger(subjectId) || subjectId <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid subject ID.'
        });
    }

    // Check whether subject has teacher assignments
    const assignmentSql = `
        SELECT id
        FROM teacher_subjects
        WHERE subject_id = ?
        LIMIT 1
    `;

    db.query(assignmentSql, [subjectId], (err, assignments) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Unable to check subject assignments.'
            });
        }

        if (assignments.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Remove teacher assignments before deleting this subject.'
            });
        }

        // Check whether subject has examinations
        const examSql = `
            SELECT id
            FROM exams
            WHERE subject_id = ?
            LIMIT 1
        `;

        db.query(examSql, [subjectId], (examErr, exams) => {

            if (examErr) {
                return res.status(500).json({
                    success: false,
                    message: 'Unable to check subject examinations.'
                });
            }

            if (exams.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'This subject has examinations and cannot be deleted.'
                });
            }

            db.query(
                'DELETE FROM subjects WHERE id = ?',
                [subjectId],
                (deleteErr, result) => {

                    if (deleteErr) {

                        if (
                            deleteErr.code === 'ER_ROW_IS_REFERENCED_2'
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

                    if (result.affectedRows === 0) {
                        return res.status(404).json({
                            success: false,
                            message: 'Subject not found.'
                        });
                    }

                    return res.status(200).json({
                        success: true,
                        message: 'Subject deleted successfully.'
                    });

                }
            );

        });

    });

};


// ==========================================
// GET ALL TEACHER-SUBJECT ASSIGNMENTS
// ==========================================

exports.getAllAssignments = (req, res) => {

    const sql = `
        SELECT
            ts.id AS assignment_id,
            ts.teacher_id,
            u.name AS teacher_name,
            u.email AS teacher_email,
            ts.subject_id,
            s.subject_name,
            s.subject_code,
            s.course,
            s.semester,
            ts.assigned_at
        FROM teacher_subjects ts
        INNER JOIN users u
            ON ts.teacher_id = u.id
        INNER JOIN subjects s
            ON ts.subject_id = s.id
        WHERE u.role = 'Teacher'
        ORDER BY u.name, s.course, s.semester
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                success: false,
                message: 'Unable to fetch assignments.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Assignments fetched successfully.',
            data: results
        });

    });

};


// ==========================================
// ASSIGN MULTIPLE SUBJECTS TO TEACHER
// ==========================================

exports.assignSubjects = (req, res) => {

    const teacherId = Number(req.body.teacher_id);
    const subjectIds = req.body.subject_ids;

    if (!Number.isInteger(teacherId) || teacherId <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Valid teacher ID is required.'
        });
    }

    if (
        !Array.isArray(subjectIds) ||
        subjectIds.length === 0
    ) {
        return res.status(400).json({
            success: false,
            message: 'Select at least one subject.'
        });
    }

    const normalizedIds = subjectIds.map(Number);

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

    const uniqueSubjectIds = [...new Set(normalizedIds)];

    db.getConnection((connectionErr, connection) => {

        if (connectionErr) {
            return res.status(500).json({
                success: false,
                message: 'Unable to connect to database.'
            });
        }

        const rollback = (status, message) => {

            connection.rollback(() => {
                connection.release();

                return res.status(status).json({
                    success: false,
                    message
                });
            });

        };

        connection.beginTransaction(transactionErr => {

            if (transactionErr) {
                connection.release();

                return res.status(500).json({
                    success: false,
                    message: 'Unable to start assignment transaction.'
                });
            }

            // Verify teacher account
            connection.query(
                `
                SELECT id
                FROM users
                WHERE id = ?
                AND role = 'Teacher'
                `,
                [teacherId],
                (teacherErr, teachers) => {

                    if (teacherErr) {
                        return rollback(
                            500,
                            'Unable to verify teacher.'
                        );
                    }

                    if (teachers.length === 0) {
                        return rollback(
                            404,
                            'Teacher not found.'
                        );
                    }

                    // Verify all subjects exist
                    const placeholders = uniqueSubjectIds
                        .map(() => '?')
                        .join(',');

                    connection.query(
                        `
                        SELECT id
                        FROM subjects
                        WHERE id IN (${placeholders})
                        `,
                        uniqueSubjectIds,
                        (subjectErr, subjects) => {

                            if (subjectErr) {
                                return rollback(
                                    500,
                                    'Unable to verify subjects.'
                                );
                            }

                            if (
                                subjects.length !== uniqueSubjectIds.length
                            ) {
                                return rollback(
                                    404,
                                    'One or more selected subjects do not exist.'
                                );
                            }

                            // Insert assignments
                            const values = uniqueSubjectIds.map(
                                subjectId => [teacherId, subjectId]
                            );

                            connection.query(
                                `
                                INSERT IGNORE INTO teacher_subjects
                                (teacher_id, subject_id)
                                VALUES ?
                                `,
                                [values],
                                (insertErr, result) => {

                                    if (insertErr) {
                                        return rollback(
                                            500,
                                            'Unable to assign subjects.'
                                        );
                                    }

                                    const newlyAssigned =
                                        result.affectedRows;

                                    const duplicates =
                                        uniqueSubjectIds.length -
                                        newlyAssigned;

                                    connection.commit(commitErr => {

                                        if (commitErr) {
                                            return rollback(
                                                500,
                                                'Unable to complete assignment.'
                                            );
                                        }

                                        connection.release();

                                        return res.status(200).json({
                                            success: true,
                                            message: 'Subject assignment processed successfully.',
                                            data: {
                                                teacher_id: teacherId,
                                                total_requested: uniqueSubjectIds.length,
                                                newly_assigned: newlyAssigned,
                                                already_assigned: duplicates
                                            }
                                        });

                                    });

                                }
                            );

                        }
                    );

                }
            );

        });

    });

};


// ==========================================
// REMOVE TEACHER-SUBJECT ASSIGNMENT
// ==========================================

exports.removeAssignment = (req, res) => {

    const assignmentId = Number(req.params.assignmentId);

    if (
        !Number.isInteger(assignmentId) ||
        assignmentId <= 0
    ) {
        return res.status(400).json({
            success: false,
            message: 'Invalid assignment ID.'
        });
    }

    db.query(
        `
        DELETE FROM teacher_subjects
        WHERE id = ?
        `,
        [assignmentId],
        (err, result) => {

            if (err) {

                if (err.code === 'ER_ROW_IS_REFERENCED_2') {
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

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Assignment not found.'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Subject assignment removed successfully.'
            });

        }
    );

};