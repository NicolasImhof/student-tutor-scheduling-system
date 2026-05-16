
-- This migration updates the reschedule_appointment function to securely allow
-- both students and tutors to reschedule their own appointments.

CREATE OR REPLACE FUNCTION reschedule_appointment(p_appointment_id INT, p_new_start_time timestamptz, p_new_end_time timestamptz, p_user_id INT, p_role TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_appointment RECORD;
BEGIN
    -- Get the appointment details
    SELECT * INTO target_appointment FROM appointments WHERE appointment_id = p_appointment_id;

    -- Authorization Check: Ensure the user is part of the appointment.
    IF target_appointment.student_id = p_user_id OR target_appointment.tutor_id = p_user_id THEN
        -- Proceed with the update
        UPDATE appointments
        SET start_time = p_new_start_time, end_time = p_new_end_time, status = 'Scheduled'
        WHERE appointment_id = p_appointment_id;
    ELSE
        -- If not authorized, raise an exception.
        RAISE EXCEPTION 'User not authorized to reschedule this appointment.';
    END IF;
END;
$$;
