
-- 1. DROP CONFLICTING FUNCTION if it exists
DROP FUNCTION IF EXISTS public.book_appointment(integer, integer, timestamp with time zone, timestamp with time zone);

-- 2. CREATE a ROBUST book_appointment function to prevent conflicts
CREATE OR REPLACE FUNCTION public.book_appointment(
    p_student_id integer,
    p_tutor_id integer,
    p_start_time timestamp with time zone,
    p_end_time timestamp with time zone
)
RETURNS TABLE(success boolean, message text, appointment_id integer) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_day_of_week int;
    v_start_time_local time;
    is_available boolean;
    conflicting_appointment_id int;
    is_on_time_off boolean;
    is_system_event boolean;
BEGIN
    -- Use EXTRACT to get the day of the week as an integer (0=Sunday, 1=Monday, ...)
    v_day_of_week := EXTRACT(DOW FROM p_start_time);
    v_start_time_local := p_start_time::time;

    -- Check 1: Tutor's general working hours
    SELECT EXISTS (
        SELECT 1
        FROM public.working_hours wh
        WHERE wh.tutor_id = p_tutor_id
          AND wh.day_of_week = v_day_of_week
          AND wh.is_working = TRUE
          AND v_start_time_local >= wh.start_time
          AND p_end_time::time <= wh.end_time
    ) INTO is_available;

    IF NOT is_available THEN
        RETURN QUERY SELECT false, 'Tutor is not available at this time.', null::int;
        RETURN;
    END IF;

    -- Check 2: Existing appointments
    SELECT a.appointment_id INTO conflicting_appointment_id
    FROM public.appointments_enhanced a
    WHERE a.tutor_id = p_tutor_id
      AND a.status = 'Scheduled'
      AND (p_start_time, p_end_time) OVERLAPS (a.start_time, a.end_time);

    IF conflicting_appointment_id IS NOT NULL THEN
        RETURN QUERY SELECT false, 'An appointment already exists at this time.', null::int;
        RETURN;
    END IF;

    -- Check 3: Approved time-off requests
    SELECT EXISTS (
        SELECT 1 FROM public.time_off_requests tor
        WHERE tor.tutor_id = p_tutor_id
          AND tor.status = 'Approved'
          AND p_start_time::date >= tor.start_date
          AND p_start_time::date <= tor.end_date
    ) INTO is_on_time_off;

    IF is_on_time_off THEN
        RETURN QUERY SELECT false, 'Tutor is on approved time off.', null::int;
        RETURN;
    END IF;

    -- Check 4: System-wide events (holidays, closures)
    SELECT EXISTS (
        SELECT 1 FROM public.system_events se
        WHERE p_start_time::date >= se.start_date AND p_start_time::date <= se.end_date
    ) INTO is_system_event;

    IF is_system_event THEN
        RETURN QUERY SELECT false, 'The requested time falls on a system-wide holiday or closure.', null::int;
        RETURN;
    END IF;

    -- All checks passed, create the appointment
    INSERT INTO public.appointments_enhanced (student_id, tutor_id, start_time, end_time, status)
    VALUES (p_student_id, p_tutor_id, p_start_time, p_end_time, 'Scheduled')
    RETURNING public.appointments_enhanced.appointment_id INTO appointment_id;

    RETURN QUERY SELECT true, 'Appointment booked successfully', appointment_id;
END;
$$;

-- 3. DATA CLEANUP: Delete appointments outside of working hours
-- This is a one-time operation to fix existing bad data.
DELETE FROM public.appointments_enhanced a
WHERE NOT EXISTS (
    SELECT 1
    FROM public.working_hours wh
    WHERE wh.tutor_id = a.tutor_id
      AND wh.day_of_week = EXTRACT(DOW FROM a.start_time)
      AND wh.is_working = TRUE
      AND a.start_time::time >= wh.start_time
      AND a.end_time::time <= wh.end_time
);
