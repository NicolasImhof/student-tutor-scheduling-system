CREATE OR REPLACE FUNCTION create_event_and_cancel_appointments(
    p_name text,
    p_start_date date,
    p_end_date date,
    p_event_type event_type,
    p_is_recurring boolean
)
RETURNS void AS $$
DECLARE
    v_event_id int;
BEGIN
    -- Insert the new system event and get its ID
    INSERT INTO system_events (name, start_date, end_date, event_type, is_recurring)
    VALUES (p_name, p_start_date, p_end_date, p_event_type, p_is_recurring)
    RETURNING event_id INTO v_event_id;

    -- Cancel all appointments that fall within the date range of the new event
    UPDATE appointments
    SET status = 'Cancelled'
    WHERE
        status = 'Scheduled' AND
        start_time::date >= p_start_date AND
        start_time::date <= p_end_date;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;