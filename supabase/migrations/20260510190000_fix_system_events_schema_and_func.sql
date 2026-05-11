
-- Add the missing event_type column
ALTER TABLE public.system_events
ADD COLUMN event_type TEXT;

-- Drop the old function
DROP FUNCTION IF EXISTS create_system_event_and_cancel_appointments(TEXT, DATE, TEXT);

-- Recreate the function to include the new column
CREATE OR REPLACE FUNCTION create_system_event_and_cancel_appointments(
    p_event_name TEXT,
    p_event_date DATE,
    p_event_type TEXT
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
    INSERT INTO public.system_events (name, start_date, end_date, event_type)
    VALUES (p_event_name, p_event_date, p_event_date, p_event_type);

    -- Find all appointments on that day
    SELECT ARRAY_AGG(appointment_id)
    INTO conflicting_appointment_ids
    FROM public.appointments_enhanced
    WHERE DATE(start_time) = p_event_date;

    -- If there are conflicting appointments, cancel them
    IF array_length(conflicting_appointment_ids, 1) > 0 THEN
        UPDATE public.appointments_enhanced
        SET status = 'Canceled'
        WHERE appointment_id = ANY(conflicting_appointment_ids);
    END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
