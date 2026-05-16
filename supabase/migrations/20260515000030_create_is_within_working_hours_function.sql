CREATE OR REPLACE FUNCTION is_within_working_hours(p_tutor_id INT, p_start_time TIMESTAMPTZ)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_day_of_week INT;
    v_time_of_day TIME;
    is_valid BOOLEAN;
BEGIN
    v_day_of_week := EXTRACT(ISODOW FROM p_start_time);
    v_time_of_day := p_start_time::TIME;

    SELECT EXISTS (
        SELECT 1
        FROM working_hours wh
        WHERE wh.tutor_id = p_tutor_id
          AND wh.day_of_week = v_day_of_week
          AND v_time_of_day >= wh.start_time
          AND v_time_of_day < wh.end_time
    ) INTO is_valid;

    RETURN is_valid;
END;
$$;
