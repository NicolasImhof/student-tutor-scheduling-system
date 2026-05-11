
-- 1. CLEAN SLATE: Remove all existing system events to prevent data conflicts
TRUNCATE public.system_events RESTART IDENTITY;

-- 2. SEED TEST DATA: Insert a controlled set of events for reliable testing
INSERT INTO public.system_events (name, start_date, end_date, event_type, is_recurring, category)
VALUES
    ('University Holiday', '2026-05-25', '2026-05-25', 'Holiday', TRUE, NULL), -- Global Event
    ('Science Dept. Meeting', '2026-05-20', '2026-05-20', 'Meeting', FALSE, 'Science'), -- Department Event
    ('Humanities Workshop', '2026-05-22', '2026-05-22', 'Workshop', FALSE, 'Humanities'), -- Department Event
    ('Finals Week Prep', '2026-05-18', '2026-05-22', 'Academic', FALSE, NULL); -- Global Event

-- 3. RECREATE FUNCTION: Drop the old function and create a new, simplified, and more robust version
DROP FUNCTION IF EXISTS get_calendar_events(p_start_date DATE, p_end_date DATE, p_user_role TEXT, p_user_category TEXT);

CREATE OR REPLACE FUNCTION get_calendar_events(
    p_start_date DATE,
    p_end_date DATE,
    p_user_role TEXT,
    p_user_category TEXT
)
RETURNS TABLE (name TEXT, start_date DATE, end_date DATE, event_type TEXT, is_recurring BOOLEAN)
LANGUAGE plpgsql
AS $$
BEGIN
    -- This revised function uses a simpler, clearer WHERE clause to ensure correctness.
    RETURN QUERY
    SELECT s.name::TEXT, s.start_date::DATE, s.end_date::DATE, s.event_type::TEXT, s.is_recurring
    FROM public.system_events s
    WHERE
        -- Date range filter remains the same
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
        -- The visibility logic is now clearer:
        AND (
            -- An event is visible if...
            -- 1. It's a global event (category is NULL)
            s.category IS NULL 
            -- 2. The user is a Super Admin (sees everything)
            OR p_user_role = 'Super Admin' 
            -- 3. The event's category matches the user's category (and user has a category)
            OR (p_user_category IS NOT NULL AND s.category = p_user_category)
        );
END;
$$;
