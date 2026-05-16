DROP FUNCTION IF EXISTS get_student_tutor_list();

CREATE OR REPLACE FUNCTION get_student_tutor_list()
RETURNS TABLE(
    user_id INT,
    first_name TEXT,
    last_name TEXT,
    category TEXT,
    specializations JSON,
    average_rating REAL,
    review_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.user_id,
        u.first_name::text,
        u.last_name::text,
        u.category::text,
        COALESCE(
            (SELECT json_agg(json_build_object('course_id', c.course_id, 'course_name', c.course_name))
             FROM tutor_specializations ts
             JOIN courses c ON ts.course_id = c.course_id
             WHERE ts.tutor_id = u.user_id),
            '[]'::json
        ) AS specializations,
        tr.average_rating::real,
        tr.review_count
    FROM
        users u
    LEFT JOIN (
        SELECT
            r.tutor_id,
            AVG(r.rating) AS average_rating,
            COUNT(r.review_id)::int AS review_count
        FROM
            reviews r
        GROUP BY
            r.tutor_id
    ) AS tr ON u.user_id = tr.tutor_id
    WHERE
        u.role = 'Tutor' AND u.approval_status = 'Approved';
END;
$$;