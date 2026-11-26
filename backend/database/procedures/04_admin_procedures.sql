USE student_management;

DELIMITER $$

-- ==========================================
-- 1. GET ALL TEACHERS
-- ==========================================

CREATE PROCEDURE sp_admin_get_teachers()
BEGIN

    SELECT
        id,
        name,
        email,
        role,
        created_at
    FROM users
    WHERE role = 'Teacher'
    ORDER BY name ASC;

END $$


-- ==========================================
-- 2. ADMIN DASHBOARD STATISTICS
-- ==========================================

CREATE PROCEDURE sp_admin_get_dashboard_stats()
BEGIN

    SELECT

        (SELECT COUNT(*)
         FROM students)
            AS total_students,

        (SELECT COUNT(*)
         FROM students
         WHERE status = 'Active')
            AS active_students,

        (SELECT COUNT(*)
         FROM students
         WHERE status = 'Inactive')
            AS inactive_students,

        (SELECT COUNT(*)
         FROM students
         WHERE status = 'Pending')
            AS pending_students,

        (SELECT COUNT(*)
         FROM users
         WHERE role = 'Teacher')
            AS total_teachers,

        (SELECT COUNT(*)
         FROM subjects)
            AS total_subjects,

        (SELECT COUNT(*)
         FROM teacher_subjects)
            AS total_assignments;

END $$

DELIMITER ;