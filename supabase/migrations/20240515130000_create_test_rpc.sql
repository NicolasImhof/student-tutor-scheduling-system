CREATE OR REPLACE FUNCTION test_get_appointment()
RETURNS SETOF json AS $$
BEGIN
    RETURN QUERY
    SELECT json_build_object(
        'appointment_id', 999,
        'student_id', 102,
        'tutor_id', 106,
        'start_time', '2026-05-18T10:00:00Z',
        'end_time', '2026-05-18T10:30:00Z',
        'status', 'Scheduled',
        'student_first_name', 'Test',
        'student_last_name', 'Student',
        'tutor_first_name', 'Test',
        'tutor_last_name', 'Tutor'
    );
END;
$$ LANGUAGE plpgsql;
