USE student_management;

DELIMITER $$

-- ==========================================
-- 1. GET STUDENT'S OWN MARKS
-- ==========================================

CREATE PROCEDURE sp_marks_get_my(
    IN p_student_id INT
)
BEGIN

    SELECT
        m.id,
        m.obtained_marks,
        m.remarks,
        e.id AS exam_id,
        e.exam_name,
        e.exam_type,
        DATE_FORMAT(
            e.exam_date, '%Y-%m-%d'
        ) AS exam_date,
        e.max_marks,
        s.id AS subject_id,
        s.subject_name,
        s.subject_code

    FROM marks m

    JOIN exams e
        ON m.exam_id = e.id

    JOIN subjects s
        ON e.subject_id = s.id

    WHERE m.student_id = p_student_id

    ORDER BY e.exam_date DESC;

END $$


-- ==========================================
-- 2. GET TEACHER'S ASSIGNED SUBJECTS
-- ==========================================

CREATE PROCEDURE sp_marks_get_teacher_subjects(
    IN p_teacher_id INT
)
BEGIN

    SELECT
        s.id,
        s.subject_name,
        s.subject_code,
        s.course,
        s.semester

    FROM teacher_subjects ts

    JOIN subjects s
        ON ts.subject_id = s.id

    WHERE ts.teacher_id = p_teacher_id

    ORDER BY s.subject_name;

END $$


-- ==========================================
-- 3. GET STUDENTS ELIGIBLE FOR MARKS
-- ==========================================

CREATE PROCEDURE sp_marks_get_students(
    IN p_teacher_id INT,
    IN p_subject_id INT
)
main_block: BEGIN

    IF NOT EXISTS (
        SELECT 1
        FROM teacher_subjects
        WHERE teacher_id = p_teacher_id
        AND subject_id = p_subject_id
    ) THEN

        SELECT 'forbidden' AS outcome;

        LEAVE main_block;

    END IF;


    SELECT 'success' AS outcome;


    SELECT
        st.id,
        st.name,
        st.email,
        st.phone,
        st.course

    FROM students st

    JOIN student_subjects ss
        ON ss.student_id = st.id

    JOIN teacher_subjects ts
        ON ts.subject_id = ss.subject_id
        AND ts.teacher_id = p_teacher_id

    WHERE ss.subject_id = p_subject_id
    AND ss.status = 'Approved'
    AND st.status = 'Active'

    ORDER BY st.name;

END $$


-- ==========================================
-- 4. GET EXAMINATIONS BY SUBJECT
-- ==========================================

CREATE PROCEDURE sp_marks_get_exams(
    IN p_teacher_id INT,
    IN p_subject_id INT
)
BEGIN

    SELECT
        e.id,
        e.subject_id,
        e.exam_name,
        e.exam_type,
        DATE_FORMAT(
            e.exam_date, '%Y-%m-%d'
        ) AS exam_date,
        e.max_marks,
        e.created_at

    FROM exams e

    JOIN teacher_subjects ts
        ON ts.subject_id = e.subject_id

    WHERE ts.teacher_id = p_teacher_id
    AND e.subject_id = p_subject_id

    ORDER BY e.exam_date DESC, e.id DESC;

END $$


-- ==========================================
-- 5. CREATE EXAMINATION
-- ==========================================

CREATE PROCEDURE sp_marks_create_exam(
    IN p_teacher_id INT,
    IN p_subject_id INT,
    IN p_exam_name VARCHAR(100),
    IN p_exam_type VARCHAR(20),
    IN p_exam_date DATE,
    IN p_max_marks DECIMAL(6,2)
)
main_block: BEGIN

    -- Validate examination details

    IF p_max_marks IS NULL
       OR p_max_marks <= 0
       OR p_exam_type IS NULL
       OR p_exam_type NOT IN (
           'Internal',
           'Midterm',
           'Final',
           'Practical',
           'Assignment'
       )
       OR p_exam_name IS NULL
       OR TRIM(p_exam_name) = '' THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
            'Invalid examination details';

    END IF;


    -- Insert only for an assigned subject

    INSERT INTO exams (
        subject_id,
        exam_name,
        exam_type,
        exam_date,
        max_marks
    )

    SELECT
        ts.subject_id,
        p_exam_name,
        p_exam_type,
        p_exam_date,
        p_max_marks

    FROM teacher_subjects ts

    WHERE ts.teacher_id = p_teacher_id
    AND ts.subject_id = p_subject_id;


    IF ROW_COUNT() = 0 THEN

        SELECT 'forbidden' AS outcome;

        LEAVE main_block;

    END IF;


    SELECT
        'success' AS outcome,
        LAST_INSERT_ID() AS exam_id;

END $$


-- ==========================================
-- 6. UPDATE EXAMINATION
-- ==========================================

CREATE PROCEDURE sp_marks_update_exam(
    IN p_teacher_id INT,
    IN p_exam_id INT,
    IN p_exam_name VARCHAR(100),
    IN p_exam_type VARCHAR(20),
    IN p_exam_date DATE,
    IN p_max_marks DECIMAL(6,2)
)
main_block: BEGIN

    DECLARE v_exam_id INT DEFAULT NULL;
    DECLARE v_highest_marks DECIMAL(6,2);

    DECLARE CONTINUE HANDLER FOR NOT FOUND
        SET v_exam_id = NULL;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;


    IF p_max_marks IS NULL
       OR p_max_marks <= 0
       OR p_exam_type IS NULL
       OR p_exam_type NOT IN (
           'Internal',
           'Midterm',
           'Final',
           'Practical',
           'Assignment'
       )
       OR p_exam_name IS NULL
       OR TRIM(p_exam_name) = '' THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
            'Invalid examination details';

    END IF;


    START TRANSACTION;


    -- Verify authorization and lock examination

    SELECT e.id
    INTO v_exam_id

    FROM exams e

    JOIN teacher_subjects ts
        ON ts.subject_id = e.subject_id

    WHERE e.id = p_exam_id
    AND ts.teacher_id = p_teacher_id

    FOR UPDATE;


    IF v_exam_id IS NULL THEN

        ROLLBACK;

        SELECT 'not_found' AS outcome;

        LEAVE main_block;

    END IF;


    -- Find highest marks already awarded

    SELECT COALESCE(MAX(obtained_marks), 0)

    INTO v_highest_marks

    FROM marks

    WHERE exam_id = p_exam_id;


    -- Prevent invalid maximum marks

    IF p_max_marks < v_highest_marks THEN

        ROLLBACK;

        SELECT
            'invalid_max_marks' AS outcome,
            v_highest_marks AS highest_marks;

        LEAVE main_block;

    END IF;


    UPDATE exams

    SET
        exam_name = p_exam_name,
        exam_type = p_exam_type,
        exam_date = p_exam_date,
        max_marks = p_max_marks

    WHERE id = p_exam_id;


    COMMIT;


    SELECT 'success' AS outcome;

END $$


-- ==========================================
-- 7. DELETE EXAMINATION
-- ==========================================

CREATE PROCEDURE sp_marks_delete_exam(
    IN p_teacher_id INT,
    IN p_exam_id INT
)
main_block: BEGIN

    DECLARE v_exam_id INT DEFAULT NULL;

    DECLARE CONTINUE HANDLER FOR NOT FOUND
        SET v_exam_id = NULL;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;


    START TRANSACTION;


    -- Verify examination belongs to assigned subject

    SELECT e.id
    INTO v_exam_id

    FROM exams e

    JOIN teacher_subjects ts
        ON ts.subject_id = e.subject_id

    WHERE e.id = p_exam_id
    AND ts.teacher_id = p_teacher_id

    FOR UPDATE;


    IF v_exam_id IS NULL THEN

        ROLLBACK;

        SELECT 'not_found' AS outcome;

        LEAVE main_block;

    END IF;


    -- Prevent deletion when marks exist

    IF EXISTS (
        SELECT 1
        FROM marks
        WHERE exam_id = p_exam_id
    ) THEN

        ROLLBACK;

        SELECT 'has_marks' AS outcome;

        LEAVE main_block;

    END IF;


    DELETE FROM exams
    WHERE id = p_exam_id;


    COMMIT;


    SELECT 'success' AS outcome;

END $$


-- ==========================================
-- 8. ADD MARKS FOR MULTIPLE STUDENTS
-- ==========================================

CREATE PROCEDURE sp_marks_add_bulk(
    IN p_teacher_id INT,
    IN p_exam_id INT,
    IN p_students JSON
)
main_block: BEGIN

    DECLARE v_subject_id INT DEFAULT NULL;
    DECLARE v_max_marks DECIMAL(6,2);
    DECLARE v_total_students INT DEFAULT 0;
    DECLARE v_valid_students INT DEFAULT 0;
    DECLARE v_inserted_students INT DEFAULT 0;
    DECLARE v_invalid_student_id INT DEFAULT NULL;

    DECLARE CONTINUE HANDLER FOR NOT FOUND
        SET v_subject_id = NULL;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;


    -- Validate JSON array

    IF p_students IS NULL
       OR JSON_TYPE(p_students) <> 'ARRAY'
       OR JSON_LENGTH(p_students) = 0 THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
            'Students must be a nonempty array';

    END IF;


    SET v_total_students = JSON_LENGTH(p_students);


    START TRANSACTION;


    -- Verify teacher assignment
    -- Lock examination to protect maximum marks

    SELECT
        e.subject_id,
        e.max_marks

    INTO
        v_subject_id,
        v_max_marks

    FROM exams e

    JOIN teacher_subjects ts
        ON ts.subject_id = e.subject_id

    WHERE e.id = p_exam_id
    AND ts.teacher_id = p_teacher_id

    FOR UPDATE;


    IF v_subject_id IS NULL THEN

        ROLLBACK;

        SELECT 'forbidden' AS outcome;

        LEAVE main_block;

    END IF;


    -- Verify Active students with Approved enrollment

    SELECT COUNT(DISTINCT st.id)

    INTO v_valid_students

    FROM JSON_TABLE(
        p_students,
        '$[*]' COLUMNS (

            student_id INT PATH '$.student_id'
                ERROR ON EMPTY
                ERROR ON ERROR

        )
    ) AS jt

    JOIN students st
        ON st.id = jt.student_id

    JOIN student_subjects ss
        ON ss.student_id = st.id

    WHERE ss.subject_id = v_subject_id
    AND ss.status = 'Approved'
    AND st.status = 'Active';


    IF v_valid_students <> v_total_students THEN

        ROLLBACK;

        SELECT 'invalid_students' AS outcome;

        LEAVE main_block;

    END IF;


    -- Validate obtained marks against exam maximum

    SELECT MIN(jt.student_id)

    INTO v_invalid_student_id

    FROM JSON_TABLE(
        p_students,
        '$[*]' COLUMNS (

            student_id INT PATH '$.student_id'
                ERROR ON EMPTY
                ERROR ON ERROR,

            obtained_marks DECIMAL(6,2)
                PATH '$.obtained_marks'
                ERROR ON EMPTY
                ERROR ON ERROR

        )
    ) AS jt

    WHERE jt.obtained_marks IS NULL
    OR jt.obtained_marks < 0
    OR jt.obtained_marks > v_max_marks;


    IF v_invalid_student_id IS NOT NULL THEN

        ROLLBACK;

        SELECT
            'invalid_marks' AS outcome,
            v_invalid_student_id AS student_id,
            v_max_marks AS max_marks;

        LEAVE main_block;

    END IF;


    -- Insert all marks together

    INSERT INTO marks (
        student_id,
        exam_id,
        teacher_id,
        obtained_marks,
        remarks
    )

    SELECT
        jt.student_id,
        p_exam_id,
        p_teacher_id,
        jt.obtained_marks,
        jt.remarks

    FROM JSON_TABLE(
        p_students,
        '$[*]' COLUMNS (

            student_id INT PATH '$.student_id'
                ERROR ON EMPTY
                ERROR ON ERROR,

            obtained_marks DECIMAL(6,2)
                PATH '$.obtained_marks'
                ERROR ON EMPTY
                ERROR ON ERROR,

            remarks VARCHAR(255)
                PATH '$.remarks'
                NULL ON EMPTY
                ERROR ON ERROR

        )
    ) AS jt

    JOIN students st
        ON st.id = jt.student_id

    JOIN student_subjects ss
        ON ss.student_id = st.id

    WHERE ss.subject_id = v_subject_id
    AND ss.status = 'Approved'
    AND st.status = 'Active';


    SET v_inserted_students = ROW_COUNT();


    -- Verify the complete batch was inserted

    IF v_inserted_students <> v_total_students THEN

        ROLLBACK;

        SELECT 'invalid_students' AS outcome;

        LEAVE main_block;

    END IF;


    COMMIT;


    SELECT
        'success' AS outcome,
        v_inserted_students AS total_students;

END $$


-- ==========================================
-- 9. GET MARKS RECORDS BY EXAMINATION
-- ==========================================

CREATE PROCEDURE sp_marks_get_records(
    IN p_teacher_id INT,
    IN p_exam_id INT
)
BEGIN

    SELECT
        m.id AS mark_id,
        m.student_id,
        st.name AS student_name,
        st.email,
        e.id AS exam_id,
        e.exam_name,
        e.exam_type,

        DATE_FORMAT(
            e.exam_date, '%Y-%m-%d'
        ) AS exam_date,

        e.max_marks,
        m.obtained_marks,
        m.remarks,
        s.id AS subject_id,
        s.subject_name,
        s.subject_code

    FROM marks m

    JOIN students st
        ON st.id = m.student_id

    JOIN exams e
        ON e.id = m.exam_id

    JOIN subjects s
        ON s.id = e.subject_id

    JOIN teacher_subjects ts
        ON ts.subject_id = e.subject_id

    WHERE e.id = p_exam_id
    AND ts.teacher_id = p_teacher_id

    ORDER BY st.name;

END $$


-- ==========================================
-- 10. EDIT INDIVIDUAL MARKS
-- ==========================================

CREATE PROCEDURE sp_marks_edit(
    IN p_teacher_id INT,
    IN p_mark_id INT,
    IN p_obtained_marks DECIMAL(6,2),
    IN p_remarks VARCHAR(255)
)
main_block: BEGIN

    DECLARE v_mark_id INT DEFAULT NULL;
    DECLARE v_max_marks DECIMAL(6,2);

    DECLARE CONTINUE HANDLER FOR NOT FOUND
        SET v_mark_id = NULL;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;


    START TRANSACTION;


    -- Verify teacher ownership,
    -- subject assignment and Approved enrollment

    SELECT
        m.id,
        e.max_marks

    INTO
        v_mark_id,
        v_max_marks

    FROM marks m

    JOIN exams e
        ON e.id = m.exam_id

    JOIN teacher_subjects ts
        ON ts.subject_id = e.subject_id

    JOIN student_subjects ss
        ON ss.student_id = m.student_id
        AND ss.subject_id = e.subject_id
        AND ss.status = 'Approved'

    WHERE m.id = p_mark_id
    AND m.teacher_id = p_teacher_id
    AND ts.teacher_id = p_teacher_id

    FOR UPDATE;


    IF v_mark_id IS NULL THEN

        ROLLBACK;

        SELECT 'not_found' AS outcome;

        LEAVE main_block;

    END IF;


    -- Validate marks

    IF p_obtained_marks IS NULL
       OR p_obtained_marks < 0
       OR p_obtained_marks > v_max_marks THEN

        ROLLBACK;

        SELECT
            'invalid_marks' AS outcome,
            v_max_marks AS max_marks;

        LEAVE main_block;

    END IF;


    UPDATE marks

    SET
        obtained_marks = p_obtained_marks,
        remarks = p_remarks

    WHERE id = p_mark_id
    AND teacher_id = p_teacher_id;


    COMMIT;


    SELECT 'success' AS outcome;

END $$


-- ==========================================
-- 11. DELETE INDIVIDUAL MARKS
-- ==========================================

CREATE PROCEDURE sp_marks_delete(
    IN p_teacher_id INT,
    IN p_mark_id INT
)
BEGIN

    DELETE m

    FROM marks m

    JOIN exams e
        ON e.id = m.exam_id

    JOIN teacher_subjects ts
        ON ts.subject_id = e.subject_id

    WHERE m.id = p_mark_id
    AND m.teacher_id = p_teacher_id
    AND ts.teacher_id = p_teacher_id;


    IF ROW_COUNT() = 0 THEN

        SELECT 'not_found' AS outcome;

    ELSE

        SELECT 'success' AS outcome;

    END IF;

END $$

DELIMITER ;