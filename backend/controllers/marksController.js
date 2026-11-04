const db = require('../config/db');

// ==========================================
// STUDENT: GET MY MARKS
// ==========================================

const getMyMarks = (req, res) => {

    const studentId = req.user.student_id;

    if (!studentId) {
        return res.status(400).json({
            success: false,
            message: 'Student information not found.'
        });
    }

    const sql = `
        SELECT
            m.id,
            m.obtained_marks,
            m.remarks,
            e.id AS exam_id,
            e.exam_name,
            e.exam_type,
            DATE_FORMAT(e.exam_date, '%Y-%m-%d') AS exam_date,
            e.max_marks,
            s.id AS subject_id,
            s.subject_name,
            s.subject_code
        FROM marks m
        JOIN exams e ON m.exam_id = e.id
        JOIN subjects s ON e.subject_id = s.id
        WHERE m.student_id = ?
        ORDER BY e.exam_date DESC
    `;

    db.query(sql, [studentId], (error, results) => {

        if (error) {
            console.error(error);

            return res.status(500).json({
                success: false,
                message: 'Unable to fetch marks records.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Marks records fetched successfully.',
            data: results
        });
    });
};


// ==========================================
// TEACHER: GET ASSIGNED SUBJECTS
// ==========================================

const getTeacherSubjects = (req, res) => {

    const teacherId = req.user.id;

    const sql = `
        SELECT
            s.id,
            s.subject_name,
            s.subject_code,
            s.course,
            s.semester
        FROM teacher_subjects ts
        JOIN subjects s ON ts.subject_id = s.id
        WHERE ts.teacher_id = ?
        ORDER BY s.subject_name
    `;

    db.query(sql, [teacherId], (error, results) => {

        if (error) {
            console.error(error);

            return res.status(500).json({
                success: false,
                message: 'Unable to fetch assigned subjects.'
            });
        }

        return res.status(200).json({
            success: true,
            data: results
        });
    });
};


// ==========================================
// TEACHER: GET STUDENTS BY SUBJECT
// ==========================================
const getStudentsForMarks = (req, res) => {

    const teacherId = req.user.id;
    const subjectId = Number(req.params.subjectId);

    if (!Number.isInteger(subjectId) || subjectId <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid subject ID.'
        });
    }

    // Verify teacher assignment and retrieve students
    const sql = `
        SELECT
            st.id,
            st.name,
            st.email,
            st.phone,
            st.course
        FROM students st
        WHERE st.course = (
            SELECT s.course
            FROM subjects s
            JOIN teacher_subjects ts
                ON ts.subject_id = s.id
            WHERE s.id = ?
            AND ts.teacher_id = ?
        )
        AND st.status = 'Active'
        ORDER BY st.name
    `;

    db.query(sql, [subjectId, teacherId], (error, results) => {

        if (error) {
            console.error('Get Students For Marks Error:', error);

            return res.status(500).json({
                success: false,
                message: 'Unable to fetch students.'
            });
        }

        return res.status(200).json({
            success: true,
            total_students: results.length,
            data: results
        });
    });
};


// ==========================================
// TEACHER: GET EXAMS BY SUBJECT
// ==========================================

const getExamsBySubject = (req, res) => {

    const teacherId = req.user.id;
    const subjectId = Number(req.params.subjectId);

    if (!Number.isInteger(subjectId) || subjectId <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid subject ID.'
        });
    }

    const sql = `
        SELECT
            e.id,
            e.subject_id,
            e.exam_name,
            e.exam_type,
            DATE_FORMAT(e.exam_date, '%Y-%m-%d') AS exam_date,
            e.max_marks,
            e.created_at
        FROM exams e
        JOIN teacher_subjects ts ON ts.subject_id = e.subject_id
        WHERE ts.teacher_id = ?
        AND e.subject_id = ?
        ORDER BY e.exam_date DESC, e.id DESC
    `;

    db.query(sql, [teacherId, subjectId], (error, results) => {

        if (error) {
            console.error(error);

            return res.status(500).json({
                success: false,
                message: 'Unable to fetch examinations.'
            });
        }

        return res.status(200).json({
            success: true,
            data: results
        });
    });
};


// ==========================================
// TEACHER: CREATE EXAM
// ==========================================

const createExam = (req, res) => {

    const teacherId = req.user.id;

    const {
        subject_id,
        exam_name,
        exam_type,
        exam_date,
        max_marks
    } = req.body;

    const validExamTypes = [
        'Internal',
        'Midterm',
        'Final',
        'Practical',
        'Assignment'
    ];

    if (
        !subject_id ||
        !exam_name ||
        !exam_type ||
        max_marks === undefined
    ) {
        return res.status(400).json({
            success: false,
            message: 'Please provide all required examination details.'
        });
    }

    if (
        !Number.isInteger(Number(subject_id)) ||
        Number(subject_id) <= 0
    ) {
        return res.status(400).json({
            success: false,
            message: 'Invalid subject ID.'
        });
    }

    if (typeof exam_name !== 'string' || !exam_name.trim() || exam_name.trim().length > 100) {
        return res.status(400).json({
            success: false,
            message: 'Exam name must contain 1 to 100 characters.'
        });
    }

    if (!validExamTypes.includes(exam_type)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid examination type.'
        });
    }

    if (
        !Number.isFinite(Number(max_marks)) ||
        Number(max_marks) <= 0 ||
        Number(max_marks) > 9999.99
    ) {
        return res.status(400).json({
            success: false,
            message: 'Maximum marks must be greater than zero and at most 9999.99.'
        });
    }

    if (
        exam_date &&
        !/^\d{4}-\d{2}-\d{2}$/.test(exam_date)
    ) {
        return res.status(400).json({
            success: false,
            message: 'Exam date must use YYYY-MM-DD format.'
        });
    }

    const assignmentSql = `
        SELECT id
        FROM teacher_subjects
        WHERE teacher_id = ?
        AND subject_id = ?
    `;

    db.query(
        assignmentSql,
        [teacherId, subject_id],
        (error, assignments) => {

            if (error) {
                console.error(error);

                return res.status(500).json({
                    success: false,
                    message: 'Unable to verify subject assignment.'
                });
            }

            if (assignments.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not assigned to this subject.'
                });
            }

            const insertSql = `
                INSERT INTO exams
                (subject_id, exam_name, exam_type, exam_date, max_marks)
                VALUES (?, ?, ?, ?, ?)
            `;

            db.query(
                insertSql,
                [
                    subject_id,
                    exam_name.trim(),
                    exam_type,
                    exam_date || null,
                    max_marks
                ],
                (insertError, result) => {

                    if (insertError) {
                        console.error(insertError);

                        return res.status(500).json({
                            success: false,
                            message: 'Unable to create examination.'
                        });
                    }

                    return res.status(201).json({
                        success: true,
                        message: 'Examination created successfully.',
                        exam_id: result.insertId
                    });
                }
            );
        }
    );
};


// ==========================================
// TEACHER: UPDATE EXAM
// ==========================================

const updateExam = (req, res) => {

    const teacherId = req.user.id;
    const examId = Number(req.params.examId);

    const {
        exam_name,
        exam_type,
        exam_date,
        max_marks
    } = req.body;

    const validExamTypes = [
        'Internal',
        'Midterm',
        'Final',
        'Practical',
        'Assignment'
    ];

    if (!Number.isInteger(examId) || examId <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid examination ID.'
        });
    }

    if (
        typeof exam_name !== 'string' ||
        !exam_name.trim() ||
        exam_name.trim().length > 100 ||
        !validExamTypes.includes(exam_type) ||
        !Number.isFinite(Number(max_marks)) ||
        Number(max_marks) <= 0 ||
        Number(max_marks) > 9999.99 ||
        (exam_date && !/^\d{4}-\d{2}-\d{2}$/.test(exam_date))
    ) {
        return res.status(400).json({
            success: false,
            message: 'Please provide valid examination details.'
        });
    }

    const sql = `
        UPDATE exams e
        JOIN teacher_subjects ts
            ON ts.subject_id = e.subject_id
        SET
            e.exam_name = ?,
            e.exam_type = ?,
            e.exam_date = ?,
            e.max_marks = ?
        WHERE e.id = ?
        AND ts.teacher_id = ?
    `;

    db.query(
        sql,
        [
            exam_name.trim(),
            exam_type,
            exam_date || null,
            max_marks,
            examId,
            teacherId
        ],
        (error, result) => {

            if (error) {
                console.error(error);

                return res.status(500).json({
                    success: false,
                    message: 'Unable to update examination.'
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Examination not found or not assigned to you.'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Examination updated successfully.'
            });
        }
    );
};


// ==========================================
// TEACHER: DELETE EXAM
// ==========================================

const deleteExam = (req, res) => {

    const teacherId = req.user.id;
    const examId = Number(req.params.examId);

    if (!Number.isInteger(examId) || examId <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid examination ID.'
        });
    }

    const sql = `
        SELECT e.id
        FROM exams e
        JOIN teacher_subjects ts ON ts.subject_id = e.subject_id
        WHERE e.id = ?
        AND ts.teacher_id = ?
    `;

    db.query(sql, [examId, teacherId], (error, exams) => {

        if (error) {
            console.error(error);

            return res.status(500).json({
                success: false,
                message: 'Unable to verify examination.'
            });
        }

        if (exams.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Examination not found or not assigned to you.'
            });
        }

        db.query(
            'SELECT COUNT(*) AS total FROM marks WHERE exam_id = ?',
            [examId],
            (countError, results) => {

                if (countError) {
                    console.error(countError);

                    return res.status(500).json({
                        success: false,
                        message: 'Unable to check examination records.'
                    });
                }

                if (results[0].total > 0) {
                    return res.status(409).json({
                        success: false,
                        message: 'This examination already has marks records. Delete those records first.'
                    });
                }

                db.query(
                    'DELETE FROM exams WHERE id = ?',
                    [examId],
                    (deleteError) => {

                        if (deleteError) {
                            console.error(deleteError);

                            return res.status(500).json({
                                success: false,
                                message: 'Unable to delete examination.'
                            });
                        }

                        return res.status(200).json({
                            success: true,
                            message: 'Examination deleted successfully.'
                        });
                    }
                );
            }
        );
    });
};


// ==========================================
// TEACHER: ADD MARKS FOR MULTIPLE STUDENTS
// ==========================================

const addMarks = (req, res) => {

    const teacherId = req.user.id;

    const { exam_id, students } = req.body;

    if (
        !Number.isInteger(Number(exam_id)) ||
        Number(exam_id) <= 0 ||
        !Array.isArray(students) ||
        students.length === 0
    ) {
        return res.status(400).json({
            success: false,
            message: 'Please provide a valid exam ID and students array.'
        });
    }

    const studentIds = students.map(student => Number(student.student_id));

    if (
        studentIds.some(id => !Number.isInteger(id) || id <= 0) ||
        new Set(studentIds).size !== studentIds.length
    ) {
        return res.status(400).json({
            success: false,
            message: 'Invalid or duplicate student IDs.'
        });
    }

    const examSql = `
        SELECT e.id, e.subject_id, e.max_marks, s.course
        FROM exams e
        JOIN subjects s ON s.id = e.subject_id
        JOIN teacher_subjects ts ON ts.subject_id = e.subject_id
        WHERE e.id = ?
        AND ts.teacher_id = ?
    `;

    db.query(examSql, [exam_id, teacherId], (error, exams) => {

        if (error) {
            console.error(error);

            return res.status(500).json({
                success: false,
                message: 'Unable to verify examination.'
            });
        }

        if (exams.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Examination not found or not assigned to you.'
            });
        }

        const exam = exams[0];

        for (const student of students) {

            const marks = Number(student.obtained_marks);

            if (
                student.obtained_marks === undefined ||
                student.obtained_marks === null ||
                student.obtained_marks === '' ||
                !Number.isFinite(marks) ||
                marks < 0 ||
                marks > Number(exam.max_marks) ||
                !Number.isInteger(Math.round(marks * 100))
            ) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid marks for student ID ${student.student_id}. Maximum marks: ${exam.max_marks}.`
                });
            }

            if (
                student.remarks !== undefined &&
                student.remarks !== null &&
                (
                    typeof student.remarks !== 'string' ||
                    student.remarks.length > 255
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid remarks for student ID ${student.student_id}.`
                });
            }
        }

        const placeholders = studentIds.map(() => '?').join(',');

        const studentSql = `
            SELECT id
            FROM students
            WHERE id IN (${placeholders})
            AND course = ?
            AND status = 'Active'
        `;

        db.query(
            studentSql,
            [...studentIds, exam.course],
            (studentError, validStudents) => {

                if (studentError) {
                    console.error(studentError);

                    return res.status(500).json({
                        success: false,
                        message: 'Unable to verify students.'
                    });
                }

                if (validStudents.length !== studentIds.length) {
                    return res.status(400).json({
                        success: false,
                        message: 'Some students are invalid, inactive or do not belong to this subject course.'
                    });
                }

                const connection = db.getConnection;

                db.getConnection((connectionError, conn) => {

                    if (connectionError) {
                        console.error(connectionError);

                        return res.status(500).json({
                            success: false,
                            message: 'Database connection failed.'
                        });
                    }

                    conn.beginTransaction(transactionError => {

                        if (transactionError) {
                            conn.release();

                            return res.status(500).json({
                                success: false,
                                message: 'Unable to start transaction.'
                            });
                        }

                        const values = students.map(student => [
                            Number(student.student_id),
                            Number(exam_id),
                            teacherId,
                            Number(student.obtained_marks),
                            student.remarks || null
                        ]);

                        const insertSql = `
                            INSERT INTO marks
                            (student_id, exam_id, teacher_id, obtained_marks, remarks)
                            VALUES ?
                        `;

                        conn.query(insertSql, [values], (insertError, result) => {

                            if (insertError) {

                                return conn.rollback(() => {

                                    conn.release();

                                    if (insertError.code === 'ER_DUP_ENTRY') {
                                        return res.status(409).json({
                                            success: false,
                                            message: 'Marks already exist for one or more students in this examination.'
                                        });
                                    }

                                    console.error(insertError);

                                    return res.status(500).json({
                                        success: false,
                                        message: 'Unable to save marks.'
                                    });
                                });
                            }

                            conn.commit(commitError => {

                                if (commitError) {

                                    return conn.rollback(() => {

                                        conn.release();

                                        return res.status(500).json({
                                            success: false,
                                            message: 'Unable to save marks.'
                                        });
                                    });
                                }

                                conn.release();

                                return res.status(201).json({
                                    success: true,
                                    message: 'Marks added successfully.',
                                    total_students: result.affectedRows
                                });
                            });
                        });
                    });
                });
            }
        );
    });
};


// ==========================================
// TEACHER: VIEW MARKS RECORDS
// ==========================================

const getMarksRecords = (req, res) => {

    const teacherId = req.user.id;
    const examId = Number(req.params.examId);

    if (!Number.isInteger(examId) || examId <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid examination ID.'
        });
    }

    const sql = `
        SELECT
            m.id AS mark_id,
            m.student_id,
            st.name AS student_name,
            st.email,
            e.id AS exam_id,
            e.exam_name,
            e.exam_type,
            DATE_FORMAT(e.exam_date, '%Y-%m-%d') AS exam_date,
            e.max_marks,
            m.obtained_marks,
            m.remarks,
            s.id AS subject_id,
            s.subject_name,
            s.subject_code
        FROM marks m
        JOIN students st ON st.id = m.student_id
        JOIN exams e ON e.id = m.exam_id
        JOIN subjects s ON s.id = e.subject_id
        JOIN teacher_subjects ts ON ts.subject_id = e.subject_id
        WHERE e.id = ?
        AND ts.teacher_id = ?
        ORDER BY st.name
    `;

    db.query(sql, [examId, teacherId], (error, results) => {

        if (error) {
            console.error(error);

            return res.status(500).json({
                success: false,
                message: 'Unable to fetch marks records.'
            });
        }

        return res.status(200).json({
            success: true,
            total_records: results.length,
            data: results
        });
    });
};


// ==========================================
// TEACHER: EDIT MARKS
// ==========================================

const editMarks = (req, res) => {

    const teacherId = req.user.id;
    const markId = Number(req.params.markId);

    const { obtained_marks, remarks } = req.body;

    if (!Number.isInteger(markId) || markId <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid marks ID.'
        });
    }

    if (
        obtained_marks === undefined ||
        obtained_marks === null ||
        obtained_marks === '' ||
        !Number.isFinite(Number(obtained_marks)) ||
        Number(obtained_marks) < 0
    ) {
        return res.status(400).json({
            success: false,
            message: 'Please provide valid obtained marks.'
        });
    }

    if (
        remarks !== undefined &&
        remarks !== null &&
        (
            typeof remarks !== 'string' ||
            remarks.length > 255
        )
    ) {
        return res.status(400).json({
            success: false,
            message: 'Remarks must not exceed 255 characters.'
        });
    }

    const sql = `
        UPDATE marks m
        JOIN exams e ON e.id = m.exam_id
        JOIN teacher_subjects ts ON ts.subject_id = e.subject_id
        SET
            m.obtained_marks = ?,
            m.remarks = ?
        WHERE m.id = ?
        AND m.teacher_id = ?
        AND ts.teacher_id = ?
        AND ? <= e.max_marks
    `;

    db.query(
        sql,
        [
            obtained_marks,
            remarks === undefined ? null : remarks,
            markId,
            teacherId,
            teacherId,
            obtained_marks
        ],
        (error, result) => {

            if (error) {
                console.error(error);

                return res.status(500).json({
                    success: false,
                    message: 'Unable to update marks.'
                });
            }

            if (result.affectedRows === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Marks record not found, not assigned to you, or marks exceed the maximum.'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Marks updated successfully.'
            });
        }
    );
};


// ==========================================
// TEACHER: DELETE MARKS
// ==========================================

const deleteMarks = (req, res) => {

    const teacherId = req.user.id;
    const markId = Number(req.params.markId);

    if (!Number.isInteger(markId) || markId <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid marks ID.'
        });
    }

    const sql = `
        DELETE m
        FROM marks m
        JOIN exams e ON e.id = m.exam_id
        JOIN teacher_subjects ts ON ts.subject_id = e.subject_id
        WHERE m.id = ?
        AND m.teacher_id = ?
        AND ts.teacher_id = ?
    `;

    db.query(
        sql,
        [markId, teacherId, teacherId],
        (error, result) => {

            if (error) {
                console.error(error);

                return res.status(500).json({
                    success: false,
                    message: 'Unable to delete marks.'
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Marks record not found or not assigned to you.'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Marks deleted successfully.'
            });
        }
    );
};


// ==========================================
// EXPORT CONTROLLERS
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