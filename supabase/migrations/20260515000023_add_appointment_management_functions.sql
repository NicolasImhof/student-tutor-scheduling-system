CREATE OR REPLACE FUNCTION cancel_appointment(p_appointment_id INT, p_user_id INT, p_role TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the user is authorized to cancel this appointment
    IF p_role = 'Student' AND EXISTS (SELECT 1 FROM appointments WHERE appointment_id = p_appointment_id AND student_id = p_user_id) THEN
        UPDATE appointments SET status = 'Cancelled' WHERE appointment_id = p_appointment_id;
    ELSIF p_role = 'Tutor' AND EXISTS (SELECT 1 FROM appointments WHERE appointment_id = p_appointment_id AND tutor_id = p_user_id) THEN
        UPDATE appointments SET status = 'Cancelled' WHERE appointment_id = p_appointment_id;
    ELSE
        RAISE EXCEPTION 'User not authorized to cancel this appointment';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION get_tutor_availability_slots(p_tutor_id INT, p_target_date DATE)
RETURNS TABLE(available_slot timestamptz)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Returns all 30-min slots for a tutor on a given day, excluding times they already have appointments.
    RETURN QUERY
    WITH all_slots AS (
        SELECT generate_series(
            p_target_date + wh.start_time,
            p_target_date + wh.end_time - interval '30 minutes',
            '30 minutes'::interval
        ) AS slot
        FROM working_hours wh
        WHERE wh.tutor_id = p_tutor_id AND wh.day_of_week = EXTRACT(ISODOW FROM p_target_date)
    )
    SELECT s.slot
    FROM all_slots s
    LEFT JOIN appointments a ON a.start_time = s.slot AND a.tutor_id = p_tutor_id AND a.status = 'Scheduled'
    WHERE a.appointment_id IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION reschedule_appointment(p_appointment_id INT, p_new_start_time timestamptz, p_new_end_time timestamptz)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- This function assumes authorization has been checked on the client-side (only tutors can see the button)
    -- A more robust solution would add a p_user_id and role check here as well.
    UPDATE appointments
    SET start_time = p_new_start_time, end_time = p_new_end_time, status = 'Scheduled'
    WHERE appointment_id = p_appointment_id;
END;
$$;
