USE student_management;

DELIMITER $$

-- ==========================================
-- 1. GET ALL STUDENTS
-- ==========================================

CREATE PROCEDURE sp_student_get_all()
BEGIN

    SELECT *
    FROM students
    ORDER BY id ASC;

END $$


-- ==========================================
-- 2. GET PENDING STUDENTS
-- ==========================================

CREATE PROCEDURE sp_student_get_pending()
BEGIN

    SELECT
        id,
        name,
        email,
        phone,
        course,
        status,
        created_at
    FROM students
    WHERE status = 'Pending'
    ORDER BY created_at ASC;

END $$


-- ==========================================
-- 3. ADD NEW STUDENT
-- ==========================================

CREATE PROCEDURE sp_student_add(
    IN p_name VARCHAR(100),
    IN p_email VARCHAR(150),
    IN p_phone VARCHAR(10),
    IN p_course VARCHAR(100)
)
BEGIN

    INSERT INTO students (
        name,
        email,
        phone,
        course
    )
    VALUES (
        p_name,
        p_email,
        p_phone,
        p_course
    );

    SELECT LAST_INSERT_ID() AS studentId;

END $$


-- ==========================================
-- 4. GET STUDENT BY ID
-- ==========================================

CREATE PROCEDURE sp_student_get_by_id(
    IN p_id INT
)
BEGIN

    SELECT *
    FROM students
    WHERE id = p_id;

END $$


-- ==========================================
-- 5. UPDATE STUDENT
-- ==========================================

CREATE PROCEDURE sp_student_update(
    IN p_id INT,
    IN p_name VARCHAR(100),
    IN p_email VARCHAR(150),
    IN p_phone VARCHAR(10),
    IN p_course VARCHAR(100)
)
BEGIN

    DECLARE v_affected INT;

    UPDATE students
    SET
        name = p_name,
        email = p_email,
        phone = p_phone,
        course = p_course
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
-- 6. DELETE STUDENT
-- ==========================================

CREATE PROCEDURE sp_student_delete(
    IN p_id INT
)
BEGIN

    DELETE FROM students
    WHERE id = p_id;

    SELECT ROW_COUNT() AS affectedRows;

END $$


-- ==========================================
-- 7. UPDATE STUDENT STATUS
-- ==========================================

CREATE PROCEDURE sp_student_update_status(
    IN p_id INT,
    IN p_status VARCHAR(8)
)
BEGIN

    DECLARE v_affected INT;

    IF p_status IS NULL
       OR p_status NOT IN ('Active', 'Inactive')
    THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid student status';

    END IF;

    UPDATE students
    SET status = p_status
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
-- 8. APPROVE PENDING STUDENT
-- ==========================================

CREATE PROCEDURE sp_student_approve(
    IN p_id INT
)
BEGIN

    DECLARE v_affected INT;

    UPDATE students
    SET status = 'Active'
    WHERE id = p_id
    AND status = 'Pending';

    SET v_affected = ROW_COUNT();

    SELECT
        v_affected AS affectedRows,

        EXISTS (
            SELECT 1
            FROM students
            WHERE id = p_id
        ) AS student_exists,

        (
            SELECT status
            FROM students
            WHERE id = p_id
        ) AS current_status;

END $$


-- ==========================================
-- 9. UPDATE OWN STUDENT PROFILE
-- ==========================================

CREATE PROCEDURE sp_student_update_profile(
    IN p_id INT,
    IN p_name VARCHAR(100),
    IN p_phone VARCHAR(10),
    IN p_course VARCHAR(100)
)
BEGIN

    DECLARE v_found_id INT DEFAULT NULL;
    DECLARE v_status VARCHAR(8);
    DECLARE v_outcome VARCHAR(20);

    DECLARE CONTINUE HANDLER FOR NOT FOUND
    SET v_found_id = NULL;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SELECT id, status
    INTO v_found_id, v_status
    FROM students
    WHERE id = p_id
    FOR UPDATE;

    IF v_found_id IS NULL THEN

        SET v_outcome = 'not_found';

    ELSEIF v_status IS NULL
           OR v_status <> 'Active' THEN

        SET v_outcome = 'inactive';

    ELSE

        UPDATE students
        SET
            name = p_name,
            phone = p_phone,
            course = p_course
        WHERE id = p_id
        AND status = 'Active';

        SET v_outcome = 'updated';

    END IF;

    COMMIT;

    SELECT v_outcome AS outcome;

END $$

DELIMITER ;