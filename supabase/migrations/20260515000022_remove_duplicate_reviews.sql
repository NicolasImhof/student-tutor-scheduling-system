CREATE OR REPLACE FUNCTION remove_duplicate_reviews()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Identify and delete duplicate reviews, keeping only the most recent one for each appointment.
    DELETE FROM reviews r1
    USING reviews r2
    WHERE r1.appointment_id = r2.appointment_id AND r1.ctid < r2.ctid;
END;
$$;