USE student_management;

DELIMITER $$

CREATE PROCEDURE sp_auth_check_email(
    IN p_email VARCHAR(150)
)
BEGIN

    SELECT email
    FROM users
    WHERE LOWER(email) = LOWER(p_email)

    UNION

    SELECT email
    FROM students
    WHERE LOWER(email) = LOWER(p_email)

    LIMIT 1;

END $$

DELIMITER ;


DELIMITER $$

CREATE PROCEDURE sp_auth_register_student(
    IN p_name VARCHAR(100),
    IN p_email VARCHAR(150),
    IN p_phone VARCHAR(10),
    IN p_course VARCHAR(100),
    IN p_password_hash VARCHAR(255)
)
BEGIN

    DECLARE v_student_id INT;
    DECLARE v_user_id INT;

    -- Rollback if any database operation fails
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    -- Start transaction
    START TRANSACTION;

    -- Check duplicate email
    IF EXISTS (
        SELECT 1 FROM users
        WHERE LOWER(email) = LOWER(p_email)
    ) OR EXISTS (
        SELECT 1 FROM students
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
        status
    )
    VALUES (
        p_name,
        p_email,
        p_phone,
        p_course,
        'Pending'
    );

    -- Get generated student ID
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

    -- Get generated user ID
    SET v_user_id = LAST_INSERT_ID();

    -- Save both records
    COMMIT;

    -- Return registration details
    SELECT
        v_student_id AS student_id,
        v_user_id AS user_id,
        p_name AS name,
        p_email AS email,
        'Student' AS role,
        'Pending' AS status;

END $$

DELIMITER ;



-- PROCEDURE

DELIMITER $$

CREATE PROCEDURE sp_auth_login(
    IN p_email VARCHAR(150)
)
BEGIN

    SELECT
        u.id,
        u.name,
        u.email,
        u.password,
        u.role,
        u.student_id,
        s.status AS student_status

    FROM users u

    LEFT JOIN students s
        ON u.student_id = s.id

    WHERE u.email = p_email;

END $$

DELIMITER ;