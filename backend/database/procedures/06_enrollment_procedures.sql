USE student_management;

DELIMITER $$

-- ==========================================
-- 1. GET AVAILABLE SUBJECTS
-- ==========================================

CREATE PROCEDURE sp_enrollment_get_subjects(
    IN p_teacher_id INT
)
BEGIN

    SELECT
        s.id,
        s.subject_name,
        s.subject_code,
        s.course,
        s.semester

    FROM subjects s

    WHERE (
        p_teacher_id IS NULL

        OR EXISTS (
            SELECT 1
            FROM teacher_subjects ts
            WHERE ts.subject_id = s.id
            AND ts.teacher_id = p_teacher_id
        )
    )

    ORDER BY s.course, s.semester, s.subject_name;

END $$


-- ==========================================
-- 2. CREATE ENROLLMENT REQUEST
-- ==========================================

CREATE PROCEDURE sp_enrollment_create(
    IN p_student_id INT,
    IN p_subject_id INT,
    IN p_enrolled_by INT,
    IN p_enrolled_by_role VARCHAR(10)
)
main_block: BEGIN

    DECLARE v_enrollment_id INT;
    DECLARE v_assignment_id INT DEFAULT NULL;

    DECLARE CONTINUE HANDLER FOR NOT FOUND
        SET v_assignment_id = NULL;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;


    -- Validate role

    IF p_enrolled_by_role IS NULL
       OR p_enrolled_by_role NOT IN (
           'Student', 'Teacher', 'Admin'
       ) THEN

        SELECT 'forbidden' AS outcome;

        LEAVE main_block;

    END IF;


    -- Start transaction

    START TRANSACTION;


    -- Verify student exists

    IF NOT EXISTS (
        SELECT 1
        FROM students
        WHERE id = p_student_id
    ) THEN

        ROLLBACK;

        SELECT 'student_not_found' AS outcome;

        LEAVE main_block;

    END IF;


    -- Verify subject exists

    IF NOT EXISTS (
        SELECT 1
        FROM subjects
        WHERE id = p_subject_id
    ) THEN

        ROLLBACK;

        SELECT 'subject_not_found' AS outcome;

        LEAVE main_block;

    END IF;


    -- Verify teacher assignment

    IF p_enrolled_by_role = 'Teacher' THEN

        SELECT id
        INTO v_assignment_id

        FROM teacher_subjects

        WHERE teacher_id = p_enrolled_by
        AND subject_id = p_subject_id

        FOR SHARE;

        IF v_assignment_id IS NULL THEN

            ROLLBACK;

            SELECT 'forbidden' AS outcome;

            LEAVE main_block;

        END IF;

    END IF;


    -- Insert enrollment request

    INSERT INTO student_subjects (
        student_id,
        subject_id,
        status,
        enrolled_by,
        enrolled_by_role
    )
    VALUES (
        p_student_id,
        p_subject_id,
        'Pending',
        p_enrolled_by,
        p_enrolled_by_role
    );


    -- Retrieve generated enrollment ID

    SET v_enrollment_id = LAST_INSERT_ID();


    -- Save transaction

    COMMIT;


    -- Return result

    SELECT
        'success' AS outcome,
        v_enrollment_id AS enrollmentId,
        'Pending' AS status;

END $$


-- ==========================================
-- 3. GET STUDENT'S OWN ENROLLMENTS
-- ==========================================

CREATE PROCEDURE sp_enrollment_get_my(
    IN p_student_id INT
)
BEGIN

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

    WHERE ss.student_id = p_student_id

    ORDER BY ss.enrollment_date DESC;

END $$


-- ==========================================
-- 4. GET ALL ENROLLMENTS WITH FILTERS
-- ==========================================

CREATE PROCEDURE sp_enrollment_get_all(
    IN p_teacher_id INT,
    IN p_status VARCHAR(8),
    IN p_subject_id INT,
    IN p_student_id INT
)
BEGIN

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

    WHERE

        -- Teacher subject restriction

        (
            p_teacher_id IS NULL

            OR EXISTS (
                SELECT 1
                FROM teacher_subjects ts
                WHERE ts.subject_id = ss.subject_id
                AND ts.teacher_id = p_teacher_id
            )
        )


        -- Optional status filter

        AND (
            p_status IS NULL

            OR (
                p_status = 'Pending'
                AND ss.status = 'Pending'
            )

            OR (
                p_status = 'Approved'
                AND ss.status = 'Approved'
            )

            OR (
                p_status = 'Rejected'
                AND ss.status = 'Rejected'
            )
        )


        -- Optional subject filter

        AND (
            p_subject_id IS NULL
            OR ss.subject_id = p_subject_id
        )


        -- Optional student filter

        AND (
            p_student_id IS NULL
            OR ss.student_id = p_student_id
        )

    ORDER BY ss.enrollment_date DESC;

END $$


-- ==========================================
-- 5. APPROVE OR REJECT ENROLLMENT
-- ==========================================

CREATE PROCEDURE sp_enrollment_review(
    IN p_enrollment_id INT,
    IN p_reviewer_id INT,
    IN p_reviewer_role VARCHAR(10),
    IN p_new_status VARCHAR(8)
)
main_block: BEGIN

    DECLARE v_subject_id INT;
    DECLARE v_current_status VARCHAR(8);
    DECLARE v_assignment_id INT;
    DECLARE v_not_found BOOLEAN DEFAULT FALSE;

    DECLARE CONTINUE HANDLER FOR NOT FOUND
        SET v_not_found = TRUE;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;


    -- Validate reviewer role

    IF p_reviewer_role IS NULL
       OR p_reviewer_role NOT IN (
           'Admin', 'Teacher'
       ) THEN

        SELECT 'forbidden' AS outcome;

        LEAVE main_block;

    END IF;


    -- Validate new enrollment status

    IF p_new_status IS NULL
       OR p_new_status NOT IN (
           'Approved', 'Rejected'
       ) THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
            'Invalid enrollment review status';

    END IF;


    -- Start transaction

    START TRANSACTION;


    -- Retrieve and lock enrollment record

    SELECT
        subject_id,
        status

    INTO
        v_subject_id,
        v_current_status

    FROM student_subjects

    WHERE id = p_enrollment_id

    FOR UPDATE;


    -- Enrollment does not exist

    IF v_not_found THEN

        ROLLBACK;

        SELECT 'not_found' AS outcome;

        LEAVE main_block;

    END IF;


    -- Teacher can review assigned subjects only

    IF p_reviewer_role = 'Teacher' THEN

        SET v_not_found = FALSE;

        SELECT id

        INTO v_assignment_id

        FROM teacher_subjects

        WHERE teacher_id = p_reviewer_id
        AND subject_id = v_subject_id

        FOR SHARE;

        IF v_not_found THEN

            ROLLBACK;

            SELECT 'forbidden' AS outcome;

            LEAVE main_block;

        END IF;

    END IF;


    -- Only Pending requests can be reviewed

    IF v_current_status <> 'Pending' THEN

        ROLLBACK;

        SELECT
            'already_reviewed' AS outcome,
            v_current_status AS current_status;

        LEAVE main_block;

    END IF;


    -- Update enrollment status

    UPDATE student_subjects

    SET
        status = p_new_status,
        approved_by = p_reviewer_id

    WHERE id = p_enrollment_id
    AND status = 'Pending';


    -- Protect against repeated reviews

    IF ROW_COUNT() = 0 THEN

        ROLLBACK;

        SELECT
            'already_reviewed' AS outcome,
            v_current_status AS current_status;

        LEAVE main_block;

    END IF;


    -- Save changes

    COMMIT;


    -- Return result

    SELECT
        'success' AS outcome,
        p_enrollment_id AS enrollment_id,
        p_new_status AS status;

END $$


-- ==========================================
-- 6. GET ENROLLMENTS FOR ONE STUDENT
-- ==========================================

CREATE PROCEDURE sp_enrollment_get_student(
    IN p_student_id INT,
    IN p_teacher_id INT
)
BEGIN

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

    WHERE ss.student_id = p_student_id

    AND (
        p_teacher_id IS NULL

        OR EXISTS (
            SELECT 1
            FROM teacher_subjects ts
            WHERE ts.subject_id = ss.subject_id
            AND ts.teacher_id = p_teacher_id
        )
    )

    ORDER BY ss.enrollment_date DESC;

END $$

DELIMITER ;