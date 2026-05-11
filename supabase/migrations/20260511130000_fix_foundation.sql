
-- Fix for Foundation: Roles and Calendar Appointments

-- 1. Create get_my_role function
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT role::TEXT FROM public.users WHERE auth_uuid = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix system_events table schema
-- Check if columns exist before adding/renaming
DO $$ 
BEGIN
    -- Rename event_name to name if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_events' AND column_name = 'event_name') THEN
        ALTER TABLE system_events RENAME COLUMN event_name TO name;
    END IF;

    -- Rename event_date to start_date if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_events' AND column_name = 'event_date') THEN
        ALTER TABLE system_events RENAME COLUMN event_date TO start_date;
    END IF;

    -- Add end_date if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_events' AND column_name = 'end_date') THEN
        ALTER TABLE system_events ADD COLUMN end_date DATE;
        UPDATE system_events SET end_date = start_date WHERE end_date IS NULL;
    END IF;

    -- Add is_recurring if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_events' AND column_name = 'is_recurring') THEN
        ALTER TABLE system_events ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 3. Create get_appointments_for_calendar RPC
CREATE OR REPLACE FUNCTION get_appointments_for_calendar(start_date TIMESTAMPTZ, end_date TIMESTAMPTZ)
RETURNS TABLE (
    appointment_id INT,
    tutor_first_name TEXT,
    student_first_name TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ae.appointment_id,
        tu.first_name::TEXT as tutor_first_name,
        su.first_name::TEXT as student_first_name,
        ae.start_time,
        ae.end_time,
        ae.status::TEXT
    FROM public.appointments_enhanced ae
    JOIN public.users tu ON ae.tutor_id = tu.user_id
    JOIN public.users su ON ae.student_id = su.user_id
    WHERE ae.start_time >= start_date AND ae.start_time <= end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Re-fix get_events_for_month to ensure it matches the final schema
CREATE OR REPLACE FUNCTION get_events_for_month(p_year INT, p_month INT)
RETURNS TABLE (name TEXT, start_date DATE, end_date DATE, event_type TEXT, is_recurring BOOLEAN)
AS $$
BEGIN
    RETURN QUERY
    -- Non-recurring events
    SELECT s.name::TEXT, s.start_date::DATE, s.end_date::DATE, s.event_type::TEXT, s.is_recurring
    FROM public.system_events s
    WHERE NOT s.is_recurring
      AND DATE_PART('year', s.start_date) = p_year
      AND DATE_PART('month', s.start_date) = p_month

    UNION ALL

    -- Recurring events
    SELECT s.name::TEXT, 
           ((s.start_date - (DATE_PART('year', s.start_date) * INTERVAL '1 year')) + (p_year * INTERVAL '1 year'))::DATE AS start_date,
           ((s.end_date - (DATE_PART('year', s.end_date) * INTERVAL '1 year')) + (p_year * INTERVAL '1 year'))::DATE AS end_date,
           s.event_type::TEXT, 
           s.is_recurring
    FROM public.system_events s
    WHERE s.is_recurring
      AND DATE_PART('month', s.start_date) = p_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
