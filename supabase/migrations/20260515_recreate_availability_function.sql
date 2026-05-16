-- This migration recreates the get_tutor_availability_slots function to fix the 404 error.

CREATE OR REPLACE FUNCTION get_tutor_availability_slots(p_tutor_id INT, p_target_date DATE)
RETURNS TABLE(available_slot timestamptz)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Returns all 30-min slots for a tutor on a given day, excluding times they already have appointments.
    RAISE NOTICE 'Fetching availability for tutor % on %', p_tutor_id, p_target_date;

    RETURN QUERY
    WITH all_slots AS (
        SELECT generate_series(
            (p_target_date || ' ' || wh.start_time)::TIMESTAMPTZ AT TIME ZONE 'UTC',
            (p_target_date || ' ' || wh.end_time)::TIMESTAMPTZ AT TIME ZONE 'UTC' - interval '30 minutes',
            '30 minutes'::interval
        ) AS slot
        FROM working_hours wh
        WHERE wh.tutor_id = p_tutor_id AND wh.day_of_week = EXTRACT(ISODOW FROM p_target_date) AND wh.is_working = true
    )
    SELECT s.slot::TIMESTAMPTZ
    FROM all_slots s
    WHERE NOT EXISTS (
        SELECT 1
        FROM appointments_enhanced a
        WHERE a.tutor_id = p_tutor_id
        AND a.status = 'Scheduled'
        AND (a.start_time, a.end_time) OVERLAPS (s.slot, s.slot + '30 minutes'::interval)
    );
END;
$$;
