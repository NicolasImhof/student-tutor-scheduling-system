CREATE OR REPLACE FUNCTION get_invalid_appointment_ids()
RETURNS TABLE(appointment_id INT)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT ae.appointment_id
    FROM appointments_enhanced ae
    WHERE ae.status = 'Scheduled'
      AND NOT is_within_working_hours(ae.tutor_id, ae.start_time);
END;
$$;