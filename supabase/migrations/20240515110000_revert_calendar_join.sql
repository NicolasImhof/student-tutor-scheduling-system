CREATE OR REPLACE FUNCTION get_calendar_appointments(start_date_in timestamp with time zone, end_date_in timestamp with time zone, p_user_id integer, p_role text)
RETURNS SETOF json AS $$
BEGIN
    RETURN QUERY
    SELECT json_build_object(
        'appointment_id', a.appointment_id, 
        'student_id', a.student_id, 
        'tutor_id', a.tutor_id, 
        'course_id', a.course_id, 
        'start_time', a.start_time, 
        'end_time', a.end_time, 
        'duration_minutes', a.duration_minutes, 
        'status', a.status, 
        'reason_notes', a.reason_notes, 
        'meeting_link', a.meeting_link, 
        'location', a.location, 
        'is_recurring', a.is_recurring, 
        'recurring_rule', a.recurring_rule,
        'student_first_name', s.first_name,
        'student_last_name', s.last_name,
        'tutor_first_name', t.first_name,
        'tutor_last_name', t.last_name
    )
    FROM appointments_enhanced a
    LEFT JOIN users s ON a.student_id = s.user_id
    LEFT JOIN users t ON a.tutor_id = t.user_id
    WHERE 
        a.start_time >= start_date_in AND a.start_time <= end_date_in AND
        CASE
            WHEN p_role = 'Student' THEN a.student_id = p_user_id
            WHEN p_role = 'Tutor' THEN a.tutor_id = p_user_id
            ELSE true
        END;
END;
$$ LANGUAGE plpgsql;
