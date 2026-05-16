-- Fix recursion in sync_appointment_details trigger by making it a BEFORE trigger
-- and setting values directly on the NEW record.

-- 1. Redefine the function
CREATE OR REPLACE FUNCTION sync_appointment_details()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Set the names directly on the NEW record before it's saved to the database.
    -- This avoids a recursive UPDATE call.
    NEW.student_full_name := (SELECT u.first_name || ' ' || u.last_name FROM users u WHERE u.user_id = NEW.student_id);
    NEW.tutor_full_name := (SELECT u.first_name || ' ' || u.last_name FROM users u WHERE u.user_id = NEW.tutor_id);
    NEW.course_name := (SELECT c.course_name FROM courses c WHERE c.course_id = NEW.course_id);

    RETURN NEW;
END;
$$;

-- 2. Change the trigger to BEFORE
DROP TRIGGER IF EXISTS on_appointment_change_update_enhanced ON appointments_enhanced;

CREATE TRIGGER on_appointment_change_update_enhanced
    BEFORE INSERT OR UPDATE ON appointments_enhanced
    FOR EACH ROW
    EXECUTE FUNCTION sync_appointment_details();
