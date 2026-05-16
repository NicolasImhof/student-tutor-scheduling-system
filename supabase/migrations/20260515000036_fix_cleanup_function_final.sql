CREATE OR REPLACE FUNCTION cleanup_invalid_appointments()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    invalid_appointment RECORD;
BEGIN
    FOR invalid_appointment IN
        SELECT ae.appointment_id, ae.tutor_id, ae.start_time
        FROM appointments_enhanced ae
        WHERE ae.status = 'Scheduled'
    LOOP
        IF NOT is_within_working_hours(invalid_appointment.tutor_id, invalid_appointment.start_time) THEN
            UPDATE appointments_enhanced
            SET status = 'Canceled'
            WHERE appointment_id = invalid_appointment.appointment_id;
        END IF;
    END LOOP;
END;
$$;