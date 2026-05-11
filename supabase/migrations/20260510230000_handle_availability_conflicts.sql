
-- Function to handle tutor availability conflicts
CREATE OR REPLACE FUNCTION handle_event_availability_conflict(
    p_start_date DATE,
    p_end_date DATE
)
RETURNS VOID AS $$
BEGIN
    -- For now, we'll just delete any availability that falls within the event dates
    DELETE FROM public.tutor_availability
    WHERE date >= p_start_date AND date <= p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the main function to call the new availability conflict function
CREATE OR REPLACE FUNCTION create_system_event_and_cancel_appointments(
    p_event_name TEXT,
    p_start_date DATE,
    p_end_date DATE,
    p_event_type TEXT,
    p_is_recurring BOOLEAN
)
RETURNS VOID AS $$
DECLARE
    conflicting_appointment_ids INT[];
BEGIN
    -- Ensure the user is a Super Admin
    IF get_my_role() <> 'Super Admin' THEN
        RAISE EXCEPTION 'Permission denied: Must be a Super Admin.';
    END IF;

    -- Insert the new system event
    INSERT INTO public.system_events (name, start_date, end_date, event_type, is_recurring)
    VALUES (p_event_name, p_start_date, p_end_date, p_event_type, p_is_recurring);

    -- Find all appointments within the date range
    SELECT ARRAY_AGG(appointment_id)
    INTO conflicting_appointment_ids
    FROM public.appointments_enhanced
    WHERE DATE(start_time) BETWEEN p_start_date AND p_end_date;

    -- If there are conflicting appointments, cancel them
    IF array_length(conflicting_appointment_ids, 1) > 0 THEN
        UPDATE public.appointments_enhanced
        SET status = 'Canceled'
        WHERE appointment_id = ANY(conflicting_appointment_ids);
    END IF;

    -- Handle conflicting time-off requests
    PERFORM handle_event_time_off_conflict(p_start_date, p_end_date);

    -- Handle conflicting tutor availability
    PERFORM handle_event_availability_conflict(p_start_date, p_end_date);

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
