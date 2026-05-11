
-- 1. Create the function to get available 30-minute slots for a tutor on a specific date
CREATE OR REPLACE FUNCTION get_tutor_availability_slots(
    p_tutor_id INT,
    p_target_date DATE
)
RETURNS TABLE(available_slot timestamptz)
LANGUAGE plpgsql
AS $$
DECLARE
    wh RECORD;
    working_start_time TIME;
    working_end_time TIME;
BEGIN
    -- Get the working hours for the specific day of the week (0=Sun, 1=Mon, ..., 6=Sat)
    SELECT start_time, end_time INTO working_start_time, working_end_time
    FROM public.working_hours
    WHERE tutor_id = p_tutor_id
      AND day_of_week = EXTRACT(DOW FROM p_target_date)
      AND is_working = TRUE;

    -- If the tutor doesn't work on this day, return no slots
    IF NOT FOUND THEN
        RETURN;
    END IF;

    -- Generate all possible 30-minute slots within the working hours
    RETURN QUERY
    WITH potential_slots AS (
        SELECT generate_series(
            p_target_date::timestamp AT TIME ZONE 'UTC' + working_start_time::time,
            p_target_date::timestamp AT TIME ZONE 'UTC' + working_end_time::time - interval '30 minutes',
            '30 minutes'::interval
        ) AS slot_start
    )
    -- Filter out slots that conflict with existing appointments, time off, or system events
    SELECT ps.slot_start
    FROM potential_slots ps
    WHERE 
        -- Check for conflicting appointments
        NOT EXISTS (
            SELECT 1
            FROM public.appointments_enhanced a
            WHERE a.tutor_id = p_tutor_id
              AND a.status = 'Scheduled'
              AND (ps.slot_start, ps.slot_start + interval '30 minutes') OVERLAPS (a.start_time, a.end_time)
        )
        -- Check for conflicting time-off requests
        AND NOT EXISTS (
            SELECT 1 
            FROM public.time_off_requests tor
            WHERE tor.tutor_id = p_tutor_id
              AND tor.status = 'Approved'
              AND p_target_date BETWEEN tor.start_date AND tor.end_date
        )
        -- Check for conflicting system events
        AND NOT EXISTS (
            SELECT 1 
            FROM public.system_events se
            WHERE p_target_date BETWEEN se.start_date AND se.end_date
        );
END;
$$;
