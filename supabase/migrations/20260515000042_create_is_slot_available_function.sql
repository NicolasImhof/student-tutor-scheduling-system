CREATE OR REPLACE FUNCTION is_slot_available(p_tutor_id INT, p_start_time TIMESTAMPTZ, p_end_time TIMESTAMPTZ)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(*)
    INTO v_count
    FROM appointments_enhanced
    WHERE tutor_id = p_tutor_id
      AND status = 'Scheduled'
      AND (start_time, end_time) OVERLAPS (p_start_time, p_end_time);

    RETURN v_count = 0;
END;
$$;