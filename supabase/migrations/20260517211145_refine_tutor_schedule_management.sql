-- Function to check for appointment conflicts before updating the tutor schedule
CREATE OR REPLACE FUNCTION public.check_tutor_schedule_conflicts(
    p_tutor_id integer,
    p_schedule jsonb -- Array of {day_of_week, start_time, end_time, is_working}
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_conflict_count integer := 0;
    v_item jsonb;
BEGIN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_schedule)
    LOOP
        IF (v_item->>'is_working')::boolean = false THEN
            -- Count all appointments on this day
            v_conflict_count := v_conflict_count + (
                SELECT COUNT(*)::int
                FROM public.appointments_enhanced
                WHERE tutor_id = p_tutor_id
                  AND EXTRACT(DOW FROM start_time) = (v_item->>'day_of_week')::int
                  AND start_time > NOW()
                  AND status = 'Scheduled'
            );
        ELSE
            -- Count appointments outside the new window
            v_conflict_count := v_conflict_count + (
                SELECT COUNT(*)::int
                FROM public.appointments_enhanced
                WHERE tutor_id = p_tutor_id
                  AND EXTRACT(DOW FROM start_time) = (v_item->>'day_of_week')::int
                  AND start_time > NOW()
                  AND status = 'Scheduled'
                  AND (start_time::time < (v_item->>'start_time')::time OR end_time::time > (v_item->>'end_time')::time)
            );
        END IF;
    END LOOP;

    RETURN v_conflict_count;
END;
$$;

-- Function to update the tutor's entire schedule in bulk and cancel conflicting appointments
CREATE OR REPLACE FUNCTION public.update_tutor_schedule_bulk(
    p_tutor_id integer,
    p_schedule jsonb -- Array of {day_of_week, start_time, end_time, is_working}
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item jsonb;
BEGIN
    -- 1. Authorization check
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_uuid = auth.uid() 
        AND role IN ('Admin', 'Super Admin')
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only administrators can update tutor schedules.';
    END IF;

    -- 2. Process each day in the schedule
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_schedule)
    LOOP
        -- Upsert working hours
        INSERT INTO public.working_hours (tutor_id, day_of_week, start_time, end_time, is_working)
        VALUES (
            p_tutor_id, 
            (v_item->>'day_of_week')::int, 
            (v_item->>'start_time')::time, 
            (v_item->>'end_time')::time, 
            (v_item->>'is_working')::boolean
        )
        ON CONFLICT (tutor_id, day_of_week) 
        DO UPDATE SET 
            start_time = EXCLUDED.start_time,
            end_time = EXCLUDED.end_time,
            is_working = EXCLUDED.is_working;

        -- Cancel conflicting appointments
        IF (v_item->>'is_working')::boolean = false THEN
            UPDATE public.appointments_enhanced
            SET status = 'Canceled',
                reason_notes = 'Automatically canceled due to tutor schedule change (no longer working on this day).'
            WHERE tutor_id = p_tutor_id
              AND EXTRACT(DOW FROM start_time) = (v_item->>'day_of_week')::int
              AND start_time > NOW()
              AND status = 'Scheduled';
        ELSE
            UPDATE public.appointments_enhanced
            SET status = 'Canceled',
                reason_notes = 'Automatically canceled due to tutor schedule change (outside new working hours).'
            WHERE tutor_id = p_tutor_id
              AND EXTRACT(DOW FROM start_time) = (v_item->>'day_of_week')::int
              AND start_time > NOW()
              AND status = 'Scheduled'
              AND (start_time::time < (v_item->>'start_time')::time OR end_time::time > (v_item->>'end_time')::time);
        END IF;
    END LOOP;
END;
$$;
