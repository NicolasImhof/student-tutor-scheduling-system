DROP FUNCTION IF EXISTS reschedule_appointment(integer, timestamp with time zone, timestamp with time zone);
CREATE OR REPLACE FUNCTION reschedule_appointment(p_appointment_id integer, p_new_start_time timestamp with time zone, p_new_end_time timestamp with time zone)
RETURNS void AS $$
BEGIN
    UPDATE appointments_enhanced
    SET 
        start_time = p_new_start_time,
        end_time = p_new_end_time,
        status = 'Scheduled'
    WHERE appointment_id = p_appointment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;