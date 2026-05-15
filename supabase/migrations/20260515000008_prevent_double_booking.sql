-- This function checks if a new appointment conflicts with existing ones for the same student or tutor.
CREATE OR REPLACE FUNCTION has_overlapping_appointment(
    p_student_id int,
    p_tutor_id int,
    p_start_time timestamptz,
    p_end_time timestamptz,
    p_appointment_id int DEFAULT NULL -- Exclude this ID from the check, for updates
) 
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM appointments_enhanced
        WHERE
            appointment_id IS DISTINCT FROM p_appointment_id AND
            (student_id = p_student_id OR tutor_id = p_tutor_id) AND
            (start_time, end_time) OVERLAPS (p_start_time, p_end_time)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;