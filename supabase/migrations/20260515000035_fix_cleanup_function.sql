CREATE OR REPLACE FUNCTION cleanup_invalid_appointments()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    invalid_appointment RECORD;
BEGIN
    FOR invalid_appointment IN
        SELECT a.appointment_id, a.tutor_id, a.start_time
        FROM appointments a
        WHERE a.status = 'Scheduled'
    LOOP
        IF NOT is_within_working_hours(invalid_appointment.tutor_id, invalid_appointment.start_time) THEN
            UPDATE appointments
            SET status = 'Canceled'
            WHERE appointment_id = invalid_appointment.appointment_id;
        END IF;
    END LOOP;
END;
$$;