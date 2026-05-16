CREATE OR REPLACE FUNCTION cancel_appointments_by_ids(p_appointment_ids INT[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id INT;
BEGIN
    FOREACH v_id IN ARRAY p_appointment_ids
    LOOP
        UPDATE appointments_enhanced
        SET status = 'Canceled'
        WHERE appointment_id = v_id;
    END LOOP;
END;
$$;