CREATE OR REPLACE FUNCTION get_invalid_interval_appointment_ids()
RETURNS TABLE(appointment_id INT)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT ae.appointment_id
    FROM appointments_enhanced ae
    WHERE ae.duration_minutes < 30
       OR EXTRACT(MINUTE FROM ae.start_time)::integer % 30 <> 0;
END;
$$;