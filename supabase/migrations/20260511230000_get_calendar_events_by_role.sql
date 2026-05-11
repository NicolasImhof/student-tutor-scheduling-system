
-- 1. DROP the old, simplistic event function
DROP FUNCTION IF EXISTS get_events_for_range(p_start_date DATE, p_end_date DATE);

-- 2. CREATE the new, role-aware function for fetching calendar events
CREATE OR REPLACE FUNCTION get_calendar_events(
    p_start_date DATE,
    p_end_date DATE,
    p_user_role TEXT,
    p_user_category TEXT
)
RETURNS TABLE (name TEXT, start_date DATE, end_date DATE, event_type TEXT, is_recurring BOOLEAN)
AS $$
BEGIN
    RETURN QUERY
    SELECT s.name::TEXT, s.start_date::DATE, s.end_date::DATE, s.event_type::TEXT, s.is_recurring
    FROM public.system_events s
    WHERE
        -- Date range filter for all events
        (
            (NOT s.is_recurring AND s.start_date <= p_end_date AND s.end_date >= p_start_date)
            OR
            (s.is_recurring AND EXISTS (
                SELECT 1
                FROM generate_series(p_start_date, p_end_date, '1 day'::interval) AS d(day)
                WHERE EXTRACT(MONTH FROM d.day) = EXTRACT(MONTH FROM s.start_date)
                  AND EXTRACT(DAY FROM d.day) = EXTRACT(DAY FROM s.start_date)
            ))
        )
        AND
        -- Role and category-based visibility filter
        (
            s.category IS NULL -- Global events are visible to everyone
            OR p_user_role = 'Super Admin' -- Super Admins see everything
            OR s.category = p_user_category -- Users see events in their own category
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
