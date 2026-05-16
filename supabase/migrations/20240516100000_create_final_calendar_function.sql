CREATE OR REPLACE FUNCTION get_calendar_appointments(start_date_in timestamp with time zone, end_date_in timestamp with time zone, p_user_id integer, p_role text, p_category text)
RETURNS TABLE(appointment_id integer, student_id integer, tutor_id integer, course_id integer, start_time timestamp with time zone, end_time timestamp with time zone, duration_minutes integer, status appointment_status, reason_notes text, meeting_link character varying, location character varying, is_recurring boolean, recurring_rule text, student_first_name character varying, student_last_name character varying, tutor_first_name character varying, tutor_last_name character varying) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.appointment_id, a.student_id, a.tutor_id, a.course_id, a.start_time, a.end_time, a.duration_minutes, a.status, a.reason_notes, a.meeting_link, a.location, a.is_recurring, a.recurring_rule,
        s.first_name, s.last_name, t.first_name, t.last_name
    FROM appointments_enhanced a
    LEFT JOIN users s ON a.student_id = s.user_id
    LEFT JOIN users t ON a.tutor_id = t.user_id
    WHERE 
        a.start_time >= start_date_in AND a.start_time <= end_date_in AND
        (CASE
            WHEN p_role = 'Student' THEN a.student_id = p_user_id
            WHEN p_role = 'Tutor' THEN a.tutor_id = p_user_id
            WHEN p_role = 'Admin' THEN t.category = p_category
            WHEN p_role = 'Super Admin' THEN true
            ELSE false
        END);
END;
$$ LANGUAGE plpgsql;
