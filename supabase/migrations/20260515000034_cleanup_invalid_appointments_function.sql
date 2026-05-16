CREATE OR REPLACE FUNCTION cleanup_invalid_appointments()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    invalid_appointment RECORD;
BEGIN
    FOR invalid_appointment IN
        SELECT appointment_id, tutor_id, start_time
        FROM appointments_enhanced
        WHERE status = 'Scheduled'
    LOOP
        IF NOT is_within_working_hours(invalid_appointment.tutor_id, invalid_appointment.start_time) THEN
            UPDATE appointments_enhanced
            SET status = 'Canceled'
            WHERE appointment_id = invalid_appointment.appointment_id;
        END IF;
    END LOOP;
END;
$$;
