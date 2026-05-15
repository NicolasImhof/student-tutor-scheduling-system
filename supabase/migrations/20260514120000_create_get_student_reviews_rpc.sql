
CREATE OR REPLACE FUNCTION get_student_reviews(p_student_id integer)
RETURNS TABLE (
    review_id integer,
    appointment_id integer,
    tutor_id integer,
    student_id integer,
    rating integer,
    comment text,
    created_at timestamp with time zone,
    tutor_response text,
    deletion_requested boolean,
    tutor_first_name text,
    tutor_last_name text
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.review_id,
        r.appointment_id,
        r.tutor_id,
        r.student_id,
        r.rating,
        r.comment,
        r.created_at,
        r.tutor_response,
        r.deletion_requested,
        t.first_name AS tutor_first_name,
        t.last_name AS tutor_last_name
    FROM
        reviews r
    JOIN
        users t ON r.tutor_id = t.user_id
    WHERE
        r.student_id = p_student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
