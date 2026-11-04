const db = require('../config/db');

// Get attendance records of the logged-in student
const getMyAttendance = (req, res) => {


const studentId = req.user.student_id;

if (!studentId) {
    return res.status(400).json({
        success: false,
        message: 'Student information not found.'
    });
}

const sql = `
    SELECT
        a.id,
        a.attendance_date,
        a.status,
        a.remarks,
        s.id AS subject_id,
        s.subject_name,
        s.subject_code
    FROM attendance a
    JOIN subjects s
        ON a.subject_id = s.id
    WHERE a.student_id = ?
    ORDER BY a.attendance_date DESC
`;

db.query(sql, [studentId], (error, results) => {

    if (error) {
        return res.status(500).json({
            success: false,
            message: 'Unable to fetch attendance records.'
        });
    }

    return res.status(200).json({
        success: true,
        message: 'Attendance records fetched successfully.',
        data: results
    });
});


};

// Get subjects assigned to the logged-in teacher
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
    JOIN subjects s
        ON ts.subject_id = s.id
    WHERE ts.teacher_id = ?
    ORDER BY s.subject_name ASC
`;

db.query(sql, [teacherId], (error, results) => {

    if (error) {
        console.error('Teacher subjects error:', error);

        return res.status(500).json({
            success: false,
            message: 'Unable to fetch assigned subjects.'
        });
    }

    return res.status(200).json({
        success: true,
        message: 'Teacher subjects fetched successfully.',
        data: results
    });
});


};

// Get active students for a subject assigned to the logged-in teacher
const getStudentsForAttendance = (req, res) => {


const teacherId = req.user.id;
const subjectId = req.params.subjectId;

if (!/^[1-9]\d*$/.test(subjectId)) {
    return res.status(400).json({
        success: false,
        message: 'Invalid subject ID.'
    });
}

const assignmentSql = `
    SELECT id
    FROM teacher_subjects
    WHERE teacher_id = ? AND subject_id = ?
`;

db.query(assignmentSql, [teacherId, subjectId], (error, assignments) => {

    if (error) {
        console.error('Subject assignment error:', error);

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

    const studentsSql = `
        SELECT
            id,
            name,
            email,
            phone,
            course
        FROM students
        WHERE course = (
            SELECT course
            FROM subjects
            WHERE id = ?
        )
        AND status = 'Active'
        ORDER BY name ASC
    `;

    db.query(studentsSql, [subjectId], (studentError, results) => {

        if (studentError) {
            console.error('Students attendance error:', studentError);

            return res.status(500).json({
                success: false,
                message: 'Unable to fetch students.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Active students fetched successfully.',
            data: results
        });
    });
});


};

// Mark and save attendance for multiple students
const markAttendance = (req, res) => {


const teacherId = req.user.id;

const {
    subject_id,
    attendance_date,
    students
} = req.body;

// Validate subject ID
if (!Number.isInteger(Number(subject_id)) || Number(subject_id) <= 0) {
    return res.status(400).json({
        success: false,
        message: 'Valid subject ID is required.'
    });
}

// Validate attendance date
if (
    typeof attendance_date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(attendance_date) ||
    !Number.isFinite(Date.parse(`${attendance_date}T00:00:00Z`)) ||
    new Date(`${attendance_date}T00:00:00Z`).toISOString().slice(0, 10) !== attendance_date
) {
    return res.status(400).json({
        success: false,
        message: 'Valid attendance date in YYYY-MM-DD format is required.'
    });
}

// Validate students array
if (!Array.isArray(students) || students.length === 0) {
    return res.status(400).json({
        success: false,
        message: 'At least one student attendance record is required.'
    });
}

const validStatuses = ['Present', 'Absent', 'Late'];
const studentIds = new Set();

for (const student of students) {

    if (
        !Number.isInteger(Number(student.student_id)) ||
        Number(student.student_id) <= 0
    ) {
        return res.status(400).json({
            success: false,
            message: 'Every student must have a valid student ID.'
        });
    }

    if (!validStatuses.includes(student.status)) {
        return res.status(400).json({
            success: false,
            message: 'Attendance status must be Present, Absent or Late.'
        });
    }

    const id = Number(student.student_id);

    if (studentIds.has(id)) {
        return res.status(400).json({
            success: false,
            message: 'Duplicate student IDs are not allowed.'
        });
    }

    studentIds.add(id);

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
            message: 'Remarks must be text with a maximum of 255 characters.'
        });
    }
}

// Verify teacher subject assignment
const assignmentSql = `
    SELECT id
    FROM teacher_subjects
    WHERE teacher_id = ? AND subject_id = ?
`;

db.query(
    assignmentSql,
    [teacherId, Number(subject_id)],
    (assignmentError, assignments) => {

        if (assignmentError) {
            console.error('Assignment verification error:', assignmentError);

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

        // Verify all students are active and belong to the subject course
        const studentSql = `
            SELECT id
            FROM students
            WHERE id IN (?)
            AND status = 'Active'
            AND course = (
                SELECT course
                FROM subjects
                WHERE id = ?
            )
        `;

        db.query(
            studentSql,
            [Array.from(studentIds), Number(subject_id)],
            (studentError, validStudents) => {

                if (studentError) {
                    console.error('Student validation error:', studentError);

                    return res.status(500).json({
                        success: false,
                        message: 'Unable to validate students.'
                    });
                }

                if (validStudents.length !== students.length) {
                    return res.status(400).json({
                        success: false,
                        message: 'One or more students are invalid, inactive or not enrolled in this course.'
                    });
                }

                // Start MySQL transaction
                db.getConnection((connectionError, connection) => {

                    if (connectionError) {
                        console.error('Database connection error:', connectionError);

                        return res.status(500).json({
                            success: false,
                            message: 'Unable to connect to database.'
                        });
                    }

                    connection.beginTransaction((transactionError) => {

                        if (transactionError) {
                            connection.release();

                            return res.status(500).json({
                                success: false,
                                message: 'Unable to start attendance transaction.'
                            });
                        }

                        // Insert attendance records
                        const insertSql = `
                            INSERT INTO attendance
                            (
                                student_id,
                                subject_id,
                                teacher_id,
                                attendance_date,
                                status,
                                remarks
                            )
                            VALUES ?
                        `;

                        const values = students.map(student => [
                            Number(student.student_id),
                            Number(subject_id),
                            teacherId,
                            attendance_date,
                            student.status,
                            student.remarks || null
                        ]);

                        connection.query(
                            insertSql,
                            [values],
                            (insertError, result) => {

                                if (insertError) {

                                    return connection.rollback(() => {

                                        connection.release();

                                        if (insertError.code === 'ER_DUP_ENTRY') {
                                            return res.status(409).json({
                                                success: false,
                                                message: 'Attendance has already been recorded for one or more students on this date.'
                                            });
                                        }

                                        console.error('Attendance insert error:', insertError);

                                        return res.status(500).json({
                                            success: false,
                                            message: 'Unable to save attendance.'
                                        });
                                    });
                                }

                                connection.commit((commitError) => {

                                    if (commitError) {

                                        return connection.rollback(() => {

                                            connection.release();

                                            console.error('Attendance commit error:', commitError);

                                            return res.status(500).json({
                                                success: false,
                                                message: 'Unable to complete attendance transaction.'
                                            });
                                        });
                                    }

                                    connection.release();

                                    return res.status(201).json({
                                        success: true,
                                        message: 'Attendance saved successfully.',
                                        subject_id: Number(subject_id),
                                        attendance_date,
                                        total_students: result.affectedRows
                                    });
                                });
                            }
                        );
                    });
                });
            }
        );
    }
);


};
// Get attendance records for a subject assigned to the logged-in teacher
const getTeacherAttendanceRecords = (req, res) => {


const teacherId = req.user.id;
const subjectId = req.params.subjectId;
const attendanceDate = req.query.date;

// Validate subject ID
if (!/^[1-9]\d*$/.test(subjectId)) {
    return res.status(400).json({
        success: false,
        message: 'Invalid subject ID.'
    });
}

// Validate optional attendance date
if (
    attendanceDate !== undefined &&
    (
        typeof attendanceDate !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(attendanceDate) ||
        !Number.isFinite(Date.parse(`${attendanceDate}T00:00:00Z`)) ||
        new Date(`${attendanceDate}T00:00:00Z`).toISOString().slice(0, 10) !== attendanceDate
    )
) {
    return res.status(400).json({
        success: false,
        message: 'Invalid date. Use YYYY-MM-DD format.'
    });
}

// Verify teacher-subject assignment
const assignmentSql = `
    SELECT id
    FROM teacher_subjects
    WHERE teacher_id = ? AND subject_id = ?
`;

db.query(
    assignmentSql,
    [teacherId, subjectId],
    (assignmentError, assignments) => {

        if (assignmentError) {
            console.error('Assignment verification error:', assignmentError);

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

        // Fetch attendance records
        let sql = `
            SELECT
                a.id AS attendance_id,
                a.student_id,
                st.name AS student_name,
                st.email,
                st.phone,
                a.subject_id,
                s.subject_name,
                s.subject_code,
                a.attendance_date,
                a.status,
                a.remarks
            FROM attendance a
            JOIN students st
                ON a.student_id = st.id
            JOIN subjects s
                ON a.subject_id = s.id
            WHERE a.subject_id = ?
        `;

        const values = [subjectId];

        // Apply date filter when provided
        if (attendanceDate) {
            sql += ` AND a.attendance_date = ?`;
            values.push(attendanceDate);
        }

        sql += ` ORDER BY a.attendance_date DESC, st.name ASC`;

        db.query(sql, values, (error, results) => {

            if (error) {
                console.error('Attendance records error:', error);

                return res.status(500).json({
                    success: false,
                    message: 'Unable to fetch attendance records.'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Attendance records fetched successfully.',
                total_records: results.length,
                data: results
            });
        });
    }
);


};

// Edit an existing attendance record
const editAttendance = (req, res) => {


const teacherId = req.user.id;
const attendanceId = req.params.attendanceId;

const { status, remarks } = req.body;

// Validate attendance ID
if (!/^[1-9]\d*$/.test(attendanceId)) {
    return res.status(400).json({
        success: false,
        message: 'Invalid attendance ID.'
    });
}

// Validate attendance status
const validStatuses = ['Present', 'Absent', 'Late'];

if (!validStatuses.includes(status)) {
    return res.status(400).json({
        success: false,
        message: 'Status must be Present, Absent or Late.'
    });
}

// Validate remarks
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
        message: 'Remarks must be text with a maximum of 255 characters.'
    });
}

// Verify that this attendance belongs to a subject assigned to the teacher
const checkSql = `
    SELECT
        a.id,
        a.student_id,
        a.subject_id,
        a.attendance_date
    FROM attendance a
    JOIN teacher_subjects ts
        ON a.subject_id = ts.subject_id
    WHERE a.id = ?
    AND ts.teacher_id = ?
`;

db.query(
    checkSql,
    [attendanceId, teacherId],
    (error, records) => {

        if (error) {
            console.error('Attendance verification error:', error);

            return res.status(500).json({
                success: false,
                message: 'Unable to verify attendance record.'
            });
        }

        if (records.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Attendance record not found or you are not authorized to edit it.'
            });
        }

        // Update attendance
        let updateSql;
        let values;

        if (remarks === undefined) {

            // Preserve existing remarks if not provided
            updateSql = `
                UPDATE attendance
                SET status = ?
                WHERE id = ?
            `;

            values = [status, attendanceId];

        } else {

            // Update remarks; empty string clears existing remarks
            updateSql = `
                UPDATE attendance
                SET status = ?, remarks = ?
                WHERE id = ?
            `;

            values = [
                status,
                remarks === '' || remarks === null ? null : remarks,
                attendanceId
            ];
        }

        db.query(updateSql, values, (updateError) => {

            if (updateError) {
                console.error('Attendance update error:', updateError);

                return res.status(500).json({
                    success: false,
                    message: 'Unable to update attendance.'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Attendance updated successfully.',
                data: {
                    attendance_id: Number(attendanceId),
                    student_id: records[0].student_id,
                    subject_id: records[0].subject_id,
                    attendance_date: records[0].attendance_date,
                    status,
                    remarks: remarks === undefined
                        ? 'Unchanged'
                        : (remarks || null)
                }
            });
        });
    }
);


};

module.exports = {
    getMyAttendance,
    getTeacherSubjects,
    getStudentsForAttendance,
    markAttendance,
    getTeacherAttendanceRecords,
    editAttendance
};