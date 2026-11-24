const db = require('../config/db');

// ============================================
// HELPER: VALIDATE POSITIVE INTEGER
// ============================================

const isValidId = (id) => {
  return Number.isInteger(Number(id)) && Number(id) > 0;
};


// ============================================
// 1. GET AVAILABLE SUBJECTS
// ============================================

const getAvailableSubjects = (req, res) => {

  let sql = `
    SELECT
      s.id,
      s.subject_name,
      s.subject_code,
      s.course,
      s.semester
    FROM subjects s
  `;

  const params = [];

  // Teachers can only see their assigned subjects.
  if (req.user.role === 'Teacher') {

    sql += `
      INNER JOIN teacher_subjects ts
        ON ts.subject_id = s.id
       AND ts.teacher_id = ?
    `;

    params.push(req.user.id);
  }

  sql += `
    ORDER BY s.course, s.semester, s.subject_name
  `;

  db.query(sql, params, (error, results) => {

    if (error) {
      console.error('Get available subjects error:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to fetch available subjects.'
      });
    }

    return res.status(200).json({
      success: true,
      subjects: results
    });

  });

};


// ============================================
// 2. ENROLL STUDENT INTO SUBJECT
// ============================================

const enrollStudent = (req, res) => {

  const { subjectId } = req.body;

  let studentId;

  // Student can enroll only themselves.
  if (req.user.role === 'Student') {

    studentId = req.user.student_id;

  } else {

    studentId = req.body.studentId;

  }

  if (!isValidId(studentId)) {
    return res.status(400).json({
      success: false,
      message: 'Valid student ID is required.'
    });
  }

  if (!isValidId(subjectId)) {
    return res.status(400).json({
      success: false,
      message: 'Valid subject ID is required.'
    });
  }

  studentId = Number(studentId);
  const subjectIdNumber = Number(subjectId);

  // Check whether student exists.
  db.query(
    'SELECT id FROM students WHERE id = ?',
    [studentId],
    (studentError, studentResults) => {

      if (studentError) {
        console.error('Student validation error:', studentError);

        return res.status(500).json({
          success: false,
          message: 'Failed to validate student.'
        });
      }

      if (studentResults.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Student not found.'
        });
      }

      // Check whether subject exists.
      db.query(
        'SELECT id FROM subjects WHERE id = ?',
        [subjectIdNumber],
        (subjectError, subjectResults) => {

          if (subjectError) {
            console.error('Subject validation error:', subjectError);

            return res.status(500).json({
              success: false,
              message: 'Failed to validate subject.'
            });
          }

          if (subjectResults.length === 0) {
            return res.status(404).json({
              success: false,
              message: 'Subject not found.'
            });
          }

          // Teachers can enroll students only into their assigned subjects.
          if (req.user.role === 'Teacher') {

            db.query(
              `
                SELECT id
                FROM teacher_subjects
                WHERE teacher_id = ?
                  AND subject_id = ?
              `,
              [req.user.id, subjectIdNumber],
              (assignmentError, assignmentResults) => {

                if (assignmentError) {
                  console.error(
                    'Teacher assignment validation error:',
                    assignmentError
                  );

                  return res.status(500).json({
                    success: false,
                    message: 'Failed to verify teacher assignment.'
                  });
                }

                if (assignmentResults.length === 0) {
                  return res.status(403).json({
                    success: false,
                    message: 'You can enroll students only in your assigned subjects.'
                  });
                }

                insertEnrollment(
                  req,
                  res,
                  studentId,
                  subjectIdNumber
                );

              }
            );

          } else {

            insertEnrollment(
              req,
              res,
              studentId,
              subjectIdNumber
            );

          }

        }
      );

    }
  );

};


// ============================================
// HELPER: INSERT ENROLLMENT
// ============================================

const insertEnrollment = (
  req,
  res,
  studentId,
  subjectId
) => {

  const enrolledBy = req.user.id;
  const enrolledByRole = req.user.role;

  const sql = `
    INSERT INTO student_subjects (
      student_id,
      subject_id,
      status,
      enrolled_by,
      enrolled_by_role
    )
    VALUES (?, ?, 'Pending', ?, ?)
  `;

  db.query(
    sql,
    [
      studentId,
      subjectId,
      enrolledBy,
      enrolledByRole
    ],
    (error, result) => {

      if (error) {

        // The unique index prevents duplicate enrollment.
        if (error.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({
            success: false,
            message: 'This student has already requested or enrolled in this subject.'
          });
        }

        console.error('Insert enrollment error:', error);

        return res.status(500).json({
          success: false,
          message: 'Failed to create enrollment request.'
        });

      }

      return res.status(201).json({
        success: true,
        message: 'Enrollment request submitted successfully. Waiting for approval.',
        enrollmentId: result.insertId,
        status: 'Pending'
      });

    }
  );

};


// ============================================
// 3. GET MY ENROLLMENTS (STUDENT)
// ============================================

const getMyEnrollments = (req, res) => {

  const studentId = req.user.student_id;

  if (!isValidId(studentId)) {
    return res.status(400).json({
      success: false,
      message: 'Student account is not linked to a valid student record.'
    });
  }

  const sql = `
    SELECT
      ss.id AS enrollment_id,
      ss.student_id,
      ss.subject_id,
      ss.status,
      ss.enrolled_by,
      ss.enrolled_by_role,
      ss.approved_by,
      ss.enrollment_date,
      ss.updated_at,

      s.subject_name,
      s.subject_code,
      s.course,
      s.semester,

      reviewer.name AS reviewer_name

    FROM student_subjects ss

    INNER JOIN subjects s
      ON s.id = ss.subject_id

    LEFT JOIN users reviewer
      ON reviewer.id = ss.approved_by

    WHERE ss.student_id = ?

    ORDER BY ss.enrollment_date DESC
  `;

  db.query(sql, [studentId], (error, results) => {

    if (error) {
      console.error('Get my enrollments error:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to fetch your enrollments.'
      });
    }

    return res.status(200).json({
      success: true,
      enrollments: results
    });

  });

};


// ============================================
// 4. GET ALL ENROLLMENTS
// ADMIN: ALL ENROLLMENTS
// TEACHER: ASSIGNED SUBJECTS ONLY
// ============================================

const getAllEnrollments = (req, res) => {

  let sql = `
    SELECT
      ss.id AS enrollment_id,
      ss.student_id,
      ss.subject_id,
      ss.status,
      ss.enrolled_by,
      ss.enrolled_by_role,
      ss.approved_by,
      ss.enrollment_date,
      ss.updated_at,

      st.name AS student_name,
      st.email AS student_email,
      st.phone AS student_phone,
      st.course AS student_course,

      s.subject_name,
      s.subject_code,
      s.course AS subject_course,
      s.semester,

      enroller.name AS enrolled_by_name,
      reviewer.name AS reviewer_name

    FROM student_subjects ss

    INNER JOIN students st
      ON st.id = ss.student_id

    INNER JOIN subjects s
      ON s.id = ss.subject_id

    LEFT JOIN users enroller
      ON enroller.id = ss.enrolled_by

    LEFT JOIN users reviewer
      ON reviewer.id = ss.approved_by

    WHERE 1 = 1
  `;

  const params = [];

  // Teacher sees only enrollments for assigned subjects.
  if (req.user.role === 'Teacher') {

    sql += `
      AND EXISTS (
        SELECT 1
        FROM teacher_subjects ts
        WHERE ts.subject_id = ss.subject_id
          AND ts.teacher_id = ?
      )
    `;

    params.push(req.user.id);

  }

  // Optional status filter.
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

    sql += ` AND ss.status = ? `;
    params.push(req.query.status);

  }

  // Optional subject filter.
  if (req.query.subjectId) {

    if (!isValidId(req.query.subjectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subject ID.'
      });
    }

    sql += ` AND ss.subject_id = ? `;
    params.push(Number(req.query.subjectId));

  }

  // Optional student filter.
  if (req.query.studentId) {

    if (!isValidId(req.query.studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID.'
      });
    }

    sql += ` AND ss.student_id = ? `;
    params.push(Number(req.query.studentId));

  }

  sql += ` ORDER BY ss.enrollment_date DESC `;

  db.query(sql, params, (error, results) => {

    if (error) {
      console.error('Get all enrollments error:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to fetch enrollment requests.'
      });
    }

    return res.status(200).json({
      success: true,
      enrollments: results
    });

  });

};


// ============================================
// 5. APPROVE / REJECT ENROLLMENT
// ============================================

const reviewEnrollment = (req, res, newStatus) => {

  const enrollmentId = req.params.id;

  if (!isValidId(enrollmentId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid enrollment ID.'
    });
  }

  // Find enrollment.
  db.query(
    `
      SELECT
        id,
        student_id,
        subject_id,
        status
      FROM student_subjects
      WHERE id = ?
    `,
    [Number(enrollmentId)],
    (error, results) => {

      if (error) {
        console.error('Find enrollment error:', error);

        return res.status(500).json({
          success: false,
          message: 'Failed to find enrollment.'
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Enrollment request not found.'
        });
      }

      const enrollment = results[0];

      // Only pending requests can be reviewed.
      if (enrollment.status !== 'Pending') {
        return res.status(409).json({
          success: false,
          message: `This enrollment has already been ${enrollment.status.toLowerCase()}.`
        });
      }

      // Teacher can review only assigned subjects.
      if (req.user.role === 'Teacher') {

        db.query(
          `
            SELECT id
            FROM teacher_subjects
            WHERE teacher_id = ?
              AND subject_id = ?
          `,
          [
            req.user.id,
            enrollment.subject_id
          ],
          (assignmentError, assignmentResults) => {

            if (assignmentError) {
              console.error(
                'Review assignment validation error:',
                assignmentError
              );

              return res.status(500).json({
                success: false,
                message: 'Failed to verify teacher assignment.'
              });
            }

            if (assignmentResults.length === 0) {
              return res.status(403).json({
                success: false,
                message: 'You can review enrollments only for your assigned subjects.'
              });
            }

            updateEnrollmentStatus(
              req,
              res,
              enrollmentId,
              newStatus
            );

          }
        );

      } else {

        updateEnrollmentStatus(
          req,
          res,
          enrollmentId,
          newStatus
        );

      }

    }
  );

};


// ============================================
// HELPER: UPDATE ENROLLMENT STATUS
// ============================================

const updateEnrollmentStatus = (
  req,
  res,
  enrollmentId,
  newStatus
) => {

  const sql = `
    UPDATE student_subjects
    SET
      status = ?,
      approved_by = ?
    WHERE id = ?
      AND status = 'Pending'
  `;

  db.query(
    sql,
    [
      newStatus,
      req.user.id,
      Number(enrollmentId)
    ],
    (error, result) => {

      if (error) {
        console.error('Update enrollment status error:', error);

        return res.status(500).json({
          success: false,
          message: 'Failed to update enrollment status.'
        });
      }

      // Protect against simultaneous review requests.
      if (result.affectedRows === 0) {
        return res.status(409).json({
          success: false,
          message: 'This enrollment request has already been reviewed.'
        });
      }

      return res.status(200).json({
        success: true,
        message: `Enrollment ${newStatus.toLowerCase()} successfully.`,
        status: newStatus
      });

    }
  );

};


// ============================================
// 6. APPROVE ENROLLMENT
// ============================================

const approveEnrollment = (req, res) => {

  reviewEnrollment(req, res, 'Approved');

};


// ============================================
// 7. REJECT ENROLLMENT
// ============================================

const rejectEnrollment = (req, res) => {

  reviewEnrollment(req, res, 'Rejected');

};


// ============================================
// 8. GET ENROLLMENTS FOR ONE STUDENT
// ADMIN: ALL SUBJECTS
// TEACHER: ASSIGNED SUBJECTS ONLY
// ============================================

const getStudentEnrollments = (req, res) => {

  const studentId = req.params.studentId;

  if (!isValidId(studentId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid student ID.'
    });
  }

  let sql = `
    SELECT
      ss.id AS enrollment_id,
      ss.student_id,
      ss.subject_id,
      ss.status,
      ss.enrolled_by,
      ss.enrolled_by_role,
      ss.approved_by,
      ss.enrollment_date,
      ss.updated_at,

      st.name AS student_name,

      s.subject_name,
      s.subject_code,
      s.course,
      s.semester,

      reviewer.name AS reviewer_name

    FROM student_subjects ss

    INNER JOIN students st
      ON st.id = ss.student_id

    INNER JOIN subjects s
      ON s.id = ss.subject_id

    LEFT JOIN users reviewer
      ON reviewer.id = ss.approved_by

    WHERE ss.student_id = ?
  `;

  const params = [Number(studentId)];

  if (req.user.role === 'Teacher') {

    sql += `
      AND EXISTS (
        SELECT 1
        FROM teacher_subjects ts
        WHERE ts.subject_id = ss.subject_id
          AND ts.teacher_id = ?
      )
    `;

    params.push(req.user.id);

  }

  sql += ` ORDER BY ss.enrollment_date DESC `;

  db.query(sql, params, (error, results) => {

    if (error) {
      console.error('Get student enrollments error:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to fetch student enrollments.'
      });
    }

    return res.status(200).json({
      success: true,
      enrollments: results
    });

  });

};


// ============================================
// EXPORT CONTROLLERS
// ============================================

module.exports = {
  getAvailableSubjects,
  enrollStudent,
  getMyEnrollments,
  getAllEnrollments,
  approveEnrollment,
  rejectEnrollment,
  getStudentEnrollments
};