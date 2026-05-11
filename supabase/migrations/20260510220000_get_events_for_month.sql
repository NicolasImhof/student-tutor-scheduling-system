
CREATE OR REPLACE FUNCTION get_events_for_month(p_year INT, p_month INT)
RETURNS TABLE (event_name TEXT, start_date DATE, end_date DATE, event_type TEXT, is_recurring BOOLEAN)
AS $$
BEGIN
    RETURN QUERY
    -- Non-recurring events
    SELECT s.name, s.start_date, s.end_date, s.event_type, s.is_recurring
    FROM public.system_events s
    WHERE NOT s.is_recurring
      AND DATE_PART('year', s.start_date) = p_year
      AND DATE_PART('month', s.start_date) = p_month

    UNION ALL

    -- Recurring events
    SELECT s.name, 
           (s.start_date - (DATE_PART('year', s.start_date) * INTERVAL '1 year')) + (p_year * INTERVAL '1 year') AS start_date,
           (s.end_date - (DATE_PART('year', s.end_date) * INTERVAL '1 year')) + (p_year * INTERVAL '1 year') AS end_date,
           s.event_type, 
           s.is_recurring
    FROM public.system_events s
    WHERE s.is_recurring
      AND DATE_PART('month', s.start_date) = p_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
