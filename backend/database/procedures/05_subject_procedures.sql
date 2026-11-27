USE student_management;

DELIMITER $$

-- ==========================================
-- 1. GET ALL SUBJECTS
-- ==========================================

CREATE PROCEDURE sp_subject_get_all()
BEGIN

    SELECT
        id,
        subject_name,
        subject_code,
        course,
        semester,
        created_at
    FROM subjects
    ORDER BY course, semester, subject_name;

END $$


-- ==========================================
-- 2. GET SUBJECT BY ID
-- ==========================================

CREATE PROCEDURE sp_subject_get_by_id(
    IN p_subject_id INT
)
BEGIN

    SELECT *
    FROM subjects
    WHERE id = p_subject_id;

END $$


-- ==========================================
-- 3. CREATE SUBJECT
-- ==========================================

CREATE PROCEDURE sp_subject_create(
    IN p_subject_name VARCHAR(100),
    IN p_subject_code VARCHAR(20),
    IN p_course VARCHAR(100),
    IN p_semester INT
)
BEGIN

    -- Validate semester: 1 to 8

    IF p_semester IS NULL
       OR p_semester NOT BETWEEN 1 AND 8 THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
            'Semester must be between 1 and 8';

    END IF;


    INSERT INTO subjects (
        subject_name,
        subject_code,
        course,
        semester
    )
    VALUES (
        p_subject_name,
        p_subject_code,
        p_course,
        p_semester
    );

    SELECT LAST_INSERT_ID() AS subject_id;

END $$


-- ==========================================
-- 4. UPDATE SUBJECT
-- ==========================================

CREATE PROCEDURE sp_subject_update(
    IN p_subject_id INT,
    IN p_subject_name VARCHAR(100),
    IN p_subject_code VARCHAR(20),
    IN p_course VARCHAR(100),
    IN p_semester INT
)
BEGIN

    DECLARE v_affected INT;


    -- Validate semester: 1 to 8

    IF p_semester IS NULL
       OR p_semester NOT BETWEEN 1 AND 8 THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
            'Semester must be between 1 and 8';

    END IF;


    UPDATE subjects
    SET
        subject_name = p_subject_name,
        subject_code = p_subject_code,
        course = p_course,
        semester = p_semester
    WHERE id = p_subject_id;

    SET v_affected = ROW_COUNT();

    SELECT
        v_affected AS affectedRows,

        EXISTS (
            SELECT 1
            FROM subjects
            WHERE id = p_subject_id
        ) AS subject_exists;

END $$


-- ==========================================
-- 5. DELETE SUBJECT
-- ==========================================

CREATE PROCEDURE sp_subject_delete(
    IN p_subject_id INT
)
BEGIN

    -- Check teacher assignments

    IF EXISTS (
        SELECT 1
        FROM teacher_subjects
        WHERE subject_id = p_subject_id
    ) THEN

        SELECT 'has_assignments' AS outcome;

    -- Check examinations

    ELSEIF EXISTS (
        SELECT 1
        FROM exams
        WHERE subject_id = p_subject_id
    ) THEN

        SELECT 'has_exams' AS outcome;

    ELSE

        DELETE FROM subjects
        WHERE id = p_subject_id;

        IF ROW_COUNT() = 0 THEN

            SELECT 'not_found' AS outcome;

        ELSE

            SELECT 'deleted' AS outcome;

        END IF;

    END IF;

END $$


-- ==========================================
-- 6. GET ALL TEACHER-SUBJECT ASSIGNMENTS
-- ==========================================

CREATE PROCEDURE sp_subject_get_assignments()
BEGIN

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

    ORDER BY u.name, s.course, s.semester;

END $$


-- ==========================================
-- 7. ASSIGN MULTIPLE SUBJECTS TO TEACHER
-- ==========================================

CREATE PROCEDURE sp_subject_assign_multiple(
    IN p_teacher_id INT,
    IN p_subject_ids JSON
)
BEGIN

    DECLARE v_total INT DEFAULT 0;
    DECLARE v_existing_subjects INT DEFAULT 0;
    DECLARE v_newly_assigned INT DEFAULT 0;

    -- Rollback transaction if an SQL error occurs

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;


    -- Validate JSON array

    IF p_subject_ids IS NULL
       OR JSON_TYPE(p_subject_ids) <> 'ARRAY'
       OR JSON_LENGTH(p_subject_ids) = 0 THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
            'Subject IDs must be a nonempty array';

    END IF;


    -- Start transaction

    START TRANSACTION;


    -- Count distinct subject IDs

    SELECT COUNT(DISTINCT jt.subject_id)
    INTO v_total

    FROM JSON_TABLE(
        p_subject_ids,
        '$[*]' COLUMNS (
            subject_id INT PATH '$'
            ERROR ON EMPTY
            ERROR ON ERROR
        )
    ) AS jt;


    -- Verify teacher account

    IF NOT EXISTS (
        SELECT 1
        FROM users
        WHERE id = p_teacher_id
        AND role = 'Teacher'
    ) THEN

        ROLLBACK;

        SELECT 'teacher_not_found' AS outcome;

    ELSE


        -- Verify all subjects exist

        SELECT COUNT(DISTINCT s.id)
        INTO v_existing_subjects

        FROM subjects s

        INNER JOIN JSON_TABLE(
            p_subject_ids,
            '$[*]' COLUMNS (
                subject_id INT PATH '$'
                ERROR ON EMPTY
                ERROR ON ERROR
            )
        ) AS jt

        ON s.id = jt.subject_id;


        IF v_existing_subjects <> v_total
           OR v_total = 0 THEN

            ROLLBACK;

            SELECT 'subjects_not_found' AS outcome;

        ELSE


            -- Insert assignments
            -- Ignore existing duplicate assignments

            INSERT IGNORE INTO teacher_subjects (
                teacher_id,
                subject_id
            )

            SELECT DISTINCT
                p_teacher_id,
                jt.subject_id

            FROM JSON_TABLE(
                p_subject_ids,
                '$[*]' COLUMNS (
                    subject_id INT PATH '$'
                    ERROR ON EMPTY
                    ERROR ON ERROR
                )
            ) AS jt;


            -- Count newly inserted records

            SET v_newly_assigned = ROW_COUNT();


            -- Save transaction

            COMMIT;


            -- Return assignment result

            SELECT
                'success' AS outcome,
                p_teacher_id AS teacher_id,
                v_total AS total_requested,
                v_newly_assigned AS newly_assigned,
                v_total - v_newly_assigned
                    AS already_assigned;

        END IF;

    END IF;

END $$


-- ==========================================
-- 8. REMOVE TEACHER-SUBJECT ASSIGNMENT
-- ==========================================

CREATE PROCEDURE sp_subject_remove_assignment(
    IN p_assignment_id INT
)
BEGIN

    DELETE FROM teacher_subjects
    WHERE id = p_assignment_id;

    SELECT ROW_COUNT() AS affectedRows;

END $$

DELIMITER ;