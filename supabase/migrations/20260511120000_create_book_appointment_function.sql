-- Function to book an appointment
CREATE OR REPLACE FUNCTION book_appointment(
    student_id_in UUID,
    tutor_id_in UUID,
    start_time_in TIMESTAMPTZ,
    duration_minutes_in INT
) RETURNS TABLE (success BOOLEAN, message TEXT, appointment_id_out INT) AS $$
DECLARE
    end_time_in TIMESTAMPTZ;
    tutor_is_available BOOLEAN;
    slot_is_booked BOOLEAN;
    new_appointment_id INT;
BEGIN
    -- Calculate end time
    end_time_in := start_time_in + (duration_minutes_in * INTERVAL '1 minute');

    -- Check if the tutor is available at the requested time
    SELECT EXISTS (
        SELECT 1
        FROM working_hours wh
        WHERE wh.tutor_id = tutor_id_in
        AND wh.day_of_week = EXTRACT(ISODOW FROM start_time_in)
        AND wh.is_working = TRUE
        AND start_time_in::TIME >= wh.start_time
        AND end_time_in::TIME <= wh.end_time
    ) INTO tutor_is_available;

    -- Check for conflicting appointments
    SELECT EXISTS (
        SELECT 1
        FROM appointments_enhanced ae
        WHERE ae.tutor_id = tutor_id_in
        AND ae.status = 'Scheduled'
        AND (start_time_in, end_time_in) OVERLAPS (ae.start_time, ae.end_time)
    ) INTO slot_is_booked;

    IF NOT tutor_is_available THEN
        RETURN QUERY SELECT FALSE, 'Tutor is not available at the selected time.', NULL::INT;
    ELSIF slot_is_booked THEN
        RETURN QUERY SELECT FALSE, 'The selected time slot is no longer available.', NULL::INT;
    ELSE
        -- Insert the new appointment
        INSERT INTO appointments_enhanced (student_id, tutor_id, start_time, end_time, duration_minutes, status)
        VALUES (student_id_in, tutor_id_in, start_time_in, end_time_in, duration_minutes_in, 'Scheduled')
        RETURNING appointment_id INTO new_appointment_id;

        RETURN QUERY SELECT TRUE, 'Appointment booked successfully.', new_appointment_id;
    END IF;
END;
$$ LANGUAGE plpgsql;
