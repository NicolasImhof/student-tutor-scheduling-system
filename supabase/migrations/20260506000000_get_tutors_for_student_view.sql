CREATE OR REPLACE FUNCTION get_tutors_for_student_view()
RETURNS TABLE (
    user_id UUID,
    first_name TEXT,
    last_name TEXT,
    category TEXT,
    average_rating NUMERIC,
    review_count BIGINT,
    specializations JSON
) AS $$
BEGIN
    RETURN QUERY
    WITH tutor_ratings AS (
        SELECT
            t.user_id,
            AVG(r.rating) AS average_rating,
            COUNT(r.review_id) AS review_count
        FROM
            users t
        LEFT JOIN
            reviews r ON t.user_id = r.tutor_id
        WHERE
            t.role = 'Tutor'
        GROUP BY
            t.user_id
    ),
    tutor_specs AS (
        SELECT
            ts.tutor_id,
            json_agg(c.course_name) AS specializations
        FROM
            tutor_specializations ts
        JOIN
            courses c ON ts.course_id = c.course_id
        GROUP BY
            ts.tutor_id
    )
    SELECT
        u.user_id,
        u.first_name,
        u.last_name,
        u.category,
        tr.average_rating,
        tr.review_count,
        COALESCE(ts.specializations, '[]'::json)
    FROM
        users u
    LEFT JOIN
        tutor_ratings tr ON u.user_id = tr.user_id
    LEFT JOIN
        tutor_specs ts ON u.user_id = ts.tutor_id
    WHERE
        u.role = 'Tutor';
END;
$$ LANGUAGE plpgsql;
