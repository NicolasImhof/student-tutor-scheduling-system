
-- Final Fixes for Roles, Types, and Permissions

-- 1. Ensure user_id is treated consistently (using the type from the users table)
-- If the table uses INT, we must use INT in functions.
CREATE OR REPLACE FUNCTION get_tutors_for_student_view()
RETURNS TABLE (
    user_id INT,
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
            AVG(r.rating)::NUMERIC AS average_rating,
            COUNT(r.review_id)::BIGINT AS review_count
        FROM
            public.users t
        LEFT JOIN
            public.reviews r ON t.user_id = r.tutor_id
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
            public.tutor_specializations ts
        JOIN
            public.courses c ON ts.course_id = c.course_id
        GROUP BY
            ts.tutor_id
    )
    SELECT
        u.user_id,
        u.first_name::TEXT,
        u.last_name::TEXT,
        u.category::TEXT,
        COALESCE(tr.average_rating, 0),
        COALESCE(tr.review_count, 0),
        COALESCE(ts.specializations, '[]'::json)
    FROM
        public.users u
    LEFT JOIN
        tutor_ratings tr ON u.user_id = tr.user_id
    LEFT JOIN
        tutor_specs ts ON u.user_id = ts.tutor_id
    WHERE
        u.role = 'Tutor' AND u.approval_status = 'Approved';
END;
$$ LANGUAGE plpgsql;

-- 2. Add System Events management RPC for Super Admin
CREATE OR REPLACE FUNCTION create_system_event(
    p_name TEXT,
    p_start_date DATE,
    p_end_date DATE,
    p_event_type TEXT,
    p_is_recurring BOOLEAN
) RETURNS VOID AS $$
BEGIN
    IF get_my_role() <> 'Super Admin' THEN
        RAISE EXCEPTION 'Only Super Admins can create system events.';
    END IF;

    INSERT INTO public.system_events (name, start_date, end_date, event_type, is_recurring)
    VALUES (p_name, p_start_date, p_end_date, p_event_type, p_is_recurring);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
