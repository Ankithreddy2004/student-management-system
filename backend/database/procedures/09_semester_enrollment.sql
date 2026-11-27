USE student_management;

DELIMITER $$

-- ==========================================
-- 1. GET AVAILABLE COURSES AND SEMESTERS
-- ==========================================

CREATE PROCEDURE sp_academic_get_options()
BEGIN

    SELECT DISTINCT
        course,
        semester
    FROM subjects
    WHERE semester BETWEEN 1 AND 8
    ORDER BY course, semester;

END $$


-- ==========================================
-- 2. REGISTER STUDENT WITH SEMESTER
-- ==========================================

CREATE PROCEDURE sp_auth_register_student_v2(
    IN p_name VARCHAR(100),
    IN p_email VARCHAR(150),
    IN p_phone VARCHAR(10),
    IN p_course VARCHAR(100),
    IN p_semester INT,
    IN p_password_hash VARCHAR(255)
)
main_block: BEGIN

    DECLARE v_student_id INT;
    DECLARE v_user_id INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    -- Validate semester

    IF p_semester IS NULL
       OR p_semester NOT BETWEEN 1 AND 8 THEN

        SELECT 'invalid_semester' AS outcome;

        LEAVE main_block;

    END IF;

    START TRANSACTION;


    -- Validate available course only.
    -- Students can select any semester from 1 to 8.
    -- Subjects need not exist for the selected semester.

    IF NOT EXISTS (
        SELECT 1
        FROM subjects
        WHERE LOWER(TRIM(course)) =
              LOWER(TRIM(p_course))
        AND semester BETWEEN 1 AND 8
    ) THEN

        ROLLBACK;

        SELECT 'invalid_academic_selection' AS outcome;

        LEAVE main_block;

    END IF;

    -- Check duplicate email

    IF EXISTS (
        SELECT 1
        FROM users
        WHERE LOWER(email) = LOWER(p_email)
    )
    OR EXISTS (
        SELECT 1
        FROM students
        WHERE LOWER(email) = LOWER(p_email)
    ) THEN

        SIGNAL SQLSTATE '23000'
        SET MYSQL_ERRNO = 1062,
            MESSAGE_TEXT = 'Email already registered';

    END IF;

    -- Insert student information

    INSERT INTO students (
        name,
        email,
        phone,
        course,
        semester,
        status
    )
    VALUES (
        p_name,
        p_email,
        p_phone,
        p_course,
        p_semester,
        'Pending'
    );

    SET v_student_id = LAST_INSERT_ID();

    -- Create student login account

    INSERT INTO users (
        name,
        email,
        password,
        role,
        student_id
    )
    VALUES (
        p_name,
        p_email,
        p_password_hash,
        'Student',
        v_student_id
    );

    SET v_user_id = LAST_INSERT_ID();

    COMMIT;

    SELECT
        'success' AS outcome,
        v_student_id AS student_id,
        v_user_id AS user_id,
        p_name AS name,
        p_email AS email,
        p_course AS course,
        p_semester AS semester,
        'Student' AS role,
        'Pending' AS status;

END $$


-- ==========================================
-- 3. ADD STUDENT WITH SEMESTER
-- ==========================================

CREATE PROCEDURE sp_student_add_v2(
    IN p_name VARCHAR(100),
    IN p_email VARCHAR(150),
    IN p_phone VARCHAR(10),
    IN p_course VARCHAR(100),
    IN p_semester INT
)
BEGIN

    IF p_semester IS NULL
       OR p_semester NOT BETWEEN 1 AND 8 THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid semester';

    END IF;

    INSERT INTO students (
        name,
        email,
        phone,
        course,
        semester
    )
    VALUES (
        p_name,
        p_email,
        p_phone,
        p_course,
        p_semester
    );

    SELECT LAST_INSERT_ID() AS studentId;

END $$


-- ==========================================
-- 4. UPDATE STUDENT DETAILS AND SEMESTER
-- ==========================================

CREATE PROCEDURE sp_student_update_v2(
    IN p_id INT,
    IN p_name VARCHAR(100),
    IN p_email VARCHAR(150),
    IN p_phone VARCHAR(10),
    IN p_course VARCHAR(100),
    IN p_semester INT,
    IN p_is_admin TINYINT
)
BEGIN

    DECLARE v_affected INT;

    -- Only Admin can change academic information

    IF p_is_admin = 1 THEN

        IF p_semester IS NULL
           OR p_semester NOT BETWEEN 1 AND 8 THEN

            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Invalid semester';

        END IF;

    END IF;

    UPDATE students
    SET
        name = p_name,
        email = p_email,
        phone = p_phone,

        course = CASE
            WHEN p_is_admin = 1 THEN p_course
            ELSE course
        END,

        semester = CASE
            WHEN p_is_admin = 1 THEN p_semester
            ELSE semester
        END

    WHERE id = p_id;

    SET v_affected = ROW_COUNT();

    SELECT
        v_affected AS affectedRows,

        EXISTS (
            SELECT 1
            FROM students
            WHERE id = p_id
        ) AS student_exists;

END $$


-- ==========================================
-- 5. UPDATE STUDENT PERSONAL PROFILE
-- ==========================================

CREATE PROCEDURE sp_student_update_profile_v2(
    IN p_student_id INT,
    IN p_name VARCHAR(100),
    IN p_phone VARCHAR(10)
)
main_block: BEGIN

    DECLARE v_id INT DEFAULT NULL;
    DECLARE v_status VARCHAR(10);
    DECLARE v_course VARCHAR(100);
    DECLARE v_semester INT;

    DECLARE CONTINUE HANDLER FOR NOT FOUND
        SET v_id = NULL;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SELECT
        id,
        status,
        course,
        semester

    INTO
        v_id,
        v_status,
        v_course,
        v_semester

    FROM students

    WHERE id = p_student_id

    FOR UPDATE;

    IF v_id IS NULL THEN

        ROLLBACK;

        SELECT 'not_found' AS outcome;

        LEAVE main_block;

    END IF;

    IF v_status IS NULL
       OR v_status <> 'Active' THEN

        ROLLBACK;

        SELECT 'inactive' AS outcome;

        LEAVE main_block;

    END IF;

    -- Student cannot change course or semester

    UPDATE students
    SET
        name = p_name,
        phone = p_phone
    WHERE id = p_student_id;

    COMMIT;

    SELECT
        'updated' AS outcome,
        v_course AS course,
        v_semester AS semester;

END $$


-- ==========================================
-- 6. GET SUBJECTS MATCHING STUDENT SEMESTER
-- ==========================================

CREATE PROCEDURE sp_enrollment_get_student_subjects(
    IN p_student_id INT
)
BEGIN

    SELECT
        s.id,
        s.subject_name,
        s.subject_code,
        s.course,
        s.semester

    FROM subjects s

    INNER JOIN students st

        ON LOWER(TRIM(s.course)) =
           LOWER(TRIM(st.course))

        AND s.semester = st.semester

    WHERE st.id = p_student_id

    AND st.semester BETWEEN 1 AND 8

    ORDER BY s.subject_name ASC;

END $$


-- ==========================================
-- 7. CREATE SEMESTER-BASED ENROLLMENT
-- ==========================================

CREATE PROCEDURE sp_enrollment_create_v2(
    IN p_student_id INT,
    IN p_subject_id INT,
    IN p_enrolled_by INT,
    IN p_enrolled_by_role VARCHAR(10)
)
main_block: BEGIN

    DECLARE v_student_id INT DEFAULT NULL;
    DECLARE v_subject_id INT DEFAULT NULL;

    DECLARE v_student_course VARCHAR(100);
    DECLARE v_student_semester INT;

    DECLARE v_subject_course VARCHAR(100);
    DECLARE v_subject_semester INT;

    DECLARE v_assignment_id INT DEFAULT NULL;
    DECLARE v_enrollment_id INT;

    DECLARE v_not_found BOOLEAN DEFAULT FALSE;

    DECLARE CONTINUE HANDLER FOR NOT FOUND
        SET v_not_found = TRUE;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Verify authenticated user identity and role

    IF p_enrolled_by_role IS NULL
       OR p_enrolled_by_role NOT IN (
           'Admin', 'Teacher', 'Student'
       )
       OR NOT EXISTS (
           SELECT 1
           FROM users
           WHERE id = p_enrolled_by
           AND role = p_enrolled_by_role
       ) THEN

        ROLLBACK;

        SELECT 'forbidden' AS outcome;

        LEAVE main_block;

    END IF;

    -- Students can enroll only themselves

    IF p_enrolled_by_role = 'Student'
       AND NOT EXISTS (
           SELECT 1
           FROM users
           WHERE id = p_enrolled_by
           AND student_id = p_student_id
           AND role = 'Student'
       ) THEN

        ROLLBACK;

        SELECT 'forbidden' AS outcome;

        LEAVE main_block;

    END IF;

    -- Retrieve student course and semester

    SELECT
        id,
        course,
        semester

    INTO
        v_student_id,
        v_student_course,
        v_student_semester

    FROM students

    WHERE id = p_student_id

    FOR SHARE;

    IF v_not_found THEN

        ROLLBACK;

        SELECT 'student_not_found' AS outcome;

        LEAVE main_block;

    END IF;

    -- Retrieve subject course and semester

    SET v_not_found = FALSE;

    SELECT
        id,
        course,
        semester

    INTO
        v_subject_id,
        v_subject_course,
        v_subject_semester

    FROM subjects

    WHERE id = p_subject_id

    FOR SHARE;

    IF v_not_found THEN

        ROLLBACK;

        SELECT 'subject_not_found' AS outcome;

        LEAVE main_block;

    END IF;

    -- Check teacher assignment

    IF p_enrolled_by_role = 'Teacher' THEN

        SET v_not_found = FALSE;

        SELECT id
        INTO v_assignment_id
        FROM teacher_subjects
        WHERE teacher_id = p_enrolled_by
        AND subject_id = p_subject_id
        FOR SHARE;

        IF v_not_found THEN

            ROLLBACK;

            SELECT 'forbidden' AS outcome;

            LEAVE main_block;

        END IF;

    END IF;


    -- Check student semester
    -- Must be assigned and within range 1 to 8

    IF v_student_semester IS NULL
       OR v_student_semester NOT BETWEEN 1 AND 8 THEN

        ROLLBACK;

        SELECT 'semester_not_assigned' AS outcome;

        LEAVE main_block;

    END IF;

    -- Check course and semester eligibility

    IF LOWER(TRIM(v_student_course))
       <> LOWER(TRIM(v_subject_course))

       OR v_student_semester <> v_subject_semester

    THEN

        ROLLBACK;

        SELECT 'academic_mismatch' AS outcome;

        LEAVE main_block;

    END IF;

    -- Create pending enrollment request

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

    SET v_enrollment_id = LAST_INSERT_ID();

    COMMIT;

    SELECT
        'success' AS outcome,
        v_enrollment_id AS enrollmentId,
        'Pending' AS status;

END $$

DELIMITER ;