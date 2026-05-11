-- 1. DROP OLD FUNCTION
DROP FUNCTION IF EXISTS get_events_for_month(INT, INT);

-- 2. CREATE NEW FUNCTION to get system events for a date range
CREATE OR REPLACE FUNCTION get_events_for_range(
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (name TEXT, start_date DATE, end_date DATE, event_type TEXT, is_recurring BOOLEAN)
AS $$
BEGIN
    RETURN QUERY
    SELECT s.name::TEXT, s.start_date::DATE, s.end_date::DATE, s.event_type::TEXT, s.is_recurring
    FROM public.system_events s
    WHERE
        -- Non-recurring events that overlap with the range
        (NOT s.is_recurring AND s.start_date <= p_end_date AND s.end_date >= p_start_date)
        OR
        -- Recurring events: check for month/day overlap without considering year
        (s.is_recurring AND EXISTS (
            SELECT 1
            FROM generate_series(p_start_date, p_end_date, '1 day'::interval) AS d(day)
            WHERE
                EXTRACT(MONTH FROM d.day) = EXTRACT(MONTH FROM s.start_date) AND
                EXTRACT(DAY FROM d.day) = EXTRACT(DAY FROM s.start_date)
        ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;