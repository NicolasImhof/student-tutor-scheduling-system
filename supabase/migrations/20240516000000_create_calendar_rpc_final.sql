CREATE OR REPLACE FUNCTION get_calendar_appointments(
    start_date_in timestamp with time zone, 
    end_date_in timestamp with time zone, 
    p_user_id integer, 
    p_role text
)
RETURNS SETOF appointments_enhanced AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM appointments_enhanced a
    WHERE
        a.start_time >= start_date_in AND a.start_time <= end_date_in AND
        (CASE
            WHEN p_role = 'Student' THEN a.student_id = p_user_id
            WHEN p_role = 'Tutor' THEN a.tutor_id = p_user_id
            WHEN p_role IN ('Admin', 'Super Admin') THEN true
            ELSE false
        END);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;