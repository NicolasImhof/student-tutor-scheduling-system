CREATE OR REPLACE FUNCTION cancel_appointment(p_appointment_id integer, p_user_id integer, p_role text)
RETURNS void AS $$
BEGIN
    UPDATE appointments_enhanced
    SET status = 'Canceled'
    WHERE appointment_id = p_appointment_id
    AND (
        (p_role = 'Admin') OR
        (p_role = 'Super Admin') OR
        (p_role = 'Student' AND student_id = p_user_id) OR
        (p_role = 'Tutor' AND tutor_id = p_user_id)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;