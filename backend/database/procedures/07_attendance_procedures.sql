USE student_management;

DELIMITER $$

-- ==========================================
-- 1. GET STUDENT'S OWN ATTENDANCE
-- ==========================================

CREATE PROCEDURE sp_attendance_get_my(
    IN p_student_id INT
)
BEGIN

    SELECT
        a.id,
        a.attendance_date,
        a.status,
        a.remarks,
        s.id AS subject_id,
        s.subject_name,
        s.subject_code

    FROM attendance a

    INNER JOIN subjects s
        ON a.subject_id = s.id

    WHERE a.student_id = p_student_id

    ORDER BY a.attendance_date DESC;

END $$


-- ==========================================
-- 2. GET TEACHER'S ASSIGNED SUBJECTS
-- ==========================================

CREATE PROCEDURE sp_attendance_get_teacher_subjects(
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

    INNER JOIN subjects s
        ON ts.subject_id = s.id

    WHERE ts.teacher_id = p_teacher_id

    ORDER BY s.subject_name ASC;

END $$


-- ==========================================
-- 3. GET STUDENTS ELIGIBLE FOR ATTENDANCE
-- ==========================================

CREATE PROCEDURE sp_attendance_get_students(
    IN p_teacher_id INT,
    IN p_subject_id INT
)
main_block: BEGIN

    -- Verify teacher-subject assignment

    IF NOT EXISTS (
        SELECT 1
        FROM teacher_subjects
        WHERE teacher_id = p_teacher_id
        AND subject_id = p_subject_id
    ) THEN

        SELECT 'forbidden' AS outcome;

        LEAVE main_block;

    END IF;


    -- First result set: operation status

    SELECT 'success' AS outcome;


    -- Second result set: eligible students

    SELECT
        st.id,
        st.name,
        st.email,
        st.phone,
        st.course

    FROM students st

    INNER JOIN student_subjects ss
        ON ss.student_id = st.id

    INNER JOIN teacher_subjects ts
        ON ts.subject_id = ss.subject_id
        AND ts.teacher_id = p_teacher_id

    WHERE ss.subject_id = p_subject_id
    AND ss.status = 'Approved'
    AND st.status = 'Active'

    ORDER BY st.name ASC;

END $$


-- ==========================================
-- 4. MARK BULK ATTENDANCE
-- ==========================================

CREATE PROCEDURE sp_attendance_mark(
    IN p_teacher_id INT,
    IN p_subject_id INT,
    IN p_attendance_date DATE,
    IN p_students JSON
)
main_block: BEGIN

    DECLARE v_assignment_id INT DEFAULT NULL;
    DECLARE v_total_students INT DEFAULT 0;
    DECLARE v_valid_students INT DEFAULT 0;
    DECLARE v_inserted_students INT DEFAULT 0;

    DECLARE CONTINUE HANDLER FOR NOT FOUND
        SET v_assignment_id = NULL;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;


    -- Validate attendance array

    IF p_students IS NULL
       OR JSON_TYPE(p_students) <> 'ARRAY'
       OR JSON_LENGTH(p_students) = 0 THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
            'Attendance records must be a nonempty array';

    END IF;


    SET v_total_students = JSON_LENGTH(p_students);


    -- Start transaction

    START TRANSACTION;


    -- Verify and lock teacher assignment

    SELECT id
    INTO v_assignment_id

    FROM teacher_subjects

    WHERE teacher_id = p_teacher_id
    AND subject_id = p_subject_id

    FOR SHARE;


    IF v_assignment_id IS NULL THEN

        ROLLBACK;

        SELECT 'forbidden' AS outcome;

        LEAVE main_block;

    END IF;


    -- Verify every student is Active
    -- and has an Approved enrollment

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

    INNER JOIN students st
        ON st.id = jt.student_id

    INNER JOIN student_subjects ss
        ON ss.student_id = st.id

    WHERE ss.subject_id = p_subject_id
    AND ss.status = 'Approved'
    AND st.status = 'Active';


    -- Reject the entire batch if any student
    -- is invalid or ineligible

    IF v_valid_students <> v_total_students THEN

        ROLLBACK;

        SELECT 'invalid_students' AS outcome;

        LEAVE main_block;

    END IF;


    -- Insert attendance records
    -- Recheck student eligibility during insert

    INSERT INTO attendance (
        student_id,
        subject_id,
        teacher_id,
        attendance_date,
        status,
        remarks
    )

    SELECT
        jt.student_id,
        p_subject_id,
        p_teacher_id,
        p_attendance_date,
        jt.attendance_status,
        jt.remarks

    FROM JSON_TABLE(
        p_students,
        '$[*]' COLUMNS (

            student_id INT PATH '$.student_id'
                ERROR ON EMPTY
                ERROR ON ERROR,

            attendance_status VARCHAR(20)
                PATH '$.status'
                ERROR ON EMPTY
                ERROR ON ERROR,

            remarks VARCHAR(255)
                PATH '$.remarks'
                NULL ON EMPTY
                ERROR ON ERROR
        )
    ) AS jt

    INNER JOIN students st
        ON st.id = jt.student_id

    INNER JOIN student_subjects ss
        ON ss.student_id = st.id

    WHERE ss.subject_id = p_subject_id
    AND ss.status = 'Approved'
    AND st.status = 'Active';


    SET v_inserted_students = ROW_COUNT();


    -- Ensure every requested record was inserted

    IF v_inserted_students <> v_total_students THEN

        ROLLBACK;

        SELECT 'invalid_students' AS outcome;

        LEAVE main_block;

    END IF;


    -- Save transaction

    COMMIT;


    -- Return successful result

    SELECT
        'success' AS outcome,
        p_subject_id AS subject_id,
        p_attendance_date AS attendance_date,
        v_inserted_students AS total_students;

END $$


-- ==========================================
-- 5. GET TEACHER ATTENDANCE RECORDS
-- ==========================================

CREATE PROCEDURE sp_attendance_get_records(
    IN p_teacher_id INT,
    IN p_subject_id INT,
    IN p_attendance_date DATE
)
main_block: BEGIN

    -- Verify teacher-subject assignment

    IF NOT EXISTS (
        SELECT 1
        FROM teacher_subjects
        WHERE teacher_id = p_teacher_id
        AND subject_id = p_subject_id
    ) THEN

        SELECT 'forbidden' AS outcome;

        LEAVE main_block;

    END IF;


    -- First result set: operation status

    SELECT 'success' AS outcome;


    -- Second result set: attendance records

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

    INNER JOIN students st
        ON a.student_id = st.id

    INNER JOIN subjects s
        ON a.subject_id = s.id

    INNER JOIN teacher_subjects ts
        ON ts.subject_id = a.subject_id
        AND ts.teacher_id = p_teacher_id

    WHERE a.subject_id = p_subject_id

    AND (
        p_attendance_date IS NULL
        OR a.attendance_date = p_attendance_date
    )

    ORDER BY
        a.attendance_date DESC,
        st.name ASC;

END $$


-- ==========================================
-- 6. EDIT EXISTING ATTENDANCE
-- ==========================================

CREATE PROCEDURE sp_attendance_edit(
    IN p_teacher_id INT,
    IN p_attendance_id INT,
    IN p_status VARCHAR(10),
    IN p_remarks VARCHAR(255),
    IN p_update_remarks TINYINT
)
main_block: BEGIN

    DECLARE v_student_id INT;
    DECLARE v_subject_id INT;
    DECLARE v_attendance_date DATE;
    DECLARE v_not_found BOOLEAN DEFAULT FALSE;

    DECLARE CONTINUE HANDLER FOR NOT FOUND
        SET v_not_found = TRUE;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;


    -- Validate attendance status

    IF p_status IS NULL
       OR p_status NOT IN (
           'Present',
           'Absent',
           'Late'
       ) THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid attendance status';

    END IF;


    -- Start transaction

    START TRANSACTION;


    -- Verify teacher authorization and
    -- Approved student enrollment

    SELECT
        a.student_id,
        a.subject_id,
        a.attendance_date

    INTO
        v_student_id,
        v_subject_id,
        v_attendance_date

    FROM attendance a

    INNER JOIN teacher_subjects ts
        ON a.subject_id = ts.subject_id

    INNER JOIN student_subjects ss
        ON ss.student_id = a.student_id
        AND ss.subject_id = a.subject_id
        AND ss.status = 'Approved'

    WHERE a.id = p_attendance_id
    AND ts.teacher_id = p_teacher_id

    FOR UPDATE;


    -- Record does not exist or is unauthorized

    IF v_not_found THEN

        ROLLBACK;

        SELECT 'not_found' AS outcome;

        LEAVE main_block;

    END IF;


    -- Update attendance
    -- Preserve remarks when they are omitted

    IF p_update_remarks = 1 THEN

        UPDATE attendance

        SET
            status = p_status,
            remarks = p_remarks

        WHERE id = p_attendance_id;

    ELSE

        UPDATE attendance

        SET status = p_status

        WHERE id = p_attendance_id;

    END IF;


    -- Save transaction

    COMMIT;


    -- Return updated attendance information

    SELECT
        'success' AS outcome,
        p_attendance_id AS attendance_id,
        v_student_id AS student_id,
        v_subject_id AS subject_id,
        v_attendance_date AS attendance_date,
        p_status AS status,

        CASE
            WHEN p_update_remarks = 1
                THEN p_remarks
            ELSE 'Unchanged'
        END AS remarks;

END $$

DELIMITER ;