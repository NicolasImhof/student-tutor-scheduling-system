CREATE OR REPLACE FUNCTION cancel_appointment_by_id(p_appointment_id INT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE appointments_enhanced
    SET status = 'Canceled'
    WHERE appointment_id = p_appointment_id;
END;
$$;