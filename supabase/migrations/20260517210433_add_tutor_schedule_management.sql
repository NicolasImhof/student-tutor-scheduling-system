-- Function to update a tutor's working hours and cancel conflicting appointments
CREATE OR REPLACE FUNCTION public.update_tutor_working_hours(
    p_tutor_id integer,
    p_day_of_week integer,
    p_start_time time without time zone,
    p_end_time time without time zone,
    p_is_working boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 1. Authorization check: Only Admins or Super Admins can update a tutor's schedule
    -- (The frontend already checks this, but we enforce it here for security)
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_uuid = auth.uid() 
        AND role IN ('Admin', 'Super Admin')
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only administrators can update tutor schedules.';
    END IF;

    -- 2. Upsert the working hours for the specified tutor and day
    INSERT INTO public.working_hours (tutor_id, day_of_week, start_time, end_time, is_working)
    VALUES (p_tutor_id, p_day_of_week, p_start_time, p_end_time, p_is_working)
    ON CONFLICT (tutor_id, day_of_week) 
    DO UPDATE SET 
        start_time = EXCLUDED.start_time,
        end_time = EXCLUDED.end_time,
        is_working = EXCLUDED.is_working;

    -- 3. Automatically cancel future appointments that fall outside the new schedule
    -- If the tutor is no longer working that day, cancel all future appointments for that day
    IF p_is_working = false THEN
        UPDATE public.appointments_enhanced
        SET status = 'Canceled',
            reason_notes = 'Automatically canceled due to tutor schedule change (no longer working on this day).'
        WHERE tutor_id = p_tutor_id
          AND EXTRACT(DOW FROM start_time) = p_day_of_week
          AND start_time > NOW()
          AND status = 'Scheduled';
    ELSE
        -- If the tutor is still working but hours changed, cancel appointments outside the new window
        UPDATE public.appointments_enhanced
        SET status = 'Canceled',
            reason_notes = 'Automatically canceled due to tutor schedule change (outside new working hours).'
        WHERE tutor_id = p_tutor_id
          AND EXTRACT(DOW FROM start_time) = p_day_of_week
          AND start_time > NOW()
          AND status = 'Scheduled'
          AND (start_time::time < p_start_time OR end_time::time > p_end_time);
    END IF;
END;
$$;

-- Add a unique constraint to working_hours if it doesn't exist to support ON CONFLICT
-- First check if the constraint exists, then add it if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'working_hours_tutor_id_day_of_week_key'
    ) THEN
        ALTER TABLE public.working_hours 
        ADD CONSTRAINT working_hours_tutor_id_day_of_week_key UNIQUE (tutor_id, day_of_week);
    END IF;
END;
$$;
