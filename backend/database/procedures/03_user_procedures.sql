USE student_management;

DELIMITER $$

-- ==========================================
-- 1. GET ALL USERS
-- ==========================================

CREATE PROCEDURE sp_user_get_all()
BEGIN
    SELECT
        id,
        name,
        email,
        role,
        student_id,
        profile_image,
        created_at
    FROM users
    ORDER BY id ASC;
END $$


-- ==========================================
-- 2. CHECK DUPLICATE EMAIL
-- ==========================================

CREATE PROCEDURE sp_user_check_email(
    IN p_email VARCHAR(150),
    IN p_exclude_id INT
)
BEGIN
    SELECT id
    FROM users
    WHERE email = p_email
    AND (
        p_exclude_id IS NULL
        OR id <> p_exclude_id
    )
    LIMIT 1;
END $$


-- ==========================================
-- 3. CREATE TEACHER
-- ==========================================

CREATE PROCEDURE sp_user_create_teacher(
    IN p_name VARCHAR(100),
    IN p_email VARCHAR(150),
    IN p_password_hash VARCHAR(255)
)
BEGIN
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
        'Teacher',
        NULL
    );

    SELECT LAST_INSERT_ID() AS teacher_id;
END $$


-- ==========================================
-- 4. GET TEACHER DETAILS
-- ==========================================

CREATE PROCEDURE sp_user_get_teacher(
    IN p_teacher_id INT
)
BEGIN
    SELECT
        id,
        name,
        email,
        role,
        profile_image
    FROM users
    WHERE id = p_teacher_id
    AND role = 'Teacher';
END $$


-- ==========================================
-- 5. UPDATE TEACHER
-- ==========================================

CREATE PROCEDURE sp_user_update_teacher(
    IN p_teacher_id INT,
    IN p_name VARCHAR(100),
    IN p_email VARCHAR(150)
)
BEGIN
    UPDATE users
    SET
        name = p_name,
        email = p_email
    WHERE id = p_teacher_id
    AND role = 'Teacher';

    SELECT ROW_COUNT() AS affectedRows;
END $$


-- ==========================================
-- 6. CHECK TEACHER SUBJECT ASSIGNMENTS
-- ==========================================

CREATE PROCEDURE sp_user_check_assignments(
    IN p_teacher_id INT
)
BEGIN
    SELECT id
    FROM teacher_subjects
    WHERE teacher_id = p_teacher_id
    LIMIT 1;
END $$


-- ==========================================
-- 7. DELETE TEACHER
-- ==========================================

CREATE PROCEDURE sp_user_delete_teacher(
    IN p_teacher_id INT
)
BEGIN
    DELETE FROM users
    WHERE id = p_teacher_id
    AND role = 'Teacher';

    SELECT ROW_COUNT() AS affectedRows;
END $$


-- ==========================================
-- 8. GET TEACHER IMAGE
-- ==========================================

CREATE PROCEDURE sp_user_get_teacher_image(
    IN p_teacher_id INT
)
BEGIN
    SELECT profile_image
    FROM users
    WHERE id = p_teacher_id
    AND role = 'Teacher';
END $$


-- ==========================================
-- 9. UPDATE TEACHER IMAGE
-- ==========================================

CREATE PROCEDURE sp_user_update_teacher_image(
    IN p_teacher_id INT,
    IN p_image_path VARCHAR(255)
)
BEGIN
    UPDATE users
    SET profile_image = p_image_path
    WHERE id = p_teacher_id
    AND role = 'Teacher';

    SELECT ROW_COUNT() AS affectedRows;
END $$

DELIMITER ;